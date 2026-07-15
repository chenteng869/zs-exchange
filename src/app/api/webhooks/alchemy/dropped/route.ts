/**
 * Alchemy Dropped Transactions Webhook 路由（P2-4）
 *
 * 功能：检测提现交易因 Gas 不足 / nonce 冲突被 mempool 丢弃
 * - 自动重广播（提高 Gas 20%）
 * - 推送告警给用户
 * - 触发运维告警
 *
 * 配套 Dropped Webhook（Alchemy Dashboard）：
 *  - 类型: Dropped Transactions
 *  - 监控地址: 平台提现热钱包
 *  - URL: /api/webhooks/alchemy/dropped
 *  - Signing Key: ALCHEMY_WEBHOOK_DROPPED_KEY
 */

import { createAlchemyWebhookRoute } from '@/lib/wallet/webhook-router';
import type { DroppedTransactionsPayload } from '@/lib/wallet/webhook-types';
import prisma from '@/lib/prisma';
import { alertService } from '@/lib/monitoring/alert-service';
import { safeConsoleWarn } from '@/lib/security/safe-logger';
import { retryWithdrawnTransaction } from '@/lib/wallet/withdrawal-resender';

export const POST = createAlchemyWebhookRoute('DROPPED_TRANSACTIONS', {
  onDropped: async (payload: DroppedTransactionsPayload) => {
    const { event, id: webhookEventId } = payload;
    const network = event.network;
    const activities = event.activity || [];

    safeConsoleWarn(`[alchemy-dropped] received webhook event=${webhookEventId} network=${network} activities=${activities.length}`);

    for (const act of activities) {
      const txHash = act.hash;
      const reason = act.reason;

      try {
        // 1. 查找对应提现
        const withdrawal = await prisma.walletWithdrawal.findFirst({
          where: { txHash },
        });

        if (!withdrawal) {
          safeConsoleWarn(`[alchemy-dropped] no withdrawal found for txHash=${txHash}`);
          continue;
        }

        // 2. 标记为卡单
        await prisma.walletWithdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: 'dropped',
            dropReason: reason,
            droppedAt: new Date(),
          },
        });

        safeConsoleWarn(`[alchemy-dropped] withdrawal ${withdrawal.id} marked dropped reason=${reason}`);

        // 3. 自动重广播（用更高 Gas 重发）
        try {
          await retryWithdrawnTransaction(withdrawal.id, { reason });
          safeConsoleWarn(`[alchemy-dropped] auto-retry triggered for withdrawal ${withdrawal.id}`);
        } catch (retryErr) {
          safeConsoleWarn(`[alchemy-dropped] auto-retry failed for withdrawal ${withdrawal.id}: ${(retryErr as Error).message}`);
          // 重试失败 → 触发 critical 告警
          try {
            await alertService.sendAlert({
              type: 'withdrawal_dropped_retry_failed',
              level: 'critical',
              resourceId: txHash,
              userId: withdrawal.userId,
              message: `[withdrawal] auto-retry failed for txHash=${txHash} reason=${reason}`,
              metadata: { withdrawalId: withdrawal.id, reason, originalError: (retryErr as Error).message },
            });
          } catch {
            // 告警失败不阻塞
          }
        }

        // 4. 推送告警给运维
        try {
          await alertService.sendAlert({
            type: 'withdrawal_dropped',
            level: 'medium',
            resourceId: txHash,
            userId: withdrawal.userId,
            message: `[withdrawal] ${withdrawal.id} dropped (reason=${reason}), auto-retry triggered`,
            metadata: { withdrawalId: withdrawal.id, reason, network },
          });
        } catch {
          // 告警失败不阻塞
        }
      } catch (err) {
        safeConsoleWarn(`[alchemy-dropped] failed to process txHash=${txHash}: ${(err as Error).message}`);
      }
    }
  },
});
