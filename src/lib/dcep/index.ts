/**
 * DCEP（数字人民币 / e-CNY）模块统一导出
 *
 * 模块组成：
 *  - types                  类型定义 + 常量 + 工具
 *  - wallet-service         DCEP 钱包 + 限额管理
 *  - kyc-service            4 级实名认证
 *  - payment-gateway        央行侧网关（mock）
 *  - dcep-engine            业务层（入金 / 出金 / 报价 / 报表 / 合规）
 *
 * 用法：
 *   import { DcepEngine, DcepWalletService, DcepKycService, DcepPaymentGateway } from '@/lib/dcep';
 */

// 类型 + 常量
export * from './types';

// 钱包 + 限额
export {
  DcepWalletService,
  createDcepWalletService,
  type DcepWalletServiceOptions,
} from './wallet-service';

// KYC
export {
  DcepKycService,
  createDcepKycService,
  type DcepKycServiceOptions,
} from './kyc-service';

// 央行网关
export {
  DcepPaymentGateway,
  createDcepPaymentGateway,
  type DcepPaymentGatewayOptions,
} from './payment-gateway';

// 业务引擎
export {
  DcepEngine,
  createDcepEngine,
  type DcepEngineOptions,
  type DepositOptions,
  type WithdrawOptions,
  type GetQuoteOptions,
} from './dcep-engine';
