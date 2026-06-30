import { AddressBookEntry, ApiResponse, PaginatedResponse } from '../types/transfer.types';

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

export async function addAddressBookEntry(input: {
  userId: string;
  chainType: string;
  chainId: string;
  assetSymbol: string;
  address: string;
  label: string;
}): Promise<AddressBookEntry> {
  const res = await fetchApi<AddressBookEntry>('/api/v1/wallet/address-book', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function listAddressBook(params: {
  userId: string;
  chainType?: string;
  chainId?: string;
  assetSymbol?: string;
}): Promise<PaginatedResponse<AddressBookEntry>> {
  const qs = new URLSearchParams({
    userId: params.userId,
  });

  if (params.chainType) qs.set('chainType', params.chainType);
  if (params.chainId) qs.set('chainId', params.chainId);
  if (params.assetSymbol) qs.set('assetSymbol', params.assetSymbol);

  const res = await fetchApi<PaginatedResponse<AddressBookEntry>>(`/api/v1/wallet/address-book?${qs}`);
  return res.data;
}

export async function deleteAddressBookEntry(id: string): Promise<void> {
  await fetchApi<void>(`/api/v1/wallet/address-book/${id}`, {
    method: 'DELETE',
  });
}