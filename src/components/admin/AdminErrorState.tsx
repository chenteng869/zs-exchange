'use client';

/**
 * AdminErrorState（2026-07-18 真实化底座）
 *
 * 目标：提供 263 个 TEMPLATE page 统一的 error 态
 *   - 替代散落的 message.error() / "加载失败" 文本 / 空白错误页
 *   - 提供 4 种 variant：page / block / inline / notFound / forbidden
 *   - 内置重试按钮（onRetry）
 *   - 统一错误码展示（来自 api-response-schema）
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 不引入新依赖
 *   - 不耦合业务
 *   - 不强制任何 page 接入
 */

import { ReactNode, CSSProperties } from 'react';
import { Result, Button, Alert, Empty, Space, Typography } from 'antd';
import {
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FrownOutlined,
  LockOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export type AdminErrorVariant = 'page' | 'block' | 'inline' | 'notFound' | 'forbidden';

export interface AdminErrorStateProps {
  /** 错误变体 */
  variant?: AdminErrorVariant;
  /** 错误对象或字符串 */
  error?: Error | string | null;
  /** 错误码（来自 API response.error.code） */
  code?: string;
  /** 自定义标题（覆盖默认） */
  title?: string;
  /** 自定义副标题 */
  description?: string;
  /** 重试回调 */
  onRetry?: () => void;
  /** 返回上一页回调 */
  onBack?: () => void;
  /** 容器样式 */
  style?: CSSProperties;
  /** 额外操作区 */
  extra?: ReactNode;
}

/**
 * 从 Error 或 string 提取可读消息
 */
function extractMessage(error: Error | string | null | undefined): string {
  if (!error) return '未知错误';
  if (typeof error === 'string') return error;
  return error.message || '未知错误';
}

/**
 * AdminErrorState - 统一 error 态
 *
 * 使用示例：
 * ```tsx
 * if (error) return <AdminErrorState variant="page" error={error} onRetry={refetch} />;
 * if (error) return <AdminErrorState variant="block" error={error} onRetry={refetch} />;
 * ```
 */
export function AdminErrorState({
  variant = 'block',
  error,
  code,
  title,
  description,
  onRetry,
  onBack,
  style,
  extra,
}: AdminErrorStateProps) {
  const errMsg = extractMessage(error);
  const errCode = code || (error && typeof error === 'object' && 'code' in error ? String((error as any).code) : undefined);

  // inline 模式：紧凑 Alert
  if (variant === 'inline') {
    return (
      <Alert
        type="error"
        showIcon
        message={title || '操作失败'}
        description={
          <Space direction="vertical" size={4}>
            {errCode && <Text type="secondary" style={{ fontSize: 12 }}>错误码: {errCode}</Text>}
            <Text>{errMsg}</Text>
          </Space>
        }
        action={
          onRetry ? (
            <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
              重试
            </Button>
          ) : undefined
        }
        style={style}
      />
    );
  }

  // notFound
  if (variant === 'notFound') {
    return (
      <Result
        status="404"
        title="404"
        subTitle={description || '抱歉，您访问的页面不存在'}
        extra={
          <Space>
            {onBack && <Button onClick={onBack}>返回</Button>}
            {onRetry && <Button type="primary" onClick={onRetry}>刷新</Button>}
            {extra}
          </Space>
        }
        style={style}
      />
    );
  }

  // forbidden
  if (variant === 'forbidden') {
    return (
      <Result
        status="403"
        icon={<LockOutlined style={{ color: '#FAAD14' }} />}
        title="403"
        subTitle={description || '抱歉，您没有权限访问此页面'}
        extra={
          <Space>
            {onBack && <Button onClick={onBack}>返回</Button>}
            {extra}
          </Space>
        }
        style={style}
      />
    );
  }

  // page / block 模式：Result
  const defaultIcon =
    variant === 'page' ? <FrownOutlined /> : <CloseCircleOutlined />;
  const defaultTitle = title || (variant === 'page' ? '页面加载失败' : '数据加载失败');

  return (
    <Result
      icon={defaultIcon}
      status="error"
      title={defaultTitle}
      subTitle={
        <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
          {errCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              错误码: {errCode}
            </Text>
          )}
          <Paragraph copyable={{ tooltips: ['复制', '已复制'] }} style={{ marginBottom: 0 }}>
            {description || errMsg}
          </Paragraph>
        </Space>
      }
      extra={
        <Space wrap>
          {onBack && <Button onClick={onBack}>返回</Button>}
          {onRetry && (
            <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
              重试
            </Button>
          )}
          {extra}
        </Space>
      }
      style={style}
    />
  );
}

export default AdminErrorState;
