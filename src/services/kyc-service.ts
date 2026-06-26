/**
 * KYC 服务层 (人脸核身 + 身份证 OCR)
 *
 * 业务职责:
 *  1. 启动 KYC 申请 (basic / advanced)
 *  2. 上传身份证正反面 + 活体视频
 *  3. 调用阿里云 OCR + 活体服务
 *  4. 提交审核 + 状态机追踪
 *  5. 查询审核进度 + 限额
 *
 * 接入策略:
 *  - 真实环境:  后端 /api/kyc/* 调用阿里云实名认证
 *  - 演示环境:  返回模拟的 OCR + 活体数据
 *  - 浏览器:    通过 BFF 中转,前端不直接持有 AccessKey
 *
 * 阿里云依赖 (服务端):
 *  - ALIYUN_ACCESS_KEY_ID
 *  - ALIYUN_ACCESS_KEY_SECRET
 *  - ALIYUN_FACE_APP_ID
 *  - ALIYUN_OCR_APP_CODE
 */

import { http, normalizeError, ApiError, USE_MOCK } from './api-client';
import { logger } from '@/lib/logger';

// ============================================================================
// 类型
// ============================================================================

export type KycLevel = 0 | 1 | 2;  // 0=未认证 1=基础 2=高级
export type KycStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export interface KycApplication {
  id: string;
  userId: string;
  level: KycLevel;
  type: 'basic' | 'advanced';
  status: KycStatus;
  steps: {
    ocr: 'pending' | 'passed' | 'failed';
    face: 'pending' | 'passed' | 'failed';
    document: 'pending' | 'passed' | 'failed';
  };
  /** 提交的资料 */
  data: {
    name?: string;
    idNumberMasked?: string;     // 138****1234
    birthDate?: string;
    authority?: string;
    validDate?: string;
    nationality?: string;
  };
  faceResult?: {
    similarity: number;          // 0-100
    livenessScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    passed: boolean;
  };
  ocrConfidence?: number;        // 0-100
  rejectReason?: string;
  reviewerId?: string;
  reviewedAt?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

export interface KycLimits {
  dailyWithdraw: number;         // USD
  monthlyWithdraw: number;       // USD
  singleTradeLimit: number;      // USD
  fiatEnabled: boolean;
  perpEnabled: boolean;
  otcEnabled: boolean;
}

export interface OcrResult {
  success: boolean;
  confidence: number;            // 0-100
  fields: {
    name?: string;
    idNumber?: string;
    birthDate?: string;
    gender?: 'M' | 'F';
    nationality?: string;
    address?: string;
    authority?: string;
    validDate?: string;
  };
  imageUrl?: string;
}

export interface FaceVerifyResult {
  success: boolean;
  similarity: number;
  livenessScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  passed: boolean;
  videoUrl?: string;
}

// ============================================================================
// 服务
// ============================================================================

export const kycService = {
  /**
   * 启动 KYC 申请
   */
  async start(userId: string, type: 'basic' | 'advanced' = 'basic'): Promise<KycApplication> {
    try {
      const res = await http.post<{ data: KycApplication }>('/kyc/start', { userId, type });
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockStart(userId, type);
      throw normalizeError(e);
    }
  },

  /**
   * 获取申请详情
   */
  async getApplication(id: string): Promise<KycApplication> {
    try {
      const res = await http.get<{ data: KycApplication }>(`/kyc/application/${id}`);
      return res.data;
    } catch (e) {
      if (USE_MOCK) throw new ApiError('Application not found', 'NOT_FOUND', 404);
      throw normalizeError(e);
    }
  },

  /**
   * 获取用户当前 KYC 状态
   */
  async getStatus(userId: string): Promise<{
    level: KycLevel;
    status: KycStatus;
    applicationId?: string;
    limits: KycLimits;
  }> {
    try {
      const res = await http.get<{ data: any }>(`/kyc/status/${userId}`);
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockStatus(userId);
      throw normalizeError(e);
    }
  },

  /**
   * 提交身份证 OCR
   * @param imageBase64 身份证正面 base64 (或上传后的 URL)
   * @param side 'front' | 'back'
   */
  async submitIdCardOcr(
    applicationId: string,
    imageBase64: string,
    side: 'front' | 'back'
  ): Promise<OcrResult> {
    try {
      const res = await http.post<{ data: OcrResult }>('/kyc/ocr', {
        applicationId,
        imageBase64,
        side,
      });
      logger.info('[kyc] OCR completed', side, res.data.confidence);
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockOcr(side);
      throw normalizeError(e);
    }
  },

  /**
   * 提交活体视频
   * @param videoBase64 活体检测视频 base64
   * @param idImageBase64 待对比身份证图片 base64
   */
  async submitFaceVerification(
    applicationId: string,
    videoBase64: string,
    idImageBase64: string
  ): Promise<FaceVerifyResult> {
    try {
      const res = await http.post<{ data: FaceVerifyResult }>('/kyc/face', {
        applicationId,
        videoBase64,
        idImageBase64,
      });
      logger.info('[kyc] Face verified', res.data.passed, res.data.similarity);
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockFace();
      throw normalizeError(e);
    }
  },

  /**
   * 提交审核
   */
  async submit(applicationId: string): Promise<KycApplication> {
    try {
      const res = await http.post<{ data: KycApplication }>(
        `/kyc/application/${applicationId}/submit`
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) return mockSubmit(applicationId);
      throw normalizeError(e);
    }
  },

  /**
   * 管理员审批
   */
  async review(
    applicationId: string,
    decision: 'approve' | 'reject',
    reason?: string
  ): Promise<KycApplication> {
    try {
      const res = await http.post<{ data: KycApplication }>(
        `/kyc/admin/review`,
        { applicationId, decision, reason }
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) {
        return {
          ...mockSubmit(applicationId),
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewerId: 'admin_001',
          reviewedAt: Date.now(),
          rejectReason: reason,
        };
      }
      throw normalizeError(e);
    }
  },

  /**
   * 上传身份证图片获取 URL
   */
  async uploadIdImage(file: File): Promise<{ url: string; ossKey: string }> {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await http.post<{ data: { url: string; ossKey: string } }>(
        '/kyc/upload',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return res.data;
    } catch (e) {
      if (USE_MOCK) {
        return { url: URL.createObjectURL(file), ossKey: `mock_${Date.now()}` };
      }
      throw normalizeError(e);
    }
  },

  /**
   * 获取用户当前 KYC 等级对应的限额
   */
  getLimitsByLevel(level: KycLevel): KycLimits {
    switch (level) {
      case 0:
        return {
          dailyWithdraw: 100,
          monthlyWithdraw: 500,
          singleTradeLimit: 100,
          fiatEnabled: false,
          perpEnabled: false,
          otcEnabled: false,
        };
      case 1:
        return {
          dailyWithdraw: 10_000,
          monthlyWithdraw: 50_000,
          singleTradeLimit: 5_000,
          fiatEnabled: true,
          perpEnabled: true,
          otcEnabled: false,
        };
      case 2:
        return {
          dailyWithdraw: 1_000_000,
          monthlyWithdraw: 10_000_000,
          singleTradeLimit: 500_000,
          fiatEnabled: true,
          perpEnabled: true,
          otcEnabled: true,
        };
    }
  },
};

// ============================================================================
// Mock
// ============================================================================

function mockStart(userId: string, type: 'basic' | 'advanced'): KycApplication {
  return {
    id: `kyc_${Date.now()}`,
    userId,
    level: 0,
    type,
    status: 'in_progress',
    steps: { ocr: 'pending', face: 'pending', document: 'pending' },
    data: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function mockStatus(userId: string) {
  const level: KycLevel = 0;
  return {
    level,
    status: 'not_started' as KycStatus,
    applicationId: undefined,
    limits: kycService.getLimitsByLevel(level),
  };
}

function mockOcr(side: 'front' | 'back'): OcrResult {
  if (side === 'front') {
    return {
      success: true,
      confidence: 96.5,
      fields: {
        name: '张三',
        idNumber: '11010519491231002X',
        birthDate: '1949-12-31',
        gender: 'M',
        nationality: '汉',
        address: '北京市朝阳区某某路 100 号',
      },
    };
  }
  return {
    success: true,
    confidence: 95.2,
    fields: {
      authority: '北京市公安局朝阳分局',
      validDate: '2020.01.01-2030.01.01',
    },
  };
}

function mockFace(): FaceVerifyResult {
  return {
    success: true,
    similarity: 94.8,
    livenessScore: 98.2,
    riskLevel: 'low',
    passed: true,
  };
}

function mockSubmit(id: string): KycApplication {
  return {
    id,
    userId: 'u_demo',
    level: 1,
    type: 'basic',
    status: 'pending_review',
    steps: { ocr: 'passed', face: 'passed', document: 'passed' },
    data: {
      name: '张三',
      idNumberMasked: '110105********002X',
      birthDate: '1949-12-31',
    },
    faceResult: { similarity: 94.8, livenessScore: 98.2, riskLevel: 'low', passed: true },
    ocrConfidence: 96.5,
    createdAt: Date.now() - 600_000,
    updatedAt: Date.now(),
  };
}

export default kycService;
