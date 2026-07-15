/**
 * Alchemy Webhook 处理（纯函数形式）
 *
 * 与 Next.js / Express 框架解耦，方便在不同环境复用：
 *  - 单元测试直接调用
 *  - Next.js App Router 接收 raw body 后调用
 *  - Express 接收 `req.rawBody` 后调用
 *
 * 流程：
 *  1. 校验签名（防伪造）
 *  2. 解析 JSON
 *  3. 转发给 DepositMonitor.handleWebhook
 *  4. 返回处理结果
 */

import { verifyAlchemySignature, WebhookSignatureError } from './webhook-verifier';
import type { DepositMonitor, WebhookPayload, DepositEvent } from './deposit-monitor';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

export interface HandleAlchemyWebhookResult {
  ok: boolean;
  processed: number;
  events: DepositEvent[];
  errors: string[];
}

export interface HandleAlchemyWebhookOptions {
  /** Alchemy signing key（从环境变量 ALCHEMY_WEBHOOK_SIGNING_KEY 注入） */
  signingKey: string;
  /** 监控器实例 */
  monitor: DepositMonitor;
  /** 原始请求体 */
  rawBody: string;
  /** 签名 header（默认从 `x-alchemy-signature` 取） */
  signature?: string;
  /** 跳过签名校验（仅测试用） */
  skipSignatureCheck?: boolean;
}

/**
 * 处理 Alchemy webhook 回调
 */
export async function handleAlchemyWebhook(
  rawBody: string,
  signature: string,
  signingKey: string,
  monitor: DepositMonitor,
): Promise<HandleAlchemyWebhookResult> {
  const errors: string[] = [];
  const events: DepositEvent[] = [];

  // 1. 签名校验
  try {
    if (!signingKey) {
      throw new WebhookSignatureError('KEY_MISSING', 'signingKey is not configured');
    }
    verifyAlchemySignature(rawBody, signature, signingKey);
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      return {
        ok: false,
        processed: 0,
        events: [],
        errors: [`[${err.code}] ${err.message}`],
      };
    }
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: [(err as Error).message],
    };
  }

  // 2. 解析 payload
  const payload = safeJsonParse<WebhookPayload>(rawBody, {
    context: 'alchemy-webhook',
    maxBytes: 10 * 1024 * 1024, // 10MB for batched webhooks
    silent: true,
  });
  if (!payload) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: ['Invalid JSON: failed to parse webhook body'],
    };
  }

  // 3. 转发到 monitor
  try {
    const out = monitor.handleWebhook(payload);
    events.push(...out);
  } catch (err) {
    errors.push(`handleWebhook: ${(err as Error).message}`);
    return { ok: false, processed: 0, events: [], errors };
  }

  return {
    ok: errors.length === 0,
    processed: events.length,
    events,
    errors,
  };
}
