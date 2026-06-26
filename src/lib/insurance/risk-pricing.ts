/**
 * 风险定价引擎（RiskPricingEngine）
 *
 *  精算模型：
 *   - 多维评分：合约风险 / 流动性风险 / 历史事件 / 审计 / 中心化
 *   - 推荐保费率 = 基础费率 × (1 + 风险系数)
 *   - 保费 = 保额 × 期间费率 × (1 + 风险调整)
 *   - 资本要求 = 保额 / 目标利用率
 *
 *  演示降级：
 *   - 风险因子使用内置映射表（可被覆盖）
 *   - 目标资产风险以 hash 查询为主，缺省 fallback 到产品默认
 */

import {
  decAdd,
  decIsPositive,
  decTruncate,
} from '@/lib/matching/decimal';
import {
  INSURANCE_BASE_RATES,
  INSURANCE_POOL_UTILIZATION_TARGET,
} from './types';
import type { InsuranceProduct, RiskAssessment } from './types';

// ============================================================================
// 内置风险因子映射
// ============================================================================

/** 风险因子（0-100, 越高越危险） */
interface ProductRiskProfile {
  smartContractRisk: number;
  liquidityRisk: number;
  historicalIncidents: number;
  /** 0-100, 越高越安全（取 100 减） */
  auditScore: number;
  centralizationRisk: number;
  /** 推荐调整后费率上限（防止风险定价过高） */
  rateCap: number;
}

const DEFAULT_RISK_PROFILES: Record<InsuranceProduct, ProductRiskProfile> = {
  exchange_hack: {
    smartContractRisk: 50,
    liquidityRisk: 60,
    historicalIncidents: 70,
    auditScore: 50,
    centralizationRisk: 80,
    rateCap: 0.05,
  },
  smart_contract: {
    smartContractRisk: 75,
    liquidityRisk: 40,
    historicalIncidents: 55,
    auditScore: 60,
    centralizationRisk: 35,
    rateCap: 0.06,
  },
  stablecoin_depeg: {
    smartContractRisk: 25,
    liquidityRisk: 70,
    historicalIncidents: 50,
    auditScore: 70,
    centralizationRisk: 60,
    rateCap: 0.04,
  },
  oracle_failure: {
    smartContractRisk: 40,
    liquidityRisk: 50,
    historicalIncidents: 30,
    auditScore: 75,
    centralizationRisk: 70,
    rateCap: 0.03,
  },
  liquidation_penalty: {
    smartContractRisk: 35,
    liquidityRisk: 30,
    historicalIncidents: 20,
    auditScore: 80,
    centralizationRisk: 30,
    rateCap: 0.03,
  },
};

/** 高风险资产/平台黑名单（演示） */
const HIGH_RISK_ASSETS: Record<string, Partial<ProductRiskProfile>> = {
  'titan': { smartContractRisk: 95, historicalIncidents: 95 },
  'ust': { smartContractRisk: 50, historicalIncidents: 100 },
  'luna': { smartContractRisk: 60, historicalIncidents: 100 },
  'cream': { smartContractRisk: 90, historicalIncidents: 80 },
};

/** 低风险资产（主流币） */
const LOW_RISK_ASSETS: Record<string, Partial<ProductRiskProfile>> = {
  'btc': { smartContractRisk: 15, liquidityRisk: 10, centralizationRisk: 25, auditScore: 90 },
  'eth': { smartContractRisk: 20, liquidityRisk: 15, centralizationRisk: 30, auditScore: 90 },
  'usdt': { smartContractRisk: 30, liquidityRisk: 20, centralizationRisk: 60, auditScore: 70 },
  'usdc': { smartContractRisk: 25, liquidityRisk: 20, centralizationRisk: 50, auditScore: 80 },
};

// ============================================================================
// 错误
// ============================================================================

export class InsurancePricingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'InsurancePricingError';
  }
}

// ============================================================================
// 引擎
// ============================================================================

export interface RiskPricingEngineOptions {
  /** 覆盖默认风险因子 */
  customProfiles?: Partial<Record<InsuranceProduct, ProductRiskProfile>>;
  /** 覆盖基础费率 */
  customBaseRates?: Partial<Record<InsuranceProduct, number>>;
  /** 目标利用率（默认 0.8） */
  utilizationTarget?: number;
}

export class RiskPricingEngine {
  private profiles: Record<InsuranceProduct, ProductRiskProfile>;
  private baseRates: Record<InsuranceProduct, number>;
  private utilizationTarget: number;

  constructor(options: RiskPricingEngineOptions = {}) {
    this.profiles = { ...DEFAULT_RISK_PROFILES, ...(options.customProfiles || {}) } as Record<
      InsuranceProduct,
      ProductRiskProfile
    >;
    this.baseRates = {
      ...INSURANCE_BASE_RATES,
      ...(options.customBaseRates || {}),
    } as Record<InsuranceProduct, number>;
    this.utilizationTarget =
      options.utilizationTarget ?? INSURANCE_POOL_UTILIZATION_TARGET;
  }

  // ==========================================================================
  // 1. 风险评估
  // ==========================================================================

  /**
   * 评估某产品/资产的风险
   *  - score 为 0-100 综合分（100=最危险）
   *  - factors 包含分项明细
   *  - recommendedRate 为调整后年化费率
   */
  assessRisk(
    product: InsuranceProduct,
    targetAsset: string = 'USDT'
  ): RiskAssessment {
    const profile = this.profiles[product];
    if (!profile) {
      throw new InsurancePricingError(
        'UNKNOWN_PRODUCT',
        `Unknown insurance product: ${product}`
      );
    }

    // 合并资产层风险调整
    const assetLower = targetAsset.toLowerCase();
    const highRisk = HIGH_RISK_ASSETS[assetLower];
    const lowRisk = LOW_RISK_ASSETS[assetLower];
    const adjustment = highRisk || lowRisk || {};

    const factors = {
      smartContractRisk: clamp(
        (adjustment.smartContractRisk ?? profile.smartContractRisk),
        0,
        100
      ),
      liquidityRisk: clamp(
        adjustment.liquidityRisk ?? profile.liquidityRisk,
        0,
        100
      ),
      historicalIncidents: clamp(
        adjustment.historicalIncidents ?? profile.historicalIncidents,
        0,
        100
      ),
      auditScore: clamp(
        adjustment.auditScore ?? profile.auditScore,
        0,
        100
      ),
      centralizationRisk: clamp(
        adjustment.centralizationRisk ?? profile.centralizationRisk,
        0,
        100
      ),
    };

    // 综合分 = 加权平均（合约 0.3 + 流动性 0.15 + 历史 0.25 + (100-audit)*0.15 + 中心化 0.15）
    const auditRisk = 100 - factors.auditScore;
    const score = Math.round(
      factors.smartContractRisk * 0.3 +
        factors.liquidityRisk * 0.15 +
        factors.historicalIncidents * 0.25 +
        auditRisk * 0.15 +
        factors.centralizationRisk * 0.15
    );

    const baseRate = this.baseRates[product];
    // 风险调整：score=0 不调整，score=100 翻倍
    const riskMultiplier = 1 + score / 100;
    const recommendedRate = Math.min(baseRate * riskMultiplier, profile.rateCap);

    const reason = this.buildReason(product, targetAsset, score, factors);

    return {
      product,
      targetAsset,
      score,
      factors,
      recommendedRate,
      reason,
    };
  }

  // ==========================================================================
  // 2. 保费计算
  // ==========================================================================

  /**
   * 计算保费
   *  - 基础公式：premium = coverage × annualRate × (period / 365)
   *  - 风险调整：rate *= (1 + riskScore / 100)
   *  - 输出：保单保费（截断到 8 位）
   *
   *  实现说明：
   *  - 精算费率是浮点数，amount 较大时使用 JS Number 精度足够
   *  - 结果按 8 位截断以与其它模块（perp/yield）保持一致
   */
  calculatePremium(opts: {
    coverage: string;
    period: number;
    riskScore: number;
    product?: InsuranceProduct;
  }): string {
    if (!decIsPositive(opts.coverage)) {
      throw new InsurancePricingError('INVALID_COVERAGE', 'coverage must be > 0');
    }
    if (opts.period <= 0) {
      throw new InsurancePricingError('INVALID_PERIOD', 'period must be > 0');
    }
    if (opts.riskScore < 0 || opts.riskScore > 100) {
      throw new InsurancePricingError(
        'INVALID_RISK_SCORE',
        'riskScore must be in [0, 100]'
      );
    }

    const product = opts.product || 'smart_contract';
    const baseRate = this.baseRates[product];
    const periodRate = baseRate * (opts.period / 365);
    const adjustedRate = periodRate * (1 + opts.riskScore / 100);
    const coverageNum = Number(opts.coverage);
    if (!Number.isFinite(coverageNum)) {
      throw new InsurancePricingError('INVALID_COVERAGE', 'coverage is not a finite number');
    }
    const premiumNum = coverageNum * adjustedRate;
    if (!Number.isFinite(premiumNum) || premiumNum < 0) {
      throw new InsurancePricingError(
        'PREMIUM_OVERFLOW',
        'premium calculation overflowed'
      );
    }
    // 使用 toString 直接转换以避免 decimal 模块在带前导零小数（如 0.00295890）
    // 解析时丢精度的已知问题
    return decTruncate(premiumNum.toString(), 8);
  }

  // ==========================================================================
  // 3. 资本要求
  // ==========================================================================

  /**
   * 计算池子所需资本
   *  - coverageAmount / utilizationTarget
   *  - utilizationTarget=0.8 表示保额占池子的 80% 即可
   *
   *  实现说明：
   *  - 用 JS Number 直接做除法（保险费率/资本充足比例都是常规小数，精度足够）
   *  - 结果截断到 8 位
   */
  calculateRequiredCapital(
    coverageAmount: string,
    utilizationTarget: number = this.utilizationTarget
  ): string {
    if (!decIsPositive(coverageAmount)) {
      throw new InsurancePricingError(
        'INVALID_COVERAGE',
        'coverageAmount must be > 0'
      );
    }
    if (utilizationTarget <= 0 || utilizationTarget > 1) {
      throw new InsurancePricingError(
        'INVALID_UTILIZATION',
        'utilizationTarget must be in (0, 1]'
      );
    }
    const coverage = Number(coverageAmount);
    if (!Number.isFinite(coverage)) {
      throw new InsurancePricingError(
        'INVALID_COVERAGE',
        'coverageAmount is not a finite number'
      );
    }
    const result = coverage / utilizationTarget;
    if (!Number.isFinite(result) || result < 0) {
      throw new InsurancePricingError(
        'CAPITAL_OVERFLOW',
        'required capital calculation overflowed'
      );
    }
    return decTruncate(result.toString(), 8);
  }

  // ==========================================================================
  // 内部
  // ==========================================================================

  private buildReason(
    product: InsuranceProduct,
    asset: string,
    score: number,
    factors: RiskAssessment['factors']
  ): string {
    const lines: string[] = [];
    if (score >= 70) lines.push('高风险');
    else if (score >= 40) lines.push('中等风险');
    else lines.push('低风险');
    lines.push(`资产=${asset}`);
    lines.push(`合约风险=${factors.smartContractRisk}`);
    lines.push(`历史事故=${factors.historicalIncidents}`);
    lines.push(`审计=${factors.auditScore}`);
    return `产品=${product}; ${lines.join('; ')}`;
  }

  getBaseRate(product: InsuranceProduct): number {
    return this.baseRates[product];
  }

  getUtilizationTarget(): number {
    return this.utilizationTarget;
  }
}

// ============================================================================
// 工具
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// 确保 decAdd 不被 tree-shake 误删（占位用）
void decAdd;
