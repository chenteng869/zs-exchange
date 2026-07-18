'use client';

/**
 * AdminPageShell（2026-07-18 真实化底座）
 *
 * 目标：替代 263 个 TEMPLATE page 的散乱顶层结构，提供统一的：
 *   - 客户端挂载 guard（解决 Math.random / Date.now hydration 不一致）
 *   - 页面标题 / 副标题 / 面包屑 / 操作区
 *   - 可选鉴权包装（不强制，可通过 requireAuth 关闭）
 *   - 内容区 section 划分
 *
 * 设计原则：
 *   - 不破坏既有 263 个 page.tsx（不强制接入）
 *   - 既有 AdminLayout 仍保留，新 page 可自由选择 AdminLayout 或 AdminPageShell
 *   - 'use client' 客户端组件，可在 page 中直接使用
 *   - 不耦合任何业务 API / 业务 store
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 不依赖具体业务 model
 *   - 不引入新依赖
 *   - 不修改 ProtectedRoute / AdminShell
 */

import { ReactNode, useEffect } from 'react';
import { Card, Space, Typography, Skeleton, Empty } from 'antd';
import { useMounted, DEFAULT_PLACEHOLDER } from './ui-helpers';
import AdminLayout from './AdminLayout';

const { Title, Text } = Typography;

export interface AdminPageShellProps {
  /** 页面标题（必填） */
  title: string;
  /** 页面副标题（可选） */
  subtitle?: string;
  /** 面包屑节点（可选） */
  breadcrumb?: ReactNode;
  /** 顶部右侧操作区（按钮组等） */
  actions?: ReactNode;
  /** 页面内容 */
  children: ReactNode;
  /**
   * 是否使用卡片容器包裹
   *  - true: 内容包在 <Card> 中
   *  - false: 直接渲染 children（适用于多区块自由组合）
   *  默认: true
   */
  carded?: boolean;
  /**
   * 是否使用占位符渲染（首屏 mounted 前）
   *  - 解决 hydration 不一致
   *  - 默认: true
   *  - 关闭: 业务侧自行控制 mounted guard
   */
  useMountedGuard?: boolean;
  /**
   * 自定义容器 className
   */
  className?: string;
  /**
   * 鉴权提示
   *  - 仅显示在标题旁，不实际拦截（拦截由 ProtectedRoute 负责）
   *  - 用于标识"本页面需要 xx 权限"
   */
  permissionHint?: string;
}

/**
 * AdminPageShell - 真实化页面顶层容器
 *
 * 使用示例：
 * ```tsx
 * export default function UsersKycPage() {
 *   return (
 *     <AdminPageShell
 *       title="KYC 审核"
 *       subtitle="用户实名认证审核"
 *       actions={<Button type="primary">导出</Button>}
 *       permissionHint="需要 users:approve 权限"
 *     >
 *       <KycList />
 *     </AdminPageShell>
 *   );
 * }
 * ```
 */
export function AdminPageShell({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
  carded = true,
  useMountedGuard = true,
  className,
  permissionHint,
}: AdminPageShellProps) {
  const mounted = useMounted();

  // 开发期 dev warning（不影响生产）
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && !title) {
      // eslint-disable-next-line no-console
      console.warn('[AdminPageShell] title is required for accessibility.');
    }
  }, [title]);

  const headerNode = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumb && <div style={{ marginBottom: 8 }}>{breadcrumb}</div>}
        <Space size="middle" align="baseline" wrap>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {permissionHint && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              🔒 {permissionHint}
            </Text>
          )}
        </Space>
        {subtitle && (
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </div>
      {actions && <Space wrap>{actions}</Space>}
    </div>
  );

  // mounted guard：首屏 SSR/CSR 不一致时显示骨架
  if (useMountedGuard && !mounted) {
    return (
      <AdminLayout data-admin-page-shell data-title={title} data-subtitle={subtitle} className={className}>
        {headerNode}
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </AdminLayout>
    );
  }

  if (carded) {
    return (
      <AdminLayout data-admin-page-shell data-title={title} data-subtitle={subtitle} className={className}>
        {headerNode}
        <Card>{children}</Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout data-admin-page-shell data-title={title} data-subtitle={subtitle} className={className}>
      {headerNode}
      {children}
    </AdminLayout>
  );
}

/**
 * AdminEmptyState - 通用空状态（AdminPageShell 子组件）
 */
export function AdminEmptyState({ description = '暂无数据' }: { description?: string }) {
  return <Empty description={description} />;
}

/**
 * AdminLoadingPlaceholder - 通用 loading 占位
 */
export function AdminLoadingPlaceholder({ rows = 4 }: { rows?: number }) {
  return <Skeleton active paragraph={{ rows }} />;
}

export default AdminPageShell;

// 重导出，方便使用
export { DEFAULT_PLACEHOLDER };
