'use client';

/**
 * PortalMobileHero - H5 移动端首页 Hero（2026-07-18）
 * 资产来源：Stitch h5_11
 */

import React from 'react';
import { ArrowRight, Bell, Search, Sparkles } from 'lucide-react';
import { BRAND } from './brand';
import { PortalStatusBadge } from './PortalStatusBadge';

export function PortalMobileHero() {
  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{
        background: `linear-gradient(160deg, ${BRAND.primary} 0%, ${BRAND.primaryDim} 100%)`,
        color: '#fff',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-extrabold text-sm">
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

      <div>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold mb-2">
          <Sparkles className="w-3 h-3" /> 全新品牌升级
        </div>
        <h1 className="text-xl font-extrabold leading-tight">
          随时随地<br />专业交易
        </h1>
        <p className="text-xs opacity-90 mt-1">
          H5 移动端预览版（内部展示）
        </p>
      </div>

      <div
        className="rounded-xl p-3 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
      >
        <div>
          <div className="text-[10px] opacity-80">BTC / USDT</div>
          <div className="text-base font-mono font-bold">数据接入中</div>
        </div>
        <PortalStatusBadge status="COMING" size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
          style={{ backgroundColor: '#fff', color: BRAND.primary }}
        >
          立即注册 <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          className="h-10 rounded-xl text-xs font-bold flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          登录账户
        </button>
      </div>
    </div>
  );
}

export default PortalMobileHero;
