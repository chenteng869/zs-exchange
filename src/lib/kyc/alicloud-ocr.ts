/**
 * 阿里云身份证 OCR 识别
 *
 * 服务：阿里云云市场 - 身份证识别（cmapi020020）
 * 文档：https://market.aliyun.com/products/57124001/cmapi020020.html
 *
 * 鉴权：APPCODE 方式
 *   Authorization: APPCODE xxxx
 *
 * 请求：
 *   POST {endpoint}
 *   Content-Type: application/x-www-form-urlencoded
 *   Body: image={URL}&side={face|back}
 *
 * 响应（典型）：
 *   { "code": 200, "msg": "OK", "data": { "name": "...", "idNum": "..." } }
 *
 * 演示降级：
 *   - 当 ALIYUN_OCR_APPCODE 未配置时，启用 mock 模式
 *   - mock 模式下返回预设的身份证字段，便于本地 / 单元测试
 *
 * @module lib/kyc/alicloud-ocr
 */

import { KycError } from '@/lib/auth/errors';

// ============================================================================
// 类型
// ============================================================================

/** 阿里云 OCR 识别结果（身份证） */
export interface AliCloudIdCardInfo {
  side: 'face' | 'back';
  name?: string;
  idNumber?: string;
  gender?: string;
  ethnicity?: string;
  birthDate?: string;
  address?: string;
  authority?: string;
  validDate?: string;
  confidence: number;
  rawResponse: any;
}

/**
 * 兼容旧名字（与 verifier.ts 的 IdCardInfo 不同，本接口为 OCR 原始结果）
 * 外部请使用 AliCloudIdCardInfo；本文件内部仍以 IdCardInfo 引用以保持可读性。
 */
type IdCardInfo = AliCloudIdCardInfo;

/** 阿里云 OCR 配置 */
export interface AliCloudOcrConfig {
  /** APPCODE（云市场授权） */
  appCode: string;
  /** OCR 接口 endpoint，默认云市场身份证识别 */
  endpoint?: string;
  /** 模拟开关（强制 mock） */
  mock?: boolean;
  /** 单次请求超时（毫秒） */
  timeoutMs?: number;
  /** 重试次数（默认 3） */
  retries?: number;
  /** 重试基础退避（毫秒） */
  retryBackoffMs?: number;
  /** 自定义 fetch（用于测试注入） */
  fetchImpl?: typeof fetch;
}

/** 阿里云 OCR 标准响应 */
export interface AliCloudOcrResponse {
  code: number;
  msg: string;
  data?: {
    /** 姓名（face） */
    name?: string;
    /** 身份证号（face） */
    idNum?: string;
    /** 性别（face） */
    sex?: string;
    /** 民族（face） */
    nationality?: string;
    /** 出生日期（face） */
    birth?: string;
    /** 地址（face） */
    address?: string;
    /** 签发机关（back） */
    issue?: string;
    /** 有效期（back） */
    validDate?: string;
    /** 身份证号（back 部分接口） */
    idCardNum?: string;
    /** 识别置信度 0-100 */
    score?: number;
  };
}

// ============================================================================
// 端点常量
// ============================================================================

/**
 * 阿里云市场 身份证识别 endpoint（cmapi020020）
 * 申请 APPCODE 后由阿里云分配具体 host，下方为占位示例
 */
export const DEFAULT_OCR_ENDPOINT = 'https://idcard.market.alicloudapi.com/ocr/idcard';

// ============================================================================
// 类
// ============================================================================

/**
 * 阿里云身份证 OCR 客户端
 *
 * 使用示例：
 * ```ts
 * const ocr = new AliCloudOcr({ appCode: process.env.ALIYUN_OCR_APPCODE! });
 * const face = await ocr.recognizeIdCard('https://oss.example.com/front.jpg', 'face');
 * const back = await ocr.recognizeIdCard('https://oss.example.com/back.jpg', 'back');
 * ```
 */
export class AliCloudOcr {
  private readonly appCode: string;
  private readonly endpoint: string;
  private readonly mock: boolean;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBackoffMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: AliCloudOcrConfig) {
    if (!config) {
      throw new KycError('KYC_OCR_CONFIG', 'OCR config is required');
    }
    this.appCode = config.appCode || '';
    this.endpoint = config.endpoint || DEFAULT_OCR_ENDPOINT;
    this.mock = !!config.mock || !this.appCode;
    this.timeoutMs = config.timeoutMs ?? 10_000;
    this.retries = config.retries ?? 3;
    this.retryBackoffMs = config.retryBackoffMs ?? 500;
    this.fetchImpl = config.fetchImpl || (typeof fetch !== 'undefined' ? fetch : (null as any));

    if (!this.fetchImpl) {
      throw new KycError(
        'KYC_OCR_NO_FETCH',
        'No fetch implementation available (Node >= 18 required or polyfill)',
      );
    }
  }

  // --------------------------------------------------------------------------
  // 公共 API
  // --------------------------------------------------------------------------

  /**
   * 识别身份证
   *
   * @param imageUrl 身份证图片 URL（已上传到 OSS / CDN）
   * @param side 'face' = 人像面（正面） / 'back' = 国徽面（背面）
   */
  public async recognizeIdCard(
    imageUrl: string,
    side: 'face' | 'back',
  ): Promise<IdCardInfo> {
    if (!imageUrl) {
      throw new KycError('KYC_OCR_URL', 'Image URL is required');
    }
    if (side !== 'face' && side !== 'back') {
      throw new KycError('KYC_OCR_SIDE', `Invalid side: ${side}`);
    }

    if (this.mock) {
      return this.mockRecognize(imageUrl, side);
    }
    return this.callRemoteWithRetry(imageUrl, side);
  }

  /**
   * 同步识别身份证正面
   */
  public recognizeFront(imageUrl: string): Promise<IdCardInfo> {
    return this.recognizeIdCard(imageUrl, 'face');
  }

  /**
   * 同步识别身份证背面
   */
  public recognizeBack(imageUrl: string): Promise<IdCardInfo> {
    return this.recognizeIdCard(imageUrl, 'back');
  }

  /**
   * 是否处于 mock 模式
   */
  public isMock(): boolean {
    return this.mock;
  }

  // --------------------------------------------------------------------------
  // 内部：远端调用 + 重试
  // --------------------------------------------------------------------------

  private async callRemoteWithRetry(
    imageUrl: string,
    side: 'face' | 'back',
  ): Promise<IdCardInfo> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const resp = await this.callRemoteOnce(imageUrl, side);
        return resp;
      } catch (err) {
        lastError = err;
        // 业务错误（4xx）不重试
        if (err instanceof KycError && (err.code === 'KYC_OCR_REMOTE_BAD_REQUEST' || err.code === 'KYC_OCR_REMOTE_AUTH')) {
          throw err;
        }
        // 网络 / 5xx 错误重试
        if (attempt < this.retries - 1) {
          await this.delay(this.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }
    throw new KycError(
      'KYC_OCR_RETRIES_EXHAUSTED',
      `OCR request failed after ${this.retries} attempts`,
      502,
      { cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  private async callRemoteOnce(
    imageUrl: string,
    side: 'face' | 'back',
  ): Promise<IdCardInfo> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const body = new URLSearchParams();
      body.set('image', imageUrl);
      body.set('side', side);

      const res = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Authorization: `APPCODE ${this.appCode}`,
        },
        body: body.toString(),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new KycError(
          'KYC_OCR_REMOTE_AUTH',
          `APPCODE invalid or unauthorized: HTTP ${res.status}`,
          502,
        );
      }
      if (res.status >= 400 && res.status < 500) {
        const text = await safeText(res);
        throw new KycError(
          'KYC_OCR_REMOTE_BAD_REQUEST',
          `OCR remote rejected request: HTTP ${res.status} ${text}`,
          502,
        );
      }
      if (res.status >= 500) {
        throw new KycError(
          'KYC_OCR_REMOTE_5XX',
          `OCR remote 5xx: HTTP ${res.status}`,
          502,
        );
      }

      const json = (await res.json()) as AliCloudOcrResponse;
      return this.parseResponse(json, side);
    } catch (err) {
      if (err instanceof KycError) throw err;
      if ((err as any)?.name === 'AbortError') {
        throw new KycError('KYC_OCR_TIMEOUT', `OCR timeout after ${this.timeoutMs}ms`, 504);
      }
      throw new KycError(
        'KYC_OCR_NETWORK',
        `OCR network error: ${(err as Error).message}`,
        502,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // --------------------------------------------------------------------------
  // 内部：响应解析
  // --------------------------------------------------------------------------

  private parseResponse(json: AliCloudOcrResponse, side: 'face' | 'back'): IdCardInfo {
    if (!json) {
      throw new KycError('KYC_OCR_BAD_RESPONSE', 'Empty response from OCR service', 502);
    }
    // 阿里云 code：200 成功；其他视为业务失败
    if (json.code !== 200 && json.code !== 0) {
      throw new KycError(
        'KYC_OCR_REMOTE_FAIL',
        `OCR service error: code=${json.code} msg=${json.msg}`,
        502,
        { raw: json },
      );
    }
    const d = json.data || {};
    // 兼容性：部分接口用 idCardNum，部分用 idNum
    const idNumber = d.idNum || d.idCardNum;
    const confidence = typeof d.score === 'number' ? clamp01(d.score / 100) : 0.95;
    return {
      side,
      name: d.name,
      idNumber,
      gender: d.sex,
      ethnicity: d.nationality,
      birthDate: d.birth,
      address: d.address,
      authority: d.issue,
      validDate: d.validDate,
      confidence,
      rawResponse: json,
    };
  }

  // --------------------------------------------------------------------------
  // 内部：Mock 模式
  // --------------------------------------------------------------------------

  private mockRecognize(imageUrl: string, side: 'face' | 'back'): IdCardInfo {
    // mock 模式下，根据 URL 中的关键字返回不同结果，便于测试
    const url = imageUrl.toLowerCase();
    if (side === 'face') {
      if (url.includes('expired')) {
        return {
          side: 'face',
          name: '张三',
          idNumber: '110101199001010010', // 故意校验位错误
          gender: '男',
          ethnicity: '汉',
          birthDate: '1990-01-01',
          address: '北京市朝阳区某某街道123号',
          confidence: 0.95,
          rawResponse: { mock: true, code: 200, msg: 'OK' },
        };
      }
      if (url.includes('low')) {
        return {
          side: 'face',
          name: '李四',
          idNumber: '11010519491231002X',
          gender: '女',
          ethnicity: '汉',
          birthDate: '1949-12-31',
          address: '北京市海淀区中关村大街1号',
          confidence: 0.6, // 故意低置信度
          rawResponse: { mock: true, code: 200, msg: 'OK', score: 60 },
        };
      }
      // 默认
      return {
        side: 'face',
        name: '王五',
        idNumber: '110101199003073116',
        gender: '男',
        ethnicity: '汉',
        birthDate: '1990-03-07',
        address: '上海市浦东新区世纪大道100号',
        confidence: 0.98,
        rawResponse: { mock: true, code: 200, msg: 'OK' },
      };
    }
    // back
    return {
      side: 'back',
      authority: '北京市公安局',
      validDate: '2010.01.01-2030.01.01',
      confidence: 0.96,
      rawResponse: { mock: true, code: 200, msg: 'OK' },
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
// 辅助
// ============================================================================

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

const safeText = async (res: Response): Promise<string> => {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
};
