/**
 * 风险评估器 (RiskAssessor)
 *
 * 多维度评估 DeFi 协议风险：
 *  1. 智能合约风险（审计 / 复杂度 / 已部署时长）
 *  2. 流动性风险（TVL 规模 / 撤出深度）
 *  3. 中心化风险（管理员权限 / 升级机制）
 *  4. 预言机风险（依赖 Chainlink / 自建 TWAP）
 *  5. 无常损失风险（仅 AMM）
 *  + 历史攻击次数 + 审计机构
 *
 * 输出：0-100 overallScore（越高越危险），可对应 4 个 RiskTier。
 *
 * 本模块使用协议内置的 PROTOCOL_RISK_SCORES 作为基线，再叠加维度调整，
 * 真实环境会接入 Chainalysis / DefiSafety 等数据源。
 */

import { PROTOCOL_RISK_SCORES, type RiskMetrics, type RiskTier, type YieldProtocol, scoreToRiskTier } from './types';

// =============================================================================
// 协议风险画像
// =============================================================================

interface ProtocolProfile {
  /** 智能合约基础风险 */
  smartContractRisk: number;
  /** 流动性基础风险 */
  liquidityRisk: number;
  /** 中心化基础风险 */
  centralizationRisk: number;
  /** 预言机基础风险 */
  oracleRisk: number;
  /** 无常损失基础风险（AMM 才非零） */
  impermanentLossRisk: number;
  /** 历史被攻击次数 */
  historicalHacks: number;
  /** 审计机构列表 */
  auditFirms: string[];
  /** 7 日 TVL 变化（百分比字符串） */
  tvlChange7d: string;
}

const PROFILES: Record<YieldProtocol, ProtocolProfile> = {
  LIDO: {
    smartContractRisk: 15,
    liquidityRisk: 10,
    centralizationRisk: 35, // LDO 治理 + 验证人集合较中心化
    oracleRisk: 20,
    impermanentLossRisk: 0,
    historicalHacks: 0,
    auditFirms: ['Sigma Prime', 'ChainSecurity', 'Statemind'],
    tvlChange7d: '+1.2%',
  },
  AAVE: {
    smartContractRisk: 12,
    liquidityRisk: 8,
    centralizationRisk: 30, // AAVE 治理 + Guardian
    oracleRisk: 25,
    impermanentLossRisk: 0,
    historicalHacks: 0,
    auditFirms: ['OpenZeppelin', 'Trail of Bits', 'Sigma Prime', 'Certora'],
    tvlChange7d: '+0.8%',
  },
  COMPOUND: {
    smartContractRisk: 14,
    liquidityRisk: 10,
    centralizationRisk: 28,
    oracleRisk: 25,
    impermanentLossRisk: 0,
    historicalHacks: 0,
    auditFirms: ['OpenZeppelin', 'Trail of Bits', 'Dharma'],
    tvlChange7d: '-0.3%',
  },
  CURVE: {
    smartContractRisk: 35,
    liquidityRisk: 25,
    centralizationRisk: 50, // Curve DAO + Emergency DAO
    oracleRisk: 20,
    impermanentLossRisk: 15, // 稳定币池低 / stETH 池高
    historicalHacks: 1, // 2022 多次稳定币池被攻击
    auditFirms: ['Trail of Bits', 'Sigma Prime', 'MixBytes'],
    tvlChange7d: '-2.1%',
  },
  CONVEX: {
    smartContractRisk: 40,
    liquidityRisk: 30,
    centralizationRisk: 55, // vlCVX 投票 + 多签
    oracleRisk: 20,
    impermanentLossRisk: 15,
    historicalHacks: 0,
    auditFirms: ['Sigma Prime', 'ChainSecurity', 'MixBytes'],
    tvlChange7d: '-1.4%',
  },
  YEARN: {
    smartContractRisk: 50,
    liquidityRisk: 35,
    centralizationRisk: 45,
    oracleRisk: 30,
    impermanentLossRisk: 20,
    historicalHacks: 1, // 2021 yVault 攻击
    auditFirms: ['Sigma Prime', 'Banteg', 'MixBytes'],
    tvlChange7d: '-0.6%',
  },
  BEEFY: {
    smartContractRisk: 45,
    liquidityRisk: 30,
    centralizationRisk: 50,
    oracleRisk: 25,
    impermanentLossRisk: 20,
    historicalHacks: 0,
    auditFirms: ['Certora', 'Chainsulting'],
    tvlChange7d: '+0.5%',
  },
  UNISWAP: {
    smartContractRisk: 10,
    liquidityRisk: 12,
    centralizationRisk: 5,
    oracleRisk: 30, // TWAP
    impermanentLossRisk: 80, // 主流 V3 池波动大
    historicalHacks: 0,
    auditFirms: ['Trail of Bits', 'ABDK'],
    tvlChange7d: '+0.4%',
  },
  PANCAKESWAP: {
    smartContractRisk: 18,
    liquidityRisk: 20,
    centralizationRisk: 35,
    oracleRisk: 35,
    impermanentLossRisk: 70,
    historicalHacks: 0,
    auditFirms: ['Certik', 'SlowMist'],
    tvlChange7d: '+0.2%',
  },
};

// =============================================================================
// RiskAssessor
// =============================================================================

export class RiskAssessor {
  /** 缓存：protocol -> RiskMetrics */
  private cache: Map<YieldProtocol, RiskMetrics> = new Map();

  /**
   * 评估协议风险
   */
  async assessProtocol(protocol: YieldProtocol): Promise<RiskMetrics> {
    const cached = this.cache.get(protocol);
    if (cached) return cached;
    // 模拟异步：实际项目可能从外部数据源拉取
    const profile = PROFILES[protocol];
    if (!profile) {
      throw new Error(`Unknown protocol: ${protocol}`);
    }
    const metrics = this.computeMetrics(protocol, profile);
    this.cache.set(protocol, metrics);
    return metrics;
  }

  /**
   * 获取已缓存的协议风险（无则返回 null）
   */
  getProtocolRisk(protocol: YieldProtocol): RiskMetrics | null {
    return this.cache.get(protocol) || null;
  }

  /**
   * 同步评估：直接使用内置 profile（不写缓存）
   */
  assessSync(protocol: YieldProtocol): RiskMetrics {
    const profile = PROFILES[protocol];
    if (!profile) {
      throw new Error(`Unknown protocol: ${protocol}`);
    }
    return this.computeMetrics(protocol, profile);
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 对外暴露的 profile（用于自定义调整）
   */
  getProfile(protocol: YieldProtocol): ProtocolProfile | null {
    return PROFILES[protocol] || null;
  }

  /**
   * 总体评分转 RiskTier
   */
  static toRiskTier(score: number): RiskTier {
    return scoreToRiskTier(score);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private computeMetrics(protocol: YieldProtocol, p: ProtocolProfile): RiskMetrics {
    // 综合分 = 加权平均 + 历史攻击加成 + 中心化加成
    const w = {
      contract: 0.25,
      liquidity: 0.15,
      central: 0.2,
      oracle: 0.1,
      il: 0.1,
    };
    const base =
      p.smartContractRisk * w.contract +
      p.liquidityRisk * w.liquidity +
      p.centralizationRisk * w.central +
      p.oracleRisk * w.oracle +
      p.impermanentLossRisk * w.il;
    const hackPenalty = p.historicalHacks * 8;
    const auditMitigation = Math.min(10, p.auditFirms.length * 2.5);
    const overallScore = Math.max(0, Math.min(100, base + hackPenalty - auditMitigation));

    // 与基线 PROTOCOL_RISK_SCORES 取较大者（更保守）
    const baseline = PROTOCOL_RISK_SCORES[protocol] ?? 50;
    const final = Math.max(overallScore, baseline);

    return {
      protocol,
      smartContractRisk: p.smartContractRisk,
      liquidityRisk: p.liquidityRisk,
      centralizationRisk: p.centralizationRisk,
      oracleRisk: p.oracleRisk,
      impermanentLossRisk: p.impermanentLossRisk,
      historicalHacks: p.historicalHacks,
      auditFirms: [...p.auditFirms],
      tvlChange7d: p.tvlChange7d,
      overallScore: Math.round(final),
    };
  }
}

/** 工厂 */
export function createRiskAssessor(): RiskAssessor {
  return new RiskAssessor();
}
