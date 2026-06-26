/**
 * 牌照注册表
 *
 * 负责管理交易所持有的多张监管牌照，包括：
 *  - 添加 / 更新 / 查询牌照
 *  - 即将过期提醒
 *  - 牌照自检（有效性、必填字段、关联监管机构）
 *  - 文件持久化（mock JSON 路径）
 *
 * @module lib/compliance/license-registry
 */

import { randomString } from '@/lib/auth/crypto';
import type {
  License,
  LicenseStatus,
  LicenseType,
  ListLicensesOptions,
} from './types';

// ============================================================================
// 常量
// ============================================================================

export const DEFAULT_PERSIST_PATH = '.compliance-licenses.json';
const DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// 预定义牌照模板
// ============================================================================

/**
 * 默认时间：相对当前时间的偏移
 */
const buildDefaultTimes = (issuedDaysAgo: number, validDays: number) => {
  const now = Date.now();
  return {
    issuedAt: now - issuedDaysAgo * DAY_MS,
    expiresAt: now + validDays * DAY_MS,
  };
};

export const LICENSE_TEMPLATES: License[] = [
  // 1. 萨摩亚 DLT 牌照
  {
    id: 'l-samoa-dlt-001',
    type: 'SAMOA_DLT',
    number: 'WS-DLT-2024-0001',
    jurisdiction: 'Samoa',
    regulator: 'Samoa Ministry of Finance',
    status: 'active',
    ...buildDefaultTimes(120, 730),
    scope: ['Crypto Exchange', 'Custody', 'Brokerage', 'Staking'],
    conditions: [
      '客户资产 100% 隔离',
      '月报提交',
      '年度外部审计',
    ],
    contactEmail: 'regulator@mf.gov.ws',
    documentUrl: 'https://docs.smy.exchange/licenses/samoa-dlt.pdf',
    notes: 'SMY 交易所核心牌照',
  },
  // 2. 萨摩亚国际公司注册
  {
    id: 'l-samoa-ic-002',
    type: 'SAMOA_DLT',
    number: 'WS-IC-2023-8821',
    jurisdiction: 'Samoa',
    regulator: 'Samoa Registry of Companies',
    status: 'active',
    ...buildDefaultTimes(360, 1825),
    scope: ['International Company'],
    contactEmail: 'registry@companies.gov.ws',
  },
  // 3. 美国 FinCEN MSB
  {
    id: 'l-us-fincen-003',
    type: 'US_FINCEN',
    number: 'US-MSB-31000234567890',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    status: 'active',
    ...buildDefaultTimes(200, 1095),
    scope: [
      'Money Transmission',
      'Currency Exchange',
      'Crypto Exchange',
    ],
    conditions: [
      '50+ 州牌照合规',
      'BSA / AML 程序',
      '独立审计',
    ],
    contactEmail: 'msbhelp@fincen.gov',
    documentUrl: 'https://docs.smy.exchange/licenses/us-msb.pdf',
  },
  // 4. 加拿大 FINTRAC MSB
  {
    id: 'l-ca-fintrac-004',
    type: 'CANADA_FINTRAC',
    number: 'CA-MSB-2209981',
    jurisdiction: 'Canada',
    regulator: 'FINTRAC',
    status: 'active',
    ...buildDefaultTimes(180, 1095),
    scope: ['Money Services Business', 'Crypto Exchange'],
    contactEmail: 'guidelines@fintrac-canafe.gc.ca',
  },
  // 5. 欧盟 MiCA
  {
    id: 'l-eu-mica-005',
    type: 'MICA',
    number: 'EU-MICA-2025-000142',
    jurisdiction: 'EU',
    regulator: 'ESMA (Lithuania competent authority)',
    status: 'active',
    ...buildDefaultTimes(30, 365),
    scope: [
      'CASP (Crypto-Asset Service Provider)',
      'Custody',
      'Trading Platform',
      'Exchange',
    ],
    conditions: [
      'MiCA Art. 67 合规',
      '白皮书披露',
      '审慎要求 1:1 储备',
    ],
    contactEmail: 'casp@lb.lt',
    documentUrl: 'https://docs.smy.exchange/licenses/mica.pdf',
    notes: '欧盟市场通行证',
  },
  // 6. 爱沙尼亚 MTR
  {
    id: 'l-ee-mtr-006',
    type: 'ESTONIA_MTR',
    number: 'EE-MTR-2022-118',
    jurisdiction: 'Estonia',
    regulator: 'EFSA (Estonian Financial Supervision Authority)',
    status: 'active',
    ...buildDefaultTimes(220, 1825),
    scope: ['Virtual Currency Exchange', 'Wallet Service'],
    contactEmail: 'info@fi.ee',
  },
  // 7. 澳大利亚 AUSTRAC
  {
    id: 'l-au-austrac-007',
    type: 'AUSTRALIA_AUSTRAC',
    number: 'AU-DCE-100456987',
    jurisdiction: 'Australia',
    regulator: 'AUSTRAC',
    status: 'pending',
    ...buildDefaultTimes(-15, 730),
    scope: ['Digital Currency Exchange'],
    contactEmail: 'enquiries@austrac.gov.au',
    notes: '申请中，预计 60 天内下证',
  },
  // 8. 新加坡 MAS MPI
  {
    id: 'l-sg-mas-008',
    type: 'SINGAPORE_MAS',
    number: 'SG-MPI-PS20210001',
    jurisdiction: 'Singapore',
    regulator: 'MAS',
    status: 'pending',
    ...buildDefaultTimes(-30, 1095),
    scope: ['Major Payment Institution'],
    conditions: [
      '仅限非 DPT 服务（数字支付代币牌照另行申请）',
      'DPT 牌照申请中',
    ],
    contactEmail: 'msd_ps@mas.gov.sg',
  },
];

// ============================================================================
// LicenseRegistry
// ============================================================================

export class LicenseRegistry {
  private readonly licenses: Map<string, License> = new Map();
  private readonly persistPath: string;
  private writeFile: ((path: string, data: string) => Promise<void> | void) | undefined;
  private readFile: ((path: string) => Promise<string | null> | string | null) | undefined;

  constructor(opts?: {
    persistPath?: string;
    writeFile?: (path: string, data: string) => Promise<void> | void;
    readFile?: (path: string) => Promise<string | null> | string | null;
    /** 初始牌照 */
    initial?: License[];
  }) {
    this.persistPath = opts?.persistPath ?? DEFAULT_PERSIST_PATH;
    this.writeFile = opts?.writeFile;
    this.readFile = opts?.readFile;
    const initial = opts?.initial ?? LICENSE_TEMPLATES;
    for (const l of initial) {
      this.licenses.set(l.id, { ...l });
    }
  }

  // --------------------------------------------------------------------------
  // CRUD
  // --------------------------------------------------------------------------

  addLicense(license: License): void {
    if (this.licenses.has(license.id)) {
      throw new Error(`License already exists: ${license.id}`);
    }
    this.licenses.set(license.id, { ...license });
    this.persist();
  }

  updateLicenseStatus(
    id: string,
    status: LicenseStatus,
    reason?: string,
  ): License {
    const lic = this.licenses.get(id);
    if (!lic) {
      throw new Error(`License not found: ${id}`);
    }
    lic.status = status;
    if (reason) {
      lic.notes = (lic.notes ? lic.notes + '\n' : '') +
        `[${new Date().toISOString()}] ${status}: ${reason}`;
    }
    this.persist();
    return { ...lic };
  }

  updateLicense(id: string, patch: Partial<License>): License {
    const lic = this.licenses.get(id);
    if (!lic) {
      throw new Error(`License not found: ${id}`);
    }
    Object.assign(lic, patch);
    this.persist();
    return { ...lic };
  }

  removeLicense(id: string): boolean {
    const ok = this.licenses.delete(id);
    if (ok) this.persist();
    return ok;
  }

  getLicense(id: string): License | null {
    const l = this.licenses.get(id);
    return l ? { ...l } : null;
  }

  listLicenses(opts: ListLicensesOptions = {}): License[] {
    const { type, jurisdiction, status } = opts;
    const all = Array.from(this.licenses.values()).map((l) => ({ ...l }));
    return all.filter((l) => {
      if (type && l.type !== type) return false;
      if (jurisdiction && l.jurisdiction !== jurisdiction) return false;
      if (status && l.status !== status) return false;
      return true;
    });
  }

  /**
   * 获取有效（active）牌照，可按司法管辖过滤
   */
  getActiveLicenses(jurisdiction?: string): License[] {
    const now = Date.now();
    return this.listLicenses({ status: 'active' }).filter(
      (l) =>
        (!jurisdiction || l.jurisdiction === jurisdiction) &&
        l.expiresAt > now,
    );
  }

  /**
   * 检测即将在 N 天内过期的牌照
   */
  checkExpiringLicenses(daysAhead: number = 30): License[] {
    const now = Date.now();
    const horizon = now + daysAhead * DAY_MS;
    return this.listLicenses({ status: 'active' }).filter(
      (l) => l.expiresAt > now && l.expiresAt <= horizon,
    );
  }

  /**
   * 已过期但状态仍为 active 的牌照（应被定期校正）
   */
  checkExpiredLicenses(): License[] {
    const now = Date.now();
    return this.listLicenses({ status: 'active' }).filter(
      (l) => l.expiresAt <= now,
    );
  }

  /**
   * 牌照自检：返回合法牌照与问题清单
   */
  validateLicenses(): {
    valid: License[];
    issues: { licenseId: string; problems: string[] }[];
  } {
    const now = Date.now();
    const valid: License[] = [];
    const issues: { licenseId: string; problems: string[] }[] = [];

    for (const lic of this.licenses.values()) {
      const problems: string[] = [];
      if (!lic.id) problems.push('id is required');
      if (!lic.number) problems.push('number is required');
      if (!lic.jurisdiction) problems.push('jurisdiction is required');
      if (!lic.regulator) problems.push('regulator is required');
      if (!lic.scope || lic.scope.length === 0) problems.push('scope is empty');
      if (lic.expiresAt <= now) problems.push('license expired');
      if (lic.issuedAt >= lic.expiresAt) problems.push('issuedAt >= expiresAt');

      if (problems.length === 0) {
        valid.push({ ...lic });
      } else {
        issues.push({ licenseId: lic.id, problems });
      }
    }

    return { valid, issues };
  }

  /**
   * 列出支持的牌照类型
   */
  listTypes(): LicenseType[] {
    const set = new Set<LicenseType>();
    for (const l of this.licenses.values()) set.add(l.type);
    return Array.from(set);
  }

  /**
   * 统计
   */
  stats(): {
    total: number;
    active: number;
    pending: number;
    expired: number;
    suspended: number;
    revoked: number;
    byJurisdiction: Record<string, number>;
    byType: Record<string, number>;
  } {
    const byJurisdiction: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const counts = { active: 0, pending: 0, expired: 0, suspended: 0, revoked: 0 };

    for (const l of this.licenses.values()) {
      counts[l.status]++;
      byJurisdiction[l.jurisdiction] = (byJurisdiction[l.jurisdiction] ?? 0) + 1;
      byType[l.type] = (byType[l.type] ?? 0) + 1;
    }

    return {
      total: this.licenses.size,
      ...counts,
      byJurisdiction,
      byType,
    };
  }

  /**
   * 清理全部牌照（仅测试用）
   */
  _reset(): void {
    this.licenses.clear();
    this.persist();
  }

  // --------------------------------------------------------------------------
  // 持久化
  // --------------------------------------------------------------------------

  private persist(): void {
    if (!this.writeFile) return;
    try {
      const json = JSON.stringify(Array.from(this.licenses.values()), null, 2);
      void this.writeFile(this.persistPath, json);
    } catch (err) {
      // 持久化失败不影响内存状态
      // eslint-disable-next-line no-console
      console.warn('LicenseRegistry.persist failed:', err);
    }
  }

  /**
   * 异步加载（用于进程启动恢复）
   */
  async load(): Promise<void> {
    if (!this.readFile) return;
    try {
      const data = await this.readFile(this.persistPath);
      if (!data) return;
      const parsed = JSON.parse(data) as License[];
      this.licenses.clear();
      for (const l of parsed) this.licenses.set(l.id, l);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('LicenseRegistry.load failed:', err);
    }
  }

  /**
   * 导出为 JSON 字符串（供测试 / 调试）
   */
  toJSON(): string {
    return JSON.stringify(Array.from(this.licenses.values()), null, 2);
  }
}

// ============================================================================
// 默认单例（惰性）
// ============================================================================

let _default: LicenseRegistry | null = null;
export const getDefaultLicenseRegistry = (): LicenseRegistry => {
  if (!_default) _default = new LicenseRegistry();
  return _default;
};

/**
 * 工具：生成新牌照 ID
 */
export const newLicenseId = (type: LicenseType): string =>
  `l-${type.toLowerCase()}-${randomString(6)}`;
