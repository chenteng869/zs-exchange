'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // 管理员后台根路径自动跳转到仪表板
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <p className="text-gray-500">正在加载管理后台...</p>
      </div>
    </AdminLayout>
  );
}
