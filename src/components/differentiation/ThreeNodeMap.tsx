'use client';

import { useRef, useEffect, useState } from 'react';
import { NODES, CONNECTIONS } from '@/lib/constants';
import type { NodeInfo, ConnectionInfo } from '@/types';

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

export default function ThreeNodeMap() {
  const { ref, isInView } = useInView(0.05);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <section ref={ref} className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background stars effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-[15%] w-1 h-1 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-20 right-[20%] w-0.5 h-0.5 bg-white/30 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-32 left-[40%] w-1 h-1 bg-brand-glow/20 rounded-full animate-pulse delay-500" />
        <div className="absolute top-1/3 right-[10%] w-0.5 h-0.5 bg-samoa/20 rounded-full animate-pulse delay-700" />
        <div className="absolute bottom-20 left-[60%] w-1 h-1 bg-hainan/20 rounded-full animate-pulse delay-1000" />
        {/* Central glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative max-w-7xl mx-auto text-center mb-12">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-success/30 bg-success/12 mb-5 transition-all duration-700 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-lg">🌏</span>
          <span className="text-sm font-medium text-success">三地协同架构</span>
        </div>
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-4 transition-all duration-700 delay-100 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          星际航线图 ·{' '}
          <span className="bg-gradient-to-r from-hainan via-emerald-400 to-hkgold bg-clip-text text-transparent">
            三节点协同
          </span>
        </h2>
        <p
          className={`text-base sm:text-lg text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-200 ${
            isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          海南运营根基 · 萨摩亚核心牌照 · 香港资本出口 — 三地联动，全球覆盖
        </p>
      </div>

      {/* ==================== Desktop Map (≥1024px) ==================== */}
      <div className="hidden lg:block relative max-w-5xl mx-auto">
        <div
          className={`relative aspect-[16/10] min-h-[420px] transition-all duration-1000 delay-300 ${
            isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          {/* SVG Connection Lines Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 65"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Primary line gradient */}
              <linearGradient id="lineGradientPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="lineGradientSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.25" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {CONNECTIONS.map((conn: ConnectionInfo) => {
              const fromNode = NODES.find((n: NodeInfo) => n.id === conn.from);
              const toNode = NODES.find((n: NodeInfo) => n.id === conn.to);
              if (!fromNode || !toNode) return null;

              const isPrimary = conn.type === 'primary';

              return (
                <g key={`${conn.from}-${conn.to}`}>
                  {/* Line */}
                  <line
                    x1={fromNode.position.x}
                    y1={fromNode.position.y}
                    x2={toNode.position.x}
                    y2={toNode.position.y}
                    stroke={isPrimary ? 'url(#lineGradientPrimary)' : 'url(#lineGradientSecondary)'}
                    strokeWidth={isPrimary ? 1.5 : 0.8}
                    strokeDasharray={isPrimary ? undefined : '6,4'}
                    filter={isPrimary ? 'url(#glow)' : undefined}
                    opacity={isInView ? 1 : 0}
                    style={{
                      transition: 'opacity 1s ease-out 0.6s',
                      animation: isPrimary ? 'pulseLine 3s ease-in-out infinite' : undefined,
                    }}
                  />
                  {/* Animated dot on primary lines */}
                  {isPrimary && (
                    <circle r="1.5" fill="#10B981" opacity="0.8" filter="url(#glow)">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={`M${fromNode.position.x},${fromNode.position.y} L${toNode.position.x},${toNode.position.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Node Elements */}
          {NODES.map((node: NodeInfo, index: number) => (
            <MapNode
              key={node.id}
              node={node}
              index={index}
              isInView={isInView}
              isHovered={hoveredNode === node.id}
              onHover={() => setHoveredNode(node.id)}
              onLeave={() => setHoveredNode(null)}
            />
          ))}

          {/* CSS for pulse line animation */}
          <style jsx>{`
            @keyframes pulseLine {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      </div>

      {/* ==================== Tablet Layout (768px - 1023px): Horizontal 3-col ==================== */}
      <div className="hidden md:flex lg:hidden max-w-4xl mx-auto gap-4">
        {NODES.map((node: NodeInfo, index: number) => (
          <TabletNodeCard
            key={node.id}
            node={node}
            index={index}
            isInView={isInView}
          />
        ))}
      </div>

      {/* ==================== Mobile Layout (<768px): Vertical stack ==================== */}
      <div className="md:hidden max-w-md mx-auto space-y-4">
        {NODES.map((node: NodeInfo, index: number) => (
          <MobileNodeCard
            key={node.id}
            node={node}
            index={index}
            isInView={isInView}
          />
        ))}
      </div>
    </section>
  );
}

/* ==================== Desktop Map Node Component ==================== */
interface MapNodeProps {
  node: NodeInfo;
  index: number;
  isInView: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MapNode({ node, index, isInView, isHovered, onHover, onLeave }: MapNodeProps) {
  const isCore = node.isCore;
  const size = isCore ? 140 : 96;
  const fontSize = isCore ? 'text-lg' : 'text-sm';
  const flagSize = isCore ? 'text-3xl' : 'text-2xl';
  const delay = 0.2 * index + 0.5;

  return (
    <>
      {/* Core node: outer rotating ring */}
      {isCore && (
        <div
          className="absolute z-0 pointer-events-none"
          style={{
            left: `calc(${node.position.x}% - ${size / 2}px)`,
            top: `calc(${node.position.y}% - ${size / 2}px)`,
            width: `${size + 24}px`,
            height: `${size + 24}px`,
            transition: `all 0.7s ease-out ${delay}s`,
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'scale(1)' : 'scale(0.5)',
          }}
        >
          <div className="w-full h-full rounded-full border-2 border-dashed border-license/30 animate-spin" style={{ animationDuration: '12s' }} />
        </div>
      )}

      {/* Core node: ping pulse */}
      {isCore && (
        <div
          className="absolute z-0 pointer-events-none"
          style={{
            left: `calc(${node.position.x}% - ${size / 2}px)`,
            top: `calc(${node.position.y}% - ${size / 2}px)`,
            width: `${size + 36}px`,
            height: `${size + 36}px`,
            transition: `all 0.7s ease-out ${delay}s`,
            opacity: isInView ? 1 : 0,
          }}
        >
          <div className="w-full h-full rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
      )}

      {/* Main Node Circle */}
      <div
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        className="absolute z-10 cursor-pointer group transition-all duration-300 hover:z-20"
        style={{
          left: `calc(${node.position.x}% - ${size / 2}px)`,
          top: `calc(${node.position.y}% - ${size / 2}px)`,
          width: `${size}px`,
          height: `${size}px`,
          transition: `all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s`,
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'scale(1)' : 'scale(0)',
        }}
      >
        <div
          className={`w-full h-full rounded-full flex flex-col items-center justify-center backdrop-blur-sm border transition-all duration-300 ${
            isCore
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_45px_rgba(16,185,129,0.3)] group-hover:scale-110'
              : `bg-gradient-to-br from-[${node.colorFrom}]/15 to-[${node.colorTo}]/15 border border-white/10 group-hover:border-[${node.color}]/40 group-hover:scale-110`
          }`}
          style={
            !isCore
              ? { background: `linear-gradient(135deg, ${node.colorFrom}18, ${node.colorTo}18)` }
              : undefined
          }
        >
          <span className={flagSize}>{node.flag}</span>
          <span className={`font-bold text-text-primary mt-1 ${fontSize}`}>{node.city}</span>
          {!isCore && (
            <span className="text-[10px] text-text-muted mt-0.5">{node.role}</span>
          )}
          {isCore && (
            <span className="text-[10px] font-semibold text-success mt-0.5 tracking-wide">
              ◉ CORE NODE
            </span>
          )}
        </div>
      </div>

      {/* Hover Popover/Card */}
      {isHovered && (
        <div
          className="absolute z-30 w-64 p-4 rounded-xl border border-deep-600 bg-deep-900/95 backdrop-blur-xl shadow-2xl"
          style={{
            left: `calc(${node.position.x}% - 128px)`,
            top: `calc(${node.position.y}% + ${size / 2 + 12}px)`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{node.flag}</span>
            <div>
              <p className="font-bold text-text-primary text-base">{node.country}</p>
              <p className="text-xs text-text-muted">{node.roleEn}</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">{node.role}</p>
          <ul className="space-y-1.5 mb-3">
            {node.assets.map((asset) => (
              <li key={asset} className="flex items-center gap-2 text-xs text-text-muted">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: node.color }}
                />
                {asset}
              </li>
            ))}
          </ul>
          <a
            href="/about#nodes"
            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: node.color }}
          >
            了解更多 →
          </a>
        </div>
      )}
    </>
  );
}

/* ==================== Tablet Node Card Component ==================== */
interface TabletNodeCardProps {
  node: NodeInfo;
  index: number;
  isInView: boolean;
}

function TabletNodeCard({ node, index, isInView }: TabletNodeCardProps) {
  const isCore = node.isCore;
  const delay = 0.15 * index + 0.3;

  return (
    <div
      className={`flex-1 relative rounded-xl border p-5 text-center transition-all duration-700 ${
        isCore
          ? 'border-success/30 bg-gradient-to-b from-emerald-500/10 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.08)]'
          : 'border-[#EAECEF] bg-white/50'
      }`}
      style={{
        transitionDelay: `${delay}s`,
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
      }}
    >
      {isCore && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-success/30 text-xs font-bold text-success">
          ◉ 核心节点
        </div>
      )}
      <span className="text-4xl block mb-2">{node.flag}</span>
      <h3 className="text-lg font-bold text-text-primary">{node.city}</h3>
      <p className="text-xs text-text-muted mt-1 mb-3">{node.role}</p>
      <div className="space-y-1.5 text-left">
        {node.assets.slice(0, 3).map((asset) => (
          <div key={asset} className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
            {asset}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== Mobile Node Card Component ==================== */
interface MobileNodeCardProps {
  node: NodeInfo;
  index: number;
  isInView: boolean;
}

function MobileNodeCard({ node, index, isInView }: MobileNodeCardProps) {
  const isCore = node.isCore;
  const delay = 0.12 * index + 0.2;

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-700 ${
        isCore
          ? 'border-success/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent'
          : 'border-deep-700 bg-deep-800/50'
      }`}
      style={{
        transitionDelay: `${delay}s`,
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateX(0)' : 'translateX(-20px)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Left icon area */}
        <div
          className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${node.colorFrom}20, ${node.colorTo}20)` }}
        >
          <span className="text-2xl">{node.flag}</span>
          {isCore && (
            <span className="text-[8px] font-bold text-success mt-0.5">CORE</span>
          )}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-text-primary">{node.country}</h3>
            {isCore && (
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-success/15 text-[10px] font-bold text-success">
                核心节点
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mb-2">{node.roleEn} · {node.role}</p>
          <div className="flex flex-wrap gap-1.5">
            {node.assets.map((asset) => (
              <span
                key={asset}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F7F8FA] text-[11px] text-text-muted"
              >
                <span className="w-1 h-1 rounded-full mr-1" style={{ backgroundColor: node.color }} />
                {asset}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
