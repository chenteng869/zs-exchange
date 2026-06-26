# Payment 模块（Stripe / Adyen 信用卡支付）

> 任务：**P1 K-01** ｜ 让用户用 Visa / Mastercard / Amex / UnionPay / JCB / Discover 信用卡 / 借记卡入金
> 范围：`src/lib/payment/` + Next.js 接收端 + 完整测试

---

## 1. 架构图

```
┌──────────────────────┐                  ┌──────────────────────────────┐
│   前端 (Browser)     │                  │   Next.js API 路由            │
│  /buy-card 页面       │  POST /payment/  │  /api/webhooks/              │
│                      │ ──────────────▶  │      stripe/route.ts         │
│  1. 用户输入卡号      │                  │  /api/webhooks/adyen/route.ts│
│  2. 调 /api/payment  │                  │           │                  │
│     /create          │                  │           ▼                  │
│  3. 3DS 跳转         │ ◀── threeDsUrl    │  handleStripeWebhook /       │
│  4. 3DS callback     │                  │  handleAdyenWebhook          │
│  5. 轮询状态          │                  │           │                  │
│                      │                  │           ▼                  │
└──────────────────────┘                  │  manager.processWebhook      │
                                          │           │                  │
                                          │           ▼                  │
                                          │  onPaymentUpdate 回调        │
                                          │  → 入金到 user wallet         │
                                          └──────────┬───────────────────┘
                                                     │ HTTPS (Basic/Bearer)
                                                     ▼
                                          ┌──────────────────────────────┐
                                          │   Stripe / Adyen Servers    │
                                          │  api.stripe.com              │
                                          │  checkout[-test].adyen.com  │
                                          └──────────────────────────────┘
```

模块组成：

| 文件                                | 角色                                            |
| ----------------------------------- | ----------------------------------------------- |
| `types.ts`                          | 类型定义 + 常量 + Luhn 校验 + 货币换算          |
| `stripe-client.ts`                  | Stripe REST API 客户端（payment_intents + refund） |
| `adyen-client.ts`                   | Adyen Checkout API 客户端（payments + details + refund） |
| `payment-service.ts`                | 业务层（状态机 + 风控 + Luhn + 订单管理）        |
| `webhook-handler.ts`                | 框架无关的 webhook 纯函数处理                    |
| `index.ts`                          | 模块统一出口                                    |

---

## 2. Provider 选型策略

| Provider  | 适用地区 / 场景                              | 合规                |
| --------- | -------------------------------------------- | ------------------- |
| **Stripe**（默认）| 北美、亚太、拉美等非欧盟地区                | PCI DSS Level 1     |
| **Adyen**（备选）| 欧盟 27 国 + EEA 地区（DE/FR/NL/...）       | PCI DSS + 当地牌照 + SCA 强认证 |

`pickProviderByCountry(country)` 根据账单地址 / 用户国家自动选择：
- 欧盟 → Adyen
- 其他 → Stripe
- 未传 → Stripe

---

## 3. Stripe 申请指引

### 3.1 申请步骤

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com) 注册企业账号
2. 完成 KYB（公司证照 + 受益人 KYC）
3. 激活支付：
   - `Developers → API Keys` 获取 `pk_live_xxx` / `sk_live_xxx`
   - `Developers → Webhooks → Add endpoint` 配置回调 URL
   - 配置签名密钥 `whsec_xxx`
4. 启用支付方式：`Settings → Payment methods` 启用 Visa / Mastercard / Amex 等

### 3.2 API Key 配置

```bash
# .env.local
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

> 演示模式：API Key 包含 `mock` 时**自动 mock**（不发起网络请求，直接返回稳定数据），便于本地开发。

---

## 4. Adyen 申请指引

### 4.1 申请步骤

1. 访问 [Adyen](https://www.adyen.com) 提交商户申请（需持牌企业）
2. KYB 通过后获取：
   - `API Key`（格式 `AQEyhmfx...`）
   - `Merchant Account`（如 `SMY-ECOM`）
   - `HMAC Key for Notification Webhooks`
3. 在 **Customer Area → Developers → Webhooks** 添加标准通知 URL
4. 切换 `live: true` 进入生产环境

### 4.2 API Key 配置

```bash
# .env.local
ADYEN_API_KEY=AQEyhmfxL47PaRZH...
ADYEN_MERCHANT_ACCOUNT=SMY-ECOM
ADYEN_HMAC_KEY=your-hmac-key
```

> 演示模式：API Key 包含 `mock` 时**自动 mock**。

---

## 5. 完整调用示例

### 5.1 后端：创建支付

```ts
// app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  PaymentService,
  StripeClient,
  AdyenClient,
  type PaymentRequest,
} from '@/lib/payment';

const stripe = new StripeClient({ secretKey: process.env.STRIPE_SECRET_KEY! });
const adyen = new AdyenClient({
  apiKey: process.env.ADYEN_API_KEY!,
  merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
});
const paymentService = new PaymentService({ stripe, adyen });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = await paymentService.createPayment({
    userId: body.userId,
    amount: body.amount,            // 100
    currency: body.currency,        // 'USD'
    card: body.card,                // { number, expMonth, expYear, cvc, holderName }
    billingAddress: body.billingAddress,
    idempotencyKey: body.idempotencyKey,
    metadata: { orderId: body.orderId },
  } as PaymentRequest);

  if (result.status === 'requires_3ds') {
    // 3DS 跳转
    return NextResponse.json({
      paymentId: result.paymentId,
      status: result.status,
      threeDsUrl: result.threeDsUrl,
    });
  }
  if (result.status === 'succeeded') {
    return NextResponse.json({
      paymentId: result.paymentId,
      status: result.status,
      amount: result.amount,
      fee: result.fee,
      netAmount: result.netAmount,
    });
  }
  return NextResponse.json({
    status: result.status,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
  }, { status: 400 });
}
```

### 5.2 前端：发起支付 + 3DS

```tsx
// app/buy-card/ClientPage.tsx
'use client';
import { useState } from 'react';

export default function BuyCardPage() {
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    try {
      // 1. 创建支付
      const r = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-001',
          amount: 100,
          currency: 'USD',
          card: {
            number: '4242424242424242',
            expMonth: 12,
            expYear: 2028,
            cvc: '123',
            holderName: 'Test User',
          },
          billingAddress: {
            name: 'Test User',
            line1: '1 Main St',
            city: 'New York',
            postalCode: '10001',
            country: 'US',
          },
          idempotencyKey: crypto.randomUUID(),
        }),
      }).then(r => r.json());

      if (r.status === 'requires_3ds') {
        setPaymentId(r.paymentId);
        // 2. 跳转 3DS（Stripe 跳转 window.location，Adyen 内嵌 iframe）
        window.location.href = r.threeDsUrl;
        return;
      }
      if (r.status === 'succeeded') {
        alert(`支付成功！paymentId=${r.paymentId}`);
      } else {
        alert(`支付失败：${r.errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return <button onClick={handlePay} disabled={loading}>支付 $100</button>;
}
```

### 5.3 后端：3DS callback 处理

```ts
// app/api/payment/3ds-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentService, StripeClient, AdyenClient } from '@/lib/payment';

const stripe = new StripeClient({ secretKey: process.env.STRIPE_SECRET_KEY! });
const adyen = new AdyenClient({
  apiKey: process.env.ADYEN_API_KEY!,
  merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
});
const paymentService = new PaymentService({ stripe, adyen });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('pid') ?? url.searchParams.get('resourcePath') ?? '';
  const md = url.searchParams.get('md') ?? '';
  const paRes = url.searchParams.get('paRes') ?? '';

  const result = await paymentService.handle3DSResult(paymentId, { md, paRes });
  return NextResponse.redirect(`/buy-card/result?status=${result.status}&paymentId=${result.paymentId}`);
}
```

### 5.4 后端：订阅完成事件，自动入账

```ts
// app/api/payment/init.ts（应用启动时执行一次）
import { ledger } from '@/lib/settlement';
import { smsService } from '@/lib/notification';
import { paymentService } from './client';

paymentService.onPaymentUpdate(async (order, event) => {
  if (order.status === 'succeeded' && order.metadata?.userId) {
    // 1. 入账
    await ledger.credit({
      userId: order.userId,
      asset: order.metadata.asset ?? 'USDT',
      amount: order.netAmount,
      ref: `card:${order.id}`,
    });
    // 2. 通知
    await smsService.sendTemplate(order.userId, 'CARD_PAYMENT_SUCCESS', {
      amount: String(order.netAmount),
      last4: order.cardLast4,
    });
  } else if (order.status === 'failed') {
    await smsService.sendTemplate(order.userId, 'CARD_PAYMENT_FAILED', {
      reason: order.errorMessage ?? 'unknown',
    });
  }
});
```

### 5.5 Webhook 接收（Stripe）

```ts
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/payment';
import { StripeClient, PaymentService } from '@/lib/payment';

const stripe = new StripeClient({ secretKey: process.env.STRIPE_SECRET_KEY! });
const adyen = new AdyenClient({ /* ... */ });
const paymentService = new PaymentService({ stripe, adyen });

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';
  const result = await handleStripeWebhook(rawBody, signature, stripe, paymentService);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
```

### 5.6 Webhook 接收（Adyen）

```ts
// app/api/webhooks/adyen/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { handleAdyenWebhook, AdyenClient, PaymentService } from '@/lib/payment';
// ... instantiate
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const result = await handleAdyenWebhook(rawBody, adyen, paymentService);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
```

---

## 6. 3DS 流程图

```
                     ┌────────────┐
                     │   前端     │
                     └─────┬──────┘
                           │ 1. createPayment
                           ▼
                  ┌────────────────┐
                  │  PaymentService │
                  └────────┬───────┘
                           │ 2. provider.createPayment
                           ▼
                ┌──────────────────┐
                │ Stripe / Adyen  │
                └────────┬─────────┘
                         │ status=requires_action/RedirectShopper
                         │ threeDsUrl=...
                         ▼
                  ┌────────────┐
                  │  3DS challenge│
                  │  (银行认证)  │
                  └────────┬─────┘
                           │ 3. 用户完成 3DS（OTP / 指纹）
                           ▼
                ┌──────────────────────┐
                │  /api/payment/3ds-   │
                │  callback (frontend) │
                └────────┬─────────────┘
                         │ 4. handle3DSResult
                         ▼
                ┌──────────────────────┐
                │ provider.getPayment  │
                │ Details / confirm     │
                └────────┬─────────────┘
                         │ status=succeeded/failed
                         ▼
                  ┌────────────┐
                  │   跳转结果  │
                  └────────────┘
```

---

## 7. Webhook 配置

### 7.1 Stripe

| 配置项        | 值                                                  |
| ------------- | --------------------------------------------------- |
| Webhook URL   | `https://your-domain.com/api/webhooks/stripe`        |
| Events        | `payment_intent.succeeded` / `payment_intent.payment_failed` / `payment_intent.processing` / `payment_intent.canceled` / `charge.refunded` / `charge.dispute.created` |
| Signing Key   | 写入 `STRIPE_WEBHOOK_SECRET`                         |

### 7.2 Adyen

| 配置项        | 值                                                  |
| ------------- | --------------------------------------------------- |
| Webhook URL   | `https://your-domain.com/api/webhooks/adyen`         |
| Method        | Standard Notification                               |
| HMAC Key      | 写入 `ADYEN_HMAC_KEY`                                |
| Event Codes   | `AUTHORISATION` / `REFUND` / `CANCELLATION` / `CHARGEBACK` |

---

## 8. 风控规则

| 规则                    | 默认值（USD）            | 触发动作        |
| ----------------------- | ------------------------- | --------------- |
| 单笔限额                | $10,000                   | 拒单            |
| 单用户 24h 累计         | $50,000                   | 拒单            |
| 单卡 24h 累计           | $20,000                   | 拒单            |
| 同一用户下单间隔        | 5 秒                      | 拒单            |
| 用户黑名单              | 手动维护                  | 拒单            |
| 卡号黑名单（last4）     | 手动维护                  | 拒单            |
| 卡号 Luhn 校验          | 必过                      | 拒单            |
| CVC 校验                | Visa/MC 3 位 / Amex 4 位  | 拒单            |
| 过期卡                  | 月份 + 年份               | 拒单            |

限额配置在 `PAYMENT_LIMITS`（每币种独立）。

### 8.1 SCA 强认证（欧盟）

欧盟用户（DE/FR/NL/...）超过 30 EUR 等值**强制 3DS**。逻辑在 `shouldRequire3DS()` 中。

---

## 9. 退款 / 争议处理

### 9.1 主动退款

```ts
// 全额退款
await paymentService.refund({
  paymentId: 'pi_xxx',
  idempotencyKey: 'rf-001',
  reason: 'requested_by_customer',
});

// 部分退款
await paymentService.refund({
  paymentId: 'pi_xxx',
  amount: 20,           // USD
  idempotencyKey: 'rf-002',
  reason: 'duplicate',
});
```

订单状态自动从 `succeeded` → `partially_refunded` → `refunded`。

### 9.2 争议（chargeback）

Stripe 通过 `charge.dispute.created` 事件通知，Adyen 通过 `CHARGEBACK` 通知。`PaymentService.processWebhook` 会写入 `errorCode = 'DISPUTE'`，业务层可订阅 `onPaymentUpdate` 进一步处理：
- 冻结相关交易
- 通知风控团队
- 自动证据准备（Stripe 接受 `dispute.update`）

---

## 10. 状态机

```
initiated
   │
   ▼
3ds_required ── (provider.requires_action)
   │
   ▼
processing ─── (provider.processing)
   │
   ▼
succeeded ── (webhook payment_intent.succeeded)
   │
   ▼
refunded / partially_refunded ── (refund 累计 = amount)
```

合法转移表（`canTransitionPayment(from, to)`）：

| from                  | allowed to                                |
| --------------------- | ----------------------------------------- |
| `initiated`           | `3ds_required`, `processing`, `succeeded`, `failed` |
| `3ds_required`        | `processing`, `succeeded`, `failed`       |
| `processing`          | `succeeded`, `failed`                     |
| `succeeded`           | `refunded`, `partially_refunded`, `failed` |
| `partially_refunded`  | `refunded`                                |
| `failed` / `refunded` | (终态)                                    |

---

## 11. 失败回退策略

| 失败场景                | 处理                                                            |
| ----------------------- | --------------------------------------------------------------- |
| Provider 5xx            | 自动重试 3 次（指数退避 400ms → 800ms → 1.6s）                  |
| Provider 4xx            | 不重试，直接抛 `StripeApiError` / `AdyenApiError`               |
| Provider 超时           | AbortController 触发，自动重试                                  |
| API Key 含 `mock`       | 自动 mock 模式，返回稳定数据（不发网络请求）                    |
| 网络断                  | 重试用尽后抛 `NETWORK_ERROR`                                    |
| 同一用户高频下单        | 限流：`minIntervalMs = 5s`                                      |
| 签名错误                | 401 Unauthorized，不更新订单                                    |
| Luhn 校验失败           | 抛 `PaymentValidationError(INVALID_CARD)`                      |
| 限额超限                | 抛 `PaymentValidationError(RISK_REJECTED)`                     |
| 同一 idempotencyKey     | 直接返回原订单（幂等）                                          |

---

## 12. 货币支持

| 币种 | 最小单位（minor） | 备注            |
| ---- | ----------------- | --------------- |
| USD  | 2 位（cents）     | Stripe / Adyen  |
| EUR  | 2 位（cents）     | Stripe / Adyen  |
| GBP  | 2 位（pence）     | Stripe / Adyen  |
| CNY  | 2 位（fen）       | Stripe / Adyen  |
| JPY  | 0 位（无小数）    | 特殊处理        |
| KRW  | 0 位（无小数）    | 特殊处理        |
| HKD  | 2 位（cents）     | Stripe / Adyen  |
| SGD  | 2 位（cents）     | Stripe / Adyen  |
| AUD  | 2 位（cents）     | Stripe / Adyen  |

`toMinorUnit(amount, currency)` / `fromMinorUnit(minor, currency)` 工具自动处理。

---

## 13. 测试

```bash
# 运行 payment 全部测试（32 个用例）
npx tsx --test tests/payment-service.test.ts
```

测试覆盖：

- ✅ Luhn 算法正确（合法卡通过）
- ✅ Luhn 算法错误（非法卡拒绝）
- ✅ 卡品牌识别（Visa 4xxx, MC 5xxx, Amex 3xxx, UnionPay 62xx, JCB 35xx, Discover 6011）
- ✅ 校验过期日期
- ✅ 校验 CVV
- ✅ Stripe createPaymentIntent 成功（mock + 真实 API）
- ✅ Stripe 3DS 跳转
- ✅ Stripe 5xx 重试
- ✅ Stripe createRefund
- ✅ Stripe webhook 签名校验（正 / 错 / 缺 / 时间戳超时）
- ✅ Adyen createPayment 成功
- ✅ Adyen 3DS 处理（RedirectShopper）
- ✅ Adyen createRefund
- ✅ PaymentService 完整流程
- ✅ 3DS 流程（requires3DS=true → handle3DSResult）
- ✅ 风控：单笔限额
- ✅ 风控：24h 限额
- ✅ 风控：黑名单（user + card）
- ✅ 断网降级（mock 模式）
- ✅ 退款 / 部分退款
- ✅ 幂等键命中
- ✅ 欧盟账单地址自动选 Adyen
- ✅ listUserPayments 排序
- ✅ canTransition 状态机函数
- ✅ 货币换算（toMinorUnit / fromMinorUnit）
- ✅ pickProviderByCountry
- ✅ shouldRequire3DS（SCA 强认证）
- ✅ SUPPORTED_CURRENCIES / ZERO_DECIMAL_CURRENCIES
- ✅ handleStripeWebhook（签名验证）
- ✅ handleAdyenWebhook（HMAC 验证）
- ✅ 非法卡号 → PaymentValidationError
- ✅ 过期卡 → CARD_EXPIRED

**测试结果**：32 / 32 通过。

---

## 14. 部署 checklist

- [ ] 设置 4 个环境变量：
      `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `ADYEN_API_KEY` / `ADYEN_MERCHANT_ACCOUNT` / `ADYEN_HMAC_KEY`
- [ ] 在 Stripe Dashboard 创建 webhook，URL = `https://your-domain/api/webhooks/stripe`
- [ ] 在 Adyen Customer Area 创建 Standard Notification，URL = `https://your-domain/api/webhooks/adyen`
- [ ] 在 `onPaymentUpdate` 中接入入账逻辑
- [ ] 接入黑名单（userId / 卡号 last4）
- [ ] 与 KYC 模块联动，未通过 KYC 拒绝支付
- [ ] 在监控中埋点：创建数 / 成功率 / 平均 3DS 通过率
- [ ] 配置告警：webhook 失败率 > 5% / API 5xx > 1% / 争议 (chargeback) 出现立即通知
- [ ] **生产前**用 Stripe test card `4242 4242 4242 4242`（成功）/ `4000 0000 0000 0002`（拒付）完成联调
- [ ] **生产前**用 Adyen test 卡号（参见 [Adyen Test Cards](https://docs.adyen.com/development-resources/test-cards/test-card-numbers)）完成联调
