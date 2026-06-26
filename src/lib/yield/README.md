# DeFi 收益聚合器 (Yield Aggregator)

跨 Lido / Aave / Compound / Curve / Convex 五大协议的收益聚合器。
业务层 `YieldEngine` 统一管理仓位、收益统计、自动复投、风险评估与资产再平衡。

## 目录结构

```
src/lib/yield/
├── types.ts                    # 类型定义 + 关键常量
├── protocols/                  # 5 大协议适配器
│   ├── lido.ts                 # Lido stETH 流动性质押
│   ├── aave.ts                 # Aave V3 借贷市场
│   ├── compound.ts             # Compound V3 借贷
│   ├── curve.ts                # Curve 稳定币/同类资产 AMM
│   └── convex.ts               # Convex Curve 收益包装
├── yield-scanner.ts            # 跨协议池子扫描 + 比较
├── auto-compounder.ts          # 自动复投调度
├── risk-assessor.ts            # 风险评估
├── yield-engine.ts             # 业务主类
└── index.ts                    # 统一导出
```

## 5 协议对比

| 协议 | 类型 | 底层资产 | 风险 | 演示 APY | 奖励 |
| --- | --- | --- | --- | --- | --- |
| Lido | 流动性质押 | ETH | low | 3.5% | LDO |
| Aave V3 | 借贷 | 多资产 | low | 1.8% - 4.5% | AAVE |
| Compound V3 | 借贷 | 多资产 | low | 2.2% - 4.2% | COMP |
| Curve | 稳定币/同类 AMM | USDC/USDT/DAI/stETH | medium | 1% - 5% | CRV |
| Convex | Curve 包装 | 包装 LP | medium | 3% - 7.5% | CRV + CVX |

## 收益聚合原理

`YieldScanner` 同时调用 5 个协议适配器，归一化为 `YieldPool`，并通过 `getBestYield(asset)` 输出：
- 按 APY 倒序的池子列表
- 最高 / 平均 / 价差
- 推荐理由（如"最高收益且为低风险" / "稳定币池更可控"）

`YieldEngine.recommendBestYield(userId, asset, amount)` 在此基础上叠加用户风险偏好过滤。

## 风险评估模型

`RiskAssessor` 5 维度加权（合约 25% / 流动性 15% / 中心化 20% / 预言机 10% / 无常损失 10%），
加上历史攻击加成（每次 +8）减去审计缓解（每机构 -2.5），
并与基线 `PROTOCOL_RISK_SCORES` 取较大者（更保守）。

```
overallScore = max(weighted + 8*hacks - 2.5*audits, baseline)
```

分层阈值：

| 区间 | Tier |
| --- | --- |
| 0 - 30 | low |
| 31 - 60 | medium |
| 61 - 80 | high |
| 81 - 100 | very_high |

## 自动复投机制

`AutoCompounder.shouldCompound()` 三重门控：

1. **收益阈值**：`pendingRewards * priceUsd >= COMPOUND_MIN_THRESHOLD_USD`（$1）
2. **时间间隔**：`now - lastCompoundTime >= COMPOUND_MIN_INTERVAL_MS`（24h）
3. **Gas 上限**：`currentGasGwei <= COMPOUND_GAS_PRICE_MAX_GWEI`（50 Gwei）
4. **状态门**：`position.status === 'active'`

通过门控的仓位会被加入复投批次：
- **同协议多仓位** 走 `batchExecutor` 合并为单次 RPC 调用
- **跨协议仓位** 走 `executor` 串行执行

事件：
- `compound` —— 每次复投完成
- `triggered` —— 本轮触发的仓位列表
- `error` —— 调度异常

## 迁移策略

`YieldEngine.migrate(positionId, targetProtocol, targetPoolSymbol)` 步骤：
1. 提取旧仓位本金
2. 关闭旧仓位 `status = 'closed'`
3. 重新 `deposit()` 到目标协议/池子
4. 记录 `migrate` 类型操作

`YieldEngine.optimizeAllocation(userId)` 自动扫描用户活跃仓位，
对每个仓位查找同风险分层下 APY 高出 5% 的目标池，输出 `RebalanceAction[]`。

## 关键常量

```ts
COMPOUND_MIN_THRESHOLD_USD  = 1;             // 收益 > $1
COMPOUND_MIN_INTERVAL_MS    = 24 * 3600_000; // 24h 间隔
COMPOUND_GAS_PRICE_MAX_GWEI = 50;            // gas 上限
YIELD_SCAN_CACHE_TTL_MS     = 5 * 60_000;    // 5min 缓存
RISK_LOW_MAX_SCORE          = 30;
RISK_MEDIUM_MAX_SCORE       = 60;
RISK_HIGH_MAX_SCORE         = 80;
```

## 完整调用示例

```ts
import { createYieldEngine, createRiskAssessor } from '@/lib/yield';

const engine = createYieldEngine();

// 1) 扫描 USDC 最佳池子
const best = await engine.getScanner().getBestYield('USDC');
console.log('最高收益:', best.best.protocol, best.best.apy);

// 2) 设置用户风险偏好
engine.setUserRiskPreference('user_001', 'low');

// 3) 推荐最优配置
const rec = await engine.recommendBestYield('user_001', 'USDC', 10_000);
console.log('推荐:', rec.protocol, rec.pool.symbol, rec.expectedApy);

// 4) 存款
const pos = await engine.deposit('user_001', rec.protocol, rec.pool.symbol, '10000');

// 5) 启用自动复投
engine.enableAutoCompound(pos.id);
engine.startAutoCompoundLoop();

// 6) 查询统计
const stats = await engine.getStats('user_001');
console.log('总价值:', stats.totalValue, '预计年化:', stats.projectedYearly);

// 7) 风险评估
const risk = await engine.getRiskAssessor().assessProtocol(rec.protocol);
console.log('协议风险:', risk.overallScore, '/ 100');

// 8) 再平衡建议
const rebalances = await engine.optimizeAllocation('user_001');
for (const r of rebalances.rebalances) {
  console.log('建议迁移到', r.toProtocol, r.toPoolSymbol, r.reason);
}

// 9) 迁移仓位
if (rebalances.rebalances.length > 0) {
  const newPos = await engine.migrate(pos.id, rebalances.rebalances[0].toProtocol, rebalances.rebalances[0].toPoolSymbol);
  console.log('迁移完成，新仓位:', newPos.id);
}

// 10) 领取收益
const claim = await engine.claimRewards(pos.id);
console.log('已领取:', claim.amount);

// 11) 提取本金
await engine.withdraw(pos.id, '5000');

// 12) 停止自动复投循环
engine.stopAutoCompoundLoop();
```

## 演示降级

所有适配器在不接入真实链上 RPC 时返回稳定 mock 数据：
- Lido stETH APY = 3.5%
- Aave USDC supply = 4.5%
- Compound USDC supply = 4.2% + 1.2% COMP 奖励
- Curve 3pool = 1.2% base + 3.8% CRV
- Convex 3pool = 1.2% + 4.5% CRV + 1.8% CVX

可通过 `forceFallback: true` 强制演示模式。

## 测试

```bash
node --test --import tsx tests/yield-engine.test.ts
```

覆盖 30+ 用例：
- 5 协议适配器（stake / supply / withdraw / getApy / getBalance / claimRewards）
- YieldScanner（scanPools / getBestYield / getTopPools / 缓存）
- AutoCompounder（4 重门控 / 批量）
- RiskAssessor（5 维评分 / 缓存）
- YieldEngine（deposit / withdraw / claim / migrate / getStats / recommend / optimize）
