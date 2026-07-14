'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminShell from '@/components/admin/AdminShell';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <QueryClientProvider client={queryClient}>
      {isLoginPage ? children : <AdminShell>{children}</AdminShell>}
    </QueryClientProvider>
  );
}
