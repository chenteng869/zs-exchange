/**
 * 腾讯云 - 慧眼 FaceID 活体检测客户端
 *
 * 服务：腾讯云慧眼（FaceID）
 * 文档：
 *  - 活体人脸核身（视频 / 数字 / 真人）：https://cloud.tencent.com/document/product/1007
 *  - TC3-HMAC-SHA256 签名：https://cloud.tencent.com/document/api/1721/101843
 *
 * 鉴权：SecretId + SecretKey，使用腾讯云 API 3.0 签名（TC3-HMAC-SHA256）
 * 端点：https://faceid.tencentcloudapi.com/
 * Action：
 *  - DetectLiveFace (数字活体 - 单图 / 视频)
 *  - LivenessRecognition (视频活体核身)
 *
 * 演示降级：SecretId 含 'mock' 子串时返回 mock 数据
 *
 * @module lib/kyc/liveness/tencent-client
 */

import { createHash, createHmac } from 'node:crypto';

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

export interface TencentLivenessConfig {
  secretId: string;
  secretKey: string;
  /** 地域，默认 ap-guangzhou */
  region?: string;
  threshold?: number;
  timeoutMs?: number;
  retries?: number;
  retryBackoffMs?: number;
  mock?: boolean;
  fetchImpl?: typeof fetch;
}

interface SignParams {
  method: string;
  uri: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  service: string;
  secretId: string;
  secretKey: string;
  timestamp?: number;
  date?: string;
}

interface SignedRequest {
  headers: Record<string, string>;
  payload: string;
}

// ============================================================================
// 端点
// ============================================================================

const TENCENT_FACEID_HOST = 'faceid.tencentcloudapi.com';
const TENCENT_FACEID_SERVICE = 'faceid';
const TENCENT_FACEID_API_VERSION = '2018-03-01';
const TENCENT_FACEID_REGION = 'ap-guangzhou';

const TENCENT_ENDPOINTS = {
  host: TENCENT_FACEID_HOST,
  /** 数字活体（视频 / 图片） */
  detectLiveFace: `/`,
  /** 视频活体 + 实名核身 */
  livenessRecognition: `/`,
  /** 人脸比对 */
  faceCompare: `/`,
};

// ============================================================================
// 客户端
// ============================================================================

/**
 * 腾讯云慧眼活体检测客户端
 *
 * 使用示例：
 * ```ts
 * const client = new TencentLivenessClient({
 *   secretId: process.env.TENCENT_SECRET_ID!,
 *   secretKey: process.env.TENCENT_SECRET_KEY!,
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
export class TencentLivenessClient {
  private readonly secretId: string;
  private readonly secretKey: string;
  private readonly region: string;
  private readonly threshold: number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBackoffMs: number;
  private readonly mock: boolean;
  private readonly fetchImpl: typeof fetch;

  constructor(config: TencentLivenessConfig) {
    if (!config) {
      throw new KycError('KYC_TENCENT_CONFIG', 'TencentLivenessClient config is required');
    }
    this.secretId = config.secretId || '';
    this.secretKey = config.secretKey || '';
    this.region = config.region || TENCENT_FACEID_REGION;
    this.threshold = config.threshold ?? LIVENESS_DEFAULT_THRESHOLD;
    this.timeoutMs = config.timeoutMs ?? LIVENESS_DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? LIVENESS_MAX_RETRIES;
    this.retryBackoffMs = config.retryBackoffMs ?? 500;
    this.mock = !!config.mock || this._isMockKey(this.secretId);
    this.fetchImpl =
      config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (null as any));
    if (!this.mock && !this.fetchImpl) {
      throw new KycError(
        'KYC_TENCENT_NO_FETCH',
        'No fetch implementation available (Node >= 18 required)',
      );
    }
  }

  // --------------------------------------------------------------------------
  // 公共 API
  // --------------------------------------------------------------------------

  /** 视频活体检测（DetectLiveFace + VideoBase64） */
  public async verifyWithVideo(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'TENCENT',
        ...this.mockResult(opts, 'video'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'video');
    const payload = this._buildDetectLiveFacePayload(opts);
    const signed = this._signRequest({
      method: 'POST',
      uri: '/',
      query: {},
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      service: TENCENT_FACEID_SERVICE,
      secretId: this.secretId,
      secretKey: this.secretKey,
    });
    const data = await this._callWithRetry(signed);
    return {
      provider: 'TENCENT',
      ...this._parseDetectLiveFace(data),
      latencyMs: Date.now() - started,
    };
  }

  /** 静默活体（数字活体，DetectLiveFace + ImageBase64） */
  public async verifyWithImage(opts: LivenessRequest): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'TENCENT',
        ...this.mockResult(opts, 'image'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'image');
    const payload = this._buildDetectLiveFacePayload(opts);
    const signed = this._signRequest({
      method: 'POST',
      uri: '/',
      query: {},
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      service: TENCENT_FACEID_SERVICE,
      secretId: this.secretId,
      secretKey: this.secretKey,
    });
    const data = await this._callWithRetry(signed);
    return {
      provider: 'TENCENT',
      ...this._parseDetectLiveFace(data),
      latencyMs: Date.now() - started,
    };
  }

  /** 视频活体 + 实名核身（LivenessRecognition） */
  public async livenessWithIdCard(
    opts: LivenessRequest,
  ): Promise<LivenessResult> {
    const started = Date.now();
    if (this.mock) {
      return {
        provider: 'TENCENT',
        ...this.mockResult(opts, 'video'),
        latencyMs: Date.now() - started,
      };
    }
    this._assertRequest(opts, 'video');
    if (!opts.idCardNumber || !opts.name) {
      throw new KycError('KYC_TENCENT_ID', 'idCardNumber + name required');
    }
    const payload = {
      VideoBase64: opts.videoBase64 || '',
      IdCard: opts.idCardNumber,
      Name: opts.name,
      LivenessType: 'ACTION',
    };
    const signed = this._signRequest({
      method: 'POST',
      uri: '/',
      query: {},
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      service: TENCENT_FACEID_SERVICE,
      secretId: this.secretId,
      secretKey: this.secretKey,
    });
    const data = await this._callWithRetry(signed, 'LivenessRecognition');
    return {
      provider: 'TENCENT',
      ...this._parseLivenessRecognition(data),
      latencyMs: Date.now() - started,
    };
  }

  public isMock(): boolean {
    return this.mock;
  }

  // --------------------------------------------------------------------------
  // TC3-HMAC-SHA256 签名（公开，便于测试断言）
  // --------------------------------------------------------------------------

  /**
   * TC3-HMAC-SHA256 签名
   * 官方文档：https://cloud.tencent.com/document/api/1721/101843
   */
  public signRequest(p: SignParams): SignedRequest {
    return this._signRequest(p);
  }

  // --------------------------------------------------------------------------
  // 内部：远端调用 + 重试
  // --------------------------------------------------------------------------

  private async _callWithRetry(
    signed: SignedRequest,
    action: string = 'DetectLiveFace',
  ): Promise<any> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        return await this._callOnce(signed, action);
      } catch (err) {
        lastError = err;
        if (
          err instanceof KycError &&
          (err.code === 'KYC_TENCENT_AUTH' || err.code === 'KYC_TENCENT_BAD_REQUEST')
        ) {
          throw err;
        }
        if (attempt < this.retries - 1) {
          await this._delay(this.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }
    throw new KycError(
      'KYC_TENCENT_RETRIES',
      `Tencent liveness failed after ${this.retries} attempts`,
      502,
      { cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  private async _callOnce(signed: SignedRequest, action: string): Promise<any> {
    const url = `https://${TENCENT_FACEID_HOST}/`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: signed.headers,
        body: signed.payload,
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) {
        throw new KycError(
          'KYC_TENCENT_AUTH',
          `Tencent auth rejected: HTTP ${res.status}`,
          502,
        );
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await safeText(res);
        throw new KycError(
          'KYC_TENCENT_BAD_REQUEST',
          `Tencent 4xx: HTTP ${res.status} ${text}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError('KYC_TENCENT_5XX', `Tencent 5xx: HTTP ${res.status}`, 502);
      }
      const json: any = await res.json();
      if (json?.Response?.Error) {
        const e = json.Response.Error;
        if (e.Code === 'AuthFailure.SignatureFailure' || e.Code === 'AuthFailure.InvalidSecretId') {
          throw new KycError('KYC_TENCENT_AUTH', `Tencent signature error: ${e.Message}`, 502, { raw: e });
        }
        throw new KycError(
          'KYC_TENCENT_REMOTE_FAIL',
          `Tencent ${action} error: ${e.Code} ${e.Message}`,
          502,
          { raw: e },
        );
      }
      return json?.Response || json;
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_TENCENT_TIMEOUT', `Tencent timeout`, 504);
      }
      throw new KycError(
        'KYC_TENCENT_NETWORK',
        `Tencent network error: ${(err as Error).message}`,
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
      throw new KycError('KYC_TENCENT_USER', 'userId is required');
    }
    if (mode === 'video' && !opts.videoBase64 && !opts.videoUrl) {
      throw new KycError('KYC_TENCENT_VIDEO', 'videoBase64 or videoUrl required');
    }
    if (mode === 'image' && !opts.imageBase64 && !opts.imageUrl) {
      throw new KycError('KYC_TENCENT_IMAGE', 'imageBase64 or imageUrl required');
    }
  }

  private _buildDetectLiveFacePayload(opts: LivenessRequest): Record<string, any> {
    const isVideo = !!opts.videoBase64 || !!opts.videoUrl;
    if (isVideo) {
      return {
        VideoBase64: opts.videoBase64,
        VideoUrl: opts.videoUrl,
        LivenessType: 'ACTION',
        ValidateData: opts.actions?.length
          ? JSON.stringify({ ActionList: opts.actions })
          : undefined,
      };
    }
    return {
      ImageBase64: opts.imageBase64,
      ImageUrl: opts.imageUrl,
      LivenessType: 'SILENT',
    };
  }

  private _parseDetectLiveFace(
    data: any,
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    const result = data?.Result || data;
    const livenessScore = clamp01((result?.Score || 0) / 100);
    const similarity = clamp01((result?.Sim || 0) / 100);
    const passed =
      livenessScore >= this.threshold ||
      (similarity > 0 && similarity >= this.threshold);
    return {
      passed,
      confidence: Math.max(livenessScore, similarity),
      similarity,
      livenessScore,
      riskLevel: computeLivenessRisk(similarity, livenessScore),
      reason: passed ? undefined : result?.Description || 'Liveness score too low',
      details: {
        spoof: result?.IsLiveness === false,
        faceDetected: !!result?.FaceModelVersion,
        faceQuality: clamp01((result?.Quality || 0) / 100),
      },
      rawResponse: data,
    };
  }

  private _parseLivenessRecognition(
    data: any,
  ): Omit<LivenessResult, 'provider' | 'latencyMs'> {
    const result = data?.Result || data;
    const livenessScore = clamp01((result?.Score || 0) / 100);
    const similarity = clamp01((result?.Sim || 0) / 100);
    const passed = livenessScore >= this.threshold && similarity >= this.threshold;
    return {
      passed,
      confidence: (livenessScore + similarity) / 2,
      similarity,
      livenessScore,
      riskLevel: computeLivenessRisk(similarity, livenessScore),
      reason: passed ? undefined : result?.Description,
      details: {
        spoof: !result?.IsLiveness,
        faceDetected: true,
        faceQuality: clamp01((result?.Quality || 0) / 100),
        matchedFields: [optsMatched(result)],
      },
      rawResponse: data,
    };
  }

  // --------------------------------------------------------------------------
  // 内部：TC3 签名
  // --------------------------------------------------------------------------

  private _signRequest(p: SignParams): SignedRequest {
    const method = (p.method || 'POST').toUpperCase();
    const uri = p.uri || '/';
    const query = p.query || {};
    const headers: Record<string, string> = {
      ...(p.headers || {}),
      Host: TENCENT_FACEID_HOST,
    };
    const body = p.body || '';
    const service = p.service;
    const secretId = p.secretId;
    const secretKey = p.secretKey;

    const now = p.timestamp ?? Math.floor(Date.now() / 1000);
    const date = p.date ?? new Date(now * 1000).toISOString().slice(0, 10);

    // 1. payload hash
    const hashedRequestPayload = sha256Hex(body);

    // 2. canonical headers
    const canonicalHeaders = buildCanonicalHeaders(headers);

    // 3. signed headers
    const signedHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .join(';');

    // 4. canonical request
    const queryString = canonicalQueryString(query);
    const canonicalRequest = [method, uri, queryString, canonicalHeaders, signedHeaders, hashedRequestPayload].join('\n');

    // 5. string to sign
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = sha256Hex(canonicalRequest);
    const stringToSign = ['TC3-HMAC-SHA256', String(now), credentialScope, hashedCanonicalRequest].join('\n');

    // 6. derived key
    const secretDate = hmac256(`TC3${secretKey}`, date);
    const secretService = hmac256(secretDate, service);
    const secretSigning = hmac256(secretService, 'tc3_request');
    const signature = hmac256Hex(secretSigning, stringToSign);

    // 7. authorization
    const authorization =
      `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const out: Record<string, string> = {
      ...headers,
      Authorization: authorization,
      'X-TC-Action': headers['X-TC-Action'] || 'DetectLiveFace',
      'X-TC-Timestamp': String(now),
      'X-TC-Version': headers['X-TC-Version'] || TENCENT_FACEID_API_VERSION,
      'X-TC-Region': headers['X-TC-Region'] || this.region,
    };
    return { headers: out, payload: body };
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
        confidence: 0.35,
        similarity: 0.42,
        livenessScore: 0.38,
        riskLevel: 'high',
        reason: 'Spoofing detected (tencent mock)',
        details: { spoof: true, faceDetected: true, faceQuality: 0.4 },
        rawResponse: { mock: true, provider: 'TENCENT', mode, passed: false },
      };
    }
    return {
      passed: true,
      confidence: 0.96,
      similarity: 0.94,
      livenessScore: 0.97,
      riskLevel: 'low',
      details: { spoof: false, faceDetected: true, faceQuality: 0.94 },
      rawResponse: { mock: true, provider: 'TENCENT', mode, passed: true },
    };
  }

  private _isMockKey(k: string): boolean {
    return typeof k === 'string' && k.toLowerCase().includes('mock');
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }
}

// ============================================================================
// 工具函数（导出便于单元测试对照官方示例）
// ============================================================================

export function sha256Hex(s: string | Buffer): string {
  return createHash('sha256').update(s).digest('hex');
}

export function hmac256(key: string | Buffer, data: string | Buffer): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

export function hmac256Hex(key: string | Buffer, data: string | Buffer): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

/**
 * 构造 CanonicalQueryString
 *  - 按 key 字典序升序
 *  - URL 编码 key / value
 */
export function canonicalQueryString(qs: Record<string, string>): string {
  const keys = Object.keys(qs).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(qs[k])}`)
    .join('&');
}

/**
 * 构造 CanonicalHeaders
 *  - key 转小写
 *  - 多值折叠为单个空格
 *  - 行末 \n
 */
export function buildCanonicalHeaders(headers: Record<string, string>): string {
  const sorted = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort();
  return sorted
    .map((k) => {
      const v = String(headers[k] ?? '').trim().replace(/\s+/g, ' ');
      return `${k}:${v}\n`;
    })
    .join('');
}

const safeText = async (res: Response): Promise<string> => {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
};

function optsMatched(r: any): string {
  const arr: string[] = [];
  if (r?.IdCardMatch) arr.push('id_card_number');
  if (r?.NameMatch) arr.push('name');
  return arr.join(',');
}

export const TENCENT_FACEID_API = TENCENT_ENDPOINTS;
