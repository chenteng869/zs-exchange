/**
 * MoonPay Webhook 处理（纯函数形式）
 *
 * 与 Next.js / Express 框架解耦，方便在不同环境复用：
 *  - 单元测试直接调用
 *  - Next.js App Router 接收 raw body 后调用
 *  - Express 接收 `req.rawBody` 后调用
 *
 * 流程：
 *  1. 校验签名（防伪造）
 *  2. 解析 JSON
 *  3. 标准化 payload（MoonPay 字段命名不固定：camelCase + snake_case 混合）
 *  4. 调用 manager.updateOrderFromWebhook 推进订单状态
 *  5. 返回处理结果
 */

import {
  verifyMoonPaySignature,
  MoonPayWebhookSignatureError,
} from './webhook-verifier';
import {
  type MoonPayTransactionManager,
  type MoonPayWebhookPayload,
} from './transaction-manager';

// =============================================================================
// 类型定义
// =============================================================================

export interface HandleMoonPayWebhookResult {
  ok: boolean;
  processed: number;
  events: Array<{
    orderId: string;
    type: string;
    status: string;
  }>;
  errors: string[];
}

export interface HandleMoonPayWebhookOptions {
  /** MoonPay Webhook 签名密钥（从环境变量 MOONPAY_WEBHOOK_SECRET 注入） */
  secret: string;
  /** 业务管理器实例 */
  manager: MoonPayTransactionManager;
  /** 原始请求体 */
  rawBody: string;
  /** 签名 header（默认从 `moonpay-signature` 取） */
  signature?: string;
  /** 跳过签名校验（仅测试用） */
  skipSignatureCheck?: boolean;
}

// =============================================================================
// 主函数
// =============================================================================

/**
 * 处理 MoonPay webhook 回调
 */
export async function handleMoonPayWebhook(
  rawBody: string,
  signature: string,
  secret: string,
  manager: MoonPayTransactionManager,
): Promise<HandleMoonPayWebhookResult> {
  const errors: string[] = [];
  const events: HandleMoonPayWebhookResult['events'] = [];

  // 1. 签名校验
  try {
    if (!secret) {
      throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is not configured');
    }
    verifyMoonPaySignature(rawBody, signature, secret);
  } catch (err) {
    if (err instanceof MoonPayWebhookSignatureError) {
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
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return {
      ok: false,
      processed: 0,
      events: [],
      errors: [`Invalid JSON: ${(err as Error).message}`],
    };
  }

  // 3. MoonPay 一次 webhook 可能包含多条记录（data 数组），
  //    也可能直接是单条（单 transaction 事件）。
  //    兼容两种格式：
  //      { type: 'transactionCreated', data: [{ ... }] }
  //      { type: 'transactionCreated', ... }
  const items: any[] = Array.isArray(payload?.data)
    ? payload.data
    : payload
      ? [payload]
      : [];

  // 4. 逐条处理
  for (const item of items) {
    try {
      const normalized = normalizeMoonPayWebhook(item, payload?.type);
      if (!normalized.externalTransactionId) {
        errors.push(`[SKIP] webhook missing externalTransactionId: ${JSON.stringify(item).slice(0, 100)}`);
        continue;
      }
      const updated = manager.updateOrderFromWebhook(
        normalized.externalTransactionId,
        normalized,
      );
      if (updated) {
        events.push({
          orderId: updated.id,
          type: normalized.type,
          status: updated.status,
        });
      } else {
        errors.push(`[ORPHAN] no order for externalTransactionId=${normalized.externalTransactionId}`);
      }
    } catch (err) {
      errors.push(`[ITEM] ${(err as Error).message}`);
    }
  }

  return {
    ok: errors.length === 0,
    processed: events.length,
    events,
    errors,
  };
}

// =============================================================================
// 内部：payload 标准化
// =============================================================================

/**
 * 把 MoonPay 真实 webhook payload 规整为内部类型
 * MoonPay 字段命名（v3）：camelCase
 *  - cryptoCurrency / baseCurrency
 *  - cryptoCurrencyAmount / baseCurrencyAmount
 *  - externalTransactionId
 *  - id (MoonPay 内部 id)
 *  - status / failureReason
 */
function normalizeMoonPayWebhook(item: any, topType?: string): MoonPayWebhookPayload {
  const type = String(item.type ?? topType ?? 'transactionUpdated');
  return {
    type,
    id: item.id !== undefined ? String(item.id) : undefined,
    externalTransactionId: item.externalTransactionId,
    status: item.status,
    baseCurrency: item.baseCurrency,
    baseAmount: numOrUndef(item.baseCurrencyAmount ?? item.baseAmount),
    cryptoCurrency: item.cryptoCurrency,
    cryptoAmount: numOrUndef(item.cryptoCurrencyAmount ?? item.cryptoAmount),
    rate: numOrUndef(item.price ?? item.rate),
    fee: numOrUndef(item.feeAmount ?? item.fee),
    networkFee: numOrUndef(item.networkFeeAmount ?? item.networkFee),
    failureReason: item.failureReason,
    walletAddress: item.walletAddress,
  };
}

function numOrUndef(v: any): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
