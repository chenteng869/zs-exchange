# DeFi 保险池（Insurance Pool）

> SMY 交易所自研 DeFi 保险池系统
>
> 参考项目：Nexus Mutual / InsurAce / Cover Protocol
>
> 适用场景：投保人付费买保险，承保人投入资金获得保费分润，出险时按规则赔付

---

## 1. 保险池原理

### 1.1 角色与资金流

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   承保人(Provider)                                                     │
│        │                                                               │
│        │ 1) stake 入金                                                │
│        ▼                                                               │
│   ┌──────────────┐         2) 投保付保费        ┌──────────────┐        │
│   │              │  ─────────────────────────► │              │        │
│   │   保险池     │                              │   投保人     │        │
│   │   Pool       │  ◄──── 3) 出险按 90% 赔付   │   (Insured)  │        │
│   │              │                              │              │        │
│   └──────────────┘                              └──────────────┘        │
│        │                                                               │
│        │ 4) 退出：7 天锁仓 → 本金 + 保费分润 - lossReserve              │
│        ▼                                                               │
│   承保人(Provider)                                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心机制

- **份额模型**：sharePrice = totalStaked / totalShares；首次入金 1:1，后续按 sharePrice 计算
- **收益分配**：保费与协议收益按份额比例分配给 active 仓位
- **损失准备**：赔付从池子扣款并按份额计入 lossReserve
- **退出机制**：7 天锁仓 + 早退 5% 惩罚（保证池子流动性）
- **退保机制**：14 天宽限期内可退，扣 5% × 已过天数/14 手续费

### 1.3 5 类保险产品

| 产品 | 中文 | 基础年化费率 | 典型场景 |
|------|------|--------------|----------|
| `exchange_hack` | 交易所被盗 | 0.8% | 中心化交易所热钱包被盗 |
| `smart_contract` | 智能合约漏洞 | 1.2% | DeFi 协议被攻击 |
| `stablecoin_depeg` | 稳定币脱锚 | 0.5% | USDT/USDC 大幅脱锚 |
| `oracle_failure` | 预言机故障 | 0.3% | Chainlink 节点异常 |
| `liquidation_penalty` | 强平罚金 | 0.6% | 永续合约清算时价差 |

---

## 2. 精算模型（Risk Pricing）

### 2.1 多维风险评分

```
score = 合约风险 × 0.30
      + 流动性风险 × 0.15
      + 历史事故   × 0.25
      + (100 - 审计) × 0.15
      + 中心化风险 × 0.15
```

5 个因子（0-100，100=最危险）：
- `smartContractRisk` - 智能合约代码风险
- `liquidityRisk` - 流动性深度风险
- `historicalIncidents` - 历史事故频率
- `auditScore` - 审计评分（反向：100-该值）
- `centralizationRisk` - 中心化风险

### 2.2 资产风险覆盖

内置资产风险档案（可被自定义覆盖）：

```typescript
// 高风险资产（费率上调）
HIGH_RISK_ASSETS = {
  titan: { smartContractRisk: 95, historicalIncidents: 95 },
  ust:   { smartContractRisk: 50, historicalIncidents: 100 },
  luna:  { smartContractRisk: 60, historicalIncidents: 100 },
  cream: { smartContractRisk: 90, historicalIncidents: 80 },
};

// 低风险资产（主流币，费率优惠）
LOW_RISK_ASSETS = {
  btc:   { smartContractRisk: 15, auditScore: 90 },
  eth:   { smartContractRisk: 20, auditScore: 90 },
  usdt:  { smartContractRisk: 30, auditScore: 70 },
  usdc:  { smartContractRisk: 25, auditScore: 80 },
};
```

### 2.3 保费公式

```
premium = coverage × baseRate × (period / 365) × (1 + riskScore / 100)
```

- `baseRate` - 基础年化费率（产品级别）
- `period / 365` - 期间折算因子
- `1 + riskScore / 100` - 风险调整系数（0 分不调整，100 分翻倍）
- 上限：受产品 `rateCap` 限制（如 smart_contract 上限 6%）

**示例**：保额 10000 USDT，90 天，smart_contract 产品，风险分 0
```
premium = 10000 × 0.012 × (90 / 365) × 1.0 ≈ 29.59 USDT
```

### 2.4 资本要求

```
requiredCapital = coverageAmount / utilizationTarget
```

默认利用率目标 80% → 10000 USDT 保额需要 12500 USDT 池子资金

---

## 3. 理赔流程

### 3.1 状态机

```
┌───────────┐    investigate    ┌────────────────┐
│ submitted │ ─────────────────►│ investigating   │
└───────────┘                   └────────┬────────┘
                                          │
                       createVoting       │
                                          ▼
                              ┌────────────────────┐
                              │   voting: pending  │
                              └────────┬───────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
            ┌──────────────┐                     ┌──────────────┐
            │   approved   │                     │   rejected   │
            └──────┬───────┘                     └──────────────┘
                   │ payout
                   ▼
            ┌──────────────┐
            │     paid     │   90% 赔付比例
            └──────────────┘
```

### 3.2 步骤详解

1. **submitClaim**（提交理赔）
   - 自动校验：保单存在、active、申请金额 ≤ 保额、申请人是保单所有者
   - 至少 1 条证据（tx_hash / screenshot / document / attestation）
   - reason ≥ 5 字符

2. **investigate**（调查）
   - 分配调查人
   - 可追加证据
   - 状态：submitted → investigating

3. **createVoting / vote**（投票治理）
   - 7 天投票期（`INSURANCE_CLAIM_VOTING_DURATION_MS`）
   - 默认 `token_weighted`（按质押量加权）
   - 通过阈值 2/3（`INSURANCE_VOTING_THRESHOLD = 0.66`）
   - **自动通过条件**：
     - 总票数 ≥ 3
     - 双方都有至少 1 票
     - approveRatio ≥ 0.66 → 自动 approve
     - rejectRatio ≥ 0.66 → 自动 reject
   - 防作弊：单地址不能重复投票
   - 过期由 `processExpiredVotings()` 触发

4. **approveClaim**（批准）
   - 默认赔付 = `claim.amount × 0.9`（`INSURANCE_PAYOUT_RATIO`）
   - 可传入 `amount` 部分赔付，但不超过 90% 上限

5. **payoutClaim**（赔付）
   - 调用 PayoutSink 从池子扣款
   - 标记保单为 `claimed`
   - 标记 claim 为 `paid`

6. **rejectClaim**（拒绝）
   - 需提供拒绝原因（≥ 3 字符）
   - 关闭投票，标记 rejected

### 3.3 投票治理示例

```typescript
// 3 票加权投票，刚好超过 2/3 阈值
// 票数序列：reject 3 + approve 3 + approve 3 = 9
// approveRatio = 6/9 ≈ 0.667 > 0.66 → 自动 approve
ins.vote(claim.id, { address: '0xaa', vote: 'reject', weight: 3 });
ins.vote(claim.id, { address: '0xbb', vote: 'approve', weight: 3 });
ins.vote(claim.id, { address: '0xcc', vote: 'approve', weight: 3 });
```

---

## 4. 收益分配

### 4.1 分配机制

```
┌────────────────────────────────────────────────────────┐
│                  保费收入 premium                       │
│                                                        │
│  distributePremium(policy)                            │
│    │                                                   │
│    ├─ 遍历所有 active 仓位                             │
│    │     shareRatio = pos.share / pool.totalShares    │
│    │     portion = premium × shareRatio                │
│    │     pos.earnedPremium += portion                  │
│    │     pos.totalReturn  += portion                   │
│    │                                                   │
│    └─ pool.totalPremium += premium                    │
└────────────────────────────────────────────────────────┘
```

### 4.2 收益来源

- **保费分润** - 投保人支付的保险费
- **协议收益** - 池子资金参与 DeFi（stake / supply）的利息
- **损失抵消** - 出险时按份额扣 lossReserve

### 4.3 APY 计算

```typescript
calculateApy(poolId, periodDays = 30)
// 基于最近 period 天的保费收入 / 池子总规模
// 输出年化（365/period）
```

**示例**：100000 USDT 池子，30 天内 1000 USDT 保费
```
periodReturn = 1000 / 100000 = 1%
APY = 1% × (365 / 30) ≈ 12.17%
```

---

## 5. 退出机制

### 5.1 流程

```
stake (active)  →  requestWithdraw (withdrawing)  →  processWithdraw (withdrawn)
                       7 天锁仓                          退款 = 本金 + 收益 - 损失 - 早退惩罚
```

### 5.2 早退惩罚

```typescript
const isEarly = now < pos.unlockTime;
const penaltyRate = isEarly ? 0.05 : 0;  // INSURANCE_EARLY_WITHDRAW_PENALTY
const payout = (amount + totalReturn - lossReserve) × (1 - penaltyRate);
```

- 早退：`unlockTime = stakedAt + lockupDays × 24h`
- 7 天后无惩罚
- 锁仓 0 天可立即退出

### 5.3 退保（保单层面）

```typescript
const usageRatio = elapsedDays / 14;  // INSURANCE_CANCEL_GRACE_DAYS
const fee = premium × 0.05 × usageRatio;  // INSURANCE_CANCEL_FEE_RATE
const refund = premium - fee;
```

- 14 天内可退
- 手续费线性增长：第 1 天退 ≈ 0.36%，第 7 天退 ≈ 2.5%，第 14 天退 = 5%
- 超 14 天不可退

---

## 6. 关键常量

| 常量 | 值 | 说明 |
|------|----|----|
| `INSURANCE_DEFAULT_PERIODS` | [30, 90, 180, 365] | 默认可选保险期间（天） |
| `INSURANCE_CANCEL_GRACE_DAYS` | 14 | 退保宽限期 |
| `INSURANCE_CANCEL_FEE_RATE` | 0.05 | 退保手续费率（封顶） |
| `INSURANCE_BASE_RATES` | 见上表 | 5 产品基础年化费率 |
| `INSURANCE_CLAIM_VOTING_DURATION_MS` | 7 × 24 × 3600 × 1000 | 投票期 7 天 |
| `INSURANCE_VOTING_THRESHOLD` | 0.66 | 通过阈值 2/3 |
| `INSURANCE_PAYOUT_RATIO` | 0.9 | 赔付比例 90% |
| `INSURANCE_EARLY_WITHDRAW_PENALTY` | 0.05 | 早退惩罚 5% |
| `INSURANCE_WITHDRAW_LOCKUP_DAYS` | 7 | 退出锁定期 7 天 |
| `INSURANCE_POOL_UTILIZATION_TARGET` | 0.8 | 池子目标利用率 80% |
| `INSURANCE_QUOTE_TTL_MS` | 60_000 | 报价有效期 60s |
| `INSURANCE_GLOBAL_POOL_ID` | 'global' | 全局池 ID |

---

## 7. 模块结构

```
src/lib/insurance/
├── types.ts             # 类型定义 + 关键常量
├── risk-pricing.ts      # RiskPricingEngine - 风险定价引擎
├── policy-service.ts    # PolicyService - 保单服务（报价/投保/退保）
├── claim-engine.ts      # ClaimEngine - 理赔引擎（提交/调查/投票/赔付）
├── pool-service.ts      # PoolService - 池子服务（staking/分配/退出）
├── insurance-engine.ts  # InsuranceEngine - 业务主类（整合 + 事件 + 报表）
└── index.ts             # 模块入口
```

---

## 8. 完整调用示例

### 8.1 基础用法（5 步走）

```typescript
import { InsuranceEngine, INSURANCE_GLOBAL_POOL_ID } from '@/lib/insurance';

// 1) 初始化引擎（可选注入初始池子资金）
const ins = new InsuranceEngine({ initialPoolDeposit: '100000' });

// 2) 给用户钱包充值（演示用）
ins.deposit('alice', '10000');   // 投保人
ins.deposit('bob', '50000');     // 承保人

// 3) 承保人注入流动性到池子
const stakePos = ins.stake('bob', '50000', 7, 'smart_contract');
// 获得 share = 50000（首笔 1:1），7 天锁仓

// 4) 投保人报价 + 买保单
const quote = ins.getQuote({
  product: 'smart_contract',
  coverageAmount: '1000',
  periodDays: 90,
  coveredAsset: 'ETH',
});
// quote: { premium: '2.96', premiumRate: 0.012, riskScore: 36, ... }

const policy = ins.purchase('alice', {
  product: 'smart_contract',
  coverageAmount: '1000',
  periodDays: 90,
  coveredAsset: 'ETH',
});
// policy.status = 'active'，钱包扣 2.96 USDT

// 5) 出险 → 提交理赔
const claim = ins.submitClaim('alice', {
  policyId: policy.id,
  amount: '500',
  reason: '合约被攻击导致资金损失',
  evidence: [
    { type: 'tx_hash', content: '0xabc123...', uploadedAt: Date.now() },
    { type: 'screenshot', content: '截图URL', uploadedAt: Date.now() },
  ],
});

// 6) 调查 + 投票
ins.investigateClaim(claim.id, 'inv-1', '已初步核实');
ins.startVoting(claim.id);
ins.vote(claim.id, { address: '0xv1', vote: 'approve', weight: 10 });
ins.vote(claim.id, { address: '0xv2', vote: 'approve', weight: 8 });
ins.vote(claim.id, { address: '0xv3', vote: 'reject', weight: 4 });
// approveRatio = 18/22 ≈ 0.818 > 0.66 → 自动 approve

// 7) 赔付
ins.payoutClaim(claim.id);
// claim.payoutAmount = '450' (500 × 0.9)
// 池子扣款 450，标记保单 claimed
```

### 8.2 退保示例

```typescript
// 7 天后退保（手续费按 7/14 比例扣除）
const r = ins.cancel(policy.id);
// r.fee = premium × 0.05 × (7/14)
// r.refund = premium - fee
```

### 8.3 承保人退出示例

```typescript
// 申请退出（标记 withdrawing）
const pos = ins.requestWithdraw(stakePos.id);
// pos.unlockTime = stakedAt + 7 × 24h

// 7 天后处理退出
setTimeout(() => {
  const r = ins.processWithdraw(pos.id);
  // r.payout = 本金 + 收益 - 损失 - 早退惩罚
  // r.penalty = 0（已到 unlockTime）
}, 7 * 24 * 3600 * 1000);
```

### 8.4 事件订阅

```typescript
// 订阅保单签发事件
const unsub1 = ins.onPolicyIssued((policy, quote) => {
  console.log(`新保单: ${policy.id}, 保费: ${quote.premium}`);
});

// 订阅理赔提交事件
const unsub2 = ins.onClaimSubmitted((claim) => {
  console.log(`新理赔: ${claim.id}, 金额: ${claim.amount}`);
});

// 订阅赔付事件
const unsub3 = ins.onPayout((claim, amount) => {
  console.log(`赔付完成: ${claim.id}, 金额: ${amount}`);
});

// 取消订阅
unsub1();
```

### 8.5 报表查询

```typescript
// 池子统计
const poolStats = ins.getProductStats('smart_contract');
// { totalStaked: '50000', totalCoverage: '1000', utilizationRate: '0.02', ... }

// 用户统计
const userStats = ins.getUserStats('alice');
// { policies: 1, activePolicies: 1, claims: 1, coverage: '1000', ... }

// 风险评估
const pricing = ins.getPricingEngine();
const risk = pricing.assessRisk('smart_contract', 'ETH');
// { score: 36, factors: {...}, recommendedRate: 0.01632, ... }
```

### 8.6 直接使用子服务

```typescript
import {
  RiskPricingEngine,
  PolicyService,
  ClaimEngine,
  PoolService,
  InMemoryWallet,
} from '@/lib/insurance';

// 自定义风险定价
const pricing = new RiskPricingEngine({
  customProfiles: {
    smart_contract: {
      smartContractRisk: 80,
      liquidityRisk: 50,
      historicalIncidents: 60,
      auditScore: 50,
      centralizationRisk: 40,
      rateCap: 0.08,
    },
  },
});

// 自定义保单服务
const policySvc = new PolicyService({
  pricingEngine: pricing,
  wallet: new InMemoryWallet(),
});

// 自定义理赔引擎
const claimEngine = new ClaimEngine({
  votingDurationMs: 3 * 24 * 3600_000,  // 3 天投票
  threshold: 0.75,                      // 75% 阈值
});
```

---

## 9. 测试覆盖

测试文件：[`tests/insurance-engine.test.ts`](../../../tests/insurance-engine.test.ts)

测试用例：33 个（验收要求 16+）

| 模块 | 用例数 | 覆盖范围 |
|------|--------|----------|
| RiskPricingEngine | 7 | assessRisk / 风险分排序 / 5 产品费率 / 保费计算 / 输入校验 / 资本要求 |
| PolicyService | 7 | 报价 / 投保 / 14 天内退保 / 14 天外退保 / 按资产过滤 / 即将到期 / 余额不足 |
| ClaimEngine | 6 | 提交 / 金额超限 / 调查 / 加权投票 / approve / reject / payout 完整流程 |
| PoolService | 9 | stake / 多用户份额 / 保费分配 / APY / 排队 / 早退惩罚 / 正常退保 / 扣款 |
| InsuranceEngine | 4 | 完整流程 / 事件订阅 / 池子统计 / 关键常量 |

运行测试：

```bash
npx tsx --test tests/insurance-engine.test.ts
```

---

## 10. 与其它模块集成

### 10.1 永续合约（`src/lib/perp/`）

保险池可对接 perp 引擎的保险基金（insurance fund），提供：
- 强平穿仓的二次保险
- 极端行情下的额外赔付

### 10.2 DeFi 收益（`src/lib/yield/`）

池子资金可对接 yield 模块：
- 闲置资金 stake 到 Lido/Aave/Compound
- 通过 `distributeYield(poolId, amount)` 分配利息给承保人

### 10.3 用户钱包（`src/lib/wallet/`）

`InMemoryWallet` 是演示用，生产应替换为真实钱包服务
支持接口：`debit / credit / getWallet / topUp`

---

## 11. 风险与限制

- **演示降级**：风险因子使用内置映射表，生产应接入第三方数据（DefiLlama、Chainalysis 等）
- **内存存储**：当前所有状态在内存中，重启会丢失；生产需接入数据库
- **签名缺失**：投票地址无加密签名验证；生产应加 EIP-712 签名
- **单链假设**：未对接跨链桥；如需多链保险需扩展
- **预言机缺失**：理赔调查依赖人工 + 投票，生产应接入预言机自动验证

---

## 12. 升级路线

- [ ] 接入 DefiLlama / Chainalysis 实时风险数据
- [ ] 集成 EIP-712 投票签名
- [ ] 支持分层保单（初级/高级）
- [ ] 集成真实钱包（ERC20 USDT 支付）
- [ ] 跨链承保（多链池子聚合）
- [ ] 自动化调查（预言机 + AI 证据分析）
- [ ] 监管合规（KYC / 大额保单审批）
