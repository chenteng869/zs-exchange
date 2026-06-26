'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ChevronDown,
  Download,
} from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';
import MobileNav from './MobileNav';

// v7 Aurora Premium 升级自 v6 Royal Premium
// 顶部导航：极光玻璃 + 极光三色光带
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();

  const openDropdown = useCallback((label: string) => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    setActiveDropdown(label);
  }, []);

  const closeDropdown = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setActiveDropdown(null), 120) as unknown as number;
  }, []);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href) && href !== '#';
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 backdrop-blur-xl`}
        style={{
          background: scrolled
            ? 'rgba(11, 17, 36, 0.92)'
            : 'rgba(11, 17, 36, 0.78)',
          borderBottom: scrolled
            ? '1px solid #2A3556'
            : '1px solid rgba(42, 53, 86, 0.5)',
          boxShadow: scrolled
            ? '0 4px 24px rgba(0, 0, 0, 0.30), 0 1px 0 0 rgba(240, 185, 11, 0.10)'
            : 'none',
        }}
      >
        {/* 顶部金色细高光线 v6 */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.20) 30%, rgba(252, 213, 53, 0.40) 50%, rgba(240, 185, 11, 0.20) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        <div className="max-w-[1400px] mx-auto h-full px-4 lg:px-6 flex items-center justify-between">
          {/* Logo - v6 金色品牌标识 */}
          <Link href="/" className="flex flex-col leading-tight no-underline group">
            <span
              className="font-bold text-lg tracking-tight"
              style={{
                background:
                  'linear-gradient(135deg, #FCD535 0%, #F0B90B 60%, #E8A317 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ZS EXCHANGE
            </span>
            <span
              className="text-xs hidden sm:inline tracking-wide"
              style={{ color: '#B4C0E0' }}
            >
              中萨数科
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              if (item.label === '登录' || item.label === '注册') return null;

              const active = isActiveLink(item.href);

              return item.children ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    className={`flex items-center gap-1.5 py-2 text-sm transition-colors duration-200 ${
                      active ? 'font-semibold' : ''
                    }`}
                    style={{
                      color: active ? '#F8FAFC' : '#94A3B8',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = '#94A3B8';
                    }}
                  >
                    {item.label}
                    {item.badge && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(22, 119, 255, 0.15)',
                          color: '#38BDF8',
                          border: '1px solid rgba(22, 119, 255, 0.30)',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200`}
                      style={{
                        color: '#B4C0E0',
                        transform: activeDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  {active && (
                    <div
                      className="absolute bottom-[-17px] left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, #F0B90B 50%, transparent 100%)',
                        boxShadow: '0 0 8px rgba(240, 185, 11, 0.50)',
                      }}
                    />
                  )}

                  {/* Dropdown Menu - v7 极光玻璃 */}
                  {activeDropdown === item.label && (
                    <div
                      className="absolute top-full left-0 pt-2 min-w-[200px] z-[1000]"
                      onMouseEnter={() => openDropdown(item.label)}
                      onMouseLeave={closeDropdown}
                    >
                    <div
                      className="min-w-[200px] rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                      style={{
                        background: 'rgba(26, 36, 86, 0.85)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        border: '1px solid rgba(148, 163, 184, 0.20)',
                        boxShadow: '0 8px 32px rgba(15, 27, 61, 0.5), 0 0 24px rgba(56, 189, 248, 0.10)',
                      }}
                    >
                      {item.children.map((child, idx) =>
                        child.separator ? (
                          <div
                            key={`sep-${idx}`}
                            className="mx-4 my-1"
                            style={{ borderTop: '1px solid #2A3556' }}
                          />
                        ) : (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors no-underline`}
                            style={{
                              color:
                                pathname === child.href
                                  ? '#F0B90B'
                                  : child.highlight
                                    ? '#38BDF8'
                                    : '#94A3B8',
                              background:
                                pathname === child.href
                                  ? 'rgba(240, 185, 11, 0.10)'
                                  : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(22, 119, 255, 0.08)';
                              e.currentTarget.style.color = '#F8FAFC';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                pathname === child.href
                                  ? 'rgba(240, 185, 11, 0.10)'
                                  : 'transparent';
                              e.currentTarget.style.color =
                                pathname === child.href
                                  ? '#F0B90B'
                                  : child.highlight
                                    ? '#38BDF8'
                                    : '#94A3B8';
                            }}
                          >
                            <span className="flex items-center gap-2">
                              {child.label}
                              {child.badge && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  style={{
                                    background: 'rgba(234, 57, 67, 0.12)',
                                    color: '#EA3943',
                                    border: '1px solid rgba(234, 57, 67, 0.25)',
                                  }}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </span>
                            {child.highlight && (
                              <span className="text-[10px]" style={{ color: '#38BDF8' }}>
                                🇼🇸
                              </span>
                            )}
                          </Link>
                        )
                      )}
                    </div>
                    </div>
                  )}
                </div>
              ) : (
                <div key={item.label} className="relative">
                  <Link
                    href={item.href}
                    className={`py-2 text-sm transition-colors duration-200 no-underline ${
                      active ? 'font-semibold' : ''
                    }`}
                    style={{
                      color: active ? '#F8FAFC' : '#B4C0E0',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = '#B4C0E0';
                    }}
                  >
                    {item.label}
                  </Link>
                  {active && (
                    <div
                      className="absolute bottom-[-17px] left-0 right-0 h-0.5 rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, #F0B90B 50%, transparent 100%)',
                        boxShadow: '0 0 8px rgba(240, 185, 11, 0.50)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Samoa License Badge - v6 金色版 */}
            <div
              className="hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-colors cursor-default"
              style={{
                border: '1px solid rgba(240, 185, 11, 0.40)',
                color: '#FCD535',
                background: 'rgba(240, 185, 11, 0.08)',
              }}
            >
              <span className="text-[11px]">🇼🇸</span>
              <span>萨摩亚持牌</span>
            </div>

            {/* Download App Button - 新增 */}
            <Link
              href="/download"
              className="hidden md:inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg transition-all duration-200 no-underline"
              style={{
                border: '1px solid rgba(56, 189, 248, 0.40)',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.60)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.40)';
              }}
            >
              <Download size={14} />
              下载 APP
            </Link>

            {/* Auth Buttons - v6 金色注册按钮 */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/login"
                className="text-sm px-4 py-2 transition-colors rounded-lg no-underline"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94A3B8';
                }}
              >
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 no-underline"
                style={{
                  background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
                  color: '#0B1124',
                  boxShadow: '0 4px 12px rgba(240, 185, 11, 0.30)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FDDA4A 0%, #F0B90B 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 185, 11, 0.50)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 185, 11, 0.30)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                注册
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg transition-colors"
              style={{ color: '#B4C0E0' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F8FAFC';
                e.currentTarget.style.background = 'rgba(240, 185, 11, 0.10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#B4C0E0';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="打开菜单"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
