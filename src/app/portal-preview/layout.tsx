/**
 * Portal Preview 共享布局（2026-07-18）
 *
 * 路径前缀：/portal-preview/**
 * 用途：托管新设计 10 个 P1 页面的纯静态预览
 * 硬约束：
 *   1. 不影响 / 主站
 *   2. 不影响 H5 / 110+ 路由
 *   3. 不接真实业务 API
 *   4. 不 push
 */

import React from 'react';
import { PortalHeader } from '@/components/portal-preview/PortalHeader';
import { PortalFooter } from '@/components/portal-preview/PortalFooter';
import { BRAND } from '@/components/portal-preview/brand';

export const metadata = {
  title: 'ZSDEX | 中萨数字科技交易所 — 全新门户预览',
  description: '中萨数字科技交易所全新官网门户预览版（内部预览）',
  robots: { index: false, follow: false },
};

export default function PortalPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BRAND.bg, color: BRAND.text }}
    >
      {/* 预览水印横幅（提醒这是预览版，不影响线上） */}
      <div
        className="w-full text-center text-[11px] py-1.5 font-mono uppercase tracking-widest"
        style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning, borderBottom: `1px solid ${BRAND.warning}22` }}
      >
        PREVIEW · 新门户静态预览版 · /portal-preview/**
      </div>

      <PortalHeader />

      <main className="flex-1 w-full">{children}</main>

      <PortalFooter />
    </div>
  );
}
