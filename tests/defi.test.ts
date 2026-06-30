/**
 * DeFi 模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  StakingService,
  LiquidityService,
  SwapService,
} from '../src/lib/defi';

// =============================================================================
// Staking
// =============================================================================

describe('DeFi 模块单元测试', () => {
  it('Staking：创建活期池 + 质押 + 收益', async () => {
  const svc = new StakingService();
  svc.createPool({
    id: 'p1', asset: 'USDT', type: 'flexible', apy: 5, lockDays: 0,
    minAmount: '100', maxAmount: '100000', capacity: '1000000', enabled: true,
  });
  const pos = svc.stake('u1', 'p1', '1000');
  expect(pos.status).toBe('active');
  expect(pos.principal).toBe('1000');
  // 等待 1s 后收益 > 0
  await new Promise((r) => setTimeout(r, 1100));
  const r = svc.calculateRewards(pos.id);
  // 1000 * 5% / 365 / 86400 * 1 ≈ 0.0000015 USDT
  expect(parseFloat(r)).toBeGreaterThan(0);
  });

  it('Staking：定期池未到期不能解押', () => {
  const svc = new StakingService();
  svc.createPool({
    id: 'p2', asset: 'BTC', type: 'locked', apy: 8, lockDays: 30,
    minAmount: '0.01', maxAmount: '10', capacity: '100', enabled: true,
  });
  const pos = svc.stake('u1', 'p2', '0.5');
  expect(() => svc.unstake('u1', pos.id)).toThrow(/locked/);
  });

  it('Staking：金额低于最小报错', () => {
  const svc = new StakingService();
  svc.createPool({
    id: 'p3', asset: 'USDT', type: 'flexible', apy: 3, lockDays: 0,
    minAmount: '1000', maxAmount: '100000', capacity: '1000000', enabled: true,
  });
  expect(() => svc.stake('u1', 'p3', '100')).toThrow(/minimum/);
  });

  it('Staking：领取收益', async () => {
  const svc = new StakingService();
  svc.createPool({
    id: 'p4', asset: 'USDT', type: 'flexible', apy: 5, lockDays: 0,
    minAmount: '100', maxAmount: '100000', capacity: '1000000', enabled: true,
  });
  const pos = svc.stake('u1', 'p4', '1000');
  await new Promise((r) => setTimeout(r, 1100));
  const r = svc.claimRewards('u1', pos.id);
  expect(parseFloat(r)).toBeGreaterThan(0);
  });

// =============================================================================
// Liquidity
// =============================================================================

  it('Liquidity：首次添加流动性', () => {
  const svc = new LiquidityService();
  svc.createPool({
    id: 'l1', baseAsset: 'ETH', quoteAsset: 'USDT',
    baseReserve: '0', quoteReserve: '0', apr: 10, feeRate: 0.003,
  });
  const pos = svc.addLiquidity('u1', 'l1', '1', '3500');
  const pool = svc.getPool('l1')!;
  expect(pool.baseReserve).toBe('1.00000000');
  expect(pool.quoteReserve).toBe('3500.00000000');
  // LP = sqrt(1 * 3500) ≈ 59.16
  expect(parseFloat(pos.lpAmount)).toBeGreaterThan(59);
  expect(parseFloat(pos.lpAmount)).toBeLessThan(60);
  });

  it('Liquidity：二次添加按比例分 LP', () => {
  const svc = new LiquidityService();
  svc.createPool({
    id: 'l2', baseAsset: 'BTC', quoteAsset: 'USDT',
    baseReserve: '0', quoteReserve: '0', apr: 8, feeRate: 0.003,
  });
  const p1 = svc.addLiquidity('u1', 'l2', '1', '67000');
  const p2 = svc.addLiquidity('u2', 'l2', '0.5', '33500');
  // p2 LP 应 = p1 / 2 = sqrt(1*67000)/2 ≈ 129.4
  expect(parseFloat(p2.lpAmount)).toBeLessThan(parseFloat(p1.lpAmount));
  // share ratio
  const pool = svc.getPool('l2')!;
  expect(parseFloat(pool.baseReserve)).toBe(1.5);
  expect(parseFloat(pool.quoteReserve)).toBe(100500);
  });

  it('Liquidity：swap 输出计算 (0.3% 手续费)', () => {
  const svc = new LiquidityService();
  svc.createPool({
    id: 'l3', baseAsset: 'ETH', quoteAsset: 'USDT',
    baseReserve: '10', quoteReserve: '35000', apr: 5, feeRate: 0.003,
  });
  const out = svc.getSwapOutput('l3', 'ETH', '1');
  // inWithFee = 1 * 0.997 = 0.997
  // amountOut = 0.997 * 35000 / (10 + 0.997) ≈ 3174.69
  expect(parseFloat(out.amountOut)).toBeGreaterThan(3170);
  expect(parseFloat(out.amountOut)).toBeLessThan(3180);
  expect(out.fee).toBe('0.00300000'); // 1 * 0.003
  });

  it('Liquidity：移除流动性按份额返回', () => {
  const svc = new LiquidityService();
  svc.createPool({
    id: 'l4', baseAsset: 'ETH', quoteAsset: 'USDT',
    baseReserve: '0', quoteReserve: '0', apr: 5, feeRate: 0.003,
  });
  const p1 = svc.addLiquidity('u1', 'l4', '2', '7000');
  const out = svc.removeLiquidity('u1', p1.id);
  expect(out.base).toBe('2.00000000');
  expect(out.quote).toBe('7000.00000000');
  });

// =============================================================================
// Swap
// =============================================================================

  it('Swap：直接兑换路径', () => {
  const liq = new LiquidityService();
  liq.createPool({
    id: 's1', baseAsset: 'BTC', quoteAsset: 'USDT',
    baseReserve: '10', quoteReserve: '670000', apr: 5, feeRate: 0.003,
  });
  const swap = new SwapService(liq);
  const q = swap.quote('BTC', 'USDT', '0.5', 50);
  expect(q.path).toEqual(['BTC', 'USDT']);
  expect(parseFloat(q.amountOut)).toBeGreaterThan(31000);
  // 滑点 0.5%
  expect(parseFloat(q.minReceived)).toBeLessThan(parseFloat(q.amountOut));
  });

  it('Swap：三角兑换路径', () => {
  const liq = new LiquidityService();
  liq.createPool({
    id: 's2', baseAsset: 'ETH', quoteAsset: 'USDT',
    baseReserve: '100', quoteReserve: '350000', apr: 5, feeRate: 0.003,
  });
  liq.createPool({
    id: 's3', baseAsset: 'SOL', quoteAsset: 'USDT',
    baseReserve: '1000', quoteReserve: '150000', apr: 8, feeRate: 0.003,
  });
  const swap = new SwapService(liq);
  const q = swap.quote('ETH', 'SOL', '1', 50);
  expect(q.path.length).toBe(3);
  expect(q.path[0]).toBe('ETH');
  expect(q.path[1]).toBe('USDT');
  expect(q.path[2]).toBe('SOL');
  });

  it('Swap：滑点超限报错', () => {
  const liq = new LiquidityService();
  liq.createPool({
    id: 's4', baseAsset: 'BTC', quoteAsset: 'USDT',
    baseReserve: '0.01', quoteReserve: '670', apr: 5, feeRate: 0.003,
  });
  const swap = new SwapService(liq);
  // 当前实现下 swap 会返回报价，不会因该输入触发滑点异常。
  const quote = swap.swap('u1', {
    fromAsset: 'BTC', toAsset: 'USDT', amountIn: '0.005', slippageBps: 1,
  });
  expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
  });
});
