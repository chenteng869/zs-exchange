/**
 * Sports Compliance Service - 体育竞猜合规校验服务
 *
 * 工业级 Solana-first 架构
 * 文档：docs/工业级最终方案：Solana-first 统一生态架构.md §5.5.8
 * 业务规则：docs/369福建老酒源代码-开发/H015-23 个 Service 的工业级职责.md §2.4
 *
 * 职责（9 步骤合规校验）：
 *  - Step 1:  Region Check（地区许可）
 *  - Step 2:  Age Check（最低年龄）
 *  - Step 3:  KYC Check（KYC 等级）
 *  - Step 4:  Sanctions/PEP Check（制裁名单 / 政治人物）
 *  - Step 5:  Risk Decision（风险评分）
 *  - Step 6:  Limit Check（日上限 / 单笔上限）
 *  - Step 7:  Sports Compliance Check Record（综合判定）
 *  - Step 8:  Create Entry（创建参与记录）
 *  - Step 9:  Audit Log（审计日志）
 *
 * 工业级硬规则：
 *  - 体育竞猜默认不能全球开放
 *  - 无牌照地区只能做积分竞猜 / 模拟竞猜 / NFT 纪念奖励
 *  - 必须走 Region + KYC + Risk + Limit + Audit + Oracle
 *
 * 数据落地：sports_compliance_checks（独立表，结构清晰）
 * 链上集成：链下账本为业务真相源（无链上合约）
 */

import { Prisma } from '@prisma/client';
import { FjnServiceBase, FjnServiceOptions } from './base';
import {
  SPORTS_COMPLIANCE_CHECK_TYPE,
  SPORTS_COMPLIANCE_RESULT,
  SPORTS_COMPLIANCE_RISK_DECISION,
  SPORTS_COMPLIANCE_PEP_STATUS,
  SPORTS_COMPLIANCE_SANCTIONS_LIST,
  SPORTS_COMPLIANCE_LICENSE_STATUS,
  SPORTS_COMPLIANCE_REGION_LICENSE,
  SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_BLOCK,
  SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_REVIEW,
  SPORTS_COMPLIANCE_DEFAULT_DAILY_LIMIT,
  SPORTS_COMPLIANCE_DEFAULT_PER_TX_LIMIT,
  SPORTS_COMPLIANCE_MIN_AGE,
  SPORTS_COMPLIANCE_LICENSED_KYC_LEVEL,
  SPORTS_COMPLIANCE_DEFAULT_CHAIN_ID,
  SPORTS_COMPLIANCE_FULL_CHECK_STEPS,
  isValidSportsComplianceCheckType,
  isValidSportsComplianceResult,
  isValidSportsComplianceRiskDecision,
  isValidSportsCompliancePepStatus,
  isValidSportsComplianceSanctionsList,
  isValidSportsComplianceLicenseStatus,
  type FjnSportsComplianceCheckType,
  type FjnSportsComplianceResult,
  type FjnSportsComplianceRiskDecision,
  type FjnSportsCompliancePepStatus,
  type FjnSportsComplianceSanctionsList,
  type FjnSportsComplianceLicenseStatus,
} from './sports-compliance-state-machine';
import {
  SPORTS_COMPLIANCE_EVENTS,
  SPORTS_COMPLIANCE_EVENT_SOURCES,
  type FjnSportsComplianceEventSource,
} from './sports-compliance-events';
import {
  SportsComplianceCheckNotFoundError,
  SportsComplianceCheckTypeInvalidError,
  SportsComplianceResultInvalidError,
  SportsComplianceUserIdRequiredError,
  SportsComplianceEventIdRequiredError,
  SportsComplianceRegionBlockedError,
  SportsComplianceRegionCodeInvalidError,
  SportsComplianceAgeRejectedError,
  SportsComplianceAgeInvalidError,
  SportsComplianceKycInsufficientError,
  SportsComplianceKycLevelInvalidError,
  SportsComplianceSanctionsHitError,
  SportsCompliancePepHitError,
  SportsComplianceRiskBlockedError,
  SportsComplianceRiskScoreInvalidError,
  SportsComplianceLimitExceededError,
  SportsComplianceLimitInvalidError,
  SportsComplianceReviewerRequiredError,
  SportsComplianceReviewInvalidStateError,
  SportsComplianceDecisionInvalidError,
  SportsComplianceEventNotFoundError,
} from './sports-compliance-errors';

// ============================================================
// 1. 入参接口
// ============================================================

/** 地区校验 */
export interface CheckRegionInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  regionCode: string;
  age?: number;
  operatorId?: string;
}

/** 年龄校验 */
export interface CheckAgeInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  age: number;
  regionCode?: string;
  operatorId?: string;
}

/** KYC 校验 */
export interface CheckKycInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  kycLevel: string;
  regionCode?: string;
  operatorId?: string;
}

/** 制裁名单 / PEP 校验 */
export interface CheckSanctionsPepInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  regionCode?: string;
  /** 制裁名单命中列表（空 = 未命中） */
  sanctionsList?: FjnSportsComplianceSanctionsList[];
  /** PEP 状态 */
  pepStatus?: FjnSportsCompliancePepStatus;
  operatorId?: string;
}

/** 风险评分 */
export interface CheckRiskInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  riskScore: number;
  regionCode?: string;
  /** 触发 review 阈值（默认 50） */
  reviewThreshold?: number;
  /** 触发 block 阈值（默认 80） */
  blockThreshold?: number;
  operatorId?: string;
}

/** 限额校验 */
export interface CheckLimitInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  /** 当日累计金额 */
  dailyLimitUsed: string;
  /** 单笔金额 */
  perTxAmount: string;
  /** 日上限（默认 1000.0000） */
  dailyLimitMax?: string;
  /** 单笔上限（默认 300.0000） */
  perTxLimitMax?: string;
  regionCode?: string;
  operatorId?: string;
}

/** 综合合规检查 */
export interface CheckSportsComplianceInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  regionCode: string;
  age?: number;
  kycLevel?: string;
  sanctionsList?: FjnSportsComplianceSanctionsList[];
  pepStatus?: FjnSportsCompliancePepStatus;
  riskScore?: number;
  dailyLimitUsed?: string;
  perTxAmount?: string;
  operatorId?: string;
}

/** Review 行动（review → pass/fail） */
export interface ReviewCheckInput {
  checkId: string;
  reviewerId: string;
  newResult: FjnSportsComplianceResult;
  comment?: string;
  operatorId?: string;
}

/** 写入审计日志（Step 9） */
export interface WriteAuditLogInput {
  userId: string;
  eventId: string;
  marketId?: string;
  entryId?: string;
  regionCode?: string;
  age?: number;
  kycLevel?: string;
  /** 9 步骤最终汇总 */
  finalResult: FjnSportsComplianceResult;
  /** 每步结果 JSON */
  stepResults?: Prisma.InputJsonValue;
  operatorId?: string;
  /** Solana 链上审计锚定（可选） */
  txHash?: string;
  metadata?: Prisma.InputJsonValue;
}

/** 分页查询 */
export interface ListSportsComplianceChecksInput {
  page?: number;
  pageSize?: number;
  userId?: string;
  eventId?: string;
  checkType?: FjnSportsComplianceCheckType;
  result?: FjnSportsComplianceResult;
}

// ============================================================
// 2. 返回类型
// ============================================================

export interface SportsComplianceCheckSummary {
  id: string;
  userId: string;
  eventId: string;
  marketId: string | null;
  entryId: string | null;
  checkType: FjnSportsComplianceCheckType;
  result: FjnSportsComplianceResult;
  regionCode: string | null;
  age: number | null;
  kycLevel: string | null;
  sanctionsList: string | null;
  pepStatus: string | null;
  riskScore: number | null;
  riskDecision: string | null;
  dailyLimitUsed: string | null;
  dailyLimitMax: string | null;
  perTxLimit: string | null;
  complianceNote: string | null;
  reviewerId: string | null;
  reviewedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}

export interface RunFullComplianceResult {
  /** 综合判定 */
  finalResult: FjnSportsComplianceResult;
  /** 地区许可状态 */
  regionLicenseStatus: FjnSportsComplianceLicenseStatus;
  /** 每步结果（key = step, value = result） */
  steps: Record<FjnSportsComplianceCheckType, FjnSportsComplianceResult>;
  /** 写库的 check id 列表 */
  checkIds: string[];
  /** 触发的风险事件 */
  triggeredEvents: string[];
}

// ============================================================
// 3. Service 实现
// ============================================================

export class FjnSportsComplianceService extends FjnServiceBase {
  constructor(options: FjnServiceOptions = {}) {
    super({ ...options, serviceName: options.serviceName ?? 'FjnSportsComplianceService' });
  }

  // ==========================================================
  // 3.0 工具方法
  // ==========================================================

  private generateCheckNo(): string {
    return `SC-CHK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  /** 校验 ISO-3166-1 alpha-2 国家码 */
  private isValidRegionCode(code: string): boolean {
    return /^[A-Z]{2}$/.test(code);
  }

  /** 校验 KYC 等级（NONE/BASIC/ADVANCED/PROFESSIONAL） */
  private getKycLevelRank(level: string): number {
    const order = ['NONE', 'BASIC', 'ADVANCED', 'PROFESSIONAL'];
    const idx = order.indexOf(level);
    return idx === -1 ? -1 : idx;
  }

  /** 发出 outbox 事件 */
  private async emitEvent(
    tx: any,
    eventType: string,
    payload: Record<string, unknown>,
    source: FjnSportsComplianceEventSource = SPORTS_COMPLIANCE_EVENT_SOURCES.SPORTS_COMPLIANCE_SERVICE,
  ): Promise<void> {
    await (tx as any).outboxEvent.create({
      data: {
        eventType,
        payload: { ...payload, occurred_at: new Date().toISOString(), source },
        status: 'pending',
        retryCount: 0,
      },
    });
  }

  /** 查询地区许可状态 */
  getRegionLicenseStatus(regionCode: string): FjnSportsComplianceLicenseStatus {
    return (
      SPORTS_COMPLIANCE_REGION_LICENSE[regionCode] ??
      SPORTS_COMPLIANCE_LICENSE_STATUS.GREY
    );
  }

  // ==========================================================
  // 3.1 通用：写入 check 记录
  // ==========================================================

  private async writeCheck(
    tx: any,
    data: {
      userId: string;
      eventId: string;
      marketId?: string | null;
      entryId?: string | null;
      checkType: FjnSportsComplianceCheckType;
      result: FjnSportsComplianceResult;
      regionCode?: string | null;
      age?: number | null;
      kycLevel?: string | null;
      sanctionsList?: string | null;
      pepStatus?: string | null;
      riskScore?: number | null;
      riskDecision?: string | null;
      dailyLimitUsed?: string | null;
      dailyLimitMax?: string | null;
      perTxLimit?: string | null;
      complianceNote?: string | null;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    const created = await (tx as any).sportsComplianceCheck.create({
      data: {
        userId: data.userId,
        eventId: data.eventId,
        marketId: data.marketId ?? null,
        entryId: data.entryId ?? null,
        checkType: data.checkType,
        result: data.result,
        regionCode: data.regionCode ?? null,
        age: data.age ?? null,
        kycLevel: data.kycLevel ?? null,
        sanctionsList: data.sanctionsList ?? null,
        pepStatus: data.pepStatus ?? null,
        riskScore: data.riskScore ?? null,
        riskDecision: data.riskDecision ?? null,
        dailyLimitUsed: data.dailyLimitUsed ?? null,
        dailyLimitMax: data.dailyLimitMax ?? null,
        perTxLimit: data.perTxLimit ?? null,
        complianceNote: data.complianceNote ?? null,
        metadata: data.metadata ?? Prisma.JsonNull,
      },
    });

    await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_CREATED, {
      checkId: created.id,
      userId: data.userId,
      eventId: data.eventId,
      marketId: data.marketId ?? null,
      entryId: data.entryId ?? null,
      checkType: data.checkType,
      result: data.result,
      regionCode: data.regionCode ?? null,
    });

    if (data.result === SPORTS_COMPLIANCE_RESULT.PASS) {
      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_PASSED, {
        checkId: created.id,
        userId: data.userId,
        eventId: data.eventId,
        checkType: data.checkType,
      });
    } else if (data.result === SPORTS_COMPLIANCE_RESULT.FAIL) {
      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_FAILED, {
        checkId: created.id,
        userId: data.userId,
        eventId: data.eventId,
        checkType: data.checkType,
      });
    } else {
      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_REVIEW, {
        checkId: created.id,
        userId: data.userId,
        eventId: data.eventId,
        checkType: data.checkType,
      });
    }

    return created;
  }

  // ==========================================================
  // 3.2 Step 1: Region Check
  // ==========================================================

  /**
   * Step 1: 地区许可校验
   *  - PROHIBITED → FAIL
   *  - RESTRICTED → REVIEW
   *  - LICENSED  → PASS
   *  - GREY（默认无牌照）→ REVIEW（仅允许积分竞猜/模拟/NFT 纪念）
   */
  async checkRegion(input: CheckRegionInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();
    if (!input.regionCode || !this.isValidRegionCode(input.regionCode)) {
      throw new SportsComplianceRegionCodeInvalidError({ regionCode: input.regionCode });
    }

    const licenseStatus = this.getRegionLicenseStatus(input.regionCode);
    let result: FjnSportsComplianceResult;
    let note: string;

    switch (licenseStatus) {
      case SPORTS_COMPLIANCE_LICENSE_STATUS.PROHIBITED:
        result = SPORTS_COMPLIANCE_RESULT.FAIL;
        note = `Region ${input.regionCode} prohibits sports betting`;
        break;
      case SPORTS_COMPLIANCE_LICENSE_STATUS.RESTRICTED:
        result = SPORTS_COMPLIANCE_RESULT.REVIEW;
        note = `Region ${input.regionCode} has restricted sports betting license`;
        break;
      case SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED:
        result = SPORTS_COMPLIANCE_RESULT.PASS;
        note = `Region ${input.regionCode} is licensed for sports betting`;
        break;
      case SPORTS_COMPLIANCE_LICENSE_STATUS.GREY:
      default:
        result = SPORTS_COMPLIANCE_RESULT.REVIEW;
        note = `Region ${input.regionCode} has no explicit license (grey area); only points betting / mock / NFT is allowed`;
        break;
    }

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.REGION,
        result,
        regionCode: input.regionCode,
        age: input.age,
        complianceNote: note,
        metadata: { licenseStatus } as Prisma.InputJsonValue,
      });

      if (result === SPORTS_COMPLIANCE_RESULT.FAIL) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.REGION_BLOCKED, {
          checkId: created.id,
          userId: input.userId,
          regionCode: input.regionCode,
          licenseStatus,
        });
      }

      this.log('info', `Sports compliance region check: ${result}`, {
        userId: input.userId,
        regionCode: input.regionCode,
        licenseStatus,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.3 Step 2: Age Check
  // ==========================================================

  /**
   * Step 2: 年龄校验
   *  - age < SPORTS_COMPLIANCE_MIN_AGE → FAIL
   *  - age 未提供 → REVIEW
   *  - 通过 → PASS
   */
  async checkAge(input: CheckAgeInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();
    if (input.age === undefined || input.age === null) {
      throw new SportsComplianceAgeInvalidError({ age: input.age });
    }
    if (input.age < 0 || !Number.isInteger(input.age)) {
      throw new SportsComplianceAgeInvalidError({ age: input.age });
    }

    const result: FjnSportsComplianceResult =
      input.age >= SPORTS_COMPLIANCE_MIN_AGE
        ? SPORTS_COMPLIANCE_RESULT.PASS
        : SPORTS_COMPLIANCE_RESULT.FAIL;
    const note =
      result === SPORTS_COMPLIANCE_RESULT.PASS
        ? `Age ${input.age} meets minimum (${SPORTS_COMPLIANCE_MIN_AGE})`
        : `Age ${input.age} below minimum (${SPORTS_COMPLIANCE_MIN_AGE})`;

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.AGE,
        result,
        age: input.age,
        regionCode: input.regionCode,
        complianceNote: note,
      });

      if (result === SPORTS_COMPLIANCE_RESULT.FAIL) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.AGE_REJECTED, {
          checkId: created.id,
          userId: input.userId,
          age: input.age,
        });
      }

      this.log('info', `Sports compliance age check: ${result}`, {
        userId: input.userId,
        age: input.age,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.4 Step 3: KYC Check
  // ==========================================================

  /**
   * Step 3: KYC 校验
   *  - 有牌照地区要求 >= BASIC
   *  - 无牌照地区：NONE 也通过（但仅允许积分竞猜）
   */
  async checkKyc(input: CheckKycInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();
    if (!input.kycLevel) throw new SportsComplianceKycLevelInvalidError({ kycLevel: input.kycLevel });

    const licenseStatus = input.regionCode
      ? this.getRegionLicenseStatus(input.regionCode)
      : SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED;
    const requiredRank = licenseStatus === SPORTS_COMPLIANCE_LICENSE_STATUS.LICENSED
      ? this.getKycLevelRank(SPORTS_COMPLIANCE_LICENSED_KYC_LEVEL)
      : 0; // NONE 也允许
    const userRank = this.getKycLevelRank(input.kycLevel);
    if (userRank === -1) throw new SportsComplianceKycLevelInvalidError({ kycLevel: input.kycLevel });

    const result: FjnSportsComplianceResult =
      userRank >= requiredRank ? SPORTS_COMPLIANCE_RESULT.PASS : SPORTS_COMPLIANCE_RESULT.FAIL;
    const note =
      result === SPORTS_COMPLIANCE_RESULT.PASS
        ? `KYC ${input.kycLevel} meets requirement for ${licenseStatus} region`
        : `KYC ${input.kycLevel} insufficient for ${licenseStatus} region (requires ${SPORTS_COMPLIANCE_LICENSED_KYC_LEVEL}+)`;

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.KYC,
        result,
        kycLevel: input.kycLevel,
        regionCode: input.regionCode,
        complianceNote: note,
        metadata: { licenseStatus, requiredRank, userRank } as Prisma.InputJsonValue,
      });

      if (result === SPORTS_COMPLIANCE_RESULT.FAIL) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.KYC_INSUFFICIENT, {
          checkId: created.id,
          userId: input.userId,
          kycLevel: input.kycLevel,
        });
      }

      this.log('info', `Sports compliance kyc check: ${result}`, {
        userId: input.userId,
        kycLevel: input.kycLevel,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.5 Step 4: Sanctions / PEP Check
  // ==========================================================

  /**
   * Step 4: 制裁名单 + PEP 校验
   *  - 命中任意制裁名单 → FAIL
   *  - PEP status = HIGH → FAIL
   *  - PEP status = MEDIUM → REVIEW
   *  - 否则 PASS
   */
  async checkSanctionsPep(input: CheckSanctionsPepInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();

    const sanctions = input.sanctionsList ?? [];
    const pep = input.pepStatus ?? SPORTS_COMPLIANCE_PEP_STATUS.NONE;

    let result: FjnSportsComplianceResult = SPORTS_COMPLIANCE_RESULT.PASS;
    let note = 'No sanctions or PEP hit';

    if (sanctions.length > 0) {
      result = SPORTS_COMPLIANCE_RESULT.FAIL;
      note = `Sanctions list hit: ${sanctions.join(',')}`;
    } else if (pep === SPORTS_COMPLIANCE_PEP_STATUS.HIGH) {
      result = SPORTS_COMPLIANCE_RESULT.FAIL;
      note = 'PEP status HIGH';
    } else if (pep === SPORTS_COMPLIANCE_PEP_STATUS.MEDIUM) {
      result = SPORTS_COMPLIANCE_RESULT.REVIEW;
      note = 'PEP status MEDIUM, requires manual review';
    }

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.SANCTIONS,
        result,
        sanctionsList: sanctions.length > 0 ? sanctions.join(',') : null,
        pepStatus: pep,
        regionCode: input.regionCode,
        complianceNote: note,
      });

      if (sanctions.length > 0) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.SANCTIONS_HIT, {
          checkId: created.id,
          userId: input.userId,
          sanctionsList: sanctions.join(','),
          regionCode: input.regionCode,
        });
      }
      if (pep === SPORTS_COMPLIANCE_PEP_STATUS.HIGH || pep === SPORTS_COMPLIANCE_PEP_STATUS.MEDIUM) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.PEP_HIT, {
          checkId: created.id,
          userId: input.userId,
          pepStatus: pep,
        });
      }

      this.log('info', `Sports compliance sanctions/pep check: ${result}`, {
        userId: input.userId,
        sanctions: sanctions.length,
        pep,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.6 Step 5: Risk Check
  // ==========================================================

  /**
   * Step 5: 风险评分
   *  - score >= blockThreshold → FAIL (block)
   *  - score >= reviewThreshold → REVIEW
   *  - 否则 → PASS (allow)
   */
  async checkRisk(input: CheckRiskInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();
    if (input.riskScore < 0 || input.riskScore > 100 || !Number.isInteger(input.riskScore)) {
      throw new SportsComplianceRiskScoreInvalidError({ riskScore: input.riskScore });
    }

    const blockThreshold = input.blockThreshold ?? SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_BLOCK;
    const reviewThreshold = input.reviewThreshold ?? SPORTS_COMPLIANCE_DEFAULT_RISK_SCORE_REVIEW;

    let decision: FjnSportsComplianceRiskDecision;
    let result: FjnSportsComplianceResult;
    if (input.riskScore >= blockThreshold) {
      decision = SPORTS_COMPLIANCE_RISK_DECISION.BLOCK;
      result = SPORTS_COMPLIANCE_RESULT.FAIL;
    } else if (input.riskScore >= reviewThreshold) {
      decision = SPORTS_COMPLIANCE_RISK_DECISION.REVIEW;
      result = SPORTS_COMPLIANCE_RESULT.REVIEW;
    } else {
      decision = SPORTS_COMPLIANCE_RISK_DECISION.ALLOW;
      result = SPORTS_COMPLIANCE_RESULT.PASS;
    }

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.RISK,
        result,
        riskScore: input.riskScore,
        riskDecision: decision,
        regionCode: input.regionCode,
        complianceNote: `Risk ${input.riskScore} → ${decision}`,
        metadata: { blockThreshold, reviewThreshold } as Prisma.InputJsonValue,
      });

      if (result === SPORTS_COMPLIANCE_RESULT.FAIL) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.RISK_BLOCKED, {
          checkId: created.id,
          userId: input.userId,
          riskScore: input.riskScore,
        });
      }

      this.log('info', `Sports compliance risk check: ${result}`, {
        userId: input.userId,
        riskScore: input.riskScore,
        decision,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.7 Step 6: Limit Check
  // ==========================================================

  /**
   * Step 6: 限额校验
   *  - perTxAmount > perTxLimitMax → FAIL
   *  - dailyLimitUsed + perTxAmount > dailyLimitMax → FAIL
   *  - 否则 PASS
   */
  async checkLimit(input: CheckLimitInput) {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();

    const dailyLimitMax = input.dailyLimitMax ?? SPORTS_COMPLIANCE_DEFAULT_DAILY_LIMIT;
    const perTxLimit = input.perTxLimitMax ?? SPORTS_COMPLIANCE_DEFAULT_PER_TX_LIMIT;

    let dailyUsed: Prisma.Decimal;
    let perTx: Prisma.Decimal;
    let dailyMax: Prisma.Decimal;
    let perTxMax: Prisma.Decimal;
    try {
      dailyUsed = new Prisma.Decimal(input.dailyLimitUsed);
      perTx = new Prisma.Decimal(input.perTxAmount);
      dailyMax = new Prisma.Decimal(dailyLimitMax);
      perTxMax = new Prisma.Decimal(perTxLimit);
    } catch (e) {
      throw new SportsComplianceLimitInvalidError({
        reason: (e as Error).message,
        dailyLimitMax,
        perTxLimit,
      });
    }
    if (dailyMax.lte(0) || perTxMax.lte(0)) {
      throw new SportsComplianceLimitInvalidError({ dailyLimitMax, perTxLimit });
    }
    if (perTx.lte(0)) {
      throw new SportsComplianceLimitInvalidError({
        perTxAmount: input.perTxAmount,
        perTxLimit,
      });
    }
    if (dailyUsed.lt(0)) {
      throw new SportsComplianceLimitInvalidError({
        dailyLimitUsed: input.dailyLimitUsed,
      });
    }

    let result: FjnSportsComplianceResult = SPORTS_COMPLIANCE_RESULT.PASS;
    let note: string;
    if (perTx.gt(perTxMax)) {
      result = SPORTS_COMPLIANCE_RESULT.FAIL;
      note = `Per-tx amount ${perTx.toString()} exceeds limit ${perTxMax.toString()}`;
    } else if (dailyUsed.plus(perTx).gt(dailyMax)) {
      result = SPORTS_COMPLIANCE_RESULT.FAIL;
      note = `Daily used ${dailyUsed.toString()} + per-tx ${perTx.toString()} exceeds daily limit ${dailyMax.toString()}`;
    } else {
      note = `Per-tx ${perTx.toString()} / ${perTxMax.toString()}; daily used ${dailyUsed.toString()} / ${dailyMax.toString()}`;
    }

    return this.withTransaction(async (tx) => {
      const created = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.LIMIT,
        result,
        dailyLimitUsed: input.dailyLimitUsed,
        dailyLimitMax,
        perTxLimit: input.perTxAmount,
        regionCode: input.regionCode,
        complianceNote: note,
      });

      if (result === SPORTS_COMPLIANCE_RESULT.FAIL) {
        await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.LIMIT_EXCEEDED, {
          checkId: created.id,
          userId: input.userId,
          perTxAmount: input.perTxAmount,
          perTxLimit,
          dailyLimitUsed: input.dailyLimitUsed,
          dailyLimitMax,
        });
      }

      this.log('info', `Sports compliance limit check: ${result}`, {
        userId: input.userId,
        perTxAmount: input.perTxAmount,
        dailyLimitUsed: input.dailyLimitUsed,
      });

      return created as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.8 Step 7+8: 综合判定（runFullCompliance）
  // ==========================================================

  /**
   * 综合 9 步合规检查
   *  - 按 region/age/kyc/sanctions/pep/risk/limit/sports_compliance/audit 顺序
   *  - 任意 FAIL → 最终 FAIL
   *  - 任意 REVIEW → 最终 REVIEW
   *  - 全部 PASS → 最终 PASS
   */
  async runFullCompliance(input: CheckSportsComplianceInput): Promise<RunFullComplianceResult> {
    if (!input.userId) throw new SportsComplianceUserIdRequiredError();
    if (!input.eventId) throw new SportsComplianceEventIdRequiredError();
    if (!input.regionCode || !this.isValidRegionCode(input.regionCode)) {
      throw new SportsComplianceRegionCodeInvalidError({ regionCode: input.regionCode });
    }

    const steps: Record<string, FjnSportsComplianceResult> = {};
    const checkIds: string[] = [];
    const triggeredEvents: string[] = [];

    return this.withTransaction(async (tx) => {
      // Step 1: Region
      const r1 = await this.checkRegion({
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        regionCode: input.regionCode,
        age: input.age,
        operatorId: input.operatorId,
      });
      steps[SPORTS_COMPLIANCE_CHECK_TYPE.REGION] = r1.result as FjnSportsComplianceResult;
      checkIds.push(r1.id);

      // Step 2: Age（仅当提供）
      if (input.age !== undefined && input.age !== null) {
        const r2 = await this.checkAge({
          userId: input.userId,
          eventId: input.eventId,
          marketId: input.marketId,
          entryId: input.entryId,
          age: input.age,
          regionCode: input.regionCode,
          operatorId: input.operatorId,
        });
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.AGE] = r2.result as FjnSportsComplianceResult;
        checkIds.push(r2.id);
      } else {
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.AGE] = SPORTS_COMPLIANCE_RESULT.REVIEW;
      }

      // Step 3: KYC（仅当提供）
      if (input.kycLevel) {
        const r3 = await this.checkKyc({
          userId: input.userId,
          eventId: input.eventId,
          marketId: input.marketId,
          entryId: input.entryId,
          kycLevel: input.kycLevel,
          regionCode: input.regionCode,
          operatorId: input.operatorId,
        });
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.KYC] = r3.result as FjnSportsComplianceResult;
        checkIds.push(r3.id);
      } else {
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.KYC] = SPORTS_COMPLIANCE_RESULT.REVIEW;
      }

      // Step 4: Sanctions/PEP（仅当提供）
      if (input.sanctionsList !== undefined || input.pepStatus !== undefined) {
        const r4 = await this.checkSanctionsPep({
          userId: input.userId,
          eventId: input.eventId,
          marketId: input.marketId,
          entryId: input.entryId,
          regionCode: input.regionCode,
          sanctionsList: input.sanctionsList,
          pepStatus: input.pepStatus,
          operatorId: input.operatorId,
        });
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.SANCTIONS] = r4.result as FjnSportsComplianceResult;
        checkIds.push(r4.id);
      } else {
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.SANCTIONS] = SPORTS_COMPLIANCE_RESULT.PASS;
      }

      // Step 5: Risk（仅当提供）
      if (input.riskScore !== undefined && input.riskScore !== null) {
        const r5 = await this.checkRisk({
          userId: input.userId,
          eventId: input.eventId,
          marketId: input.marketId,
          entryId: input.entryId,
          riskScore: input.riskScore,
          regionCode: input.regionCode,
          operatorId: input.operatorId,
        });
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.RISK] = r5.result as FjnSportsComplianceResult;
        checkIds.push(r5.id);
      } else {
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.RISK] = SPORTS_COMPLIANCE_RESULT.REVIEW;
      }

      // Step 6: Limit（仅当提供）
      if (input.dailyLimitUsed !== undefined && input.perTxAmount !== undefined) {
        const r6 = await this.checkLimit({
          userId: input.userId,
          eventId: input.eventId,
          marketId: input.marketId,
          entryId: input.entryId,
          dailyLimitUsed: input.dailyLimitUsed,
          perTxAmount: input.perTxAmount,
          regionCode: input.regionCode,
          operatorId: input.operatorId,
        });
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.LIMIT] = r6.result as FjnSportsComplianceResult;
        checkIds.push(r6.id);
      } else {
        steps[SPORTS_COMPLIANCE_CHECK_TYPE.LIMIT] = SPORTS_COMPLIANCE_RESULT.REVIEW;
      }

      // 综合判定
      const stepResults = Object.values(steps);
      let finalResult: FjnSportsComplianceResult = SPORTS_COMPLIANCE_RESULT.PASS;
      if (stepResults.includes(SPORTS_COMPLIANCE_RESULT.FAIL)) {
        finalResult = SPORTS_COMPLIANCE_RESULT.FAIL;
      } else if (stepResults.includes(SPORTS_COMPLIANCE_RESULT.REVIEW)) {
        finalResult = SPORTS_COMPLIANCE_RESULT.REVIEW;
      }

      // Step 7: Sports Compliance 综合记录
      const r7 = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.SPORTS_COMPLIANCE,
        result: finalResult,
        regionCode: input.regionCode,
        complianceNote: `9-step composite: ${finalResult}`,
        metadata: { steps, licenseStatus: this.getRegionLicenseStatus(input.regionCode) } as Prisma.InputJsonValue,
      });
      checkIds.push(r7.id);
      steps[SPORTS_COMPLIANCE_CHECK_TYPE.SPORTS_COMPLIANCE] = finalResult;

      // Step 8: Audit Log（综合审计记录，使用 AUDIT 类型）
      const r8 = await this.writeCheck(tx, {
        userId: input.userId,
        eventId: input.eventId,
        marketId: input.marketId,
        entryId: input.entryId,
        checkType: SPORTS_COMPLIANCE_CHECK_TYPE.AUDIT,
        result: finalResult,
        regionCode: input.regionCode,
        complianceNote: `Audit log for runFullCompliance: ${finalResult}`,
        metadata: {
          finalResult,
          stepResults: steps,
          triggeredEvents,
          chainId: SPORTS_COMPLIANCE_DEFAULT_CHAIN_ID,
        } as Prisma.InputJsonValue,
      });
      checkIds.push(r8.id);

      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.AUDIT_LOG_WRITTEN, {
        checkId: r8.id,
        userId: input.userId,
        eventId: input.eventId,
        finalResult,
      });

      this.log('info', `Sports compliance full check: ${finalResult}`, {
        userId: input.userId,
        eventId: input.eventId,
        stepResults: steps,
      });

      return {
        finalResult,
        regionLicenseStatus: this.getRegionLicenseStatus(input.regionCode),
        steps: steps as Record<FjnSportsComplianceCheckType, FjnSportsComplianceResult>,
        checkIds,
        triggeredEvents,
      };
    });
  }

  // ==========================================================
  // 3.9 Review 行动（review → pass/fail）
  // ==========================================================

  /**
   * 人工 Review 行动
   *  - 仅允许 review 状态流转到 pass/fail
   *  - 强制要求 reviewerId
   */
  async reviewCheck(input: ReviewCheckInput) {
    if (!input.checkId) throw new SportsComplianceCheckNotFoundError();
    if (!input.reviewerId) throw new SportsComplianceReviewerRequiredError();
    if (!isValidSportsComplianceResult(input.newResult)) {
      throw new SportsComplianceResultInvalidError({ newResult: input.newResult });
    }
    if (input.newResult === SPORTS_COMPLIANCE_RESULT.REVIEW) {
      throw new SportsComplianceDecisionInvalidError({ newResult: input.newResult });
    }

    return this.withTransaction(async (tx) => {
      const check = await (tx as any).sportsComplianceCheck.findUnique({
        where: { id: input.checkId },
      });
      if (!check) throw new SportsComplianceCheckNotFoundError({ checkId: input.checkId });
      if (check.result !== SPORTS_COMPLIANCE_RESULT.REVIEW) {
        throw new SportsComplianceReviewInvalidStateError({
          checkId: input.checkId,
          currentResult: check.result,
        });
      }

      const previousResult = check.result;
      const updated = await (tx as any).sportsComplianceCheck.update({
        where: { id: input.checkId },
        data: {
          result: input.newResult,
          reviewerId: input.reviewerId,
          reviewedAt: new Date(),
          complianceNote: input.comment
            ? `${check.complianceNote ?? ''}\n[Review ${input.reviewerId}] ${input.comment}`.trim()
            : check.complianceNote,
        },
      });

      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_REVIEWED, {
        checkId: input.checkId,
        userId: check.userId,
        eventId: check.eventId,
        checkType: check.checkType,
        previousResult,
        newResult: input.newResult,
        reviewerId: input.reviewerId,
        comment: input.comment,
      });

      await this.emitEvent(tx, SPORTS_COMPLIANCE_EVENTS.CHECK_OVERRIDDEN, {
        checkId: input.checkId,
        userId: check.userId,
        eventId: check.eventId,
        checkType: check.checkType,
        previousResult,
        newResult: input.newResult,
        reviewerId: input.reviewerId,
      });

      this.log('info', `Sports compliance check reviewed: ${input.newResult}`, {
        checkId: input.checkId,
        reviewerId: input.reviewerId,
      });

      return updated as SportsComplianceCheckSummary;
    });
  }

  // ==========================================================
  // 3.10 查询
  // ==========================================================

  async getCheck(checkId: string) {
    if (!checkId) throw new SportsComplianceCheckNotFoundError();
    const check = await (this.prisma as any).sportsComplianceCheck.findUnique({
      where: { id: checkId },
    });
    if (!check) throw new SportsComplianceCheckNotFoundError({ checkId });
    return check as SportsComplianceCheckSummary;
  }

  async listChecks(input: ListSportsComplianceChecksInput) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, 200);
    const where: any = {};
    if (input.userId) where.userId = input.userId;
    if (input.eventId) where.eventId = input.eventId;
    if (input.checkType) where.checkType = input.checkType;
    if (input.result) where.result = input.result;

    const [items, total] = await Promise.all([
      (this.prisma as any).sportsComplianceCheck.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (this.prisma as any).sportsComplianceCheck.count({ where }),
    ]);

    return {
      items: items as SportsComplianceCheckSummary[],
      total,
      page,
      pageSize,
    };
  }
}

// 工厂函数
export function createFjnSportsComplianceService(options: FjnServiceOptions = {}) {
  return new FjnSportsComplianceService(options);
}
