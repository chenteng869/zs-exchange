'use client';

/**
 * PortalFooter - 桌面端底部（2026-07-18）
 *
 * 4 大区块：品牌信息、四大栏目、订阅、合规说明
 * 全部静态展示，无真实 API
 */

import React from 'react';
import { Shield, FileText, AlertTriangle, Lock, Mail, Send, Globe, Code2 } from 'lucide-react';
import { BRAND } from './brand';

const COLUMNS = [
  {
    title: '关于我们',
    items: [
      { label: '关于中萨', href: '/portal-preview/about' },
      { label: '牌照与合规', href: '/portal-preview/about#license' },
      { label: '安全保障', href: '/portal-preview/risk' },
      { label: '新闻动态', href: '/portal-preview/announcements' },
    ],
  },
  {
    title: '产品服务',
    items: [
      { label: '现货交易', href: '/portal-preview/spot-guide' },
      { label: '机构服务', href: '/portal-preview/institution' },
      { label: 'API 接入', href: '/portal-preview/api' },
      { label: '树图生态', href: '/portal-preview/discover' },
    ],
  },
  {
    title: '新手入门',
    items: [
      { label: '实名认证（KYC）', href: '/portal-preview/kyc-guide' },
      { label: '现货交易教学', href: '/portal-preview/spot-guide' },
      { label: '费率说明', href: '/portal-preview/fees' },
      { label: '帮助中心', href: '/portal-preview/help' },
    ],
  },
  {
    title: '条款与隐私',
    items: [
      { label: '用户协议', href: '#' },
      { label: '隐私政策', href: '#' },
      { label: '风险提示', href: '/portal-preview/risk' },
      { label: '免责声明', href: '/portal-preview/risk#disclaimer' },
    ],
  },
];

export function PortalFooter() {
  return (
    <footer
      className="mt-24"
      style={{ backgroundColor: BRAND.bg, borderTop: `1px solid ${BRAND.border}` }}
    >
      {/* Compliance strip */}
      <div
        className="py-3 text-center text-xs"
        style={{ backgroundColor: BRAND.card, color: BRAND.textMute, borderBottom: `1px solid ${BRAND.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" style={{ color: BRAND.success }} /> 萨摩亚持牌
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" style={{ color: BRAND.info }} /> MSA 监管
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" style={{ color: BRAND.primary }} /> 冷钱包 95%+ 储备
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: BRAND.warning }} /> 数字资产价格波动较大，请理性投资
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand block */}
          <div className="md:col-span-1">
            <div className="text-2xl font-extrabold mb-3" style={{ color: BRAND.primary }}>
              ZSDEX
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: BRAND.textSub }}>
              中萨数字科技交易所 · 萨摩亚持牌数字资产交易平台
            </p>
            <div className="flex items-center gap-2 mb-4">
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                aria-label="社交平台"
              >
                <Globe className="w-4 h-4" style={{ color: BRAND.textSub }} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" style={{ color: BRAND.textSub }} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                aria-label="开发者"
              >
                <Code2 className="w-4 h-4" style={{ color: BRAND.textSub }} />
              </a>
              <a
                href="mailto:contact@zs-exchange.com"
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                aria-label="Email"
              >
                <Mail className="w-4 h-4" style={{ color: BRAND.textSub }} />
              </a>
            </div>
            <div className="text-[10px] leading-relaxed" style={{ color: BRAND.textMute }}>
              注册地址：Level 2, Samoa Pacific Centre, Beach Road, Apia, Samoa
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold mb-4" style={{ color: BRAND.text }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      className="text-xs transition-colors"
                      style={{ color: BRAND.textSub }}
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          className="mt-12 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${BRAND.border}` }}
        >
          <div className="text-xs" style={{ color: BRAND.textMute }}>
            © 2024–2026 中萨数字科技集团 / SinoSamoa Digital Technology Group · All rights reserved.
          </div>
          <div className="text-[10px] flex flex-wrap gap-3" style={{ color: BRAND.textMute }}>
            <span>牌照：DSAEX-2024-001 / DSAST-2024-002</span>
            <span>·</span>
            <span>ICP 备案：待公示</span>
            <span>·</span>
            <span>v 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PortalFooter;
