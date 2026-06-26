/**
 * KYC 数据验证器
 *
 * 包含：
 *  - 中国大陆 18 位身份证校验码（GB 11643-1999）
 *  - 国际手机号（E.164）
 *  - 邮箱（RFC 5322 简化版）
 *  - 银行卡 Luhn 校验
 *  - 年龄计算（≥ 18）
 *  - 姓名/地址规范化
 *
 * @module lib/kyc/verifier
 */

import { KycError } from '@/lib/auth/errors';

// ============================================================================
// 身份证（中国大陆 18 位）— GB 11643-1999
// ============================================================================

/**
 * 加权因子
 */
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];

/** 校验码对照表 */
const ID_CARD_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * 验证中国大陆 18 位身份证号
 * 复杂度：O(1)
 *
 * @throws {KycError} 格式或校验码错误
 */
export const verifyChineseIdCard = (idNumber: string): boolean => {
  if (!idNumber) {
    throw new KycError('KYC_ID_EMPTY', 'ID number is required');
  }
  // 18 位，前 17 位数字，最后一位数字或 X
  if (!/^\d{17}[\dXx]$/.test(idNumber)) {
    throw new KycError('KYC_ID_FORMAT', 'ID number must be 18 digits ending with digit or X');
  }
  const upper = idNumber.toUpperCase();
  // 校验地区码（前 6 位）
  const region = upper.substring(0, 6);
  if (!isValidRegionCode(region)) {
    throw new KycError('KYC_ID_REGION', `Invalid region code: ${region}`);
  }
  // 校验生日（第 7-14 位）
  const birth = upper.substring(6, 14);
  if (!isValidDateString(birth)) {
    throw new KycError('KYC_ID_BIRTH', `Invalid birth date: ${birth}`);
  }
  // 校验顺序码（第 15-17 位） - 末位奇男偶女
  const sequence = parseInt(upper.substring(14, 17), 10);
  if (Number.isNaN(sequence)) {
    throw new KycError('KYC_ID_SEQ', 'Invalid sequence code');
  }
  // 校验码
  const expected = computeIdCardCheckCode(upper.substring(0, 17));
  if (upper[17] !== expected) {
    throw new KycError('KYC_ID_CHECK', `Check code mismatch: expected ${expected}, got ${upper[17]}`);
  }
  return true;
};

/** 计算身份证校验码 */
export const computeIdCardCheckCode = (id17: string): string => {
  if (id17.length !== 17 || !/^\d{17}$/.test(id17)) {
    throw new KycError('KYC_ID_FORMAT', 'Need 17 digits for check code computation');
  }
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i], 10) * ID_CARD_WEIGHTS[i];
  }
  return ID_CARD_CHECK_CODES[sum % 11];
};

/**
 * 提取身份证中的信息
 */
export interface IdCardInfo {
  region: string;
  birthDate: string;
  gender: 'M' | 'F';
  age: number;
}

/** 部分常用地区码（前 2 位） */
const VALID_REGION_PREFIX = new Set([
  '11', '12', '13', '14', '15', '21', '22', '23', '31', '32', '33', '34', '35',
  '36', '37', '41', '42', '43', '44', '45', '46', '50', '51', '52', '53', '54',
  '61', '62', '63', '64', '65', '71', '81', '82',
]);

const isValidRegionCode = (region: string): boolean => {
  if (region.length !== 6) return false;
  return VALID_REGION_PREFIX.has(region.substring(0, 2));
};

const isValidDateString = (yyyyMMdd: string): boolean => {
  if (!/^\d{8}$/.test(yyyyMMdd)) return false;
  const y = parseInt(yyyyMMdd.substring(0, 4), 10);
  const m = parseInt(yyyyMMdd.substring(4, 6), 10);
  const d = parseInt(yyyyMMdd.substring(6, 8), 10);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
};

/**
 * 从 18 位身份证提取信息
 */
export const extractIdCardInfo = (idNumber: string): IdCardInfo => {
  verifyChineseIdCard(idNumber);
  const upper = idNumber.toUpperCase();
  const region = upper.substring(0, 6);
  const birthStr = upper.substring(6, 14);
  const y = parseInt(birthStr.substring(0, 4), 10);
  const m = parseInt(birthStr.substring(4, 6), 10);
  const d = parseInt(birthStr.substring(6, 8), 10);
  const birthDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const sequence = parseInt(upper.substring(16, 17), 10);
  return {
    region,
    birthDate,
    gender: sequence % 2 === 1 ? 'M' : 'F',
    age: calculateAge(birthDate),
  };
};

// ============================================================================
// 手机号
// ============================================================================

/**
 * E.164 格式校验
 *  - 中国大陆 11 位手机号：1[3-9]\d{9}
 *  - 国际号码：+ 国家码 (1-3 位) + 号码 (4-14 位)
 */
const CN_PHONE_RE = /^1[3-9]\d{9}$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

/** 校验手机号（中国或国际） */
export const verifyPhone = (phone: string, countryCode?: string): boolean => {
  if (!phone) {
    throw new KycError('KYC_PHONE_EMPTY', 'Phone is required');
  }
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // 中国大陆
  if (!countryCode || countryCode === 'CN' || countryCode === '+86') {
    if (CN_PHONE_RE.test(cleaned)) return true;
  }
  if (E164_RE.test(cleaned)) return true;
  throw new KycError('KYC_PHONE_FORMAT', 'Invalid phone number');
};

/** 提取中国手机号归属运营商（前 3 位） */
export const detectChinaCarrier = (phone: string): 'mobile' | 'unicom' | 'telecom' | 'unknown' => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!CN_PHONE_RE.test(cleaned)) return 'unknown';
  const prefix3 = cleaned.substring(0, 3);
  const mobile = ['134', '135', '136', '137', '138', '139', '147', '150', '151', '152', '157', '158', '159', '165', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'];
  const unicom = ['130', '131', '132', '145', '146', '155', '156', '166', '167', '171', '175', '176', '185', '186', '196'];
  const telecom = ['133', '149', '153', '162', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199'];
  if (mobile.includes(prefix3)) return 'mobile';
  if (unicom.includes(prefix3)) return 'unicom';
  if (telecom.includes(prefix3)) return 'telecom';
  return 'unknown';
};

// ============================================================================
// 邮箱
// ============================================================================

/**
 * RFC 5322 简化版邮箱校验
 *  - 本地部分：字母数字 . _ % + -
 *  - 域名：字母数字 . -
 *  - 不校验引号字符串等罕见格式
 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

/** 最大本地部分长度（RFC 5321） */
const EMAIL_LOCAL_MAX = 64;
/** 最大总长度 */
const EMAIL_TOTAL_MAX = 254;

export const verifyEmail = (email: string): boolean => {
  if (!email) {
    throw new KycError('KYC_EMAIL_EMPTY', 'Email is required');
  }
  const lower = email.toLowerCase();
  if (lower.length > EMAIL_TOTAL_MAX) {
    throw new KycError('KYC_EMAIL_TOO_LONG', `Email length exceeds ${EMAIL_TOTAL_MAX}`);
  }
  const at = lower.indexOf('@');
  if (at <= 0) {
    throw new KycError('KYC_EMAIL_FORMAT', 'Invalid email format');
  }
  if (at > EMAIL_LOCAL_MAX) {
    throw new KycError('KYC_EMAIL_LOCAL_TOO_LONG', `Local part exceeds ${EMAIL_LOCAL_MAX} chars`);
  }
  if (!EMAIL_RE.test(lower)) {
    throw new KycError('KYC_EMAIL_FORMAT', 'Invalid email format');
  }
  return true;
};

// ============================================================================
// 银行卡 Luhn
// ============================================================================

/**
 * Luhn 算法（信用卡/借记卡通用）
 * 复杂度：O(n)
 */
export const luhnCheck = (cardNumber: string): boolean => {
  if (!cardNumber) return false;
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let parity = digits.length % 2;
  for (let i = 0; i < digits.length; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === parity) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
};

/**
 * 验证银行卡号
 */
export const verifyBankCard = (cardNumber: string): boolean => {
  if (!cardNumber) {
    throw new KycError('KYC_CARD_EMPTY', 'Bank card number is required');
  }
  if (!luhnCheck(cardNumber)) {
    throw new KycError('KYC_CARD_LUHN', 'Bank card failed Luhn check');
  }
  return true;
};

/**
 * 推断卡组织（BIN 段）
 */
export const detectCardBrand = (cardNumber: string): string => {
  const d = cardNumber.replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^5[1-5]/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  if (/^6(?:011|5)/.test(d)) return 'discover';
  if (/^35/.test(d)) return 'jcb';
  if (/^62/.test(d)) return 'unionpay';
  return 'unknown';
};

// ============================================================================
// 年龄
// ============================================================================

/**
 * 基于 ISO 出生日期计算年龄
 * 复杂度：O(1)
 */
export const calculateAge = (dateOfBirth: string, asOf: Date = new Date()): number => {
  if (!dateOfBirth) {
    throw new KycError('KYC_DOB_EMPTY', 'Date of birth is required');
  }
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    throw new KycError('KYC_DOB_INVALID', `Invalid date: ${dateOfBirth}`);
  }
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear();
  const m = asOf.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < dob.getUTCDate())) {
    age--;
  }
  return age;
};

/**
 * 校验年龄是否达到法定要求
 */
export const verifyAge = (dateOfBirth: string, minAge: number = 18): boolean => {
  const age = calculateAge(dateOfBirth);
  if (age < minAge) {
    throw new KycError('KYC_AGE_TOO_YOUNG', `Must be at least ${minAge} years old, got ${age}`);
  }
  return true;
};

// ============================================================================
// 综合校验
// ============================================================================

export interface KycDataToValidate {
  fullName?: string;
  idType?: 'id_card' | 'passport' | 'driver_license';
  idNumber?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  bankCard?: string;
}

/**
 * 一次性校验全部 KYC 字段
 * @returns 校验通过返回 true，失败抛出 KycError
 */
export const validateKycData = (data: KycDataToValidate): boolean => {
  if (data.fullName !== undefined) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      throw new KycError('KYC_NAME_INVALID', 'Full name must be at least 2 chars');
    }
  }
  if (data.idType === 'id_card' && data.idNumber) {
    verifyChineseIdCard(data.idNumber);
  }
  if (data.dateOfBirth) {
    verifyAge(data.dateOfBirth, 18);
  }
  if (data.email) {
    verifyEmail(data.email);
  }
  if (data.phone) {
    verifyPhone(data.phone, data.countryCode);
  }
  if (data.bankCard) {
    verifyBankCard(data.bankCard);
  }
  return true;
};
