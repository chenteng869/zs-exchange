'use client';

/**
 * APK 下载工具 Hook
 * - 加载 APK 元信息（版本/大小/包名等）
 * - 触发 APK 下载并尝试上报下载事件
 * - 智能识别用户设备平台
 *
 * 注：本项目使用 `output: 'export'` 静态导出，APK 元信息从
 *  `/apk-info.json` 静态资源加载；下载事件追踪为可选能力。
 */
import { useCallback, useEffect, useState } from 'react';

export interface ApkInfo {
  version: string;
  versionCode: number;
  fileSize: number;
  fileSizeFormatted: string;
  downloadUrl: string;
  packageName: string;
  minAndroidVersion: string;
  targetAndroidVersion: string;
  architecture: string[];
  releaseDate: string;
  buildTime: string;
  features?: string[];
}

export type DownloadSource = 'h5' | 'web' | 'qrcode' | 'direct' | 'admin';

interface UseApkDownloadOptions {
  source?: DownloadSource;
  autoFetch?: boolean;
}

interface ApkState {
  info: ApkInfo | null;
  loading: boolean;
  error: string | null;
}

function detectPlatform(): 'android' | 'ios' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  return 'unknown';
}

export function useApkDownload(options: UseApkDownloadOptions = {}) {
  const { source = 'web', autoFetch = true } = options;
  const [state, setState] = useState<ApkState>({
    info: null,
    loading: false,
    error: null,
  });

  const fetchInfo = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      // 优先尝试静态资源（带时间戳缓存破坏）
      const res = await fetch(`/apk-info.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      if (!res.ok) {
        throw new Error(`apk-info.json status: ${res.status}`);
      }
      const data = (await res.json()) as ApkInfo;
      setState({ info: data, loading: false, error: null });
    } catch (err: any) {
      // 兜底：使用默认配置
      const fallback: ApkInfo = {
        version: '1.0.0',
        versionCode: 1,
        fileSize: 0,
        fileSizeFormatted: '未知',
        downloadUrl: '/zs-exchange.apk',
        packageName: 'com.smy.exchange.smy_exchange_mobile',
        minAndroidVersion: '5.1 (API 22)',
        targetAndroidVersion: '14 (API 34)',
        architecture: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
        releaseDate: new Date().toISOString().split('T')[0],
        buildTime: new Date().toISOString(),
      };
      setState({
        info: fallback,
        loading: false,
        error: err?.message ?? 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchInfo();
    }
  }, [autoFetch, fetchInfo]);

  /**
   * 触发 APK 下载
   * - 在 iOS 上返回失败，引导至 Web 端
   * - 通过 <a download> 触发浏览器原生下载
   */
  const download = useCallback(
    async (overrideSource?: DownloadSource) => {
      const finalSource = overrideSource ?? source;
      const platform = detectPlatform();

      if (platform === 'ios') {
        return { success: false, reason: 'ios-unsupported' as const };
      }

      const url = state.info?.downloadUrl ?? '/zs-exchange.apk';
      const filename = `ZS-Exchange-${state.info?.version ?? 'latest'}.apk`;

      // 触发浏览器下载
      if (typeof window !== 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      return { success: true, url, filename, source: finalSource };
    },
    [source, state.info]
  );

  return {
    ...state,
    fetchInfo,
    download,
    platform: detectPlatform(),
  };
}
