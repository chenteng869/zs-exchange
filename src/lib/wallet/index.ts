/**
 * 钱包模块统一导出
 *
 * 模块组成：
 *  - address: 多链地址生成与校验（EIP-55 / bech32 / base58）
 *  - manager: 钱包管理（用户钱包列表、默认钱包）
 *  - deposit: 充值处理
 *  - rpc-client: 通用 JSON-RPC 客户端（多节点健康检查与切换）
 *  - chain-service: EVM 链服务（ETH/BSC 余额 / 交易历史）
 *  - tron-rpc-client: TRON 专用 RPC 客户端（API Key 注入 / 429 切换）
 *  - tron-service: TRON 链服务（TRX/TRC20 余额 / 交易历史）
 *  - chain-client: 统一多链 SDK 接口（ChainClient + 适配器）
 *  - chain-registry: 链注册表（ChainRegistry + createDefaultRegistry）
 *  - poller: 区块轮询器（BlockPoller，scans EVM/TRON 链上入账）
 *  - deposit-monitor: 充值到账监听器（双链路：Alchemy Webhook + 轮询兜底）
 *  - webhook-verifier: Alchemy Webhook 签名校验（HMAC-SHA256）
 *  - webhook-handler: 框架无关的 webhook 纯函数处理入口
 */

export * from './address';
export * from './manager';
export * from './deposit';
export * from './rpc-client';
export * from './chain-service';
export * from './tron-rpc-client';
export * from './poller';
export * from './deposit-monitor';
export * from './webhook-verifier';
export * from './webhook-handler';

// tron-service 与 chain-service / chain-client 有同名类型（ChainStatus / TransactionInfo 等），
// 为避免 export * 冲突，使用具名 re-export 暴露 TRON 的领域类型，前缀 Tron*。
export {
  TronChainService,
  createTronService,
  probeTron,
  isValidTrxAddress,
  TRC20_USDT_MAINNET,
  TRC20_USDT_DECIMALS,
  TRC20_USDC_MAINNET,
  TRC20_USDC_DECIMALS,
  // 重新导出同名类型时使用别名，避免与 chain-service 中的同名类型冲突
  type NativeBalance as TronNativeBalance,
  type TokenBalance as TronTokenBalance,
  type ChainStatus as TronChainStatus,
  type TransactionInfo as TronTransactionInfo,
  type TronChain as TronChainId,
  type TronChainServiceOptions,
} from './tron-service';
export type { TronNetwork } from './tron-rpc-client';

// chain-client 中 ChainStatus / TransactionInfo / TokenRef / ChainClient 等与 chain-service 同名
// 这里不再使用 export *，改成具名 re-export 并加 Chain* 前缀
export {
  EvmChainClientAdapter,
  TronChainClientAdapter,
  // 公共类型：使用 Chain* 前缀避免冲突
  type ChainId,
  type TokenRef,
  type ChainStatus as ChainStatusInfo,
  type ChainBalance,
  type TransactionInfo as ChainTransactionInfo,
  type ProbeResult,
  type HealthInfo,
  type ChainClient,
  type EvmAdapterOptions,
  type TronAdapterOptions,
} from './chain-client';
export * from './chain-registry';

// 提现：广播器、Gas 估算、业务封装
export {
  type UnsignedTx,
  type SignedTx,
  type TransactionReceipt,
  type BuildEip1559Opts,
  type BuildTrxTransferOpts,
  type BuildTrc20TransferOpts,
  type WithdrawalBroadcasterOptions,
  WithdrawalBroadcaster,
  pubKeyToAddress,
  Secp256k1,
} from './withdrawal-broadcaster';
export {
  type GasEstimateEip1559,
  type GasEstimateLegacy,
  type TrxBandwidthEstimate,
  type GasEstimatorOptions,
  GasEstimator,
  createEthGasEstimator,
  createBscGasEstimator,
} from './gas-estimator';
export * from './withdrawal-service';
