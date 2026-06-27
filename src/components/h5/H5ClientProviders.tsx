'use client';

/**
 * H5 客户端 Provider 聚合
 *
 *  - 全局 H5 页面保持轻量，不在 SSR 阶段初始化 WalletConnect
 *  - Web3 钱包入口由 WalletButtonWithProvider 在浏览器端独立挂载
 *  - 可在此继续累加其他客户端 Provider（Recoil / Zustand / 全局 Toast）
 */

import { ReactNode } from 'react';

export function H5ClientProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
