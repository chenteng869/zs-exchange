'use client';

/**
 * PortalMobileHero - H5 移动端首页 Hero（2026-07-19 P3.1 增强版）
 * 资产来源：Stitch h5_11
 * 增强：增加状态徽章、K 线占位、信任要素
 */

import React from 'react';
import { ArrowRight, Bell, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

export function PortalMobileHero() {
  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{
        background: `linear-gradient(160deg, ${BRAND.primaryContainer} 0%, ${BRAND.primaryDim} 100%)`,
        color: BRAND.onPrimary,
      }}
    >
      {/* 顶部品牌区 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm"
            style={{ backgroundColor: BRAND.cardGlass, color: BRAND.onPrimary }}
          >
            Z
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-tight">ZSDEX</div>
            <div className="text-[10px] opacity-80">中萨数字科技交易所</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 opacity-80" />
          <Bell className="w-4 h-4 opacity-80" />
        </div>
      </div>

      {/* 标题区 */}
      <div>
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: BRAND.cardGlass, color: BRAND.onPrimary }}
          >
            <Sparkles className="w-3 h-3" /> 全新品牌升级
          </span>
          <PortalStatusBadge status="OPEN" size="sm" showDot={false} />
        </div>
        <h1 className="text-xl font-extrabold leading-tight">
          随时随地<br />专业交易
        </h1>
        <p className="text-xs opacity-90 mt-1">
          H5 移动端预览版（内部展示）
        </p>
      </div>

      {/* K 线占位区 */}
      <div
        className="rounded-xl p-3 space-y-2"
        style={{ backgroundColor: BRAND.cardGlass }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] opacity-80">BTC / USDT</div>
            <div className="text-base font-mono font-bold">数据接入中</div>
          </div>
          <PortalStatusBadge status="COMING" size="sm" showDot={false} />
        </div>
        <div className="flex items-end gap-0.5 h-10">
          {[40, 60, 55, 80, 65, 95, 40, 70, 88, 50, 75, 90, 60, 82, 70].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                backgroundColor: BRAND.onPrimary,
                opacity: 0.3 + (h / 250),
              }}
            />
          ))}
        </div>
      </div>

      {/* 信任要素行 */}
      <div
        className="rounded-xl p-3 grid grid-cols-3 gap-2 text-center"
        style={{ backgroundColor: BRAND.cardGlass }}
      >
        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] opacity-90">
            <ShieldCheck className="w-3 h-3" />
            <span>合规观察</span>
          </div>
          <div className="text-[10px] font-bold mt-0.5">国际化</div>
        </div>
        <div>
          <div className="text-[10px] opacity-90">撮合能力</div>
          <div className="text-[10px] font-bold mt-0.5">亚毫秒</div>
        </div>
        <div>
          <div className="text-[10px] opacity-90">AI 风控</div>
          <div className="text-[10px] font-bold mt-0.5">全链路</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
          style={{ backgroundColor: BRAND.onPrimary, color: BRAND.primaryContainer }}
        >
          立即注册 <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          className="h-10 rounded-xl text-xs font-bold flex items-center justify-center"
          style={{ backgroundColor: BRAND.cardGlass, color: BRAND.onPrimary }}
        >
          登录账户
        </button>
      </div>
    </div>
  );
}

export default PortalMobileHero;
