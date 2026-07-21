/**
 * /portal-preview/industry - 产业资产入口聚合页（P4-0286）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：IndustryAssetTemplate
 * 约束：仅静态骨架
 */

import React from 'react';
import { IndustryAssetTemplate, type IndustryAssetEntry } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '产业资产 | ZSDEX',
  description: '产业资产信息化展示入口，含福建老酒369 等首批核心模块',
};

const ENTRIES: IndustryAssetEntry[] = [
  {
    key: 'fujian-laojiu-369',
    title: '福建老酒369',
    description: '首批核心一级模块，传承福建老酒文化，展示老酒资产信息化能力',
    href: '/portal-preview/industry/fujian-laojiu-369',
    badge: '首批核心',
    status: 'HOT',
    features: ['文化传承', '老酒资产', '信息化展示', '链上存证'],
  },
  {
    key: 'industry-overview',
    title: '产业资产总览',
    description: '了解 ZSDEX 产业资产信息化展示的整体规划与方向',
    href: '/portal-preview/industry/overview',
    features: ['规划总览', '扩展原则', '合规框架'],
  },
  {
    key: 'industry-research',
    title: '产业资产研究方向',
    description: '产业资产上链、存证、溯源等能力的研究方向',
    href: '/portal-preview/industry/research',
    features: ['研究方向', '能力规划', '合规观察'],
  },
  {
    key: 'future-asset',
    title: '未来产业资产',
    description: '更多产业资产模块正在规划中（规划中）',
    href: '/portal-preview/industry/future',
    status: 'SOON',
    features: ['待规划', '扩展占位'],
  },
];

export default function IndustryPage() {
  return (
    <IndustryAssetTemplate
      title="产业资产"
      description="探索 ZSDEX 产业资产信息化展示能力，首批核心模块为福建老酒369"
      breadcrumbs={buildBreadcrumbs('/portal-preview/industry')}
      kpis={[
        { label: '已落地模块', value: 1, suffix: '个' },
        { label: '规划中模块', value: 5, suffix: '+' },
        { label: '覆盖品类', value: 3, suffix: '类' },
        { label: '合规审查', value: 100, suffix: '%', decimals: 0 },
      ]}
      entries={ENTRIES}
      riskDisclosure="产业资产的信息化展示仅用于文化传承与资产展示目的，不构成投资建议或任何形式的收益承诺。相关资产的真实性、合规性由相应产业方负责。用户应自行判断风险，谨慎决策。"
      complianceNote={'ZSDEX 产业资产板块严格遵守「合规研究、市场观察、风险披露、用户自行判断风险、区域市场观察」等中性合规表达原则。'}
    />
  );
}
