/**
 * 旷视科技（Face++）- 活体检测客户端
 *
 * 服务：Face++ 金融级活体 / 人脸核身
 * 文档：https://console.faceplusplus.com.cn/documents/10078823
 *
 * 鉴权：API Key + API Secret 拼接为 Basic Auth
 *   Authorization: Basic base64(api_key:api_secret)
 * 端点：
 *   视频活体: https://api.megvii.com/faceid/v1/faceverify
 *   图片活体: https://api.megvii.com/faceid/v1/imageverify
 *   人脸比对: https://api.megvii.com/facepp/v3/compare
 *
 * 演示降级：API Key 含 'mock' 子串时返回 mock 数据
 *
 * @module lib/kyc/liveness/megvii-client
 */

import { KycError } from '@/lib/auth/errors';
import {
  _internal,
  LIVENESS_DEFAULT_THRESHOLD,
  LIVENESS_DEFAULT_TIMEOUT_MS,
  LIVENESS_MAX_RETRIES,
  type LivenessRequest,
  type LivenessResult,
} from './types';

const { clamp01, computeLivenessRisk } = _internal;

// ============================================================================
// 类型
// ============================================================================

export interface MegviiLivenessConfig {
  apiKey: string;
  apiSecret: string;
  /** 通过阈值（0-1），默认 0.85 */
  threshold?: number;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  mock?: boolean;
  fetchImpl?: typeof fetch;
}

// ============================================================================
// 端点
// ============================================================================

const MEGVII_BASE = 'https://api.megvii.com';
const MEGVII_FACE_VIDEO_URL = `${MEGVII_BASE}/faceid/v1/faceverify`;
const MEGVII_FACE_IMAGE_URL = `${MEGVII_BASE}/faceid/v1/imageverify`;
const MEGVII_FACE_COMPARE_URL = `${MEGVII_BASE}/facepp/v3/compare`;

// ============================================================================
// 客户端
// ============================================================================

/**
 * 旷视科技 Face++ 活体检测客户端
 *
 * 使用示例：
 * ```ts
 * const client = new MegviiLivenessClient({
 *   apiKey: process.env.MEGVII_API_KEY!,
 *   apiSecret: process.env.MEGVII_API_SECRET!,
 * });
 * const result = await client.verifyWithVideo({
 *   userId: 'u1',
 *   type: 'video',
 *   videoBase64: '...',
 *   idCardNumber: '110101199003073116',
 *   name: '张三',
 * });
 * ```
 */
export class MegviiLivenessClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly threshold: number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBackoffMs: number;
  private readonly mock: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly authHeader: string;

  constructor(config: MegviiLivenessConfig) {
    if (!config) {
      throw new KycError('KYC_MEGVII_CONFIG', 'MegviiLivenessClient config is required');
    }
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
    this.threshold = config.threshold ?? LIVENESS_DEFAULT_THRESHOLD;
    this.timeoutMs = config.timeoutMs ?? LIVENESS_DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? LIVENESS_MAX_RETRIES;
    this.retryBackoffMs = config.retryBackoffMs ?? 500;
    this.mock = !!config.mock || this._isMockKey(this.apiKey);
    this.fetchImpl =
      config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (null as any));
    this.authHeader = `Basic ${this._basicAuth(this.apiKey, this.apiSecret)}`;
    if (!this.mock && !this.fetchImpl) {
      throw new KycError(
        'KYC_MEGVII_NO_FETCH',
        'No fetch implementation available (Node >= 18 required)',
      );
    }
  }

  // --------------------------------------------------------------------------
  // 公共 API
  // --------------------------------------------------------------------------

  /** 视频活体检测（faceid/v1/faceverify） */
  public async verifyWithVideo(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'MEGVII',
        ...this.mockResult(opts, 'video'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'video');
    const form = this._buildFaceverifyForm(opts);
    const data = await this._callWithRetry(MEGVII_FACE_VIDEO_URL, form);
    return {
      provider: 'MEGVII',
      ...this._parseFaceverify(data),
      latencyMs: Date.now() - started,
    };
  }

  /** 图片活体检测（faceid/v1/imageverify） */
  public async verifyWithImage(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'MEGVII',
        ...this.mockResult(opts, 'image'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'image');
    const form = this._buildImageverifyForm(opts);
    const data = await this._callWithRetry(MEGVII_FACE_IMAGE_URL, form);
    return {
      provider: 'MEGVII',
      ...this._parseImageverify(data),
      latencyMs: Date.now() - started,
    };
  }

  /** 人脸 1:1 比对（facepp/v3/compare） */
  public async compareFaces(
    faceA: { url?: string; base64?: string },
    faceB: { url?: string; base64?: string },
  ): Promise<{ score: number; rawResponse: any }> {
    if (this.mock) {
      return { score: 0.94, rawResponse: { mock: true } };
    }
    const form = new URLSearchParams();
    if (faceA.base64) form.set('image_base64_1', faceA.base64);
    else if (faceA.url) form.set('image_url1', faceA.url);
    if (faceB.base64) form.set('image_base64_2', faceB.base64);
    else if (faceB.url) form.set('image_url2', faceB.url);
    const data = await this._callWithRetry(MEGVII_FACE_COMPARE_URL, form);
    const score = clamp01(
      typeof data?.confidence === 'number' ? data.confidence / 100 : 0,
    );
    return { score, rawResponse: data };
  }

  /** 暴露 Authorization 头（测试用） */
  public getAuthHeader(): string {
    return this.authHeader;
  }

  public isMock(): boolean {
    return this.mock;
  }

  // --------------------------------------------------------------------------
  // 内部：远端调用 + 重试
  // --------------------------------------------------------------------------

  private async _callWithRetry(url: string, form: URLSearchParams): Promise<any> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        return await this._callOnce(url, form);
      } catch (err) {
        lastError = err;
        if (
          err instanceof KycError &&
          (err.code === 'KYC_MEGVII_AUTH' || err.code === 'KYC_MEGVII_BAD_REQUEST')
        ) {
          throw err;
        }
        if (attempt < this.retries - 1) {
          await this._delay(this.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }
    throw new KycError(
      'KYC_MEGVII_RETRIES',
      `Megvii liveness failed after ${this.retries} attempts`,
      502,
      { cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  private async _callOnce(url: string, form: URLSearchParams): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        throw new KycError(
          'KYC_MEGVII_AUTH',
          `Megvii auth rejected: HTTP ${res.status}`,
          502,
        );
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await safeText(res);
        throw new KycError(
          'KYC_MEGVII_BAD_REQUEST',
          `Megvii 4xx: HTTP ${res.status} ${text}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError('KYC_MEGVII_5XX', `Megvii 5xx: HTTP ${res.status}`, 502);
      }
      const json = await res.json();
      if (json?.error_message) {
        throw new KycError(
          'KYC_MEGVII_REMOTE_FAIL',
          `Megvii error: ${json.error_message}`,
          502,
          { raw: json },
        );
      }
      return json;
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_MEGVII_TIMEOUT', `Megvii timeout`, 504);
      }
      throw new KycError(
        'KYC_MEGVII_NETWORK',
        `Megvii network error: ${(err as Error).message}`,
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // --------------------------------------------------------------------------
  // 内部：请求体 / 响应解析
  // --------------------------------------------------------------------------

  private _assertRequest(opts: LivenessRequest, mode: 'video' | 'image'): void {
    if (!opts.userId) {
      throw new KycError('KYC_MEGVII_USER', 'userId is required');
    }
    if (mode === 'video' && !opts.videoBase64 && !opts.videoUrl) {
      throw new KycError('KYC_MEGVII_VIDEO', 'videoBase64 or videoUrl required');
    }
    if (mode === 'image' && !opts.imageBase64 && !opts.imageUrl) {
      throw new KycError('KYC_MEGVII_IMAGE', 'imageBase64 or imageUrl required');
    }
  }

  private _buildFaceverifyForm(opts: LivenessRequest): URLSearchParams {
    const form = new URLSearchParams();
    if (opts.videoBase64) form.set('video_base64', opts.videoBase64);
    else if (opts.videoUrl) form.set('video_url', opts.videoUrl);
    if (opts.idCardNumber) form.set('idcard_number', opts.idCardNumber);
    if (opts.name) form.set('idcard_name', opts.name);
    if (opts.refImageUrl) form.set('image_ref1', opts.refImageUrl);
    return form;
  }

  private _buildImageverifyForm(opts: LivenessRequest): URLSearchParams {
    const form = new URLSearchParams();
    if (opts.imageBase64) form.set('image_base64', opts.imageBase64);
    else if (opts.imageUrl) form.set('image_url', opts.imageUrl);
    if (opts.idCardNumber) form.set('idcard_number', opts.idCardNumber);
    if (opts.name) form.set('idcard_name', opts.name);
    return form;
  }

  private _parseFaceverify(
    data: any,
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    const livenessScore = clamp01(
      typeof data?.liveness_result === 'number' ? data.liveness_result / 100 : 0,
    );
    const similarity = clamp01(
      typeof data?.confidence === 'number' ? data.confidence / 100 : 0,
    );
    const passed = livenessScore >= this.threshold && similarity >= this.threshold;
    const matched: string[] = [];
    if (data?.idcard_number_match === true) matched.push('id_card_number');
    if (data?.idcard_name_match === true) matched.push('name');
    return {
      passed,
      confidence: (livenessScore + similarity) / 2,
      similarity,
      livenessScore,
      riskLevel: computeLivenessRisk(similarity, livenessScore),
      reason: passed ? undefined : data?.risk_info || 'Megvii: liveness/sim too low',
      details: {
        spoof: data?.liveness_result != null && data.liveness_result < 50,
        faceDetected: !!data?.face_detected,
        faceQuality: clamp01((data?.face_quality?.score || 0) / 100),
        matchedFields: matched,
      },
      rawResponse: data,
    };
  }

  private _parseImageverify(
    data: any,
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    const livenessScore = clamp01(
      typeof data?.liveness_result === 'number' ? data.liveness_result / 100 : 0,
    );
    const similarity = clamp01(
      typeof data?.confidence === 'number' ? data.confidence / 100 : 0,
    );
    const passed = livenessScore >= this.threshold && similarity >= this.threshold;
    return {
      passed,
      confidence: (livenessScore + similarity) / 2,
      similarity,
      livenessScore,
      riskLevel: computeLivenessRisk(similarity, livenessScore),
      reason: passed ? undefined : data?.risk_info,
      details: {
        spoof: data?.liveness_result != null && data.liveness_result < 50,
        faceDetected: !!data?.face_detected,
        faceQuality: clamp01((data?.face_quality?.score || 0) / 100),
      },
      rawResponse: data,
    };
  }

  // --------------------------------------------------------------------------
  // 内部：工具
  // --------------------------------------------------------------------------

  private _basicAuth(apiKey: string, apiSecret: string): string {
    if (typeof btoa === 'function') {
      return btoa(`${apiKey}:${apiSecret}`);
    }
    return Buffer.from(`${apiKey}:${apiSecret}`, 'utf8').toString('base64');
  }

  private _isMockKey(k: string): boolean {
    return typeof k === 'string' && k.toLowerCase().includes('mock');
  }

  private mockResult(
    opts: LivenessRequest,
    mode: 'video' | 'image',
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    const url = (
      opts.videoUrl ||
      opts.imageUrl ||
      ''
    ).toLowerCase();
    if (url.includes('fail') || url.includes('attack')) {
      return {
        passed: false,
        confidence: 0.3,
        similarity: 0.4,
        livenessScore: 0.35,
        riskLevel: 'high',
        reason: '检测到活体异常（megvii mock）',
        details: { spoof: true, faceDetected: true, faceQuality: 0.4 },
        rawResponse: { mock: true, provider: 'MEGVII', mode, passed: false },
      };
    }
    return {
      passed: true,
      confidence: 0.95,
      similarity: 0.93,
      livenessScore: 0.97,
      riskLevel: 'low',
      details: { spoof: false, faceDetected: true, faceQuality: 0.93, matchedFields: ['id_card_number', 'name'] },
      rawResponse: { mock: true, provider: 'MEGVII', mode, passed: true },
    };
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}

const safeText = async (res: Response): Promise<string> => {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
};

export const MEGVII_ENDPOINTS = {
  base: MEGVII_BASE,
  faceVideo: MEGVII_FACE_VIDEO_URL,
  faceImage: MEGVII_FACE_IMAGE_URL,
  faceCompare: MEGVII_FACE_COMPARE_URL,
};
