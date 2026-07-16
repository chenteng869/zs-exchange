/**
 * H5 端：实时区块 SSE 路由（P4-4）
 *
 * GET /api/v1/realtime/blocks?chain=eth
 *
 * 推送新区块给前端（替代轮询 eth_blockNumber）
 *  - 延迟 < 1s
 *  - 节省后端轮询
 */

import { NextRequest } from 'next/server';
import { getAlchemyWsClient, type WsChainKey } from '@/lib/alchemy/websocket';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = (searchParams.get('chain') || 'eth') as WsChainKey;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // 立即发送 connection 消息
      controller.enqueue(encoder.encode(`: connected chain=${chain}\n\n`));

      try {
        const ws = getAlchemyWsClient(chain);
        const unsubscribe = ws.subscribeNewHeads((block: any) => {
          try {
            const data = JSON.stringify({
              type: 'block',
              chain,
              number: parseInt(block.number, 16),
              hash: block.hash,
              timestamp: parseInt(block.timestamp, 16),
              gasUsed: block.gasUsed ? parseInt(block.gasUsed, 16) : undefined,
              miner: block.miner,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (err) {
            safeConsoleWarn(`[realtime/blocks] send failed: ${(err as Error).message}`);
          }
        });

        // 处理客户端断开
        const abort = () => {
          unsubscribe();
          controller.close();
        };
        req.signal.addEventListener('abort', abort);
      } catch (err) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
