/**
 * Kaiko 行情数据接入（机构级）
 *
 * 三大模块：
 *  - types.ts         类型定义
 *  - kaiko-client.ts  REST 客户端（多区域 + 限流 + 重试 + mock）
 *  - kaiko-ws.ts      WebSocket 客户端（实时推送 + 重连）
 *  - kaiko-service.ts 业务层（BBO / Index / 历史 / FX / 校验）
 *
 * 详见 ./README.md
 */

export * from './types';
export * from './kaiko-client';
export * from './kaiko-ws';
export * from './kaiko-service';
