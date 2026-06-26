/**
 * 合约交易 API — 调用 /api/v1/perp/*
 * 官网 + H5 共用
 */

import { apiGet, apiPost } from './client';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface PerpAccount {
  equity: string;
  walletBalance: string;
  availableBalance: string;
  frozenBalance: string;
  totalUnrealizedPnl: string;
  totalInitialMargin: string;
  marginRatio: string;
  riskLevel: string;
  positionCount: number;
}

export interface PerpPosition {
  id: string;
  userId: string;
  symbol: string;
  side: string;
  positionQty: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string;
  leverage: number;
  marginMode: string;
  margin: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  status: string;
  createdAt: string;
}

export interface PerpOrder {
  orderId: string;
  orderNo: string;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  price: string;
  leverage: number;
  marginMode: string;
  status: string;
  filledQty: string;
  avgFillPrice: string;
  stopPrice: string;
  triggerPrice: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlaceOrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop' | 'stop_market';
  quantity: string;
  price?: string;
  leverage: number;
  marginMode?: 'isolated' | 'cross';
  stopLoss?: string;
  takeProfit?: string;
  clientOrderId?: string;
  reduceOnly?: boolean;
}

// ─── API ────────────────────────────────────────────────────────────────────

export const perpApi = {
  // 账户
  getAccount: () =>
    apiGet<PerpAccount>('/api/v1/perp/account?action=summary'),

  // 持仓
  getPositions: (symbol?: string) =>
    apiGet<{ positions: PerpPosition[]; total: number }>(
      `/api/v1/perp/positions?action=list${symbol ? `&symbol=${symbol}` : ''}`
    ),

  closePosition: (positionId: string, price?: string, quantity?: string) =>
    apiPost('/api/v1/perp/positions?action=close', { positionId, price, quantity }),

  setLeverage: (positionId: string, leverage: number) =>
    apiPost('/api/v1/perp/positions?action=set-leverage', { positionId, leverage }),

  setSlTp: (positionId: string, stopLoss?: string, takeProfit?: string) =>
    apiPost('/api/v1/perp/positions?action=set-sl-tp', { positionId, stopLoss, takeProfit }),

  adjustMargin: (positionId: string, amount: string, direction: 'add' | 'reduce') =>
    apiPost('/api/v1/perp/positions?action=adjust-margin', { positionId, amount, direction }),

  // 订单
  getOpenOrders: (symbol?: string) =>
    apiGet<{ orders: PerpOrder[]; total: number }>(
      `/api/v1/perp/orders?action=open${symbol ? `&symbol=${symbol}` : ''}`
    ),

  getOrderHistory: (symbol?: string, page = 1, pageSize = 20) =>
    apiGet<{ items: PerpOrder[]; total: number }>(
      `/api/v1/perp/orders?action=history${symbol ? `&symbol=${symbol}` : ''}&page=${page}&pageSize=${pageSize}`
    ),

  placeOrder: (params: PlaceOrderParams) =>
    apiPost<PerpOrder>('/api/v1/perp/orders?action=place', params),

  cancelOrder: (orderId: string) =>
    apiPost('/api/v1/perp/orders?action=cancel', { orderId }),

  cancelAllOrders: (symbol?: string) =>
    apiPost('/api/v1/perp/orders?action=cancel-all', { symbol }),

  // 保证金
  getMarginAccount: () =>
    apiGet('/api/v1/perp/margin?action=cross-account'),

  estimateMargin: (params: { symbol: string; side: string; size: string; price: string; leverage: number; marginMode?: string }) =>
    apiPost('/api/v1/perp/margin?action=estimate', params),
};
