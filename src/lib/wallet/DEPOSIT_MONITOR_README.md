# 充值到账监听器（Deposit Monitor）

> 任务编号：D-05 ｜ 状态：✅ 已实现 ｜ 测试：18 / 18 通过

## 1. 概述

实现"用户充值 ETH/USDT/TRX 到平台地址 → 30s 内自动入账"的完整链路。

**双链路设计**：
- **Webhook（主链路）**：Alchemy Address Activity 推送，30s 内到达
- **轮询（兜底链路）**：每 15s 扫一次链上区块，断网 / Webhook 漏单时仍可入账

**核心目标**：
- txHash:logIndex 唯一索引防重复
- confirmations 累加，到达 requiredConfirmations 自动 confirmed → credited
- 签名校验防伪造
- 演示降级：Alchemy 不可用时仅靠轮询

## 2. 架构

```
                       ┌──────────────────┐
                       │  用户充值 ETH/USDT │
                       └─────────┬────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                 │
        ┌───────▼────────┐               ┌────────▼─────────┐
        │ Alchemy Webhook│               │   链上节点 (RPC)  │
        │  (主链路 30s)  │               │   (轮询兜底 15s)  │
        └───────┬────────┘               └────────┬─────────┘
                │                                 │
        ┌───────▼──────────┐            ┌─────────▼──────────┐
        │  签名校验         │            │   BlockPoller      │
        │  (HMAC-SHA256)   │            │  - eth_getLogs     │
        └───────┬──────────┘            │  - trongrid API    │
                │                       └─────────┬──────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │  DepositMonitor  │
                        │  - 状态机        │
                        │  - 去重          │
                        │  - 订阅分发      │
                        └────────┬─────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼───────┐
        │  onDeposit() │  │ 业务回调     │  │  入账通知     │
        │  订阅事件     │  │ onCredited  │  │ 邮件/推送/IM │
        └──────────────┘  └─────────────┘  └──────────────┘
```

## 3. 文件清单

| 文件 | 职责 |
|------|------|
| `src/lib/wallet/deposit-monitor.ts` | 主类 `DepositMonitor`（状态机 + 订阅） |
| `src/lib/wallet/poller.ts` | `BlockPoller`（每 15s 扫一次链） |
| `src/lib/wallet/webhook-verifier.ts` | `verifyAlchemySignature`（HMAC-SHA256 校验） |
| `src/lib/wallet/webhook-handler.ts` | 纯函数 `handleAlchemyWebhook`（框架无关入口） |
| `src/app/api/webhooks/alchemy/route.ts` | Next.js App Router 接收端（POST /api/webhooks/alchemy） |
| `tests/deposit-monitor.test.ts` | 18 个单元测试（node:test） |
| `src/lib/wallet/index.ts` | 统一导出 |

## 4. 关键常量

```ts
REQUIRED_CONFIRMATIONS = {
  ETH: 12,        // ~3 分钟
  BSC: 15,        // ~75 秒
  TRON: 19,       // ~1 分钟
  POLYGON: 64,    // ~2 分钟
  ARBITRUM: 64,   // ~16 分钟
};

POLL_INTERVAL_MS = 15_000;  // 15 秒
POLL_BATCH_SIZE  = 100;     // 每次最多扫 100 个区块
```

## 5. 完整调用示例

### 5.1 服务端启动

```ts
import {
  DepositMonitor,
  REQUIRED_CONFIRMATIONS,
  type DepositEvent,
} from '@/lib/wallet/deposit-monitor';

const monitor = new DepositMonitor({
  evmRpc: {
    endpoints: [
      'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
      'https://cloudflare-eth.com',
    ],
    chainName: 'ETH',
  },
  tronRpc: {
    endpoints: ['https://api.trongrid.io'],
    apiKey: 'YOUR_TRONGRID_KEY',
  },
  onError: (err, chain) => {
    console.warn(`[deposit-monitor] ${chain} error:`, err.message);
  },
  onCredited: (event) => {
    // 真正入账到用户余额（调用 DepositService.confirmDeposit）
    console.log(
      `[CREDITED] ${event.amountFormatted} ${event.tokenSymbol} ` +
      `(${event.chain}) to ${event.to} (tx=${event.txHash})`
    );
    // ... 调用 walletService.credit(event.userId, event.amount, event.tokenSymbol)
  },
});

// 启动后台轮询（双链路兜底）
monitor.start();

// 用户注册充值地址时调一次
monitor.watchAddress('0xUserDepositAddress...', 'ETH', 'USDT');
monitor.watchAddress('TUserDepositAddress...', 'TRON', 'USDT');
```

### 5.2 业务系统订阅事件

```ts
const unsubscribe = monitor.onDeposit((event: DepositEvent) => {
  if (event.status === 'pending') {
    // 通知用户"已检测到充值，等待 X 确认"
  } else if (event.status === 'confirmed') {
    // 业务层入账（资金入用户可用余额）
    creditUserBalance(event);
  } else if (event.status === 'credited') {
    // 已入账，触发通知
  }
});

// 取消订阅
unsubscribe();
```

### 5.3 Webhook 端点（Next.js App Router）

路由：`POST /api/webhooks/alchemy`

**Header**：
```
x-alchemy-signature: <hex hmac-sha256>
Content-Type: application/json
```

**环境变量**（`.env.local`）：
```bash
ALCHEMY_WEBHOOK_SIGNING_KEY=whsec_xxxxxxxxxxxxxxxx
```

**响应**：
- 200: `{ ok: true, processed: 1, events: [...] }`
- 401: 签名校验失败
- 400: payload 解析失败
- 503: 未配置 signingKey

### 5.4 纯函数（自建 Express / Koa / 任何 Node 服务）

```ts
import { handleAlchemyWebhook } from '@/lib/wallet/webhook-handler';

app.post('/webhooks/alchemy', async (req, res) => {
  // 关键：必须用 raw body，不能 parse JSON
  const rawBody = (req as any).rawBody;
  const signature = req.headers['x-alchemy-signature'] || '';

  const result = await handleAlchemyWebhook(
    rawBody,
    signature,
    process.env.ALCHEMY_WEBHOOK_SIGNING_KEY!,
    monitor,
  );

  res.status(result.ok ? 200 : 401).json(result);
});
```

### 5.5 手动确认（兜底）

```ts
// 当轮询/Webhook 漏单时，业务可主动确认
const event = monitor.confirmDeposit(
  '0xTxHash...',
  12345678,    // blockNumber
  0,           // logIndex
  12,          // 当前 confirmations
);
```

## 6. Alchemy Webhook 配置步骤

### 6.1 创建 Webhook

1. 登录 [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. 进入 **Webhooks** → **Create Webhook**
3. 选择网络：**Ethereum Mainnet**（+ BSC Mainnet 需分别建）
4. 选择 **Address Activity**
5. 添加监控地址：填入平台所有入账地址（ETH/BSC 各 N 个）
6. 回调 URL：`https://your-domain.com/api/webhooks/alchemy`
7. **勾选"Add Signing Key"** → 生成 `whsec_xxx`
8. 复制 signing key → 写入 `.env` 的 `ALCHEMY_WEBHOOK_SIGNING_KEY`

### 6.2 IP 白名单

Alchemy 出口 IP（按区域，2025 年最新）：
- us-east-1：`44.194.135.0/24`
- us-west-2：`35.89.244.0/24`
- ap-northeast-1：`13.208.0.0/16`

> **注意**：IP 段会变，建议结合签名校验使用，不要单独依赖 IP 白名单。

### 6.3 测试 Webhook

Alchemy Dashboard 提供的 "Send Test Webhook" 按钮会发送预定义的 payload。可用以下方式验证：

```bash
# 1. 本地启动 ngrok
ngrok http 3000

# 2. 配置 Webhook URL 为 ngrok 地址
# 3. 点击 "Send Test Webhook"
# 4. 查看 Next.js 控制台
```

## 7. 状态机

```
                    pending (confirmations < required)
                        │
                        │ confirmations += N
                        ▼
                    confirmed (confirmations >= required)
                        │
                        │ 下一轮 tick
                        ▼
                    credited (creditedAt = now)
                        │
                        │ 业务回调 onCredited 触发
                        ▼
                    (终态，业务系统完成入账)
```

## 8. 故障排查

### 8.1 充值 30s 内未到账

1. **检查 Webhook 接收端**：
   - `GET /api/webhooks/alchemy` → 确认 `running: true`
   - 确认 `ALCHEMY_WEBHOOK_SIGNING_KEY` 已配置
   - 查看日志是否有签名校验失败
2. **检查轮询**：
   - `monitor.getPendingDeposits()` 应能看到 pending 事件
   - 如果 0 → RPC 节点不可用，检查 `endpoints` 配置
3. **检查 Alchemy Dashboard**：
   - Webhook 状态是否 `Active`
   - "Recent Deliveries" 是否 200

### 8.2 重复入账

如果出现重复入账：
1. 检查 `txHash:logIndex` 索引是否生效：`monitor.getAllDeposits().length` 应唯一
2. 检查业务层是否重复消费 `onDeposit` 事件（应在 `status === 'credited'` 时才入账）
3. 重复 webhook 是幂等的（内部去重），但下游业务需要自己做幂等

### 8.3 RPC 节点失败

- `RpcClient` 自动尝试 `endpoints` 列表中的下一个
- `fallbackToDemo: true`（默认）会返回模拟数据（**生产环境建议 false**）
- 断网时只走 Webhook 链路（不影响主流程）

### 8.4 签名校验失败

- 确认使用 **raw body** 校验，不能 parse 后再 stringify
- 确认 signing key 完整（无前后空格、无换行）
- 确认 `x-alchemy-signature` header 名小写（Node fetch 会小写化 header）

## 9. 测试

```bash
npx tsx --test tests/deposit-monitor.test.ts
```

**18 个测试用例**（全部通过）：

| # | 场景 | 状态 |
|---|------|------|
| 1 | watchAddress / unwatchAddress | ✅ |
| 2 | 轮询检测 ERC20 Transfer 事件 | ✅ |
| 3 | 轮询检测 TRC20 Transfer 事件 | ✅ |
| 4-5 | confirmations 累加 + 到达 requiredConfirmations 自动入账 | ✅ |
| 6 | 重复交易去重 | ✅ |
| 7 | Webhook 签名校验：正确签名通过 | ✅ |
| 8 | Webhook 签名校验：错误签名拒绝 | ✅ |
| 9 | Webhook 签名校验：缺失 signature 拒绝 | ✅ |
| 10 | Webhook 触发入账 | ✅ |
| 11 | onDeposit 订阅可多次触发 + 取消订阅 | ✅ |
| 12 | 断网降级（轮询失败不抛错） | ✅ |
| 13 | handleAlchemyWebhook 端到端 | ✅ |
| 14 | handleAlchemyWebhook 接收 hex sha256 signature | ✅ |
| 15 | lastScannedBlock 正确推进 | ✅ |
| 16 | POLL_INTERVAL_MS 默认值正确 | ✅ |
| 17 | REQUIRED_CONFIRMATIONS 常量正确 | ✅ |
| 18 | start/stop 幂等 | ✅ |
| 19 | handleWebhook 幂等去重 | ✅ |

## 10. 性能 & 限额

- **轮询频率**：15s/次，每链每轮最多扫 100 块
- **Alchemy Webhook**：免费档 1000 events/day，Growth 档 100k/day
- **去重集合**：使用 `Set<string>`（txHash:logIndex），O(1) 查询
- **订阅者**：所有 handler 在同一 tick 中串行执行，单个抛错不影响其他

## 11. 未来扩展

- 支持 Polygon / Arbitrum（已预留 `REQUIRED_CONFIRMATIONS.POLYGON/ARBITRUM` 常量）
- 支持 BTC / SOL（需新增 BlockPoller 适配器）
- 持久化 deposits 到数据库（当前仅内存，重启清空）
- WebSocket 替换轮询（Infura / Alchemy 均支持）
