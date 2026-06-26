/**
 * 阿里云人脸活体检测
 *
 * 服务：阿里云云市场 - 人脸活体检测（cmapi027343）
 * 文档：https://market.aliyun.com/products/57000002/cmapi027343.html
 *
 * 鉴权：APPCODE 方式
 *   Authorization: APPCODE xxxx
 *
 * 两种调用方式：
 *   1. 视频活体（动作+静默） - verifyWithVideo(videoUrl, idCardNumber, name)
 *      用户录制一段包含指定动作的视频，服务端做活体判断
 *   2. 静默活体（仅照片）   - verifyWithPhoto(photoUrl, idCardNumber, name)
 *      用户拍摄一张照片，服务端做活体判断
 *
 * 请求：
 *   POST {endpoint}
 *   Content-Type: application/json
 *   Body: { idCardNumber, name, videoUrl/photoUrl }
 *
 * 响应（典型）：
 *   { "code": 200, "msg": "OK", "data": { "pass": true, "score": 95, "similarity": 0.92, "liveness": 0.98 } }
 *
 * 风险等级：
 *   - similarity >= 0.85 且 livenessScore >= 0.90 → low
 *   - similarity >= 0.70 且 livenessScore >= 0.70 → medium
 *   - 其他 → high（拒绝）
 *
 * @module lib/kyc/alicloud-face
 */

import { KycError } from '@/lib/auth/errors';

// ============================================================================
// 类型
// ============================================================================

/** 人脸活体检测结果 */
export interface FaceVerificationResult {
  passed: boolean;
  confidence: number; // 0-1
  similarity: number; // 与身份证照片相似度 0-1
  livenessScore: number; // 活体分数 0-1
  riskLevel: 'low' | 'medium' | 'high';
  reason?: string;
  rawResponse: any;
}

/** 配置 */
export interface AliCloudFaceConfig {
  appCode: string;
  endpoint?: string;
  mock?: boolean;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  fetchImpl?: typeof fetch;
  /** 通过阈值（similarity） */
  similarityThreshold?: number;
  /** 活体分数阈值 */
  livenessThreshold?: number;
}

/** 阿里云人脸活体 API 响应 */
export interface AliCloudFaceResponse {
  code: number;
  msg: string;
  data?: {
    /** 是否通过 */
    pass?: boolean;
    /** 总体分（百分制） */
    score?: number;
    /** 与身份证照片相似度 0-1 */
    similarity?: number;
    /** 活体分数 0-1 */
    liveness?: number;
    /** 风险标签 */
    riskTag?: string;
    /** 失败原因 */
    reason?: string;
  };
}

// ============================================================================
// 端点常量
// ============================================================================

/**
 * 阿里云市场 - 人脸活体检测 endpoint（cmapi027343）
 * 申请 APPCODE 后由阿里云分配具体 host
 */
export const DEFAULT_FACE_ENDPOINT =
  'https://face-verification.market.alicloudapi.com/verify';

// ============================================================================
// 评分阈值
// ============================================================================

/** 默认相似度阈值（与身份证照片对比） */
export const DEFAULT_SIMILARITY_THRESHOLD = 0.80;
/** 默认活体分数阈值 */
export const DEFAULT_LIVENESS_THRESHOLD = 0.85;

// ============================================================================
// 类
// ============================================================================

/**
 * 阿里云人脸活体检测客户端
 *
 * 使用示例：
 * ```ts
 * const face = new AliCloudFaceVerification({ appCode: process.env.ALIYUN_FACE_APPCODE! });
 * const result = await face.verifyWithVideo(
 *   'https://oss.example.com/user-123-liveness.mp4',
 *   '110101199003073116',
 *   '王五',
 * );
 * if (result.passed) {
 *   // 通过
 * }
 * ```
 */
export class AliCloudFaceVerification {
  private readonly appCode: string;
  private readonly endpoint: string;
  private readonly mock: boolean;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBackoffMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly similarityThreshold: number;
  private readonly livenessThreshold: number;

  constructor(config: AliCloudFaceConfig) {
    if (!config) {
      throw new KycError('KYC_FACE_CONFIG', 'Face config is required');
    }
    this.appCode = config.appCode || '';
    this.endpoint = config.endpoint || DEFAULT_FACE_ENDPOINT;
    this.mock = !!config.mock || !this.appCode;
    this.timeoutMs = config.timeoutMs ?? 15_000;
    this.retries = config.retries ?? 3;
    this.retryBackoffMs = config.retryBackoffMs ?? 500;
    this.fetchImpl =
      config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (null as any));
    this.similarityThreshold = config.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    this.livenessThreshold = config.livenessThreshold ?? DEFAULT_LIVENESS_THRESHOLD;

    if (!this.fetchImpl) {
      throw new KycError(
        'KYC_FACE_NO_FETCH',
        'No fetch implementation available (Node >= 18 required)',
      );
    }
  }

  // --------------------------------------------------------------------------
  // 公共 API
  // --------------------------------------------------------------------------

  /**
   * 视频活体检测
   */
  public async verifyWithVideo(
    videoUrl: string,
    idCardNumber: string,
    name: string,
  ): Promise<FaceVerificationResult> {
    this.assertArgs(videoUrl, idCardNumber, name);
    if (this.mock) {
      return this.mockVerify(videoUrl, idCardNumber, name, 'video');
    }
    return this.callRemoteWithRetry({
      idCardNumber,
      name,
      videoUrl,
    });
  }

  /**
   * 静默活体（照片）
   */
  public async verifyWithPhoto(
    photoUrl: string,
    idCardNumber: string,
    name: string,
  ): Promise<FaceVerificationResult> {
    this.assertArgs(photoUrl, idCardNumber, name);
    if (this.mock) {
      return this.mockVerify(photoUrl, idCardNumber, name, 'photo');
    }
    return this.callRemoteWithRetry({
      idCardNumber,
      name,
      photoUrl,
    });
  }

  /**
   * 是否 mock
   */
  public isMock(): boolean {
    return this.mock;
  }

  // --------------------------------------------------------------------------
  // 内部：参数校验
  // --------------------------------------------------------------------------

  private assertArgs(url: string, idCardNumber: string, name: string): void {
    if (!url) {
      throw new KycError('KYC_FACE_URL', 'Media URL is required');
    }
    if (!idCardNumber || idCardNumber.length < 15) {
      throw new KycError('KYC_FACE_ID', 'Valid idCardNumber is required');
    }
    if (!name || name.trim().length < 2) {
      throw new KycError('KYC_FACE_NAME', 'Valid name is required');
    }
  }

  // --------------------------------------------------------------------------
  // 内部：远端调用
  // --------------------------------------------------------------------------

  private async callRemoteWithRetry(
    body: Record<string, unknown>,
  ): Promise<FaceVerificationResult> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        return await this.callRemoteOnce(body);
      } catch (err) {
        lastError = err;
        if (err instanceof KycError && (err.code === 'KYC_FACE_REMOTE_AUTH' || err.code === 'KYC_FACE_REMOTE_BAD_REQUEST')) {
          throw err;
        }
        if (attempt < this.retries - 1) {
          await this.delay(this.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }
    throw new KycError(
      'KYC_FACE_RETRIES_EXHAUSTED',
      `Face verification failed after ${this.retries} attempts`,
      502,
      { cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  private async callRemoteOnce(body: Record<string, unknown>): Promise<FaceVerificationResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Authorization: `APPCODE ${this.appCode}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new KycError(
          'KYC_FACE_REMOTE_AUTH',
          `APPCODE invalid or unauthorized: HTTP ${res.status}`,
          502,
        );
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await safeText(res);
        throw new KycError(
          'KYC_FACE_REMOTE_BAD_REQUEST',
          `Face remote rejected request: HTTP ${res.status} ${text}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError('KYC_FACE_REMOTE_5XX', `Face remote 5xx: HTTP ${res.status}`, 502);
      }

      const json = (await res.json()) as AliCloudFaceResponse;
      return this.parseResponse(json);
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_FACE_TIMEOUT', `Face timeout after ${this.timeoutMs}ms`, 504);
      }
      throw new KycError(
        'KYC_FACE_NETWORK',
        `Face network error: ${(err as Error).message}`,
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // --------------------------------------------------------------------------
  // 内部：响应解析 + 评分
  // --------------------------------------------------------------------------

  private parseResponse(json: AliCloudFaceResponse): FaceVerificationResult {
    if (!json) {
      throw new KycError('KYC_FACE_BAD_RESPONSE', 'Empty response from face service', 502);
    }
    if (json.code !== 200 && json.code !== 0) {
      throw new KycError(
        'KYC_FACE_REMOTE_FAIL',
        `Face service error: code=${json.code} msg=${json.msg}`,
        502,
        { raw: json },
      );
    }
    const d = json.data || {};
    const similarity = clamp01(typeof d.similarity === 'number' ? d.similarity : 0);
    const liveness = clamp01(typeof d.liveness === 'number' ? d.liveness : 0);
    const score = typeof d.score === 'number' ? clamp01(d.score / 100) : (similarity + liveness) / 2;
    const passed = computePassed(similarity, liveness, this.similarityThreshold, this.livenessThreshold);
    const riskLevel = computeRiskLevel(similarity, liveness);
    return {
      passed,
      confidence: score,
      similarity,
      livenessScore: liveness,
      riskLevel,
      reason: d.reason || d.riskTag,
      rawResponse: json,
    };
  }

  // --------------------------------------------------------------------------
  // 内部：Mock
  // --------------------------------------------------------------------------

  private mockVerify(
    mediaUrl: string,
    idCardNumber: string,
    name: string,
    mode: 'video' | 'photo',
  ): FaceVerificationResult {
    const url = mediaUrl.toLowerCase();
    // 故意构造的失败场景
    if (url.includes('fail') || url.includes('attack') || url.includes('replay')) {
      return {
        passed: false,
        confidence: 0.3,
        similarity: 0.5,
        livenessScore: 0.4,
        riskLevel: 'high',
        reason: '检测到活体异常',
        rawResponse: { mock: true, mode, code: 200, msg: 'OK', data: { pass: false, score: 30, similarity: 0.5, liveness: 0.4, reason: 'liveness_attack' } },
      };
    }
    if (url.includes('medium') || url.includes('borderline')) {
      return {
        passed: false,
        confidence: 0.65,
        similarity: 0.75,
        livenessScore: 0.78,
        riskLevel: 'medium',
        reason: '相似度或活体分数不达要求',
        rawResponse: { mock: true, mode, code: 200, msg: 'OK' },
      };
    }
    // 默认通过
    return {
      passed: true,
      confidence: 0.96,
      similarity: 0.93,
      livenessScore: 0.97,
      riskLevel: 'low',
      rawResponse: { mock: true, mode, code: 200, msg: 'OK', data: { pass: true, score: 96, similarity: 0.93, liveness: 0.97 } },
    };
  }

  // --------------------------------------------------------------------------
  // 工具
  // --------------------------------------------------------------------------

  private delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}

// ============================================================================
// 公共工具（供 KycService 复用）
// ============================================================================

/** 限幅到 [0, 1] */
export const clamp01 = (n: number): number => {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
};

/**
 * 计算是否通过
 *  - similarity >= simThreshold 且 livenessScore >= livenessThreshold → 通过
 *  - 否则不通过
 */
export const computePassed = (
  similarity: number,
  livenessScore: number,
  simThreshold: number = DEFAULT_SIMILARITY_THRESHOLD,
  livenessThreshold: number = DEFAULT_LIVENESS_THRESHOLD,
): boolean => {
  return similarity >= simThreshold && livenessScore >= livenessThreshold;
};

/**
 * 计算风险等级
 *  - low:    similarity >= 0.85 && liveness >= 0.90
 *  - medium: similarity >= 0.70 && liveness >= 0.70
 *  - high:   其他
 */
export const computeRiskLevel = (
  similarity: number,
  livenessScore: number,
): 'low' | 'medium' | 'high' => {
  if (similarity >= 0.85 && livenessScore >= 0.9) return 'low';
  if (similarity >= 0.7 && livenessScore >= 0.7) return 'medium';
  return 'high';
};

const safeText = async (res: Response): Promise<string> => {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
};
