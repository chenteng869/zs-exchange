'use client';

/**
 * H5 移动端 - APP 下载浮窗
 * - 顶部横条样式
 * - 仅在 Android 浏览器/微信中显示（iOS 不显示）
 * - 关闭后 24 小时内不再显示（localStorage 记忆）
 * - 点击直接下载 APK（Android）/ 跳转下载页（iOS）
 */
import { useEffect, useState } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useApkDownload } from '@/hooks/useApkDownload';

const STORAGE_KEY = 'zs_apk_banner_dismissed_at';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 小时

export default function H5DownloadBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { info: apkInfo, download: downloadApk, platform } = useApkDownload({
    source: 'h5',
    autoFetch: true,
  });

  useEffect(() => {
    setMounted(true);

    // iOS 暂不展示（App Store 未上架）
    if (platform === 'ios') {
      setVisible(false);
      return;
    }

    // 已经被用户关闭过，检查是否在免打扰期内
    try {
      const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const ts = parseInt(dismissedAt, 10);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_DURATION_MS) {
          return;
        }
      }
    } catch {
      // localStorage 不可用时直接显示
    }

    // 延迟 800ms 弹出，避免和首屏渲染冲突
    const timer = window.setTimeout(() => setVisible(true), 800);
    return () => window.clearTimeout(timer);
  }, [platform]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleDownload = async () => {
    await downloadApk('h5');
  };

  if (!mounted || !visible || platform === 'ios') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(64px + env(safe-area-inset-top, 0px) + 4px)',
        left: 8,
        right: 8,
        maxWidth: 464,
        margin: '0 auto',
        zIndex: 90,
        background:
          'linear-gradient(135deg, rgba(56, 189, 248, 0.95) 0%, rgba(30, 64, 175, 0.95) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.20)',
        borderRadius: 14,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(56, 189, 248, 0.10)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        animation: 'zs-banner-slide 0.4s ease-out',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Smartphone size={20} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
          ZS Exchange APP 已上线
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', marginTop: 1 }}>
          {apkInfo
            ? `v${apkInfo.version} · ${apkInfo.fileSizeFormatted} · 原生体验`
            : '原生体验 推送更快 交易更稳'}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '7px 12px',
          background: '#fff',
          color: '#0F1B3D',
          border: 'none',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Download size={12} />
        下载
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="关闭"
        style={{
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.12)',
          border: 'none',
          borderRadius: '50%',
          color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <X size={12} />
      </button>
      <style jsx global>{`
        @keyframes zs-banner-slide {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
