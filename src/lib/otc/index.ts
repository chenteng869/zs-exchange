/**
 * OTC / 大宗交易 模块统一导出
 *
 * 模块组成：
 *  - types                 类型定义 & 常量
 *  - market-maker-registry 机构做市商管理（Galaxy / Jump / Cumberland / Wintermute / Genesis 等）
 *  - rfq-engine            询价引擎（创建 / 邀请 / 报价 / 选择 / 接受）
 *  - price-lock            锁价服务（避免滑点 + 偏离监控）
 *  - settlement-engine     结算引擎（链上 / 法币 / 稳定币）
 *  - commission-engine     佣金引擎（sales 0.05% / maker 0.10% / platform 0.05%）
 *  - otc-engine            业务层（完整流程 / 撮合器人 / 事件订阅）
 *
 * 典型用法：
 *
 *   import { OtcEngine } from '@/lib/otc';
 *
 *   const engine = new OtcEngine();
 *
 *   // 1) 创建 RFQ
 *   const rfq = engine.createRfq({
 *     clientId: 'inst_001', clientUserId: 'trader_001',
 *     side: 'buy', baseAsset: 'BTC', quoteAsset: 'USDT',
 *     baseAmount: '10', settlementType: 'stablecoin',
 *   });
 *
 *   // 2) 邀请做市商
 *   const makers = engine.getMakerRegistry().listMakers(undefined, 'BTC');
 *   engine.inviteMakers(rfq.id, makers.slice(0, 3).map(m => m.id));
 *
 *   // 3) 做市商报价
 *   const quote = engine.submitQuote({ rfqId: rfq.id, makerId: makers[0].id, price: '68000' });
 *
 *   // 4) 选择最优报价
 *   const best = engine.selectBestQuote(rfq.id, 'price')!;
 *
 *   // 5) 客户接受
 *   const trade = engine.acceptQuote(best.id);
 *
 *   // 6) 结算
 *   const settled = await engine.settleTrade(trade.id);
 *
 *   // 7) 撮合器人
 *   engine.registerSalesperson({ id: 'sp_1', userId: 'u_1', name: 'Alice' });
 *   engine.assignSalesperson('inst_001', 'sp_1');
 */

export * from './types';
export * from './market-maker-registry';
export * from './rfq-engine';
export * from './price-lock';
export * from './settlement-engine';
export * from './commission-engine';
export { OtcEngine, type OtcEngineDeps } from './otc-engine';
