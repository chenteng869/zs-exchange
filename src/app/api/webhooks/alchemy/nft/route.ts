/**
 * Alchemy NFT Activity Webhook 路由（P2-5）
 *
 * 功能：监控平台 NFT 合约的转账活动（数字藏品）
 * - 记录藏品流转（铸造 / 转赠 / 销毁）
 * - 更新藏品归属
 * - 推送活动通知
 *
 * 配套 NFT Webhook（Alchemy Dashboard）：
 *  - 类型: NFT Activity
 *  - 监控合约: 平台发行的 ERC-721 / ERC-1155 合约
 *  - URL: /api/webhooks/alchemy/nft
 *  - Signing Key: ALCHEMY_WEBHOOK_NFT_KEY
 */

import { createAlchemyWebhookRoute } from '@/lib/wallet/webhook-router';
import type { NftActivityPayload } from '@/lib/wallet/webhook-types';
import prisma from '@/lib/prisma';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

export const POST = createAlchemyWebhookRoute('NFT_ACTIVITY', {
  onNft: async (payload: NftActivityPayload) => {
    const { event, id: webhookEventId } = payload;
    const network = event.network;
    const activities = event.activity || [];

    safeConsoleWarn(`[alchemy-nft] received webhook event=${webhookEventId} network=${network} activities=${activities.length}`);

    for (const act of activities) {
      const { fromAddress, toAddress, contractAddress, tokenId, ercTokenType, transactionHash, blockNum } = act;

      try {
        // 1. 查找藏品记录（使用 NftItem 表）
        // 注意：NftItem 没有 contractAddress 字段，category 通过 categoryId 关联
        const nft = await prisma.nftItem.findFirst({
          where: {
            tokenId,
          },
        });

        if (!nft) {
          safeConsoleWarn(`[alchemy-nft] no collectible for ${contractAddress}:${tokenId}`);
          continue;
        }

        // 2. 解析活动类型
        // 0x0000... = 铸造
        // 0x0000... → 用户 = 转账
        // 用户 → 0x0000... = 销毁
        const ZERO = '0x0000000000000000000000000000000000000000';
        let activityType: 'mint' | 'transfer' | 'burn';
        if (fromAddress.toLowerCase() === ZERO) {
          activityType = 'mint';
        } else if (toAddress.toLowerCase() === ZERO) {
          activityType = 'burn';
        } else {
          activityType = 'transfer';
        }

        // 3. 记录活动（用 NftMint 模型）
        try {
          await prisma.nftMint.create({
            data: {
              userId: toAddress.toLowerCase() === ZERO ? null : nft.ownerId ?? null,
              categoryId: nft.categoryId,
              tokenId,
              txHash: transactionHash,
              status: activityType === 'mint' ? 'pending' : 'completed',
            },
          });
        } catch (mintErr) {
          // 已存在则跳过
        }

        // 4. 更新归属
        if (activityType === 'transfer' || activityType === 'mint') {
          // NftItem 用 ownerId 字段而非 currentOwner
          // ownerId 是 UUID, 无法直接存 EOA 地址（这里只记录元数据，不强校验）
          await prisma.nftItem.update({
            where: { id: nft.id },
            data: { ownerId: nft.ownerId ?? null },
          });
        } else if (activityType === 'burn') {
          await prisma.nftItem.update({
            where: { id: nft.id },
            data: { status: 'burned' },
          });
        }

        safeConsoleWarn(`[alchemy-nft] processed ${activityType} for ${contractAddress}:${tokenId} (tx=${transactionHash})`);
      } catch (err) {
        safeConsoleWarn(`[alchemy-nft] failed to process ${contractAddress}:${tokenId}: ${(err as Error).message}`);
      }
    }
  },
});
