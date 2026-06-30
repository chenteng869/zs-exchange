import { describe, expect, it } from 'vitest';
import { normalizeTradeSymbol, normalizeTradeSymbolList } from '@/lib/trade/symbol';

describe('P0 trade symbol normalization', () => {
  it('normalizes common BTC/USDT route and body formats', () => {
    expect(normalizeTradeSymbol('BTC/USDT')).toBe('BTC/USDT');
    expect(normalizeTradeSymbol('BTCUSDT')).toBe('BTC/USDT');
    expect(normalizeTradeSymbol('btc-usdt')).toBe('BTC/USDT');
    expect(normalizeTradeSymbol('btc_usdt')).toBe('BTC/USDT');
    expect(normalizeTradeSymbol('BTC%2FUSDT')).toBe('BTC/USDT');
  });

  it('keeps slash separated symbols deterministic', () => {
    expect(normalizeTradeSymbol(' eth / usdc ')).toBe('ETH/USDC');
    expect(normalizeTradeSymbol('zs/cny')).toBe('ZS/CNY');
  });

  it('normalizes comma separated query lists', () => {
    expect(normalizeTradeSymbolList('btcusdt, eth-usdc, ZS/CNY')).toEqual([
      'BTC/USDT',
      'ETH/USDC',
      'ZS/CNY',
    ]);
  });
});
