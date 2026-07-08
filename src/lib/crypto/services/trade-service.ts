/**
 * Trade Service
 *
 * 统一对外提供最近成交流。
 * 优先级：Binance → OKX
 */

import { binanceProvider } from '../providers/binance-provider';
import { okxProvider } from '../providers/okx-provider';
import { logger } from '@/lib/logger';
import type { UnifiedTrade } from '../types';

export class TradeService {
  async getRecentTrades(symbol: string, limit: number = 50, options: { quote?: string } = {}): Promise<UnifiedTrade[]> {
    const sym = symbol.toUpperCase();
    const quote = (options.quote ?? 'USDT').toUpperCase();
    const safeLimit = Math.min(1000, Math.max(1, limit));

    try {
      const r: any = await binanceProvider.getRecentTrades(`${sym}${quote}`, safeLimit);
      if (Array.isArray(r)) {
        return r.map(t => ({
          id: t.id,
          symbol: sym,
          price: parseFloat(t.price),
          quantity: parseFloat(t.qty),
          time: t.time,
          isBuyerMaker: t.isBuyerMaker,
          source: 'binance' as const,
        }));
      }
    } catch (e) {
      logger.debug('[trades] binance fallback', e);
    }

    try {
      const r: any = await okxProvider.getTrades(`${sym}-${quote}`, safeLimit);
      if (r?.data) {
        return r.data.map((t: any) => ({
          id: t.tradeId,
          symbol: sym,
          price: parseFloat(t.px),
          quantity: parseFloat(t.sz),
          time: parseInt(t.ts),
          isBuyerMaker: t.side === 'sell',
          source: 'okx' as const,
        }));
      }
    } catch (e) {
      logger.debug('[trades] okx fallback', e);
    }

    return [];
  }
}

export const tradeService = new TradeService();
