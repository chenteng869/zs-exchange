'use client';

/**
 * Wagmi Provider 包装
 *
 *  - 在 h5/layout.tsx 中包整个 H5
 *  - 复用项目已有的 @tanstack/react-query
 *  - 客户端 side：先 useState 创建 QueryClient，再返回 Provider
 */

import { ReactNode, useState } from 'react';
import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from './wagmi-config';

interface WagmiProviderProps {
  children: ReactNode;
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  // 配置：每次组件挂载只创建一次（React 18 useState lazy init）
  const [config] = useState(() => getWagmiConfig());
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  );
}
