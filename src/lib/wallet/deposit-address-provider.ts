import { Prisma, PrismaClient, WalletAddress, WalletCurrency } from '@prisma/client';

export class DepositAddressProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DepositAddressProviderError';
  }
}

type AddressPoolEntry = string | { address: string };

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

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

function normalizeKeyPart(value: string): string {
  return String(value || '').trim().toUpperCase();
}

function envKeyPart(value: string): string {
  return normalizeKeyPart(value).replace(/[^A-Z0-9]/g, '_');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function getDepositChainAliases(chain: string): string[] {
  const normalized = normalizeKeyPart(chain);

  if (normalized === 'ETH' || normalized === 'ETHEREUM' || normalized === 'ERC20') {
    return ['ETHEREUM', 'ETH', 'ERC20'];
  }

  if (normalized === 'BSC' || normalized === 'BNB' || normalized === 'BEP20') {
    return ['BSC', 'BNB', 'BEP20'];
  }

  if (normalized === 'TRON' || normalized === 'TRC20' || normalized === 'TRX') {
    return ['TRON', 'TRC20', 'TRX'];
  }

  if (normalized === 'SOL' || normalized === 'SOLANA') {
    return ['SOLANA', 'SOL'];
  }

  return [normalized];
}

function parseEntryList(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    return unique(value.split(','));
  }

  if (!Array.isArray(value)) return [];

  return unique(
    value
      .map((entry: AddressPoolEntry) => (typeof entry === 'string' ? entry : entry?.address))
      .filter((address): address is string => typeof address === 'string'),
  );
}

function parseJsonPool(): Record<string, unknown> {
  const raw = process.env.WALLET_DEPOSIT_ADDRESS_POOL_JSON
    || process.env.WALLET_CONTROLLED_DEPOSIT_ADDRESSES
    || '';

  if (!raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    throw new DepositAddressProviderError(
      'ADDRESS_POOL_INVALID_JSON',
      'WALLET_DEPOSIT_ADDRESS_POOL_JSON must be valid JSON',
    );
  }
}

export function getManagedDepositAddressCandidates(currency: string, chain: string): string[] {
  const normalizedCurrency = normalizeKeyPart(currency);
  const chainAliases = getDepositChainAliases(chain);
  const jsonPool = parseJsonPool();
  const keys = [
    ...chainAliases.map((normalizedChain) => `${normalizedChain}:${normalizedCurrency}`),
    ...chainAliases.map((normalizedChain) => `${normalizedChain}:*`),
    `*:${normalizedCurrency}`,
    '*:*',
  ];

  const fromJson = keys.flatMap((key) => parseEntryList(jsonPool[key]));
  const directEnvKeys = chainAliases.map(
    (normalizedChain) => `WALLET_DEPOSIT_ADDRESSES_${envKeyPart(normalizedChain)}_${envKeyPart(normalizedCurrency)}`,
  );
  const chainEnvKeys = chainAliases.map(
    (normalizedChain) => `WALLET_DEPOSIT_ADDRESSES_${envKeyPart(normalizedChain)}`,
  );
  const globalEnvKey = 'WALLET_DEPOSIT_ADDRESSES';

  return unique([
    ...fromJson,
    ...directEnvKeys.flatMap((envKey) => parseEntryList(process.env[envKey])),
    ...chainEnvKeys.flatMap((envKey) => parseEntryList(process.env[envKey])),
    ...parseEntryList(process.env[globalEnvKey]),
  ]);
}

export function assertValidManagedDepositAddress(address: string, chain: string): void {
  const normalizedChain = normalizeKeyPart(chain);

  if (EVM_CHAINS.has(normalizedChain)) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
      throw new DepositAddressProviderError('INVALID_CONTROLLED_ADDRESS', `Invalid EVM deposit address: ${address}`);
    }
    return;
  }

  if (normalizedChain === 'TRON' || normalizedChain === 'TRC20') {
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
      throw new DepositAddressProviderError('INVALID_CONTROLLED_ADDRESS', `Invalid TRON deposit address: ${address}`);
    }
    return;
  }

  if (normalizedChain === 'SOL' || normalizedChain === 'SOLANA') {
    if (address.length < 32 || address.length > 44 || !BASE58_RE.test(address)) {
      throw new DepositAddressProviderError('INVALID_CONTROLLED_ADDRESS', `Invalid Solana deposit address: ${address}`);
    }
    return;
  }

  if (address.length < 8) {
    throw new DepositAddressProviderError('INVALID_CONTROLLED_ADDRESS', `Invalid deposit address: ${address}`);
  }
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

export function isDevDeterministicAddressModeEnabled(): boolean {
  return process.env.NODE_ENV !== 'production'
    && process.env.WALLET_DEPOSIT_ADDRESS_MODE === 'deterministic-dev';
}

export async function allocateManagedDepositAddress(params: {
  prisma: PrismaClient;
  userId: string;
  currency: WalletCurrency;
  chain: string;
}): Promise<{ address: WalletAddress; reused: boolean; source: 'managed_pool' }> {
  const candidates = getManagedDepositAddressCandidates(params.currency.symbol, params.chain);

  if (candidates.length === 0) {
    throw new DepositAddressProviderError(
      'CONTROLLED_ADDRESS_SOURCE_REQUIRED',
      'No controlled deposit address pool is configured for this currency and chain',
    );
  }

  for (const candidate of candidates) {
    assertValidManagedDepositAddress(candidate, params.chain);

    const existing = await params.prisma.walletAddress.findUnique({ where: { address: candidate } });
    if (existing) {
      if (
        existing.userId === params.userId
        && existing.currencyId === params.currency.id
        && existing.tag === params.chain
        && existing.status === 'active'
      ) {
        return { address: existing, reused: true, source: 'managed_pool' };
      }
      continue;
    }

    try {
      const address = await params.prisma.walletAddress.create({
        data: {
          userId: params.userId,
          currency: { connect: { id: params.currency.id } },
          address: candidate,
          tag: params.chain,
          status: 'active',
        },
      });

      return { address, reused: false, source: 'managed_pool' };
    } catch (error) {
      if (isUniqueError(error)) continue;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
      throw error;
    }
  }

  throw new DepositAddressProviderError(
    'CONTROLLED_ADDRESS_POOL_EXHAUSTED',
    'All configured controlled deposit addresses are already assigned',
  );
}
