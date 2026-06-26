/**
 * 行情模块统一导出
 *
 * 包含：
 *  - 模拟行情 feed（feed.ts）
 *  - K 线聚合器（kline.ts）
 *  - Binance 真实行情客户端（binance-client.ts）
 *  - Binance 行情适配器（binance-adapter.ts）—— 与 MarketFeed 接口兼容
 *  - Binance 行情连通性探测（binance-probe.ts）
 *  - 逐笔成交聚合层（trades-feed.ts）—— 多 symbol 缓存 + 降级
 *  - Kaiko 机构级行情（./kaiko）—— REST + WS + 跨交易所聚合
 */

export * from './feed';
export * from './kline';
export * from './binance-client';
export * from './binance-adapter';
export * from './binance-probe';
export * from './trades-feed';
export * as Kaiko from './kaiko';
