/**
 * 法务文档服务
 *
 * 管理 6 类法务文档：
 *  - terms（服务条款）
 *  - privacy（隐私政策）
 *  - cookie（Cookie 政策）
 *  - aml（反洗钱政策）
 *  - risk_disclosure（风险披露）
 *  - fee_schedule（费率表）
 *
 * 支持：
 *  - 多语言（en / zh / ja / ko / es / fr / de / ru）
 *  - 多司法管辖（Global / EU / US / APAC / Samoa / Estonia / Canada）
 *  - 用户接受记录与重新接受判断
 *
 * @module lib/compliance/legal-documents
 */

import { randomString } from '@/lib/auth/crypto';
import type {
  LegalDocument,
  LegalDocumentType,
  LegalJurisdiction,
  LegalLanguage,
  UserAcceptance,
} from './types';

// ============================================================================
// 默认存储
// ============================================================================

const DEFAULT_PERSIST_PATH = '.compliance-legal-docs.json';

// ============================================================================
// 文档模板
// ============================================================================

/** 服务条款（英文 / Global） */
export const TPL_TERMS_OF_SERVICE: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'terms',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Terms of Service

## 1. Acceptance of Terms

By accessing or using SMY Exchange ("the Platform"), you agree to be bound by these
Terms of Service. If you do not agree, you may not use the Platform.

## 2. Eligibility

- You must be at least 18 years old.
- You must complete KYC verification to use full services.
- You are not a resident of a sanctioned jurisdiction.

## 3. Services

SMY Exchange provides:
- Spot trading of crypto-assets
- Custody services
- Staking
- OTC desk

## 4. Fees

Fees are described in the Fee Schedule. We reserve the right to modify fees with
30 days notice.

## 5. Risk Disclosure

Trading crypto-assets involves substantial risk. You may lose all of your capital.

## 6. Limitation of Liability

To the maximum extent permitted by law, SMY Exchange's liability is limited to
the fees paid by you in the past 12 months.

## 7. Governing Law

These Terms are governed by the laws of Samoa, with disputes resolved by binding
arbitration in Apia.
`,
  publishedBy: 'legal@smy.exchange',
  requiresAcceptance: true,
  summary: 'SMY Exchange platform service agreement',
  relatedLicenses: ['SAMOA_DLT', 'MICA'],
};

/** 隐私政策 */
export const TPL_PRIVACY_POLICY: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'privacy',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Privacy Policy

## 1. Information We Collect

- Identity documents (for KYC)
- Transaction history
- IP address and device information
- Communications

## 2. How We Use Information

- To provide services
- To comply with legal obligations
- To detect fraud and money laundering
- To improve the Platform

## 3. Data Sharing

We share data with:
- Service providers (KYC vendors, cloud)
- Regulators when required by law
- Law enforcement when compelled

## 4. Data Retention

- KYC data: 5 years after account closure
- Transaction data: 7 years
- Marketing data: until consent withdrawn

## 5. Your Rights

- Right to access
- Right to rectification
- Right to erasure (subject to retention obligations)
- Right to data portability

## 6. Contact

privacy@smy.exchange
`,
  publishedBy: 'privacy@smy.exchange',
  requiresAcceptance: true,
  summary: 'How SMY handles personal data',
  relatedLicenses: ['SAMOA_DLT', 'MICA', 'ESTONIA_MTR'],
};

/** 风险披露 */
export const TPL_RISK_DISCLOSURE: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'risk_disclosure',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Risk Disclosure

## 1. Market Risk

Crypto-asset prices are highly volatile. You may lose all invested capital.

## 2. Liquidity Risk

Some markets may have insufficient liquidity, leading to slippage or inability
to exit positions.

## 3. Counterparty Risk

Custody of crypto-assets carries counterparty risk. SMY Exchange maintains
1:1 reserves where required by law.

## 4. Technology Risk

Smart contract bugs, network outages, and hacks may result in loss of funds.
SMY maintains insurance for hot wallet balances.

## 5. Regulatory Risk

Regulatory changes may restrict your ability to use the Platform or to hold
specific assets.

## 6. Tax Risk

You are solely responsible for tax reporting in your jurisdiction.
`,
  publishedBy: 'legal@smy.exchange',
  requiresAcceptance: true,
  summary: 'Key risks of using SMY Exchange',
  relatedLicenses: ['SAMOA_DLT', 'MICA', 'US_FINCEN'],
};

/** 反洗钱政策 */
export const TPL_AML_POLICY: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'aml',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Anti-Money Laundering Policy

## 1. Compliance Framework

SMY Exchange adheres to the FATF Recommendations and the AML/CFT laws of all
jurisdictions in which we operate.

## 2. KYC / CDD

- Identity verification on registration
- Enhanced due diligence for high-risk customers
- Beneficial ownership identification

## 3. Transaction Monitoring

- Real-time monitoring of all transactions
- Threshold-based alerts (USD 10,000+)
- Pattern detection (structuring, layering)

## 4. Sanctions

We screen all counterparties against OFAC, EU, UN, and HMT sanctions lists.

## 5. Travel Rule

We comply with the Travel Rule for transfers ≥ USD 1,000, including originator
and beneficiary information.

## 6. Reporting

We file:
- Currency Transaction Reports (CTR) for > USD 10,000
- Suspicious Activity Reports (SAR) when warranted

## 7. Recordkeeping

- 5 years post-account-closure
- 7 years for transactions
`,
  publishedBy: 'compliance@smy.exchange',
  requiresAcceptance: true,
  summary: 'SMY AML/CFT policy',
  relatedLicenses: ['US_FINCEN', 'MICA', 'ESTONIA_MTR', 'CANADA_FINTRAC'],
};

/** Cookie 政策 */
export const TPL_COOKIE_POLICY: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'cookie',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Cookie Policy

## 1. What Are Cookies

Cookies are small text files stored on your device by websites you visit.

## 2. Cookies We Use

- **Essential**: session, CSRF token
- **Analytics**: anonymous usage stats
- **Marketing**: with your consent

## 3. Your Choices

You can disable cookies via your browser. Some features may not function.
`,
  publishedBy: 'privacy@smy.exchange',
  requiresAcceptance: true,
  summary: 'Cookie usage and choices',
  relatedLicenses: ['MICA', 'ESTONIA_MTR'],
};

/** 费率表 */
export const TPL_FEE_SCHEDULE: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'> = {
  type: 'fee_schedule',
  version: '1.0.0',
  jurisdiction: 'Global',
  language: 'en',
  content: `# Fee Schedule

## Spot Trading
| Tier | 30d Volume (USDT) | Maker | Taker |
|------|-------------------|-------|-------|
| 1    | < 50,000         | 0.10% | 0.10% |
| 2    | < 250,000        | 0.08% | 0.10% |
| 3    | < 1,000,000      | 0.06% | 0.08% |
| 4    | < 10,000,000     | 0.04% | 0.06% |
| 5    | ≥ 10,000,000     | 0.02% | 0.04% |

## Deposit
- Crypto: Free
- Fiat: 0% - 1.5% (provider dependent)

## Withdrawal
- Crypto: Network fee + 0.0005 BTC equivalent
- Fiat: 0.1% (min USD 1)
`,
  publishedBy: 'finance@smy.exchange',
  requiresAcceptance: false,
  summary: 'Trading fees and withdrawal fees',
  relatedLicenses: ['SAMOA_DLT'],
};

export const DOCUMENT_TEMPLATES: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'>[] = [
  TPL_TERMS_OF_SERVICE,
  TPL_PRIVACY_POLICY,
  TPL_RISK_DISCLOSURE,
  TPL_AML_POLICY,
  TPL_COOKIE_POLICY,
  TPL_FEE_SCHEDULE,
];

// ============================================================================
// LegalDocumentService
// ============================================================================

export class LegalDocumentService {
  private readonly documents: Map<string, LegalDocument> = new Map();
  private readonly acceptances: UserAcceptance[] = [];
  private readonly persistPath: string;
  private writeFile: ((path: string, data: string) => Promise<void> | void) | undefined;
  private readFile: ((path: string) => Promise<string | null> | string | null) | undefined;

  constructor(opts?: {
    persistPath?: string;
    writeFile?: (path: string, data: string) => Promise<void> | void;
    readFile?: (path: string) => Promise<string | null> | string | null;
    initial?: Omit<LegalDocument, 'id' | 'publishedAt' | 'effectiveAt'>[];
  }) {
    this.persistPath = opts?.persistPath ?? DEFAULT_PERSIST_PATH;
    this.writeFile = opts?.writeFile;
    this.readFile = opts?.readFile;
    const initial = opts?.initial ?? DOCUMENT_TEMPLATES;
    const now = Date.now();
    for (const t of initial) {
      const id = `doc-${t.type}-${t.version}-${randomString(4)}`;
      this.documents.set(id, {
        ...t,
        id,
        publishedAt: now,
        effectiveAt: now,
        acceptanceCount: 0,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 发布 / 查询
  // --------------------------------------------------------------------------

  publishDocument(doc: LegalDocument): void {
    if (!doc.id) {
      doc.id = `doc-${doc.type}-${doc.version}-${randomString(4)}`;
    }
    if (!doc.publishedAt) doc.publishedAt = Date.now();
    if (!doc.effectiveAt) doc.effectiveAt = Date.now();
    if (doc.requiresAcceptance && doc.acceptanceCount === undefined) {
      doc.acceptanceCount = 0;
    }
    this.documents.set(doc.id, { ...doc });
    this.persist();
  }

  /**
   * 获取当前生效的文档（同 type / jurisdiction / language 下取最新 version）
   */
  getCurrentDocument(
    type: LegalDocumentType,
    jurisdiction: LegalJurisdiction | string = 'Global',
    language: LegalLanguage = 'en',
  ): LegalDocument | null {
    const candidates = Array.from(this.documents.values()).filter(
      (d) => d.type === type && d.jurisdiction === jurisdiction && d.language === language,
    );
    if (candidates.length === 0) return null;
    // 选 publishedAt 最新
    candidates.sort((a, b) => b.publishedAt - a.publishedAt);
    return { ...candidates[0] };
  }

  /**
   * 获取某类型文档的版本历史
   */
  getDocumentHistory(type: LegalDocumentType): LegalDocument[] {
    return Array.from(this.documents.values())
      .filter((d) => d.type === type)
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .map((d) => ({ ...d }));
  }

  /**
   * 获取特定 ID 的文档
   */
  getDocument(id: string): LegalDocument | null {
    const d = this.documents.get(id);
    return d ? { ...d } : null;
  }

  /**
   * 列出所有文档
   */
  listDocuments(opts?: { type?: LegalDocumentType; language?: LegalLanguage }): LegalDocument[] {
    let all = Array.from(this.documents.values()).map((d) => ({ ...d }));
    if (opts?.type) all = all.filter((d) => d.type === opts.type);
    if (opts?.language) all = all.filter((d) => d.language === opts.language);
    return all.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  // --------------------------------------------------------------------------
  // 用户接受
  // --------------------------------------------------------------------------

  /**
   * 用户需要重新接受某类型文档吗？
   *  - 文档不要求接受：false
   *  - 用户未接受过当前版本：true
   *  - 用户已接受过：false
   */
  requiresAcceptance(
    userId: string,
    type: LegalDocumentType,
    opts?: { jurisdiction?: string; language?: LegalLanguage },
  ): boolean {
    const doc = this.getCurrentDocument(
      type,
      opts?.jurisdiction ?? 'Global',
      opts?.language ?? 'en',
    );
    if (!doc) return false;
    if (!doc.requiresAcceptance) return false;
    return !this.acceptances.some(
      (a) => a.userId === userId && a.documentId === doc.id,
    );
  }

  /**
   * 记录用户接受
   */
  recordAcceptance(
    userId: string,
    documentId: string,
    ipAddress: string,
    userAgent: string,
  ): UserAcceptance {
    const doc = this.documents.get(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }
    const record: UserAcceptance = {
      id: `acc-${randomString(8)}`,
      userId,
      documentId,
      documentVersion: doc.version,
      acceptedAt: Date.now(),
      ipAddress,
      userAgent,
    };
    this.acceptances.push(record);
    if (doc.requiresAcceptance) {
      doc.acceptanceCount = (doc.acceptanceCount ?? 0) + 1;
    }
    this.persist();
    return { ...record };
  }

  /**
   * 获取某文档的接受率（接受人数 / 系统总用户数估算，简化：返回接受数）
   */
  getAcceptanceRate(documentId: string): number {
    const doc = this.documents.get(documentId);
    if (!doc) return 0;
    const count = this.acceptances.filter((a) => a.documentId === documentId).length;
    // 假设总用户基线（实际应由 user service 提供）
    const baseline = 1000;
    return Math.min(1, count / baseline);
  }

  /**
   * 真实接受数
   */
  getAcceptanceCount(documentId: string): number {
    return this.acceptances.filter((a) => a.documentId === documentId).length;
  }

  /**
   * 获取用户的待接受文档
   */
  getPendingAcceptances(userId: string): LegalDocument[] {
    const out: LegalDocument[] = [];
    const types: LegalDocumentType[] = [
      'terms', 'privacy', 'cookie', 'aml', 'risk_disclosure', 'fee_schedule',
    ];
    for (const t of types) {
      if (this.requiresAcceptance(userId, t)) {
        const doc = this.getCurrentDocument(t);
        if (doc) out.push({ ...doc });
      }
    }
    return out;
  }

  /**
   * 获取用户已接受的文档
   */
  getUserAcceptances(userId: string): UserAcceptance[] {
    return this.acceptances
      .filter((a) => a.userId === userId)
      .map((a) => ({ ...a }));
  }

  /**
   * 检查文档是否已被所有用户接受（接受率 = 1.0）
   */
  isFullyAccepted(documentId: string): boolean {
    return this.getAcceptanceRate(documentId) >= 1.0;
  }

  // --------------------------------------------------------------------------
  // 持久化
  // --------------------------------------------------------------------------

  private persist(): void {
    if (!this.writeFile) return;
    try {
      const json = JSON.stringify({
        documents: Array.from(this.documents.values()),
        acceptances: this.acceptances,
      }, null, 2);
      void this.writeFile(this.persistPath, json);
    } catch {
      /* ignore */
    }
  }

  async load(): Promise<void> {
    if (!this.readFile) return;
    try {
      const data = await this.readFile(this.persistPath);
      if (!data) return;
      const parsed = JSON.parse(data) as {
        documents: LegalDocument[];
        acceptances: UserAcceptance[];
      };
      this.documents.clear();
      for (const d of parsed.documents) this.documents.set(d.id, d);
      this.acceptances.length = 0;
      this.acceptances.push(...parsed.acceptances);
    } catch {
      /* ignore */
    }
  }

  // --------------------------------------------------------------------------
  // 测试辅助
  // --------------------------------------------------------------------------

  _reset(): void {
    this.documents.clear();
    this.acceptances.length = 0;
  }
}

// ============================================================================
// 默认单例
// ============================================================================

let _default: LegalDocumentService | null = null;
export const getDefaultLegalDocumentService = (): LegalDocumentService => {
  if (!_default) _default = new LegalDocumentService();
  return _default;
};
