/**
 * 推送通知 — 公共类型定义（L-01 / L-02 / L-03）
 *
 * 覆盖三家厂商：
 *  - FCM    Firebase Cloud Messaging（Android + iOS）
 *  - APNs   Apple Push Notification service（iOS）
 *  - HMS    Huawei Mobile Services Push（华为 Android）
 *
 * 设计要点：
 *  - PushPayload 是厂商无关的统一载荷，由各 client 翻译为厂商 schema
 *  - PushResult 也是厂商无关的统一返回，便于业务层聚合统计
 *  - DeviceToken 是设备注册的统一表达，platform 决定走哪个 provider
 *  - 不引第三方依赖，所有签名 / 加密都用 Node 内置 crypto
 */

import { logger } from '../../logger';

// =============================================================================
// 常量
// =============================================================================

/** 默认消息过期时间（秒）= 24h */
export const PUSH_DEFAULT_TTL_SECONDS = 86_400;

/** 默认优先级 */
export const PUSH_DEFAULT_PRIORITY: 'normal' | 'high' = 'normal';

/** 单次批量推送最大设备数（厂商分批阈值） */
export const PUSH_BATCH_SIZE = 500;

/** APNs JWT 缓存 TTL：55 分钟（< 60min 过期） */
export const APNS_JWT_CACHE_TTL_MS = 55 * 60_000;

/** FCM OAuth access token 缓存 TTL：55 分钟 */
export const FCM_TOKEN_CACHE_TTL_MS = 55 * 60_000;

/** HMS OAuth access token 缓存 TTL：55 分钟 */
export const HMS_TOKEN_CACHE_TTL_MS = 55 * 60_000;

// =============================================================================
// 枚举 / 联合类型
// =============================================================================

/** 推送厂商 */
export type PushProvider = 'FCM' | 'APNS' | 'HMS';

/** 设备平台 */
export type DevicePlatform = 'android' | 'ios' | 'harmony' | 'web';

/** 推送状态 */
export type PushStatus = 'success' | 'failed' | 'invalid_token' | 'rate_limited';

/** 优先级 */
export type PushPriority = 'high' | 'normal';

// =============================================================================
// 设备 Token
// =============================================================================

/**
 * 设备 Token 注册信息
 *
 *  - token:        厂商返回的设备 token（FCM registration id / APNs device token / HMS token）
 *  - platform:     设备平台，决定走哪个 provider
 *  - appVersion:   客户端版本（用于厂商分群推送）
 *  - deviceModel:  设备型号
 *  - locale:       客户端语言
 *  - timezone:     客户端时区（IANA，例如 Asia/Shanghai）
 */
export interface DeviceToken {
  token: string;
  platform: DevicePlatform;
  appVersion?: string;
  deviceModel?: string;
  locale?: string;
  timezone?: string;
}

// =============================================================================
// 推送载荷
// =============================================================================

/**
 * 推送载荷（厂商无关）
 *
 * 厂商 client 负责翻译：
 *  - FCM:    message.notification + message.data + message.android / apns
 *  - APNs:   aps.alert + aps.badge + aps.sound + custom data
 *  - HMS:    notification + data
 */
export interface PushPayload {
  /** 通知标题 */
  title: string;
  /** 通知正文 */
  body: string;
  /** 大图（iOS 5+ / Android big-picture） */
  imageUrl?: string;
  /** 小图标 URL（Android 用） */
  iconUrl?: string;
  /** 自定义数据（key 必须是 string，避免厂商 schema 冲突） */
  data?: Record<string, string>;
  /** iOS 角标 */
  badge?: number;
  /** 'default' | 'silent' | 'custom.caf' */
  sound?: string;
  /** 消息过期时间（秒，相对当前时间），默认 24h */
  ttlSeconds?: number;
  /** 优先级 */
  priority?: PushPriority;
  /** FCM / HMS 用，相同 key 的消息会被合并 */
  collapseKey?: string;
  /** iOS 交互分类（UNNotificationCategory） */
  categoryId?: string;
  /** iOS 通知分组（threadIdentifier） */
  threadId?: string;
  /** 点击通知跳转链接（业务自定义） */
  clickAction?: string;
}

// =============================================================================
// 推送结果
// =============================================================================

/**
 * 推送结果（厂商无关）
 *
 * 业务层：
 *  - status === 'invalid_token' → 调用 invalidateToken() 清理
 *  - status === 'rate_limited'  → 走退避（backoffBaseMs）
 *  - status === 'success'       → 计入成功
 *  - status === 'failed'        → 计入失败，errorCode 用于定位
 */
export interface PushResult {
  messageId: string;
  provider: PushProvider;
  token: string;
  status: PushStatus;
  errorCode?: string;
  errorMessage?: string;
  sentAt: number;
}

// =============================================================================
// 厂商特定配置
// =============================================================================

/** FCM 配置 */
export interface FcmConfig {
  /** Firebase projectId（mockMode=true 时可选） */
  projectId?: string;
  /** Service Account JSON（mockMode=true 时可选） */
  serviceAccount?: FcmServiceAccount;
  /** 演示降级：未配置时 mock */
  mockMode?: boolean;
  /** API 端点（默认官方） */
  apiBase?: string;
  /** 自定义 fetch */
  fetchImpl?: typeof fetch;
  /** 超时（ms），默认 8_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数（ms），默认 400 */
  backoffBaseMs?: number;
  /** 时钟注入（测试用） */
  now?: () => number;
  /** logger 注入 */
  logger?: typeof logger;
}

/** FCM Service Account JSON 必需字段 */
export interface FcmServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
  token_uri?: string;
}

/** APNs 配置 */
export interface ApnsConfig {
  /** Apple Developer Team ID（10 字符，mockMode=true 时可选） */
  teamId?: string;
  /** APNs Key ID（10 字符，mockMode=true 时可选） */
  keyId?: string;
  /** .p8 私钥（P-256，EC 格式，mockMode=true 时可选） */
  privateKey?: string;
  /** App Bundle ID（用于 apns-topic header，mockMode=true 时可选） */
  bundleId?: string;
  /** true=生产 / false=沙箱（默认 false） */
  production?: boolean;
  /** API 端点（默认官方） */
  apiBase?: string;
  /** 自定义 fetch */
  fetchImpl?: typeof fetch;
  /** 超时（ms），默认 8_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数（ms），默认 400 */
  backoffBaseMs?: number;
  /** 时钟注入 */
  now?: () => number;
  /** logger 注入 */
  logger?: typeof logger;
  /** 演示降级：未配置时 mock（自动检测：未提供 privateKey 即 mock） */
  mockMode?: boolean;
}

/** HMS 配置 */
export interface HmsConfig {
  /** App ID（HMS 申请，mockMode=true 时可选） */
  appId?: string;
  /** App Secret（HMS 申请，mockMode=true 时可选） */
  appSecret?: string;
  /** API 端点（默认官方） */
  apiBase?: string;
  /** 自定义 fetch */
  fetchImpl?: typeof fetch;
  /** 超时（ms），默认 8_000 */
  timeoutMs?: number;
  /** 最大重试次数（不含首次），默认 3 */
  maxRetries?: number;
  /** 退避基数（ms），默认 400 */
  backoffBaseMs?: number;
  /** 时钟注入 */
  now?: () => number;
  /** logger 注入 */
  logger?: typeof logger;
  /** 演示降级 */
  mockMode?: boolean;
}

// =============================================================================
// 工具：按 platform 选 provider
// =============================================================================

/**
 * platform → provider 默认映射
 *  - android  → FCM
 *  - harmony  → HMS
 *  - ios      → FCM（默认） / APNs（如有）
 *  - web      → FCM
 */
export function defaultProviderFor(platform: DevicePlatform): PushProvider {
  switch (platform) {
    case 'android':
      return 'FCM';
    case 'harmony':
      return 'HMS';
    case 'ios':
    case 'web':
      return 'FCM';
    default:
      return 'FCM';
  }
}

// =============================================================================
// 工具：base64url（JWT 用）
// =============================================================================

/** 标准 base64 → base64url（URL 安全） */
export function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** base64url → Buffer */
export function base64UrlDecode(input: string): Buffer {
  const padded = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

// =============================================================================
// 工具：随机 / 时间
// =============================================================================

/** 随机 32 位 hex（用于 mock messageId） */
export function randomHex(len = 32): string {
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * 16)];
  }
  return out;
}
