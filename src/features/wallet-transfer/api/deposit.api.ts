import { DepositAddress, DepositRecord, ApiResponse, PaginatedResponse } from '../types/transfer.types';

async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
      ...options.headers,
    },
    ...options,
  });

  const json = await res.json();
  if (!json.success && json.error) {
    throw new Error(json.error.message ?? 'Failed to fetch');
  }

  return json;
}

export async function getDepositAddress(params: {
  userId: string;
  walletId?: string;
  chainType: string;
  chainId: string;
}): Promise<DepositAddress> {
  const qs = new URLSearchParams({
    userId: params.userId,
    chainType: params.chainType,
    chainId: params.chainId,
  });

  if (params.walletId) qs.set('walletId', params.walletId);

  const res = await fetchApi<DepositAddress>(`/api/v1/wallet/deposit-addresses/default?${qs}`);
  return res.data;
}

export async function listDeposits(params: {
  userId: string;
  assetSymbol?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<DepositRecord>> {
  const qs = new URLSearchParams({
    userId: params.userId,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  });

  if (params.assetSymbol) qs.set('assetSymbol', params.assetSymbol);
  if (params.status) qs.set('status', params.status);

  const res = await fetchApi<PaginatedResponse<DepositRecord>>(`/api/v1/wallet/deposits?${qs}`);
  return res.data;
}