/**
 * Web3 钱包风控引擎统一导出
 */

export * from './risk-engine.types';

export { RiskEngine, riskEngine } from './risk-engine';
export { RiskDecisionEngine, riskDecisionEngine } from './risk-decision.engine';
export { RiskEventService, riskEventService } from './risk-event.service';
export { BlacklistService, blacklistService } from './blacklist.service';

export {
  RiskScorer,
  riskScorer,
} from './risk-scoring/risk-scorer';
export {
  AmountScorer,
  amountScorer,
} from './risk-scoring/amount-scorer';
export {
  AddressScorer,
  addressScorer,
} from './risk-scoring/address-scorer';
export {
  ContractScorer,
  contractScorer,
} from './risk-scoring/contract-scorer';
export {
  BehaviorScorer,
  behaviorScorer,
} from './risk-scoring/behavior-scorer';
export {
  DeviceScorer,
  deviceScorer,
} from './risk-scoring/device-scorer';

export {
  AddressBlacklistRule,
  addressBlacklistRule,
} from './risk-rules/address-blacklist.rule';
export {
  ContractBlacklistRule,
  contractBlacklistRule,
} from './risk-rules/contract-blacklist.rule';
export {
  PhishingDomainRule,
  phishingDomainRule,
} from './risk-rules/phishing-domain.rule';
export {
  LargeTransferRule,
  largeTransferRule,
} from './risk-rules/large-transfer.rule';
export {
  UnlimitedApprovalRule,
  unlimitedApprovalRule,
} from './risk-rules/unlimited-approval.rule';
export {
  NewAddressRule,
  newAddressRule,
} from './risk-rules/new-address.rule';
export {
  FrequentTransactionsRule,
  frequentTransactionsRule,
} from './risk-rules/frequent-transactions.rule';
export {
  SuspiciousContractRule,
  suspiciousContractRule,
} from './risk-rules/suspicious-contract.rule';
export {
  ZeroValueTransferRule,
  zeroValueTransferRule,
} from './risk-rules/zero-value-transfer.rule';
export {
  NFTApprovalRule,
  nftApprovalRule,
} from './risk-rules/nft-approval.rule';
