/**
 * 做市商 (Market Maker) 模块统一导出
 *
 *  模块组成：
 *   - types              类型定义 & 常量
 *   - quote-engine       报价引擎（双边挂单 / 自动调价）
 *   - inventory-manager  库存管理（风险敞口 / 调仓）
 *   - rebate-engine      返佣引擎（手续费返还 / 日结 / 月结）
 *   - market-maker-engine 核心业务引擎（注册 / 报价维护 / 统计）
 *
 * 典型用法：
 *
 *   import { MarketMakerEngine, QuoteEngine, InventoryManager, RebateEngine } from '@/lib/market-maker';
 *
 *   const engine = new MarketMakerEngine({
 *     matchingEngine,     // 注入 OrderEngine
 *     priceSource: s => getPrice(s),
 *   });
 *
 *   // 1) 注册 + 审批
 *   const mm = engine.registerMarketMaker({
 *     name: 'SMY_Liquidity',
 *     tier: 'gold',
 *     apiKey: 'mk_live_xxx',
 *     apiSecret: 'sk_xxx',
 *     makerFeeRate: -0.0001,
 *     rebateRate: 0.0002,
 *     dailyVolumeTarget: '1000000',
 *     minSpreadBps: 5,
 *     maxInventory: '10',
 *   });
 *   engine.approveMarketMaker(mm.id);
 *
 *   // 2) 报价
 *   const quotes = engine.updateQuote(mm.id, 'BTC/USDT');
 *
 *   // 3) 监听成交
 *   engine.bindMatchingEngine(matchingEngine);
 *
 *   // 4) 统计
 *   const stats = engine.getStats(mm.id, { start, end });
 *   const leaderboard = engine.getLeaderboard('BTC/USDT');
 */

export * from './types';
export * from './quote-engine';
export * from './inventory-manager';
export * from './rebate-engine';
export { MarketMakerEngine, type MarketMakerEngineDeps, type TradeRecord } from './market-maker-engine';

// 透传 Trade 类型，方便上层使用
export type { Trade } from '@/types/models';
