'use client';

import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  ShoppingOutlined,
  HeartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

/**
 * ZS Exchange DataCard 组件 V4
 * 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第8/13章
 *
 * 预设语义色（V1.0 后台）：
 *   primary  蓝  #1677FF
 *   success  绿  #16A34A
 *   web3     紫  #7C3AED
 *   warning  橙  #F59E0B
 *
 * 趋势色：
 *   up   涨  #16A34A
 *   down 跌  #DC2626
 */

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'none';
  trendValue?: string;
  description?: string;
  loading?: boolean;
  onClick?: () => void;
  action?: React.ReactNode;
}

const COLOR_UP = '#16A34A';
const COLOR_DOWN = '#DC2626';
const COLOR_NEUTRAL = '#9CA3AF';

export function DataCard({
  title,
  value,
  icon = <UserOutlined />,
  color = '#1677FF',
  prefix,
  suffix,
  trend = 'none',
  trendValue,
  description,
  loading = false,
  onClick,
  action,
}: DataCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <RiseOutlined style={{ color: COLOR_UP }} />;
    }
    if (trend === 'down') {
      return <FallOutlined style={{ color: COLOR_DOWN }} />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return COLOR_UP;
    if (trend === 'down') return COLOR_DOWN;
    return COLOR_NEUTRAL;
  };

  return (
    <Card
      className="data-card"
      hoverable={!!onClick}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 12,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      loading={loading}
      actions={action ? [action] : undefined}
    >
      <Row align="middle" gutter={16}>
        <Col>
          <div
            className="data-card-icon"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: `${color}15`, // 8% 透明
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              color,
            }}
          >
            {icon}
          </div>
        </Col>
        <Col flex="auto">
          <Statistic
            title={<span style={{ color: '#6B7280', fontSize: 14 }}>{title}</span>}
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ fontSize: 28, fontWeight: 600, color: '#111827' }}
          />

          {trend !== 'none' && trendValue && (
            <div className="flex items-center mt-2">
              {getTrendIcon()}
              <span
                style={{
                  color: getTrendColor(),
                  marginLeft: 4,
                  fontSize: 13,
                }}
              >
                {trendValue}
                <span style={{ color: '#9CA3AF', marginLeft: 4 }}>较上期</span>
              </span>
            </div>
          )}

          {description && (
            <div style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
              {description}
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
}

// 预设数据卡片（V1.0 色系）
export function UserDataCard(props: Partial<DataCardProps>) {
  return (
    <DataCard
      title="总用户数"
      value={0}
      icon={<UserOutlined />}
      color="#1677FF" // 电光蓝 - 主品牌色
      {...props}
    />
  );
}

export function RevenueDataCard(props: Partial<DataCardProps>) {
  return (
    <DataCard
      title="总收入"
      value={0}
      prefix="$"
      icon={<DollarOutlined />}
      color="#16A34A" // 后台成功绿
      {...props}
    />
  );
}

export function TransactionDataCard(props: Partial<DataCardProps>) {
  return (
    <DataCard
      title="交易笔数"
      value={0}
      icon={<ShoppingOutlined />}
      color="#7C3AED" // Web3 紫
      {...props}
    />
  );
}

export function NFTDataCard(props: Partial<DataCardProps>) {
  return (
    <DataCard
      title="NFT 铸造"
      value={0}
      icon={<HeartOutlined />}
      color="#F59E0B" // 警告橙
      {...props}
    />
  );
}

export { DataCard as default };
