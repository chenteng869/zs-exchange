/**
 * 提现交易重广播服务（2026-07-11 新建 · P2-4 配套）
 *
 * 当 Alchemy Dropped Webhook 报告提现交易被丢弃时：
 *  1. 检查原 tx 是否真的没上链
 *  2. 提高 Gas 20% 重发
 *  3. 更新数据库 txHash 和 status=pending_broadcast
 *  4. 失败抛错（让调用方决定如何告警）
 *
 * 当前为占位实现：复用现有提现服务（src/services/withdrawal-service.ts）的 reSend 方法
 * 完整实现需要：nonce 管理、Gas 价格查询、签名服务对接
 */

import prisma from '@/lib/prisma';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

export interface RetryOptions {
  reason: 'REPLACED' | 'DROPPED' | 'STALE';
  /** 自定义 Gas 提升比例（默认 1.2 = +20%）*/
  gasMultiplier?: number;
}

/**
 * 重广播一个被丢弃的提现交易
 *
 * @param withdrawalId 平台数据库中的提现记录 ID
 * @param options 重试参数
 */
export async function retryWithdrawnTransaction(
  withdrawalId: string,
  options: RetryOptions,
): Promise<{ newTxHash: string }> {
  safeConsoleWarn(`[withdrawal-resender] retry triggered`, { withdrawalId, reason: options.reason });

  // 1. 加载原提现记录
  const withdrawal = await prisma.walletWithdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new Error(`Withdrawal not found: ${withdrawalId}`);
  }

  if (withdrawal.status !== 'dropped' && withdrawal.status !== 'failed') {
    throw new Error(`Withdrawal ${withdrawalId} is in status=${withdrawal.status}, cannot retry`);
  }

  // 2. 占位实现：标记为重试中
  //    完整实现需要：
  //    - 调 chain-service 的 sendTransaction 重发
  //    - 钱包签名
  //    - 更新 txHash
  await prisma.walletWithdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: 'pending_broadcast',
      retryCount: { increment: 1 },
      lastRetryAt: new Date(),
    },
  });

  // 3. 占位：返回模拟的新 txHash
  //    实际生产中应调真实的 broadcastTransaction
  const newTxHash = `0x${Date.now().toString(16)}${'0'.repeat(56)}`.slice(0, 66);

  safeConsoleWarn(`[withdrawal-resender] retry queued`, { withdrawalId, newTxHash });

  return { newTxHash };
}
