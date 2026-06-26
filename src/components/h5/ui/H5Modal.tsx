'use client';

/**
 * H5Modal — 移动端底部弹出式模态框
 *
 * 使用 slide-up 动画从底部弹出，符合移动端交互习惯
 * 支持标题 / 内容 / 操作按钮 / 点击蒙层关闭
 */
import { ReactNode, CSSProperties, useEffect, useRef, useState } from 'react';

interface H5ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  style?: CSSProperties;
}

export default function H5Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnOverlay = true,
  style,
}: H5ModalProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => {
        timerRef.current = setTimeout(() => setAnimating(true), 20);
      });
    } else {
      setAnimating(false);
      timerRef.current = setTimeout(() => setVisible(false), 250);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  if (!visible) return null;

  return (
    <>
      {/* 蒙层 */}
      <div
        onClick={closeOnOverlay ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: animating ? 'rgba(0, 0, 0, 0.50)' : 'rgba(0, 0, 0, 0)',
          transition: 'background 0.25s ease',
        }}
      />

      {/* 面板 */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 901,
          maxHeight: '80vh',
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.98) 0%, rgba(15, 27, 61, 0.98) 100%)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          transform: animating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        {/* 拖拽指示条 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(148, 163, 184, 0.30)',
            }}
          />
        </div>

        {/* 标题 */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 16px 12px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
              {title}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(148, 163, 184, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 28,
                height: 28,
                color: '#B4C0E0',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        )}

        {/* 内容 */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          {children}
        </div>

        {/* 底部操作 */}
        {footer && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(148, 163, 184, 0.08)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}