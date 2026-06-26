/**
 * KYC 业务服务（状态机 + 加密存储）
 *
 * 完整流程：
 *
 *   not_started
 *      ↓ startKyc
 *   in_progress
 *      ↓ submitIdCard (OCR)
 *      ↓ submitFaceVideo (活体)
 *   pending_review
 *      ↓ approveApplication / rejectApplication
 *   approved | rejected
 *
 * 步骤状态机（独立追踪）：
 *   ocr/document/face: pending → passed | failed
 *
 * 加密策略：
 *   - idNumber (身份证号) 必加密存储
 *   - name (姓名)         加密存储
 *   - 资源 URL (faceImage / backImage / video)  原样保存（OSS 已签名授权）
 *
 * 留存策略：5 年（KYC_DATA_RETENTION_DAYS = 1825）
 *
 * @module lib/kyc/kyc-service
 */

import { randomString } from '@/lib/auth/crypto';
import { KycError } from '@/lib/auth/errors';
import {
  AliCloudOcr,
  type AliCloudOcrConfig,
  type AliCloudIdCardInfo,
} from './alicloud-ocr';
import {
  AliCloudFaceVerification,
  type AliCloudFaceConfig,
  type FaceVerificationResult,
} from './alicloud-face';
import { encryptPII, PII_ENCRYPTION_KEY } from './crypto';
import { verifyChineseIdCard } from './verifier';

// ============================================================================
// 类型
// ============================================================================

export type KycStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export type KycStepStatus = 'pending' | 'passed' | 'failed';

export type KycType = 'basic' | 'advanced';

export interface KycApplication {
  id: string;
  userId: string;
  type: KycType;
  status: KycStatus;
  steps: {
    ocr: KycStepStatus;
    face: KycStepStatus;
    document: KycStepStatus;
  };
  encryptedData: {
    idNumber?: string;
    name?: string;
    faceImageUrl?: string;
    backImageUrl?: string;
    videoUrl?: string;
  };
  /** 明文字段（仅 OCR 解析后回填，便于业务展示） */
  plainData: {
    name?: string;
    idNumberMasked?: string;
    birthDate?: string;
    authority?: string;
    validDate?: string;
  };
  /** 人脸活体结果 */
  faceResult?: {
    similarity: number;
    livenessScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    passed: boolean;
  };
  /** OCR 置信度 */
  ocrConfidence?: number;
  reviewNotes?: string;
  reviewerId?: string;
  reviewedAt?: number;
  rejectReason?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

// ============================================================================
// 存储（内存 Map，生产可替换为数据库）
// ============================================================================

const applications: Map<string, KycApplication> = new Map();
const userIndex: Map<string, string> = new Map(); // userId -> latest appId

const newId = (): string => `kycapp_${Date.now()}_${randomString(6)}`;

// ============================================================================
// 状态机校验
// ============================================================================

const VALID_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['pending_review', 'rejected', 'in_progress'],
  pending_review: ['approved', 'rejected', 'in_progress'],
  approved: ['expired'],
  rejected: ['in_progress'],
  expired: ['in_progress'],
};

const assertTransition = (from: KycStatus, to: KycStatus): void => {
  if (!VALID_TRANSITIONS[from].includes(to)) {
    throw new KycError(
      'KYC_STATUS_INVALID',
      `Invalid status transition: ${from} → ${to}`,
      400,
    );
  }
};

// ============================================================================
// 服务
// ============================================================================

export interface KycServiceOptions {
  ocrConfig: AliCloudOcrConfig;
  faceConfig: AliCloudFaceConfig;
  /** PII 加密密钥（默认从环境变量） */
  piiKey?: Buffer | Uint8Array | string;
  /** 自定义存储（生产可注入数据库） */
  store?: {
    get: (id: string) => KycApplication | null | Promise<KycApplication | null>;
    set: (app: KycApplication) => void | Promise<void>;
    list: (filter?: { userId?: string; status?: KycStatus }) => KycApplication[] | Promise<KycApplication[]>;
    delete: (id: string) => void | Promise<void>;
  };
  /** 留存的过期时间（毫秒，默认 5 年） */
  retentionMs?: number;
  /** 强制要求 OCR 步骤通过后才能进入人脸步骤 */
  requireOcrBeforeFace?: boolean;
  /** OCR 置信度下限（低于此值视为失败） */
  minOcrConfidence?: number;
}

/**
 * 默认存储实现（内存）
 */
const defaultStore = {
  get: (id: string): KycApplication | null => applications.get(id) || null,
  set: (app: KycApplication): void => {
    applications.set(app.id, app);
    userIndex.set(app.userId, app.id);
  },
  list: (filter?: { userId?: string; status?: KycStatus }): KycApplication[] => {
    const out: KycApplication[] = [];
    for (const app of applications.values()) {
      if (filter?.userId && app.userId !== filter.userId) continue;
      if (filter?.status && app.status !== filter.status) continue;
      out.push(app);
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
  delete: (id: string): void => {
    applications.delete(id);
  },
};

/**
 * KYC 业务服务
 */
export class KycService {
  private readonly ocr: AliCloudOcr;
  private readonly face: AliCloudFaceVerification;
  private readonly piiKey: Buffer | Uint8Array | string;
  private readonly store: NonNullable<KycServiceOptions['store']>;
  private readonly retentionMs: number;
  private readonly requireOcrBeforeFace: boolean;
  private readonly minOcrConfidence: number;

  constructor(options: KycServiceOptions) {
    if (!options) {
      throw new KycError('KYC_SERVICE_CONFIG', 'KycService options are required');
    }
    this.ocr = new AliCloudOcr(options.ocrConfig);
    this.face = new AliCloudFaceVerification(options.faceConfig);
    this.piiKey = options.piiKey || PII_ENCRYPTION_KEY;
    this.store = options.store || defaultStore;
    this.retentionMs = options.retentionMs ?? 1825 * 24 * 60 * 60 * 1000;
    this.requireOcrBeforeFace = options.requireOcrBeforeFace ?? true;
    this.minOcrConfidence = options.minOcrConfidence ?? 0.7;
  }

  // --------------------------------------------------------------------------
  // 公共 API：申请生命周期
  // --------------------------------------------------------------------------

  /**
   * 启动一次 KYC 申请
   */
  public async startKyc(userId: string, type: KycType): Promise<KycApplication> {
    if (!userId) {
      throw new KycError('KYC_USER_REQUIRED', 'userId is required');
    }
    if (type !== 'basic' && type !== 'advanced') {
      throw new KycError('KYC_TYPE_INVALID', `Invalid kyc type: ${type}`);
    }
    const now = Date.now();
    // 已有未终态申请：复用并重置（不重复创建）
    const existing = await this.findActiveAppForUser(userId);
    if (existing) {
      if (existing.status === 'approved') {
        throw new KycError(
          'KYC_ALREADY_APPROVED',
          'User already KYC approved; cannot restart',
          409,
        );
      }
      // 复用
      existing.type = type;
      existing.steps = { ocr: 'pending', face: 'pending', document: 'pending' };
      existing.status = 'in_progress';
      existing.updatedAt = now;
      await this.persist(existing);
      return existing;
    }

    const app: KycApplication = {
      id: newId(),
      userId,
      type,
      status: 'in_progress',
      steps: { ocr: 'pending', face: 'pending', document: 'pending' },
      encryptedData: {},
      plainData: {},
      createdAt: now,
      updatedAt: now,
      expiresAt: now + this.retentionMs,
    };
    await this.persist(app);
    return app;
  }

  /**
   * 提交身份证 OCR（正面 + 背面）
   *
   * 自动执行：
   *   1. 调用阿里云 OCR 识别
   *   2. 校验身份证号格式（GB 11643-1999）
   *   3. 加密存储 PII
   *   4. 更新步骤状态
   */
  public async submitIdCard(
    userId: string,
    appId: string,
    faceImageUrl: string,
    backImageUrl: string,
  ): Promise<KycApplication> {
    const app = await this.loadApp(appId, userId);
    assertTransition(app.status, 'in_progress');

    if (!faceImageUrl || !backImageUrl) {
      throw new KycError('KYC_IMAGES_REQUIRED', 'Both face and back images are required');
    }

    // 并行 OCR
    const [faceInfo, backInfo] = await Promise.all([
      this.ocr.recognizeIdCard(faceImageUrl, 'face'),
      this.ocr.recognizeIdCard(backImageUrl, 'back'),
    ]);

    // 校验置信度
    if (faceInfo.confidence < this.minOcrConfidence) {
      app.steps.ocr = 'failed';
      app.status = 'rejected';
      app.rejectReason = `OCR 置信度过低: ${faceInfo.confidence}`;
      app.updatedAt = Date.now();
      await this.persist(app);
      throw new KycError(
        'KYC_OCR_LOW_CONFIDENCE',
        `OCR confidence too low: ${faceInfo.confidence}`,
        422,
        { confidence: faceInfo.confidence },
      );
    }

    // 身份证号格式校验
    if (!faceInfo.idNumber) {
      throw new KycError('KYC_OCR_NO_ID', 'OCR did not extract id number', 422);
    }
    try {
      verifyChineseIdCard(faceInfo.idNumber);
    } catch (err) {
      app.steps.ocr = 'failed';
      app.status = 'rejected';
      app.rejectReason = `OCR 身份证号格式错误`;
      app.updatedAt = Date.now();
      await this.persist(app);
      throw new KycError(
        'KYC_OCR_ID_INVALID',
        `OCR-extracted id failed checksum: ${(err as Error).message}`,
        422,
      );
    }

    // 加密存储 PII
    app.encryptedData.idNumber = encryptPII(faceInfo.idNumber, this.piiKey);
    if (faceInfo.name) {
      app.encryptedData.name = encryptPII(faceInfo.name, this.piiKey);
    }
    app.encryptedData.faceImageUrl = faceImageUrl;
    app.encryptedData.backImageUrl = backImageUrl;

    // 明文展示字段（脱敏后回填，方便业务查询）
    app.plainData = {
      name: faceInfo.name,
      idNumberMasked: maskIdNumberForDisplay(faceInfo.idNumber),
      birthDate: faceInfo.birthDate,
      authority: backInfo.authority,
      validDate: backInfo.validDate,
    };
    app.ocrConfidence = faceInfo.confidence;
    app.steps.ocr = 'passed';
    app.steps.document = 'passed';
    app.status = 'in_progress';
    app.updatedAt = Date.now();
    await this.persist(app);
    return app;
  }

  /**
   * 提交人脸活体视频
   *
   * 自动执行：
   *   1. 调用阿里云活体检测
   *   2. 根据相似度 + 活体分数判定通过 / 失败
   *   3. 更新步骤状态
   */
  public async submitFaceVideo(
    userId: string,
    appId: string,
    videoUrl: string,
  ): Promise<KycApplication> {
    const app = await this.loadApp(appId, userId);
    assertTransition(app.status, 'in_progress');

    if (this.requireOcrBeforeFace && app.steps.ocr !== 'passed') {
      throw new KycError(
        'KYC_FACE_BEFORE_OCR',
        'OCR step must pass before face verification',
        400,
      );
    }
    if (!videoUrl) {
      throw new KycError('KYC_VIDEO_REQUIRED', 'videoUrl is required');
    }
    // 解密姓名 + 身份证号（用 PII key）
    const name = app.encryptedData.name ? decryptPIIHelper(app.encryptedData.name, this.piiKey) : '';
    const idNumber = app.encryptedData.idNumber ? decryptPIIHelper(app.encryptedData.idNumber, this.piiKey) : '';
    if (!name || !idNumber) {
      throw new KycError('KYC_FACE_NO_IDENTITY', 'Identity (name + idNumber) not yet extracted', 400);
    }

    const result = await this.face.verifyWithVideo(videoUrl, idNumber, name);
    app.encryptedData.videoUrl = videoUrl;
    app.faceResult = {
      similarity: result.similarity,
      livenessScore: result.livenessScore,
      riskLevel: result.riskLevel,
      passed: result.passed,
    };
    app.steps.face = result.passed ? 'passed' : 'failed';
    if (result.passed) {
      app.status = 'pending_review';
    } else {
      app.status = 'rejected';
      app.rejectReason = result.reason || `活体检测未通过 (similarity=${result.similarity}, liveness=${result.livenessScore})`;
    }
    app.updatedAt = Date.now();
    await this.persist(app);
    return app;
  }

  /**
   * 静默活体（高级 KYC 用照片）
   */
  public async submitFacePhoto(
    userId: string,
    appId: string,
    photoUrl: string,
  ): Promise<KycApplication> {
    const app = await this.loadApp(appId, userId);
    assertTransition(app.status, 'in_progress');

    if (this.requireOcrBeforeFace && app.steps.ocr !== 'passed') {
      throw new KycError(
        'KYC_FACE_BEFORE_OCR',
        'OCR step must pass before face verification',
        400,
      );
    }
    if (!photoUrl) {
      throw new KycError('KYC_PHOTO_REQUIRED', 'photoUrl is required');
    }
    const name = app.encryptedData.name ? decryptPIIHelper(app.encryptedData.name, this.piiKey) : '';
    const idNumber = app.encryptedData.idNumber ? decryptPIIHelper(app.encryptedData.idNumber, this.piiKey) : '';
    if (!name || !idNumber) {
      throw new KycError('KYC_FACE_NO_IDENTITY', 'Identity (name + idNumber) not yet extracted', 400);
    }

    const result = await this.face.verifyWithPhoto(photoUrl, idNumber, name);
    app.encryptedData.faceImageUrl = photoUrl;
    app.faceResult = {
      similarity: result.similarity,
      livenessScore: result.livenessScore,
      riskLevel: result.riskLevel,
      passed: result.passed,
    };
    app.steps.face = result.passed ? 'passed' : 'failed';
    if (result.passed) {
      app.status = 'pending_review';
    } else {
      app.status = 'rejected';
      app.rejectReason = result.reason || `静默活体未通过`;
    }
    app.updatedAt = Date.now();
    await this.persist(app);
    return app;
  }

  // --------------------------------------------------------------------------
  // 公共 API：审核
  // --------------------------------------------------------------------------

  /**
   * 审核通过
   */
  public async approveApplication(
    appId: string,
    reviewerId: string,
    comment?: string,
  ): Promise<KycApplication> {
    const app = await this.loadApp(appId);
    if (app.status === 'approved' || app.status === 'rejected') {
      throw new KycError(
        'KYC_ALREADY_DECIDED',
        `Application already ${app.status}`,
        409,
      );
    }
    if (app.steps.ocr !== 'passed' || app.steps.face !== 'passed') {
      throw new KycError(
        'KYC_STEPS_INCOMPLETE',
        'Cannot approve application with incomplete steps',
        400,
        { steps: app.steps },
      );
    }
    assertTransition(app.status, 'approved');
    app.status = 'approved';
    app.reviewerId = reviewerId;
    app.reviewNotes = comment;
    app.reviewedAt = Date.now();
    app.updatedAt = app.reviewedAt;
    await this.persist(app);
    return app;
  }

  /**
   * 审核拒绝
   */
  public async rejectApplication(
    appId: string,
    reviewerId: string,
    reason: string,
  ): Promise<KycApplication> {
    if (!reason || reason.trim().length < 2) {
      throw new KycError('KYC_REASON_REQUIRED', 'Reject reason is required (>=2 chars)');
    }
    const app = await this.loadApp(appId);
    if (app.status === 'approved' || app.status === 'rejected') {
      throw new KycError(
        'KYC_ALREADY_DECIDED',
        `Application already ${app.status}`,
        409,
      );
    }
    assertTransition(app.status, 'rejected');
    app.status = 'rejected';
    app.reviewerId = reviewerId;
    app.rejectReason = reason;
    app.reviewedAt = Date.now();
    app.updatedAt = app.reviewedAt;
    await this.persist(app);
    return app;
  }

  // --------------------------------------------------------------------------
  // 公共 API：查询
  // --------------------------------------------------------------------------

  public async getApplication(appId: string): Promise<KycApplication | null> {
    return await this.store.get(appId);
  }

  /**
   * 获取用户最新一次申请的状态
   */
  public async getUserStatus(userId: string): Promise<KycStatus> {
    const app = await this.findActiveAppForUser(userId);
    return app ? app.status : 'not_started';
  }

  /**
   * 列出所有待审核申请
   */
  public async listPendingApplications(): Promise<KycApplication[]> {
    return await this.store.list({ status: 'pending_review' });
  }

  /**
   * 列出某用户的所有申请
   */
  public async listUserApplications(userId: string): Promise<KycApplication[]> {
    return await this.store.list({ userId });
  }

  // --------------------------------------------------------------------------
  // 内部
  // --------------------------------------------------------------------------

  private async loadApp(appId: string, expectedUserId?: string): Promise<KycApplication> {
    if (!appId) {
      throw new KycError('KYC_APP_ID', 'appId is required');
    }
    const app = await this.store.get(appId);
    if (!app) {
      throw new KycError('KYC_NOT_FOUND', `Application not found: ${appId}`, 404);
    }
    if (expectedUserId && app.userId !== expectedUserId) {
      throw new KycError('KYC_NOT_OWNER', 'Application does not belong to this user', 403);
    }
    return app;
  }

  private async findActiveAppForUser(userId: string): Promise<KycApplication | null> {
    const list = await this.store.list({ userId });
    if (list.length === 0) return null;
    // 优先返回 not terminal 的；否则返回最新一条
    const active = list.find(
      (a) => a.status !== 'approved' && a.status !== 'expired',
    );
    return active || list[0];
  }

  private async persist(app: KycApplication): Promise<void> {
    await this.store.set(app);
  }
}

// ============================================================================
// 内部辅助
// ============================================================================

const maskIdNumberForDisplay = (id: string): string => {
  if (!id || id.length < 8) return id;
  return `${id.substring(0, 6)}********${id.substring(id.length - 4)}`;
};

// 内部使用 decryptPII（不导出）以避免循环依赖 + 严格控制 API
const decryptPIIHelper = (ciphertext: string, key: Buffer | Uint8Array | string): string => {
  // 同步解密（Node 路径）
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('crypto') as typeof import('crypto');
  // 解包
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cryptoMod = require('@/lib/auth/crypto') as typeof import('@/lib/auth/crypto');
  const bytes = cryptoMod.base64UrlDecode(ciphertext);
  const iv = Buffer.from(bytes.slice(0, 12));
  const authTag = Buffer.from(bytes.slice(bytes.length - 16));
  const encCt = Buffer.from(bytes.slice(12, bytes.length - 16));
  // 归一化 key
  let keyBuf: Buffer;
  if (typeof key === 'string') {
    const k = Buffer.from(key, 'utf8');
    keyBuf = k.length >= 32 ? k.subarray(0, 32) : (() => { throw new Error('key too short'); })();
  } else {
    keyBuf = Buffer.from(key).length >= 32 ? Buffer.from(key).subarray(0, 32) : (() => { throw new Error('key too short'); })();
  }
  const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([decipher.update(encCt), decipher.final()]);
  return dec.toString('utf8');
};

/** 测试辅助：清空内存存储 */
export const _resetKycServiceStore = (): void => {
  applications.clear();
  userIndex.clear();
};
