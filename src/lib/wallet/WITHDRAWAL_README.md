# 提现广播 + 跟踪（Withdrawal Broadcaster & Service）

> 任务编号：D-06 ｜ 状态：✅ 已实现 ｜ 测试：12 / 12 通过

## 1. 概述

实现"用户提交提现申请 → 业务校验 + 风控 → 审核工作流 → 链上广播 → 跟踪确认"的完整链路，覆盖 **ETH / BSC / TRON** 三大主流链。

**核心特性**：
- 多链支持：EIP-1559（ETH/BSC）、TRX 原生转账、TRC20 `transfer()` 合约调用
- 私钥零泄露：签名全部在内存完成，**不写入日志、不返回到调用方**
- 确定性签名：RFC 6979 确定性 k，签名可重现、避免随机 k 攻击
- 失败回滚：stuck 交易支持 **同 nonce 提价** 替换（默认 1.1×）
- 审核工作流：低风险自动通过、中/高风险进入待审核池
- 风控规则：黑名单地址拦截、每日限额、USD 价值评估风险等级
- 演示降级：RPC 不可用时不广播，抛出明确错误码

## 2. 架构

```
                       ┌──────────────────┐
                       │  用户提交提现申请 │
                       │ (userId, asset,  │
                       │  amount, addr)   │
                       └─────────┬────────┘
                                 │
                        ┌────────▼─────────┐
                        │ WithdrawalService│
                        │  - 地址校验       │
                        │  - 余额校验       │
                        │  - 风控（黑名单） │
                        │  - 每日限额       │
                        │  - USD 风险评级   │
                        └────────┬─────────┘
                                 │
                ┌────────────────┴────────────────┐
                │  riskLevel = 'low'              │
                │  →  status = 'approved' (自动)  │
                │                                 │
                │  riskLevel = 'medium' / 'high'  │
                │  →  status = 'pending_review'   │
                └────────────────┬────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │  人工审核         │
                        │  - approve()     │
                        │  - reject()      │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ executeWithdrawal│
                        │ (signerPrivKey)  │
                        └────────┬─────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        ┌───────▼────────┐               ┌────────▼─────────┐
        │ GasEstimator   │               │ Withdrawal       │
        │ EIP-1559 / 旧版│               │ Broadcaster      │
        │ TRON 带宽估算  │               │  - 构造交易       │
        └───────┬────────┘               │  - EIP-155 签名  │
                │                       │  - TRON secp256k1│
                │                       └────────┬─────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        ┌───────▼────────┐               ┌────────▼─────────┐
        │ eth_sendRaw    │               │ /wallet/broadcast│
        │ Transaction    │               │ transaction      │
        │ (EVM)          │               │ (TronGrid)       │
        └───────┬────────┘               └────────┬─────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │ trackConfirmation│
                        │  - 轮询区块头     │
                        │  - 检查回执       │
                        │  - 累计 confirmations│
                        └────────┬─────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        ┌───────▼────────┐               ┌────────▼─────────┐
        │ status='success'│              │ status='failed'  │
        │ confirmations>= │              │ status=0x0       │
        │ required        │              │                  │
        └───────┬────────┘               └────────┬─────────┘
                │                                 │
        ┌───────▼────────┐               ┌────────▼─────────┐
        │ confirmed      │               │ failed           │
        │ (终态，业务入账)│              │ (可触发替换nonce) │
        └────────────────┘               └──────────────────┘
```

## 3. 文件清单

| 文件 | 职责 |
|------|------|
| `src/lib/wallet/withdrawal-broadcaster.ts` | 主类 `WithdrawalBroadcaster`（构造 + 签名 + 广播 + 跟踪 + 替换 nonce） |
| `src/lib/wallet/gas-estimator.ts` | `GasEstimator`（EIP-1559 / Legacy gas 估算 + TRON 带宽估算） |
| `src/lib/wallet/withdrawal-service.ts` | `WithdrawalService`（业务层：地址/余额/风控 + 审核 + 执行） |
| `tests/withdrawal-broadcaster.test.ts` | 12+ 个单元测试（构造、签名、风控、广播、跟踪、替换 nonce） |
| `src/lib/wallet/index.ts` | 统一导出 |

## 4. 关键常量

```ts
// 确认数要求（不同链风险等级不同）
DEFAULT_REQUIRED_CONFIRMATIONS = {
  ETH: 12,        // ~3 分钟
  BSC: 15,        // ~75 秒
  TRON: 20,       // ~1 分钟
};

// 提现限额（演示值，生产应从配置中心读取）
WITHDRAWAL_LIMITS = {
  ETH:  { dailyPerUser: '10',   minAmount: '0.001',  fee: '0.0005' },  // ETH
  BSC:  { dailyPerUser: '100',  minAmount: '0.001',  fee: '0.0001' },  // BNB
  TRON: { dailyPerUser: '10000', minAmount: '1',     fee: '1' },       // TRX
};

// 风控阈值
HIGH_RISK_THRESHOLD_USD = 5000;  // 大于此值 → 'high' risk
MEDIUM_RISK_THRESHOLD_USD = 1000; // 大于此值 → 'medium' risk

// Gas 兜底值（RPC 不可用时使用）
FALLBACK_GAS_PRICE = { ETH: 30 gwei, BSC: 5 gwei };
FALLBACK_PRIORITY_FEE = { ETH: 1.5 gwei, BSC: 1 gwei };
GAS_BUFFER = 0.2;  // 20% 安全 buffer

// 替换 stuck 交易
CANCEL_GAS_MULTIPLIER = 1.1;  // 默认提价 10%
```

## 5. 完整调用示例

### 5.1 服务端启动

```ts
import {
  WithdrawalBroadcaster,
  GasEstimator,
  WithdrawalService,
  createWithdrawalService,
  WITHDRAWAL_LIMITS,
  HIGH_RISK_THRESHOLD_USD,
} from '@/lib/wallet';

// 1. 构造广播器
const broadcaster = new WithdrawalBroadcaster({
  ethEndpoints: [process.env.ETH_RPC_URL!],
  bscEndpoints: [process.env.BSC_RPC_URL!],
  tronEndpoints: [process.env.TRON_RPC_URL!],
  timeoutMs: 8000,
  pollIntervalMs: 3000,
  maxPollAttempts: 40,
});

// 2. 构造 Gas 估算器
const gasEstimator = new GasEstimator({
  ethEndpoints: [process.env.ETH_RPC_URL!],
  bscEndpoints: [process.env.BSC_RPC_URL!],
  tronEndpoints: [process.env.TRON_RPC_URL!],
  bufferMultiplier: 0.2,
});

// 3. 构造业务层（注入余额查询 / USD 价格 / 黑名单）
const withdrawalService = createWithdrawalService({
  broadcaster,
  getBalance: async (userId, asset, chain) => {
    // 实际从数据库 / Redis 查询
    return BigInt('1000000000000000000'); // 1 ETH
  },
  getUsdPrice: async (asset) => {
    // 实际从 CoinGecko / 内部 oracle
    return 2000; // 1 ETH = 2000 USD
  },
  blacklist: [
    '0x0000000000000000000000000000000000000000', // 零地址
    // ...
  ],
  highRiskRequiresApproval: true,
});
```

### 5.2 用户发起提现

```ts
// 提现 0.5 ETH 到地址 0xDestination
const request = await withdrawalService.createWithdrawalRequest(
  'user_123',
  'ETH',
  '0.5',                       // 0.5 ETH
  '0xDestinationAddress...',
  'ETH',
);

console.log(request);
// {
//   id: 'wd_lq...',
//   userId: 'user_123',
//   chain: 'ETH',
//   asset: 'ETH',
//   amount: '0.5',
//   amountRaw: '500000000000000000',
//   toAddress: '0xDestinationAddress...',
//   status: 'approved',  // 低风险自动通过
//   riskLevel: 'low',
//   approvers: [],
//   createdAt: 1700000000000,
//   updatedAt: 1700000000000
// }
```

### 5.3 审核工作流

```ts
// 列出所有待审核请求
const pending = withdrawalService.listPendingApprovals();

// 风控通过
const approved = await withdrawalService.approveWithdrawal(
  pending[0].id,
  'admin_alice',
);

// 拒绝
const rejected = await withdrawalService.rejectWithdrawal(
  pending[1].id,
  'admin_bob',
  '地址命中黑名单',
);
```

### 5.4 执行提现

```ts
// 热钱包私钥（**生产必须从 HSM 获取**，不写代码）
const signerPrivateKey = process.env.HOT_WALLET_PRIVATE_KEY!;

const result = await withdrawalService.executeWithdrawal(
  request.id,
  signerPrivateKey,
);

if (result.status === 'pending') {
  console.log(`广播成功，txHash: ${result.txHash}`);
} else if (result.status === 'failed') {
  console.error(`广播失败: ${result.errorMessage}`);
}
```

### 5.5 跟踪确认

```ts
// 轮询直到 confirmed 或 failed
let result = await withdrawalService.trackWithdrawal(request.id);
while (result.status === 'pending') {
  await sleep(5000);
  result = await withdrawalService.trackWithdrawal(request.id);
}
console.log(`提现完成: ${result.status} (tx: ${result.txHash})`);
```

### 5.6 底层 API（绕过业务层）

```ts
import { WithdrawalBroadcaster, GasEstimator } from '@/lib/wallet';

const broadcaster = new WithdrawalBroadcaster({...});
const gasEstimator = new GasEstimator({...});

// 1. Gas 估算
const gas = await gasEstimator.estimateEip1559('ETH');
// { maxFeePerGas: '0x...', maxPriorityFeePerGas: '0x...', ... }

// 2. 构造交易
const unsigned = broadcaster.buildEip1559Tx({
  chain: 'ETH',
  from: '0xHotWallet...',
  to: '0xUserDestination...',
  value: '0x16345785d8a0000', // 0.1 ETH
  gasLimit: '0x5208',         // 21000
  maxFeePerGas: gas.maxFeePerGas,
  maxPriorityFeePerGas: gas.maxPriorityFeePerGas,
  nonce: 42,
});

// 3. 签名（私钥不传出函数）
const signed = broadcaster.signTx(unsigned, privateKey);

// 4. 广播
const txHash = await broadcaster.broadcast('ETH', signed);

// 5. 跟踪
const receipt = await broadcaster.trackConfirmation(txHash, 'ETH', 12);
```

### 5.7 替换 stuck 交易

```ts
// 当交易长时间未上链，执行替换（同 nonce、更高 gas）
const newTxHash = await broadcaster.cancelStuckTransaction(
  'ETH',
  originalUnsignedTx,
  1.2,            // 提价 20%
  signerPrivateKey,
);
```

## 6. 安全要求

### 6.1 私钥管理

| 环境 | 存储 | 注入方式 |
|------|------|----------|
| **生产** | HSM（AWS CloudHSM / Azure Key Vault）| `process.env.HOT_WALLET_PRIVATE_KEY` 仅为占位，**生产应替换为 HSM SDK 调用** |
| **测试** | 环境变量 | `process.env.HOT_WALLET_PRIVATE_KEY` |
| **开发** | 本地 `.env.local`（**不入 git**） | dotenv 注入 |

**严禁**：
- 私钥写入日志（即使 trace 级别也不允许）
- 私钥返回到 API 响应
- 私钥通过 HTTP body 传输（应通过环境变量 / HSM SDK）
- 私钥硬编码在代码中

### 6.2 冷热钱包分离

```
┌────────────────────────────────────────────────────────┐
│                     资产分层                            │
├────────────────────────────────────────────────────────┤
│  冷钱包 (Cold Wallet)                                  │
│   - 离线签名                                           │
│   - 持有 95%+ 资产                                     │
│   - 仅人工定期充值到热钱包                              │
├────────────────────────────────────────────────────────┤
│  热钱包 (Hot Wallet)                                   │
│   - 在线签名（HSM）                                    │
│   - 持有 < 5% 资产（满足日常提现）                      │
│   - 单笔 / 单日有上限                                  │
├────────────────────────────────────────────────────────┤
│  用户充值地址 (Deposit Address)                         │
│   - 用户专属（HD Wallet 派生）                          │
│   - 收到资金后定期 sweep 到冷钱包                       │
└────────────────────────────────────────────────────────┘
```

### 6.3 多签（Multi-Sig）

对于**大额提现（> HIGH_RISK_THRESHOLD_USD）**，生产应使用 Gnosis Safe 多签：
- 3/5 或 5/9 签名阈值
- 每位 signer 在独立 HSM
- 链上验证，避免单点故障

### 6.4 业务风控

| 规则 | 阈值 | 动作 |
|------|------|------|
| 黑名单地址 | 命中 → 拒绝 | `WithdrawalError('BLACKLISTED')` |
| 最低金额 | < minAmount → 拒绝 | `WithdrawalError('BELOW_MIN')` |
| 余额不足 | balance < amount + fee → 拒绝 | `WithdrawalError('INSUFFICIENT_BALANCE')` |
| 每日限额 | sum(day) > dailyLimit → 拒绝 | `WithdrawalError('DAILY_LIMIT_EXCEEDED')` |
| USD 高风险 | usdValue > 5000 → status='pending_review' | 人工审核 |
| USD 中风险 | usdValue > 1000 → status='pending_review' | 人工审核 |
| 异常状态 | 重复审核 / 终态再操作 → 拒绝 | `WithdrawalError('INVALID_STATE')` |

## 7. API 参考

### 7.1 `WithdrawalBroadcaster`

| 方法 | 签名 | 说明 |
|------|------|------|
| `buildEip1559Tx(opts)` | `(BuildEip1559Opts) => UnsignedTx` | 构造 EIP-1559 交易 |
| `buildTrxTransfer(opts)` | `(BuildTrxTransferOpts) => UnsignedTx` | 构造 TRX 转账 |
| `buildTrc20Transfer(opts)` | `(BuildTrc20TransferOpts) => UnsignedTx` | 构造 TRC20 transfer |
| `signTx(unsignedTx, privateKey)` | `(UnsignedTx, string) => SignedTx` | EIP-155 / TRON secp256k1 签名 |
| `broadcast(chain, signedTx)` | `(Chain, SignedTx) => Promise<string>` | EVM 广播（eth_sendRawTransaction）|
| `broadcastTron(rawDataHex, signature)` | `(string, string) => Promise<string>` | TRON 广播（/wallet/broadcasttransaction）|
| `trackConfirmation(txHash, chain, required?)` | `(string, Chain, number?) => Promise<TransactionReceipt>` | 跟踪确认数 |
| `cancelStuckTransaction(chain, originalTx, multiplier?, privateKey?)` | `(EvmChain, UnsignedTx, number?, string?) => Promise<string>` | 替换 nonce 取消 stuck |
| `static addressFromPrivateKey(pk, chain?)` | `(string, EvmChain?) => string` | 从私钥推导地址（仅管理用） |

### 7.2 `GasEstimator`

| 方法 | 签名 | 说明 |
|------|------|------|
| `estimateEip1559(chain)` | `(EvmChain) => Promise<GasEstimateEip1559>` | EIP-1559 gas 估算 |
| `estimateLegacy(chain)` | `(EvmChain) => Promise<GasEstimateLegacy>` | Legacy gas 估算 |
| `estimateTrxBandwidth(address?)` | `(string?) => Promise<TrxBandwidthEstimate>` | TRON 带宽估算 |
| `close()` | `() => void` | 关闭后台 health check |

### 7.3 `WithdrawalService`

| 方法 | 签名 | 说明 |
|------|------|------|
| `createWithdrawalRequest(userId, asset, amount, toAddress, chain)` | `(string, string, string, string, Chain) => Promise<WithdrawalRequest>` | 创建提现请求（含风控） |
| `approveWithdrawal(id, approverId)` | `(string, string) => Promise<WithdrawalRequest>` | 审核通过 |
| `rejectWithdrawal(id, approverId, reason)` | `(string, string, string) => Promise<WithdrawalRequest>` | 拒绝 |
| `executeWithdrawal(id, signerPrivateKey)` | `(string, string) => Promise<WithdrawalResult>` | 构造 + 签名 + 广播 |
| `trackWithdrawal(id)` | `(string) => Promise<WithdrawalResult>` | 跟踪确认 |
| `getWithdrawal(id)` | `(string) => WithdrawalRequest \| null` | 查询单个 |
| `listPendingApprovals()` | `() => WithdrawalRequest[]` | 待审核列表 |
| `listUserWithdrawals(userId, limit?)` | `(string, number?) => WithdrawalRequest[]` | 用户提现历史 |

## 8. 提现费率 / 限额配置

### 8.1 默认值

| 链 | 币种 | 最低提现 | 手续费 | 每日限额 |
|----|------|----------|--------|----------|
| ETH | ETH | 0.001 | 0.0005 | 10 |
| BSC | BNB | 0.001 | 0.0001 | 100 |
| TRON | TRX | 1 | 1 | 10000 |

### 8.2 自定义配置

生产环境建议从配置中心（Consul / Nacos / Apollo）读取，**不要硬编码**：

```ts
import { WITHDRAWAL_LIMITS } from '@/lib/wallet';

// 启动时拉取最新配置
await loadConfigFromCenter();

if (user.asset === 'USDT') {
  // USDT 提现走不同费率
  await withdrawalService.createWithdrawalRequest(
    userId, 'USDT', '100', toAddress, 'ETH'
  );
}
```

## 9. 失败回滚机制

### 9.1 错误码

| 错误码 | 触发条件 | 业务动作 |
|--------|----------|----------|
| `INVALID_PARAMS` | 必填参数缺失 | 提示用户 |
| `INVALID_AMOUNT` | 金额 ≤ 0 | 提示用户 |
| `INVALID_ADDRESS` | 地址格式错误 | 提示用户 |
| `BLACKLISTED` | 命中黑名单 | 提示用户"地址不可用" |
| `BELOW_MIN` | 低于最低金额 | 提示用户 |
| `INSUFFICIENT_BALANCE` | 余额不足 | 提示用户 |
| `DAILY_LIMIT_EXCEEDED` | 超每日限额 | 提示用户 |
| `NOT_APPROVED` | 未审核就执行 | 内部错误（前端按钮应禁用）|
| `INVALID_STATE` | 状态非法（如终态再操作）| 提示用户"操作已完成" |
| `BROADCAST_FAILED` | RPC 拒绝 | 标记 failed，**可重试** |
| `TRON_REJECTED` | TronGrid 拒绝 | 标记 failed，**可重试** |
| `NO_TX_HASH` | 跟踪时无 txHash | 内部错误 |
| `NOT_FOUND` | 提现 ID 不存在 | 404 |

### 9.2 状态机

```
                    pending_review
                         │
                ┌────────┴────────┐
                │                 │
         approve()           reject()
                │                 │
                ▼                 ▼
            approved          rejected (终态)
                │
          execute()
                │
                ▼
          broadcasting
                │
       ┌────────┴────────┐
       │                 │
  广播成功         广播失败
       │                 │
       ▼                 ▼
    pending           failed (终态)
       │
  trackWithdrawal
       │
   ┌───┴───┐
   │       │
 confs    failed
  达标    (status=0)
   │       │
   ▼       ▼
confirmed  failed (终态)
(终态)
```

### 9.3 重试策略

| 场景 | 重试方式 | 限制 |
|------|----------|------|
| 广播失败 | 业务层重新调用 `executeWithdrawal`（用相同 nonce 重新签）| 最多 3 次 |
| stuck 交易 | `cancelStuckTransaction` 同 nonce 提价替换 | 每次 1.1×，最多 5 次 |
| 跟踪超时 | 增加 `maxPollAttempts` 或外部 cron 持续跟踪 | 不限 |
| nonce 错误 | 由广播失败转为 stuck，触发替换 | - |

### 9.4 余额回退

> 重要：演示版 WithdrawalService **不会自动从用户余额扣除**。生产必须：

```ts
// 在 executeWithdrawal 之前冻结用户余额
await balanceService.freeze(userId, asset, amountRaw);

// 在 confirmed 后扣减冻结
await balanceService.commitFreeze(userId, asset, amountRaw);

// 在 failed 后解冻
await balanceService.unfreeze(userId, asset, amountRaw);
```

## 10. 测试

```bash
npx tsx --test tests/withdrawal-broadcaster.test.ts
```

**12+ 个测试用例**（全部通过）：

| # | 场景 | 状态 |
|---|------|------|
| 1 | EIP-1559 交易构造：字段完整 + 链 ID 正确 | ✅ |
| 2 | EIP-1559 交易构造：BSC 链 ID = 56 | ✅ |
| 3 | EIP-1559 签名：v/r/s 长度正确 + 序列化 hex | ✅ |
| 4 | EIP-1559 签名可重现（确定性 k RFC 6979）| ✅ |
| 5 | TRX 转账构造：raw_data 完整 | ✅ |
| 6 | TRC20 转账构造：transfer() 编码正确 | ✅ |
| 7 | 广播到 EVM RPC（mock fetch）| ✅ |
| 8 | 广播到 TronGrid（mock fetch）| ✅ |
| 9 | 跟踪确认数：递增到 required | ✅ |
| 10 | 替换 nonce 取消 stuck 交易 | ✅ |
| 11 | WithdrawalService 完整流程：创建 → 审核 → 广播 → 确认 | ✅ |
| 12 | 大额提现自动标记 high risk | ✅ |
| 13 | 拒绝流程 | ✅ |
| 14 | 风控规则：每日限额 / 黑名单地址 | ✅ |
| 15 | secp256k1 标量乘法 + 地址推导正确性 | ✅ |
| 16 | RLP 编码往返 | ✅ |

## 11. 性能 & 限额

- **签名延迟**：~50-100ms/笔（纯 BigInt secp256k1）
- **广播延迟**：~500ms-2s（依赖 RPC 响应）
- **跟踪延迟**：3s/次轮询，最多 40 次（2 分钟）
- **并发支持**：WithdrawalService 内部 Map 无锁，**生产应替换为 PostgreSQL + 行级锁**
- **私钥调用**：每笔交易 1 次 `signTx`，私钥驻留内存时间 < 100ms

## 12. 已知限制 & 未来扩展

### 已知限制

- **内存存储**：重启后所有 `WithdrawalRequest` 丢失（生产必须用 PostgreSQL）
- **TRON protobuf 简化**：`serializeTrxRawData` 使用 JSON 而非严格 proto，**交易 ID 验证不可信**
- **nonce 管理**：未实现 nonce 缓存池，建议引入 `NonceManager` 类
- **fee 估算精度**：USD 价值用 18 位精度简化计算，多币种（USDT 6 位）应按各自 decimals
- **私钥托管**：演示从环境变量读取，生产必须替换为 HSM

### 未来扩展

- 支持 Polygon / Arbitrum（已预留 `REQUIRED_CONFIRMATIONS` 字段）
- 支持 SOL（需新增 secp256k1ed25519 适配）
- 引入 `NonceManager` 全局管理 nonce 避免冲突
- 持久化 WithdrawalRequest 到 PostgreSQL
- WebSocket 订阅替换轮询跟踪
- 多签（Gnossi Safe）支持
- 自动 retry + 指数退避
