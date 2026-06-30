export function shortenAddress(address?: string, prefix = 6, suffix = 6) {
  if (!address) return '-';
  if (address.length <= prefix + suffix) return address;
  return `${address.slice(0, prefix)}...${address.slice(-suffix)}`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function isValidEvmAddress(address?: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTronAddress(address?: string): boolean {
  if (!address) return false;
  return /^T[a-fA-F0-9]{33}$/.test(address);
}

export function isValidSolanaAddress(address?: string): boolean {
  if (!address) return false;
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function isValidAddress(address?: string, chainType?: string): boolean {
  if (!address) return false;
  switch (chainType) {
    case 'evm':
      return isValidEvmAddress(address);
    case 'tron':
      return isValidTronAddress(address);
    case 'solana':
      return isValidSolanaAddress(address);
    default:
      return isValidEvmAddress(address) || isValidTronAddress(address) || isValidSolanaAddress(address);
  }
}