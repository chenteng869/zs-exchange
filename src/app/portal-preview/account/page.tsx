/**
 * /portal-preview/account - 账户入口聚合页（P4-0111）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：AccountEntryTemplate
 * 约束：仅静态骨架，不接真实账户系统
 */

import React from 'react';
import { AccountEntryTemplate } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '账户中心 | ZSDEX',
  description: '登录、注册、KYC 认证、安全中心入口',
};

const KYC_STEPS = [
  { title: '基础信息', description: '填写姓名、国籍、证件号码等基础身份信息' },
  { title: '证件上传', description: '上传身份证 / 护照 / 驾照等有效证件正反面' },
  { title: '人脸识别', description: '通过手机或电脑摄像头完成活体检测' },
  { title: '审核等待', description: '通常 1-3 个工作日内完成审核，结果将通过邮件通知' },
  { title: '审核通过', description: '解锁充值、提现、合约等高级功能' },
];

const SECURITY_FEATURES = [
  { icon: '🔐', title: '双因素认证 (2FA)', description: '支持 Google Authenticator、短信验证' },
  { icon: '🛡️', title: '反钓鱼码', description: '设置专属防伪标识，识别官方邮件' },
  { icon: '📱', title: '设备管理', description: '查看并管理已登录设备，及时移除异常设备' },
  { icon: '🔒', title: '资金密码', description: '独立于登录密码的二次确认机制' },
  { icon: '📍', title: '登录提醒', description: '异地登录、异常操作实时通知' },
  { icon: '🚨', title: '账户冻结', description: '紧急情况下可一键冻结账户与提现' },
];

export default function AccountPage() {
  return (
    <AccountEntryTemplate
      title="账户中心"
      description="登录、注册、KYC 认证与安全中心入口，本页面仅展示入口级骨架"
      breadcrumbs={buildBreadcrumbs('/portal-preview/account')}
      kycSteps={KYC_STEPS}
      securityFeatures={SECURITY_FEATURES}
      complianceNote="KYC 认证是平台合规运营的必要环节，用户应提供真实有效的身份信息。平台严格遵守个人信息保护相关法律法规，所有身份信息均加密存储。"
    />
  );
}
