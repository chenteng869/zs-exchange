import { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.prisma = customPrisma || prisma;
  }

  withTransaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}

export { prisma };
