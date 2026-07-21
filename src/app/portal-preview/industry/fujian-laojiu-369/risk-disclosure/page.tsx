/**
 * /portal-preview/industry/fujian-laojiu-369/risk-disclosure - 福建老酒369 风险披露（P4-0294）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：LegalDisclosureTemplate
 * 约束：强合规审核页面，文案必须严谨
 */

import React from 'react';
import { LegalDisclosureTemplate, type LegalSection } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '福建老酒369 风险披露 | ZSDEX',
  description: '福建老酒369 完整风险披露与免责声明',
};

const SECTIONS: LegalSection[] = [
  {
    id: 'general',
    title: '总则',
    paragraphs: [
      '本风险披露文档适用于 ZSDEX 平台"福建老酒369"产业资产板块的所有页面与功能。',
      '本平台以"合规研究、市场观察、风险披露、用户自行判断风险、区域市场观察"为合规表达原则，严格禁止任何形式的违规承诺表达。',
      '用户在访问、浏览、使用"福建老酒369"相关页面与功能前，请仔细阅读并充分理解本风险披露文档。',
    ],
  },
  {
    id: 'no-guarantee',
    title: '无任何形式的有保障承诺',
    paragraphs: [
      '本平台明确声明：不对"福建老酒369"作出任何形式的以下承诺或暗示：',
      '· 不承诺保收益、不承诺保本收益；',
      '· 不承诺稳定收益、不承诺年化收益；',
      '· 不承诺升值空间、不暗示必然升值；',
      '· 不提供投资回报预测或暗示；',
      '· 不承诺资产绝对安全、不承诺零风险；',
      '· 不承诺稳赚、不暗示"上线必涨"；',
      '· 不承诺平台兜底、不承诺承诺回购；',
      '· 不承诺无风险认购、不承诺酒资产稳赚；',
      '· 不承诺保证可交易、不承诺保证可提现；',
      '· 不表达"持牌发行"、不表达"合规发行保证"、不表达"发币即上市"。',
      '所有上述或类似违规表达，均不构成本平台的承诺。',
    ],
  },
  {
    id: 'business-scope',
    title: '业务范围边界',
    paragraphs: [
      'P4 阶段（当前阶段）"福建老酒369"板块的业务范围严格限定为：',
      '· 产业资产入口级骨架；',
      '· 项目背景与文化价值说明；',
      '· 移动端 H5 入口（仅展示"H5 已经做好"，不嵌入真实 H5 业务）；',
      '· 合规研究与监管观察说明；',
      '· 风险披露与免责声明。',
      '以下业务在 P4 阶段明确禁止实现：',
      '· 真实发行系统；',
      '· 真实发币 / 通证系统；',
      '· 真实认购 / 申购；',
      '· 真实资产登记 / 上链；',
      '· 真实钱包 / 充值 / 提现；',
      '· 真实交易 / 撮合。',
    ],
  },
  {
    id: 'user-responsibility',
    title: '用户责任',
    paragraphs: [
      '用户应自行判断风险，并对自己的投资决策承担全部责任。',
      '用户应充分了解数字资产投资、传统老酒投资、文化资产收藏等多种投资形式的风险特征。',
      '用户应严格遵守所在地区法律法规，不得在法律法规禁止的地区访问或使用本板块相关服务。',
      '如用户对本风险披露文档存在疑问，应通过官方渠道咨询专业意见后再做决策。',
    ],
  },
  {
    id: 'compliance',
    title: '合规承诺',
    paragraphs: [
      '本平台持续关注全球数字资产监管动态，重点研究方向包括合规研究、市场观察、监管框架、持牌可行性研究等。',
      '本平台将根据合规研究方向进展，适时调整"福建老酒369"板块的服务范围与产品设计。',
      '本平台保留根据业务发展需要修改本风险披露文档的权利，重大变更将通过站内通知、邮件等方式告知。',
      '如本风险披露文档部分条款被认定为无效，不影响其他条款的效力。',
    ],
  },
  {
    id: 'disclaimer',
    title: '免责声明',
    paragraphs: [
      '本平台所提供的"福建老酒369"所有信息（包括但不限于文化介绍、项目说明、规划内容）仅供参考，不构成投资建议、法律意见或专业咨询。',
      '本平台不对以下情况承担责任：',
      '· 用户因理解偏差或操作失误导致的任何损失；',
      '· 不可抗力导致的服务中断或数据丢失；',
      '· 第三方（包括但不限于产业方、合作方、媒体）行为导致的损失；',
      '· 因法律法规变化导致的服务调整对用户造成的影响。',
    ],
  },
  {
    id: 'contact',
    title: '联系方式',
    paragraphs: [
      '如您对本风险披露文档有任何疑问或建议，请通过以下官方渠道联系我们：',
      '· 站内工单系统；',
      '· 官方客服邮箱（请通过帮助中心获取最新邮箱地址）；',
      '· 在线客服（请通过帮助中心获取入口）。',
      '请注意：本平台不会通过非官方渠道要求用户提供密码、私钥、验证码等敏感信息。',
    ],
  },
];

export default function Laojiu369RiskDisclosurePage() {
  return (
    <LegalDisclosureTemplate
      title="福建老酒369 风险披露"
      lastUpdated="2026-07-21"
      effectiveDate="2026-07-21"
      version="v1.0 (P4 阶段示例)"
      breadcrumbs={buildBreadcrumbs('/portal-preview/industry/fujian-laojiu-369/risk-disclosure')}
      sections={SECTIONS}
      complianceNote="本页内容为 P4 阶段示例数据，最终正式版本以平台官方公告为准。本平台不提供任何形式的有保障承诺、收益保证或资产绝对安全声明。"
    />
  );
}
