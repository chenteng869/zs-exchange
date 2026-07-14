/**
 * FJN 模块冒烟测试
 * 验证 constants / decimal / types / errors 基础功能
 */
import {
  FjnDecimal,
  calculateWine369Revenue,
  calculateReferralReward,
  calculateTeamRewards,
  calculateNodeRewards,
  calculateTPointsConversion,
  FjnBusinessNoGenerator,
  createStateMachine,
  FjnError,
  FjnValidationError,
  FJN_ORDER_STATUS,
  FJN_ORDER_STATUS_FLOW,
  FJN_DEFAULT_REVENUE_RATIOS,
} from '../src/lib/fjn';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, info?: any) {
  if (cond) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}`, info ?? ''); fail++; }
}

console.log('=== FJN 冒烟测试 ===\n');

console.log('[1] Decimal 工具');
assert('add: 100 + 0.40 = 100.4', FjnDecimal.toFixed(FjnDecimal.add('100', '0.40')) === '100.400000000000000000');
assert('sub: 369 - 36.9 = 332.1', FjnDecimal.toFixed(FjnDecimal.sub('369', '36.9')) === '332.100000000000000000');
assert('mul: 369 * 0.4 = 147.6', FjnDecimal.toFixed(FjnDecimal.mul('369', '0.4')) === '147.600000000000000000');
assert('div: 369 / 3 = 123', FjnDecimal.toFixed(FjnDecimal.div('369', '3')) === '123.000000000000000000');
assert('eq: 100 == 100', FjnDecimal.eq('100', '100'));
assert('gt: 100 > 50', FjnDecimal.gt('100', '50'));
assert('isZero: 0', FjnDecimal.isZero('0'));
assert('isPositive: 100', FjnDecimal.isPositive('100'));
assert('fromPercent: 10% = 0.1', FjnDecimal.toFixed(FjnDecimal.fromPercent('10')) === '0.100000000000000000');
assert('round: 0.5 (银行家舍入) -> 0', FjnDecimal.round('0.5', 0).toString() === '0');
assert('round: 1.5 (银行家舍入) -> 2', FjnDecimal.round('1.5', 0).toString() === '2');
assert('round: 2.5 (银行家舍入) -> 2', FjnDecimal.round('2.5', 0).toString() === '2');

console.log('\n[2] 369 分账计算（H6 标准 40/30/30）');
const rev = calculateWine369Revenue({ paidAmount: '369', currency: 'USD', ruleVersion: 'v1.0' });
assert('paidAmount = 369', rev.paidAmount === '369.000000000000000000');
assert('netAmount = 369', rev.netAmount === '369.000000000000000000');
assert('wineCostPool = 147.6', rev.wineCostPool === '147.600000000000000000');
assert('marketEcosystemPool = 110.7', rev.marketEcosystemPool === '110.700000000000000000');
assert('companyPool = 110.7', rev.companyPool === '110.700000000000000000');

const rev2 = calculateWine369Revenue({ paidAmount: '369', taxAmount: '36.9', currency: 'USD', ruleVersion: 'v1.0' });
assert('扣税后 netAmount = 332.1', rev2.netAmount === '332.100000000000000000');
assert('扣税后 wineCostPool = 132.84', rev2.wineCostPool === '132.840000000000000000');

console.log('\n[3] 推荐奖励（10%）');
const ref = calculateReferralReward({ paidAmount: '369' });
assert('reward = 36.9', ref.reward === '36.900000000000000000');

console.log('\n[4] 团队奖励（5/3/2）');
const team = calculateTeamRewards('369');
assert('team.l1 = 18.45', team.l1 === '18.450000000000000000');
assert('team.l2 = 11.07', team.l2 === '11.070000000000000000');
assert('team.l3 = 7.38', team.l3 === '7.380000000000000000');

console.log('\n[5] 节点奖励（3/3/2/2）');
const node = calculateNodeRewards('369');
assert('node.city = 11.07', node.city === '11.070000000000000000');
assert('node.global = 7.38', node.global === '7.380000000000000000');

console.log('\n[6] tFJ369 转换（30% 销毁 + 5% 手续费）');
const conv = calculateTPointsConversion({ cfj369Amount: '100' });
assert('tFJ369Gross = 50', conv.tFJ369Gross === '50.000000000000000000');
assert('burnAmount = 15', conv.burnAmount === '15.000000000000000000');
assert('feeAmount = 2.5', conv.feeAmount === '2.500000000000000000');
assert('tFJ369Net = 32.5', conv.tFJ369Net === '32.500000000000000000');

console.log('\n[7] 业务编号生成器');
const orderNo = FjnBusinessNoGenerator.orderNo(1);
assert('orderNo 格式: ORD + yyyymmdd + 6位', /^ORD\d{14}$/.test(orderNo), orderNo);
const userNo = FjnBusinessNoGenerator.userNo(42);
assert('userNo 格式: USR + yyyymmdd + 6位', /^USR\d{14}$/.test(userNo), userNo);
const date = FjnBusinessNoGenerator.parseDate(orderNo);
assert('parseDate 提取日期成功', date !== null);

console.log('\n[8] 状态机');
const sm = createStateMachine({
  initial: FJN_ORDER_STATUS.DRAFT,
  transitions: FJN_ORDER_STATUS_FLOW,
});
assert('draft -> pending_payment 合法', sm.canTransition(FJN_ORDER_STATUS.DRAFT, FJN_ORDER_STATUS.PENDING_PAYMENT));
assert('draft -> paid 非法', !sm.canTransition(FJN_ORDER_STATUS.DRAFT, FJN_ORDER_STATUS.PAID));
assert('pending_payment -> paid 合法', sm.canTransition(FJN_ORDER_STATUS.PENDING_PAYMENT, FJN_ORDER_STATUS.PAID));
try {
  sm.assertTransition(FJN_ORDER_STATUS.DRAFT, FJN_ORDER_STATUS.PAID);
  assert('非法转移抛错', false);
} catch (e: any) {
  assert('非法转移抛错', e.code === 'FJN_STATE_MACHINE');
}

console.log('\n[9] 异常类');
try {
  throw new FjnValidationError('测试', { field: 'x' });
} catch (e: any) {
  assert('FjnValidationError code 正确', e.code === 'FJN_VALIDATION');
  assert('FjnValidationError httpStatus = 400', e.httpStatus === 400);
  assert('FjnValidationError 可序列化', e.toJSON().code === 'FJN_VALIDATION');
}

console.log('\n[10] 常量检查');
assert('默认分账比例 3 个', Object.keys(FJN_DEFAULT_REVENUE_RATIOS).length === 3);
assert('WINE_COST = 0.4', FJN_DEFAULT_REVENUE_RATIOS['wine_cost_pool'] === '0.400000000000000000');
assert('订单状态 11 个', Object.keys(FJN_ORDER_STATUS).length === 11);

console.log('\n========== 测试结果 ==========');
console.log(`✅ 通过: ${pass}`);
console.log(`❌ 失败: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
