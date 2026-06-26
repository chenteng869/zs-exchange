'use client';

/**
 * H5Empty — 空状态占位图
 *
 * 用于列表无数据、搜索无结果、钱包空等场景
 */
import { ReactNode, CSSProperties } from 'react';
import Link from 'next/link';

interface H5EmptyProps {
  icon?: ReactNode | string;
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  style?: CSSProperties;
}

const DEFAULT_ICON = (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="16" width="48" height="36" rx="6" stroke="#3B4A7A" strokeWidth="2" fill="none" />
    <circle cx="32" cy="38" r="10" stroke="#3B4A7A" strokeWidth="2" fill="none" />
    <path d="M28 38h8M32 34v8" stroke="#3B4A7A" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 26h6M18 30h4" stroke="#3B4A7A" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function H5Empty({
  icon,
  title = '暂无数据',
  description,
  actionText,
  actionHref,
  onAction,
  style,
}: H5EmptyProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        ...style,
      }}
    >
      <div style={{ marginBottom: 16, opacity: 0.6 }}>
        {typeof icon === 'string' ? (
          <span style={{ fontSize: 48 }}>{icon}</span>
        ) : (
          icon || DEFAULT_ICON
        )}
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#B4C0E0',
          marginBottom: description ? 6 : 0,
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            fontSize: 12,
            color: '#7B89B8',
            maxWidth: 240,
            lineHeight: 1.5,
          }}
        >
          {description}
        </div>
      )}

      {actionText && (
        <div style={{ marginTop: 20 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '8px 20px',
              borderRadius: 10,
              background:
                'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
              border: '1px solid rgba(240, 185, 11, 0.25)',
              color: '#FCD535',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {actionText}
          </span>
        </div>
      )}
    </div>
  );

  if (actionHref && !onAction) {
    return <Link href={actionHref}>{content}</Link>;
  }

  return (
    <div onClick={onAction} style={{ cursor: onAction ? 'pointer' : 'default' }}>
      {content}
    </div>
  );
}