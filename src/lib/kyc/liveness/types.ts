/**
 * 活体检测多厂商适配器 - 统一类型定义
 *
 * 支持厂商：
 *  - ALICLOUD: 阿里云（已通过 J-01 实现）
 *  - BAIDU:    百度智能云（人脸实名认证 / 金融级活体）
 *  - TENCENT:  腾讯云（慧眼 FaceID，TC3-HMAC-SHA256 签名）
 *  - MEGVII:   旷视科技（Face++ 人脸核身）
 *
 * 业务层（LivenessService）通过本层抽象实现：
 *  - 厂商优先级排序
 *  - 自动主备切换
 *  - 统计与降级
 *
 * @module lib/kyc/liveness/types
 */

// ============================================================================
// 厂商 / 活体类型
// ============================================================================

/** 活体检测厂商 */
export type LivenessProvider = 'ALICLOUD' | 'BAIDU' | 'TENCENT' | 'MEGVII';

/** 活体检测方式 */
export type LivenessType = 'silent' | 'action' | 'video';

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 厂商聚合策略 */
export type VerifyStrategy = 'first_success' | 'majority' | 'all';

// ============================================================================
// 输入 / 输出
// ============================================================================

/**
 * 活体检测请求
 *  - 视频模式：videoUrl 或 videoBase64
 *  - 静默/动作模式：imageUrl 或 imageBase64
 *  - 比对模式：提供 idCardNumber + name + refImageUrl
 */
export interface LivenessRequest {
  userId: string;
  type: LivenessType;
  // 视频模式
  videoUrl?: string;
  videoBase64?: string;
  // 静默 / 动作模式
  imageUrl?: string;
  imageBase64?: string;
  // 实名比对
  idCardNumber?: string;
  name?: string;
  /** 权威参考图（身份证人脸照等） */
  refImageUrl?: string;
  refImageBase64?: string;
  /** 通过分数（0-1），缺省 0.85 */
  threshold?: number;
  /** 动作序列（仅 action 模式） */
  actions?: string[];
  /** 业务方 ID（部分厂商需要） */
  appId?: string;
}

/** 活体检测结果（统一） */
export interface LivenessResult {
  provider: LivenessProvider;
  passed: boolean;
  /** 综合置信度 0-1 */
  confidence: number;
  /** 与参考图相似度 0-1 */
  similarity: number;
  /** 活体分数 0-1 */
  livenessScore: number;
  riskLevel: RiskLevel;
  reason?: string;
  details?: {
    /** 是否伪造 / 攻击 */
    spoof?: boolean;
    /** 是否检测到人脸 */
    faceDetected?: boolean;
    /** 人脸质量分 0-1 */
    faceQuality?: number;
    /** 命中的实名字段（idCard / name） */
    matchedFields?: string[];
    /** 视频类型下的执行动作是否完整 */
    actionsPassed?: string[];
  };
  /** 厂商原始响应 */
  rawResponse: any;
  /** 调用耗时（毫秒） */
  latencyMs: number;
}

/** 单厂商聚合统计 */
export interface LivenessStats {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  byProvider: Record<
    LivenessProvider,
    { calls: number; success: number; avgLatency: number }
  >;
}

// ============================================================================
// 常量
// ============================================================================

/** 默认通过阈值 */
export const LIVENESS_DEFAULT_THRESHOLD = 0.85;

/** 默认超时（毫秒） */
export const LIVENESS_DEFAULT_TIMEOUT_MS = 15000;

/** 默认最大重试次数 */
export const LIVENESS_MAX_RETRIES = 3;

/** 默认厂商优先级（ALICLOUD 已在 J-01 实现） */
export const LIVENESS_DEFAULT_PROVIDER_PRIORITY: LivenessProvider[] = [
  'ALICLOUD',
  'BAIDU',
  'TENCENT',
  'MEGVII',
];

// ============================================================================
// 工具（不导出避免与 alicloud-face.clamp01 冲突）
// ============================================================================

/** 限幅到 [0, 1]（内部使用，避免与 alicloud-face.clamp01 同名冲突） */
const clamp01 = (n: number): number => {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
};

/** 计算风险等级（内部使用） */
const computeLivenessRisk = (
  similarity: number,
  livenessScore: number,
): RiskLevel => {
  if (similarity >= 0.85 && livenessScore >= 0.9) return 'low';
  if (similarity >= 0.7 && livenessScore >= 0.7) return 'medium';
  return 'high';
};

// 内部使用导出
export const _internal = { clamp01, computeLivenessRisk };
