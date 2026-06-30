import { WithdrawQuote, WithdrawRecord, ApiResponse, PaginatedResponse } from '../types/transfer.types';

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

export async function quoteWithdraw(input: {
  chainType: string;
  chainId: string;
  assetSymbol: string;
  contractAddress?: string;
  amount: string;
  toAddress: string;
}): Promise<WithdrawQuote> {
  const res = await fetchApi<WithdrawQuote>('/api/v1/wallet/withdrawals/quote', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function createWithdraw(input: {
  userId: string;
  walletId?: string;
  chainType: string;
  chainId: string;
  toAddress: string;
  assetSymbol: string;
  contractAddress?: string;
  amount: string;
  idempotencyKey: string;
}): Promise<{ withdrawNo: string; status: string }> {
  const idempotencyKey = input.idempotencyKey;
  const res = await fetchApi<{ withdrawNo: string; status: string }>('/api/v1/wallet/withdrawals', {
    method: 'POST',
    headers: {
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function listWithdrawals(params: {
  userId: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<WithdrawRecord>> {
  const qs = new URLSearchParams({
    userId: params.userId,
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
  });

  if (params.status) qs.set('status', params.status);

  const res = await fetchApi<PaginatedResponse<WithdrawRecord>>(`/api/v1/wallet/withdrawals?${qs}`);
  return res.data;
}