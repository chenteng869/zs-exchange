﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { useRef, useEffect, useState } from 'react';
import { LICENSES_DATA } from '@/lib/constants';
import type { LicenseInfo } from '@/types';

const LICENSE_SCOPE_MAP: Record<string, string[]> = {
  'samoa-exchange': ['合法运营CEX', '发行Token', '现货/合约交易', '全球用户服务'],
  'samoa-stock': ['企业上市通道', '类纳斯达克', 'STO证券代币', '股权代币化'],
  hk1683: ['港股IPO服务', 'SPAC上市通道', 'RTO反向收购', '国际资本对接'],
};

const COUNTRY_FLAG_MAP: Record<string, string> = {
  WS: '🇼🇸',
  HK: '🇭🇰',
};

const LICENSE_TYPE_LABEL: Record<string, string> = {
  exchange: '数字科技交易所牌照',
  stock: '证券交易所牌照',
};

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export default function LicenseShowcase() {
  const { ref, isInView } = useInView(0.15);

  return (
    <section ref={ref} className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* ============ v7 极光背景光斑（金 + 青 + 紫）============ */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          aria-hidden
          className="aurora-orb anim-aurora-flow"
          style={{
            top: '20%',
            left: '5%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.22) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="aurora-orb anim-aurora-drift"
          style={{
            top: '40%',
            right: '5%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="aurora-orb anim-aurora-rise"
          style={{
            bottom: '10%',
            left: '40%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(167, 139, 250, 0.16) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Header */}
      <div className="relative max-w-7xl mx-auto text-center mb-14">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            background: 'rgba(240, 185, 11, 0.10)',
            border: '1px solid rgba(240, 185, 11, 0.35)',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            boxShadow: '0 0 24px rgba(240, 185, 11, 0.15)',
          }}
        >
          <span className="text-lg">🏆</span>
          <span className="text-sm font-medium" style={{ color: '#FCD535' }}>
            全球稀缺牌照资产
          </span>
        </div>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4 transition-all duration-700 delay-100 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          同时持有{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 50%, #FCD535 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 40px rgba(240, 185, 11, 0.30)',
            }}
          >
            交易所牌照 + 证券交易所牌照
          </span>
        </h2>
        <p
          className={`text-base sm:text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ color: '#B4C0E0' }}
        >
          全球同时拥有双牌照的机构不超过5家，ZS Exchange 是其中之一
        </p>
      </div>

      {/* License Cards */}
      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {LICENSES_DATA.map((license, index) => (
          <LicenseCard
            key={license.id}
            license={license}
            index={index}
            isInView={isInView}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        className={`relative max-w-7xl mx-auto text-center mt-12 transition-all duration-700 delay-500 ${
          isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <a
          href="/licenses"
          className="group inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(240, 185, 11, 0.20) 0%, rgba(240, 185, 11, 0.10) 100%)',
            border: '1px solid rgba(240, 185, 11, 0.45)',
            color: '#FCD535',
            backdropFilter: 'blur(12px) saturate(160%)',
            WebkitBackdropFilter: 'blur(12px) saturate(160%)',
            boxShadow: '0 0 24px rgba(240, 185, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          }}
        >
          查看完整牌照详情
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}

/* ==================== License Card Component ==================== */
interface LicenseCardProps {
  license: LicenseInfo;
  index: number;
  isInView: boolean;
}

function LicenseCard({ license, index, isInView }: LicenseCardProps) {
  const isPrimary = license.id === 'samoa-exchange' || license.id === 'samoa-stock';
  const isHK = license.id === 'hk1683';
  const scopeItems = LICENSE_SCOPE_MAP[license.id] || [];
  const flagEmoji = COUNTRY_FLAG_MAP[license.countryCode] || '🌐';

  const delay = 0.15 * index + 0.3;

  return (
    <div
      className={`group relative transition-all duration-700 ${
        isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {/* Primary License: v7 极光金边玻璃卡 - Aurora Premium */}
      {isPrimary && (
        <div
          className="group/card relative p-[2px] rounded-2xl transition-all duration-500 hover:-translate-y-2"
          style={{
            background:
              'linear-gradient(180deg, rgba(240, 185, 11, 0.65) 0%, rgba(240, 185, 11, 0.20) 50%, rgba(56, 189, 248, 0.15) 100%)',
            boxShadow:
              '0 0 40px rgba(240, 185, 11, 0.20), 0 8px 32px rgba(15, 27, 61, 0.4)',
          }}
        >
          <div
            className="rounded-2xl p-6 h-full relative overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.70) 0%, rgba(21, 34, 74, 0.85) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(148, 163, 184, 0.10)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* 顶部高光线 - v7 金色光带 */}
            <div
              aria-hidden
              className="absolute top-0 left-1/4 right-1/4 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #FCD535 50%, transparent 100%)',
                boxShadow: '0 0 16px rgba(240, 185, 11, 0.70)',
              }}
            />

            {/* 角部金角装饰 */}
            <div
              aria-hidden
              className="absolute top-3 right-3 w-12 h-12 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(240, 185, 11, 0.20) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />

            {/* Flag & Country */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-5xl leading-none">{flagEmoji}</span>
              {isPrimary && (
                <span
                  className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: 'rgba(240, 185, 11, 0.18)',
                    border: '1px solid rgba(240, 185, 11, 0.50)',
                    color: '#FCD535',
                    boxShadow: '0 0 12px rgba(240, 185, 11, 0.20)',
                  }}
                >
                  ⭐ 主要牌照
                </span>
              )}
            </div>

            {/* Country & Type */}
            <h3 className="text-xl font-bold text-text-primary mb-1">{license.country}</h3>
            <p
              className="text-base font-semibold mb-1"
              style={{
                background: 'linear-gradient(135deg, #FCD535 0%, #F0B90B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {LICENSE_TYPE_LABEL[license.type] || license.type}
            </p>
            <p className="text-xs mb-4" style={{ color: '#7B89B8' }}>
              {license.issuer}
            </p>

            {/* Gold divider */}
            <div
              className="h-px w-full mb-4"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(240, 185, 11, 0.70) 50%, transparent 100%)',
              }}
            />

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(52, 211, 153, 0.14)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  color: '#34D399',
                  boxShadow: '0 0 12px rgba(52, 211, 153, 0.15)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                已获批
              </span>
            </div>

            {/* Scope List */}
            <ul className="space-y-2.5 mb-5">
              {scopeItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm"
                  style={{ color: '#B4C0E0' }}
                >
                  <svg
                    className="w-4 h-4 shrink-0"
                    style={{ color: '#FCD535' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Footer Link */}
            <a
              href={`/licenses#${license.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-all group/link"
              style={{ color: '#FCD535' }}
            >
              查看详情
              <svg
                className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* HK Secondary License: v7 极光青边玻璃卡 - Aurora Premium */}
      {isHK && (
        <div
          className="group/card relative p-[1.5px] rounded-2xl transition-all duration-500 hover:-translate-y-1"
          style={{
            background:
              'linear-gradient(180deg, rgba(56, 189, 248, 0.50) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 100%)',
            boxShadow: '0 0 32px rgba(56, 189, 248, 0.10), 0 8px 32px rgba(15, 27, 61, 0.3)',
          }}
        >
          <div
            className="rounded-2xl p-6 h-full relative overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.60) 0%, rgba(21, 34, 74, 0.80) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(148, 163, 184, 0.10)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            }}
          >
            {/* 顶部高光线 - v7 青色光带 */}
            <div
              aria-hidden
              className="absolute top-0 left-1/4 right-1/4 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, #38BDF8 50%, transparent 100%)',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.70)',
              }}
            />

            {/* Flag & Country */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl leading-none opacity-90">{flagEmoji}</span>
            </div>

            <h3 className="text-xl font-bold text-text-primary mb-1">{license.country}</h3>
            <p
              className="text-base font-semibold mb-1"
              style={{
                background: 'linear-gradient(135deg, #38BDF8 0%, #1677FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              香港HK1683 上市通道
            </p>
            <p className="text-xs mb-4" style={{ color: '#7B89B8' }}>
              {license.issuer}
            </p>

            {/* Divider */}
            <div
              className="h-px w-full mb-4"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.55) 50%, transparent 100%)',
              }}
            />

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#F59E0B',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                合作中
              </span>
            </div>

            {/* Scope List */}
            <ul className="space-y-2.5 mb-5">
              {scopeItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm"
                  style={{ color: '#B4C0E0' }}
                >
                  <svg
                    className="w-4 h-4 shrink-0"
                    style={{ color: '#38BDF8' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {/* Footer Link */}
            <a
              href={`/licenses#${license.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-all group/link"
              style={{ color: '#B4C0E0' }}
            >
              查看详情
              <svg
                className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
