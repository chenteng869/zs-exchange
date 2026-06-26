/**
 * Prisma Client 单例初始化
 * 
 * 使用模式：
 * import { prisma } from '@/lib/prisma';
 * const users = await prisma.user.findMany();
 * 
 * 注意：在 Next.js API Routes 和 Server Components 中使用时，
 * 需要确保连接池正确配置，避免连接泄漏
 */

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;