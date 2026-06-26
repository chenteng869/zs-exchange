'use client';

/**
 * H5 移动端布局容器 v2
 *
 * 升级要点（按截图风格）：
 *   1. 顶部栏：圆形渐变 Logo + 大搜索框 + 扫码 + 通知（红点）
 *   2. 极光三色光带保留
 *   3. 底部 Tab：6 个，使用 lucide-react 矢量图标
 *   4. 整体配色：深蓝 #0F1B3D 底 + 金色 #F0B90B 强调 + 蓝色 #38BDF8 辅助
 */

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  BarChart3,
  ArrowLeftRight,
  Compass,
  Wallet,
  User,
  Search,
  QrCode,
  Bell,
} from 'lucide-react';
import { WalletButton } from './WalletButton';
import H5DownloadBanner from './H5DownloadBanner';

interface TabConfig {
  key: string;
  label: string;
  icon: typeof Home;
  href: string;
}

const TABS: TabConfig[] = [
  { key: 'home',     label: '首页', icon: Home,           href: '/h5' },
  { key: 'markets',  label: '行情', icon: BarChart3,      href: '/h5/markets' },
  { key: 'trade',    label: '交易', icon: ArrowLeftRight, href: '/h5/trade' },
  { key: 'discover', label: '发现', icon: Compass,        href: '/h5/discover' },
  { key: 'assets',   label: '资产', icon: Wallet,         href: '/h5/assets' },
  { key: 'profile',  label: '我的', icon: User,           href: '/h5/profile' },
];

export default function H5Layout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #0F1B3D 0%, #131E45 30%, #0F1B3D 65%, #131E45 100%)',
        color: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
        maxWidth: 480,
        margin: '0 auto',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* ===== 顶部栏 ===== */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: '0 auto',
          zIndex: 100,
          background: 'rgba(15, 27, 61, 0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
        }}
      >
        {/* 极光三色光带 */}
        <div
          style={{
            height: '2px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.50) 20%, rgba(56, 189, 248, 0.90) 50%, rgba(167, 139, 250, 0.50) 80%, transparent 100%)',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.50)',
          }}
        />

        {/* 头部：Logo + 搜索 + 扫码 + 通知 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            paddingTop: 'max(10px, env(safe-area-inset-top))',
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.30)',
              flexShrink: 0,
            }}
          >
            S
          </div>

          {/* 搜索框 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              borderRadius: 12,
              minWidth: 0,
            }}
          >
            <Search size={16} color="#7B89B8" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="搜索币种 / 交易对"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F8FAFC',
                fontSize: 13,
                minWidth: 0,
              }}
            />
          </div>

          {/* 钱包按钮 */}
          <WalletButton />

          {/* 通知 */}
          <button
            aria-label="扫码"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              color: '#B4C0E0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QrCode size={16} />
          </button>

          <button
            onClick={() => setShowNotif(!showNotif)}
            aria-label="通知"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(148, 163, 184, 0.08)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              color: '#B4C0E0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#F472B6',
                boxShadow: '0 0 6px rgba(244, 114, 182, 0.80)',
              }}
            />
          </button>
        </div>
      </div>

      {/* ===== 主体内容区 ===== */}
      <main
        style={{
          paddingTop: 'calc(64px + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </main>

      {/* ===== APP 下载浮窗 ===== */}
      <H5DownloadBanner />

      {/* ===== 底部 Tab 固定导航 ===== */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: 480,
          margin: '0 auto',
          zIndex: 100,
          background: 'rgba(15, 27, 61, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(148, 163, 184, 0.12)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            padding: '6px 0 8px',
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active =
              pathname === tab.href ||
              (tab.href !== '/h5' && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.key}
                href={tab.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '6px 0',
                  textDecoration: 'none',
                  position: 'relative',
                }}
              >
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      width: 20,
                      height: 2,
                      background:
                        'linear-gradient(90deg, #38BDF8 0%, #1E40AF 100%)',
                      borderRadius: 2,
                      boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                    }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? '#38BDF8' : '#7B89B8'}
                  style={{ transition: 'all 0.15s' }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: active ? '#38BDF8' : '#7B89B8',
                    fontWeight: active ? 600 : 500,
                    letterSpacing: 0.2,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}