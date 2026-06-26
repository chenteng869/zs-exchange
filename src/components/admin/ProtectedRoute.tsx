/**
 * 权限守卫组件
 *
 * 用于保护需要特定权限才能访问的页面和组件
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Spin, Result, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { canAccessPage } from '@/lib/admin/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredModule?: string;
  requiredAction?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredModule,
  requiredAction,
  fallback,
  redirectTo = '/admin/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAuthenticating } = useAuthStore();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthenticating) {
      return;
    }

    if (!isAuthenticated || !user) {
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
      return;
    }

    let hasAccess = true;

    if (user.role === 'admin') {
      hasAccess = true;
    } else {
      if (requiredPermission) {
        const perms = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
        hasAccess = perms.includes(requiredPermission);
      }

      if (hasAccess && requiredModule && requiredAction) {
        const perms = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
        hasAccess = perms.includes(`${requiredModule}:${requiredAction}`);
      }

      if (hasAccess) {
        hasAccess = canAccessPage(pathname);
      }
    }

    setAuthorized(hasAccess);
  }, [
    isAuthenticated,
    isAuthenticating,
    user,
    requiredPermission,
    requiredModule,
    requiredAction,
    pathname,
    redirectTo,
    router,
  ]);

  if (isAuthenticating || authorized === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="权限验证中..." />
      </div>
    );
  }

  if (!authorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f7fa',
        }}
      >
        <Result
          icon={<LockOutlined style={{ color: '#faad14' }} />}
          status="403"
          title="访问被拒绝"
          subTitle="抱歉，您没有权限访问此页面"
          extra={
            <Button
              type="primary"
              onClick={() => router.push('/admin/dashboard')}
            >
              返回仪表盘
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
