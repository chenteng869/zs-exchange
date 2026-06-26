/**
 * Fiat 模块统一导出
 *
 * 模块组成：
 *  - types                  类型定义 + 常量 + 工具
 *  - currency-registry      25 法币注册表 + 汇率
 *  - channels/swift         SWIFT 国际电汇
 *  - channels/sepa          SEPA 欧元区
 *  - channels/ach           ACH 美国自动清算
 *  - channels/local-channels FPS / PIX / UPI 本地支付
 *  - aml-kyc                AML / KYC 检测
 *  - fiat-engine            业务层（银行账户 / 报价 / 交易 / 限额 / 报表）
 *
 * 用法：
 *   import { FiatEngine, CurrencyRegistry, SwiftChannel } from '@/lib/fiat';
 */

export * from './types';

// CurrencyRegistry
export {
  CurrencyRegistry,
  createCurrencyRegistry,
  type CurrencyRegistryOptions,
} from './currency-registry';

// SWIFT
export {
  SwiftChannel,
  createSwiftChannel,
  validateSwift,
  type SwiftChannelOptions,
} from './channels/swift';

// SEPA
export {
  SepaChannel,
  createSepaChannel,
  validateIban,
  type SepaChannelOptions,
} from './channels/sepa';

// ACH
export {
  AchChannel,
  createAchChannel,
  validateAbaRouting,
  validateAchAccountNumber,
  type AchChannelOptions,
} from './channels/ach';

// 本地通道
export {
  FpsChannel,
  PixChannel,
  UpiChannel,
  createFpsChannel,
  createPixChannel,
  createUpiChannel,
  validateSortCode,
  validateUkAccountNumber,
  validatePixKey,
  validateUpiVpa,
  validateIfsc,
  type LocalChannelOptions,
} from './channels/local-channels';

// AML / KYC
export {
  AmlKycService,
  createAmlKycService,
  _resetAmlHistory,
  type AmlCheckResult,
  type AmlAlert,
  type UserKycContext,
  type AmlKycServiceOptions,
} from './aml-kyc';

// FiatEngine
export {
  FiatEngine,
  createFiatEngine,
  type FiatEngineOptions,
} from './fiat-engine';
