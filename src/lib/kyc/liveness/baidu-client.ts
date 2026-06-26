/**
 * 百度智能云 - 活体检测客户端
 *
 * 文档：
 *  - 人脸实名认证（V3）：https://cloud.baidu.com/doc/FACE/s/Vk37c1k7c
 *  - 在线 API：人脸检测 v3 / 人脸对比 v3
 *  - OAuth Token：https://ai.baidu.com/ai-doc/REFERENCE/Ck3dwjhu3
 *
 * 鉴权：client_id + client_secret → access_token（30 天有效，缓存 29 天）
 * 端点：
 *   token  : https://aip.baidubce.com/oauth/2.0/token
 *   视频活体: https://aip.baidubce.com/rest/2.0/face/v1/faceverify
 *   图片活体: https://aip.baidubce.com/rest/2.0/face/v3/faceverify
 *   1:N 检索: https://aip.baidubce.com/rest/2.0/face/v3/search
 *
 * 演示降级：API Key 含 'mock' 子串时返回 mock 数据
 *
 * @module lib/kyc/liveness/baidu-client
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

export interface BaiduLivenessConfig {
  apiKey: string;
  secretKey: string;
  /** 通过阈值（0-1），默认 0.85 */
  threshold?: number;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  /** 强制 mock */
  mock?: boolean;
  /** 注入 fetch（测试用） */
  fetchImpl?: typeof fetch;
  /** 强制 token 失效（测试用） */
  forceTokenRefresh?: boolean;
}

interface BaiduTokenCache {
  token: string;
  expiresAt: number;
}

// ============================================================================
// 端点
// ============================================================================

const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_FACE_VIDEO_URL = 'https://aip.baidubce.com/rest/2.0/face/v1/faceverify';
const BAIDU_FACE_IMAGE_URL = 'https://aip.baidubce.com/rest/2.0/face/v3/faceverify';
const BAIDU_FACE_SEARCH_URL = 'https://aip.baidubce.com/rest/2.0/face/v3/search';
const BAIDU_FACE_MATCH_URL = 'https://aip.baidubce.com/rest/2.0/face/v3/match';

// ============================================================================
// 客户端
// ============================================================================

/**
 * 百度智能云活体检测客户端
 *
 * 使用示例：
 * ```ts
 * const client = new BaiduLivenessClient({
 *   apiKey: process.env.BAIDU_API_KEY!,
 *   secretKey: process.env.BAIDU_SECRET_KEY!,
 * });
 * const result = await client.verifyWithVideo({
 *   userId: 'u1',
 *   type: 'video',
 *   videoUrl: 'https://oss.example.com/liveness.mp4',
 *   idCardNumber: '110101199003073116',
 *   name: '张三',
 * });
 * ```
 */
export class BaiduLivenessClient {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly threshold: number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBackoffMs: number;
  private readonly mock: boolean;
  private readonly fetchImpl: typeof fetch;
  private tokenCache: BaiduTokenCache | null = null;
  private forceTokenRefresh: boolean;

  constructor(config: BaiduLivenessConfig) {
    if (!config) {
      throw new KycError('KYC_BAIDU_CONFIG', 'BaiduLivenessClient config is required');
    }
    this.apiKey = config.apiKey || '';
    this.secretKey = config.secretKey || '';
    this.threshold = config.threshold ?? LIVENESS_DEFAULT_THRESHOLD;
    this.timeoutMs = config.timeoutMs ?? LIVENESS_DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? LIVENESS_MAX_RETRIES;
    this.retryBackoffMs = config.retryBackoffMs ?? 500;
    this.mock = !!config.mock || this._isMockKey(this.apiKey);
    this.fetchImpl =
      config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (null as any));
    this.forceTokenRefresh = !!config.forceTokenRefresh;

    if (!this.mock && !this.fetchImpl) {
      throw new KycError(
        'KYC_BAIDU_NO_FETCH',
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
  public async verifyWithVideo(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'BAIDU',
        ...this.mockResult(opts, 'video'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'video');
    const token = await this._getToken();
    const body = this._buildVideoBody(opts);
    const data = await this._callWithRetry(BAIDU_FACE_VIDEO_URL, token, body);
    return {
      provider: 'BAIDU',
      ...this._parseResponse(data, opts, 'video'),
      latencyMs: Date.now() - started,
    };
  }

  /**
   * 图片活体检测（静默）
   */
  public async verifyWithImage(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'BAIDU',
        ...this.mockResult(opts, 'image'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'image');
    const token = await this._getToken();
    const body = this._buildImageBody(opts);
    const data = await this._callWithRetry(BAIDU_FACE_IMAGE_URL, token, body);
    return {
      provider: 'BAIDU',
      ...this._parseResponse(data, opts, 'image'),
      latencyMs: Date.now() - started,
    };
  }

  /**
   * 人脸 1:1 比对
   */
  public async compareFaces(
    faceA: { url?: string; base64?: string },
    faceB: { url?: string; base64?: string },
  ): Promise<{ score: number; rawResponse: any }> {
    if (this.mock) {
      return { score: 0.93, rawResponse: { mock: true } };
    }
    const token = await this._getToken();
    const body: any[] = [
      this._faceObject(faceA),
      this._faceObject(faceB),
    ];
    const data = await this._callWithRetry(BAIDU_FACE_MATCH_URL, token, body, 'json');
    const score = clamp01(typeof data?.result?.score === 'number' ? data.result.score / 100 : 0);
    return { score, rawResponse: data };
  }

  public isMock(): boolean {
    return this.mock;
  }

  // --------------------------------------------------------------------------
  // 内部：鉴权
  // --------------------------------------------------------------------------

  private async _getToken(): Promise<string> {
    const now = Date.now();
    if (
      this.tokenCache &&
      !this.forceTokenRefresh &&
      this.tokenCache.expiresAt > now + 60_000
    ) {
      return this.tokenCache.token;
    }
    this.forceTokenRefresh = false;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.apiKey,
      client_secret: this.secretKey,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(BAIDU_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        throw new KycError(
          'KYC_BAIDU_AUTH',
          `Baidu auth rejected: HTTP ${res.status}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError('KYC_BAIDU_AUTH_5XX', `Baidu auth 5xx: HTTP ${res.status}`, 502);
      }
      const json: any = await res.json();
      if (!json?.access_token) {
        throw new KycError(
          'KYC_BAIDU_AUTH_BAD',
          `Baidu auth missing access_token: ${JSON.stringify(json).slice(0, 200)}`,
          502,
          { raw: json },
        );
      }
      const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 2592000; // 30 天
      // 缓存 29 天
      this.tokenCache = {
        token: json.access_token,
        expiresAt: now + Math.min(expiresIn, 29 * 24 * 3600) * 1000,
      };
      return this.tokenCache.token;
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_BAIDU_TIMEOUT', `Baidu auth timeout`, 504);
      }
      throw new KycError(
        'KYC_BAIDU_AUTH_NET',
        `Baidu auth network error: ${(err as Error).message}`,
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /** 测试用：清除 token 缓存 */
  public _clearTokenCache(): void {
    this.tokenCache = null;
  }

  // --------------------------------------------------------------------------
  // 内部：远端调用 + 重试
  // --------------------------------------------------------------------------

  private async _callWithRetry(
    url: string,
    token: string,
    body: any,
    bodyType: 'form' | 'json' = 'form',
  ): Promise<any> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        return await this._callOnce(url, token, body, bodyType);
      } catch (err) {
        lastError = err;
        // 鉴权失败 / 4xx 不重试
        if (
          err instanceof KycError &&
          (err.code === 'KYC_BAIDU_AUTH' ||
            err.code === 'KYC_BAIDU_BAD_REQUEST' ||
            err.code === 'KYC_BAIDU_REMOTE_FAIL')
        ) {
          // token 过期时清缓存，下一次重试会自动重取 token
          if (err.code === 'KYC_BAIDU_AUTH') {
            this.tokenCache = null;
          }
          // 不可重试错误直接抛
          if (err.code !== 'KYC_BAIDU_AUTH') {
            throw err;
          }
        }
        if (attempt < this.retries - 1) {
          await this._delay(this.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }
    throw new KycError(
      'KYC_BAIDU_RETRIES',
      `Baidu liveness failed after ${this.retries} attempts`,
      502,
      { cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  private async _callOnce(
    url: string,
    token: string,
    body: any,
    bodyType: 'form' | 'json',
  ): Promise<any> {
    const finalUrl = `${url}?access_token=${encodeURIComponent(token)}`;
    const headers: Record<string, string> = {};
    let payload: string;
    if (bodyType === 'json') {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
      payload = JSON.stringify(body);
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      payload =
        body instanceof URLSearchParams
          ? body.toString()
          : new URLSearchParams(body as Record<string, string>).toString();
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(finalUrl, {
        method: 'POST',
        headers,
        body: payload,
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        throw new KycError('KYC_BAIDU_AUTH', `Baidu auth invalid: HTTP ${res.status}`, 502);
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await safeText(res);
        throw new KycError(
          'KYC_BAIDU_BAD_REQUEST',
          `Baidu liveness 4xx: HTTP ${res.status} ${text}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError('KYC_BAIDU_5XX', `Baidu liveness 5xx: HTTP ${res.status}`, 502);
      }
      const json = await res.json();
      if (json && typeof json === 'object' && 'error_code' in json) {
        // 110 / 111 / 216 鉴权失效 → token 错误
        const ec = Number(json.error_code);
        if (ec === 110 || ec === 111 || ec === 216) {
          throw new KycError('KYC_BAIDU_AUTH', `Baidu token expired: ${json.error_msg}`, 502);
        }
        throw new KycError(
          'KYC_BAIDU_REMOTE_FAIL',
          `Baidu liveness error ${ec}: ${json.error_msg}`,
          502,
          { raw: json },
        );
      }
      return json;
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_BAIDU_TIMEOUT', `Baidu liveness timeout`, 504);
      }
      throw new KycError(
        'KYC_BAIDU_NETWORK',
        `Baidu network error: ${(err as Error).message}`,
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
      throw new KycError('KYC_BAIDU_USER', 'userId is required');
    }
    if (mode === 'video' && !opts.videoUrl && !opts.videoBase64) {
      throw new KycError('KYC_BAIDU_VIDEO', 'videoUrl or videoBase64 is required');
    }
    if (mode === 'image' && !opts.imageUrl && !opts.imageBase64) {
      throw new KycError('KYC_BAIDU_IMAGE', 'imageUrl or imageBase64 is required');
    }
  }

  private _buildVideoBody(opts: LivenessRequest): URLSearchParams {
    const body = new URLSearchParams();
    if (opts.videoBase64) body.set('video_base64', opts.videoBase64);
    else if (opts.videoUrl) body.set('video', opts.videoUrl);
    if (opts.idCardNumber) body.set('id_card_number', opts.idCardNumber);
    if (opts.name) body.set('name', opts.name);
    if (opts.refImageUrl) body.set('id_card_image', opts.refImageUrl);
    if (opts.refImageBase64) body.set('id_card_image_base64', opts.refImageBase64);
    body.set('max_face_num', '1');
    return body;
  }

  private _buildImageBody(opts: LivenessRequest): URLSearchParams {
    const body = new URLSearchParams();
    if (opts.imageBase64) body.set('image', opts.imageBase64);
    else if (opts.imageUrl) body.set('image', opts.imageUrl);
    if (opts.idCardNumber) body.set('id_card_number', opts.idCardNumber);
    if (opts.name) body.set('name', opts.name);
    if (opts.refImageUrl) body.set('id_card_image', opts.refImageUrl);
    if (opts.refImageBase64) body.set('id_card_image_base64', opts.refImageBase64);
    body.set('face_field', 'quality,spoofing,eye,glasses,face_type');
    return body;
  }

  private _faceObject(face: { url?: string; base64?: string }): any {
    if (face.base64) return { image: face.base64, image_type: 'BASE64' };
    if (face.url) return { image: face.url, image_type: 'URL' };
    throw new KycError('KYC_BAIDU_FACE', 'Face must have url or base64');
  }

  private _parseResponse(
    data: any,
    opts: LivenessRequest,
    mode: 'video' | 'image',
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    // 视频模式
    if (mode === 'video') {
      const passed = data?.result?.face_liveness?.score != null
        ? Number(data.result.face_liveness.score) >= this.threshold * 100
        : false;
      const livenessScore = clamp01(
        typeof data?.result?.face_liveness?.score === 'number'
          ? data.result.face_liveness.score / 100
          : 0,
      );
      const similarity = clamp01(
        typeof data?.result?.face_match?.score === 'number'
          ? data.result.face_match.score / 100
          : 0,
      );
      const risk = computeLivenessRisk(similarity, livenessScore);
      return {
        passed,
        confidence: (livenessScore + similarity) / 2,
        similarity,
        livenessScore,
        riskLevel: risk,
        reason: passed ? undefined : data?.result?.face_liveness?.thresholds?.[0]?.risk_level,
        details: {
          faceDetected: !!data?.result?.face_liveness,
          faceQuality: clamp01((data?.result?.face_liveness?.quality?.score || 0) / 100),
          matchedFields: data?.result?.face_match?.matched_fields || [],
          actionsPassed: data?.result?.face_liveness?.passed_actions,
        },
        rawResponse: data,
      };
    }
    // 图片模式（V3 faceverify）
    const result = data?.result || {};
    const livenessScore = clamp01((result.face_liveness?.score || 0) / 100);
    const similarity = clamp01((result.face_match?.score || 0) / 100);
    const passed = livenessScore >= this.threshold && similarity >= this.threshold;
    return {
      passed,
      confidence: (livenessScore + similarity) / 2,
      similarity,
      livenessScore,
      riskLevel: computeLivenessRisk(similarity, livenessScore),
      reason: result.face_liveness?.thresholds?.[0]?.risk_level,
      details: {
        spoof: result.face_liveness?.spoofing === 1,
        faceDetected: !!result.face_list?.length,
        faceQuality: clamp01((result.quality_control?.score || 0) / 100),
        matchedFields: result.face_match?.matched_fields || [],
      },
      rawResponse: data,
    };
  }

  // --------------------------------------------------------------------------
  // 内部：Mock
  // --------------------------------------------------------------------------

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
        reason: '检测到活体异常（baidu mock）',
        details: { spoof: true, faceDetected: true, faceQuality: 0.4 },
        rawResponse: { mock: true, provider: 'BAIDU', mode, passed: false },
      };
    }
    return {
      passed: true,
      confidence: 0.95,
      similarity: 0.93,
      livenessScore: 0.97,
      riskLevel: 'low',
      details: { spoof: false, faceDetected: true, faceQuality: 0.93, matchedFields: ['id_card_number', 'name'] },
      rawResponse: { mock: true, provider: 'BAIDU', mode, passed: true },
    };
  }

  private _isMockKey(k: string): boolean {
    return typeof k === 'string' && k.toLowerCase().includes('mock');
  }

  // --------------------------------------------------------------------------
  // 工具
  // --------------------------------------------------------------------------

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

// 公开暴露的常量（测试 / 配置使用）
export const BAIDU_ENDPOINTS = {
  token: BAIDU_TOKEN_URL,
  faceVideo: BAIDU_FACE_VIDEO_URL,
  faceImage: BAIDU_FACE_IMAGE_URL,
  search: BAIDU_FACE_SEARCH_URL,
  match: BAIDU_FACE_MATCH_URL,
};
