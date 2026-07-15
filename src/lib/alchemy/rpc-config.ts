import { detectPlaceholder } from '@/lib/security/env-placeholder-guard';

export type AlchemyRpcChain =
  | 'eth'
  | 'bsc'
  | 'polygon'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'solana'
  | 'sepolia';

const ALCHEMY_RPC_ENV: Record<AlchemyRpcChain, string> = {
  eth: 'ALCHEMY_ETH_RPC_URL',
  bsc: 'ALCHEMY_BSC_RPC_URL',
  polygon: 'ALCHEMY_POLYGON_RPC_URL',
  arbitrum: 'ALCHEMY_ARBITRUM_RPC_URL',
  optimism: 'ALCHEMY_OPTIMISM_RPC_URL',
  base: 'ALCHEMY_BASE_RPC_URL',
  solana: 'ALCHEMY_SOLANA_RPC_URL',
  sepolia: 'ALCHEMY_SEPOLIA_RPC_URL',
};

const ALCHEMY_RPC_HOST: Record<AlchemyRpcChain, string> = {
  eth: 'eth-mainnet.g.alchemy.com',
  bsc: 'bnb-mainnet.g.alchemy.com',
  polygon: 'polygon-mainnet.g.alchemy.com',
  arbitrum: 'arb-mainnet.g.alchemy.com',
  optimism: 'opt-mainnet.g.alchemy.com',
  base: 'base-mainnet.g.alchemy.com',
  solana: 'solana-mainnet.g.alchemy.com',
  sepolia: 'eth-sepolia.g.alchemy.com',
};

function splitEnvList(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasPlaceholder(value?: string): boolean {
  const raw = String(value || '').trim();
  if (!raw) return true;
  const check = detectPlaceholder(raw);
  return check.matches.englishToken
    || check.matches.chineseToken
    || check.matches.hasNonAscii
    || /<[^>]*>/i.test(raw);
}

function normalizeChain(chain?: string | null): string {
  return String(chain || '').trim().toUpperCase();
}

export function alchemyChainFromDepositChain(chain?: string | null): AlchemyRpcChain | null {
  const normalized = normalizeChain(chain);

  if (['ETH', 'ETHEREUM', 'ERC20', 'MAINNET'].includes(normalized)) return 'eth';
  if (['BSC', 'BNB', 'BEP20'].includes(normalized)) return 'bsc';
  if (['POLYGON', 'MATIC'].includes(normalized)) return 'polygon';
  if (['ARBITRUM', 'ARB'].includes(normalized)) return 'arbitrum';
  if (['OPTIMISM', 'OP'].includes(normalized)) return 'optimism';
  if (['BASE'].includes(normalized)) return 'base';
  if (['SOL', 'SOLANA'].includes(normalized)) return 'solana';
  if (['SEPOLIA', 'ETH_SEPOLIA', 'ETH-SEPOLIA'].includes(normalized)) return 'sepolia';

  return null;
}

export function alchemyRpcUrlFromKey(chain: AlchemyRpcChain, apiKey: string): string {
  return `https://${ALCHEMY_RPC_HOST[chain]}/v2/${apiKey}`;
}

export function getAlchemyRpcUrl(chain: AlchemyRpcChain): string | null {
  const direct = process.env[ALCHEMY_RPC_ENV[chain]];
  if (direct && !hasPlaceholder(direct)) return direct.trim();

  const key = process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
  if (!hasPlaceholder(key)) return alchemyRpcUrlFromKey(chain, key.trim());

  return null;
}

export function getEvmRpcEndpointsForChain(chain?: string | null): string[] {
  const configured = splitEnvList(process.env.WALLET_EVM_RPC_ENDPOINTS || process.env.ALCHEMY_EVM_RPC_URL);
  const validConfigured = configured.filter((url) => !hasPlaceholder(url));
  if (validConfigured.length > 0) return validConfigured;

  const alchemyChain = alchemyChainFromDepositChain(chain);
  if (!alchemyChain || alchemyChain === 'solana') return [];

  const alchemyUrl = getAlchemyRpcUrl(alchemyChain);
  return alchemyUrl ? [alchemyUrl] : [];
}

export function getAlchemyRpcEnvNames(): string[] {
  return ['ALCHEMY_API_KEY', ...Object.values(ALCHEMY_RPC_ENV)];
}
