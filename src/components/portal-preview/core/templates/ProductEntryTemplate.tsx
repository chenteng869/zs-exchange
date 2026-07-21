/**
 * ProductEntryTemplate - 交易产品入口模板
 * 用途：现货、合约、杠杆、费率、规则
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState } from 'react';
import { BRAND, STATUS } from '../../brand';

export interface ProductEntryTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  productCards?: ProductCard[];
  feeTable?: FeeRow[];
  ruleSections?: { title: string; items: string[] }[];
  riskDisclosure?: string;
  complianceNote?: string;
  children?: React.ReactNode;
}

export interface ProductCard {
  key: string;
  name: string;
  description: string;
  features: string[];
  href: string;
  status?: keyof typeof STATUS;
  hot?: boolean;
}

export interface FeeRow {
  level: string;
  maker: string;
  taker: string;
  note?: string;
}

export function ProductEntryTemplate({
  title,
  description,
  breadcrumbs,
  productCards = [],
  feeTable = [],
  ruleSections = [],
  riskDisclosure,
  complianceNote,
  children,
}: ProductEntryTemplateProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null);

  return (
    <div className="min-h-screen w-full" style={{ background: BRAND.bg, color: BRAND.text }}>
      {/* 1. 面包屑 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="px-6 pt-6 text-sm" style={{ color: BRAND.textSub }}>
          {breadcrumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span className="mx-2" style={{ color: BRAND.textMute }}>/</span>}
              <a href={c.href} className="hover:underline">{c.label}</a>
            </span>
          ))}
        </nav>
      )}

      {/* 2. 标题 */}
      <section className="px-6 md:px-12 py-12" style={{ background: `linear-gradient(180deg, ${BRAND.bg} 0%, ${BRAND.bgCard} 100%)`, borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: BRAND.text }}>
            {title}
          </h1>
          {description && <p className="text-base max-w-2xl" style={{ color: BRAND.textSub }}>{description}</p>}
        </div>
      </section>

      {/* 3. 产品卡片网格 */}
      {productCards.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6" style={{ color: BRAND.text }}>交易产品</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productCards.map((card, i) => (
                <div
                  key={card.key}
                  onClick={() => setSelectedProduct(card)}
                  className="rounded-lg p-6 cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: BRAND.bgCard,
                    border: `1px solid ${BRAND.border}`,
                    animation: `p4FadeUp 0.5s ease-out ${i * 80}ms both`,
                    minHeight: 200,
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-lg font-medium" style={{ color: BRAND.text }}>{card.name}</div>
                    {card.status && (
                      <div
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: STATUS[card.status].bg, color: STATUS[card.status].color }}
                      >
                        {STATUS[card.status].label}
                      </div>
                    )}
                    {card.hot && !card.status && (
                      <div className="text-xs px-2 py-0.5 rounded" style={{ background: BRAND.gold, color: BRAND.onGold }}>
                        HOT
                      </div>
                    )}
                  </div>
                  <p className="text-sm mb-4" style={{ color: BRAND.textSub }}>{card.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {card.features.slice(0, 3).map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: BRAND.cardElevated, color: BRAND.textSub }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs" style={{ color: BRAND.primary }}>
                    查看详情 →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. 费率表 */}
      {feeTable.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold mb-6" style={{ color: BRAND.text }}>费率说明</h2>
            <div className="rounded-lg overflow-hidden" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: BRAND.cardElevated }}>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: BRAND.textSub }}>VIP 等级</th>
                    <th className="text-right px-4 py-3 text-xs" style={{ color: BRAND.textSub }}>Maker</th>
                    <th className="text-right px-4 py-3 text-xs" style={{ color: BRAND.textSub }}>Taker</th>
                    <th className="text-left px-4 py-3 text-xs" style={{ color: BRAND.textSub }}>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTable.map((row, i) => (
                    <tr key={row.level} style={{ borderTop: i > 0 ? `1px solid ${BRAND.border}` : 'none' }}>
                      <td className="px-4 py-3 font-medium" style={{ color: BRAND.text }}>{row.level}</td>
                      <td className="text-right px-4 py-3 tabular-nums" style={{ color: BRAND.success }}>{row.maker}</td>
                      <td className="text-right px-4 py-3 tabular-nums" style={{ color: BRAND.success }}>{row.taker}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: BRAND.textMute }}>{row.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 5. 规则区 */}
      {ruleSections.length > 0 && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {ruleSections.map((s, i) => (
              <div
                key={s.title}
                className="rounded-lg p-6"
                style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
              >
                <h3 className="text-lg font-medium mb-4" style={{ color: BRAND.text }}>{s.title}</h3>
                <ul className="space-y-2">
                  {s.items.map((item, j) => (
                    <li key={j} className="text-sm flex gap-2" style={{ color: BRAND.textSub }}>
                      <span style={{ color: BRAND.primary }}>·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. children */}
      {children && (
        <section className="px-6 md:px-12 py-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </section>
      )}

      {/* 7. 风险披露 */}
      {riskDisclosure && (
        <section className="px-6 md:px-12 py-8" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto">
            <h3 className="text-base font-medium mb-3" style={{ color: BRAND.warning }}>风险披露</h3>
            <p className="text-sm" style={{ color: BRAND.textSub }}>{riskDisclosure}</p>
          </div>
        </section>
      )}

      {/* 8. 合规提示 */}
      {complianceNote && (
        <section className="px-6 md:px-12 py-4" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-6xl mx-auto text-xs" style={{ color: BRAND.textSub }}>
            <span className="font-medium mr-2" style={{ color: BRAND.warning }}>合规提示：</span>
            {complianceNote}
          </div>
        </section>
      )}

      {/* 9. 产品详情 Drawer */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: BRAND.overlay }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="w-full max-w-md h-full p-6 overflow-y-auto"
            style={{ background: BRAND.cardElevated, color: BRAND.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold" style={{ color: BRAND.text }}>{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3 py-1 rounded-md text-sm"
                style={{ background: BRAND.bgCard, color: BRAND.textSub }}
              >
                关闭
              </button>
            </div>
            <p className="text-sm mb-6" style={{ color: BRAND.textSub }}>{selectedProduct.description}</p>
            <h3 className="text-sm font-medium mb-3" style={{ color: BRAND.textSub }}>产品特性</h3>
            <ul className="space-y-2 mb-6">
              {selectedProduct.features.map((f, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: BRAND.text }}>
                  <span style={{ color: BRAND.primary }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={selectedProduct.href}
              className="block text-center px-5 py-2.5 rounded-md text-sm font-medium"
              style={{ background: BRAND.primaryContainer, color: BRAND.onPrimary }}
            >
              进入 {selectedProduct.name}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductEntryTemplate;
