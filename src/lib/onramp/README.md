# MoonPay 第三方买币集成（onramp 模块）

> 任务：**P1 K-03** ｜ 让用户用信用卡 / Apple Pay / Google Pay 买入 USDT / USDC / BTC / ETH
> 范围：`src/lib/onramp/` + Next.js 接收端 + 完整测试

---

## 1. 架构图

```
┌─────────────────────┐                  ┌──────────────────────┐
│   前端 (Browser)    │                  │   Next.js API 路由    │
│  /buy-crypto 页面    │  POST /buy      │  /api/webhooks/       │
│                     │ ──────────────▶  │      moonpay/route.ts │
│  1. 调 /api/onramp/  │                  │           │            │
│     create          │                  │           ▼            │
│  2. window.location │                  │  handleMoonPayWebhook │
│     = redirectUrl   │ ◀──── redirectUrl │           │            │
│  3. 付款            │                  │           ▼            │
│  4. 等待 webhook    │                  │  verifyMoonPaySignature│
│     回调刷新页面     │                  │           │            │
└─────────────────────┘                  │           ▼            │
                                         │  manager.updateFrom  │
                                         │  Webhook             │
                                         │           │            │
                                         │           ▼            │
                                         │  onOrderUpdate 回调   │
                                         │  → 入金到 user wallet │
                                         └──────────┬───────────┘
                                                    │ HMAC-SHA256
                                                    ▼
                                         ┌──────────────────────┐
                                         │   MoonPay Servers     │
                                         │  api.moonpay.com      │
                                         │  buy.moonpay.com      │
                                         └──────────────────────┘
```

模块组成：

| 文件                                | 角色                                            |
| ----------------------------------- | ----------------------------------------------- |
| `moonpay-client.ts`                 | REST API 客户端（v3 公共 + v1 私有）            |
| `transaction-manager.ts`            | 业务层 + 状态机 + 限流                          |
| `webhook-verifier.ts`               | HMAC-SHA256 签名校验                            |
| `webhook-handler.ts`                | 框架无关的 webhook 纯函数处理                    |
| `index.ts`                          | 模块统一出口                                    |

---

## 2. MoonPay 商户申请指引

> MoonPay 商家注册面向**合规企业**，需要以下准备：

### 2.1 准备材料

| 类别         | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 公司证照     | 营业执照、注册证书、公司章程、董事 / 股东名册                        |
| 公司银行账户 | 美元 / 欧元收款账户（用于法币入金，收取信用卡 / 银行转账）          |
| 受益人 KYC   | 所有持股 ≥ 25% 的最终受益人身份证 + 地址证明 + 资金来源说明          |
| 业务说明     | 业务模型、目标客户、预计月交易量、目标国家 / 地区清单                |
| 许可证       | 数字资产服务牌照（如 MSB / VASP / EMI）；本项目使用 **萨摩亚牌照**  |
| 合规体系     | AML / CFT 制度、交易监控系统、风险管理政策                            |
| 技术能力     | 安全审计报告、SOC 2 / ISO 27001 优先                                  |

### 2.2 申请步骤

1. 访问 [MoonPay Partners](https://partners.moonpay.com) 提交申请
2. 上传全部材料，KYB 团队 1–3 周内审核
3. 通过后**单独签署**商户服务协议（MSA）
4. 平台侧开通 Dashboard，颁发：
   - 公开 API Key（`pk_live_xxx`）—— 前端 widget 使用
   - 私密 API Key（`sk_live_xxx`）—— 后端服务端使用
   - Webhook 签名密钥（自定义字符串）
5. **务必**先在 `sandbox` 环境联调通过，再切换 `live`

### 2.3 限制 / 注意事项

- **仅支持持牌企业**，不接受个人 / 无牌团队
- **不支持中国大陆客户**（受美国 OFAC 制裁）
- 高风险国家（FATF 灰名单）需提供额外风控措施
- 法币入金费率 ~3.5% – 4.5%，加密币出金费率 ~1% – 2%
- 结算周期：**T+1** 到 **T+7**（取决于地区）

---

## 3. API Key 申请

| 步骤 | 操作                                            | 备注                                |
| ---- | ----------------------------------------------- | ----------------------------------- |
| 1    | 登录 [MoonPay Dashboard](https://dashboard.moonpay.com) | test / live 环境分开                |
| 2    | Developers → API Keys → Create                  | 妥善保管 `sk_live_xxx`，**永不暴露到前端** |
| 3    | Developers → Webhooks → Add endpoint            | URL = `https://your-domain/api/webhooks/moonpay` |
| 4    | 选择订阅事件：                                  | `transactionCreated` / `transactionUpdated` / `transactionCompleted` / `transactionFailed` |
| 5    | 配置签名密钥                                    | 写入 `.env.local` 的 `MOONPAY_WEBHOOK_SECRET` |
| 6    | 提交并验证：Dashboard 会发一次 `ping` 测试      | 必须 200 OK 才视为配置成功           |

环境变量（写入 `.env.local`，**不要**提交 git）：

```bash
# MoonPay API Keys
MOONPAY_API_KEY_PUBLIC=pk_test_xxx        # 公开，可放前端 widget URL
MOONPAY_API_KEY_SECRET=sk_test_xxx        # 私密，仅服务端
MOONPAY_WEBHOOK_SECRET=your-webhook-key   # webhook HMAC 共享密钥
```

> 演示模式：当 `pk_test_mock` / `sk_test_mock` / 字符串含 `mock` 时，**所有方法直接返回 mock 数据**，不发网络请求。
> 这让前端 widget 在无 key 时也能在沙盒环境使用 `https://buy.moonpay.com/?apiKey=mock&...` 跳转（虽然真实付款不可用）。

---

## 4. 完整调用示例

### 4.1 后端：创建买币订单

```ts
// app/api/onramp/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  MoonPayClient,
  MoonPayTransactionManager,
  MOONPAY_API_KEY_PUBLIC,
  MOONPAY_API_KEY_SECRET,
} from '@/lib/onramp';

const client = new MoonPayClient({
  apiKeyPublic: MOONPAY_API_KEY_PUBLIC,
  apiKeySecret: MOONPAY_API_KEY_SECRET,
});
const manager = new MoonPayTransactionManager({ client });

export async function POST(req: NextRequest) {
  const { userId, crypto, fiat, fiatAmount, walletAddress, redirectUrl } = await req.json();

  // 1. KYC 校验（演示：占位）
  // if (!isUserKycApproved(userId)) return NextResponse.json({ error: 'KYC_REQUIRED' }, { status: 403 });

  // 2. 创建订单
  const order = await manager.createBuyOrder({
    userId,
    crypto,           // 'USDT' | 'USDC' | 'BTC' | 'ETH'
    fiat,             // 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'KRW'
    fiatAmount,       // 100
    walletAddress,    // '0x...' 平台入金地址
    redirectUrl,      // 'https://app.smy.exchange/buy-crypto/result'
  });

  return NextResponse.json({
    orderId: order.id,
    moonpayRedirectUrl: order.moonpayRedirectUrl,
    status: order.status,
    expiresAt: order.createdAt + 30 * 60_000, // 30 分钟过期
  });
}
```

### 4.2 前端：跳转 widget

```tsx
// app/buy-crypto/ClientPage.tsx
'use client';
import { useState } from 'react';

export default function BuyCryptoPage() {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      // 1. 调后端创建订单
      const r = await fetch('/api/onramp/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-001',
          crypto: 'USDT',
          fiat: 'USD',
          fiatAmount: 100,
          walletAddress: '0x...', // 平台入金地址
          redirectUrl: `${window.location.origin}/buy-crypto/result`,
        }),
      });
      const { moonpayRedirectUrl, orderId } = await r.json();

      // 2. 跳转 MoonPay widget
      window.location.href = moonpayRedirectUrl;

      // 3. （回跳后）轮询订单状态
      // setInterval(async () => {
      //   const s = await fetch(`/api/onramp/${orderId}`).then(r => r.json());
      //   if (s.status === 'completed') toast.success('买币成功！');
      // }, 3000);
    } catch (err) {
      toast.error('买币失败：' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return <button onClick={handleBuy} disabled={loading}>用 USD 买入 100 USDT</button>;
}
```

### 4.3 后端：订阅订单完成事件，自动入账

```ts
// app/api/onramp/init.ts（应用启动时执行一次）
import { MoonPayClient, MoonPayTransactionManager } from '@/lib/onramp';
import { ledger } from '@/lib/settlement';
import { smsService } from '@/lib/notification';

const client = new MoonPayClient({ ... });
const manager = new MoonPayTransactionManager({ client });

manager.onOrderUpdate(async (order) => {
  if (order.status === 'completed') {
    // 1. 入账到 user 钱包
    await ledger.credit({
      userId: order.userId,
      asset: order.crypto,
      amount: order.cryptoAmount,
      ref: `moonpay:${order.id}`,
    });

    // 2. 发短信通知
    await smsService.sendTemplate(
      userPhone(order.userId),
      'BUY_CRYPTO_SUCCESS',
      { amount: String(order.cryptoAmount), asset: order.crypto },
    );
  } else if (order.status === 'failed') {
    await smsService.sendTemplate(
      userPhone(order.userId),
      'BUY_CRYPTO_FAILED',
      { reason: order.errorMessage ?? 'unknown' },
    );
  }
});

globalThis.__smyMoonPayManager = manager;
```

### 4.4 Webhook 接收

路由已就绪：`POST /api/webhooks/moonpay`（见 `src/app/api/webhooks/moonpay/route.ts`）。

MoonPay 配置：

| 配置项        | 值                                              |
| ------------- | ----------------------------------------------- |
| Webhook URL   | `https://your-domain.com/api/webhooks/moonpay`  |
| Events        | `transactionCreated`, `transactionUpdated`, `transactionCompleted`, `transactionFailed` |
| Signing Key   | 写入 `MOONPAY_WEBHOOK_SECRET`                   |
| IP 白名单     | 详见 MoonPay 文档（出口 IP 段）                 |

---

## 5. 与 KYC 模块联动

> MoonPay 在 widget 内部**会再次执行 KYC**（收集身份证 / 自拍）。平台侧应复用 KYC 结果减少摩擦。

```ts
// 在 createBuyOrder 之前：
import { kycService } from '@/lib/kyc';

async function canUserBuy(userId: string): Promise<{ ok: boolean; reason?: string }> {
  const status = await kycService.getStatus(userId);
  if (status === 'approved') return { ok: true };
  if (status === 'pending') return { ok: false, reason: 'KYC_PENDING' };
  return { ok: false, reason: 'KYC_REQUIRED' };
}
```

业务策略：

| 情况                  | 建议                                                            |
| --------------------- | --------------------------------------------------------------- |
| KYC `approved`        | 直接走 MoonPay，参数 `customer.id = userId` 让 MoonPay 跳过部分表单 |
| KYC `pending`         | 引导用户先去平台完成 KYC，再来买币                              |
| KYC `rejected`        | 拒绝买币                                                        |
| 单日累计 > $1000      | 强制走 MoonPay widget（其内部 KYC 兜底）                         |
| 单日累计 > $10000     | 风控加严：人工审核 + AML 名单比对                                |
| 黑名单地址            | 拒绝                                                            |

---

## 6. 失败回退策略

| 失败场景                | 处理                                                            |
| ----------------------- | --------------------------------------------------------------- |
| MoonPay API 5xx         | 自动重试 3 次（指数退避 400ms → 800ms → 1.6s）                  |
| MoonPay API 4xx         | 不重试，直接抛 `MoonPayApiError` 上抛                           |
| MoonPay 超时            | AbortController 触发，自动重试                                  |
| API Key 缺失            | 自动 mock 模式，返回模拟 widget URL（前端仍可跳转）             |
| 网络断                  | 重试用尽后抛 `NETWORK_ERROR`                                    |
| 同一用户高频下单        | 限流：`minIntervalMs = 30s` + `maxActivePerUser = 3`            |
| 订单 30 分钟未付款      | `expireStaleOrders()` cron 每分钟扫描，自动 `expired`           |
| 签名错误                | 401 Unauthorized，不更新订单                                    |
| 无效 JSON               | 400 Bad Request                                                 |
| MoonPay 返回 401/403    | 抛 `UNAUTHORIZED`，前端提示商户配置错误                          |
| MoonPay 拒收 webhook    | 5xx 自动重试，4xx 记录日志等待人工处理                          |

---

## 7. 状态机

```
initiated
  │
  ▼
widget_opened
  │
  ▼
waiting_payment ──▶ (webhook transactionCreated)
  │
  ▼
processing ──▶ (webhook transactionUpdated status=pending)
  │
  ▼
completed ──▶ (webhook transactionCompleted) ─▶ 入账
  │
  ▼
failed  ◀── (webhook transactionFailed)
expired ◀── (cron expireStaleOrders)
```

合法转移表（`canTransition(from, to)`）：

| from             | allowed to                                    |
| ---------------- | --------------------------------------------- |
| `initiated`      | `widget_opened`, `waiting_payment`, `failed`, `expired` |
| `widget_opened`  | `waiting_payment`, `failed`, `expired`        |
| `waiting_payment`| `processing`, `failed`, `expired`             |
| `processing`     | `completed`, `failed`, `expired`              |
| `completed`      | (终态)                                        |
| `failed`         | (终态)                                        |
| `expired`        | (终态)                                        |

---

## 8. 测试

```bash
# 运行 MoonPay 全部测试（33 个用例）
npx tsx --test tests/moonpay.test.ts

# 全量测试
npx tsx tests/run-all.ts
```

测试覆盖：

- ✅ getCurrencies 解析（mock + 真实 API）
- ✅ getCurrency 单个查询 + 404
- ✅ getExchangeLimits min/max 解析
- ✅ getPrice baseAmount / cryptoAmount / rate
- ✅ createTransaction 返回正确 redirectUrl
- ✅ getTransaction 状态查询
- ✅ TransactionManager createBuyOrder
- ✅ 状态机正常流转 initiated → completed
- ✅ 非法状态转移被拒绝
- ✅ updateOrderFromWebhook 4 种事件
- ✅ 订单与 user 关联 + listUserOrders
- ✅ 限流：30 秒间隔 + maxActivePerUser
- ✅ 5xx 自动重试
- ✅ 4xx 不重试
- ✅ 401 抛 UNAUTHORIZED
- ✅ 网络失败抛 NETWORK_ERROR
- ✅ API Key 含 mock 子串时自动 mock
- ✅ Webhook 签名（正 / 错 / 缺 / 长度不符 / 缺 secret）
- ✅ 完整流程：创建 → webhook (created → updated → completed)
- ✅ 错误签名 → 401
- ✅ 无效 JSON → 400
- ✅ 孤儿 webhook 记录 ORPHAN 错误
- ✅ 订单过期清理
- ✅ onOrderUpdate 多次订阅 + 取消订阅
- ✅ canTransition 状态机函数
- ✅ 工厂函数 + 关键常量

---

## 9. 部署 checklist

- [ ] 设置 3 个环境变量：`MOONPAY_API_KEY_PUBLIC` / `MOONPAY_API_KEY_SECRET` / `MOONPAY_WEBHOOK_SECRET`
- [ ] 在 MoonPay Dashboard 创建 webhook，回调 URL = `https://your-domain/api/webhooks/moonpay`
- [ ] 在代码 `onOrderUpdate` 中接入入账逻辑
- [ ] 接入 cron 定时调 `manager.expireStaleOrders()`（建议每分钟）
- [ ] 接入风控：单日累计金额 / 黑名单地址 / AML 检查
- [ ] 与 KYC 模块联动，未通过 KYC 拒绝买币
- [ ] 在监控（`@/lib/monitoring`）中埋点：订单创建数 / 成功率 / 平均时长
- [ ] 配置告警：webhook 失败率 > 5% / API 5xx > 1%
- [ ] **生产前必须**在 sandbox 完成端到端联调（用 MoonPay test card `4000 0000 0000 0002`）
