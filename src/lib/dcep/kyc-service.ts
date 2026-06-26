/**
 * DcepKycService - 实名认证（KYC）服务
 *
 * 4 级 KYC：
 *  - Level 0：匿名（仅注册），不能交易
 *  - Level 1：弱实名（手机号 + 短信码）
 *  - Level 2：实名（身份证 + 姓名 + 国徽页 + 人像页）
 *  - Level 3：强实名（身份证 + 银行卡 + 活体）
 *
 * 数据存储：
 *  - 身份证号、手机号采用 mock 加密（base64 + 简单混淆）
 *  - 生产应替换为 KMS / 字段级加密
 *
 * 用法：
 *   const kyc = new DcepKycService();
 *   await kyc.verifyLightKyc('13800000000', '123456');
 *   await kyc.verifyFullKyc({ realName, idType, idNumber, frontImg, backImg });
 */

import { createHash } from 'node:crypto';
import { logger as defaultLogger } from '../logger';
import {
  type DcepKycInfo,
  type IdType,
  type KycLevel,
  DCEP_KYC_VALIDITY_DAYS,
  DcepError,
  DcepKycError,
} from './types';

const ONE_DAY_MS = 24 * 3600_000;

// =============================================================================
// 内部存储
// =============================================================================

interface UserKycState {
  userId: string;
  level: KycLevel;
  realName?: string;
  idType?: IdType;
  idNumberHash?: string;
  phoneHash?: string;
  verifiedAt?: number;
  expiresAt?: number;
}

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const ID_NUMBER_REGEX = /^\d{17}[\dXx]$/;
const PASSPORT_REGEX = /^[A-Z0-9]{5,17}$/;

/** 简单 mock 加密（base64）— 生产用 KMS 替换 */
function mockEncrypt(plain: string): string {
  // 简单前缀混淆（避免明文落盘）
  return Buffer.from(`enc:${plain}`, 'utf8').toString('base64');
}

function mockDecrypt(cipher: string): string {
  try {
    return Buffer.from(cipher, 'base64').toString('utf8').replace(/^enc:/, '');
  } catch {
    return '';
  }
}

function hashForMatch(plain: string): string {
  return createHash('sha256').update(plain.trim().toLowerCase()).digest('hex');
}

// =============================================================================
// DcepKycService
// =============================================================================

export interface DcepKycServiceOptions {
  logger?: typeof defaultLogger;
  now?: () => number;
  /** 短信码校验（默认 123456 通过） */
  validSmsCodes?: Set<string>;
  /** 测试用：身份证号白名单（默认 test-* 通过） */
  acceptedIdNumbers?: Set<string>;
}

export class DcepKycService {
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;
  private readonly validSmsCodes: Set<string>;
  private readonly acceptedIdNumbers: Set<string>;
  private readonly states: Map<string, UserKycState> = new Map();

  constructor(opts: DcepKycServiceOptions = {}) {
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
    this.validSmsCodes = opts.validSmsCodes ?? new Set(['123456']);
    this.acceptedIdNumbers = opts.acceptedIdNumbers ?? new Set<string>();
  }

  // -------------------------------------------------------------------------
  // 弱实名（手机号）
  // -------------------------------------------------------------------------

  /**
   * 弱实名：手机号 + 短信码
   */
  async verifyLightKyc(phone: string, smsCode: string): Promise<{ verified: boolean; level: KycLevel }> {
    if (!PHONE_REGEX.test(phone)) {
      throw new DcepKycError('INVALID_PHONE', `invalid phone number: ${phone}`);
    }
    if (!/^\d{6}$/.test(smsCode)) {
      throw new DcepKycError('INVALID_SMS_CODE', 'SMS code must be 6 digits');
    }
    if (!this.validSmsCodes.has(smsCode)) {
      throw new DcepKycError('SMS_CODE_MISMATCH', 'SMS code is incorrect');
    }

    // 找到该手机号对应的 userId（mock：根据手机号生成）
    // 实际场景中，应由调用方传入 userId；这里按 userId 持久化存储
    // 我们用 phone 作为内部 key（mock）
    return { verified: true, level: 1 };
  }

  /**
   * 注册弱实名结果到用户（业务层调用）
   */
  registerLightKyc(userId: string, phone: string, smsCode: string): DcepKycInfo {
    if (!PHONE_REGEX.test(phone)) {
      throw new DcepKycError('INVALID_PHONE', `invalid phone number: ${phone}`);
    }
    if (!this.validSmsCodes.has(smsCode)) {
      throw new DcepKycError('SMS_CODE_MISMATCH', 'SMS code is incorrect');
    }
    const now = this.now();
    const state: UserKycState = {
      userId,
      level: 1,
      phoneHash: hashForMatch(phone),
      verifiedAt: now,
      expiresAt: now + DCEP_KYC_VALIDITY_DAYS * ONE_DAY_MS,
    };
    this.states.set(userId, state);
    return this.toKycInfo(state, phone);
  }

  // -------------------------------------------------------------------------
  // 实名（身份证 + 姓名）
  // -------------------------------------------------------------------------

  /**
   * 实名：身份证 + 姓名
   */
  async verifyFullKyc(opts: {
    userId: string;
    realName: string;
    idType: IdType;
    idNumber: string;
    frontImg?: string;
    backImg?: string;
  }): Promise<{ verified: boolean; level: KycLevel }> {
    if (!opts.realName || opts.realName.trim().length < 2) {
      throw new DcepKycError('INVALID_NAME', 'realName must be at least 2 characters');
    }
    this.validateIdNumber(opts.idType, opts.idNumber);

    // mock OCR / 公安二要素（演示用：test- 前缀通过）
    if (
      !opts.idNumber.startsWith('test-') &&
      !this.acceptedIdNumbers.has(opts.idNumber) &&
      !this.isAcceptedMockId(opts.idNumber)
    ) {
      // 演示降级：所有未在白名单的身份证号都拒绝
      // 生产：调用公安网二要素接口
      throw new DcepKycError('ID_VERIFY_FAILED', 'id number verification failed (mock: only test-* or specific mock ids accepted)');
    }

    return { verified: true, level: 2 };
  }

  registerFullKyc(opts: {
    userId: string;
    realName: string;
    idType: IdType;
    idNumber: string;
  }): DcepKycInfo {
    if (!opts.realName || opts.realName.trim().length < 2) {
      throw new DcepKycError('INVALID_NAME', 'realName must be at least 2 characters');
    }
    this.validateIdNumber(opts.idType, opts.idNumber);
    const now = this.now();
    const existing = this.states.get(opts.userId);
    const state: UserKycState = {
      userId: opts.userId,
      level: 2,
      realName: opts.realName.trim(),
      idType: opts.idType,
      idNumberHash: hashForMatch(opts.idNumber),
      phoneHash: existing?.phoneHash,
      verifiedAt: now,
      expiresAt: now + DCEP_KYC_VALIDITY_DAYS * ONE_DAY_MS,
    };
    this.states.set(opts.userId, state);
    return this.toKycInfo(state);
  }

  // -------------------------------------------------------------------------
  // 强实名（银行卡 + 活体）
  // -------------------------------------------------------------------------

  /**
   * 强实名：身份证 + 银行卡 + 活体
   */
  async verifyEnhancedKyc(opts: {
    userId: string;
    realName: string;
    idType: IdType;
    idNumber: string;
    bankName: string;
    bankAccount: string;
    livenessImg: string;
  }): Promise<{ verified: boolean; level: KycLevel }> {
    if (!opts.bankName || !opts.bankAccount) {
      throw new DcepKycError('BANK_REQUIRED', 'bankName and bankAccount are required');
    }
    if (!opts.livenessImg || opts.livenessImg.length < 10) {
      throw new DcepKycError('LIVENESS_REQUIRED', 'liveness image is required');
    }
    // 实名必须先通过
    const full = await this.verifyFullKyc({
      userId: opts.userId,
      realName: opts.realName,
      idType: opts.idType,
      idNumber: opts.idNumber,
    });
    if (!full.verified) {
      return { verified: false, level: 0 };
    }
    return { verified: true, level: 3 };
  }

  registerEnhancedKyc(opts: {
    userId: string;
    realName: string;
    idType: IdType;
    idNumber: string;
  }): DcepKycInfo {
    if (!opts.realName || opts.realName.trim().length < 2) {
      throw new DcepKycError('INVALID_NAME', 'realName must be at least 2 characters');
    }
    this.validateIdNumber(opts.idType, opts.idNumber);
    const now = this.now();
    const state: UserKycState = {
      userId: opts.userId,
      level: 3,
      realName: opts.realName.trim(),
      idType: opts.idType,
      idNumberHash: hashForMatch(opts.idNumber),
      phoneHash: this.states.get(opts.userId)?.phoneHash,
      verifiedAt: now,
      expiresAt: now + DCEP_KYC_VALIDITY_DAYS * ONE_DAY_MS,
    };
    this.states.set(opts.userId, state);
    return this.toKycInfo(state);
  }

  // -------------------------------------------------------------------------
  // 查询
  // -------------------------------------------------------------------------

  /**
   * 查询 KYC 信息
   */
  getKycInfo(userId: string): DcepKycInfo | null {
    const state = this.states.get(userId);
    if (!state || !state.verifiedAt) return null;
    return this.toKycInfo(state);
  }

  /**
   * 查询 KYC 等级（不存在返回 0）
   */
  getKycLevel(userId: string): KycLevel {
    return this.states.get(userId)?.level ?? 0;
  }

  /**
   * KYC 是否有效（存在且未过期）
   */
  isKycValid(userId: string): boolean {
    const state = this.states.get(userId);
    if (!state || !state.verifiedAt || !state.expiresAt) return false;
    return this.now() < state.expiresAt;
  }

  /**
   * 续期 KYC（重新走一遍对应等级）
   */
  async renewKyc(userId: string): Promise<DcepKycInfo> {
    const state = this.states.get(userId);
    if (!state) {
      throw new DcepKycError('NO_KYC_RECORD', `user ${userId} has no KYC record to renew`);
    }
    if (!state.realName || !state.idType || !state.idNumberHash) {
      throw new DcepKycError('INCOMPLETE_KYC', 'cannot renew: KYC record is incomplete');
    }
    const now = this.now();
    state.verifiedAt = now;
    state.expiresAt = now + DCEP_KYC_VALIDITY_DAYS * ONE_DAY_MS;
    this.logger.info(`[DCEP] KYC renewed for user ${userId}, level=${state.level}`);
    return this.toKycInfo(state);
  }

  // -------------------------------------------------------------------------
  // 测试用
  // -------------------------------------------------------------------------

  /** 清空（测试用） */
  reset(): void {
    this.states.clear();
  }

  /** 添加一个预存在的 KYC（测试用） */
  seed(userId: string, level: KycLevel): DcepKycInfo {
    const now = this.now();
    const state: UserKycState = {
      userId,
      level,
      realName: level >= 2 ? '测试用户' : undefined,
      idType: level >= 2 ? '身份证' : undefined,
      idNumberHash: level >= 2 ? hashForMatch('test-110101199001011234') : undefined,
      verifiedAt: now,
      expiresAt: now + DCEP_KYC_VALIDITY_DAYS * ONE_DAY_MS,
    };
    this.states.set(userId, state);
    return this.toKycInfo(state);
  }

  // -------------------------------------------------------------------------
  // 内部
  // -------------------------------------------------------------------------

  private validateIdNumber(idType: IdType, idNumber: string): void {
    if (!idNumber) {
      throw new DcepKycError('INVALID_ID_NUMBER', 'idNumber is required');
    }
    if (idType === '身份证') {
      if (!ID_NUMBER_REGEX.test(idNumber) && !idNumber.startsWith('test-')) {
        throw new DcepKycError('INVALID_ID_NUMBER', 'invalid 身份证 number');
      }
    } else {
      if (!PASSPORT_REGEX.test(idNumber) && !idNumber.startsWith('test-')) {
        throw new DcepKycError('INVALID_ID_NUMBER', `invalid ${idType} number`);
      }
    }
  }

  /** 演示专用：test-* 前缀 + 部分 mock id 通过 */
  private isAcceptedMockId(idNumber: string): boolean {
    return idNumber.startsWith('mock-') || idNumber.startsWith('demo-');
  }

  private toKycInfo(state: UserKycState, plainPhone?: string): DcepKycInfo {
    return {
      userId: state.userId,
      realName: state.realName ?? '',
      idType: state.idType ?? '身份证',
      idNumber: state.idNumberHash ? mockEncrypt(state.idNumberHash.slice(0, 18)) : '',
      phoneNumber: plainPhone
        ? mockEncrypt(plainPhone)
        : state.phoneHash
          ? mockEncrypt('138' + state.phoneHash.slice(0, 8))
          : '',
      level: state.level,
      verifiedAt: state.verifiedAt ?? 0,
      expiresAt: state.expiresAt ?? 0,
    };
  }
}

export function createDcepKycService(opts?: DcepKycServiceOptions): DcepKycService {
  return new DcepKycService(opts);
}

export default DcepKycService;
