export { BaseRepository } from './base/base.repository';
export type { PaginationParams, PaginatedResult } from './base/base.repository';

export { userRepository, UserRepository } from './user.repository';
export { sessionRepository, SessionRepository } from './session.repository';
export { apiKeyRepository, ApiKeyRepository } from './api-key.repository';
export { roleRepository, userRoleRepository, RoleRepository, UserRoleRepository } from './role.repository';
export { systemConfigRepository, SystemConfigRepository } from './system-config.repository';
export { notificationRepository, NotificationRepository } from './notification.repository';

export { tradePairRepository, TradePairRepository } from './trade-pair.repository';
export { orderRepository, OrderRepository } from './order.repository';
export { tradeRepository, TradeRepository } from './trade.repository';
export { balanceRepository, BalanceRepository } from './balance.repository';
export { tradePositionRepository, tradeFeeRecordRepository, TradePositionRepository, TradeFeeRecordRepository } from './settlement.repository';

export { walletCurrencyRepository, WalletCurrencyRepository } from './wallet-currency.repository';
export { depositRepository, DepositRepository } from './deposit.repository';
export { withdrawalRepository, WithdrawalRepository } from './withdrawal.repository';
export { walletAddressRepository, walletHotColdRepository, WalletAddressRepository, WalletHotColdRepository } from './wallet-address.repository';

export { tickerRepository, klineRepository, depthRepository, TickerRepository, KlineRepository, DepthRepository } from './market.repository';

export { kycApplicationRepository, kycRiskAssessmentRepository, kycComplianceFreezeRepository, KycApplicationRepository, KycRiskAssessmentRepository, KycComplianceFreezeRepository } from './kyc.repository';

export { defiStakingPoolRepository, defiStakingRepository, defiLiquidityPoolRepository, defiSwapRepository, DefiStakingPoolRepository, DefiStakingRepository, DefiLiquidityPoolRepository, DefiSwapRepository } from './defi.repository';

export { nftCategoryRepository, nftItemRepository, nftOrderRepository, NftCategoryRepository, NftItemRepository, NftOrderRepository } from './nft.repository';

export { aiModelRepository, aiCompletionRepository, aiAgentRepository, aiAnalysisRepository, AiModelRepository, AiCompletionRepository, AiAgentRepository, AiAnalysisRepository } from './ai.repository';

export { blockchainTransactionRepository, blockchainContractRepository, blockchainNotarizationRepository, blockchainNodeRepository, BlockchainTransactionRepository, BlockchainContractRepository, BlockchainNotarizationRepository, BlockchainNodeRepository } from './blockchain.repository';

export { auditLogRepository, auditLoginLogRepository, auditApiAccessLogRepository, AuditLogRepository, AuditLoginLogRepository, AuditApiAccessLogRepository } from './audit.repository';

export { settlementBatchRepository, settlementRecordRepository, settlementClearingRepository, SettlementBatchRepository, SettlementRecordRepository, SettlementClearingRepository } from './settlement.repository';

import { userRepository } from './user.repository';
import { sessionRepository } from './session.repository';
import { apiKeyRepository } from './api-key.repository';
import { roleRepository, userRoleRepository } from './role.repository';
import { systemConfigRepository } from './system-config.repository';
import { notificationRepository } from './notification.repository';
import { tradePairRepository } from './trade-pair.repository';
import { orderRepository } from './order.repository';
import { tradeRepository } from './trade.repository';
import { balanceRepository } from './balance.repository';
import { tradePositionRepository, tradeFeeRecordRepository } from './settlement.repository';
import { walletCurrencyRepository } from './wallet-currency.repository';
import { depositRepository } from './deposit.repository';
import { withdrawalRepository } from './withdrawal.repository';
import { walletAddressRepository, walletHotColdRepository } from './wallet-address.repository';
import { tickerRepository, klineRepository, depthRepository } from './market.repository';
import { kycApplicationRepository, kycRiskAssessmentRepository, kycComplianceFreezeRepository } from './kyc.repository';
import { defiStakingPoolRepository, defiStakingRepository, defiLiquidityPoolRepository, defiSwapRepository } from './defi.repository';
import { nftCategoryRepository, nftItemRepository, nftOrderRepository } from './nft.repository';
import { aiModelRepository, aiCompletionRepository, aiAgentRepository, aiAnalysisRepository } from './ai.repository';
import { blockchainTransactionRepository, blockchainContractRepository, blockchainNotarizationRepository, blockchainNodeRepository } from './blockchain.repository';
import { auditLogRepository, auditLoginLogRepository, auditApiAccessLogRepository } from './audit.repository';
import { settlementBatchRepository, settlementRecordRepository, settlementClearingRepository } from './settlement.repository';

export const repositories = {
  user: userRepository,
  session: sessionRepository,
  apiKey: apiKeyRepository,
  role: roleRepository,
  userRole: userRoleRepository,
  systemConfig: systemConfigRepository,
  notification: notificationRepository,
  tradePair: tradePairRepository,
  order: orderRepository,
  trade: tradeRepository,
  balance: balanceRepository,
  tradePosition: tradePositionRepository,
  tradeFeeRecord: tradeFeeRecordRepository,
  walletCurrency: walletCurrencyRepository,
  deposit: depositRepository,
  withdrawal: withdrawalRepository,
  walletAddress: walletAddressRepository,
  walletHotCold: walletHotColdRepository,
  ticker: tickerRepository,
  kline: klineRepository,
  depth: depthRepository,
  kycApplication: kycApplicationRepository,
  kycRiskAssessment: kycRiskAssessmentRepository,
  kycComplianceFreeze: kycComplianceFreezeRepository,
  defiStakingPool: defiStakingPoolRepository,
  defiStaking: defiStakingRepository,
  defiLiquidityPool: defiLiquidityPoolRepository,
  defiSwap: defiSwapRepository,
  nftCategory: nftCategoryRepository,
  nftItem: nftItemRepository,
  nftOrder: nftOrderRepository,
  aiModel: aiModelRepository,
  aiCompletion: aiCompletionRepository,
  aiAgent: aiAgentRepository,
  aiAnalysis: aiAnalysisRepository,
  blockchainTransaction: blockchainTransactionRepository,
  blockchainContract: blockchainContractRepository,
  blockchainNotarization: blockchainNotarizationRepository,
  blockchainNode: blockchainNodeRepository,
  auditLog: auditLogRepository,
  auditLoginLog: auditLoginLogRepository,
  auditApiAccessLog: auditApiAccessLogRepository,
  settlementBatch: settlementBatchRepository,
  settlementRecord: settlementRecordRepository,
  settlementClearing: settlementClearingRepository,
};

export default repositories;