# 合规与牌照管理模块 (Compliance & License Management)

SMY 交易所的交易所级合规与牌照管理子系统。覆盖多司法管辖区牌照、合规自检、法务文档版本管理、监管报表生成与实时风险监控。

> 状态：✅ 完成 / 34 个测试用例全部通过 / TypeScript 编译 0 错误

## 目录

- [模块概览](#模块概览)
- [架构图](#架构图)
- [文件结构](#文件结构)
- [支持的牌照](#支持的牌照)
- [合规自检流程](#合规自检流程)
- [法务文档管理](#法务文档管理)
- [监管报表](#监管报表)
- [Travel Rule 实施](#travel-rule-实施)
- [制裁名单检查](#制裁名单检查)
- [关键常量](#关键常量)
- [完整调用示例](#完整调用示例)
- [牌照申请指引](#牌照申请指引)

---

## 模块概览

| 子模块 | 职责 |
|--------|------|
| `types.ts` | 全部类型定义（License / ComplianceCheck / LegalDocument / RegulatoryReport） |
| `license-registry.ts` | 牌照 CRUD、过期提醒、自检、8+ 预置牌照模板 |
| `compliance-engine.ts` | 每日 / 手动 / 触发式自检（AML / CTF / KYC / TravelRule / Sanctions / TransactionMonitoring） |
| `legal-documents.ts` | 6 类法务文档、5+ 语言、多司法管辖、用户接受记录 |
| `regulatory-reports.ts` | 5 种监管报表（CTR / SAR / MIREL / CARF / DAU）生成与提交 |
| `index.ts` | 统一导出 |

---

## 架构图

```
                          ┌──────────────────────────────┐
                          │  Compliance & License Module │
                          └──────────────┬───────────────┘
                                         │
        ┌──────────────┬─────────────────┼──────────────────┬──────────────┐
        ▼              ▼                 ▼                  ▼              ▼
  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ License  │  │  Compliance  │  │     Legal    │  │  Regulatory  │  │    Risk      │
  │ Registry │  │    Engine    │  │  Documents   │  │   Reports    │  │   Alerts     │
  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │               │                 │                 │                 │
       │  CRUD         │  runDailyCheck  │  publish        │  generateCTR    │  onAlert
       │  validate     │  AML/CTF/KYC    │  accept         │  generateSAR    │  onFinding
       │  expire check │  TravelRule     │  multi-lang     │  generateMIREL  │
       │               │  Sanctions      │                 │  generateCARF   │
       │               │  TxMonitoring   │                 │  generateDAU    │
       │               │  score(0-100)   │                 │  submit + sign  │
       └───────────────┴─────────────────┴─────────────────┴─────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │  External Data Sources        │
                          │  - Trade/Transaction History  │
                          │  - KYC Service                │
                          │  - User Activity              │
                          │  - OFAC / EU / UN SDN Lists   │
                          └──────────────────────────────┘
```

---

## 文件结构

```
src/lib/compliance/
├── README.md              # 本文件
├── index.ts               # 统一导出
├── types.ts               # 类型定义
├── license-registry.ts    # 牌照管理
├── compliance-engine.ts   # 合规自检
├── legal-documents.ts     # 法务文档
└── regulatory-reports.ts  # 监管报表

tests/
└── compliance.test.ts     # 34 个测试用例
```

---

## 支持的牌照

`LicenseType` 枚举：

| 类型 | 说明 | 监管机构 | 适用范围 |
|------|------|----------|----------|
| `SAMOA_DLT` | 萨摩亚数字账本技术牌照 | Samoa Ministry of Finance | 交易所、托管 |
| `US_FINCEN` | 美国 FinCEN MSB 注册 | FinCEN | 货币服务、兑换 |
| `CANADA_FINTRAC` | 加拿大 MSB | FINTRAC | 货币服务 |
| `MICA` | 欧盟 MiCA CASP | ESMA / Lithuania | 欧盟市场通行证 |
| `ESTONIA_MTR` | 爱沙尼亚虚拟货币服务 | EFSA | 欧盟桥头堡 |
| `AUSTRALIA_AUSTRAC` | 澳大利亚 DCE | AUSTRAC | 澳洲市场 |
| `SINGAPORE_MAS` | 新加坡 MPI | MAS | 东南亚市场 |
| `MSB` | 通用 MSB | 视司法管辖 | 货币服务 |

预置模板共 8 张，涵盖 6 个司法管辖区：Samoa / US / Canada / EU / Estonia / Australia / Singapore。

---

## 合规自检流程

`ComplianceEngine` 提供三种自检模式：

```ts
// 每日自动（建议凌晨 02:00）
const check = await engine.runDailyCheck();

// 管理员手动触发某类
const ctfCheck = await engine.runManualCheck('CTF');

// 高风险事件后触发
const triggered = await engine.runTriggeredCheck('OFAC 命中');
```

自检覆盖 6 大类：

| 类别 | 触发条件 | 严重度 |
|------|----------|--------|
| **AML** | 单笔 ≥ 10,000 USDT | medium / high |
| **CTF** | 来自 Tor / VPN 出口 IP | medium |
| **KYC** | 已过期 / 30 天内过期 | low / medium / high |
| **TravelRule** | 跨境 ≥ 1,000 USD 缺对手方信息 | high |
| **Sanctions** | 命中 OFAC / EU / UN 制裁名单 | critical |
| **TransactionMonitoring** | 拆分（24h 累计 ≥ 10k）、异常时段 | low / high |

### 综合得分

```
score = 100 - Σ (deduction[severity] × weight[category])
```

权重：AML 0.30 / KYC 0.25 / TravelRule 0.20 / Sanctions 0.15 / TxMonitor 0.10

### 告警订阅

```ts
engine.onFinding((f) => {
  if (f.severity === 'critical') pushToSlack(f);
});
engine.onAlert((a) => onCall(a));
```

---

## 法务文档管理

6 类文档：

| type | 默认需要接受 | 说明 |
|------|------------|------|
| `terms` | ✅ | 服务条款 |
| `privacy` | ✅ | 隐私政策 |
| `cookie` | ✅ | Cookie 政策 |
| `aml` | ✅ | 反洗钱政策 |
| `risk_disclosure` | ✅ | 风险披露 |
| `fee_schedule` | ❌ | 费率表 |

支持 8 种语言：`en` / `zh` / `ja` / `ko` / `es` / `fr` / `de` / `ru`
支持 7 个司法管辖区：`Global` / `EU` / `US` / `APAC` / `Samoa` / `Estonia` / `Canada`

### 发布新版本

```ts
svc.publishDocument({
  id: 'doc-terms-v2.0.0',
  type: 'terms',
  version: '2.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: markdownContent,
  effectiveAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天后生效
  publishedAt: Date.now(),
  publishedBy: 'legal@smy.exchange',
  requiresAcceptance: true,
});
```

发布后，所有未接受新版本的用户将在登录时收到待接受清单。

---

## 监管报表

5 种报表：

| type | 触发条件 | 提交方 |
|------|----------|--------|
| **CTR** | 单笔 > 10,000 USD | FinCEN（美国） |
| **SAR** | 任意可疑活动 | FinCEN / 当地 FIU |
| **MIREL** | 月度（默认 30 天） | ESMA / 国家主管 |
| **CARF** | 年度（默认 365 天） | OECD + 当地税务机关 |
| **DAU** | 单日 | 内部运营 |

### 提交流程

```ts
const rpt = await reportSvc.generateCTR();
const submitted = await reportSvc.submitReport(rpt.id); // 自动 mock 签名
// 或自定义签名
await reportSvc.submitReport(rpt.id, '0xMyMultiSigSignature');
```

---

## Travel Rule 实施

> FATF Recommendation 16

- 阈值：跨境转账 ≥ **1,000 USD**
- 强制要求：Originator（汇款人） + Beneficiary（收款人）信息
  - 姓名 / 地址 / 账户号
- 实施：合规引擎在自检时识别缺失字段 → high finding → 退回交易

### 字段要求

| 字段 | 必填 |
|------|------|
| counterparty.name | ✅ |
| counterparty.address | ✅ |
| counterparty.account | 建议 |

---

## 制裁名单检查

- 名单：mock OFAC SDN + EU + UN + HMT 列表（**50+ 条**地址）
- 链：ETH / BTC / TRX / SOL
- 命中：critical severity → 立即冻结 + SAR 报告

### 名单维护

实际生产环境应每日拉取：
- OFAC: https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV
- EU: https://webgate.ec.europa.eu/fsd/fsf
- UN: https://www.un.org/securitycouncil/content/un-sc-consolidated-list

（当前为 mock，可通过 `MOCK_SANCTIONS_LIST` 替换为实时数据源。）

---

## 关键常量

```ts
CTR_THRESHOLD_USD         = 10_000     // CTR 报告阈值
SAR_THRESHOLD_USD         =  5_000     // SAR 触发阈值
TRAVEL_RULE_THRESHOLD_USD =  1_000     // Travel Rule 阈值
KYC_RENEWAL_DAYS          =  365       // KYC 1 年续期
KYC_EXPIRY_WARNING_DAYS   =   30       // 30 天前提醒
```

权重：

```ts
COMPLIANCE_SCORE_WEIGHTS = {
  AML: 0.30,
  KYC: 0.25,
  TravelRule: 0.20,
  Sanctions: 0.15,
  TransactionMonitoring: 0.10,
};
```

---

## 完整调用示例

```ts
import {
  LicenseRegistry,
  ComplianceEngine,
  LegalDocumentService,
  RegulatoryReportService,
  getDefaultLicenseRegistry,
  getDefaultComplianceEngine,
  getDefaultLegalDocumentService,
  getDefaultRegulatoryReportService,
} from '@/lib/compliance';

// 1. 牌照管理
const reg = getDefaultLicenseRegistry();
const samoa = reg.getActiveLicenses('Samoa');
const expiring = reg.checkExpiringLicenses(60);  // 60 天内到期
const { valid, issues } = reg.validateLicenses();

// 2. 每日合规自检
const engine = getDefaultComplianceEngine();
const check = await engine.runDailyCheck();
console.log('Score:', check.score, 'Findings:', check.findings.length);

// 3. 法务文档
const docs = getDefaultLegalDocumentService();
const pending = docs.getPendingAcceptances('user-123');
for (const d of pending) {
  await docs.recordAcceptance('user-123', d.id, ip, ua);
}

// 4. 监管报表
const reports = getDefaultRegulatoryReportService();
const ctr = await reports.generateCTR();
const sar = await reports.generateSAR({
  userId: 'user-123',
  reason: 'Structuring detected',
});
const dau = await reports.generateDAU();

// 5. 提交报表
await reports.submitReport(ctr.id);
```

### 完整 Pipeline 集成

```ts
// 推荐在 next.js API 路由中
export async function POST(req: Request) {
  const action = await req.json();

  if (action.type === 'check-license') {
    const reg = new LicenseRegistry();
    return Response.json(reg.listLicenses({ jurisdiction: action.jurisdiction }));
  }

  if (action.type === 'daily-check') {
    const engine = new ComplianceEngine({
      getRecentTransactions: () => fetchTxs(),
      getAllKycRecords: () => fetchKyc(),
    });
    return Response.json(await engine.runDailyCheck());
  }

  if (action.type === 'generate-ctr') {
    const svc = new RegulatoryReportService({
      getTransactionsInRange: (s, e) => fetchTxs(s, e),
    });
    return Response.json(await svc.generateCTR());
  }
}
```

---

## 牌照申请指引

### 萨摩亚 DLT 牌照

- **主管**：Samoa Ministry of Finance, Central Bank of Samoa
- **周期**：60-90 天
- **费用**：USD 5,000-15,000
- **要求**：
  - 本地代理人（Registered Agent）
  - 资金证明 USD 100,000+
  - AML / CFT 程序
  - 反洗钱官员（MLRO）
- **优势**：英语区、政治稳定、低税、6-12 月内可获 CIMA 桥接

### 美国 FinCEN MSB

- **主管**：FinCEN（金融犯罪执法网络）
- **周期**：网申 1-2 周
- **费用**：免费
- **要求**：
  - 州级 MSB 牌照（逐州）
  - 注册人 / Beneficial Owner 申报
  - 5 年内合规历史
  - BSA / AML 程序

### 欧盟 MiCA

- **主管**：ESMA + 国家主管（如 Lithuania, Germany BaFin）
- **周期**：3-6 月
- **费用**：EUR 50,000-200,000
- **要求**：
  - 法人实体在 EU
  - 法人代表 / 董事会本地化
  - 1:1 储备证明
  - 白皮书披露（Asset Backed）
  - MiCA Art. 67 合规

### 加拿大 FINTRAC

- **主管**：FINTRAC
- **周期**：网申即时生效
- **费用**：免费
- **要求**：
  - 加拿大法人
  - KYC / CDD / EDD 程序
  - 大额报告 CTR / TPR

### 爱沙尼亚 MTR

- **主管**：EFSA（Estonian Financial Supervision Authority）
- **周期**：2-4 月
- **费用**：EUR 10,000 起
- **优势**：欧盟桥头堡，全 EU 通行证（pre-MiCA）

### 澳大利亚 AUSTRAC

- **主管**：AUSTRAC
- **周期**：90-120 天
- **费用**：AUD 5,000+

### 新加坡 MAS MPI

- **主管**：MAS
- **周期**：6-12 月
- **要求**：本地董事、CEO、MLRO 合规负责人、注册资本 SGD 250,000

---

## 数据持久化

所有服务支持 `writeFile` / `readFile` 注入，缺省时仅内存：

```ts
import fs from 'node:fs/promises';

const reg = new LicenseRegistry({
  persistPath: '.compliance-licenses.json',
  writeFile: async (path, data) => await fs.writeFile(path, data),
  readFile: async (path) => {
    try { return await fs.readFile(path, 'utf8'); }
    catch { return null; }
  },
});
await reg.load();
```

生产环境建议：
- 关系数据库（PostgreSQL）— 牌照 / 用户接受记录
- 加密对象存储（S3）— 文档原文
- 时序数据库 — 自检结果

---

## 测试

```bash
npx tsx --test tests/compliance.test.ts
```

34 个用例，覆盖：
- 7 个 LicenseRegistry
- 13 个 ComplianceEngine
- 6 个 LegalDocumentService
- 7 个 RegulatoryReportService
- 1 个集成测试

```
ℹ tests 34
ℹ pass 34
ℹ fail 0
ℹ duration_ms 609
```

---

## 进一步规划

- [ ] 接入实时 OFAC / EU 制裁名单（外部 API）
- [ ] 牌照申请向导（多步表单 + 文件上传）
- [ ] 监管报送沙盒（mock 监管平台）
- [ ] 多签签发 + 时间戳锚定（区块链存证）
- [ ] AI 合规助手（自然语言生成 SAR 报告）
- [ ] 牌照续期提醒（邮件 / 短信 / 飞书）
