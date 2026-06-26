/**
 * DeFi 模块统一导出
 *
 * 包含 3 个子模块：
 *  - DefiLlama 客户端（defillama-client）：多端点、限流、重试、降级
 *  - TVL 服务（tvl-service）            G-01 协议 TVL
 *  - DEX 交易量服务（dex-volume-service）G-02 DEX 交易量
 *  - 稳定币服务（stablecoin-service）    G-03 稳定币
 */

export * from './staking';
export * from './liquidity';
export * from './swap';

// DeFiLlama 公共数据模块
export * from './defillama-client';
export * from './tvl-service';
export * from './dex-volume-service';
export * from './stablecoin-service';
