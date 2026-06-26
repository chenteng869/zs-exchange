# 邮件通道（L-05：SendGrid Email Service）

SMY Exchange 邮件通知服务，基于 SendGrid v3 REST API 实现事务 / 营销 / 通知 / 安全告警全场景。

---

## 架构图

```
┌────────────────────────────────────────────────────────────────────────┐
│                          EmailService（业务编排层）                       │
│  sendOtp / verifyOtp / sendWithdrawalConfirmation / sendLoginAlert    │
│  sendSecurityAlert / sendKycResult / sendNewsletter / removeSuppression│
└────────────────────┬───────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────────┐
        │            │            │                  │
        ▼            ▼            ▼                  ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐
│EmailTpl  │  │EmailRate │  │ Verification │  │ SendGrid   │
│(8 模板)  │  │Limiter   │  │ CodeService  │  │ Client     │
│          │  │(5 维)    │  │(防重放)      │  │(HTTP+重试) │
└──────────┘  └──────────┘  └──────────────┘  └─────┬──────┘
                                                    │
                              ┌──────────────────────┼──────────────────────┐
                              │                      │                      │
                              ▼                      ▼                      ▼
                       /v3/mail/send       /v3/suppression/{type}     /v3/stats
                       (发邮件)            (退信/退订/封禁)             (统计)
```

模块组成：

| 模块 | 文件 | 职责 |
| --- | --- | --- |
| `SendGridClient` | `sendgrid-client.ts` | SendGrid v3 REST API 封装（发送 / 退订 / 退信 / 统计） |
| `EmailTemplate` | `templates.ts` | 8 个内置 HTML+text 双版本模板 |
| `EmailRateLimiter` | `email-rate-limiter.ts` | 5 维滑动窗口限流 |
| `EmailService` | `email-service.ts` | 业务编排（OTP / 提现 / 充值 / 安全 / KYC / Newsletter） |

---

## SendGrid 申请指引

### 1. 创建 SendGrid 账号

1. 访问 https://signup.sendgrid.com/ 注册
2. 完成邮箱验证 + 双因素认证
3. 在控制台 Settings → API Keys → Create API Key
4. 选择 **Full Access** 或 **Restricted Access**（推荐最小权限）
5. **复制 API Key**（形如 `SG.xxxx`）— 控制台只显示一次

### 2. Sender Authentication（发件人认证）

必须做，否则进入沙盒模式，发件地址会被强制限流到 `*@sendgrid.net`：

#### 方式 A：Domain Authentication（推荐）

1. Settings → Sender Authentication → Authenticate Your Domain
2. 选择 DNS Host（Aliyun / Cloudflare / Route53 ...）
3. 输入要认证的域名（如 `smy.exchange`）
4. SendGrid 会给出 3 条 CNAME 记录：

   | 类型 | 主机 | 值 |
   | --- | --- | --- |
   | CNAME | `s1._domainkey.smy.exchange` | `s1.domainkey.uXXXX.wlXXX.sendgrid.net` |
   | CNAME | `s2._domainkey.smy.exchange` | `s2.domainkey.uXXXX.wlXXX.sendgrid.net` |
   | CNAME | `emXXXX.smy.exchange` | `uXXXX.wlXXX.sendgrid.net` |

5. 在 DNS 提供商添加记录
6. 等待 DNS 传播（5-30 分钟），回控制台点击 **Verify**

完成后会显示一个 `return-path`（用于 SPF 校验）。

#### 方式 B：Single Sender Verification（开发期）

1. Settings → Sender Authentication → Verify a Single Sender
2. 填写 `noreply@yourdomain.com`
3. 查收验证邮件，点击确认链接

### 3. Link Branding（可选）

Settings → Link Branding → 自定义链接子域（如 `links.smy.exchange`），
需要在 DNS 加 1 条 CNAME 指向 `sendgrid.net`。

### 4. 配置环境变量

```bash
# .env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@smy.exchange
SENDGRID_FROM_NAME="SMY Exchange"
SENDGRID_REPLY_TO=support@smy.exchange
# ASM 退订管理组 ID（在 Marketing → Unsubscribe Groups 创建后获得）
SENDGRID_ASM_GROUP_ID=12345
```

---

## 完整调用示例

### 1. 基础：发一封验证邮件

```ts
import { SendGridClient, EmailService } from '@/lib/notification/email';

const sendgrid = new SendGridClient({
  apiKey: process.env.SENDGRID_API_KEY!,
  from: { email: process.env.SENDGRID_FROM_EMAIL!, name: 'SMY Exchange' },
});

const email = new EmailService({
  sendgrid,
  from: { email: 'noreply@smy.exchange', name: 'SMY Exchange' },
});

// 1) 发 OTP
const { codeId, expiresAt, maskedEmail } = await email.sendOtp(
  'alice@example.com',
  'verify_email',
);
console.log(`验证码已发到 ${maskedEmail}，有效期至 ${new Date(expiresAt).toISOString()}`);

// 2) 校验 OTP
const r = await email.verifyOtp(codeId, '123456', 'verify_email');
if (r.valid) {
  // ... 通过
} else {
  // r.reason: not_found / expired / max_attempts / mismatch / used / wrong_purpose
}
```

### 2. 提现 / 充值 / 登录告警

```ts
// 提现成功
await email.sendWithdrawalConfirmation('user-123', 'alice@example.com', {
  amount: '1.5',
  asset: 'BTC',
  address: 'bc1qxxx...',
  txHash: '0xabcdef...',
  network: 'Bitcoin',
});

// 充值到账
await email.sendDepositNotification('user-123', 'alice@example.com', {
  amount: '5000',
  asset: 'USDT',
  txHash: '0xdep...',
  network: 'Ethereum',
  confirmations: 12,
});

// 异地登录
await email.sendLoginAlert('user-123', 'alice@example.com', {
  time: '2026-06-20 10:00:00',
  ip: '1.2.3.4',
  device: 'iPhone 16',
  location: '上海',
});
```

### 3. 批量 Newsletter

```ts
const results = await email.sendNewsletter(
  [
    { email: 'a1@x.com', userId: 'u1' },
    { email: 'a2@x.com', userId: 'u2' },
    { email: 'a3@x.com', userId: 'u3' },
  ],
  {
    week: '2026-W25',
    top_gainers: 'BTC +5%\nETH +3%',
    top_losers: 'DOGE -2%',
    highlight: 'BTC 突破 7 万美元关键阻力位',
    cta_url: 'https://smy.exchange/markets',
  },
);

results.forEach((r) => console.log(`${r.to}: ${r.status}`));
```

### 4. 退信 / 退订管理

```ts
// 查询 bounces
const bounces = await email.getSuppression('bounces');
console.log('Hard bounces:', bounces);

// 用户申请恢复接收 → 从抑制列表中移除
await email.removeSuppression('bounces', 'bad@example.com');
```

### 5. 自定义模板

```ts
import { EmailTemplate } from '@/lib/notification/email';

const tmpl = new EmailTemplate();
tmpl.register({
  id: 'TPL_CUSTOM_PROMO',
  subject: '限时优惠：{title}',
  text: 'Hi {name}，...',
  html: '<h1>{title}</h1>...',
  variables: ['name', 'title'],
});

const r = tmpl.render('TPL_CUSTOM_PROMO', { name: 'Alice', title: '交易手续费 5 折' });
// → { subject, text, html }
```

---

## 模板管理

| 模板 ID | 场景 | 必需变量 |
| --- | --- | --- |
| `TPL_VERIFY_EMAIL` | 邮箱验证 | `code`, `ttl_minutes` |
| `TPL_RESET_PASSWORD` | 密码重置 | `reset_url`, `ttl_minutes` |
| `TPL_WITHDRAW_SUCCESS` | 提现成功 | `amount`, `asset`, `address`, `tx_hash`, `network` |
| `TPL_DEPOSIT_RECEIVED` | 充值到账 | `amount`, `asset`, `tx_hash`, `network`, `confirmations` |
| `TPL_LOGIN_ALERT` | 异地登录 | `time`, `ip`, `device`, `location` |
| `TPL_SECURITY_ALERT` | 安全告警 | `alert_type`, `time`, `detail` |
| `TPL_KYC_APPROVED` | KYC 通过 | `level`, `time` |
| `TPL_KYC_REJECTED` | KYC 拒绝 | `reason`, `time` |
| `TPL_NEWSLETTER` | 营销简报 | `week`, `top_gainers`, `top_losers`, `highlight`, `cta_url` |

### 模板样式

- 居中布局（max-width 600px）
- 主色 `#1677FF`
- 字号 14-16px（响应式）
- 暗色 / 亮色 友好（`@media (prefers-color-scheme: dark)`）
- 4 种 tone：`default` / `success` / `warning` / `danger` / `marketing`
- 底部固定包含：访问官网 / 联系客服 / 退订邮件

### 自定义 / 覆盖

```ts
// 覆盖 builtin（不允许删除 builtin，但可 register 覆盖）
tmpl.register({
  id: 'TPL_VERIFY_EMAIL',
  subject: '【重要】{ttl_minutes} 分钟内完成验证',
  text: '...',
  html: '...',
  variables: ['code', 'ttl_minutes'],
});
```

---

## 退订管理（ASM）

SendGrid 提供 **Subscription Management (ASM)**：每个营销邮件可附带退订链接。

### 1. 创建 Unsubscribe Group

Marketing → Unsubscribe Groups → Create New：

| Name | Description | Is Default |
| --- | --- | --- |
| Weekly Newsletter | 每周行情简报 | ❌ |
| Marketing Promos | 活动 / 优惠 | ❌ |
| Transactional | 事务邮件 | ✅ (default) |

记录返回的 **Group ID**（如 `12345`）。

### 2. 在代码中启用

```ts
const email = new EmailService({
  sendgrid,
  from: { email: 'noreply@smy.exchange' },
  asmGroupId: 12345,  // ← Newsletter 组的 ID
});
```

启用后：

- 邮件 HTML 自动包含 {{unsubscribe_url}} 占位符
- SendGrid 自动在每个收件箱底注入 "Unsubscribe" 链接
- 用户点击 → 自动写入 `/v3/suppression/unsubscribes`
- 下次 Newsletter 发送前会跳过该地址

### 3. 退订处理

```ts
// 用户重新订阅 → 删除抑制记录
await email.removeSuppression('unsubscribes', 'user@example.com');
```

---

## 频率限制规则

5 维滑动窗口（`EmailRateLimiter`）：

| 维度 | 默认 | 自定义常量 |
| --- | --- | --- |
| 同邮箱 1 分钟 | 1 条 | `RATE_LIMITS.perEmailPerMinute` |
| 同邮箱 1 小时 | 5 条 | `RATE_LIMITS.perEmailPerHour` |
| 同邮箱 1 天 | 10 条 | `RATE_LIMITS.perEmailPerDay` |
| 同用户 1 天 | 20 条 | `RATE_LIMITS.perUserPerDay` |
| 全局 1 秒 | 50 条 | `RATE_LIMITS.globalPerSecond` |

### 自定义规则

```ts
const limiter = new EmailRateLimiter({
  rules: {
    email_minute: { windowMs: 30_000, max: 2 },     // 放宽 30s 内可发 2 条
    user_day: { windowMs: 24 * 60 * 60_000, max: 50 }, // VIP 用户每天 50 条
  },
});
```

### 检查

```ts
const r = limiter.check('a@b.com', 'user-123');
if (!r.allowed) {
  // r.violation: 'email_minute' | 'email_hour' | ...
  // r.retryAfterMs: 距下次可发的冷却时间
}
```

---

## 退信处理

SendGrid 会通过 **Event Webhook** 推送退信事件。

### 1. 启用 Event Webhook

Settings → Mail Settings → Event Webhook：

- 选 **HTTP POST** 或 **Signed HTTP POST**
- 选要监听的事件：`bounce` / `dropped` / `spamreports` / `unsubscribes`
- 指定 URL：`https://api.smy.exchange/webhooks/sendgrid`

### 2. Webhook 处理器（参考）

```ts
// app/api/webhooks/sendgrid/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Email } from '@/lib/notification';

export async function POST(req: NextRequest) {
  const events = await req.json();
  for (const e of events) {
    if (e.event === 'bounce') {
      // 1. 同步到本地抑制列表
      // 2. 通知用户：邮箱被退回，建议更换
    } else if (e.event === 'spamreport') {
      // 立即从所有营销列表移除
    } else if (e.event === 'unsubscribe') {
      // 用户退订
    }
  }
  return NextResponse.json({ ok: true });
}
```

### 3. 主动查询抑制列表

```ts
const bounces = await email.getSuppression('bounces');
// [{ email: 'bad@example.com', reason: 'invalid', type: 'hard', createdAt: ... }]

// 软退信后用户改了邮箱 → 主动移除
await email.removeSuppression('bounces', 'fixed@example.com');
```

---

## 统计与监控

### 1. 拉取发送统计

```ts
const stats = await email.sendgrid.getStats({
  startDate: '2026-06-13',
  endDate: '2026-06-20',
  aggregatedBy: 'day',
});
// → { metrics: [{ metric: 'requests', data: [{ date, stats: { delivered, opens, clicks, ... } }] }] }
```

### 2. 实时打点

`EmailService` 在 `EmailResult` 中返回：

```ts
{
  messageId: 'filter-uuid-1',
  to: ['alice@example.com'],
  status: 'queued',  // queued | sent | delivered | failed | bounced | spam
  errorCode: 429,    // 失败时
  errorMessage: '...',
  sentAt: 1718000000000,
}
```

### 3. 监控指标（建议接入 Prometheus / Datadog）

- `email_send_total{category,status}` — Counter
- `email_send_duration_ms` — Histogram
- `email_rate_limit_violation_total{rule}` — Counter
- `email_suppression_total{type}` — Counter
- `email_sendgrid_retry_total{status}` — Counter（5xx/429 重试次数）

---

## 演示降级（mock 模式）

API Key 含 `mock` 关键字（如 `SG.mock-key-xxx`）或显式 `mockMode: true` 时，
**不会真实调用 SendGrid**，直接返回 mock 结果：

```ts
const sendgrid = new SendGridClient({
  apiKey: 'SG.mock-key-xxx',  // 演示降级
});

// 或：
const sendgrid = new SendGridClient({
  apiKey: 'SG.real-key',
  mockMode: true,
});

const r = await sendgrid.send({ ... });
// → { messageId: 'MOCK...', status: 'queued', sentAt: 1718000000000, to: [...] }
```

适用于：
- 本地开发
- CI / 单元测试
- 网络隔离环境

---

## 单元测试

```bash
npx tsx tests/email-service.test.ts
```

**30+ 用例**：

- ✅ SendGrid 发送成功（mock fetch）
- ✅ SendGrid 5xx 重试
- ✅ SendGrid 429 重试 + 尊重 X-RateLimit-Reset
- ✅ SendGrid 401 立即失败
- ✅ SendGrid mock 模式（API Key 含 mock）
- ✅ 模板渲染：TPL_VERIFY_EMAIL / TPL_WITHDRAW_SUCCESS / TPL_KYC_APPROVED
- ✅ 其余 6 个内置模板渲染
- ✅ 验证码生成（6 位数字）
- ✅ 验证码校验（正确 / 错误 / 过期 / max_attempts / used / wrong_purpose）
- ✅ 5 维限流：email_minute / email_hour / email_day / user_day / global_second
- ✅ 邮箱格式校验
- ✅ EmailService.sendOtp 完整流程（含 invalid_email / rate_limited）
- ✅ EmailService.sendWithdrawalConfirmation
- ✅ EmailService.sendNewsletter 批量
- ✅ EmailService.sendKycResult（approved / rejected）
- ✅ 退信处理：getSuppression / deleteSuppression
- ✅ 断网降级到 mock
- ✅ 退订链接注入（asmGroupId）
- ✅ SendGridClient.sendBatch
- ✅ EmailRateLimiter.reset
- ✅ BUILTIN_TEMPLATES 数量
- ✅ maskEmail / normalizeEmail

---

## 验收标准

- ✅ TypeScript 编译通过
- ✅ 30 测试用例全部通过
- ✅ 9 个模板渲染正确
- ✅ 5 维限流正确
- ✅ 验证码防重放（一次性使用）
- ✅ 退订 / 退信 / 统计 API 完整
- ✅ 失败重试（5xx / 429） + 演示降级
- ✅ 暗色 / 亮色 邮件主题适配
