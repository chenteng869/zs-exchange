/**
 * Alchemy Webhook 签名校验
 *
 * 用于 `/api/webhooks/alchemy` 接收端，校验请求体是否由 Alchemy 私钥签名。
 *
 * - 算法：HMAC-SHA256
 * - 密钥：Alchemy Dashboard 创建 Webhook 时生成的 signing key
 * - Header: `x-alchemy-signature` (hex-encoded)
 * - Body:  raw request body (string) — 必须与签名时使用的字节完全一致
 *
 * 安全：
 * - 使用 `crypto.timingSafeEqual` 防时序攻击
 * - 缺失或错误签名均抛出错误，调用方必须 catch
 */

import { createHmac, timingSafeEqual } from 'crypto';

// =============================================================================
// 错误
// =============================================================================

/** Webhook 校验错误 */
export class WebhookSignatureError extends Error {
  public readonly code: 'SIGNATURE_MISSING' | 'SIGNATURE_INVALID' | 'KEY_MISSING' | 'LENGTH_MISMATCH';
  constructor(
    code: 'SIGNATURE_MISSING' | 'SIGNATURE_INVALID' | 'KEY_MISSING' | 'LENGTH_MISMATCH',
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = 'WebhookSignatureError';
  }
}

// =============================================================================
// 工具
// =============================================================================

/**
 * 计算 Alchemy webhook 签名（HMAC-SHA256，返回 hex 字符串）。
 *
 * 主要用于测试 / 自建发送端。
 */
export function signAlchemyWebhook(rawBody: string, signingKey: string): string {
  if (!signingKey) {
    throw new WebhookSignatureError('KEY_MISSING', 'signingKey is required');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }
  return createHmac('sha256', signingKey).update(rawBody, 'utf8').digest('hex');
}

// =============================================================================
// 主函数
// =============================================================================

/**
 * 校验 Alchemy Webhook 签名。
 *
 * @param rawBody  原始请求体（字符串，必须与 Alchemy 端发送的字节完全一致）
 * @param signature  从 `x-alchemy-signature` header 取到的 hex 字符串
 * @param signingKey Alchemy Dashboard 提供的 signing key
 * @returns true 表示签名通过
 * @throws WebhookSignatureError 缺失 / 长度不符 / 签名不匹配
 */
export function verifyAlchemySignature(
  rawBody: string,
  signature: string,
  signingKey: string,
): boolean {
  if (!signingKey) {
    throw new WebhookSignatureError('KEY_MISSING', 'signingKey is required');
  }
  if (!signature || typeof signature !== 'string') {
    throw new WebhookSignatureError('SIGNATURE_MISSING', 'Alchemy signature header is missing');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }

  const expected = signAlchemyWebhook(rawBody, signingKey);

  // 防时序攻击：先比较长度（hex 长度必须一致）
  const a = Buffer.from(signature.toLowerCase(), 'utf8');
  const b = Buffer.from(expected.toLowerCase(), 'utf8');
  if (a.length !== b.length) {
    throw new WebhookSignatureError(
      'LENGTH_MISMATCH',
      `Signature length mismatch: got ${a.length}, expected ${b.length}`,
    );
  }
  if (!timingSafeEqual(a, b)) {
    throw new WebhookSignatureError('SIGNATURE_INVALID', 'Alchemy signature is invalid');
  }
  return true;
}
