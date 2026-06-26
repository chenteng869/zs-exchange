/**
 * RBAC 权限管理服务
 *
 * 功能：
 *  - 角色管理（创建、编辑、删除）
 *  - 权限管理（权限点定义、权限树）
 *  - 权限检查
 *  - 角色-权限关联
 *  - 用户-角色关联
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'import'
  | 'freeze'
  | 'unfreeze'
  | 'config'
  | 'audit';

export type PermissionModule =
  | 'dashboard'
  | 'users'
  | 'transactions'
  | 'content'
  | 'finance'
  | 'system'
  | 'risk'
  | 'cex'
  | 'dex'
  | 'defi'
  | 'wallet'
  | 'staking'
  | 'ido'
  | 'quant'
  | 'nft'
  | 'entertainment'
  | 'ecommerce'
  | 'enterprise'
  | 'token'
  | 'listing'
  | 'security'
  | 'command'
  | 'blockchain'
  | 'bpm'
  | 'iot'
  | 'i18n'
  | 'analytics'
  | 'kol'
  | 'maker'
  | 'dao'
  | 'dcep'
  | 'fiat'
  | 'insurance'
  | 'nansen'
  | 'sentiment'
  | 'yield'
  | 'portfolio';

export interface Permission {
  key: string;
  module: PermissionModule;
  action: PermissionAction;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'maintenance' | 'disabled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  roleIds: string[];
  status: 'active' | 'disabled' | 'frozen';
  lastLoginAt?: string;
  createdAt: string;
  createdBy: string;
}

const PERMISSION_STORAGE_KEY = 'zs-admin-rbac-permissions';
const ROLE_STORAGE_KEY = 'zs-admin-rbac-roles';
const ADMIN_STORAGE_KEY = 'zs-admin-rbac-admins';

const defaultPermissions: Permission[] = [];

const permissionModules: { module: PermissionModule; name: string; actions: { action: PermissionAction; name: string }[] }[] = [
  {
    module: 'dashboard',
    name: '数据中心',
    actions: [
      { action: 'view', name: '查看仪表盘' },
      { action: 'export', name: '导出数据' },
    ],
  },
  {
    module: 'users',
    name: '用户管理',
    actions: [
      { action: 'view', name: '查看用户' },
      { action: 'create', name: '创建用户' },
      { action: 'edit', name: '编辑用户' },
      { action: 'delete', name: '删除用户' },
      { action: 'freeze', name: '冻结用户' },
      { action: 'unfreeze', name: '解冻用户' },
      { action: 'approve', name: 'KYC审核' },
      { action: 'export', name: '导出用户' },
    ],
  },
  {
    module: 'transactions',
    name: '交易管理',
    actions: [
      { action: 'view', name: '查看交易' },
      { action: 'approve', name: '充值审核' },
      { action: 'reject', name: '驳回提现' },
      { action: 'freeze', name: '冻结交易' },
      { action: 'export', name: '导出交易' },
    ],
  },
  {
    module: 'content',
    name: '内容管理',
    actions: [
      { action: 'view', name: '查看内容' },
      { action: 'create', name: '创建内容' },
      { action: 'edit', name: '编辑内容' },
      { action: 'delete', name: '删除内容' },
      { action: 'approve', name: '审核内容' },
      { action: 'reject', name: '驳回内容' },
    ],
  },
  {
    module: 'finance',
    name: '财务管理',
    actions: [
      { action: 'view', name: '查看财务' },
      { action: 'approve', name: '充值审核' },
      { action: 'reject', name: '提现驳回' },
      { action: 'export', name: '导出报表' },
      { action: 'config', name: '财务配置' },
    ],
  },
  {
    module: 'system',
    name: '系统管理',
    actions: [
      { action: 'view', name: '查看系统' },
      { action: 'config', name: '系统配置' },
      { action: 'create', name: '创建管理员' },
      { action: 'edit', name: '编辑管理员' },
      { action: 'delete', name: '删除管理员' },
      { action: 'audit', name: '审计日志' },
    ],
  },
  {
    module: 'risk',
    name: '风控管理',
    actions: [
      { action: 'view', name: '查看风控' },
      { action: 'config', name: '风控规则配置' },
      { action: 'freeze', name: '冻结账户' },
      { action: 'unfreeze', name: '解冻账户' },
      { action: 'audit', name: '风控审计' },
    ],
  },
];

permissionModules.forEach((m) => {
  m.actions.forEach((a) => {
    defaultPermissions.push({
      key: `${m.module}:${a.action}`,
      module: m.module,
      action: a.action,
      name: a.name,
      description: `${m.name} - ${a.name}`,
    });
  });
});

const defaultRoles: Role[] = [
  {
    id: 'role-super-admin',
    name: '超级管理员',
    description: '拥有系统所有权限',
    permissions: defaultPermissions.map((p) => p.key),
    userCount: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-ops-director',
    name: '运营总监',
    description: '负责平台日常运营管理',
    permissions: [
      'dashboard:view',
      'dashboard:export',
      'users:view',
      'users:edit',
      'users:freeze',
      'users:unfreeze',
      'users:approve',
      'content:view',
      'content:create',
      'content:edit',
      'content:delete',
      'content:approve',
      'finance:view',
    ],
    userCount: 1,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-finance',
    name: '财务审核员',
    description: '负责财务审核与对账',
    permissions: [
      'dashboard:view',
      'finance:view',
      'finance:approve',
      'finance:reject',
      'finance:export',
      'transactions:view',
      'transactions:approve',
      'transactions:reject',
    ],
    userCount: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-customer-service',
    name: '客服人员',
    description: '处理用户咨询和投诉',
    permissions: [
      'dashboard:view',
      'users:view',
      'transactions:view',
    ],
    userCount: 5,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-content-moderator',
    name: '内容审核员',
    description: '负责内容审核和发布',
    permissions: [
      'dashboard:view',
      'content:view',
      'content:approve',
      'content:reject',
      'content:edit',
    ],
    userCount: 3,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-data-analyst',
    name: '数据分析师',
    description: '查看和分析数据报表',
    permissions: [
      'dashboard:view',
      'dashboard:export',
      'users:view',
      'transactions:view',
      'finance:view',
    ],
    userCount: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'role-risk-officer',
    name: '风控专员',
    description: '负责风险监控与处置',
    permissions: [
      'dashboard:view',
      'risk:view',
      'risk:freeze',
      'risk:unfreeze',
      'risk:audit',
      'users:view',
      'users:freeze',
      'transactions:view',
    ],
    userCount: 2,
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
];

const defaultAdmins: AdminUser[] = [
  {
    id: 'admin-001',
    username: 'superadmin',
    email: 'superadmin@zs.exchange',
    roleIds: ['role-super-admin'],
    status: 'active',
    lastLoginAt: '2026-06-18T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'admin-002',
    username: 'ops_director',
    email: 'ops@zs.exchange',
    roleIds: ['role-ops-director'],
    status: 'active',
    lastLoginAt: '2026-06-18T09:30:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'system',
  },
];

let permissions: Permission[] = [...defaultPermissions];
let roles: Role[] = [...defaultRoles];
let admins: AdminUser[] = [...defaultAdmins];

const loadFromStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    const storedRoles = localStorage.getItem(ROLE_STORAGE_KEY);
    if (storedRoles) {
      roles = JSON.parse(storedRoles);
    }

    const storedAdmins = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (storedAdmins) {
      admins = JSON.parse(storedAdmins);
    }
  } catch (e) {
    logger.error('[RBAC] 加载权限数据失败', e);
  }
};

const saveToStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admins));
  } catch (e) {
    logger.error('[RBAC] 保存权限数据失败', e);
  }
};

if (typeof window !== 'undefined') {
  loadFromStorage();
}

export const getAllPermissions = (): Permission[] => {
  return [...permissions];
};

export const getPermissionsByModule = (): Record<string, Permission[]> => {
  const grouped: Record<string, Permission[]> = {};
  permissions.forEach((p) => {
    if (!grouped[p.module]) {
      grouped[p.module] = [];
    }
    grouped[p.module].push(p);
  });
  return grouped;
};

export const getPermissionTree = () => {
  const modulesMap: Record<string, { module: PermissionModule; name: string; permissions: Permission[] }> = {};

  permissionModules.forEach((m) => {
    modulesMap[m.module] = {
      module: m.module,
      name: m.name,
      permissions: permissions.filter((p) => p.module === m.module),
    };
  });

  return permissionModules.map((m) => ({
    key: m.module,
    title: m.name,
    children: m.actions.map((a) => ({
      key: `${m.module}:${a.action}`,
      title: a.name,
    })),
  }));
};

export const getAllRoles = (): Role[] => {
  return [...roles];
};

export const getRoleById = (id: string): Role | undefined => {
  return roles.find((r) => r.id === id);
};

export const createRole = (data: { name: string; description: string; permissions: string[] }): Role => {
  const authState = useAuthStore.getState();
  const newRole: Role = {
    id: `role-${Date.now()}`,
    name: data.name,
    description: data.description,
    permissions: data.permissions,
    userCount: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: authState.user?.id || 'unknown',
  };

  roles.push(newRole);
  saveToStorage();
  logger.info(`[RBAC] 创建角色: ${newRole.name}`);
  return newRole;
};

export const updateRole = (id: string, data: Partial<Omit<Role, 'id' | 'createdAt' | 'createdBy'>>): Role | undefined => {
  const index = roles.findIndex((r) => r.id === id);
  if (index === -1) return undefined;

  roles[index] = {
    ...roles[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  saveToStorage();
  logger.info(`[RBAC] 更新角色: ${roles[index].name}`);
  return roles[index];
};

export const deleteRole = (id: string): boolean => {
  const index = roles.findIndex((r) => r.id === id);
  if (index === -1) return false;

  const role = roles[index];
  if (role.userCount > 0) {
    logger.warn(`[RBAC] 无法删除角色: 仍有 ${role.userCount} 个用户`);
    return false;
  }

  roles.splice(index, 1);
  saveToStorage();
  logger.info(`[RBAC] 删除角色: ${role.name}`);
  return true;
};

export const assignPermissionsToRole = (roleId: string, permissionKeys: string[]): boolean => {
  const role = getRoleById(roleId);
  if (!role) return false;

  const validPermissions = permissionKeys.filter((key) =>
    permissions.some((p) => p.key === key)
  );

  role.permissions = validPermissions;
  role.updatedAt = new Date().toISOString();
  saveToStorage();
  logger.info(`[RBAC] 角色 ${role.name} 分配了 ${validPermissions.length} 个权限`);
  return true;
};

export const getAllAdmins = (): AdminUser[] => {
  return [...admins];
};

export const getAdminById = (id: string): AdminUser | undefined => {
  return admins.find((a) => a.id === id);
};

export const getAdminPermissions = (adminId: string): string[] => {
  const admin = getAdminById(adminId);
  if (!admin) return [];

  const permissionSet = new Set<string>();
  admin.roleIds.forEach((roleId) => {
    const role = getRoleById(roleId);
    if (role) {
      role.permissions.forEach((p) => permissionSet.add(p));
    }
  });

  return Array.from(permissionSet);
};

export const hasPermission = (permissionKey: string): boolean => {
  const authState = useAuthStore.getState();
  if (!authState.user) return false;

  if (authState.user.role === 'admin') {
    return true;
  }

  const adminPerms = getAdminPermissions(authState.user.id);
  return adminPerms.includes(permissionKey);
};

export const hasAnyPermission = (permissionKeys: string[]): boolean => {
  return permissionKeys.some((key) => hasPermission(key));
};

export const hasAllPermissions = (permissionKeys: string[]): boolean => {
  return permissionKeys.every((key) => hasPermission(key));
};

export const hasModulePermission = (module: PermissionModule, action: PermissionAction): boolean => {
  return hasPermission(`${module}:${action}`);
};

export const canAccessPage = (pagePath: string): boolean => {
  const authState = useAuthStore.getState();
  if (!authState.isAuthenticated) return false;

  if (authState.user?.role === 'admin') {
    return true;
  }

  if (pagePath.startsWith('/admin/dashboard')) {
    return hasModulePermission('dashboard', 'view');
  }
  if (pagePath.startsWith('/admin/users')) {
    return hasModulePermission('users', 'view');
  }
  if (pagePath.startsWith('/admin/transactions')) {
    return hasModulePermission('transactions', 'view');
  }
  if (pagePath.startsWith('/admin/finance')) {
    return hasModulePermission('finance', 'view');
  }
  if (pagePath.startsWith('/admin/content')) {
    return hasModulePermission('content', 'view');
  }
  if (pagePath.startsWith('/admin/settings')) {
    return hasModulePermission('system', 'view') || hasModulePermission('system', 'config');
  }
  if (pagePath.startsWith('/admin/audit-logs')) {
    return hasModulePermission('system', 'audit');
  }
  if (pagePath.startsWith('/admin/security')) {
    return hasModulePermission('risk', 'view');
  }

  return true;
};

export const createAdmin = (data: {
  username: string;
  email: string;
  roleIds: string[];
}): AdminUser => {
  const authState = useAuthStore.getState();
  const newAdmin: AdminUser = {
    id: `admin-${Date.now()}`,
    username: data.username,
    email: data.email,
    roleIds: data.roleIds,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: authState.user?.id || 'unknown',
  };

  admins.push(newAdmin);

  data.roleIds.forEach((roleId) => {
    const role = getRoleById(roleId);
    if (role) {
      role.userCount += 1;
    }
  });

  saveToStorage();
  logger.info(`[RBAC] 创建管理员: ${newAdmin.username}`);
  return newAdmin;
};

export const updateAdmin = (id: string, data: Partial<Omit<AdminUser, 'id' | 'createdAt' | 'createdBy'>>): AdminUser | undefined => {
  const index = admins.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  const oldRoleIds = admins[index].roleIds;
  const newRoleIds = data.roleIds || oldRoleIds;

  oldRoleIds.forEach((roleId) => {
    const role = getRoleById(roleId);
    if (role && !newRoleIds.includes(roleId)) {
      role.userCount = Math.max(0, role.userCount - 1);
    }
  });

  newRoleIds.forEach((roleId) => {
    const role = getRoleById(roleId);
    if (role && !oldRoleIds.includes(roleId)) {
      role.userCount += 1;
    }
  });

  admins[index] = {
    ...admins[index],
    ...data,
  };

  saveToStorage();
  logger.info(`[RBAC] 更新管理员: ${admins[index].username}`);
  return admins[index];
};

export const deleteAdmin = (id: string): boolean => {
  const index = admins.findIndex((a) => a.id === id);
  if (index === -1) return false;

  const admin = admins[index];

  admin.roleIds.forEach((roleId) => {
    const role = getRoleById(roleId);
    if (role) {
      role.userCount = Math.max(0, role.userCount - 1);
    }
  });

  admins.splice(index, 1);
  saveToStorage();
  logger.info(`[RBAC] 删除管理员: ${admin.username}`);
  return true;
};

export const getPermissionModules = () => permissionModules;

export const rbac = {
  getAllPermissions,
  getPermissionTree,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  getAllAdmins,
  getAdminById,
  getAdminPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasModulePermission,
  canAccessPage,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};

export default rbac;
