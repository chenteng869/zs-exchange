import prisma from '@/lib/prisma';
import {
  assertValidManagedDepositAddress,
  getManagedDepositAddressCandidates,
  getDepositChainAliases,
  isDevDeterministicAddressModeEnabled,
} from './deposit-address-provider';
import { RpcClient, type NodeHealth } from './rpc-client';
import { TronRpcClient } from './tron-rpc-client';
import { detectPlaceholder, isSameAsApiKey } from '@/lib/security/env-placeholder-guard';
import { getAlchemyRpcEnvNames, getEvmRpcEndpointsForChain } from '@/lib/alchemy/rpc-config';

export type DepositReadinessStatus = 'ready' | 'blocked' | 'warning';
export type DepositReadinessCheckStatus = 'pass' | 'warn' | 'fail';

export interface DepositReadinessCheck {
  key: string;
  label: string;
  status: DepositReadinessCheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface DepositReadinessOptions {
  currency?: string;
  chain?: string;
  probeRpc?: boolean;
  requireMoonPay?: boolean;
}

export interface DepositReadinessReport {
  status: DepositReadinessStatus;
  currency: string;
  chain: string;
  generatedAt: string;
  checks: DepositReadinessCheck[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

interface EnvState {
  name: string;
  configured: boolean;
  placeholder: boolean;
  length: number;
  /** 包含非 ASCII 字符（中文/Unicode 占位符检测） */
  hasNonAscii?: boolean;
  /** 命中的占位词（matched against placeholder list） */
  matchedTokens?: string[];
  /** 原因描述 */
  reason?: string;
}

const EVM_CHAINS = new Set([
  'ETH',
  'ETHEREUM',
  'ERC20',
  'BSC',
  'BNB',
  'BEP20',
  'POLYGON',
  'MATIC',
  'ARBITRUM',
  'OPTIMISM',
  'BASE',
]);

function normalize(value: string | undefined, fallback: string): string {
  return String(value || fallback).trim().toUpperCase();
}

function splitEnvList(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPlaceholder(value: string): boolean {
  return detectPlaceholder(value).isPlaceholder;
}

function envState(name: string): EnvState {
  const raw = process.env[name] || '';
  const trimmed = raw.trim();
  const check = detectPlaceholder(trimmed);
  const reason = !trimmed
    ? 'empty'
    : check.matches.chineseToken
      ? 'chinese-placeholder'
      : check.matches.englishToken
        ? 'english-placeholder'
        : check.matches.tooShort
          ? 'too-short'
          : check.matches.isUrl
            ? 'url-format'
            : check.matches.hasNonAscii
              ? 'non-ascii'
              : undefined;
  return {
    name,
    configured: trimmed.length > 0 && !check.isPlaceholder,
    placeholder: check.isPlaceholder,
    length: trimmed.length,
    hasNonAscii: check.hasNonAscii,
    matchedTokens: check.matchedTokens,
    reason,
  };
}

function envDetails(names: string[]): Record<string, EnvState> {
  return Object.fromEntries(names.map((name) => [name, envState(name)]));
}

function push(
  checks: DepositReadinessCheck[],
  key: string,
  label: string,
  status: DepositReadinessCheckStatus,
  message: string,
  details?: Record<string, unknown>,
) {
  checks.push({ key, label, status, message, details });
}

function safeEndpointLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'invalid-url';
  }
}

function summarizeHealth(health: NodeHealth[]) {
  return health.map((item) => ({
    endpoint: safeEndpointLabel(item.url),
    healthy: item.healthy,
    latencyMs: item.latencyMs,
    blockNumber: item.blockNumber,
    consecutiveFailures: item.consecutiveFailures,
  }));
}

function evmRpcEndpoints(chain?: string): string[] {
  return getEvmRpcEndpointsForChain(chain || process.env.WALLET_DEPOSIT_READINESS_CHAIN || 'ethereum')
    .concat(splitEnvList(process.env.NEXT_PUBLIC_RPC_URL));
}

function tronRpcEndpoints(): string[] {
  return splitEnvList(process.env.WALLET_TRON_RPC_ENDPOINTS);
}

function isEvmChain(chain: string): boolean {
  return getDepositChainAliases(chain).some((alias) => EVM_CHAINS.has(alias));
}

function isTronChain(chain: string): boolean {
  return getDepositChainAliases(chain).some((alias) => alias === 'TRON' || alias === 'TRC20' || alias === 'TRX');
}

async function checkDatabase(checks: DepositReadinessCheck[]) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    push(checks, 'database', 'PostgreSQL', 'pass', 'Database connection is available.');
  } catch (error) {
    push(checks, 'database', 'PostgreSQL', 'fail', 'Database connection failed.', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function checkCurrency(checks: DepositReadinessCheck[], currency: string) {
  const record = await prisma.walletCurrency.findUnique({ where: { symbol: currency } }).catch((error) => {
    push(checks, 'currency-query', 'Wallet currency query', 'fail', 'Failed to query wallet currency.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  });

  if (!record) {
    push(checks, 'currency', 'Deposit currency', 'fail', `${currency} is not configured in walletCurrency.`);
    return null;
  }

  const ok = record.isActive && record.depositEnabled;
  push(
    checks,
    'currency',
    'Deposit currency',
    ok ? 'pass' : 'fail',
    ok ? `${currency} deposits are enabled.` : `${currency} exists but deposits are disabled.`,
    {
      symbol: record.symbol,
      blockchain: record.blockchain,
      isActive: record.isActive,
      depositEnabled: record.depositEnabled,
      minDepositAmount: record.minDepositAmount.toString(),
      confirmationCount: record.confirmationCount,
    },
  );
  return record;
}

async function checkAddressPool(checks: DepositReadinessCheck[], currency: string, chain: string) {
  let candidates: string[] = [];
  try {
    candidates = getManagedDepositAddressCandidates(currency, chain);
  } catch (error) {
    push(checks, 'address-pool-json', 'Controlled address pool', 'fail', 'Controlled address pool JSON is invalid.', {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  if (isDevDeterministicAddressModeEnabled()) {
    push(
      checks,
      'address-mode',
      'Address generation mode',
      'fail',
      'WALLET_DEPOSIT_ADDRESS_MODE=deterministic-dev is enabled; this is not acceptable for real deposits.',
    );
  } else {
    push(checks, 'address-mode', 'Address generation mode', 'pass', 'Deterministic dev addresses are disabled.');
  }

  if (candidates.length === 0) {
    push(
      checks,
      'address-pool',
      'Controlled address pool',
      'fail',
      `No controlled deposit addresses are configured for ${chain}:${currency}.`,
      {
        acceptedChainKeys: getDepositChainAliases(chain),
        env: envDetails([
          'WALLET_DEPOSIT_ADDRESS_POOL_JSON',
          'WALLET_CONTROLLED_DEPOSIT_ADDRESSES',
          'WALLET_DEPOSIT_ADDRESSES',
        ]),
      },
    );
    return;
  }

  const valid: string[] = [];
  const invalid: Array<{ index: number; error: string }> = [];
  candidates.forEach((candidate, index) => {
    try {
      assertValidManagedDepositAddress(candidate, chain);
      valid.push(candidate);
    } catch (error) {
      invalid.push({
        index,
        error: error instanceof Error ? error.message.replace(candidate, '<redacted-address>') : 'invalid address',
      });
    }
  });

  const assigned = valid.length > 0
    ? await prisma.walletAddress.findMany({
        where: { address: { in: valid } },
        select: { address: true, userId: true, currencyId: true, status: true },
      })
    : [];

  const assignedSet = new Set(assigned.map((item) => item.address));
  const availableCount = valid.filter((candidate) => !assignedSet.has(candidate)).length;
  const status: DepositReadinessCheckStatus =
    valid.length === 0 || invalid.length > 0 || availableCount === 0 ? 'fail' : 'pass';

  push(
    checks,
    'address-pool',
    'Controlled address pool',
    status,
    status === 'pass'
      ? `Controlled address pool has ${availableCount} unassigned address(es).`
      : 'Controlled address pool is not usable for a new deposit address.',
    {
      candidates: candidates.length,
      valid: valid.length,
      invalid: invalid.length,
      assigned: assigned.length,
      available: availableCount,
      invalidEntries: invalid,
    },
  );
}

async function checkRpc(checks: DepositReadinessCheck[], chain: string, probeRpc: boolean) {
  if (isEvmChain(chain)) {
    const endpoints = evmRpcEndpoints(chain);
    if (endpoints.length === 0) {
      push(checks, 'evm-rpc', 'EVM RPC endpoint', 'fail', 'No EVM RPC endpoint is configured.', {
        env: envDetails(['WALLET_EVM_RPC_ENDPOINTS', 'ALCHEMY_EVM_RPC_URL', 'NEXT_PUBLIC_RPC_URL', ...getAlchemyRpcEnvNames()]),
      });
      return;
    }

    if (!probeRpc) {
      push(checks, 'evm-rpc', 'EVM RPC endpoint', 'pass', 'EVM RPC endpoint is configured.', {
        endpoints: endpoints.map(safeEndpointLabel),
        probed: false,
      });
      return;
    }

    const client = new RpcClient({
      endpoints,
      chainName: process.env.WALLET_EVM_RPC_CHAIN_NAME || chain,
      timeoutMs: Number(process.env.WALLET_RPC_TIMEOUT_MS || 10_000),
      maxRetries: 1,
      healthCheckMs: 0,
    });
    await client.checkHealth();
    const health = client.getHealth();
    const healthy = health.filter((item) => item.healthy);
    push(
      checks,
      'evm-rpc',
      'EVM RPC endpoint',
      healthy.length > 0 ? 'pass' : 'fail',
      healthy.length > 0 ? 'At least one EVM RPC endpoint is reachable.' : 'No EVM RPC endpoint is reachable.',
      { endpoints: summarizeHealth(health) },
    );
    return;
  }

  if (isTronChain(chain)) {
    const endpoints = tronRpcEndpoints();
    if (endpoints.length === 0) {
      push(checks, 'tron-rpc', 'TRON RPC endpoint', 'fail', 'No TRON RPC endpoint is configured.', {
        env: envDetails(['WALLET_TRON_RPC_ENDPOINTS', 'TRONGRID_API_KEY']),
      });
      return;
    }

    if (!probeRpc) {
      push(checks, 'tron-rpc', 'TRON RPC endpoint', 'pass', 'TRON RPC endpoint is configured.', {
        endpoints: endpoints.map(safeEndpointLabel),
        probed: false,
      });
      return;
    }

    const client = new TronRpcClient({
      endpoints,
      apiKey: process.env.TRONGRID_API_KEY,
      timeoutMs: Number(process.env.WALLET_RPC_TIMEOUT_MS || 10_000),
      maxRetries: 1,
      healthCheckMs: 0,
    });
    await client.checkHealth();
    const health = client.getHealth();
    const healthy = health.filter((item) => item.healthy);
    push(
      checks,
      'tron-rpc',
      'TRON RPC endpoint',
      healthy.length > 0 ? 'pass' : 'fail',
      healthy.length > 0 ? 'At least one TRON RPC endpoint is reachable.' : 'No TRON RPC endpoint is reachable.',
      { endpoints: summarizeHealth(health) },
    );
    return;
  }

  push(checks, 'rpc', 'Chain RPC endpoint', 'warn', `No RPC probe is implemented for chain ${chain}.`, {
    chain,
  });
}

function checkWebhookSecrets(checks: DepositReadinessCheck[], requireMoonPay: boolean) {
  const alchemy = envState('ALCHEMY_WEBHOOK_SIGNING_KEY');
  const alchemyApiKey = envState('ALCHEMY_API_KEY');
  const alchemyMatchesApiKey = isSameAsApiKey(alchemy.length ? process.env.ALCHEMY_WEBHOOK_SIGNING_KEY || '' : '', process.env.ALCHEMY_API_KEY);
  const alchemyReady = alchemy.configured && alchemy.length >= 20 && !alchemyMatchesApiKey;
  push(
    checks,
    'alchemy-webhook-secret',
    'Alchemy webhook signing key',
    alchemyReady ? 'pass' : 'fail',
    alchemyReady
      ? 'Alchemy webhook signing key is configured.'
      : alchemyMatchesApiKey
        ? 'ALCHEMY_WEBHOOK_SIGNING_KEY must be the webhook signing key, not ALCHEMY_API_KEY.'
        : alchemy.placeholder
          ? `ALCHEMY_WEBHOOK_SIGNING_KEY is a placeholder (${alchemy.reason || 'unknown'}; matched=${alchemy.matchedTokens.join(',') || 'none'}; hasNonAscii=${alchemy.hasNonAscii}; length=${alchemy.length}).`
          : 'ALCHEMY_WEBHOOK_SIGNING_KEY is missing or invalid.',
    { env: alchemy, apiKey: alchemyApiKey, matchesApiKey: alchemyMatchesApiKey },
  );

  const moonpay = envState('MOONPAY_WEBHOOK_SECRET');
  const moonpayApiKey = envState('MOONPAY_API_KEY');
  const moonpayMatchesApiKey = isSameAsApiKey(moonpay.length ? process.env.MOONPAY_WEBHOOK_SECRET || '' : '', process.env.MOONPAY_API_KEY);
  const moonpayReady = moonpay.configured && moonpay.length >= 20 && !moonpayMatchesApiKey;
  const moonpayStatus = moonpayReady ? 'pass' : requireMoonPay ? 'fail' : 'warn';
  push(
    checks,
    'moonpay-webhook-secret',
    'MoonPay webhook secret',
    moonpayStatus,
    moonpayReady
      ? 'MoonPay webhook secret is configured.'
      : moonpayMatchesApiKey
        ? 'MOONPAY_WEBHOOK_SECRET must be the webhook secret, not MOONPAY_API_KEY.'
        : moonpay.placeholder
          ? `MOONPAY_WEBHOOK_SECRET is a placeholder (${moonpay.reason || 'unknown'}; matched=${moonpay.matchedTokens.join(',') || 'none'}; hasNonAscii=${moonpay.hasNonAscii}; length=${moonpay.length}).`
          : 'MOONPAY_WEBHOOK_SECRET is missing or invalid.',
    { env: moonpay, apiKey: moonpayApiKey, matchesApiKey: moonpayMatchesApiKey },
  );
}

function checkProviderDashboard(checks: DepositReadinessCheck[]) {
  push(
    checks,
    'provider-dashboard',
    'Provider dashboard callback',
    'warn',
    'Code can verify secrets and signatures, but cannot confirm that Alchemy/MoonPay dashboards point to this deployed URL.',
  );
}

export async function buildDepositReadinessReport(
  options: DepositReadinessOptions = {},
): Promise<DepositReadinessReport> {
  const currency = normalize(options.currency, process.env.WALLET_DEPOSIT_READINESS_CURRENCY || 'USDT');
  const chain = normalize(options.chain, process.env.WALLET_DEPOSIT_READINESS_CHAIN || 'ethereum');
  const probeRpc = options.probeRpc ?? process.env.WALLET_DEPOSIT_READINESS_PROBE_RPC !== 'false';
  const requireMoonPay = options.requireMoonPay ?? process.env.WALLET_DEPOSIT_REQUIRE_MOONPAY !== 'false';
  const checks: DepositReadinessCheck[] = [];

  await checkDatabase(checks);
  await checkCurrency(checks, currency);
  await checkAddressPool(checks, currency, chain);
  await checkRpc(checks, chain, probeRpc);
  checkWebhookSecrets(checks, requireMoonPay);
  checkProviderDashboard(checks);

  const failed = checks.filter((check) => check.status === 'fail').length;
  const warnings = checks.filter((check) => check.status === 'warn').length;
  const passed = checks.filter((check) => check.status === 'pass').length;

  return {
    status: failed > 0 ? 'blocked' : warnings > 0 ? 'warning' : 'ready',
    currency,
    chain,
    generatedAt: new Date().toISOString(),
    checks,
    summary: {
      passed,
      warnings,
      failed,
    },
  };
}
