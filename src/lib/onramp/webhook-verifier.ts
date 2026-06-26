/**
 * MoonPay Webhook 签名校验
 *
 * MoonPay 通过 `moonpay-signature` header 发送 HMAC-SHA256(secret, rawBody) 的 hex 字符串。
 *
 * 用法：
 *   import { verifyMoonPaySignature } from '@/lib/onramp/webhook-verifier';
 *   if (!verifyMoonPaySignature(rawBody, headerValue, process.env.MOONPAY_WEBHOOK_SECRET)) {
 *     return res.status(401).json({ ok: false });
 *   }
 *
 * 安全：
 *  - 使用 `crypto.timingSafeEqual` 防时序攻击
 *  - 必须使用 raw body（不可 JSON.parse 之后）
 *  - secret 长度无要求，但缺失 / 长度不符 / 不匹配均抛错
 */

import { createHmac, timingSafeEqual } from 'crypto';

// =============================================================================
// 错误
// =============================================================================

export class MoonPayWebhookSignatureError extends Error {
  public readonly code:
    | 'SIGNATURE_MISSING'
    | 'SIGNATURE_INVALID'
    | 'KEY_MISSING'
    | 'LENGTH_MISMATCH';
  constructor(
    code: 'SIGNATURE_MISSING' | 'SIGNATURE_INVALID' | 'KEY_MISSING' | 'LENGTH_MISMATCH',
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = 'MoonPayWebhookSignatureError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// =============================================================================
// 工具
// =============================================================================

/**
 * 计算 MoonPay webhook 签名（HMAC-SHA256，返回 hex 字符串）。
 *  - 算法：HMAC-SHA256(secret, rawBody)  → hex
 *  - 编码：UTF-8
 *
 * 主要用于测试 / 自建发送端 / 重放验证。
 */
export function signMoonPayWebhook(rawBody: string, secret: string): string {
  if (!secret) {
    throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is required');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

// =============================================================================
// 主函数
// =============================================================================

/**
 * 校验 MoonPay Webhook 签名。
 *
 * @param rawBody    原始请求体（字符串，必须与 MoonPay 端发送的字节完全一致）
 * @param signature  从 `moonpay-signature` header 取到的 hex 字符串
 * @param secret     MoonPay Dashboard 提供的 Webhook 签名密钥
 * @returns true 表示签名通过
 * @throws MoonPayWebhookSignatureError 缺失 / 长度不符 / 签名不匹配
 */
export function verifyMoonPaySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret) {
    throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is not configured');
  }
  if (!signature || typeof signature !== 'string') {
    throw new MoonPayWebhookSignatureError('SIGNATURE_MISSING', 'moonpay-signature header is missing');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }

  const expected = signMoonPayWebhook(rawBody, secret);

  // 防时序攻击：先比较长度（hex 长度必须一致）
  const a = Buffer.from(signature.toLowerCase(), 'utf8');
  const b = Buffer.from(expected.toLowerCase(), 'utf8');
  if (a.length !== b.length) {
    throw new MoonPayWebhookSignatureError(
      'LENGTH_MISMATCH',
      `Signature length mismatch: got ${a.length}, expected ${b.length}`,
    );
  }
  if (!timingSafeEqual(a, b)) {
    throw new MoonPayWebhookSignatureError('SIGNATURE_INVALID', 'MoonPay signature is invalid');
  }
  return true;
}
