import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.prisma = customPrisma || prisma;
  }

  withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}

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
  const pageSize = Math.min(100, Math.max(1, pagination.pageSize));
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