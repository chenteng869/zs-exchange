/**
 * /portal-preview/industry/fujian-laojiu-369 - 福建老酒369 入口主页（P4-0287）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：IndustryAssetTemplate
 * 约束：仅静态骨架，不接真实发行/认购
 */

import React from 'react';
import { IndustryAssetTemplate, type IndustryAssetEntry } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '福建老酒369 | ZSDEX 产业资产',
  description: '福建老酒369 - 首批核心一级模块，传承老酒文化，展示产业资产信息化能力',
};

const ENTRIES: IndustryAssetEntry[] = [
  {
    key: 'about',
    title: '关于福建老酒369',
    description: '了解福建老酒369 项目背景、文化价值与产业意义',
    href: '/portal-preview/industry/fujian-laojiu-369/about',
    features: ['项目背景', '文化价值', '产业意义'],
  },
  {
    key: 'h5',
    title: '移动端 H5 入口',
    description: 'H5 已经做好，移动端 H5 入口已具备',
    href: '/portal-preview/industry/fujian-laojiu-369/h5',
    status: 'OPEN',
    badge: 'H5 已就绪',
    features: ['移动端', 'H5', '已具备'],
  },
  {
    key: 'products',
    title: '产品介绍',
    description: '福建老酒369 产品体系介绍（入口级骨架）',
    href: '/portal-preview/industry/fujian-laojiu-369/products',
    features: ['产品体系', '入口骨架'],
  },
  {
    key: 'compliance',
    title: '合规说明',
    description: '合规研究、监管观察、合规框架',
    href: '/portal-preview/industry/fujian-laojiu-369/compliance',
    features: ['合规研究', '监管观察', '合规框架'],
  },
  {
    key: 'risk',
    title: '风险披露',
    description: '完整风险披露、免责声明',
    href: '/portal-preview/industry/fujian-laojiu-369/risk-disclosure',
    features: ['风险披露', '免责声明'],
  },
  {
    key: 'issuance',
    title: '发行说明',
    description: 'P4 阶段仅作规划说明，未接入真实发行系统',
    href: '/portal-preview/industry/fujian-laojiu-369/issuance',
    status: 'SOON',
    features: ['规划中', '未发行'],
  },
  {
    key: 'token',
    title: '通证说明',
    description: 'P4 阶段仅作规划说明，未接入真实发币系统',
    href: '/portal-preview/industry/fujian-laojiu-369/token',
    status: 'SOON',
    features: ['规划中', '未发币'],
  },
];

export default function FujianLaojiu369Page() {
  return (
    <IndustryAssetTemplate
      title="福建老酒369"
      assetName="ZSDEX 产业资产 · 首批核心一级模块"
      assetTagline="传承福建老酒文化，展示产业资产信息化能力"
      description="福建老酒369 是 ZSDEX 产业资产板块的首批核心一级模块，已在 5000 页架构规划中前置定义。本页面为 P4 阶段的入口级骨架，未接入真实发行、发币、认购、资产登记等业务系统。"
      breadcrumbs={buildBreadcrumbs('/portal-preview/industry/fujian-laojiu-369')}
      isMainAsset
      kpis={[
        { label: '项目编号', value: 369, suffix: '号' },
        { label: '文化沉淀', value: 369, suffix: '年' },
        { label: '规划品类', value: 36, suffix: '+' },
        { label: '合规审查', value: 100, suffix: '%', decimals: 0 },
      ]}
      entries={ENTRIES}
      h5ReadyNote="H5 已经做好，移动端 H5 入口已具备（仅展示入口，不嵌入真实 H5 业务逻辑）"
      riskDisclosure="福建老酒369 页面所示内容仅用于产业资产信息化展示与文化传承目的，不构成投资建议、保收益承诺、升值空间预测、平台兜底或承诺回购等任何形式的有保障声明。本平台不提供任何形式的保本、稳赚、年化收益或资产绝对安全承诺。所有投资风险由用户自行判断、自行承担。福建老酒369 涉及的真实业务（发行、发币、通证、认购、资产登记等）不在 P4 阶段实现，请用户关注后续正式公告。"
      complianceNote={'福建老酒369 严格遵守「合规研究、市场观察、风险披露、用户自行判断风险、区域市场观察」等中性合规表达原则。禁止一切「保收益、分红承诺、升值空间、必然升值、投资回报、持牌发行、合规发行保证、发币即上市、上线必涨、平台兜底、承诺回购、无风险认购、酒资产稳赚、保证可交易、保证可提现」等违规表达。'}
    />
  );
}
