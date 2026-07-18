'use client';

/**
 * PortalHeader - 桌面端顶部导航（2026-07-18）
 *
 * 结构来源：Stitch _1 TopNavBar
 * 主题：2026-07-18 暗色版（与 brand.ts 一致）
 * 交互：搜索聚焦（/）、Esc 关闭、登录/注册
 */

import React, { useEffect, useState } from 'react';
import { Search, Download, Globe, HelpCircle, Bell, X } from 'lucide-react';
import { BRAND } from './brand';

interface NavItem {
  label: string;
  href: string;
  status?: 'open' | 'beta' | 'soon' | 'maintenance';
}

const NAV: NavItem[] = [
  { label: '买币', href: '/portal-preview/fees' },
  { label: '行情', href: '/portal-preview/market', status: 'soon' },
  { label: '交易', href: '/portal-preview/spot-guide', status: 'soon' },
  { label: '钱包', href: '/portal-preview/wallet', status: 'soon' },
  { label: '树图公链', href: '/portal-preview/discover', status: 'beta' },
  { label: 'Launch', href: '/portal-preview/launch', status: 'soon' },
  { label: 'Earn', href: '/portal-preview/earn', status: 'soon' },
];

export function PortalHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-shadow"
      style={{
        backgroundColor: scrolled ? BRAND.headerBg : BRAND.bg,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${BRAND.border}`,
        boxShadow: scrolled ? BRAND.shadow : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-10">
          <a
            href="/portal-preview"
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: BRAND.primary }}
          >
            ZSDEX
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium transition-colors flex items-center gap-1"
                style={{ color: BRAND.textSub }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = BRAND.textSub)}
              >
                {item.label}
                {item.status === 'beta' && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded font-bold"
                    style={{ backgroundColor: BRAND.purpleLt, color: BRAND.purple }}
                  >
                    β
                  </span>
                )}
                {item.status === 'soon' && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded font-bold"
                    style={{ backgroundColor: BRAND.infoLt, color: BRAND.info }}
                  >
                    即将
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-lg transition-colors"
            style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
            aria-label="搜索"
          >
            <Search className="w-4 h-4" />
            <span className="text-xs">搜索</span>
            <kbd
              className="text-[10px] px-1 rounded font-mono"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              /
            </kbd>
          </button>
          <a
            href="/portal-preview/download"
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors"
            style={{ color: BRAND.textSub }}
            aria-label="下载 APP"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors"
            style={{ color: BRAND.textSub }}
            aria-label="语言"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg transition-colors"
            style={{ color: BRAND.textSub }}
            aria-label="帮助"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg transition-colors relative"
            style={{ color: BRAND.textSub }}
            aria-label="通知"
          >
            <Bell className="w-4 h-4" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: BRAND.danger }}
            />
          </button>
          <a
            href="/auth/login"
            className="px-4 h-9 inline-flex items-center text-sm font-semibold rounded-lg transition-colors"
            style={{ color: BRAND.textSub }}
          >
            登录
          </a>
          <a
            href="/auth/register"
            className="px-4 h-9 inline-flex items-center text-sm font-bold rounded-lg transition-all active:scale-95"
            style={{ backgroundColor: BRAND.primaryContainer, color: BRAND.onPrimary }}
          >
            注册
          </a>
        </div>
      </div>

      {/* Search Drawer */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl shadow-2xl"
            style={{ backgroundColor: BRAND.cardElevated, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: BRAND.border }}>
              <Search className="w-5 h-5" style={{ color: BRAND.textMute }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索币种、公告、教程…"
                className="flex-1 outline-none bg-transparent text-sm"
                style={{ color: BRAND.text }}
              />
              <kbd
                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                style={{ backgroundColor: BRAND.bgAlt, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
              >
                Esc
              </kbd>
              <button onClick={() => setSearchOpen(false)} style={{ color: BRAND.textMute }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 max-h-96 overflow-y-auto">
              <p className="text-xs font-semibold mb-3" style={{ color: BRAND.textMute }}>
                快速跳转
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '首页', href: '/portal-preview' },
                  { label: '关于我们', href: '/portal-preview/about' },
                  { label: '公告中心', href: '/portal-preview/announcements' },
                  { label: '费率说明', href: '/portal-preview/fees' },
                  { label: '风险提示', href: '/portal-preview/risk' },
                  { label: 'KYC 教学', href: '/portal-preview/kyc-guide' },
                  { label: '机构服务', href: '/portal-preview/institution' },
                  { label: '发现中心', href: '/portal-preview/discover' },
                  { label: '现货交易教学', href: '/portal-preview/spot-guide' },
                  { label: 'H5 移动端预览', href: '/portal-preview/mobile' },
                ].map((it) => (
                  <a
                    key={it.href}
                    href={it.href}
                    onClick={() => setSearchOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: BRAND.text, backgroundColor: BRAND.bg }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND.primaryLt)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND.bg)}
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default PortalHeader;
