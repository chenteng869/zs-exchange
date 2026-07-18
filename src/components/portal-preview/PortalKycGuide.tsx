'use client';

/**
 * PortalKycGuide - KYC 实名认证教学（2026-07-18）
 * 资产来源：Stitch _16
 * 硬约束：只做流程说明，不接真实 KYC API
 */

import React from 'react';
import { User, Camera, FileText, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

const STEPS = [
  {
    icon: User,
    title: '填写基本信息',
    desc: '姓名、身份证号、居住国家、职业类别等。',
    tip: '请使用真实信息，与身份证件完全一致。',
  },
  {
    icon: Camera,
    title: '人脸活体识别',
    desc: '使用手机或电脑摄像头进行 3D 活体检测。',
    tip: '请在光线充足的环境下进行，避免戴帽或口罩。',
  },
  {
    icon: FileText,
    title: '证件上传',
    desc: '身份证 / 护照 / 驾照正反面高清照片。',
    tip: '四角对齐、字迹清晰、无反光遮挡。',
  },
  {
    icon: ShieldCheck,
    title: '审核与通知',
    desc: '通常 1-2 个工作日内完成审核，结果通过站内信通知。',
    tip: '审核未通过时，请根据提示重新提交资料。',
  },
];

const LEVELS = [
  { lv: 'Lv.0', quota: '仅查看行情', limits: '不可交易、不可充值' },
  { lv: 'Lv.1', quota: '充提币 + 现货', limits: '示例限额（单日提现）' },
  { lv: 'Lv.2', quota: '+ 合约 / OTC', limits: '示例限额（单日提现）' },
  { lv: 'Lv.3', quota: '机构全套', limits: '联系商务一对一审核' },
];

export function PortalKycGuide() {
  return (
    <div className="space-y-8">
      {/* 流程图 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="relative rounded-2xl p-5"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-mono font-bold"
                  style={{ color: BRAND.textMute }}
                >
                  STEP {idx + 1}
                </span>
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: BRAND.text }}>
                {s.title}
              </h3>
              <p className="text-xs mb-2" style={{ color: BRAND.textSub }}>
                {s.desc}
              </p>
              <p
                className="text-[10px] p-2 rounded"
                style={{ color: BRAND.textMute, backgroundColor: BRAND.bg }}
              >
                💡 {s.tip}
              </p>
              {idx < STEPS.length - 1 && (
                <ArrowRight
                  className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10"
                  style={{ color: BRAND.border }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 等级说明 */}
      <div>
        <h3 className="text-base font-bold mb-3" style={{ color: BRAND.text }}>
          实名认证等级
        </h3>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
        >
          <div
            className="grid grid-cols-12 gap-2 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: BRAND.textMute, backgroundColor: BRAND.bg }}
          >
            <div className="col-span-2">等级</div>
            <div className="col-span-5">可开通功能</div>
            <div className="col-span-5">限制</div>
          </div>
          {LEVELS.map((l, idx) => (
            <div
              key={l.lv}
              className="grid grid-cols-12 gap-2 px-5 py-3 items-center text-xs"
              style={{ borderTop: idx === 0 ? 'none' : `1px solid ${BRAND.borderLt}` }}
            >
              <div className="col-span-2 font-bold" style={{ color: BRAND.primary }}>
                {l.lv}
              </div>
              <div className="col-span-5" style={{ color: BRAND.text }}>
                {l.quota}
              </div>
              <div className="col-span-5" style={{ color: BRAND.textSub }}>
                {l.limits}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-5 flex items-start gap-3"
        style={{ backgroundColor: BRAND.infoLt, border: `1px solid ${BRAND.info}22` }}
      >
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.info }} />
        <div className="text-xs" style={{ color: BRAND.text }}>
          <strong>温馨提示：</strong>本页面为教学说明，不进行真实 KYC 提交。
          实际认证请前往<strong> 个人中心 → 实名认证 </strong>入口进行。
          <PortalStatusBadge status="PRIVATE" size="sm" showDot={false} className="ml-2" />
        </div>
      </div>
    </div>
  );
}

export default PortalKycGuide;
