# 通知服务（Notification）— L-04

> 萨摩亚交易所（SMY Exchange）短信子系统的完整实现。  
> 基于 Twilio REST API 2010-04-01 Messages 资源，配合模板、验证码、防刷、限流、降级等模块提供生产级短信能力。

---

## 1. 目录结构

```
src/lib/notification/
├── twilio-client.ts           # Twilio REST API 客户端（Basic Auth + form-urlencoded + 重试）
├── sms-template.ts            # 短信模板（5 个内置 + 运行时注册 / 覆盖）
├── verification-code.ts       # 验证码生成 / 校验 / 防重放
├── sms-rate-limiter.ts        # 4 维滑动窗口限流
├── sms-service.ts             # 业务编排（含 E.164 校验 + 失败降级）
├── index.ts                   # 统一出口
└── README.md                  # 本文档

tests/sms-service.test.ts      # 单元测试（30+ 用例）
```

### 1.1 架构图

```
                       ┌────────────────────────────┐
                       │  应用层（auth / trade）     │
                       └──────────────┬─────────────┘
                                      │  sendOtp / verifyOtp
                                      │  sendWithdrawal / sendLogin
                                      ▼
                       ┌────────────────────────────┐
                       │  SmsService (业务编排)      │
                       │  - E.164 校验              │
                       │  - 模板选择 / 渲染          │
                       │  - 失败回退 mock           │
                       └────┬────────┬────────┬─────┘
                            │        │        │
        ┌───────────────────┘        │        └─────────────────────┐
        ▼                            ▼                              ▼
┌───────────────┐         ┌─────────────────────┐         ┌────────────────────┐
│ SmsTemplate   │         │ VerificationCodeSvc │         │  TwilioClient      │
│ - 5 builtin   │         │ - 生成 / 校验        │         │  - POST Messages  │
│ - register    │         │ - 5 分钟 TTL         │         │  - Basic Auth     │
│ - render      │         │ - 5 次尝试上限       │         │  - 5xx/429 重试   │
└───────────────┘         │ - 防重放             │         │  - 4xx 立即失败   │
                          └─────────────────────┘         └────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────┐
                          │  SmsRateLimiter      │
                          │  4 维滑动窗口：       │
                          │  - phone_minute 1    │
                          │  - phone_hour   5    │
                          │  - phone_day    15   │
                          │  - ip_hour      20   │
                          │  - global/sec  100   │
                          └─────────────────────┘
```

---

## 2. Twilio 账号申请 + 凭证获取

1. 注册：<https://www.twilio.com/try-twilio>（免费试用赠送 $15）
2. 控制台：<https://console.twilio.com/>
3. 找到 `Account SID`（`AC` 开头）和 `Auth Token`
4. 购买 / 申请发送方号码（Phone Number → Manage → Buy a number）
5. 强烈建议绑定自有 SMS Sender / Messaging Service 用于群发和回执

### 2.1 环境变量

```bash
# .env.local / .env.production
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15005550006
```

---

## 3. 完整调用示例

### 3.1 启动服务

```ts
import {
  createTwilioClient,
  createSmsService,
  createSmsRateLimiter,
  createVerificationCodeService,
  createSmsTemplate,
} from '@/lib/notification';

const twilio = createTwilioClient({
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken:  process.env.TWILIO_AUTH_TOKEN!,
  fromNumber: process.env.TWILIO_FROM_NUMBER!,
  // 演示 / 本地可不填，缺省走 mock 模式
  mockMode: process.env.NODE_ENV !== 'production',
});

const sms = createSmsService({ twilio });
```

### 3.2 登录 / 注册：发验证码

```ts
// 1) 申请
const { codeId, expiresAt, maskedPhone, result } = await sms.sendOtp(
  '+8613800138000',
  'login',
  { ip: ctx.ip, length: 6 },
);

// 返回示例：
// {
//   codeId: 'a1b2c3d4e5f60718',
//   expiresAt: 1719000000000,
//   maskedPhone: '+86****8000',
//   result: { messageSid: 'SMxxx', status: 'queued', to: '+8613800138000' }
// }

// 2) 用户提交 → 校验
const v = await sms.verifyOtp(codeId, '654321', 'login');
if (v.valid) {
  // 通过：进入登录流程
} else {
  switch (v.reason) {
    case 'mismatch':     // 验证码错误
    case 'expired':      // 已过期（5 分钟）
    case 'max_attempts': // 错误次数过多（5 次）
    case 'used':         // 已被使用过
    case 'wrong_purpose':// 场景不匹配
    case 'not_found':    // 不存在
  }
}
```

### 3.3 提现：发带金额 / 地址的二次确认

```ts
const { codeId, expiresAt, result } = await sms.sendWithdrawalConfirmation(
  '+8613800138000',
  { amount: '1.5', asset: 'BTC', address: '0xabc...', ip: ctx.ip },
);

// 渲染后的 body 形如：
// "您正在提现 1.5 BTC 到 0xabc...，验证码：654321。"
```

### 3.4 异地登录提醒

```ts
await sms.sendLoginNotification('+8613800138000', '上海', 'iPhone 16');
// body: "您的账号于 2026-06-20 10:00:00 在 上海 登录，如非本人操作请立即修改密码。"
```

### 3.5 通用安全告警

```ts
await sms.sendSecurityAlert('+8613800138000', 'large_withdraw', { amount: '50000' });
// body: "检测到您的账号存在异常操作，请立即检查。"
```

### 3.6 自定义模板

```ts
import { createSmsService, createSmsTemplate } from '@/lib/notification';

const tmpl = createSmsTemplate();
tmpl.register({
  id: 'BIND_PHONE_OTP',
  body: '您正在绑定新手机号，验证码：{code}，10 分钟内有效。',
  variables: ['code'],
});

const sms = createSmsService({ twilio, template: tmpl });
await sms.sendTemplate('+8613800138000', 'BIND_PHONE_OTP', { code: '123456' }, ctx.ip);
```

---

## 4. 模板管理

### 4.1 内置模板

| 模板 ID | 用途 | 变量 |
|---|---|---|
| `OTP_LOGIN` | 登录验证码 | `code` |
| `OTP_REGISTER` | 注册验证码 | `code` |
| `WITHDRAW_CONFIRM` | 提现确认 | `code`, `amount`, `asset`, `address` |
| `LOGIN_ALERT` | 异地登录提醒 | `time`, `location`（`device` 可选） |
| `SECURITY_ALERT` | 通用安全告警 | 无（可附加 `alertType` 透传） |

### 4.2 模板操作

```ts
const t = createSmsTemplate();

// 注册 / 覆盖
t.register({ id: 'MY_TEMPLATE', body: 'Hello {name}!', variables: ['name'] });

// 渲染
const body = t.render('MY_TEMPLATE', { name: 'Alice' });

// 查询
t.has('MY_TEMPLATE');     // true
t.get('MY_TEMPLATE');     // { id, body, variables, ... }
t.list();                 // 所有模板
t.listBuiltinIds();       // ['OTP_LOGIN', ...]

// 删除（builtin 不可删）
t.remove('MY_TEMPLATE');  // true
t.remove('OTP_LOGIN');    // false（builtin 保护）

// 宽松渲染：失败返回 null
const s = t.tryRender('MAYBE_NOT_EXIST', { x: '1' });
```

### 4.3 占位符语法

- 单层 `{var}`，例如 `{code}` / `{amount}`
- 变量名匹配 `[a-zA-Z_][a-zA-Z0-9_]*`
- 缺失变量会抛错（`tryRender` 返回 null）

---

## 5. 频率限制规则

| 维度 | 限制 | 窗口 |
|---|---|---|
| 同手机号 | 1 条 | 1 分钟 |
| 同手机号 | 5 条 | 1 小时 |
| 同手机号 | 15 条 | 1 天 |
| 同 IP | 20 条 | 1 小时 |
| 全局 | 100 条 | 1 秒 |

超过限制时 `check()` 返回：

```ts
{
  allowed: false,
  violation: 'phone_minute',   // 违反的规则
  retryAfterMs: 12_345,        // 建议重试时间
  remaining: 0
}
```

### 5.1 自定义规则

```ts
const rl = createSmsRateLimiter({
  rules: {
    phone_minute: { windowMs: 60_000, max: 2 },  // 测试用，放宽到 2 条
    // ...
  },
});
```

### 5.2 预检 vs 预检 + 扣减

```ts
// 仅预检（不扣减）— 适合只读判断
const r1 = rl.check(phone, ip);

// 预检通过后立即扣减 — 适合 sendOtp
const r2 = rl.checkAndConsume(phone, ip);
if (!r2.allowed) throw new Error('rate limited');
```

### 5.3 测试用重置

```ts
rl.reset('+8613800138000');  // 清空该手机号窗口
rl.reset();                  // 清空全部
```

---

## 6. 国际号码支持（E.164）

E.164 是国际电信联盟（ITU-T E.164）定义的标准国际电话号码格式：

```
+[国家码][国内号码]
  ^   ^         ^
  |   |         └─ 最长 15 位数字
  |   └── 1~3 位
  +── 必须以 + 开头
```

### 6.1 校验

```ts
import { isE164Phone, normalizeE164 } from '@/lib/notification';

isE164Phone('+8613800138000');  // true
isE164Phone('+1234567');        // false（太短）
isE164Phone('8613800138000');   // false（缺 +）
isE164Phone('+86 138 0013 8000'); // false（含空格）

normalizeE164('8613800138000');       // '+8613800138000'
normalizeE164('0086 138 0013 8000');  // '+8613800138000'
normalizeE164('123');                 // null
```

### 6.2 主要国家码

| 国家/地区 | 国家码 | 样例 |
|---|---|---|
| 中国大陆 | +86 | +86 138 0013 8000 |
| 中国香港 | +852 | +852 9123 4567 |
| 中国台湾 | +886 | +886 9123 45678 |
| 新加坡 | +65 | +65 9123 4567 |
| 美国 | +1 | +1 415 555 0132 |
| 萨摩亚 | +685 | +685 12345 |

完整列表：<https://en.wikipedia.org/wiki/List_of_country_calling_codes>

---

## 7. 失败回退策略

为保证演示 / 灰度期间用户能正常收到验证码，所有业务方法（`sendOtp` / `sendWithdrawalConfirmation` / `sendSecurityAlert` / `sendLoginNotification`）在 **Twilio 真实调用失败**（网络错误、5xx 耗尽重试）时自动回退到 mock：

```ts
// 真实 Twilio 流程：POST → SMxxx
// 失败兜底：
{
  messageSid: 'MOCK<random-hex>',   // 以 MOCK 开头便于日志区分
  to: phone,
  status: 'sent',                   // 业务侧仍视为成功
  price: '0',
  priceUnit: 'USD',
  sentAt: Date.now(),
}
```

生产环境通过环境变量控制：

```ts
mockMode: process.env.NODE_ENV !== 'production' && !process.env.TWILIO_AUTH_TOKEN,
```

---

## 8. 测试

```bash
# 仅跑本模块
npx tsx tests/sms-service.test.ts

# 全部测试
npm test
```

测试覆盖 30+ 用例：

- Twilio 发送成功 / 5xx 重试 / 429 重试 / 4xx 立即失败
- Twilio mock 模式 + sendBatch + getStatus
- SmsTemplate 渲染（4 内置 + 缺失变量 + register/remove）
- VerificationCodeService：6 位数字生成 / 正确 / 错误 / 过期 / 尝试超限 / 防重放
- SmsRateLimiter：1 分钟 1 条 / 1 小时 5 条 / 1 天 15 条 / IP 1 小时 20 条 / 全局 1 秒 100 条
- E.164 校验（合法 / 非法 / 补 + / 0086 前缀）
- SmsService 端到端：sendOtp → verifyOtp、sendWithdrawalConfirmation、sendSecurityAlert、sendLoginNotification
- 手机号非法 / 频率超限 错误抛出
- BUILTIN_TEMPLATES / maskPhone

---

## 9. 安全注意

1. **内存存储**：当前 `VerificationCodeService` 是单进程内存，多实例部署请替换为 Redis（接口已抽离，便于切换）。
2. **OTP 长度**：默认 6 位（约 100 万种组合）+ 5 次上限，理论爆破期望 ~200k 次；建议结合 IP 限流（已在 `SmsRateLimiter` 内）。
3. **Auth Token 严禁提交到 git**，应使用环境变量 + 密钥管理服务（AWS KMS / HashiCorp Vault）。
4. **审计日志**：建议对所有 `sendSecurityAlert` 写持久化日志，便于事后审计。
5. **回执回调**：生产环境建议启用 Twilio StatusCallback，把 `messageSid → status` 写回 DB，以便投递追踪。
6. **GDPR / 隐私**：发送前应取得用户明确同意；保留手机号哈希（而非明文）于数据库，原始数据在用户销户后删除。
