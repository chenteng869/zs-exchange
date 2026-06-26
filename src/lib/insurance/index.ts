/**
 * DeFi 保险池（Insurance Pool）模块入口
 *
 *  模块结构：
 *   - types                类型定义 + 关键常量
 *   - risk-pricing         风险定价引擎（精算模型）
 *   - policy-service       保单服务（报价/投保/退保）
 *   - claim-engine         理赔引擎（提交/调查/投票/赔付）
 *   - pool-service         池子服务（staking/分配/退出）
 *   - insurance-engine     业务主类（整合 + 事件 + 报表）
 *
 *  业务流程：
 *   1. 承保人 stake → 池子获得流动性
 *   2. 投保人 buy policy → 付保费
 *   3. 出险时 submit claim → 调查 / 投票 / 决定
 *   4. 决定通过 → 从池子按 payoutRatio 比例赔付
 *   5. 承保人 request withdraw → 7 天锁仓 → 到账
 *
 *  典型用法：
 *    import { InsuranceEngine } from '@/lib/insurance';
 *    const ins = new InsuranceEngine({ initialPoolDeposit: '100000' });
 *    ins.deposit('u1', '5000');
 *    const policy = ins.purchase('u1', {
 *      product: 'smart_contract', coverageAmount: '1000',
 *      periodDays: 90, coveredAsset: 'ETH',
 *    });
 *    ins.stake('provider1', '5000', 30, 'smart_contract');
 *    const claim = ins.submitClaim('u1', {
 *      policyId: policy.id, amount: '500', reason: '...', evidence: [...],
 *    });
 *    ins.startVoting(claim.id);
 *    ins.vote(claim.id, { address: '0xv1', vote: 'approve', weight: 10 });
 *    ins.approveClaim(claim.id);
 *    ins.payoutClaim(claim.id);
 */

export * from './types';

// 风险定价
export {
  RiskPricingEngine,
  InsurancePricingError,
  type RiskPricingEngineOptions,
} from './risk-pricing';

// 保单服务
export {
  PolicyService,
  PolicyError,
  InMemoryWallet,
  type PolicyServiceOptions,
  type PolicyEvent,
  type PolicyEventHandler,
  type UserWallet,
  type WalletAdapter,
  type PoolCapital,
} from './policy-service';

// 理赔引擎
export {
  ClaimEngine,
  ClaimError,
  type ClaimEngineOptions,
  type ClaimEvent,
  type ClaimEventHandler,
  type PolicyLookup,
  type PayoutSink,
} from './claim-engine';

// 池子服务
export {
  PoolService,
  PoolError,
  type PoolServiceOptions,
  type PoolEvent,
  type PoolEventHandler,
} from './pool-service';

// 业务主类
export {
  InsuranceEngine,
  type InsuranceEngineOptions,
  type InsuranceEvent,
  type InsuranceEventHandler,
  type UserInsuranceStats,
} from './insurance-engine';
