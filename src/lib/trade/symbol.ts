const COMMON_QUOTE_CURRENCIES = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];

export function normalizeTradeSymbol(rawSymbol: string): string {
  const decoded = decodeURIComponent(String(rawSymbol || '')).trim().toUpperCase();
  const separated = decoded.replace(/[-_]/g, '/');

  if (separated.includes('/')) {
    const [base, quote] = separated.split('/').map((part) => part.trim()).filter(Boolean);
    return base && quote ? `${base}/${quote}` : separated;
  }

  for (const quote of COMMON_QUOTE_CURRENCIES) {
    if (decoded.endsWith(quote) && decoded.length > quote.length) {
      return `${decoded.slice(0, -quote.length)}/${quote}`;
    }
  }

  return decoded;
}

export function normalizeTradeSymbolList(rawSymbols: string): string[] {
  return rawSymbols
    .split(',')
    .map((symbol) => normalizeTradeSymbol(symbol))
    .filter(Boolean);
}
