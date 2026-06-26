# DAO 治理系统

> SMY 交易所链上治理与社区投票系统：治理代币 + 提案管理 + 链上投票 + 委托投票 + 国库管理 + 提案执行

## 目录

- [基础概念](#基础概念)
- [治理代币](#治理代币)
- [提案流程](#提案流程)
- [投票模型](#投票模型)
- [委托机制](#委托机制)
- [国库管理](#国库管理)
- [完整调用示例](#完整调用示例)
- [治理最佳实践](#治理最佳实践)
- [模块结构](#模块结构)

---

## 基础概念

**DAO（Decentralized Autonomous Organization）** 是通过智能合约运行的组织，规则和决策通过代币持有者投票执行。

SMY DAO 核心组件：

| 组件 | 作用 |
| --- | --- |
| 治理代币 (SMY) | 投票权凭证 |
| 提案 (Proposal) | 治理动作的载体 |
| 投票 (Vote) | 社区表达意愿 |
| 委托 (Delegation) | 投票权转移 |
| 国库 (Treasury) | 协议资金池 |
| 时间锁 (Timelock) | 执行延迟保护 |

### 关键参数

| 常量 | 值 | 说明 |
| --- | --- | --- |
| `DAO_PROPOSAL_THRESHOLD` | 1000 SMY | 提案门槛 |
| `DAO_VOTING_PERIOD_BLOCKS` | 45,818 (~7 天) | 投票期 |
| `DAO_TIMELOCK_DELAY_BLOCKS` | 17,280 (~2.5 天) | 时间锁延迟 |
| `DAO_QUORUM_PERCENT` | 4% | 法定票数 |
| `DAO_PROPOSAL_THRESHOLD_VOTE` | 0.5 (50%) | 通过率 |

---

## 治理代币

`GovernanceTokenService` 管理 SMY 代币：

- `mint(to, amount)` — 增发（仅 owner）
- `burn(from, amount)` — 销毁
- `transfer(from, to, amount)` — 转账
- `balanceOf(address)` — 余额
- `totalSupply()` — 总供应
- `getVotingPower(address)` — 投票权 = 自身 + 接受委托 − 委托出去
- `getQuorum()` — 法定票数（4% supply）
- `meetsProposalThreshold(address)` — 是否满足提案门槛

```ts
import { GovernanceTokenService } from '@/lib/dao';

const token = new GovernanceTokenService({ initialSupply: '1000000' });
token.mint('0xalice', '5000');
console.log(token.balanceOf('0xalice'));       // 5000
console.log(token.getVotingPower('0xalice'));  // 5000
console.log(token.meetsProposalThreshold('0xalice')); // true
```

---

## 提案流程

### 状态机

```
draft → pending → active → succeeded / defeated
                              ↓
                            queued → executed
   任何阶段 → cancelled
```

### 提案类型

| Type | 用途 |
| --- | --- |
| `parameter` | 参数调整（费率、阈值等） |
| `treasury` | 国库支出 |
| `upgrade` | 合约升级 |
| `integration` | 集成合作 |
| `listing` | 代币上线 |
| `community` | 社区治理 |

### 提案 API

```ts
const proposal = new ProposalService({ /* ... */ });

// 创建
const p = proposal.createProposal({
  proposer: '0xalice',
  proposerUserId: 'u_alice',
  type: 'treasury',
  title: '资助生态项目',
  description: '## 背景\n...',
  targets: ['0xtreasury'],
  values: ['0'],
  signatures: ['transfer(address,uint256)'],
  calldatas: ['0x...'],
});

// 激活
proposal.activateProposal(p.id);

// 投票结束
const fin = proposal.finalize(p.id);  // succeeded | defeated

// 排队 + 执行
proposal.queueProposal(p.id);
await proposal.executeProposal(p.id);
```

### 提案门槛

- 提案人投票权 ≥ `DAO_PROPOSAL_THRESHOLD` (1000 SMY)
- 法定票数满足（≥ 4% supply）
- 通过率 > 50%（for / (for + against) > 0.5）

---

## 投票模型

`VotingService` 支持 4 种投票权重模型：

### 1. Token Weighted（默认）

```ts
weight = votingPower
```

最简单：代币越多，权重越大。

### 2. One Person One Vote

```ts
weight = 1
```

完全平等：忽略代币数量。

### 3. Quadratic（推荐用于大型决策）

```ts
weight = sqrt(votingPower) * coefficient
```

防止大户垄断：买 N 票要花 N² 的钱。

### 4. Conviction

```ts
weight = power * min(time / decay, 1)
```

持续投票时间越长，权重越高（最长 14 天达到 100%）。

### 投票 API

```ts
const voting = new VotingService();

// 链上投票
voting.castVote({
  proposalId: p.id,
  voter: '0xalice',
  voterUserId: 'u_alice',
  option: 'for',  // 'for' | 'against' | 'abstain'
  weight: '5000',
  reason: '支持生态发展',
});

// 离线签名投票
voting.castVoteWithSignature({
  proposalId: p.id,
  voter: '0xalice',
  voterUserId: 'u_alice',
  option: 'for',
  weight: '5000',
  signature: '0x...',  // EIP-712 签名
});

// 统计
const stats = voting.getVoteStats(p.id);
console.log(stats.distribution.for.weight);  // 8000
console.log(stats.topVoters);                // Top 10
```

---

## 委托机制

`DelegationService` 实现投票权委托（类似 Compound / Uniswap）：

```ts
const del = new DelegationService();

// 委托
del.delegate('0xcharlie', '0xbob', '1500');

// 查询
del.getDelegations('0xcharlie');    // 我委托出去的
del.getDelegators('0xbob');          // 委托给我的
del.getTotalDelegatedTo('0xbob');    // 总委托量

// 取消
del.undelegate('0xcharlie', '0xbob');
```

**特性**：
- 一人同时只能委托给一个地址
- 委托不影响代币所有权（仍可转账）
- 投票权 = balance + 接受委托 − 委托出去

---

## 国库管理

`TreasuryService` 管理协议资金：

```ts
const t = new TreasuryService({
  proposalVerifier: {
    isPassed: (id) => /* 提案是否已通过 */,
  },
});

// 入金
t.deposit('USDT', '10000', 'protocol fee');

// 出金（需提案）
await t.withdraw('USDT', '1000', '0xrecipient', 'grant', 'proposal_id');

// 报表
const report = t.getMonthlyReport('2026-06');
// { inflow: '50000', outflow: '10000', net: '40000', count: 5 }

const runway = t.getRunway();  // 月数（按 50000 USD/月烧钱）
const history = t.getHistory(30);  // 最近 30 天交易
```

**多资产支持**：USDT / USDC / DAI / ETH / BTC ... 演示环境用 `setPriceUsd()` 设置价格。

---

## 完整调用示例

### 1. 启动 DAO

```ts
import { DaoEngine } from '@/lib/dao';

const dao = new DaoEngine({
  initialTokenSupply: '1000000',  // 初始 100 万 SMY
  initialTreasuryBalances: [
    { asset: 'USDT', amount: '500000' },
    { asset: 'ETH', amount: '100' },
  ],
});
```

### 2. 注册用户 + 分配代币

```ts
dao.registerUser('u_alice', '0xalice');
dao.registerUser('u_bob', '0xbob');
dao.registerUser('u_charlie', '0xcharlie');

dao.mintTo('0xalice', '5000');
dao.mintTo('0xbob', '3000');
dao.mintTo('0xcharlie', '2000');
```

### 3. 委托（可选）

```ts
// charlie 委托给 bob
dao.delegate('0xcharlie', '0xbob', '2000');
// bob 的投票权 = 3000 + 2000 = 5000
```

### 4. 创建 + 激活提案

```ts
const p = dao.propose({
  proposer: '0xalice',
  proposerUserId: 'u_alice',
  type: 'treasury',
  title: '资助开发者 A',
  description: '拨款 10000 USDT 给开发者 A 推进协议升级',
  targets: ['0xtreasury'],
  values: ['0'],
  signatures: ['transfer(address,uint256)'],
  calldatas: ['0x...'],
});

dao.activate(p.id);
```

### 5. 投票

```ts
dao.vote({ proposalId: p.id, voter: '0xalice', voterUserId: 'u_alice', option: 'for', weight: '5000', reason: '支持' });
dao.vote({ proposalId: p.id, voter: '0xbob', voterUserId: 'u_bob', option: 'for', weight: '5000' });
dao.vote({ proposalId: p.id, voter: '0xcharlie', voterUserId: 'u_charlie', option: 'against', weight: '0' });
```

### 6. 投票结束 + 排队 + 执行

```ts
const fin = dao.finalize(p.id);
if (fin.status === 'succeeded') {
  dao.queue(p.id);

  // 等时间锁（演示可缩短）
  // 生产环境：约 2.5 天
  const exec = await dao.executeProposal(p.id);

  // 7. 国库支出
  await dao.treasuryWithdraw('USDT', '10000', '0xdeveloper_a', 'grant', exec.id);
}
```

### 8. 监听事件

```ts
const off1 = dao.onProposalUpdate((p) => console.log('Proposal:', p.status));
const off2 = dao.onVoteUpdate((v, pid) => console.log('Vote:', v.option, v.weight));
const off3 = dao.onTreasuryUpdate((t) => console.log('Treasury:', t.totalValue));

// 取消订阅
off1(); off2(); off3();
```

### 9. 治理统计

```ts
const stats = dao.getGovernanceStats();
// {
//   totalProposals: 5,
//   activeProposals: 2,
//   executedProposals: 2,
//   totalVotes: 23,
//   totalMembers: 12,
//   participation: 0.18,
//   treasuryValue: '500000',
//   tokenSupply: '1000000',
//   circulatingSupply: '1000000',
//   quorum: '40000',
//   updatedAt: 1719000000000,
// }
```

---

## 治理最佳实践

### 1. 提案设计

- **清晰标题**：30 字以内说明目的
- **完整描述**：Markdown 格式，背景/方案/预算/时间表
- **可执行性**：链上 actions 必须经过审计
- **可衡量 KPI**：明确成功标准

### 2. 投票策略

- **小决策用 token_weighted**（默认）
- **大决策用 quadratic**（防垄断）
- **持续关注用 conviction**（奖励长期持有者）

### 3. 委托管理

- 选择活跃、专业的代理人
- 定期 review 委托
- 紧急议题可紧急撤销委托

### 4. 国库管理

- 单笔支出上限：建议 ≤ 国库 5%
- 月度预算：明确 burn rate
- 透明度：所有支出绑定 proposalId

### 5. 时间锁

- 默认 2.5 天延迟（链上）
- 紧急安全修复可由多签加速
- 用户可在此期间 exit

### 6. 安全

- 关键合约多签管理
- 提案执行前自动审计
- 监控异常投票模式

---

## 模块结构

```
src/lib/dao/
├── types.ts                 # 类型 + 常量
├── token-service.ts         # 治理代币
├── delegation-service.ts    # 委托
├── proposal-service.ts      # 提案 + 状态机
├── voting-service.ts        # 投票 + 4 模型
├── treasury-service.ts      # 国库
├── dao-engine.ts            # 业务主类
└── index.ts                 # 统一导出
```

## 测试

```bash
npx tsx --test tests/dao-engine.test.ts
```

用例覆盖：
- GovernanceTokenService：mint / transfer / burn / votingPower / quorum / threshold
- DelegationService：delegate / undelegate / getDelegations / 自委托拒绝
- ProposalService：createProposal / 状态机 / cancel / queue / execute
- VotingService：castVote / 4 种权重模型 / getVoteStats / 改票
- TreasuryService：deposit / withdraw / getRunway / getMonthlyReport
- DaoEngine：完整流程 + 治理统计 + 委托投票权
- 关键常量校验

## 兼容性

- 与 Compound / Uniswap Governor 兼容
- 与 OpenZeppelin ERC20Votes 兼容
- 与 EIP-712 离线签名兼容
- 与 Snapshot 治理快照兼容
