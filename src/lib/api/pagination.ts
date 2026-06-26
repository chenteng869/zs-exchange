export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export function parsePagination(query: any): PaginationQuery {
  const read = (key: string) => typeof query?.get === 'function' ? query.get(key) : query?.[key];
  const page = parseInt(read('page') || '1', 10) || 1;
  const pageSize = parseInt(read('pageSize') || read('limit') || '20', 10) || 20;

  return {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(1, pageSize)),
  };
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export function formatPaginatedResult<T>(result: {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}): PaginatedResponse<T> {
  const totalPages = Math.ceil(result.total / result.pageSize);
  return {
    list: result.list,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages,
    hasMore: result.page < totalPages,
  };
}

export default {
  parsePagination,
  formatPaginatedResult,
};
