/**
 * 预言机模块统一导出
 *
 * 模块组成：
 *  - chainlink/types: 核心类型与常量
 *  - chainlink/feed-registry: 50+ 主流价格 feed 注册表
 *  - chainlink/chainlink-client: 链上价格查询客户端（eth_call / no gas）
 *  - chainlink/aggregator: 多链价格聚合（中位数 / 异常剔除 / confidence）
 *  - oracle-service: 业务层入口（缓存 / 订阅 / 资产估值 / 异常告警）
 *
 * 用法：
 *   import { createOracleService, getFeedByPair, searchFeeds } from '@/lib/oracle';
 *   const oracle = createOracleService();
 *   const eth = await oracle.getPrice('ETH/USD');
 *   const valuation = await oracle.getAssetValuation('ETH', '1.5', 'CNY');
 */

export * from './chainlink/types';
export * from './chainlink/feed-registry';
export * from './chainlink/chainlink-client';
export * from './chainlink/aggregator';
export * from './oracle-service';
