'use client';

import { useRef, useEffect, useState } from 'react';
import { BUSINESS_ENGINES } from '@/lib/constants';
import type { BusinessEngine } from '@/types';

/* ==================== Engine Display Config ==================== */
interface EngineDisplayConfig {
  id: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  badge?: string;
}

const ENGINE_DISPLAY_CONFIG: EngineDisplayConfig[] = [
  {
    id: 'matching-engine',
    icon: '⚡',
    gradientFrom: '#3B82F6',
    gradientTo: '#06B6D4',
  },
  {
    id: 'risk-engine',
    icon: '🛡️',
    gradientFrom: '#8B5CF6',
    gradientTo: '#A78BFA',
    badge: '🇼🇸 持牌',
  },
  {
    id: 'settlement-engine',
    icon: '💰',
    gradientFrom: '#F59E0B',
    gradientTo: '#F97316',
  },
  {
    id: 'market-data-engine',
    icon: '📊',
    gradientFrom: '#10B981',
    gradientTo: '#14B8A6',
  },
  {
    id: 'compliance-engine',
    icon: '✅',
    gradientFrom: '#F43F5E',
    gradientTo: '#EC4899',
  },
];

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

export default function BusinessEngines() {
  const { ref, isInView } = useInView(0.1);

  return (
    <section ref={ref} className="relative py-20 px-4 sm:px-6 lg:px-8">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative max-w-7xl mx-auto text-center mb-14">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 mb-5 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-lg">⚙️</span>
          <span className="text-sm font-medium text-brand-light">五大业务引擎</span>
        </div>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4 transition-all duration-700 delay-100 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          五大驱动力推动{' '}
          <span className="bg-gradient-to-r from-brand-primary to-brand-light bg-clip-text text-transparent">
            生态系统
          </span>
        </h2>
        <p
          className={`text-base sm:text-lg text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-200 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          从撮合到合规，从风控到结算，全链路自研引擎集群驱动
        </p>
      </div>

      {/* Engine Cards Grid: Desktop 3+2 | Tablet 3+2 | Mobile 1×5 */}
      <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Row 1: First 3 engines */}
        {BUSINESS_ENGINES.slice(0, 3).map((engine, index) => (
          <EngineCard
            key={engine.id}
            engine={engine}
            config={ENGINE_DISPLAY_CONFIG[index]}
            index={index}
            isInView={isInView}
          />
        ))}

        {/* Row 2: Last 2 engines, centered on desktop */}
        <div className="md:col-span-2 lg:col-span-3 flex justify-center gap-5 lg:gap-6 max-w-3xl mx-auto w-full">
          {BUSINESS_ENGINES.slice(3).map((engine, index) => (
            <EngineCard
              key={engine.id}
              engine={engine}
              config={ENGINE_DISPLAY_CONFIG[3 + index]}
              index={3 + index}
              isInView={isInView}
              fullWidth
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================== Engine Card Component ==================== */
interface EngineCardProps {
  engine: BusinessEngine;
  config: EngineDisplayConfig;
  index: number;
  isInView: boolean;
  fullWidth?: boolean;
}

function EngineCard({ engine, config, index, isInView, fullWidth }: EngineCardProps) {
  const delay = 0.12 * index + 0.25;

  return (
    <div
      className={`group relative transition-all duration-700 ${fullWidth ? 'flex-1' : ''} ${
        isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className="h-full rounded-xl border border-deep-700 bg-deep-800/50 backdrop-blur-sm p-5 hover:-translate-y-2 hover:shadow-lg hover:border-deep-600/50 transition-all duration-300 hover:bg-deep-800/70">
        {/* Header: Icon + Title + Badge */}
        <div className="flex items-start gap-4 mb-4">
          {/* Gradient Icon Circle */}
          <div
            className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
            }}
          >
            {config.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-text-primary truncate">{engine.name}</h3>
              {config.badge && (
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-license/15 border border-license/30 text-xs font-bold text-license">
                  {config.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">{engine.nameEn}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4">{engine.description}</p>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-1.5">
          {engine.features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F7F8FA] text-xs text-text-muted"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
