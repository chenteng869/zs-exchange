/**
 * 业绩归因引擎（Attribution Engine）
 *
 * 1. Brinson 模型（BHB - Brinson, Hood, Beebower）
 *    - Allocation Effect   = (wP - wB) × rB
 *    - Selection Effect    = wB × (rP - rB)
 *    - Interaction Effect  = (wP - wB) × (rP - rB)
 *
 * 2. 因子归因（简化版）
 *    把组合收益拆解为各因子贡献
 *
 * 3. 单资产贡献
 *    contribution[symbol] = wP[symbol] × rP[symbol]
 */

import type { PerformanceAttribution, PortfolioAsset } from './types';

export interface BrinsonInputs {
  /** 组合权重 { symbol: 0-1 } */
  portfolioWeights: Record<string, number>;
  /** 基准权重 */
  benchmarkWeights: Record<string, number>;
  /** 组合收益 { symbol: 0.01 = 1% } */
  portfolioReturns: Record<string, number>;
  /** 基准收益 */
  benchmarkReturns: Record<string, number>;
}

export interface FactorModel {
  /** 因子名 → 因子收益（小数） */
  factorReturns: Record<string, number>;
  /** 因子载荷 [asset][factor] */
  loadings: Record<string, Record<string, number>>;
}

export class AttributionEngine {
  // -------------------------------------------------------------------------
  // Brinson 归因
  // -------------------------------------------------------------------------

  /**
   * Brinson 三因素归因
   * 全部资产类合计：总效应 = 组合收益 - 基准收益
   */
  brinsonAttribution(
    period: { start: number; end: number },
    inputs: BrinsonInputs,
  ): PerformanceAttribution {
    const symbols = new Set([
      ...Object.keys(inputs.portfolioWeights),
      ...Object.keys(inputs.benchmarkWeights),
      ...Object.keys(inputs.portfolioReturns),
      ...Object.keys(inputs.benchmarkReturns),
    ]);

    let allocation = 0;
    let selection = 0;
    let interaction = 0;
    const contribution: Record<string, string> = {};
    let totalP = 0;
    let totalB = 0;

    for (const s of symbols) {
      const wP = inputs.portfolioWeights[s] ?? 0;
      const wB = inputs.benchmarkWeights[s] ?? 0;
      const rP = inputs.portfolioReturns[s] ?? 0;
      const rB = inputs.benchmarkReturns[s] ?? 0;
      allocation += (wP - wB) * rB;
      selection += wB * (rP - rB);
      interaction += (wP - wB) * (rP - rB);
      contribution[s] = (wP * rP).toString();
      totalP += wP * rP;
      totalB += wB * rB;
    }

    return {
      period,
      totalReturn: totalP.toString(),
      benchmarkReturn: totalB.toString(),
      excessReturn: (totalP - totalB).toString(),
      allocationEffect: allocation.toString(),
      selectionEffect: selection.toString(),
      interactionEffect: interaction.toString(),
      factorReturns: {},
      contribution,
    };
  }

  // -------------------------------------------------------------------------
  // 因子归因
  // -------------------------------------------------------------------------

  /**
   * 因子归因：组合收益 = Σ factorLoading_i × factorReturn_i
   * @param returns 各资产的收益 { symbol: 0.05 }
   * @param model   因子模型
   */
  factorAttribution(
    period: { start: number; end: number },
    returns: Record<string, number>,
    model: FactorModel,
    benchmarkReturn: number = 0,
  ): PerformanceAttribution {
    const symbols = Object.keys(returns);
    const factors = Object.keys(model.factorReturns);
    const factorReturns: Record<string, string> = {};
    const contribution: Record<string, string> = {};
    let totalReturn = 0;

    for (const f of factors) {
      let exposure = 0;
      let assetCount = 0;
      for (const s of symbols) {
        const load = model.loadings[s]?.[f] ?? 0;
        exposure += load;
        assetCount++;
      }
      const avgExposure = assetCount > 0 ? exposure / assetCount : 0;
      const factorRet = model.factorReturns[f];
      const contrib = avgExposure * factorRet;
      factorReturns[f] = factorRet.toString();
      contribution[`factor:${f}`] = contrib.toString();
      totalReturn += contrib;
    }
    // 残差（specific returns）
    let residual = 0;
    for (const s of symbols) {
      let explained = 0;
      for (const f of factors) {
        explained += (model.loadings[s]?.[f] ?? 0) * model.factorReturns[f];
      }
      const r = returns[s] ?? 0;
      residual += r - explained;
      contribution[s] = (r - explained).toString();
    }
    totalReturn += residual;
    contribution.residual = residual.toString();
    return {
      period,
      totalReturn: totalReturn.toString(),
      benchmarkReturn: benchmarkReturn.toString(),
      excessReturn: (totalReturn - benchmarkReturn).toString(),
      allocationEffect: '0',
      selectionEffect: residual.toString(),
      interactionEffect: '0',
      factorReturns,
      contribution,
    };
  }

  // -------------------------------------------------------------------------
  // 单资产贡献
  // -------------------------------------------------------------------------

  /**
   * 单资产贡献：weight × return
   */
  calculateContribution(assets: PortfolioAsset[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const a of assets) {
      const w = Number(a.allocation || '0');
      const pnlPct = Number(a.unrealizedPnlPct || '0');
      out[a.symbol] = (w * pnlPct).toString();
    }
    return out;
  }

  /**
   * 累计归因（多期）：把多个单期归因累加
   */
  aggregate(attributions: PerformanceAttribution[]): PerformanceAttribution {
    if (attributions.length === 0) {
      return {
        period: { start: 0, end: 0 },
        totalReturn: '0',
        benchmarkReturn: '0',
        excessReturn: '0',
        allocationEffect: '0',
        selectionEffect: '0',
        interactionEffect: '0',
        factorReturns: {},
        contribution: {},
      };
    }
    const first = attributions[0];
    const last = attributions[attributions.length - 1];
    const agg: PerformanceAttribution = {
      period: { start: first.period.start, end: last.period.end },
      totalReturn: '0',
      benchmarkReturn: '0',
      excessReturn: '0',
      allocationEffect: '0',
      selectionEffect: '0',
      interactionEffect: '0',
      factorReturns: {},
      contribution: {},
    };
    let totalP = 0;
    let totalB = 0;
    let alloc = 0;
    let sel = 0;
    let inter = 0;
    for (const a of attributions) {
      totalP += Number(a.totalReturn);
      totalB += Number(a.benchmarkReturn);
      alloc += Number(a.allocationEffect);
      sel += Number(a.selectionEffect);
      inter += Number(a.interactionEffect);
      for (const [k, v] of Object.entries(a.factorReturns)) {
        agg.factorReturns[k] = (
          (Number(agg.factorReturns[k] ?? '0')) + Number(v)
        ).toString();
      }
      for (const [k, v] of Object.entries(a.contribution)) {
        agg.contribution[k] = (
          (Number(agg.contribution[k] ?? '0')) + Number(v)
        ).toString();
      }
    }
    agg.totalReturn = totalP.toString();
    agg.benchmarkReturn = totalB.toString();
    agg.excessReturn = (totalP - totalB).toString();
    agg.allocationEffect = alloc.toString();
    agg.selectionEffect = sel.toString();
    agg.interactionEffect = inter.toString();
    return agg;
  }
}

/**
 * 工厂
 */
export function createAttributionEngine(): AttributionEngine {
  return new AttributionEngine();
}
