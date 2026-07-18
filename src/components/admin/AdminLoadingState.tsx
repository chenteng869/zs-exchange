'use client';

/**
 * AdminLoadingState（2026-07-18 真实化底座）
 *
 * 目标：提供 263 个 TEMPLATE page 统一的 loading 态
 *   - 替代散落的 <Spin /> / <Skeleton /> / "加载中..." 文本
 *   - 解决 hydration 不一致：默认使用占位骨架，SSR/CSR 渲染一致
 *   - 提供 4 种 variant：page / block / table / inline
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 不引入新依赖
 *   - 不耦合业务
 *   - 不强制任何 page 接入
 */

import { ReactNode, CSSProperties } from 'react';
import { Skeleton, Spin, Card, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export type AdminLoadingVariant = 'page' | 'block' | 'table' | 'inline';

export interface AdminLoadingStateProps {
  /** 加载态变体 */
  variant?: AdminLoadingVariant;
  /** 骨架行数（block / table 模式有效） */
  rows?: number;
  /** 自定义文本 */
  text?: string;
  /** 容器高度（inline 模式有效） */
  height?: number | string;
  /** 容器样式 */
  style?: CSSProperties;
  /** 子节点（提供子节点时，loading 包裹子节点） */
  children?: ReactNode;
}

/**
 * AdminLoadingState - 统一 loading 态
 *
 * 使用示例：
 * ```tsx
 * if (loading) return <AdminLoadingState variant="block" rows={6} />;
 * if (loading) return <AdminLoadingState variant="table" rows={5} />;
 * if (loading) return <AdminLoadingState variant="page" />;
 * ```
 */
export function AdminLoadingState({
  variant = 'block',
  rows = 4,
  text,
  height = 200,
  style,
  children,
}: AdminLoadingStateProps) {
  if (children !== undefined) {
    return (
      <Spin spinning indicator={<LoadingOutlined />} tip={text}>
        {children}
      </Spin>
    );
  }

  switch (variant) {
    case 'page':
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <Space direction="vertical" size="middle" align="center">
            <Spin size="large" tip={text} />
            {text && <span style={{ color: '#94A3B8' }}>{text}</span>}
          </Space>
        </div>
      );

    case 'block':
      return (
        <Card>
          <Skeleton active paragraph={{ rows }} />
        </Card>
      );

    case 'table':
      return (
        <div
          style={{
            padding: 16,
            background: '#FFFFFF',
            borderRadius: 8,
            border: '1px solid #F1F5F9',
            ...style,
          }}
        >
          <Skeleton active paragraph={{ rows }} />
        </div>
      );

    case 'inline':
      return (
        <div
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
          }}
        >
          <Spin tip={text} />
        </div>
      );

    default:
      return <Skeleton active paragraph={{ rows }} />;
  }
}

export default AdminLoadingState;
