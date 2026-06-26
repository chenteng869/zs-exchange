'use client';

/**
 * H5Skeleton — 移动端骨架屏
 *
 * 用于页面/卡片加载中的占位动画
 * 支持 line / rect / circle / card 四种形态
 */
import { CSSProperties } from 'react';

interface H5SkeletonProps {
  type?: 'line' | 'rect' | 'circle' | 'card';
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
  count?: number;
}

const shimmer = `
  @keyframes h5-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

function skeletonStyle(width?: string | number, height?: string | number, extra?: CSSProperties): CSSProperties {
  return {
    width: width ?? '100%',
    height: height ?? 16,
    borderRadius: 6,
    background:
      'linear-gradient(90deg, rgba(26,36,86,0.40) 0%, rgba(56,189,248,0.15) 50%, rgba(26,36,86,0.40) 100%)',
    backgroundSize: '200% 100%',
    animation: 'h5-shimmer 1.5s ease-in-out infinite',
    ...extra,
  };
}

export default function H5Skeleton({ type = 'line', width, height, style, count = 1 }: H5SkeletonProps) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <>
        <style>{shimmer}</style>
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 12,
              ...style,
            }}
          >
            <div style={skeletonStyle('40%', 12, { marginBottom: 10 })} />
            <div style={skeletonStyle('80%', 14, { marginBottom: 8 })} />
            <div style={skeletonStyle('60%', 12)} />
          </div>
        ))}
      </>
    );
  }

  if (type === 'circle') {
    return (
      <>
        <style>{shimmer}</style>
        <div
          style={{
            ...skeletonStyle(width ?? 40, height ?? 40, {
              borderRadius: '50%',
              ...style,
            }),
          }}
        />
      </>
    );
  }

  if (type === 'rect') {
    return (
      <>
        <style>{shimmer}</style>
        <div style={skeletonStyle(width ?? 200, height ?? 120, style)} />
      </>
    );
  }

  // line
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((_, i) => (
          <div key={i} style={skeletonStyle(i % 2 === 0 ? '90%' : '70%', height, style)} />
        ))}
      </div>
    </>
  );
}