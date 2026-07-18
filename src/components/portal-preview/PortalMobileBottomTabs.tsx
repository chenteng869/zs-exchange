'use client';

/**
 * PortalMobileBottomTabs - H5 移动端底部 Tab（2026-07-18）
 * 资产来源：Stitch h5_11 BottomTabs
 */

import React from 'react';
import { Home, BarChart3, Repeat, Wallet, User } from 'lucide-react';
import { BRAND } from './brand';

const TABS = [
  { key: 'home', label: '首页', icon: Home },
  { key: 'market', label: '行情', icon: BarChart3 },
  { key: 'trade', label: '交易', icon: Repeat },
  { key: 'wallet', label: '钱包', icon: Wallet },
  { key: 'me', label: '我的', icon: User },
] as const;

export function PortalMobileBottomTabs({ active = 'home' }: { active?: string }) {
  return (
    <div
      className="sticky bottom-0 w-full px-2 py-2 flex items-center justify-around"
      style={{
        backgroundColor: BRAND.card,
        borderTop: `1px solid ${BRAND.border}`,
        boxShadow: BRAND.shadowMd,
      }}
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg"
            style={{ color: isActive ? BRAND.primary : BRAND.textMute }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default PortalMobileBottomTabs;
