'use client';

/**
 * H5 客户端 Provider 聚合
 *
 *  - WagmiProvider（钱包）
 *  - 可在此继续累加其他客户端 Provider（Recoil / Zustand / 全局 Toast）
 */

import { ReactNode } from 'react';
import { WagmiProvider } from '@/lib/web3/WagmiProvider';

export function H5ClientProviders({ children }: { children: ReactNode }) {
  return <WagmiProvider>{children}</WagmiProvider>;
}
