/**
 * 权限检查 Hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasModulePermission,
  canAccessPage,
  getAdminPermissions,
  type PermissionModule,
  type PermissionAction,
} from '@/lib/admin/rbac';
import { useAuthStore } from '@/stores/authStore';

export function usePermission() {
  const { user, isAuthenticated } = useAuthStore();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      const perms = getAdminPermissions(user.id);
      setPermissions(perms);
    } else {
      setPermissions([]);
    }
  }, [user, isAuthenticated]);

  const can = useCallback(
    (permissionKey: string): boolean => {
      if (!isAuthenticated) return false;
      if (user?.role === 'admin') return true;
      return hasPermission(permissionKey);
    },
    [isAuthenticated, user]
  );

  const canAny = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!isAuthenticated) return false;
      if (user?.role === 'admin') return true;
      return hasAnyPermission(permissionKeys);
    },
    [isAuthenticated, user]
  );

  const canAll = useCallback(
    (permissionKeys: string[]): boolean => {
      if (!isAuthenticated) return false;
      if (user?.role === 'admin') return true;
      return hasAllPermissions(permissionKeys);
    },
    [isAuthenticated, user]
  );

  const canModule = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      if (!isAuthenticated) return false;
      if (user?.role === 'admin') return true;
      return hasModulePermission(module, action);
    },
    [isAuthenticated, user]
  );

  const canAccess = useCallback(
    (pagePath: string): boolean => {
      if (!isAuthenticated) return false;
      if (user?.role === 'admin') return true;
      return canAccessPage(pagePath);
    },
    [isAuthenticated, user]
  );

  const isSuperAdmin = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  return {
    permissions,
    loading,
    can,
    canAny,
    canAll,
    canModule,
    canAccess,
    isSuperAdmin,
    isAuthenticated,
  };
}

export function usePagePermission(pagePath: string) {
  const { canAccess, isAuthenticated } = usePermission();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setChecking(true);
    const result = canAccess(pagePath);
    setHasAccess(result);
    setChecking(false);
  }, [pagePath, canAccess]);

  return {
    hasAccess,
    checking,
    isAuthenticated,
  };
}
