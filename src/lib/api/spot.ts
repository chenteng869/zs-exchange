import { apiDelete, apiGet, apiPost } from './client';

export interface SpotOrder {
  id: string;
  orderId?: string;
  symbol: string;
  side: 'buy' | 'sell';
  type?: 'limit' | 'market';
  orderType?: 'limit' | 'market';
  quantity?: string;
  amount?: string;
  filledAmount?: string;
  remainingAmount?: string;
  executedValue?: string;
  fee?: string;
  feeCurrency?: string;
  price?: string | null;
  status: string;
  filledQty?: string;
  avgFillPrice?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  closedAt?: string | number | null;
  timeInForce?: string | null;
  matched?: boolean;
  trades?: unknown[];
}

export interface SpotBalance {
  id?: string;
  userId?: string;
  asset?: string;
  currency?: string;
  free?: string;
  available?: string;
  locked?: string;
  frozen?: string;
  total?: string;
  balance?: string;
}

export interface PlaceSpotOrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  quantity: string;
  price?: string;
  clientOrderId?: string;
}

export interface PaginatedSpotOrders {
  list: SpotOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasMore?: boolean;
}

export interface GetSpotOrdersParams {
  symbol?: string;
  side?: 'buy' | 'sell';
  status?: string;
  type?: 'limit' | 'market';
  page?: number;
  pageSize?: number;
}

function buildOrderQuery(params: GetSpotOrdersParams = {}) {
  const query = new URLSearchParams();

  if (params.symbol) query.set('symbol', params.symbol);
  if (params.side) query.set('side', params.side);
  if (params.status) query.set('status', params.status);
  if (params.type) query.set('type', params.type);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const text = query.toString();
  return text ? `?${text}` : '';
}

function getOrders(params: GetSpotOrdersParams = {}) {
  return apiGet<PaginatedSpotOrders>(`/api/v1/trade/orders${buildOrderQuery(params)}`);
}

export const spotApi = {
  placeOrder: (params: PlaceSpotOrderParams) =>
    apiPost<SpotOrder>('/api/v1/trade/orders', {
      ...params,
      amount: params.quantity,
    }),

  cancelOrder: (orderId: string) =>
    apiDelete<SpotOrder>('/api/v1/trade/orders', { orderId }),

  getOrders,

  getOpenOrders: (symbol?: string) =>
    getOrders({ symbol, status: 'open', pageSize: 50 }),

  getOrderHistory: (symbol?: string, page = 1, pageSize = 20) =>
    getOrders({ symbol, page, pageSize }),

  getBalances: () =>
    apiGet<SpotBalance[]>('/api/v1/wallet/balances'),

  getBalance: (asset: string) =>
    apiGet<SpotBalance[]>(`/api/v1/wallet/balances?currency=${asset}`),
};
