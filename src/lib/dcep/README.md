# 数字人民币（DCEP / e-CNY）模块

> 央行数字货币（CBDC）接入层。覆盖钱包管理、4 级 KYC、入金 / 出金、合规审计、报表。

## 1. 什么是数字人民币

**数字人民币（Digital Currency Electronic Payment，简称 DCEP / e-CNY）** 是中国人民银行发行的法定数字货币，由央行进行信用背书，与纸钞硬币等价，属于 **央行数字货币（Central Bank Digital Currency, CBDC）** 的一种。

### 1.1 关键特征

| 特征 | 说明 |
|------|------|
| **法定货币** | 与纸钞等价，央行负债 |
| **双层运营** | 央行 → 商业银行（运营机构） → 用户 |
| **可控匿名** | 小额匿名，大额可追溯 |
| **双离线** | 双方都无网时也能完成支付（基于 NFC / 二维码） |
| **零成本** | 央行不向运营机构收取兑换费 |
| **可编程** | 支持智能合约（未来） |

### 1.2 与 USDT / 加密货币的区别

| 维度 | DCEP | USDT | BTC |
|------|------|------|-----|
| 发行方 | 中国人民银行 | Tether Limited | 无中心发行方 |
| 信用背书 | 央行 | 公司储备金 | 算力 + 共识 |
| 价格 | 1:1 锚定 CNY | 1:1 锚定 USD（理论） | 浮动 |
| 监管 | 完全合规 | 灰区 | 禁止流通 |
| 用途 | 国内零售 | 跨境 / 加密生态 | 价值存储 |

## 2. 模块结构

```
src/lib/dcep/
├── types.ts              # 类型定义 + 常量 + 工具
├── wallet-service.ts     # DcepWalletService 钱包 + 限额
├── kyc-service.ts        # DcepKycService 4 级实名
├── payment-gateway.ts    # DcepPaymentGateway 央行侧网关
├── dcep-engine.ts        # DcepEngine 业务层
├── index.ts              # 统一导出
└── README.md             # 本文档
```

## 3. 4 级 KYC 等级

| 等级 | 名称 | 要求 | 单笔限额 | 日累计 | 年累计 |
|------|------|------|----------|--------|--------|
| **L0** | 匿名 | 仅注册 | 0 | 0 | 0 |
| **L1** | 弱实名 | 手机号 + 短信码 | ¥1,000 | ¥5,000 | ¥50,000 |
| **L2** | 实名 | 身份证 + 姓名 + OCR | ¥50,000 | ¥200,000 | ¥1,000,000 |
| **L3** | 强实名 | 身份证 + 银行卡 + 活体 | 不限 | 不限 | 不限 |

参考依据：《反洗钱法》《金融机构反洗钱规定》《央行数字货币试点管理办法（征求意见稿）》。

### 3.1 KYC 有效期

KYC 记录有效期 **2 年（730 天）**，到期前应引导用户重新认证。

## 4. 限额管理

```ts
import { DcepEngine, DCEP_KYC_LIMITS } from '@/lib/dcep';

const engine = new DcepEngine();
const limits = engine.getWalletService().getLimits('user-1');
// {
//   kycLevel: 2,
//   anonymous: { single: '0', daily: '0', yearly: '0' },
//   lightKyc: { single: '1000', daily: '5000', yearly: '50000' },
//   fullKyc: { single: '50000', daily: '200000', yearly: '1000000' },
//   enhancedKyc: { single: 'unlimited', daily: 'unlimited', yearly: 'unlimited' },
// }

// 检查
const r = engine.getWalletService().checkLimit('user-1', '1000');
if (r.passed) engine.getWalletService().consumeLimit('user-1', '1000');
```

### 4.1 限额重置

- **每日**：UTC 0 点（北京时间 8 点）重置
- **每年**：用户首笔交易日 + 365 天重置
- 调用 `engine.getWalletService().resetDailyLimits()` 强制重置（生产应通过 cron 触发）

## 5. 完整调用示例

### 5.1 接入流程

```ts
import {
  DcepEngine,
  DcepKycService,
  DcepPaymentGateway,
  DcepWalletService,
  DCEP_SUPPORTED_BANKS,
} from '@/lib/dcep';

const engine = new DcepEngine();
const walletSvc = engine.getWalletService();
const kycSvc = engine.getKycService();

// 1) 用户注册手机号（弱实名）
await kycSvc.verifyLightKyc('13800000000', '123456');
const kyc1 = kycSvc.registerLightKyc('user-1', '13800000000', '123456');

// 2) 创建钱包
const wallet = walletSvc.createWallet('user-1', kyc1.level);
console.log('wallet created:', wallet.id, wallet.walletId);

// 3) 激活钱包（短信码）
const activated = walletSvc.activateWallet(wallet.id, '123456');
console.log('activated:', activated.status); // 'active'

// 4) 升级到实名（可选）
await kycSvc.verifyFullKyc({
  userId: 'user-1',
  realName: '张三',
  idType: '身份证',
  idNumber: 'test-110101199001011234',
  frontImg: 'base64...',
  backImg: 'base64...',
});
const kyc2 = kycSvc.registerFullKyc({
  userId: 'user-1',
  realName: '张三',
  idType: '身份证',
  idNumber: 'test-110101199001011234',
});
```

### 5.2 入金（DCEP → USDT）

```ts
// 1) 询价
const quote = await engine.getQuote('1000', 'USDT');
console.log(`报价：${quote.dcepAmount} DCEP = ${quote.cryptoAmount} USDT`);
console.log(`汇率：${quote.exchangeRate}，手续费：${quote.fee}`);
console.log(`过期时间：${new Date(quote.expiresAt).toISOString()}`);

// 2) 入金
const tx = await engine.deposit('user-1', {
  amount: '1000',
  bankName: '工商银行',
  bankAccount: '6222021234567890123',
  reference: 'INV-2026-001',
});
console.log(`交易 ${tx.id} 状态：${tx.status}`);
console.log(`央行流水：${tx.centralTxId}`);
console.log(`USDT 入账：${tx.cryptoAmount}`);
```

### 5.3 出金（USDT → DCEP）

```ts
const tx = await engine.withdraw('user-1', {
  amount: '500',
  bankName: '建设银行',
  bankAccount: '6227001234567890123',
  reference: 'WD-2026-001',
});
console.log(`出金 ${tx.id} 状态：${tx.status}`);
```

### 5.4 状态查询

```ts
// 单笔
const tx = await engine.trackTransaction('dcep-abc123');
console.log(tx);

// 用户全部交易
const list = engine.getUserTransactions('user-1', 20);
list.forEach((t) => console.log(t.id, t.status, t.amount, t.createdAt));
```

### 5.5 报表 + 合规

```ts
// 日报表
const daily = await engine.getDailyReport('2026-06-21');
console.log(daily);
// {
//   period: 'daily',
//   totalDeposit: '5000.00',
//   totalWithdraw: '2000.00',
//   totalFee: '7.00',
//   transactionCount: 4,
//   retainedUntil: 2033-06-21...
// }

// 月报表
const monthly = await engine.getMonthlyReport('2026-06');

// 合规审计
const r = await engine.complianceCheck('dcep-abc123');
if (!r.passed) {
  console.error('违规：', r.violations);
}
```

## 6. 合规审计

### 6.1 央行要求

- 7 年交易记录保留（`DCEP_REPORT_RETENTION_DAYS = 2555`）
- 单笔 ≥ ¥50,000 触发 **大额交易报告（CTR）**
- 24h 累计 ≥ ¥100,000 触发 **可疑活动报告（SAR）**
- 所有交易上报央行运营机构（工行 / 农行 / 中行 / 建行 / 交行 / 邮储 / 招商）

### 6.2 AML 集成

DCEP 模块直接复用 `src/lib/fiat/aml-kyc.ts` 的 `AmlKycService`：

- OFAC 制裁名单
- PEP（政治人物）
- FATF 高风险国家
- 大额 / 拆分 / 异常时段检测

```ts
// 引擎内部已自动集成
const amlResult = await aml.checkDeposit(userId, amount, 'CNY', {
  kycLevel: 'basic',
  fullName: kyc.realName,
});
```

## 7. 与现有法币通道整合

```
                  ┌────────────────────┐
                  │  src/lib/dcep      │  ← DCEP（数字人民币）
                  │  DcepEngine        │
                  └────────┬───────────┘
                           │
       ┌───────────────────┼────────────────────┐
       │                   │                    │
       ▼                   ▼                    ▼
┌──────────────┐   ┌──────────────┐    ┌────────────────┐
│ src/lib/fiat │   │ src/lib/auth │    │ src/lib/payment│
│ FiatEngine   │   │ KYC / 2FA    │    │ Stripe / Adyen │
│ 25 法币      │   │ 短信码       │    │ 银行卡         │
└──────────────┘   └──────────────┘    └────────────────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │  统一 USDT 余额     │
                  │  (exchange-account)│
                  └────────────────────┘
```

### 7.1 整合点

1. **共享 KYC**：4 级 DCEP KYC 与现有 KYC 等级映射
   ```ts
   // DCEP L2 (实名) → Fiat advanced
   kyc.registerFullKyc({ ... });
   fiatEngine.setUserKycLevel('user-1', 'advanced');
   ```

2. **共享 AML**：DCEP 与法币共用 `AmlKycService`
   ```ts
   // DCEP 引擎内部已注入
   const aml = createAmlKycService();
   ```

3. **共享限额**：DCEP 日累计 + 法币日累计 ≤ 用户 KYC 上限
   ```ts
   const dcepUsed = walletSvc.checkLimit('user-1', '1000');
   const fiatUsed = fiatEngine.getLimits('user-1').dailyDeposit;
   ```

4. **统一报表**：日 / 月报表合并 DCEP + 法币
   ```ts
   const dcepDaily = await dcepEngine.getDailyReport(date);
   const fiatDaily = await fiatEngine.getDailyReport(date);
   // 合并
   ```

## 8. 央行侧网关

### 8.1 端点（mock）

```
POST  {endpoint}/transactions           # 提交
GET   {endpoint}/transactions/:id       # 查询
POST  {endpoint}/settle                  # 结算
```

```
endpoint: https://api.dcep.example.com/v1
auth:     X-API-KEY: <central-bank-api-key>
```

### 8.2 生产对接

真实环境应通过：

1. **专线 / VPN**：与央行运营机构（工行 / 农行等）建立专线
2. **国密算法**：SM2（签名）+ SM3（摘要）+ SM4（加密）
3. **mTLS**：双向证书认证
4. **签名校验**：所有回调必须验证 HMAC-SM3

```ts
// payment-gateway.ts 留有验签接口
const gw = new DcepPaymentGateway({ apiKey: process.env.DCEP_API_KEY });
const ok = gw.verifySignature(payload, signature);
```

## 9. 演示降级

- **央行接口**：默认 mock 模式（`mockMode: true`），无真实网络
- **短信码**：演示码 `123456` 通过
- **KYC 验证**：身份证号 `test-*` / `mock-*` / `demo-*` 前缀自动通过
- **央行交易 ID**：`dcepcn-<hash>` 形式
- **金额**：string（精度 2 位小数，bigint 内部运算）

## 10. 测试

```bash
npx tsx --test tests/dcep.test.ts
```

17 个测试用例覆盖：
- 钱包管理（create / activate / freeze / checkLimit / consumeLimit）
- 4 级 KYC（light / full / enhanced / isKycValid）
- 央行网关（submit / query / 验签）
- 业务引擎（quote / deposit / withdraw）
- 限额 / 合规 / 报表

## 11. 未来路线图

- [ ] 双离线支付（NFC / 二维码）
- [ ] 智能合约（可编程 DCEP）
- [ ] 跨境支付（mBridge 项目）
- [ ] 硬件钱包集成
- [ ] 央行数字货币桥接（CBDC Bridge）
