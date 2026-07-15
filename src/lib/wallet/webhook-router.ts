/**
 * Alchemy Webhook 统一路由分发器
 *
 * 2026-07-11 新建（P2 阶段）
 *  - 接收任意 Alchemy webhook 路由（/api/webhooks/alchemy/{type}）的请求
 *  - 校验签名
 *  - 解析 payload
 *  - 分发给对应 handler
 *
 * 使用方式（在 route.ts 中）：
 *   import { createAlchemyWebhookRoute } from '@/lib/wallet/webhook-router';
 *   export const POST = createAlchemyWebhookRoute('ADDRESS_ACTIVITY', {
 *     onAddressActivity: async (payload) => { ... }
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAlchemySignature, WebhookSignatureError } from './webhook-verifier';
import { safeJsonParse } from '@/lib/security/safe-json-parse';
import {
  getSigningKeyForType,
  describeSignatureError,
  type AlchemyWebhookType,
  type AddressActivityPayload,
  type MinedTransactionsPayload,
  type DroppedTransactionsPayload,
  type NftActivityPayload,
  type SolanaPayload,
} from './webhook-types';

// =============================================================================
// 类型
// =============================================================================

export interface WebhookHandlerOptions {
  /** Address Activity 处理器（入金监控）*/
  onAddressActivity?: (payload: AddressActivityPayload) => Promise<void> | void;
  /** Mined Transactions 处理器（提现上链通知）*/
  onMined?: (payload: MinedTransactionsPayload) => Promise<void> | void;
  /** Dropped Transactions 处理器（卡单检测）*/
  onDropped?: (payload: DroppedTransactionsPayload) => Promise<void> | void;
  /** NFT Activity 处理器（数字藏品）*/
  onNft?: (payload: NftActivityPayload) => Promise<void> | void;
  /** Solana 事件处理器 */
  onSolana?: (payload: SolanaPayload) => Promise<void> | void;
  /** 跳过签名校验（仅测试用）*/
  skipSignatureCheck?: boolean;
}

export interface WebhookProcessResult {
  ok: boolean;
  type: AlchemyWebhookType;
  processed: number;
  errors: string[];
}

// =============================================================================
// 主路由工厂
// =============================================================================

/**
 * 创建指定类型的 Alchemy Webhook 路由处理器
 *
 * @param type webhook 类型
 * @param opts handler 配置
 * @returns Next.js POST handler
 */
export function createAlchemyWebhookRoute(
  type: AlchemyWebhookType,
  opts: WebhookHandlerOptions,
) {
  return async function POST(req: NextRequest): Promise<NextResponse> {
    const errors: string[] = [];
    let processed = 0;

    // 1. 取签名密钥
    const signingKey = getSigningKeyForType(type);
    if (!signingKey && !opts.skipSignatureCheck) {
      return NextResponse.json(
        { ok: false, type, processed: 0, errors: [`[KEY_MISSING] ALCHEMY_WEBHOOK_*_KEY not configured for type=${type}`] },
        { status: 503 },
      );
    }

    // 2. 取 raw body
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-alchemy-signature')
      || req.headers.get('X-Alchemy-Signature')
      || '';

    // 3. 签名校验
    if (!opts.skipSignatureCheck) {
      try {
        verifyAlchemySignature(rawBody, signature, signingKey!);
      } catch (err) {
        if (err instanceof WebhookSignatureError) {
          return NextResponse.json(
            { ok: false, type, processed: 0, errors: [describeSignatureError(err)] },
            { status: 401 },
          );
        }
        return NextResponse.json(
          { ok: false, type, processed: 0, errors: [(err as Error).message] },
          { status: 400 },
        );
      }
    }

    // 4. 解析 JSON
    const payload = safeJsonParse<any>(rawBody, {
      context: `alchemy-webhook-${type}`,
      maxBytes: 10 * 1024 * 1024, // 10MB
      silent: true,
    });
    if (!payload) {
      return NextResponse.json(
        { ok: false, type, processed: 0, errors: ['Invalid JSON: failed to parse webhook body'] },
        { status: 400 },
      );
    }

    // 5. 分发到对应 handler
    try {
      switch (type) {
        case 'ADDRESS_ACTIVITY': {
          if (opts.onAddressActivity) {
            await opts.onAddressActivity(payload as AddressActivityPayload);
            processed = (payload as AddressActivityPayload).event?.activity?.length || 1;
          }
          break;
        }
        case 'MINED_TRANSACTIONS': {
          if (opts.onMined) {
            await opts.onMined(payload as MinedTransactionsPayload);
            processed = (payload as MinedTransactionsPayload).event?.activity?.length || 1;
          }
          break;
        }
        case 'DROPPED_TRANSACTIONS': {
          if (opts.onDropped) {
            await opts.onDropped(payload as DroppedTransactionsPayload);
            processed = (payload as DroppedTransactionsPayload).event?.activity?.length || 1;
          }
          break;
        }
        case 'NFT_ACTIVITY': {
          if (opts.onNft) {
            await opts.onNft(payload as NftActivityPayload);
            processed = (payload as NftActivityPayload).event?.activity?.length || 1;
          }
          break;
        }
        case 'SOLANA': {
          if (opts.onSolana) {
            await opts.onSolana(payload as SolanaPayload);
            processed = (payload as SolanaPayload).event?.activity?.length || 1;
          }
          break;
        }
      }
    } catch (err) {
      errors.push(`handler error: ${(err as Error).message}`);
      return NextResponse.json(
        { ok: false, type, processed, errors },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: errors.length === 0,
      type,
      processed,
      errors,
    });
  };
}

// =============================================================================
// 工具：统一错误响应
// =============================================================================

export function webhookErrorResponse(
  type: AlchemyWebhookType,
  errors: string[],
  status: number,
): NextResponse {
  return NextResponse.json(
    { ok: false, type, processed: 0, errors },
    { status },
  );
}
