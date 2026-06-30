export function formatAmount(amount?: string, symbol?: string) {
  if (!amount) return '-';
  return `${amount} ${symbol ?? ''}`.trim();
}

export function formatTime(value?: string) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('zh-CN');
  } catch {
    return value;
  }
}

export function formatAddress(address?: string) {
  if (!address) return '-';
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

export function formatTxHash(txHash?: string) {
  if (!txHash) return '-';
  if (txHash.length <= 20) return txHash;
  return `${txHash.slice(0, 10)}...${txHash.slice(-10)}`;
}