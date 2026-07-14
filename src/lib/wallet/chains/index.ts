/**
 * ChainAdapter 多链适配层统一导出入口
 *
 * 本模块提供多链适配层的统一导出，包括：
 *  - 接口定义：ChainAdapter, ChainInfo, BalanceInfo 等
 *  - 枚举类型：ChainType, TransactionStatus, FeeLevel 等
 *  - 工厂类：ChainAdapterFactory
 *  - 各链适配器：EVMAdapter, SolanaAdapter, BitcoinAdapter, TronAdapter
 *  - 工具函数和类型守卫
 *
 * 使用示例：
 *  import { ChainAdapterFactory, ChainType, EVMAdapter } from '@/lib/wallet/chains';
 *
 *  const factory = ChainAdapterFactory.getInstance();
 *  factory.registerAdapter(ChainType.EVM, EVMAdapter);
 *  const adapter = factory.getAdapter(ChainType.EVM);
 */

import {
  ChainType,
  TransactionStatus,
  TokenStandard,
  TransactionType,
  FeeLevel,
  AddressType,
} from './chain-adapter.interface';
import { ChainAdapterFactory } from './chain-adapter.factory';
import {
  SolanaAdapter,
  SOLANA_NETWORKS,
} from './solana-adapter';
import {
  BitcoinAdapter,
  BITCOIN_NETWORKS,
} from './bitcoin-adapter';
import {
  TronAdapter,
  TRON_NETWORKS,
  createTronAdapter,
} from './tron-adapter';

// ============================================================================
// 接口和类型定义
// ============================================================================

export {
  ChainType,
  TransactionStatus,
  TokenStandard,
  TransactionType,
  FeeLevel,
  AddressType,
} from './chain-adapter.interface';

export type {
  ChainInfo,
  BalanceInfo,
  TokenBalanceInfo,
  TransactionInput,
  TransactionOutput,
  FeeEstimate,
  GasPriceInfo,
  TransactionDetail,
  TokenTransferInfo,
  AddressValidationResult,
  BlockInfo,
  SignResult,
  BroadcastResult,
  Signer,
  ChainAdapter,
  AdapterConfig,
  ChainAdapterConstructor,
  CancellableResult,
  PaginationParams,
  PaginatedResult,
  HealthCheckResult,
  AdapterEventType,
  AdapterEventListener,
} from './chain-adapter.interface';

export {
  isValidChainType,
  isValidTransactionStatus,
  isValidTokenStandard,
  isValidFeeLevel,
} from './chain-adapter.interface';

// ============================================================================
// 工厂类
// ============================================================================

export {
  ChainAdapterFactory,
  AdapterNotRegisteredError,
  AdapterAlreadyRegisteredError,
  InvalidChainTypeError,
} from './chain-adapter.factory';

export type {
  ChainAdapterFactoryOptions,
} from './chain-adapter.factory';

// ============================================================================
// EVM 适配器 (Solana-first: 已废弃，2026-07-01 起不再使用)
// ============================================================================

// EVM 适配器已归档到 docs/_trash/2026-07-01-solana-first-重构/
// 保留注释用于历史追踪；如需重新启用 EVM，需恢复 evm-adapter.ts

// ============================================================================
// Solana 适配器
// ============================================================================

export {
  SolanaAdapter,
  SOLANA_NETWORKS,
  SYSTEM_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  base58Encode,
  base58Decode,
  lamportsToSOL,
  solToLamports,
  formatSOL,
  isValidSolanaAddress,
  getAssociatedTokenAddress,
  encodeTransferData,
  encodeTokenTransferData,
} from './solana-adapter';

export type {
  SolanaChainConfig,
} from './solana-adapter';

// ============================================================================
// Bitcoin 适配器
// ============================================================================

export {
  BitcoinAdapter,
  BITCOIN_NETWORKS,
  satoshiToBTC,
  btcToSatoshi,
  formatBTC,
  bech32Encode,
  getP2PKHAddress,
  getP2WPKHAddress,
  getP2SHP2WPKHAddress,
  getP2TRAddress,
  getBitcoinAddress,
  isValidBitcoinAddress,
  estimateTxVSize,
  selectUTXOs,
} from './bitcoin-adapter';

export type {
  BitcoinChainConfig,
  BitcoinAddressType,
  UTXO,
  UTXOSelectionResult,
} from './bitcoin-adapter';

// ============================================================================
// Tron 适配器
// ============================================================================

export {
  TronAdapter,
  TRON_NETWORKS,
  createTronAdapter,
} from './tron-adapter';

export type {
  TronChainConfig,
} from './tron-adapter';

// ============================================================================
// 默认导出
// ============================================================================

/**
 * 默认导出：包含所有适配器和工厂的便捷访问对象
 *
 * 使用示例：
 *  import Chains from '@/lib/wallet/chains';
 *  const evm = new Chains.EVMAdapter();
 *  const factory = Chains.Factory.getInstance();
 */
export default {
  // 工厂
  Factory: ChainAdapterFactory,

  // 适配器 (Solana-first: EVM 适配器已废弃)
  SolanaAdapter,
  BitcoinAdapter,
  TronAdapter,

  // 类型枚举
  ChainType,
  TransactionStatus,
  TokenStandard,
  TransactionType,
  FeeLevel,
  AddressType,

  // 网络配置（Solana-first：EVM_CHAINS 已废弃，迁移到 Solana 网络）
  SOLANA_NETWORKS,
  BITCOIN_NETWORKS,
  TRON_NETWORKS,

  // 工厂函数
  createTronAdapter,
};
