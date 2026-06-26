/**
 * 跨链桥接模块统一导出
 *
 * 模块组成：
 *  - types: 类型定义 + 关键常量 + 预定义代币
 *  - layerzero-bridge: LayerZero V2 Omnichain 适配器
 *  - wormhole-bridge: Wormhole Guardian VAA 适配器
 *  - stargate-bridge: Stargate 流动性池适配器
 *  - across-bridge: Across Optimistic 适配器
 *  - route-aggregator: 4 桥并行询价 + 路由选择
 *  - bridge-engine: 业务引擎（交易管理 + 安全检查 + 历史）
 *
 * 用法：
 *   import { BridgeEngine } from '@/lib/bridge';
 *   const engine = new BridgeEngine();
 *   const tx = await engine.execute({
 *     userId: 'u1',
 *     fromChain: 1, toChain: 42161,
 *     fromToken: 'USDT', toToken: 'USDC',
 *     amount: '1000000000', // 1000 USDT
 *     senderAddress: '0x...', receiverAddress: '0x...',
 *   });
 *   // 跟踪
 *   await new Promise(r => setTimeout(r, 300));
 *   await engine.track(tx.id);
 */

export * from './types';
export * from './layerzero-bridge';
export * from './wormhole-bridge';
export * from './stargate-bridge';
export * from './across-bridge';
export * from './route-aggregator';
export * from './bridge-engine';
