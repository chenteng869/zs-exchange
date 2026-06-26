# 跨链桥接 (Bridge Aggregator)

> SMY 交易所跨链基础设施 — 聚合 4 大主流桥，按策略自动选最优路由。

---

## 1. 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                       应用层 (Admin / H5 / API)              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                      BridgeEngine (业务层)                   │
│  · execute / track / cancel                                  │
│  · 安全检查 (validateRoute / validateAddresses)              │
│  · 历史 + 统计                                               │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                    RouteAggregator (路由层)                  │
│  · getRoutes (4 provider 并行询价)                           │
│  · getBestRoute (cheapest / fastest / most_secure / liquidity)│
│  · getQuote (30s TTL + 5s 缓存)                              │
└──────────┬───────┬───────────┬───────────┬───────────────────┘
           │       │           │           │
           ▼       ▼           ▼           ▼
      ┌────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
      │LayerZero│ │Wormhole│ │Stargate│ │ Across  │
      │  V2     │ │Guardian│ │  Pool  │ │Optimistic│
      │ 85分    │ │ 90分  │ │ 88分   │ │ 82分     │
      └────────┘ └──────┘ └────────┘ └─────────┘
           │       │           │           │
           ▼       ▼           ▼           ▼
       ETH/BSC/Polygon/Arbitrum/Optimism/AVAX/Base
```

## 2. 模块组成

| 文件 | 职责 |
|---|---|
| `types.ts` | 类型定义 + 关键常量 + 预定义代币 |
| `layerzero-bridge.ts` | LayerZero V2 Omnichain 适配器 |
| `wormhole-bridge.ts` | Wormhole Guardian VAA 适配器 |
| `stargate-bridge.ts` | Stargate 流动性池适配器（LayerZero 之上） |
| `across-bridge.ts` | Across Optimistic 适配器（relayer 垫付） |
| `route-aggregator.ts` | 4 provider 并行询价 + 路由选择 + 报价缓存 |
| `bridge-engine.ts` | 业务引擎（交易管理 + 安全检查 + 历史） |
| `index.ts` | 统一导出 |

## 3. 4 桥对比表

| 维度 | LayerZero | Wormhole | Stargate | Across |
|---|---|---|---|---|
| **架构** | Omnichain DVN | Guardian VAA | 流动性池 | Optimistic |
| **速度** | ~3 分钟 | ~5-10 分钟 | **~30 秒** | **~20 秒** |
| **费用** | 中 | 中高 | 中 | **最低** |
| **安全分** | 85 | **90** | 88 | 82 |
| **流动性** | $5M | $3M | **$10M** | $5M |
| **最大单笔** | 500K | 300K | **2M** | 1M |
| **目标链 gas** | 用户付 | 用户付 | 0 (池出) | 0 (relayer 付) |
| **适用场景** | 通用 | 大额高安全 | 稳定币 | 高速小中额 |
| **失败兜底** | Refund | 需手动 redeem | Refund | Relayer 退单 |
| **原生代币** | 否 | 否 | 否 | 否 |

## 4. 路由选择策略

| 策略 | 适用场景 | 倾向 |
|---|---|---|
| `cheapest` | 普通用户、最省 gas | Across > Stargate > LayerZero > Wormhole |
| `fastest` | 时间敏感、套利 | Across > Stargate > LayerZero > Wormhole |
| `most_secure` | 大额、机构 | Wormhole (90) > Stargate (88) > LayerZero (85) > Across (82) |
| `best_liquidity` | 大额、稳定币 | Stargate ($10M) > LayerZero > Across > Wormhole |

## 5. 安全检查清单

`BridgeEngine.validateRoute()` 自动执行：

- [x] **安全分数**：`securityScore >= 70` 否则报错
- [x] **金额下限**：`amount >= route.minAmount`
- [x] **金额上限**：`amount <= route.maxAmount`
- [x] **流动性**：`amount <= route.liquidityAvailable`
- [x] **价格影响**：`bridgeFee / amount > 1%` 警告
- [x] **地址合法性**：EVM 地址格式校验
- [x] **接收方 ≠ 发送方**：防止自转
- [x] **代币支持性**：`checkReceiverSupportsToken()` 验证目标链代币地址
- [x] **同链交易拒绝**：`fromChain !== toChain`
- [x] **状态机**：`pending → submitting → submitted → confirming → completed | failed | refunded`

## 6. 完整调用示例

### 6.1 基本：询价 → 提交 → 跟踪

```ts
import { BridgeEngine } from '@/lib/bridge';

const engine = new BridgeEngine();

// 1) 询价（自动选 cheapest 路由）
const quote = await engine.getAggregator().getQuote({
  fromChain: 1, toChain: 42161,
  fromToken: 'USDT', toToken: 'USDC',
  amount: '1000000000',  // 1000 USDT (6 decimals)
}, 'user_123', 'cheapest');
console.log('最佳路由:', quote?.route.provider, '费用:', quote?.route.totalFee);

// 2) 提交
const tx = await engine.execute({
  userId: 'user_123',
  fromChain: 1, toChain: 42161,
  fromToken: 'USDT', toToken: 'USDC',
  amount: '1000000000',
  senderAddress: '0x1111...',
  receiverAddress: '0x2222...',
  strategy: 'cheapest',
});
console.log('交易:', tx.id, '状态:', tx.status);

// 3) 跟踪（轮询直到完成 / 失败 / 30 分钟超时）
const result = await engine.track(tx.id, 30 * 60_000, 5_000);
console.log('完成:', result.status, '事件:', result.events);
```

### 6.2 高级：指定策略 + 历史查询

```ts
// 大额 → most_secure
const tx = await engine.execute({
  userId: 'whale_001',
  fromChain: 1, toChain: 42161,
  fromToken: 'USDT', toToken: 'USDC',
  amount: '500000000000',  // 500K USDT
  senderAddress: '0xaaaa...',
  receiverAddress: '0xbbbb...',
  strategy: 'most_secure',  // 自动选 Wormhole
});

// 历史查询
const userTxs = engine.getUserTransactions('whale_001', 20);
const ethTxs = engine.getHistoryByChain(1, 7);
const volume = engine.getTotalVolumeByToken('USDT', 7);
```

### 6.3 适配器单独使用

```ts
import { LayerZeroBridge, WormholeBridge } from '@/lib/bridge';

const lz = new LayerZeroBridge({ apiKey: 'mock' });
const fees = await lz.getFees({
  fromChain: 1, toChain: 42161,
  fromToken: 'USDT', toToken: 'USDC',
  amount: '1000000000',
});
const { messageId, txHash } = await lz.send({
  fromChain: 1, toChain: 42161,
  fromAddress: '0x...', toAddress: '0x...',
  fromToken: 'USDT', toToken: 'USDC',
  amount: '1000000000',
});
// 轮询
const events = await lz.pollUntilComplete(messageId, 30 * 60_000, 5_000);
```

## 7. 状态机图

```
                    execute()
                       │
                       ▼
              ┌──────────────┐
              │  submitting  │
              └──────┬───────┘
                     │ send() 成功
                     ▼
              ┌──────────────┐
              │  submitted   │◀────────────┐
              └──────┬───────┘             │
                     │ track() / pollOnce  │
                     ▼                     │
              ┌──────────────┐  attested   │
       ┌──────│  confirming  │─────────────┤
       │      └──────┬───────┘             │
       │             │ completed          │
       │             ▼                     │
       │      ┌──────────────┐             │
       │      │  completed   │             │
       │      └──────────────┘             │
       │                                   │
       │ (send 失败 / 异常)                 │
       ▼                                   │
  ┌────────┐                                │
  │ failed │  (Wormhole 不 redeem)          │
  └────────┘                                │
       │                                   │
       │ refund()                           │
       ▼                                   │
  ┌──────────┐                              │
  │ refunded │  (cancel() only for pending)│
  └──────────┘                              │
       │                                   │
       │ (cancel before submit)            │
       └───────────────────────────────────┘
```

## 8. 失败处理

| 失败点 | 处理 |
|---|---|
| **API 不可达** | `fallbackToDemo = true` 自动返回模拟数据 |
| **路由不安全** | `validateRoute()` 返回 errors → `execute()` 抛错 |
| **submit 失败** | tx.status = `failed`，记录 `errorMessage` |
| **网络超时** | `track()` 30 min 后退出，tx 保持 `submitted` |
| **Wormhole VAA 未完成** | VAA 仍为 `pending`，可重试 `getVAA(sequence)` |
| **Across 退款** | Across 退款 → tx.status = `refunded` |

### 断网降级

- `apiKey` 含 `'mock'` → 启用演示模式
- `apiKey` 真实但 `fetch()` 抛错 → 仍降级（默认 `fallbackToDemo: true`）
- 自定义 `fetchImpl` 用于测试注入失败

## 9. 流动性监控

```ts
// 路由级（实时）
const routes = await engine.getAggregator().getRoutes(opts);
routes.forEach(r => {
  console.log(r.provider, '流动性:', r.liquidityAvailable, '最大:', r.maxAmount);
});

// 业务级（历史）
const ethVolume = engine.getTotalVolumeByToken('USDT', 7);
console.log('近 7 天 ETH 出金 USDT 量:', ethVolume);
```

| Provider | 监控 API | 降级策略 |
|---|---|---|
| LayerZero | `getStatus(messageId)` | INFLIGHT → DELIVERED |
| Wormhole | `getVAA(sequence)` | pending → attested → finalized |
| Stargate | `getStoredStatus(messageId)` | INFLIGHT → DELIVERED |
| Across | `getStatus(depositId)` | pending → filled / expired |

## 10. 关键常量

```ts
BRIDGE_QUOTE_TTL_MS          = 30_000          // Quote 30s 过期
BRIDGE_CACHE_TTL_MS          = 5_000           // 5s 缓存命中
BRIDGE_TRACK_POLL_INTERVAL_MS = 5_000           // 跟踪轮询间隔
BRIDGE_TRACK_TIMEOUT_MS      = 30 * 60_000     // 跟踪超时 30 min
BRIDGE_MAX_PRICE_IMPACT      = 0.01            // 1%
BRIDGE_MIN_SECURITY_SCORE    = 70              // 安全分阈值
SUPPORTED_CHAINS             = [1, 56, 137, 42161, 10, 43114, 8453]
```

## 11. 支持的链

| ChainId | 名称 | 原生币 | LayerZero | Wormhole | Stargate | Across |
|---|---|---|---|---|---|---|
| 1 | Ethereum | ETH | ✓ | ✓ | ✓ | ✓ |
| 56 | BSC | BNB | ✓ | ✓ | ✓ | ✓ |
| 137 | Polygon | MATIC | ✓ | ✓ | ✓ | ✓ |
| 42161 | Arbitrum | ETH | ✓ | ✓ | ✓ | ✓ |
| 10 | Optimism | ETH | ✓ | ✓ | ✓ | ✓ |
| 43114 | Avalanche | AVAX | ✓ | ✓ | ✓ | ✓ |
| 8453 | Base | ETH | ✓ | ✓ | ✓ | ✓ |

## 12. 测试

```bash
npx tsx tests/bridge-engine.test.ts
```

**结果：39 个测试全部通过**
- RouteAggregator 9 个（getRoutes / getBestRoute 4 策略 / getQuote TTL/缓存/地址校验）
- 4 个 Provider 适配器 8 个
- BridgeEngine 业务 + 安全 + 历史 16 个
- 工具 + 边界 6 个

## 13. 扩展指南

新增一个桥（比如 `AXELAR`）：

1. 在 `types.ts` 的 `BridgeProvider` union 加 `'AXELAR'`
2. 新建 `axelar-bridge.ts`，实现 `getQuote/send/getStatus` + `buildRoute` + `fallback`
3. 在 `BRIDGE_PROVIDER_SECURITY_SCORE` 加分
4. 在 `RouteAggregator` 构造 + `getRoutes` 加并行询价
5. 在 `BridgeEngine.submitToProvider` 加 provider 分发 + `pollOnce` 加状态轮询
6. 在 `tests/bridge-engine.test.ts` 加测试

## 14. 与其他模块的集成

- **wallet/chain-service.ts**：跨链后调用 `EvmChainService.getNativeBalance` 验证到账
- **wallet/evm-rpc-client.ts**：可复用 RPC 端点健康检查
- **risk/engine.ts**：跨链金额可加入风控限额
- **settlement/ledger.ts**：跨链到账后入账到用户余额
- **monitoring/alert-engine.ts**：跨链失败告警
