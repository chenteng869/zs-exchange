# TRON 链 SDK 使用文档

> SMY 交易所数字钱包模块 — TRON 链专用 SDK
> 任务编号: C-09 + D-04
> 实现文件: `src/lib/wallet/tron-rpc-client.ts`, `src/lib/wallet/tron-service.ts`
> 测试文件: `tests/tron-rpc.test.ts`

---

## 1. 概述

本模块基于 **Trongrid HTTP API**（`api.trongrid.io`）实现 TRON 链上数据查询，**不依赖 tronweb**，仅使用浏览器/Node 自带的 `fetch`。

### 核心能力

| 能力 | API | 端点 |
| --- | --- | --- |
| TRX 原币余额 | `getNativeBalance` | `GET /v1/accounts/{address}` |
| TRC20 USDT/USDC 余额 | `getTrc20Balance` | `GET /v1/accounts/{address}/tokens/trc20` |
| TRX 区块高度 / 链状态 | `getChainStatus` | `POST /wallet/getnowblock` |
| TRC20 交易历史 | `getTransactionHistory` | `GET /v1/accounts/{address}/transactions/trc20` |
| 交易详情 | `getTransaction` | `GET /v1/transactions/{txHash}` |
| 多节点健康检查 | `getHealth` | `POST /wallet/getnowblock`（每 30s） |
| 演示降级 | 离线时返回 `source: 'fallback'` | — |

### 关键特性

- **多端点自动切换**：支持配置多个 Trongrid 端点，按延迟 + 健康度排序
- **429 / 5xx 自动容错**：命中限流或服务异常时自动切换下一节点
- **API Key 自动注入**：通过 `TRON-PRO-API-KEY` header 注入，**不强制**
- **演示降级**：默认开启，断网/失败时返回稳定的 mock 数据，便于演示
- **大数安全**：所有金额计算走 `BigInt`，避免精度丢失
- **类型统一**：与 EVM 的 `EvmChainService` 风格一致，便于适配到 `ChainClient`

---

## 2. 快速开始

### 2.1 安装

无需新增依赖，使用项目既有的 `typescript` 与 `tsx` 即可。

### 2.2 最简用法

```ts
import { createTronService, TRC20_USDT_MAINNET } from '@/lib/wallet';

// 默认走公共 Trongrid（无 API Key 也能用，有 5 req/s 限流）
const tron = createTronService();

// 查询 TRX 原币余额
const trxBalance = await tron.getNativeBalance('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8');
console.log(trxBalance.balance, 'TRX');         // "123.456"
console.log(trxBalance.balanceSun);             // "123456000"
console.log(trxBalance.source);                 // "rpc" | "fallback"

// 查询 USDT 余额
const usdt = await tron.getTrc20Balance(
  'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
  TRC20_USDT_MAINNET,
  'USDT',
  6,
);
console.log(usdt.balance);                      // "50"

// 查询链状态
const status = await tron.getChainStatus();
console.log(status.blockNumber);                // 72000000

// 查询交易历史
const history = await tron.getTransactionHistory('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8', 20);

// 健康检查
const health = tron.getHealth();
console.log(health);
// [{ url, healthy, latencyMs, blockNumber, lastCheck, consecutiveFailures }]

// 关闭（清理定时器）
tron.stop();
```

### 2.3 带 API Key（推荐生产环境）

```ts
const tron = createTronService(process.env.TRONGRID_API_KEY, {
  network: 'mainnet',
  // 可选：自定义端点
  endpoints: [
    'https://api.trongrid.io',
    'https://tronrpc.example-cdn.io',
  ],
  healthCheckMs: 30_000,
});
```

### 2.4 测试网

```ts
// Shasta 测试网
const shasta = createTronService(undefined, { network: 'shasta' });

// Nile 测试网
const nile = createTronService(undefined, { network: 'nile' });
```

---

## 3. TronGrid API 限制与申请 API Key

### 3.1 公共端点限流

未携带 API Key 时，Trongrid 公共端点限制：

| 端点 | 限流 |
| --- | --- |
| `/wallet/*`（链状态、广播） | **5 req/s/IP** |
| `/v1/accounts/{addr}`（余额） | 5 req/s/API Key（未带 Key 时合并限流） |
| `/v1/transactions/*`（交易历史） | 5 req/s/API Key |

> 实际项目多账户场景下，强烈建议申请 API Key。

### 3.2 申请 API Key

1. 登录 [TronGrid](https://www.trongrid.io/)
2. 进入 [Dashboard / API Keys](https://www.trongrid.io/apis) 页面
3. 点击「Create Key」生成一个免费 API Key
4. 配置到环境变量：
   ```bash
   # .env.local
   TRONGRID_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
5. 在代码中通过 `createTronService(process.env.TRONGRID_API_KEY)` 传入

### 3.3 高级配额（如需更高 QPS）

- 注册 TronGrid Pro 账号或部署自有节点
- 通过 `endpoints` 选项接入自有 `tron-grid` 或 `fullnode` HTTP 端点
- 例如：
  ```ts
  const tron = createTronService(undefined, {
    endpoints: [
      'https://api.my-tron-node.com',         // 自己的全节点
      'https://api.trongrid.io',              // 兜底
    ],
  });
  ```

---

## 4. 主要 API 详解

### 4.1 `TronRpcClient`

低层 RPC 客户端，处理多节点、限流、错误重试、健康检查。

```ts
import { TronRpcClient } from '@/lib/wallet/tron-rpc-client';

const client = new TronRpcClient({
  endpoints: ['https://api.trongrid.io'],
  apiKey: 'xxx',                    // 可选，自动注入 TRON-PRO-API-KEY header
  fetchImpl: globalThis.fetch,      // 测试时可注入 mock
  timeoutMs: 10_000,                // 单次请求超时
  maxRetries: 3,                    // 同端点重试次数
  healthCheckMs: 30_000,            // 健康检查周期；0 禁用
});

// 发送请求
const res = await client.request<{ block_header: { raw_data: { number: number } } }>(
  '/wallet/getnowblock',
  { method: 'POST', body: {} },
);
console.log(res.block_header.raw_data.number);

// 生命周期
client.startHealthCheck();
client.stopHealthCheck();
const health = client.getHealth();
const sorted = client.getSortedEndpoints();  // 按健康 + 延迟排序
```

### 4.2 `TronChainService`

业务层服务，对外暴露链上数据查询。

```ts
const svc = new TronChainService({
  network: 'mainnet',               // 'mainnet' | 'shasta' | 'nile'
  apiKey: 'xxx',
  endpoints: [...],
  fetchImpl: ...,
  timeoutMs: 10_000,
  maxRetries: 3,
  healthCheckMs: 30_000,
  fallbackToDemo: true,             // 默认 true；离线时返回 mock
});
```

#### 余额

```ts
// TRX 原币
const trx = await svc.getNativeBalance(address);
// { chain: 'TRX', address, network, balance, balanceSun, unit: 'TRX', source, updatedAt }

// TRC20 代币
const usdt = await svc.getTrc20Balance(address, TRC20_USDT_MAINNET, 'USDT', 6);
// { chain: 'TRX', address, network, contractAddress, symbol, decimals, balance, balanceRaw, unit, source, updatedAt }

// 兼容 ChainClient 适配器的统一接口
const token = await svc.getTokenBalance(address, contractAddress, symbol?, decimals?);
```

#### 链状态

```ts
const status = await svc.getChainStatus();
// { chain: 'TRX', network, blockNumber, blockTime, gasPrice, gasPriceUnit: 'TRX', source, updatedAt }

const blockNumber = await svc.getTransactionCount(address);  // 返回 0（TRX 不暴露 nonce）
```

#### 交易

```ts
// 单笔交易详情
const tx = await svc.getTransaction('0x' + 'a'.repeat(64));
// { hash, blockNumber, from, to, value, valueFormatted, asset, timestamp, status, method? }

// 交易历史（最近 limit 条）
const history = await svc.getTransactionHistory(address, 20);
// TransactionInfo[]
```

#### 健康 / 生命周期

```ts
// 探测连通性
const probe = await svc.probe();
// { reachable, healthy, blockNumber? }

const health = svc.getHealth();     // NodeHealth[]

svc.start();  // 启动定时健康检查
svc.stop();   // 清理定时器
```

### 4.3 工厂 / 工具函数

```ts
import {
  createTronService,
  probeTron,
  isValidTrxAddress,
  sunToTrx,
  trc20Format,
  TRC20_USDT_MAINNET,
  TRC20_USDT_DECIMALS,
  TRC20_USDC_MAINNET,
  TRC20_USDC_DECIMALS,
} from '@/lib/wallet';

createTronService(apiKey?, opts?);                  // 快速创建
probeTron(apiKey?, fetchImpl?);                     // 快速探测
isValidTrxAddress('TJRabPrwbZ...');                 // base58 地址校验
sunToTrx(1_000_000n);                               // '1'
trc20Format(50_000_000n, 6);                        // '50'
```

### 4.4 错误类

```ts
import { TronRpcError } from '@/lib/wallet/tron-rpc-client';

try {
  await svc.getNativeBalance('0xinvalid');
} catch (e) {
  if (e instanceof TronRpcError) {
    console.log(e.code);     // 'INVALID_ADDRESS'
    console.log(e.status);   // HTTP 状态码（如果有）
    console.log(e.endpoint); // 失败端点
  }
}
```

常见错误码：

| code | 含义 |
| --- | --- |
| `NO_ENDPOINTS` | 未配置任何端点 |
| `NO_FETCH` | 无 fetch 实现 |
| `NO_HEALTHY_ENDPOINT` | 所有端点都不健康 |
| `HTTP_429` | 命中限流（已自动切下一节点） |
| `HTTP_5xx` | 远端 5xx（已自动切下一节点） |
| `TIMEOUT` | 请求超时 |
| `INVALID_ADDRESS` | TRX 地址不合法（不是 34 位 base58） |
| `INVALID_TOKEN` | TRC20 合约地址不合法 |
| `INVALID_TX_HASH` | 交易 hash 不合法（不是 64 位 hex） |
| `INVALID_LIMIT` | limit 参数越界（应为 1-100） |

---

## 5. 演示降级（Mock）

当 `fallbackToDemo: true`（默认）且 RPC 不可用时，`TronChainService` 会返回稳定的 mock 数据：

```ts
const svc = new TronChainService({
  endpoints: ['https://does-not-exist.local'],
  fallbackToDemo: true,
});

const trx = await svc.getNativeBalance('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8');
// trx.source === 'fallback'
// trx.balance 取决于 address 字符的稳定 hash，确保相同地址返回相同 mock 值

const usdt = await svc.getTrc20Balance(addr, TRC20_USDT_MAINNET, 'USDT', 6);
// usdt.source === 'fallback'

const status = await svc.getChainStatus();
// status.source === 'fallback'
// status.blockNumber === 72_000_000（固定）

const history = await svc.getTransactionHistory(addr, 5);
// 返回 5 条基于地址 hash 的稳定 mock 交易记录
```

如果需要严格模式（RPC 失败立即抛错）：

```ts
const svc = new TronChainService({
  endpoints: ['https://api.trongrid.io'],
  fallbackToDemo: false,
});
// RPC 失败时直接 throw TronRpcError
```

---

## 6. 与统一多链 SDK 集成

通过 `TronChainClientAdapter` 接入 `ChainRegistry`，业务层用统一的 `ChainClient` 接口调用：

```ts
import { createDefaultRegistry } from '@/lib/wallet/chain-registry';

const registry = createDefaultRegistry({
  apiKeys: {
    eth: process.env.ETH_RPC_KEY,
    bsc: process.env.BSC_RPC_KEY,
    tron: process.env.TRONGRID_API_KEY,
  },
});

// 统一余额查询
const balances = await registry.getBalances('TJRabPrwbZy45sbavfcjinPJC18kjpRTv8', [
  { chain: 'TRON' },
  { chain: 'TRON', contractAddress: TRC20_USDT_MAINNET, symbol: 'USDT', decimals: 6 },
]);

// 统一链状态
const status = await registry.getChainStatus('TRON');
```

---

## 7. 测试

```bash
# 运行所有 TRON 测试
npx tsx tests/tron-rpc.test.ts

# 包含地址校验、sun 转换、TRC20 解析、5xx/TIMEOUT/429 切换、健康检查、降级等
# 当前 41 个测试用例 100% 通过
```

主要测试场景：

- TRX base58 地址校验（合法 / 非法长度 / 非法字符）
- `sunToTrx` / `trc20Format` 单位转换
- `TronRpcClient` 端点切换：5xx、TIMEOUT、429
- `TronChainService` 余额 / 交易历史 / 链状态查询
- 演示降级（fallbackToDemo=true / false）
- 健康检查：失败标记、按延迟排序、blockNumber 提取
- 工厂函数 `createTronService` / `probeTron`

---

## 8. 已知问题与注意事项

1. **公共端点限流（5 req/s）**：未配 API Key 时多个账户并发查询会被限流，建议申请 Key 或部署自有节点。
2. **`getTransaction` 的 base58 转换**：当前实现在 `tron-service.ts` 中用纯 TypeScript 实现了 hex → base58 转换，未做 TRON 校验和校验，但仅用于显示，不影响业务正确性。若需严格校验，可后续接入 `tronweb.utils.crypto` 风格的实现。
3. **TRC20 余额的 hex 解析**：`/v1/accounts/{addr}/tokens/trc20` 返回的 `balance` 字段是 **十六进制字符串（无 0x 前缀）**，代码中通过 `hexBalanceToBigInt` 统一处理 hex / dec / 0x-prefixed 三种输入。
4. **依赖 Node `Buffer` / `setTimeout` 等全局对象**：在浏览器环境使用时需 polyfill 或在调用前确保 `globalThis.fetch` 可用。Next.js 客户端组件默认支持。
5. **多节点故障转移期间会重试**：单端点失败最多 3 次 + 切换下一节点 1 次，极端情况下会消耗 4×timeout 的时间，业务层注意设置合理的 `timeoutMs`（默认 10s）。

---

## 9. 变更记录

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| 1.0 | 2026-06-20 | 初次实现：余额 / TRC20 / 交易历史 / 链状态 / 多节点 / 降级 / 测试 |

---

## 10. 参考资料

- [Trongrid HTTP API](https://developers.tron.network/reference/trongridapi-introduction)
- [TronGrid 限流说明](https://developers.tron.network/reference/rate-limits)
- [TRC20 代币标准](https://developers.tron.network/docs/trc20)
- [Tron 区块结构](https://developers.tron.network/docs/tron-blockchain)
- 内部参考：`src/lib/wallet/chain-service.ts`（EVM 实现）
