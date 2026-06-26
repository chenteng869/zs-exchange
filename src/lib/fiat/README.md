# Fiat Module - 法币通道

> 中萨数字科技交易所 (SMY Exchange) P2 模块：完整法币入金/出金通道
>
> 覆盖 6 大支付通道、25 个法币币种、银行账户管理、AML/KYC 检测、限额管理、报表生成。

## 目录

- [架构概览](#架构概览)
- [6 大支付通道对比](#6-大支付通道对比)
- [25 法币支持矩阵](#25-法币支持矩阵)
- [KYC 等级与限额](#kyc-等级与限额)
- [AML / CTF 规则](#aml--ctf-规则)
- [快速上手](#快速上手)
- [完整调用示例](#完整调用示例)
- [错误码](#错误码)
- [集成 Stripe/Adyen/MoonPay](#集成-stripeadyenmoonpay)

---

## 架构概览

```
src/lib/fiat/
├── types.ts                  # 统一类型 + 常量
├── currency-registry.ts      # 25 法币注册表 + 汇率
├── aml-kyc.ts                # AML/KYC 检测
├── fiat-engine.ts            # 业务层（银行账户/报价/交易/限额/报表）
├── index.ts                  # 统一导出
├── README.md                 # 本文档
└── channels/
    ├── swift.ts              # SWIFT 国际电汇
    ├── sepa.ts               # SEPA 欧元区
    ├── ach.ts                # ACH 美国自动清算
    └── local-channels.ts     # FPS / PIX / UPI 本地支付
```

**模块依赖关系**：

```
FiatEngine
   ├── CurrencyRegistry       (25 法币 + 汇率)
   ├── AmlKycService          (制裁名单 / PEP / CTR / SAR / 限额)
   └── ChannelAdapter (6)     (SWIFT/SEPA/ACH/FPS/PIX/UPI)
```

---

## 6 大支付通道对比

| 通道 | 区域 | 币种 | 到账时间 | 单笔最大 | 手续费 | 必填字段 |
|------|------|------|----------|----------|--------|----------|
| **SWIFT** | 全球 | USD EUR CNY JPY 等 25+ | 1-3 工作日 | 1000 万 USD 等值 | $25 + 0.1% | SWIFT/BIC |
| **SEPA** | 欧元区 36 国 | EUR | 1 工作日 | 100 万 EUR | €1.5 + 0.05% | IBAN |
| **ACH** | 美国 | USD | 1-2 工作日 | 100 万 USD | $0.5 + 0.03% | ABA + Account |
| **FPS** | 英国 | GBP | 5 秒 | 10 万 GBP | £0.2 + 0.01% | Sort Code + Account |
| **PIX** | 巴西 | BRL | 10 秒 | 5 万 BRL | R$0.5 + 0.05% | PIX Key (CPF/Email/Phone) |
| **UPI** | 印度 | INR | 15 秒 | 10 万 INR | ₹5 + 0.2% | VPA + IFSC |

> 演示降级：所有通道在 API Key 缺失时自动降级到 mock 模式，返回稳定数据。

---

## 25 法币支持矩阵

| Code | Name | Symbol | Decimals | 支持通道 |
|------|------|--------|----------|----------|
| **USD** | US Dollar | $ | 2 | SWIFT ACH CARD |
| **EUR** | Euro | € | 2 | SWIFT SEPA CARD |
| **GBP** | British Pound | £ | 2 | SWIFT FPS CARD |
| **CNY** | Chinese Yuan | ¥ | 2 | SWIFT CARD |
| **JPY** | Japanese Yen | ¥ | 0 | SWIFT CARD |
| **KRW** | South Korean Won | ₩ | 0 | SWIFT CARD |
| **HKD** | Hong Kong Dollar | HK$ | 2 | SWIFT CARD |
| **SGD** | Singapore Dollar | S$ | 2 | SWIFT CARD |
| **AUD** | Australian Dollar | A$ | 2 | SWIFT CARD |
| **CAD** | Canadian Dollar | C$ | 2 | SWIFT CARD |
| **INR** | Indian Rupee | ₹ | 2 | SWIFT UPI |
| **BRL** | Brazilian Real | R$ | 2 | SWIFT PIX |
| **MXN** | Mexican Peso | Mex$ | 2 | SWIFT CARD |
| **CHF** | Swiss Franc | CHF | 2 | SWIFT SEPA CARD |
| **NZD** | New Zealand Dollar | NZ$ | 2 | SWIFT CARD |
| **THB** | Thai Baht | ฿ | 2 | SWIFT CARD |
| **MYR** | Malaysian Ringgit | RM | 2 | SWIFT CARD |
| **IDR** | Indonesian Rupiah | Rp | 0 | SWIFT CARD |
| **PHP** | Philippine Peso | ₱ | 2 | SWIFT CARD |
| **VND** | Vietnamese Dong | ₫ | 0 | SWIFT CARD |
| **RUB** | Russian Ruble | ₽ | 2 | SWIFT |
| **ZAR** | South African Rand | R | 2 | SWIFT CARD |
| **TRY** | Turkish Lira | ₺ | 2 | SWIFT CARD |
| **NGN** | Nigerian Naira | ₦ | 2 | SWIFT CARD |
| **ARS** | Argentine Peso | $ | 2 | SWIFT |

---

## KYC 等级与限额

| 等级 | Daily (USD) | Monthly (USD) | Yearly (USD) |
|------|-------------|---------------|--------------|
| **basic**（Lv.1 初级） | 1,000 | 5,000 | 30,000 |
| **advanced**（Lv.2 高级） | 50,000 | 200,000 | 1,000,000 |
| **institutional**（Lv.3 机构） | unlimited | unlimited | unlimited |

```ts
import { KYC_LIMITS, FiatEngine } from '@/lib/fiat';

const engine = new FiatEngine();
engine.setUserProfile('user-1', { kycLevel: 'basic' });
const limits = await engine.getLimits('user-1');
// limits.dailyDeposit.limit = '1000'
```

---

## AML / CTF 规则

### 检测维度

1. **制裁名单**（OFAC SDN，50+ 实体/个人）
   - 命中：直接 BLOCK
2. **政治人物 PEP**
   - 命中：WARN（增强尽调）
3. **高风险国家**（FATF 黑名单：IR / KP / SY / CU）
   - 命中：直接 BLOCK
4. **CTR（Currency Transaction Report）**
   - 单笔 ≥ 10,000 USD：触发 CTR 报告
5. **SAR（Suspicious Activity Report）**
   - 单笔 ≥ 5,000 USD：触发 SAR 监控
6. **拆分检测（Structuring）**
   - 24h 内多笔单笔 < 10,000 USD 但累计 ≥ 10,000 USD
   - 命中：BLOCK
7. **异常时段**
   - 北京时间 02:00-06:00 大额操作：WARN
8. **KYC 等级 / 过期**
   - 超等级限额：BLOCK
   - KYC 过期：BLOCK

```ts
import { createAmlKycService, AML_HIGH_RISK_COUNTRIES, CTR_THRESHOLD } from '@/lib/fiat';

const aml = createAmlKycService();
const result = await aml.checkDeposit('user-1', '15000', 'USD', {
  kycLevel: 'advanced',
  fullName: 'Alice Doe',
  country: 'US',
});

if (!result.passed) {
  console.log('blocked:', result.blocks);
  // 输出: ['exceeds KYC advanced daily limit']
}
```

---

## 快速上手

```ts
import { FiatEngine, createFiatEngine } from '@/lib/fiat';

const engine = createFiatEngine();

// 1. 设置用户 KYC
engine.setUserProfile('user-001', {
  kycLevel: 'advanced',
  fullName: 'Alice Doe',
  country: 'US',
});

// 2. 添加银行账户
const account = await engine.addBankAccount({
  userId: 'user-001',
  channel: 'ACH',
  country: 'US',
  currency: 'USD',
  holderName: 'Alice Doe',
  routingNumber: '021000021',  // JPMorgan Chase
  accountNumber: '12345678',
});

// 3. 验证（小额打款 / 强制验证）
await engine.verifyBankAccount(account.id, { autoVerify: true });

// 4. 获取报价
const quote = await engine.getQuote({
  userId: 'user-001',
  channel: 'ACH',
  fiatCurrency: 'USD',
  fiatAmount: '1000',
  cryptoAsset: 'USDT',
});
console.log(quote);
// {
//   id: 'q-xxx',
//   fee: '10.00',
//   exchangeRate: '1.00000000',
//   netCryptoAmount: '990.00000000',
//   expiresAt: 1700000000000,  // 60s 后
//   ...
// }

// 5. 创建入金订单
const tx = await engine.createDeposit({
  userId: 'user-001',
  channel: 'ACH',
  fiatCurrency: 'USD',
  fiatAmount: '1000',
  bankAccountId: account.id,
  cryptoAsset: 'USDT',
});

// 6. 跟踪状态
const tracked = await engine.trackTransaction(tx.id);
console.log(tracked.status);  // 'submitted' | 'processing' | 'completed'
```

---

## 完整调用示例

### 入金 USD（ACH）

```ts
const engine = createFiatEngine();
engine.setUserProfile('u-1', { kycLevel: 'advanced' });
const acc = await engine.addBankAccount({
  userId: 'u-1', channel: 'ACH', country: 'US', currency: 'USD',
  holderName: 'Alice', routingNumber: '021000021', accountNumber: '12345678',
});
await engine.verifyBankAccount(acc.id, { autoVerify: true });

const quote = await engine.getQuote({
  userId: 'u-1', channel: 'ACH', fiatCurrency: 'USD', fiatAmount: '5000',
});
const tx = await engine.createDeposit({
  userId: 'u-1', channel: 'ACH', fiatCurrency: 'USD', fiatAmount: '5000',
  bankAccountId: acc.id, quoteId: quote.id,
});
// tx.status === 'submitted'
// tx.fee === '30.00' (0.5% + 5)
// tx.cryptoAmount === '4970.00000000'
```

### 出金 EUR（SEPA）

```ts
const acc = await engine.addBankAccount({
  userId: 'u-1', channel: 'SEPA', country: 'DE', currency: 'EUR',
  holderName: 'Hans Müller',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
});
await engine.verifyBankAccount(acc.id, { autoVerify: true });
const tx = await engine.createWithdraw({
  userId: 'u-1', channel: 'SEPA', fiatCurrency: 'EUR', fiatAmount: '2000',
  bankAccountId: acc.id,
});
```

### 入金 INR（UPI）

```ts
const acc = await engine.addBankAccount({
  userId: 'u-1', channel: 'UPI', country: 'IN', currency: 'INR',
  holderName: 'Anil Kumar', vpa: 'anil@oksbi', ifsc: 'SBIN0001234',
});
await engine.verifyBankAccount(acc.id, { autoVerify: true });
const tx = await engine.createDeposit({
  userId: 'u-1', channel: 'UPI', fiatCurrency: 'INR', fiatAmount: '50000',
  bankAccountId: acc.id,
});
// tx.expectedArrival - tx.createdAt <= 16s
```

### 报表生成

```ts
// 日报
const daily = await engine.getDailyReport(Date.now());
// { period, totalDeposit, totalWithdraw, totalFee, byChannel, byCurrency, byStatus }

// 月报
const monthly = await engine.getMonthlyReport(Date.now());
```

### 限额查询

```ts
const limits = await engine.getLimits('user-001');
// {
//   kycLevel: 'advanced',
//   dailyDeposit: { used: '500', limit: '50000' },
//   dailyWithdraw: { used: '0', limit: '50000' },
//   ...
// }

const check = engine.checkLimit('user-001', 'deposit', '1000000', 'USD');
// { passed: false, reason: 'exceeds KYC advanced daily limit ...' }
```

---

## 错误码

| 错误类 | 错误码 | 含义 |
|--------|--------|------|
| `FiatError` | `AML_BLOCKED` | AML 检测阻断 |
| `FiatValidationError` | `INVALID_ACCOUNT` | 银行账户无效 |
| `FiatValidationError` | `INVALID_AMOUNT` | 金额无效 |
| `FiatValidationError` | `INVALID_IBAN` | IBAN 格式错 |
| `FiatValidationError` | `INVALID_SWIFT` | SWIFT/BIC 格式错 |
| `FiatValidationError` | `INVALID_ROUTING` | ABA 路由号错 |
| `FiatValidationError` | `INVALID_SORT_CODE` | UK Sort Code 错 |
| `FiatValidationError` | `INVALID_PIX` | PIX Key 错 |
| `FiatValidationError` | `INVALID_VPA` | UPI VPA 错 |
| `FiatValidationError` | `INVALID_IFSC` | IFSC 错 |
| `FiatValidationError` | `ACCOUNT_NOT_FOUND` | 银行账户不存在 |
| `FiatValidationError` | `ACCOUNT_UNVERIFIED` | 银行账户未验证 |
| `FiatValidationError` | `USER_NOT_FOUND` | 用户不存在 |
| `FiatValidationError` | `UNSUPPORTED_CURRENCY` | 币种不支持 |
| `FiatValidationError` | `UNSUPPORTED_CHANNEL` | 通道不支持 |
| `FiatValidationError` | `QUOTE_NOT_FOUND` | 报价不存在 |
| `FiatValidationError` | `QUOTE_EXPIRED` | 报价已过期（> 60s） |
| `FiatLimitError` | `LIMIT_EXCEEDED` | 超出 KYC 限额 |
| `FiatAmlError` | `AML_BLOCKED` | AML 阻断（含制裁/PEP/高风险/拆分/限额） |

---

## 集成 Stripe/Adyen/MoonPay

### 与现有模块协作

```ts
import { FiatEngine } from '@/lib/fiat';
import { MoonPayClient, MoonPayTransactionManager } from '@/lib/onramp';
import { PaymentService } from '@/lib/payment';

// 场景：法币入金通过 MoonPay（外部 onramp）
const moonpay = new MoonPayClient({ apiKeyPublic, apiKeySecret });
const moonpayMgr = new MoonPayTransactionManager({ client: moonpay });
const onrampTx = await moonpayMgr.createBuyOrder({
  userId: 'user-1', crypto: 'USDT', fiat: 'USD',
  fiatAmount: 1000, walletAddress: '0x...',
});

// 场景：银行卡入金通过 Stripe/Adyen（payment 模块）
const payment = new PaymentService({ stripe: stripeClient, adyen: adyenClient });
const paymentOrder = await payment.createCardPayment({
  userId: 'user-1', amount: 1000, currency: 'USD',
  card: { ... }, billingAddress: { ... },
});

// 场景：银行电汇通过 FiatEngine（fiat 模块 - 新增）
const fiatEngine = new FiatEngine();
const swiftTx = await fiatEngine.createDeposit({
  userId: 'user-1', channel: 'SWIFT', fiatCurrency: 'USD', fiatAmount: '1000',
  bankAccountId: 'ba-1',
});
```

### 路由决策

| 场景 | 推荐通道 | 模块 |
|------|----------|------|
| 信用卡入金（个人/中小额） | Stripe / Adyen | `lib/payment` |
| 第三方买币（Apple Pay / 当地支付） | MoonPay | `lib/onramp` |
| **银行电汇（SWIFT）** | **SwiftChannel** | **`lib/fiat`** |
| **欧元区（SEPA）** | **SepaChannel** | **`lib/fiat`** |
| **美国 ACH** | **AchChannel** | **`lib/fiat`** |
| **英国 FPS** | **FpsChannel** | **`lib/fiat`** |
| **巴西 PIX** | **PixChannel** | **`lib/fiat`** |
| **印度 UPI** | **UpiChannel** | **`lib/fiat`** |

---

## 演示降级

所有通道在 `API Key` 缺失时自动进入 mock 模式：
- `SWIFT_API_KEY` / `SEPA_API_KEY` / `ACH_API_KEY` / `FPS_API_KEY` / `PIX_API_KEY` / `UPI_API_KEY`
- `CURRENCY_API_KEY`（汇率源）

mock 模式：
- 返回稳定的 reference / channelReference（基于 djb2 hash）
- 状态查询按 hash 决定（90% completed / 7% processing / 2% failed / 1% refunded）
- 汇率使用 mock USD 相对汇率表
- 制裁名单 / PEP 名单 / 高风险国家 全部生效

---

## 测试

```bash
# 运行 20+ 集成测试
npx tsx --test tests/fiat-engine.test.ts

# TypeScript 类型检查
npm run type-check
```

测试覆盖：
- CurrencyRegistry（25 法币 + 汇率 + 费率 + 限额）
- BankAccount CRUD（添加 / 验证 / 删除 / 主账户切换）
- 6 通道（金/出 + 各种校验）
- 通道字段校验（SWIFT / IBAN / ABA / Sort Code / PIX / VPA / IFSC）
- AML/KYC（制裁 / PEP / 高风险 / CTR / SAR / 拆分 / 限额 / 过期）
- FiatEngine（报价 / 入金 / 出金 / 跟踪 / 取消 / 限额 / 报表）

---

## 版本

v1.0.0 (2026-06-21) - 初始实现

