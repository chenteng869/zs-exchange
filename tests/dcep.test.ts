/**
 * 数字人民币（DCEP / e-CNY）模块测试
 *
 * 覆盖 17 个核心场景：
 *  1.  DcepWalletService createWallet
 *  2.  DcepWalletService activateWallet
 *  3.  DcepWalletService freezeWallet
 *  4.  DcepWalletService checkLimit
 *  5.  DcepWalletService consumeLimit
 *  6.  DcepKycService verifyLightKyc
 *  7.  DcepKycService verifyFullKyc
 *  8.  DcepKycService verifyEnhancedKyc
 *  9.  DcepKycService isKycValid
 * 10.  DcepPaymentGateway submitTransaction
 * 11.  DcepPaymentGateway queryTransaction
 * 12.  DcepEngine getQuote
 * 13.  DcepEngine deposit 完整流程
 * 14.  DcepEngine withdraw 完整流程
 * 15.  DcepEngine 限额检查
 * 16.  DcepEngine complianceCheck
 * 17.  DcepEngine 报表
 *
 * 运行：npx tsx --test tests/dcep.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  // types / 常量
  DCEP_EXCHANGE_RATE_DEFAULT,
  DCEP_KYC_LIMITS,
  DCEP_KYC_VALIDITY_DAYS,
  DCEP_MIN_AMOUNT,
  DCEP_QUOTE_TTL_MS,
  DCEP_REPORT_RETENTION_DAYS,
  DCEP_SUPPORTED_BANKS,
  DcepError,
  DcepKycError,
  DcepLimitError,
  DcepAmlError,
  addAmount,
  // wallet
  DcepWalletService,
  createDcepWalletService,
  // kyc
  DcepKycService,
  createDcepKycService,
  // gateway
  DcepPaymentGateway,
  createDcepPaymentGateway,
  // engine
  DcepEngine,
  createDcepEngine,
  type KycLevel,
} from '../src/lib/dcep';

// =============================================================================
// 工具
// =============================================================================

function makeUser(seed = 1): string {
  return `user-dcep-${seed}`;
}

/** 给定 DcepEngine，给 user 创建 active 钱包 + 实名 KYC */
async function bootstrap(
  engine: DcepEngine,
  userId: string,
  kycLevel: KycLevel = 2,
): Promise<void> {
  // KYC
  engine.getKycService().seed(userId, kycLevel);
  // Wallet
  const w = engine.getWalletService().createWallet(userId, kycLevel);
  engine.getWalletService().activateWallet(w.id, '123456');
  // 给 withdraw 准备余额
  if (kycLevel >= 2) {
    // 用 deposit 充一些 USDT
    await engine.deposit(userId, { amount: '5000' });
    // 再 withdraw 一部分
    await engine.withdraw(userId, {
      amount: '1000',
      bankName: '工商银行',
      bankAccount: '6222021234567890123',
    });
  }
}

// =============================================================================
// 1. DcepWalletService createWallet
// =============================================================================

test('1. DcepWalletService createWallet', () => {
  const svc = createDcepWalletService();
  const w = svc.createWallet('user-1', 2);
  assert.equal(w.userId, 'user-1');
  assert.equal(w.kycLevel, 2);
  assert.equal(w.status, 'pending');
  assert.equal(w.dailyLimit, '200000');
  assert.equal(w.yearlyLimit, '1000000');
  assert.ok(w.walletId.startsWith('dcepw-'));
  assert.ok(w.publicKey.startsWith('04'));
  // 同一用户不能重复创建
  assert.throws(() => svc.createWallet('user-1', 2), /already has/);
});

// =============================================================================
// 2. DcepWalletService activateWallet
// =============================================================================

test('2. DcepWalletService activateWallet', () => {
  const svc = createDcepWalletService();
  const w = svc.createWallet('user-2', 2);
  // 错误短信码
  assert.throws(() => svc.activateWallet(w.id, '000000'), /SMS code/);
  // 正确短信码
  const activated = svc.activateWallet(w.id, '123456');
  assert.equal(activated.status, 'active');
  assert.ok(activated.activatedAt);
});

// =============================================================================
// 3. DcepWalletService freezeWallet
// =============================================================================

test('3. DcepWalletService freezeWallet', () => {
  const svc = createDcepWalletService();
  const w = svc.createWallet('user-3', 2);
  svc.activateWallet(w.id, '123456');
  const frozen = svc.freezeWallet(w.id, 'AML 怀疑');
  assert.equal(frozen.status, 'frozen');
  // 冻结后无法激活
  assert.throws(() => svc.activateWallet(w.id, '123456'), /frozen/);
});

// =============================================================================
// 4. DcepWalletService checkLimit
// =============================================================================

test('4. DcepWalletService checkLimit', () => {
  const svc = createDcepWalletService();
  // 匿名：不能交易
  svc.createWallet('user-anon', 0);
  const r0 = svc.checkLimit('user-anon', '100');
  assert.equal(r0.passed, false);
  // 弱实名 1000 / 笔
  svc.createWallet('user-light', 1);
  const r1 = svc.checkLimit('user-light', '1000');
  assert.equal(r1.passed, true);
  const r1b = svc.checkLimit('user-light', '1001');
  assert.equal(r1b.passed, false);
  // 实名 50000 / 笔
  svc.createWallet('user-full', 2);
  const r2 = svc.checkLimit('user-full', '50000');
  assert.equal(r2.passed, true);
  const r2b = svc.checkLimit('user-full', '50001');
  assert.equal(r2b.passed, false);
  // 强实名：unlimited
  svc.createWallet('user-enh', 3);
  const r3 = svc.checkLimit('user-enh', '99999999');
  assert.equal(r3.passed, true);
});

// =============================================================================
// 5. DcepWalletService consumeLimit
// =============================================================================

test('5. DcepWalletService consumeLimit', () => {
  const svc = createDcepWalletService();
  svc.createWallet('user-5', 1); // 弱实名 日 5000
  svc.consumeLimit('user-5', '1000');
  // 注：getLimits 返回各等级限额，不返回已用额；改用 wallet 读
  const w = svc.getUserWallet('user-5');
  assert.equal(w?.dailyUsed, '1000.00');
  assert.equal(w?.yearlyUsed, '1000.00');
  svc.consumeLimit('user-5', '4000');
  const w2 = svc.getUserWallet('user-5');
  assert.equal(w2?.dailyUsed, '5000.00');
  // 超过日累计：被拒
  const r = svc.checkLimit('user-5', '1');
  assert.equal(r.passed, false);
  // 重置日
  svc.resetDailyLimits();
  const r2 = svc.checkLimit('user-5', '1');
  assert.equal(r2.passed, true);
});

// =============================================================================
// 6. DcepKycService verifyLightKyc
// =============================================================================

test('6. DcepKycService verifyLightKyc', async () => {
  const svc = createDcepKycService();
  // 错误手机号
  await assert.rejects(() => svc.verifyLightKyc('123', '123456'), DcepKycError);
  // 错误短信码
  await assert.rejects(() => svc.verifyLightKyc('13800000000', '000000'), DcepKycError);
  // 成功
  const r = await svc.verifyLightKyc('13800000000', '123456');
  assert.equal(r.verified, true);
  assert.equal(r.level, 1);
});

// =============================================================================
// 7. DcepKycService verifyFullKyc
// =============================================================================

test('7. DcepKycService verifyFullKyc', async () => {
  const svc = createDcepKycService();
  // 错误姓名
  await assert.rejects(() => svc.verifyFullKyc({
    userId: 'u-7',
    realName: 'A',
    idType: '身份证',
    idNumber: 'test-110101199001011234',
  }), DcepKycError);
  // 非 test- 前缀
  await assert.rejects(() => svc.verifyFullKyc({
    userId: 'u-7',
    realName: '张三',
    idType: '身份证',
    idNumber: '110101199001011234',
  }), DcepKycError);
  // 成功
  const r = await svc.verifyFullKyc({
    userId: 'u-7',
    realName: '张三',
    idType: '身份证',
    idNumber: 'test-110101199001011234',
  });
  assert.equal(r.verified, true);
  assert.equal(r.level, 2);
});

// =============================================================================
// 8. DcepKycService verifyEnhancedKyc
// =============================================================================

test('8. DcepKycService verifyEnhancedKyc', async () => {
  const svc = createDcepKycService();
  // 缺银行
  await assert.rejects(() => svc.verifyEnhancedKyc({
    userId: 'u-8',
    realName: '张三',
    idType: '身份证',
    idNumber: 'test-110101199001011234',
    bankName: '',
    bankAccount: '',
    livenessImg: 'img-data',
  }), DcepKycError);
  // 缺活体
  await assert.rejects(() => svc.verifyEnhancedKyc({
    userId: 'u-8',
    realName: '张三',
    idType: '身份证',
    idNumber: 'test-110101199001011234',
    bankName: '工商银行',
    bankAccount: '123',
    livenessImg: '',
  }), DcepKycError);
  // 成功
  const r = await svc.verifyEnhancedKyc({
    userId: 'u-8',
    realName: '张三',
    idType: '身份证',
    idNumber: 'test-110101199001011234',
    bankName: '工商银行',
    bankAccount: '6222021234567890123',
    livenessImg: 'img-data-fake',
  });
  assert.equal(r.verified, true);
  assert.equal(r.level, 3);
});

// =============================================================================
// 9. DcepKycService isKycValid
// =============================================================================

test('9. DcepKycService isKycValid', async () => {
  const svc = createDcepKycService();
  assert.equal(svc.isKycValid('u-9'), false);
  svc.seed('u-9', 2);
  assert.equal(svc.isKycValid('u-9'), true);
  // 续期
  const renewed = await svc.renewKyc('u-9');
  assert.equal(svc.isKycValid('u-9'), true);
  assert.ok(renewed.verifiedAt);
});

// =============================================================================
// 10. DcepPaymentGateway submitTransaction
// =============================================================================

test('10. DcepPaymentGateway submitTransaction', async () => {
  const gw = createDcepPaymentGateway();
  const r = await gw.submitTransaction({
    walletId: 'dcepw-abc',
    amount: '100',
    direction: 'deposit',
    reference: 'ref-001',
  });
  assert.ok(r.centralTxId.startsWith('dcepcn-'));
  assert.equal(r.status, 'submitted');
  // 错误 amount
  await assert.rejects(
    () => gw.submitTransaction({ walletId: 'w', amount: '0', direction: 'deposit', reference: 'r' }),
    DcepError,
  );
});

// =============================================================================
// 11. DcepPaymentGateway queryTransaction
// =============================================================================

test('11. DcepPaymentGateway queryTransaction', async () => {
  const gw = createDcepPaymentGateway();
  const sub = await gw.submitTransaction({
    walletId: 'w-q',
    amount: '500',
    direction: 'deposit',
    reference: 'ref-q',
  });
  const q = await gw.queryTransaction(sub.centralTxId);
  assert.equal(q.amount, '500');
  assert.equal(q.status, 'confirmed');
  // 未找到
  const q2 = await gw.queryTransaction('dcepcn-zzzz');
  assert.equal(q2.status, 'rejected');
  // 签名校验
  const sig = gw.sign('payload-xyz');
  assert.equal(gw.verifySignature('payload-xyz', sig), true);
  assert.equal(gw.verifySignature('payload-xyz', 'wrong'), false);
});

// =============================================================================
// 12. DcepEngine getQuote
// =============================================================================

test('12. DcepEngine getQuote', async () => {
  const engine = createDcepEngine();
  const q = await engine.getQuote('1000', 'USDT');
  assert.equal(q.dcepAmount, '1000');
  assert.ok(Number(q.cryptoAmount) > 0);
  assert.equal(q.exchangeRate, DCEP_EXCHANGE_RATE_DEFAULT);
  assert.ok(q.expiresAt - q.createdAt === DCEP_QUOTE_TTL_MS);
  // 不支持的资产
  await assert.rejects(() => engine.getQuote('1000', 'BTC'), DcepError);
  // 金额过小
  await assert.rejects(() => engine.getQuote('0.001', 'USDT'), DcepError);
});

// =============================================================================
// 13. DcepEngine deposit 完整流程
// =============================================================================

test('13. DcepEngine deposit 完整流程', async () => {
  const engine = createDcepEngine();
  const userId = makeUser(13);
  await bootstrap(engine, userId, 2);

  const tx = await engine.deposit(userId, {
    amount: '1000',
    bankName: '工商银行',
    bankAccount: '6222021234567890123',
  });
  assert.equal(tx.status, 'completed');
  assert.equal(tx.direction, 'deposit');
  assert.ok(tx.centralTxId);
  assert.ok(Number(tx.cryptoAmount) > 0);
  assert.equal(tx.kycChecked, true);
  assert.equal(tx.amlChecked, true);
  assert.ok(engine.getUsdtBalance(userId));
  // 查询
  const t2 = engine.getTransaction(tx.id);
  assert.equal(t2?.id, tx.id);
  const list = engine.getUserTransactions(userId);
  assert.ok(list.find((t) => t.id === tx.id));
});

// =============================================================================
// 14. DcepEngine withdraw 完整流程
// =============================================================================

test('14. DcepEngine withdraw 完整流程', async () => {
  const engine = createDcepEngine();
  const userId = makeUser(14);
  // KYC + 钱包
  engine.getKycService().seed(userId, 2);
  const w = engine.getWalletService().createWallet(userId, 2);
  engine.getWalletService().activateWallet(w.id, '123456');
  // 充 USDT
  await engine.deposit(userId, { amount: '5000' });
  const balanceBefore = engine.getUsdtBalance(userId);
  assert.ok(Number(balanceBefore) > 0);

  // 出金
  const tx = await engine.withdraw(userId, {
    amount: '2000',
    bankName: '建设银行',
    bankAccount: '6227001234567890123',
  });
  assert.equal(tx.status, 'completed');
  assert.equal(tx.direction, 'withdraw');
  assert.equal(tx.bankName, '建设银行');
  assert.ok(tx.centralTxId);
  // 余额已扣
  const balanceAfter = engine.getUsdtBalance(userId);
  assert.ok(Number(balanceAfter) < Number(balanceBefore));
  // 银行不支持
  await assert.rejects(() => engine.withdraw(userId, {
    amount: '100',
    bankName: '某某银行' as any,
    bankAccount: '123',
  }), DcepError);
});

// =============================================================================
// 15. DcepEngine 限额检查
// =============================================================================

test('15. DcepEngine 限额检查', async () => {
  const engine = createDcepEngine();
  const userId = makeUser(15);
  await bootstrap(engine, userId, 1); // 弱实名 1000/笔
  // 超过单笔：失败
  await assert.rejects(
    () => engine.deposit(userId, { amount: '1001' }),
    DcepLimitError,
  );
  // 单笔内：成功
  const tx = await engine.deposit(userId, { amount: '500' });
  assert.equal(tx.status, 'completed');
  // KYC 缺失：失败
  const userNoKyc = makeUser(15) + '-nokyc';
  engine.getKycService(); // 引用
  engine.getWalletService().createWallet(userNoKyc, 1);
  // 没 KYC 不能 deposit
  await assert.rejects(
    () => engine.deposit(userNoKyc, { amount: '100' }),
    DcepKycError,
  );
});

// =============================================================================
// 16. DcepEngine complianceCheck
// =============================================================================

test('16. DcepEngine complianceCheck', async () => {
  const engine = createDcepEngine();
  const userId = makeUser(16);
  await bootstrap(engine, userId, 2);
  const tx = await engine.deposit(userId, { amount: '200' });
  const r = await engine.complianceCheck(tx.id);
  assert.equal(r.passed, true);
  assert.equal(r.violations.length, 0);
  // 不存在
  const r2 = await engine.complianceCheck('not-exist');
  assert.equal(r2.passed, false);
  assert.ok(r2.violations.length > 0);
});

// =============================================================================
// 17. DcepEngine 报表
// =============================================================================

test('17. DcepEngine 报表', async () => {
  const engine = createDcepEngine();
  const u1 = makeUser(17) + '-a';
  const u2 = makeUser(17) + '-b';
  await bootstrap(engine, u1, 2);
  await bootstrap(engine, u2, 2);
  await engine.deposit(u1, { amount: '100' });
  await engine.deposit(u2, { amount: '200' });
  // 使用北京时间（UTC+8）作为报表日期，与 getDailyReport 内部一致
  const nowBj = new Date(Date.now() + 8 * 3600_000);
  const today = nowBj.toISOString().slice(0, 10); // YYYY-MM-DD（北京时间）
  const daily = await engine.getDailyReport(today);
  assert.equal(daily.period, 'daily');
  assert.ok(daily.transactionCount >= 2, `expected >=2, got ${daily.transactionCount}`);
  const monthly = await engine.getMonthlyReport(today.slice(0, 7));
  assert.equal(monthly.period, 'monthly');
  assert.ok(monthly.transactionCount >= daily.transactionCount);
  // 7 年保留
  const daysLeft = (monthly.retainedUntil - Date.now()) / (24 * 3600_000);
  assert.ok(daysLeft >= DCEP_REPORT_RETENTION_DAYS - 5);
});

// =============================================================================
// 额外校验：常量
// =============================================================================

test('常量 / 工具', () => {
  assert.equal(DCEP_EXCHANGE_RATE_DEFAULT, '1');
  assert.equal(DCEP_MIN_AMOUNT, '0.01');
  assert.equal(DCEP_QUOTE_TTL_MS, 60_000);
  assert.equal(DCEP_KYC_VALIDITY_DAYS, 730);
  assert.equal(DCEP_REPORT_RETENTION_DAYS, 2555);
  assert.deepEqual(DCEP_KYC_LIMITS[0], { single: '0', daily: '0', yearly: '0' });
  assert.equal(DCEP_SUPPORTED_BANKS.length, 7);
  assert.equal(addAmount('1.5', '2.3'), '3.80');
});
