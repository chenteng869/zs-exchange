/**
 * /portal-preview/assets - 资产入口聚合页（P4-0146）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：AssetEntryTemplate
 * 约束：仅静态骨架，不接真实资金
 */

import React from 'react';
import { AssetEntryTemplate } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '资产中心 | ZSDEX',
  description: '充值、提现、转账、历史记录入口',
};

export default function AssetsPage() {
  return (
    <AssetEntryTemplate
      title="资产中心"
      description="统一管理您在 ZSDEX 平台的所有数字资产，本页面仅展示入口级骨架"
      breadcrumbs={buildBreadcrumbs('/portal-preview/assets')}
      depositUrl="/portal-preview/assets/deposit"
      withdrawUrl="/portal-preview/assets/withdraw"
      transferUrl="/portal-preview/assets/transfer"
      historyUrl="/portal-preview/assets/history"
      riskDisclosure="数字资产的充值、提现与转账操作均涉及链上交易，一旦完成通常不可撤销。用户在操作前应仔细核对地址、网络与金额，避免因操作失误导致资产损失。本平台不提供任何形式的资金托管保证，所有资产由用户自行掌控私钥或通过多重签名机制保护。"
      complianceNote="用户应严格遵守所在地区的反洗钱（AML）与了解你的客户（KYC）相关法律法规。大额或可疑交易可能需要额外审核。"
    />
  );
}
