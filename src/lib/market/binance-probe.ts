/**
 * 真实网络环境探测
 *
 * 用于在演示启动前检测：
 *  - 能否连通 Binance REST API
 *  - 能否连通 Binance WebSocket
 *  - 若均不可用，明确告知用户将进入 fallback 模式
 */

import { BinanceRestClient, BinanceWsClient, BINANCE_REST_BASE } from './binance-client';

export interface ProbeResult {
  rest: boolean;
  restUrl: string;
  restLatencyMs?: number;
  ws: boolean;
  wsUrl: string;
  timestamp: string;
  message: string;
}

export async function probeBinanceConnectivity(timeoutMs = 5000): Promise<ProbeResult> {
  // 1. REST 连通性
  const restStart = Date.now();
  let rest = false;
  let restLatencyMs: number | undefined;
  try {
    const client = new BinanceRestClient({ timeoutMs });
    rest = await client.ping();
    if (rest) restLatencyMs = Date.now() - restStart;
  } catch {
    rest = false;
  }

  // 2. WebSocket 连通性（构造后立即关闭）
  let ws = false;
  try {
    const wsClient = new BinanceWsClient({
      initialReconnectMs: 100,
      maxReconnectMs: 1000,
      heartbeatMs: 0,
    });
    let opened = false;
    const origOnOpen = (wsClient as any).onOpen;
    (wsClient as any).onOpen = () => { opened = true; origOnOpen?.(); };
    wsClient.connect();
    await new Promise<void>((resolve) => {
      const start = Date.now();
      const check = () => {
        if (opened || Date.now() - start > 3000) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
    ws = wsClient.connected;
    wsClient.disconnect();
  } catch {
    ws = false;
  }

  const ts = new Date().toISOString();
  let message: string;
  if (rest && ws) {
    message = '✓ Binance 网络完全可用，将使用真实行情（live 模式）';
  } else if (rest || ws) {
    message = `⚠ Binance 部分可用（REST=${rest} WS=${ws}），将混合运行`;
  } else {
    message = '✗ Binance 不可用，将进入 fallback 模式（本地模拟行情）';
  }

  return {
    rest,
    restUrl: BINANCE_REST_BASE,
    restLatencyMs,
    ws,
    wsUrl: 'wss://stream.binance.com:9443/stream',
    timestamp: ts,
    message,
  };
}

// 命令行入口（演示/调试用）
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('binance-probe.ts')) {
  probeBinanceConnectivity().then(r => {
    console.log('=== Binance 网络探测 ===');
    console.log('REST:', r.rest, r.restLatencyMs ? `(${r.restLatencyMs}ms)` : '');
    console.log('WS:  ', r.ws);
    console.log('结果:', r.message);
    process.exit(0);
  });
}
