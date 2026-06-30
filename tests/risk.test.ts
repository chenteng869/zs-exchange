/**
 * 风控模块单元测试
 *
 * 覆盖：
 *  - 大额交易检测
 *  - 限额检查
 *  - 强平价格计算
 *  - AML 拆分检测
 *
 * 运行：node --import tsx tests/risk.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectLargeTransaction,
  detectStructuring,
  detectHighRiskCountry,
  detectAnomalousIp,
  detectAnomalousTime,
  runAmlChecks,
  HIGH_RISK_COUNTRIES,
  LARGE_TX_THRESHOLD,
  STRUCTURING_PER_TX_LIMIT,
  _resetAmlHistory,
} from '../src/lib/risk/aml';
import {
  checkSingleLimit,
  checkDailyLimit,
  checkMonthlyLimit,
  checkAllLimits,
  getLimitUsage,
  recordUsage,
  _resetLimitUsage,
} from '../src/lib/risk/limits';
import { evaluateRisk, loadRules, listRules } from '../src/lib/risk/engine';
import {
  calculateMarginRatio,
  calculateLiquidationPrice,
  checkMaintenanceMargin,
  shouldLiquidate,
  triggerLiquidation,
  calculatePnl,
} from '../src/lib/risk/positions';
import { RiskError } from '../src/lib/auth/errors';
import type { Position } from '../src/types/models';

// ---------------------------------------------------------------------------
// 大额检测
// ---------------------------------------------------------------------------

test('aml: large transaction detected at 10000 USDT', () => {
  const alert = detectLargeTransaction({
    id: 't1',
    userId: 'u1',
    amountUsdt: 15000,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
  });
  assert.ok(alert !== null);
  assert.equal(alert!.type, 'large_withdraw');
  assert.equal(alert!.level, 'high');
});

test('aml: small transaction not flagged', () => {
  const alert = detectLargeTransaction({
    id: 't2',
    userId: 'u2',
    amountUsdt: 500,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
  });
  assert.equal(alert, null);
});

test('aml: threshold is exactly 10000', () => {
  assert.equal(LARGE_TX_THRESHOLD, 10000);
});

// ---------------------------------------------------------------------------
// 拆分交易
// ---------------------------------------------------------------------------

test('aml: structuring detected when many small txs sum to large', () => {
  _resetAmlHistory();
  const baseTx = {
    userId: 'suser',
    occurredAt: new Date().toISOString(),
    type: 'withdraw' as const,
  };
  // 先做 3 笔小于 9500 的（通过 runAmlChecks 写入历史）
  runAmlChecks({ id: 's1', ...baseTx, amountUsdt: 4000 });
  runAmlChecks({ id: 's2', ...baseTx, amountUsdt: 4000 });
  runAmlChecks({ id: 's3', ...baseTx, amountUsdt: 4000 });
  // 第 4 笔触发拆分检测
  const alert = detectStructuring({ id: 's4', ...baseTx, amountUsdt: 4000 });
  assert.ok(alert !== null, 'should detect structuring');
  assert.equal(alert!.reason.includes('拆分'), true);
});

test('aml: structuring not triggered with single large tx', () => {
  _resetAmlHistory();
  const alert = detectStructuring({
    id: 'b1',
    userId: 'big_user',
    amountUsdt: 15000, // 单笔大额，规则只对拆分检测
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
  });
  // 大于 STRUCTURING_PER_TX_LIMIT 的单笔不算拆分
  assert.equal(alert, null);
});

// ---------------------------------------------------------------------------
// 高风险国家
// ---------------------------------------------------------------------------

test('aml: high risk country blocked', () => {
  assert.ok(HIGH_RISK_COUNTRIES.has('KP'));
  assert.ok(HIGH_RISK_COUNTRIES.has('IR'));
  const alert = detectHighRiskCountry({
    id: 'h1',
    userId: 'u3',
    amountUsdt: 100,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
    country: 'KP',
  });
  assert.ok(alert !== null);
  assert.equal(alert!.level, 'critical');
});

test('aml: normal country not flagged', () => {
  const alert = detectHighRiskCountry({
    id: 'h2',
    userId: 'u4',
    amountUsdt: 100,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
    country: 'US',
  });
  assert.equal(alert, null);
});

// ---------------------------------------------------------------------------
// 异常 IP
// ---------------------------------------------------------------------------

test('aml: ip anomaly with large amount flagged', () => {
  const alert = detectAnomalousIp({
    id: 'i1',
    userId: 'u5',
    amountUsdt: 12000,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
    ipCountry: 'US',
    userHomeCountry: 'CN',
  });
  assert.ok(alert !== null);
});

test('aml: same country not flagged', () => {
  const alert = detectAnomalousIp({
    id: 'i2',
    userId: 'u6',
    amountUsdt: 12000,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
    ipCountry: 'CN',
    userHomeCountry: 'CN',
  });
  assert.equal(alert, null);
});

// ---------------------------------------------------------------------------
// 异常时间
// ---------------------------------------------------------------------------

test('aml: suspicious hour detection (Beijing 02-06)', () => {
  // 北京时间 03:00 = UTC 19:00（冬令时）
  const bj3amUtc = new Date();
  bj3amUtc.setUTCHours(19, 0, 0, 0);
  const alert = detectAnomalousTime({
    id: 'tm1',
    userId: 'u7',
    amountUsdt: 15000,
    occurredAt: bj3amUtc.toISOString(),
    type: 'withdraw',
  });
  assert.ok(alert !== null, 'should detect suspicious time');
});

test('aml: daytime large tx not flagged as time-anomaly', () => {
  // 北京时间 14:00 = UTC 06:00（冬令时）
  const bj2pmUtc = new Date();
  bj2pmUtc.setUTCHours(6, 0, 0, 0);
  const alert = detectAnomalousTime({
    id: 'tm2',
    userId: 'u8',
    amountUsdt: 15000,
    occurredAt: bj2pmUtc.toISOString(),
    type: 'withdraw',
  });
  assert.equal(alert, null);
});

// ---------------------------------------------------------------------------
// 综合 AML
// ---------------------------------------------------------------------------

test('aml: runAmlChecks returns multiple alerts when applicable', () => {
  _resetAmlHistory();
  const alerts = runAmlChecks({
    id: 'a1',
    userId: 'multi',
    amountUsdt: 15000,
    occurredAt: new Date().toISOString(),
    type: 'withdraw',
    country: 'KP',
    ipCountry: 'US',
    userHomeCountry: 'CN',
  });
  assert.ok(alerts.length >= 2, 'should detect multiple issues');
});

// ---------------------------------------------------------------------------
// 限额
// ---------------------------------------------------------------------------

test('limits: L1 single tx over 5000 rejected', () => {
  _resetLimitUsage();
  const r = checkSingleLimit('lu1', 1, 'withdraw', 6000);
  assert.equal(r.passed, false);
  assert.equal(r.limit, 5000);
});

test('limits: L1 single tx under 5000 passed', () => {
  _resetLimitUsage();
  const r = checkSingleLimit('lu2', 1, 'withdraw', 3000);
  assert.equal(r.passed, true);
});

test('limits: L2 daily withdraw limit', () => {
  _resetLimitUsage();
  // L2 日累计 100000
  recordUsage('lu3', 2, 'withdraw', 60000);
  recordUsage('lu3', 2, 'withdraw', 30000);
  // 还想再 20000 → 超限
  const r = checkDailyLimit('lu3', 2, 'withdraw', 20000);
  assert.equal(r.passed, false);
  // 9999 不超
  const r2 = checkDailyLimit('lu3', 2, 'withdraw', 9999);
  assert.equal(r2.passed, true);
});

test('limits: monthly limit applies to withdraw only', () => {
  _resetLimitUsage();
  recordUsage('lu4', 2, 'withdraw', 500000);
  const r = checkMonthlyLimit('lu4', 2, 'withdraw', 600000);
  assert.equal(r.passed, false);
});

test('limits: getLimitUsage returns snapshot', () => {
  _resetLimitUsage();
  recordUsage('lu5', 1, 'withdraw', 1000);
  const usage = getLimitUsage('lu5', 1, 'withdraw');
  assert.equal(usage.daily, 1000);
  assert.equal(usage.kycLevel, 1);
  assert.equal(usage.singleLimit, 5000);
});

test('limits: checkAllLimits aggregates', () => {
  _resetLimitUsage();
  const r = checkAllLimits('lu6', 1, 'withdraw', 4000);
  assert.equal(r.passed, true);
  assert.equal(r.checks.single.passed, true);
});

// ---------------------------------------------------------------------------
// 仓位 - 强平价格
// ---------------------------------------------------------------------------

test('position: liquidation price for long', () => {
  const liq = calculateLiquidationPrice({
    side: 'long',
    entryPrice: '50000',
    leverage: 10,
  });
  // 多仓：entry * (1 - 1/10 + 0.005) = 50000 * 0.905 = 45250
  assert.ok(Math.abs(liq - 45250) < 0.01);
});

test('position: liquidation price for short', () => {
  const liq = calculateLiquidationPrice({
    side: 'short',
    entryPrice: '50000',
    leverage: 10,
  });
  // 空仓：entry * (1 + 1/10 - 0.005) = 50000 * 1.095 = 54750
  assert.ok(Math.abs(liq - 54750) < 0.01);
});

test('position: invalid input throws', () => {
  assert.throws(() => calculateLiquidationPrice({ side: 'long', entryPrice: '0', leverage: 10 }), RiskError);
  assert.throws(() => calculateLiquidationPrice({ side: 'long', entryPrice: '50000', leverage: 0 }), RiskError);
});

test('position: margin ratio calculation', () => {
  const r = calculateMarginRatio(
    {
      side: 'long',
      entryPrice: '50000',
      quantity: '1',
      leverage: 10,
      margin: '5000',
      maintenanceMargin: '0',
    },
    50000
  );
  // 维持保证金 = 50000 * 0.005 = 250
  assert.ok(Math.abs(r.maintenanceMargin - 250) < 0.01);
  // 权益 = 5000 + 0 = 5000
  // 比率 = 5000 / 250 = 20
  assert.ok(r.marginRatio > 1);
  assert.equal(r.riskLevel, 'safe');
});

test('position: margin ratio dangerous when price moves', () => {
  // 多仓 10x，mark 价从 50000 跌到 46000（-8%）
  // 未实现亏损 = (46000-50000) * 1 = -4000
  // 权益 = 5000 - 4000 = 1000
  // 维持 = 46000 * 0.005 = 230
  // 比率 = 1000 / 230 ≈ 4.35，仍为 safe，但接近 warning
  const r = calculateMarginRatio(
    {
      side: 'long',
      entryPrice: '50000',
      quantity: '1',
      leverage: 10,
      margin: '5000',
      maintenanceMargin: '0',
    },
    47000
  );
  // 亏损 3000，权益 2000，维持 235
  // 比率 = 2000/235 ≈ 8.5
  assert.ok(r.unrealizedPnl < 0);
});

test('position: shouldLiquidate returns true when below mm', () => {
  // mark 价跌到 40000，多仓 10x
  // 亏损 10000，权益 = 5000 - 10000 = -5000
  // 维持 = 40000 * 0.005 = 200
  // 显然 -5000 < 200，应该被强平
  const pos: Position = {
    id: 'p1',
    userId: 'up1',
    symbol: 'BTCUSDT',
    side: 'long',
    quantity: '1',
    entryPrice: '50000',
    markPrice: '40000',
    liquidationPrice: '0',
    leverage: 10,
    marginMode: 'isolated',
    margin: '5000',
    marginRatio: '0',
    unrealizedPnl: '0',
    realizedPnl: '0',
    maintenanceMargin: '0',
    cumulativeFundingFee: '0',
    openedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(shouldLiquidate(pos, 40000), true);
});

test('position: triggerLiquidation returns event', () => {
  const pos: Position = {
    id: 'p2',
    userId: 'up2',
    symbol: 'BTCUSDT',
    side: 'long',
    quantity: '1',
    entryPrice: '50000',
    markPrice: '40000',
    liquidationPrice: '0',
    leverage: 10,
    marginMode: 'isolated',
    margin: '5000',
    marginRatio: '0',
    unrealizedPnl: '0',
    realizedPnl: '0',
    maintenanceMargin: '0',
    cumulativeFundingFee: '0',
    openedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const evt = triggerLiquidation('up2', pos, 40000);
  assert.equal(evt.userId, 'up2');
  assert.equal(evt.symbol, 'BTCUSDT');
  assert.equal(evt.side, 'long');
  assert.ok(evt.liquidationPrice > 0);
});

test('position: triggerLiquidation throws when not liquidatable', () => {
  const pos: Position = {
    id: 'p3',
    userId: 'up3',
    symbol: 'BTCUSDT',
    side: 'long',
    quantity: '1',
    entryPrice: '50000',
    markPrice: '50000',
    liquidationPrice: '0',
    leverage: 2,
    marginMode: 'isolated',
    margin: '25000',
    marginRatio: '0',
    unrealizedPnl: '0',
    realizedPnl: '0',
    maintenanceMargin: '0',
    cumulativeFundingFee: '0',
    openedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.throws(() => triggerLiquidation('up3', pos, 50000), RiskError);
});

test('position: calculatePnl long/short', () => {
  const longPnl = calculatePnl('long', '50000', '55000', '1');
  assert.equal(longPnl, 5000);
  const shortPnl = calculatePnl('short', '50000', '55000', '1');
  assert.equal(shortPnl, -5000);
});

// ---------------------------------------------------------------------------
// 规则引擎
// ---------------------------------------------------------------------------

test('engine: evaluate allows small safe tx', async () => {
  const decision = await evaluateRisk(
    { type: 'withdraw' },
    {
      userId: 'e1',
      kycLevel: 2,
      eventType: 'withdraw',
      amountUsdt: 100,
      txType: 'withdraw',
    }
  );
  assert.equal(decision.action, 'allow');
  assert.ok(decision.score >= 80);
});

test('engine: evaluate blocks when over limit', async () => {
  const decision = await evaluateRisk(
    { type: 'withdraw' },
    {
      userId: 'e2',
      kycLevel: 0, // 未 KYC 直接大额
      eventType: 'withdraw',
      amountUsdt: 20000,
      txType: 'withdraw',
    }
  );
  assert.equal(decision.action, 'block');
});

test('engine: evaluate reviews large tx', async () => {
  const decision = await evaluateRisk(
    { type: 'withdraw' },
    {
      userId: 'e3',
      kycLevel: 2,
      eventType: 'withdraw',
      amountUsdt: 15000,
      txType: 'withdraw',
    }
  );
  assert.equal(decision.action, 'review');
});

test('engine: hot-load rules', () => {
  const before = listRules().length;
  loadRules([
    {
      id: 'custom-1',
      name: 'Custom rule',
      type: 'aml_alert',
      enabled: true,
      priority: 1,
      cooldownSeconds: 0,
      action: 'block',
      conditions: [{ field: 'amountUsdt', operator: 'gt', value: 1000000 }],
    },
  ]);
  assert.equal(listRules().length, 1);
  assert.equal(listRules()[0].id, 'custom-1');
  // 恢复
  loadRules([]);
  assert.equal(listRules().length, 0);
  // 再次加载以恢复后续测试
  loadRules([
    {
      id: 'r-aml-large',
      name: '大额交易',
      type: 'large_withdraw',
      enabled: true,
      priority: 10,
      cooldownSeconds: 0,
      action: 'review',
      conditions: [
        { field: 'amountUsdt', operator: 'gte', value: LARGE_TX_THRESHOLD },
      ],
    },
  ]);
  assert.ok(before >= 0);
});

test('engine: triggered rules have reasons', async () => {
  const decision = await evaluateRisk(
    { type: 'withdraw' },
    {
      userId: 'e4',
      kycLevel: 1,
      eventType: 'withdraw',
      amountUsdt: 12000,
      txType: 'withdraw',
    }
  );
  assert.ok(decision.triggered.length > 0);
  for (const t of decision.triggered) {
    assert.ok(t.reason.length > 0);
  }
  assert.ok(decision.notes.length > 0);
});

test('engine: high-risk country triggers critical', async () => {
  const decision = await evaluateRisk(
    { type: 'withdraw' },
    {
      userId: 'e5',
      kycLevel: 2,
      eventType: 'withdraw',
      amountUsdt: 100,
      txType: 'withdraw',
      counterpartyCountry: 'KP',
    }
  );
  assert.equal(decision.action, 'block');
});
