/**
 * 现货交易 API — 调用 /api/v1/trade/* 和 /api/v1/market/*
 * 官网 + H5 共用
 */

import { apiGet, apiPost } from './client';

export interface SpotOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  quantity: string;
  price: string;
  status: string;
  filledQty: string;
  avgFillPrice: string;
  createdAt: number;
}

export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface PlaceSpotOrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  quantity: string;
  price?: string;
  clientOrderId?: string;
}

export const spotApi = {
  // 订单
  placeOrder: (params: PlaceSpotOrderParams) =>
    apiPost<SpotOrder>('/api/v1/trade/orders?action=place', params),

  cancelOrder: (orderId: string) =>
    apiPost('/api/v1/trade/orders?action=cancel', { orderId }),

  getOpenOrders: (symbol?: string) =>
    apiGet<{ orders: SpotOrder[]; total: number }>(
      `/api/v1/trade/orders?action=open${symbol ? `&symbol=${symbol}` : ''}`
    ),

  getOrderHistory: (symbol?: string, page = 1, pageSize = 20) =>
    apiGet<{ items: SpotOrder[]; total: number }>(
      `/api/v1/trade/orders?action=history${symbol ? `&symbol=${symbol}` : ''}&page=${page}&pageSize=${pageSize}`
    ),

  // 余额
  getBalances: () =>
    apiGet<SpotBalance[]>('/api/v1/wallet/balances?action=list'),

  getBalance: (asset: string) =>
    apiGet<SpotBalance>(`/api/v1/wallet/balances?action=detail&asset=${asset}`),
};
