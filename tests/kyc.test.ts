/**
 * KYC 模块单元测试
 *
 * 覆盖：
 *  - 身份证校验码（GB 11643-1999）
 *  - 手机号校验（CN + 国际）
 *  - 银行卡 Luhn
 *  - KYC 等级提交流程（含自动审核）
 *
 * 运行：node --import tsx tests/kyc.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  verifyChineseIdCard,
  computeIdCardCheckCode,
  extractIdCardInfo,
  verifyPhone,
  detectChinaCarrier,
  verifyEmail,
  luhnCheck,
  verifyBankCard,
  detectCardBrand,
  calculateAge,
  verifyAge,
  validateKycData,
} from '../src/lib/kyc/verifier';
import { KYC_LIMITS, getKycLimit, diffKycLimit } from '../src/lib/kyc/limits';
import {
  submitKyc,
  approveKyc,
  rejectKyc,
  getKycSubmission,
  listUserSubmissions,
  _resetKycStore,
} from '../src/lib/kyc/workflow';
import { KycError } from '../src/lib/auth/errors';

// ---------------------------------------------------------------------------
// 身份证
// ---------------------------------------------------------------------------

test('idcard: valid 18-digit id passes', () => {
  // 11010519491231002X 前 17 位 = 11010519491231002
  // 校验和 = 167, 167 % 11 = 2, checkCodes[2] = 'X'
  assert.equal(verifyChineseIdCard('11010519491231002X'), true);
});

test('idcard: invalid format throws', () => {
  assert.throws(() => verifyChineseIdCard('12345'), KycError);
  assert.throws(() => verifyChineseIdCard('12345678901234567X'), KycError);
});

test('idcard: wrong check digit throws', () => {
  // 11010519491231002 真实校验位是 X，不是 1
  assert.throws(() => verifyChineseIdCard('110105194912310021'), KycError);
});

test('idcard: compute check code', () => {
  // 前 17 位 11010519491231002 的校验位 = X
  assert.equal(computeIdCardCheckCode('11010519491231002'), 'X');
  // 另一个有效示例：前 17 位 11010119900307311X (但需要 17 位)
  // 简化：11010119900307311 → sum = ?
  // weights: 7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2
  // digits:  1,1,0,1,0,1,1,9,9,0,0,3,0,7,3,1,1
  // sum = 7+9+0+5+0+4+2+9+54+0+0+27+0+35+24+4+2 = 182
  // 182 % 11 = 6 → checkCodes[6] = '6'
  assert.equal(computeIdCardCheckCode('11010119900307311'), '6');
});

test('idcard: extract info (birth, gender)', () => {
  const info = extractIdCardInfo('11010519491231002X');
  assert.equal(info.birthDate, '1949-12-31');
  // 第 17 位 2（偶数 → 女）
  assert.equal(info.gender, 'F');
  assert.equal(info.region, '110105');
  assert.ok(info.age >= 70);
});

// ---------------------------------------------------------------------------
// 手机号
// ---------------------------------------------------------------------------

test('phone: chinese mobile numbers', () => {
  assert.equal(verifyPhone('13800138000'), true);
  assert.equal(verifyPhone('138-0013-8000'), true); // 兼容分隔符
  assert.equal(verifyPhone('+8613800138000'), true);
});

test('phone: invalid number throws', () => {
  assert.throws(() => verifyPhone('12345'), KycError);
  assert.throws(() => verifyPhone('23800138000'), KycError); // 非法前缀
});

test('phone: detect carrier', () => {
  assert.equal(detectChinaCarrier('13800138000'), 'mobile');
  assert.equal(detectChinaCarrier('13012345678'), 'unicom');
  assert.equal(detectChinaCarrier('13312345678'), 'telecom');
  assert.equal(detectChinaCarrier('99999999'), 'unknown');
});

// ---------------------------------------------------------------------------
// 邮箱
// ---------------------------------------------------------------------------

test('email: standard addresses', () => {
  assert.equal(verifyEmail('user@example.com'), true);
  assert.equal(verifyEmail('user.name+tag@sub.example.co.uk'), true);
});

test('email: invalid addresses', () => {
  assert.throws(() => verifyEmail(''), KycError);
  assert.throws(() => verifyEmail('plainstring'), KycError);
  assert.throws(() => verifyEmail('@example.com'), KycError);
  assert.throws(() => verifyEmail('user@'), KycError);
});

// ---------------------------------------------------------------------------
// 银行卡 Luhn
// ---------------------------------------------------------------------------

test('luhn: known valid numbers', () => {
  // 测试卡号（Visa / MasterCard 测试段）
  assert.equal(luhnCheck('4111111111111111'), true); // Visa test
  assert.equal(luhnCheck('5555555555554444'), true); // MC test
  assert.equal(luhnCheck('378282246310005'), true); // Amex test
});

test('luhn: invalid numbers', () => {
  assert.equal(luhnCheck('4111111111111112'), false);
  assert.equal(luhnCheck('1234567890'), false);
  assert.equal(luhnCheck(''), false);
});

test('bankcard: verify and detect brand', () => {
  assert.equal(verifyBankCard('4111111111111111'), true);
  assert.equal(detectCardBrand('4111111111111111'), 'visa');
  assert.equal(detectCardBrand('5555555555554444'), 'mastercard');
  assert.equal(detectCardBrand('378282246310005'), 'amex');
  assert.equal(detectCardBrand('6222021234567890123'), 'unionpay');
});

// ---------------------------------------------------------------------------
// 年龄
// ---------------------------------------------------------------------------

test('age: calculate from DOB', () => {
  const today = new Date();
  const twentyYearsAgo = new Date(today.getUTCFullYear() - 20, 0, 1);
  const iso = twentyYearsAgo.toISOString().substring(0, 10);
  const age = calculateAge(iso);
  assert.ok(age >= 19 && age <= 20);
});

test('age: rejects under 18', () => {
  const today = new Date();
  const tenYearsAgo = new Date(today.getUTCFullYear() - 10, 0, 1);
  const iso = tenYearsAgo.toISOString().substring(0, 10);
  assert.throws(() => verifyAge(iso, 18), KycError);
});

// ---------------------------------------------------------------------------
// 综合校验
// ---------------------------------------------------------------------------

test('validate: all fields pass', () => {
  assert.equal(
    validateKycData({
      fullName: '张三',
      idType: 'id_card',
      idNumber: '11010519491231002X',
      dateOfBirth: '1949-12-31',
      email: 'user@example.com',
      phone: '13800138000',
      bankCard: '4111111111111111',
    }),
    true
  );
});

test('validate: invalid idNumber fails', () => {
  assert.throws(
    () =>
      validateKycData({
        fullName: '张三',
        idType: 'id_card',
        idNumber: '110105194912310029',
      }),
    KycError
  );
});

// ---------------------------------------------------------------------------
// 限额
// ---------------------------------------------------------------------------

test('limits: L0 has no permissions', () => {
  const l0 = getKycLimit(0);
  assert.equal(l0.futuresEnabled, false);
  assert.equal(l0.marginEnabled, false);
  assert.equal(l0.dailyDepositUsdt, '0');
});

test('limits: L2 enables futures and margin', () => {
  const l2 = getKycLimit(2);
  assert.equal(l2.futuresEnabled, true);
  assert.equal(l2.marginEnabled, true);
  assert.equal(Number(l2.dailyWithdrawUsdt), 100000);
});

test('limits: diff shows upgrade benefits', () => {
  const diff = diffKycLimit(1, 2);
  assert.ok(diff !== null);
  assert.ok(diff!.newFeatures.includes('合约交易'));
  assert.ok(diff!.newFeatures.includes('杠杆交易'));
  assert.equal(Number(diff!.level), 2);
});

// ---------------------------------------------------------------------------
// 工作流
// ---------------------------------------------------------------------------

test('workflow: L1 auto-approves when verified', () => {
  _resetKycStore();
  const s = submitKyc({
    user: {
      id: 'u1',
      email: 'u1@e.com',
      phone: '13800138000',
      emailVerified: true,
      phoneVerified: true,
    },
    level: 1,
    data: {
      fullName: 'Test User',
      idType: 'id_card',
      idNumber: '11010519491231002X',
      dateOfBirth: '1990-01-01',
      nationality: 'CN',
      address: 'Beijing',
      city: 'Beijing',
      postalCode: '100000',
      idFrontUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    },
  });
  assert.equal(s.status, 'approved');
  assert.equal(s.reviewedBy, 'system');
});

test('workflow: L1 stays pending when not verified', () => {
  _resetKycStore();
  const s = submitKyc({
    user: {
      id: 'u2',
      email: 'u2@e.com',
      emailVerified: false,
      phoneVerified: true,
    },
    level: 1,
    data: {
      fullName: 'Test User',
      idType: 'id_card',
      idNumber: '11010519491231002X',
      dateOfBirth: '1990-01-01',
      nationality: 'CN',
      address: 'Beijing',
      city: 'Beijing',
      postalCode: '100000',
      idFrontUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    },
  });
  assert.equal(s.status, 'pending');
});

test('workflow: L2 manual approval', () => {
  _resetKycStore();
  const s = submitKyc({
    user: {
      id: 'u3',
      email: 'u3@e.com',
      emailVerified: true,
      phoneVerified: true,
    },
    level: 2,
    data: {
      fullName: 'Test User',
      idType: 'id_card',
      idNumber: '110105199001010010',
      dateOfBirth: '1990-01-01',
      nationality: 'CN',
      address: 'Shanghai',
      city: 'Shanghai',
      postalCode: '200000',
      idFrontUrl: 'https://example.com/front.jpg',
      idBackUrl: 'https://example.com/back.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    },
  });
  assert.equal(s.status, 'pending');
  const approved = approveKyc(s.id, 'reviewer_001');
  assert.equal(approved.status, 'approved');
  assert.equal(approved.reviewedBy, 'reviewer_001');
});

test('workflow: L3 requires 3 approvals', () => {
  _resetKycStore();
  const s = submitKyc({
    user: {
      id: 'u4',
      email: 'u4@e.com',
      emailVerified: true,
      phoneVerified: true,
    },
    level: 3,
    data: {
      fullName: 'Test Company',
      idType: 'passport',
      idNumber: 'P12345678',
      dateOfBirth: '1980-01-01',
      nationality: 'CN',
      address: 'Shenzhen',
      city: 'Shenzhen',
      postalCode: '518000',
      idFrontUrl: 'https://example.com/front.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    },
  });
  approveKyc(s.id, 'r1');
  let state = getKycSubmission(s.id);
  assert.equal(state?.status, 'pending');
  approveKyc(s.id, 'r2');
  state = getKycSubmission(s.id);
  assert.equal(state?.status, 'pending');
  approveKyc(s.id, 'r3');
  state = getKycSubmission(s.id);
  assert.equal(state?.status, 'approved');
  assert.equal(state?.approvers.length, 3);
});

test('workflow: reject requires reason', () => {
  _resetKycStore();
  // 直接使用 L2 申请（不自动通过）
  const s = submitKyc({
    user: {
      id: 'u5',
      email: 'u5@e.com',
      emailVerified: true,
      phoneVerified: true,
    },
    level: 2,
    data: {
      fullName: 'Test User',
      idType: 'id_card',
      idNumber: '110105199001010010',
      dateOfBirth: '1990-01-01',
      nationality: 'CN',
      address: 'Beijing',
      city: 'Beijing',
      postalCode: '100000',
      idFrontUrl: 'https://example.com/front.jpg',
      idBackUrl: 'https://example.com/back.jpg',
      selfieUrl: 'https://example.com/selfie.jpg',
    },
  });
  assert.equal(s.status, 'pending');
  assert.throws(() => rejectKyc(s.id, 'r1', ''), KycError);
  const rejected = rejectKyc(s.id, 'r1', '证件模糊');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectReason, '证件模糊');
});

test('workflow: list user submissions', () => {
  _resetKycStore();
  const s1 = submitKyc({
    user: { id: 'u6', email: 'u6@e.com', emailVerified: true, phoneVerified: true },
    level: 1,
    data: {
      fullName: 'Test User',
      idType: 'id_card',
      idNumber: '110105199001010010',
      dateOfBirth: '1990-01-01',
      nationality: 'CN',
      address: 'X',
      city: 'X',
      postalCode: '100000',
      idFrontUrl: 'a',
      selfieUrl: 'b',
    },
  });
  const list = listUserSubmissions('u6');
  assert.equal(list.length, 1);
  assert.equal(list[0].id, s1.id);
});
