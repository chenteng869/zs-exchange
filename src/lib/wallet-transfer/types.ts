import { Prisma, TransferChainType } from '@prisma/client';

export type PrismaTx = Prisma.TransactionClient;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildPagination(pagination: PaginationParams) {
  const page = Math.max(1, pagination.page);
  const pageSize = Math.min(200, Math.max(1, pagination.pageSize));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function generateNo(prefix: string): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export interface ChainConfig {
  chainType: TransferChainType;
  chainId: string;
  chainName: string;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl?: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  confirmationBlocks: number;
}
