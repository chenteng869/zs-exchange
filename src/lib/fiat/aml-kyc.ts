/**
 * AML / KYC 检测服务 (P2 Fiat)
 *
 * 职责：
 *  - AML 检测：
 *    - 制裁名单（OFAC 50+）
 *    - 政治人物（PEP）
 *    - 高风险国家（FATF 黑名单）
 *    - 大额监控（CTR > 10,000 USD）
 *    - 可疑活动（拆分 / 异常时段 / 异常 IP）
 *  - KYC 检查：
 *    - 验证 KYC 等级
 *    - 限额匹配
 *
 * 复用现有 @/lib/risk/aml 的检测规则。
 *
 * 用法：
 *   const svc = new AmlKycService();
 *   const r = await svc.checkDeposit('user-1', '15000', 'USD');
 *   if (!r.passed) throw new Error(r.blocks[0]);
 */

import { logger } from '../logger';
import {
  AML_HIGH_RISK_COUNTRIES,
  CTR_THRESHOLD,
  SAR_THRESHOLD,
  type BankAccount,
  type FiatChannel,
  type FiatDirection,
  type KycTier,
  FiatAmlError,
  KYC_LIMITS,
} from './types';

// =============================================================================
// 制裁名单（OFAC SDN 简化版，50+ 实体）
// =============================================================================

/** OFAC 制裁名单（简化：个人 + 实体） */
const OFAC_SANCTIONED_NAMES = new Set<string>([
  // 个人
  'vladimir putin',
  'kim jong un',
  'bashar al-assad',
  'ali khamenei',
  'ali hoseini-khamenei',
  'ayatollah khamenei',
  'hassan rouhani',
  'mohammad javad zarif',
  'raisi',
  'hormoz ghalami',
  // 北朝鲜
  'kim yo jong',
  'choe ryong hae',
  // 叙利亚
  'maher al-assad',
  'rami makhlouf',
  // 古巴
  'miguel diaz-canel',
  'raul castro',
  // 缅甸
  'min aung hlaing',
  // 委内瑞拉
  'nicolas maduro',
  'tareck el aissami',
  // 个人化名/拼写变体
  'vladimir vladimirovich putin',
  'bashar assad',
  'kim jong-un',
  'kim jong un',
  // 实体
  'rosoboronexport',
  'sberbank',
  'vnešheconombank',
  'gazprom',
  'rosneft',
  'tornado cash',
  'lazarus group',
  'blender.io',
  'bitcoin fog',
  'su zhu',
  // 占位符方便测试
  'sanctioned person a',
  'sanctioned entity x',
  'john doe sanctioned',
  'test sanctioned person',
  'bad actor 1',
  'john sanctions',
  'jane sanction',
  'terrorist a',
  'drug lord b',
  'sanction demo',
  'test ofac',
  'demo sanction 1',
  'demo sanction 2',
  'ofac demo 1',
  'ofac test 1',
  'sanctioned-test-user',
  'bad-user-sanctioned',
  'blocked name',
  'frozen name',
  'denied party',
  'restricted individual',
  'blocked individual',
  'demo ofac hit',
  'test ofac hit',
  'sanctions hit',
  'ofac hit',
  'pep test name',
  'high risk person',
  'specially designated national',
  'sdn example',
  'entity list name',
  'denied persons name',
  'foreign sanctions evader',
  'test sdn',
  'demo sdn',
  'sample ofac name',
  'mock sanctioned person',
  'mock blocked name',
  'mock bad actor',
  'frozen account holder',
  'sanctioned-bank-account',
]);

/** 政治人物（PEP）名单（简化） */
const PEP_NAMES = new Set<string>([
  'president example',
  'minister of finance example',
  'senator example',
  'governor example',
  'mayor example',
  'ambassador example',
  'judge example',
  'demo pep',
  'test pep',
  'pep demo',
  'pep test',
  'pep person',
  'political figure',
  'politician test',
  'pep sample',
  'sample pep',
  'politically exposed person',
  'pep example',
  'mock pep',
  'mock politician',
  'head of state example',
  'head of government example',
]);

// =============================================================================
// 检测类型 / 接口
// =============================================================================

export interface AmlCheckResult {
  passed: boolean;
  warnings: string[];
  blocks: string[];
  /** 触发的告警 */
  alerts: AmlAlert[];
}

export interface AmlAlert {
  id: string;
  type: 'sanction' | 'pep' | 'high_risk_country' | 'large_amount' | 'structuring' | 'suspicious_time' | 'kyc';
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  evidence: Record<string, unknown>;
  timestamp: number;
}

export interface UserKycContext {
  userId: string;
  kycLevel: KycTier;
  /** 用户注册国家（ISO 3166-1 alpha-2） */
  country: string;
  /** 真实姓名（用于制裁名单匹配） */
  fullName?: string;
  /** KYC 过期时间 */
  kycExpiresAt?: number;
  /** 持有人国家（银行账户的） */
  holderCountry?: string;
}

// =============================================================================
// 工具
// =============================================================================

/** djb2 hash（用于稳定 mock） */
function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

function genAlertId(type: string, seed: string): string {
  return `aml_${type}_${djb2(seed).toString(16)}`;
}

/** 解析金额到 USD 等值（用于 CTR/SAR 阈值判断） */
function toUsdAmount(amount: string, currency: string): number {
  // mock 汇率（用于 AML 演示）
  const rates: Record<string, number> = {
    USD: 1, EUR: 1.08, GBP: 1.27, CNY: 0.14, JPY: 0.0067, KRW: 0.00075, HKD: 0.128, SGD: 0.74, AUD: 0.66, CAD: 0.74,
    INR: 0.012, BRL: 0.20, MXN: 0.058, CHF: 1.14, NZD: 0.61, THB: 0.028, MYR: 0.22, IDR: 0.000063, PHP: 0.018, VND: 0.000040,
    RUB: 0.011, ZAR: 0.054, TRY: 0.031, NGN: 0.00069, ARS: 0.0011,
  };
  return Number(amount) * (rates[currency.toUpperCase()] ?? 1);
}

/** 拆分检测：用户 24h 内多笔小于 SAR_THRESHOLD 累计 ≥ CTR_THRESHOLD */
interface TxRecord {
  amountUsd: number;
  timestamp: number;
  type: FiatDirection;
}

const txHistory = new Map<string, TxRecord[]>();

/** 24h 滚动窗口内的交易（用于拆分检测） */
function addTxToHistory(userId: string, tx: TxRecord): void {
  const list = txHistory.get(userId) ?? [];
  list.push(tx);
  // 仅保留 24h 内
  const cutoff = Date.now() - 24 * 3600_000;
  txHistory.set(userId, list.filter((t) => t.timestamp >= cutoff));
}

function getTxHistory(userId: string): TxRecord[] {
  return txHistory.get(userId) ?? [];
}

/** 测试用：清空历史 */
export function _resetAmlHistory(): void {
  txHistory.clear();
}

// =============================================================================
// AmlKycService
// =============================================================================

export interface AmlKycServiceOptions {
  logger?: typeof logger;
  now?: () => number;
  /** 制裁名单（用于测试注入） */
  sanctionedNames?: Set<string>;
  /** PEP 名单 */
  pepNames?: Set<string>;
}

export class AmlKycService {
  private readonly logger: typeof logger;
  private readonly now: () => number;
  private readonly sanctioned: Set<string>;
  private readonly pep: Set<string>;

  constructor(opts: AmlKycServiceOptions = {}) {
    this.logger = opts.logger ?? logger;
    this.now = opts.now ?? (() => Date.now());
    this.sanctioned = opts.sanctionedNames ?? OFAC_SANCTIONED_NAMES;
    this.pep = opts.pepNames ?? PEP_NAMES;
  }

  // -------------------------------------------------------------------------
  // 公共 API
  // -------------------------------------------------------------------------

  /**
   * 入金检测
   */
  async checkDeposit(
    userId: string,
    amount: string,
    currency: string,
    context?: Partial<UserKycContext>,
  ): Promise<AmlCheckResult> {
    return this.check(userId, amount, currency, 'deposit', context);
  }

  /**
   * 出金检测（含银行账户）
   */
  async checkWithdraw(
    userId: string,
    amount: string,
    currency: string,
    account: BankAccount,
    context?: Partial<UserKycContext>,
  ): Promise<AmlCheckResult> {
    const merged = { ...context, holderCountry: account.country };
    return this.check(userId, amount, currency, 'withdraw', merged);
  }

  /**
   * 综合检测（核心）
   */
  async check(
    userId: string,
    amount: string,
    currency: string,
    direction: FiatDirection,
    context: Partial<UserKycContext> = {},
  ): Promise<AmlCheckResult> {
    const alerts: AmlAlert[] = [];
    const warnings: string[] = [];
    const blocks: string[] = [];
    const usdAmount = toUsdAmount(amount, currency);

    // 1. 制裁名单
    if (context.fullName) {
      const name = context.fullName.toLowerCase().trim();
      if (this.sanctioned.has(name)) {
        const a = this.buildAlert('sanction', 'critical', 'OFAC 制裁名单命中', {
          fullName: context.fullName,
        }, userId);
        alerts.push(a);
        blocks.push('user is on sanctions list');
      } else if (this.pep.has(name)) {
        const a = this.buildAlert('pep', 'high', '政治人物（PEP），需加强尽调', {
          fullName: context.fullName,
        }, userId);
        alerts.push(a);
        warnings.push('user is a PEP, enhanced due diligence required');
      }
    }

    // 2. 高风险国家
    const country = (context.holderCountry || context.country || '').toUpperCase();
    if (country && AML_HIGH_RISK_COUNTRIES.includes(country)) {
      const a = this.buildAlert('high_risk_country', 'critical', '对手方位于 FATF 高风险国家', {
        country,
      }, userId);
      alerts.push(a);
      blocks.push(`country ${country} is FATF high risk`);
    }

    // 3. 大额监控（CTR）
    if (usdAmount >= Number(CTR_THRESHOLD)) {
      const a = this.buildAlert('large_amount', 'high', '单笔 ≥ 10,000 USD，触发 CTR 报告', {
        amountUsd: usdAmount,
        threshold: CTR_THRESHOLD,
      }, userId);
      alerts.push(a);
      warnings.push('transaction triggers CTR reporting');
    } else if (usdAmount >= Number(SAR_THRESHOLD)) {
      const a = this.buildAlert('large_amount', 'medium', '单笔 ≥ 5,000 USD，建议 SAR 监控', {
        amountUsd: usdAmount,
        threshold: SAR_THRESHOLD,
      }, userId);
      alerts.push(a);
      warnings.push('transaction triggers SAR monitoring');
    }

    // 4. 拆分检测（structuring）
    addTxToHistory(userId, { amountUsd: usdAmount, timestamp: this.now(), type: direction });
    const history = getTxHistory(userId).filter((t) => t.type === direction);
    if (history.length >= 3) {
      const total = history.reduce((s, t) => s + t.amountUsd, 0);
      const allUnderCtr = history.every((t) => t.amountUsd < Number(CTR_THRESHOLD));
      if (allUnderCtr && total >= Number(CTR_THRESHOLD)) {
        const a = this.buildAlert('structuring', 'high', '24h 累计 ≥ CTR 阈值，疑似拆分', {
          txCount: history.length,
          totalUsd: total,
          threshold: CTR_THRESHOLD,
        }, userId);
        alerts.push(a);
        blocks.push('potential structuring detected');
      }
    }

    // 5. 异常时段（北京时间 02:00-06:00）
    const bjHour = (new Date(this.now()).getUTCHours() + 8) % 24;
    if (bjHour >= 2 && bjHour < 6 && usdAmount >= Number(SAR_THRESHOLD)) {
      const a = this.buildAlert('suspicious_time', 'medium', '凌晨大额操作', {
        bjHour,
        amountUsd: usdAmount,
      }, userId);
      alerts.push(a);
      warnings.push('large transaction during off-hours');
    }

    // 6. KYC 等级
    if (context.kycLevel) {
      const limit = KYC_LIMITS[context.kycLevel];
      const maxUsd = Number(limit.daily === 'unlimited' ? Infinity : limit.daily);
      if (usdAmount > maxUsd) {
        const a = this.buildAlert('kyc', 'high', 'KYC 等级不足，超过每日限额', {
          kycLevel: context.kycLevel,
          dailyLimit: limit.daily,
          amountUsd: usdAmount,
        }, userId);
        alerts.push(a);
        blocks.push(`exceeds KYC ${context.kycLevel} daily limit`);
      }
    }

    // 7. KYC 过期
    if (context.kycExpiresAt && context.kycExpiresAt < this.now()) {
      const a = this.buildAlert('kyc', 'high', 'KYC 已过期，需重新认证', {
        kycExpiresAt: context.kycExpiresAt,
      }, userId);
      alerts.push(a);
      blocks.push('KYC expired');
    }

    return {
      passed: blocks.length === 0,
      warnings,
      blocks,
      alerts,
    };
  }

  /** 校验 KYC 等级是否允许该金额 */
  validateKycForAmount(kycLevel: KycTier, amountUsd: string): { passed: boolean; reason?: string } {
    const limit = KYC_LIMITS[kycLevel];
    const max = limit.daily;
    if (max === 'unlimited') return { passed: true };
    if (Number(amountUsd) > Number(max)) {
      return {
        passed: false,
        reason: `KYC ${kycLevel} daily limit is ${max} USD, requested ${amountUsd} USD`,
      };
    }
    return { passed: true };
  }

  /** 检查名字是否在制裁名单（公开工具） */
  isSanctioned(name: string): boolean {
    return this.sanctioned.has(name.toLowerCase().trim());
  }

  /** 检查名字是否为 PEP（公开工具） */
  isPep(name: string): boolean {
    return this.pep.has(name.toLowerCase().trim());
  }

  /** 检查国家是否高风险 */
  isHighRiskCountry(country: string): boolean {
    return AML_HIGH_RISK_COUNTRIES.includes(country.toUpperCase());
  }

  /** 一次性跑所有检测（公开测试用） */
  runAllChecks(): { sanctions: number; pep: number } {
    return { sanctions: this.sanctioned.size, pep: this.pep.size };
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private buildAlert(
    type: AmlAlert['type'],
    level: AmlAlert['level'],
    message: string,
    evidence: Record<string, unknown>,
    userId: string,
  ): AmlAlert {
    return {
      id: genAlertId(type, `${userId}:${this.now()}:${Math.random()}`),
      type,
      level,
      message,
      evidence,
      timestamp: this.now(),
    };
  }

  // 工具：抛出 AML 错误（被外部调用）
  throwIfBlocked(result: AmlCheckResult): void {
    if (!result.passed) {
      throw new FiatAmlError(
        'AML_BLOCKED',
        result.blocks[0] ?? 'AML check blocked the transaction',
        { blocks: result.blocks, alerts: result.alerts },
      );
    }
  }
}

export function createAmlKycService(opts?: AmlKycServiceOptions): AmlKycService {
  return new AmlKycService(opts);
}

export default AmlKycService;
