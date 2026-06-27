﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';

import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { motion } from 'framer-motion';

// 合作伙伴Logo数据 (使用文字代替真实Logo)
const partners = [
  { name: 'Samoa FSA', abbr: 'SFSA', color: 'from-blue-500/20 to-blue-600/10', textColor: 'text-blue-400' },
  { name: 'Hong Kong SFC', abbr: 'HKSFC', color: 'from-red-500/20 to-red-600/10', textColor: 'text-danger' },
  { name: 'Certik', abbr: 'CERTIK', color: 'from-cyan-500/20 to-cyan-600/10', textColor: 'text-cyan-400' },
  { name: 'SlowMist', abbr: 'MIST', color: 'from-purple-500/20 to-purple-600/10', textColor: 'text-purple-400' },
  { name: 'Chainalysis', abbr: 'CHAIN', color: 'from-emerald-500/20 to-emerald-600/10', textColor: 'text-success' },
  { name: 'AWS', abbr: 'AWS', color: 'from-orange-500/20 to-orange-600/10', textColor: 'text-orange-400' },
  { name: 'Cloudflare', abbr: 'CF', color: 'from-amber-500/20 to-amber-600/10', textColor: 'text-amber-400' },
  { name: 'Binance Cloud', abbr: 'BNC', color: 'from-yellow-500/20 to-yellow-600/10', textColor: 'text-yellow-400' },
  { name: 'Fireblocks', abbr: 'FB', color: 'from-pink-500/20 to-pink-600/10', textColor: 'text-pink-400' },
  { name: 'Ledger Enterprise', abbr: 'LEDGER', color: 'from-indigo-500/20 to-indigo-600/10', textColor: 'text-indigo-400' },
  { name: 'Thomson Reuters', abbr: 'TR', color: 'from-teal-500/20 to-teal-600/10', textColor: 'text-teal-400' },
  { name: 'Bloomberg', abbr: 'BBRG', color: 'from-slate-500/20 to-slate-600/10', textColor: 'text-slate-400' },
];

// 复制一份用于无缝滚动效果展示
const displayPartners = [...partners, ...partners];

export default function PartnersSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="max-w-7xl mx-auto"
      >
        {/* 标题 */}
        <motion.div variants={fadeInUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            战略合作伙伴
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            与全球领先的技术与监管机构合作，共建安全合规的交易生态
          </p>
        </motion.div>

        {/* Logo墙 - 横向滚动网格 */}
        <motion.div variants={staggerItem} className="relative">
          <style jsx>{`
            @keyframes partners-scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .partners-track {
              animation: partners-scroll 30s linear infinite;
            }
            .partners-track:hover {
              animation-play-state: paused;
            }
          `}</style>

          <div className="overflow-hidden py-4">
            <div className="partners-track flex items-center gap-8 min-w-max px-4">
              {displayPartners.map((partner, index) => (
                <div
                  key={`${partner.abbr}-${index}`}
                  className={`
                    group flex-shrink-0 flex items-center justify-center
                    w-[160px] h-[72px] rounded-xl border border-[#EAECEF]/50
                    bg-gradient-to-br ${partner.color} backdrop-blur-sm
                    cursor-default transition-all duration-300
                    hover:border-[#EAECEF] hover:bg-white/80
                    grayscale hover:grayscale-0
                  `}
                >
                  <div className="text-center">
                    <span className={`text-sm font-bold ${partner.textColor} opacity-50 group-hover:opacity-100 transition-opacity`}>
                      {partner.abbr}
                    </span>
                    <p className="text-[10px] text-text-muted mt-0.5 opacity-0 group-hover:opacity-70 transition-opacity truncate px-2">
                      {partner.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
