'use client';

import React, { forwardRef } from 'react';
import {
  userStatus,
  txStatus,
  orderStatus,
  riskLevel,
  getUserStatusColor,
  getTxStatusColor,
  getOrderStatusColor,
  getRiskColor,
} from '@/styles/tokens';

/**
 * ZS Exchange StatusBadge 组件 V4
 * 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》第8章
 *
 * 四大业务状态色（跨系统统一）：
 *   8.1 用户状态   - normal/noKyc/kycPending/kycRejected/amlReview/highRisk/frozen/blacklist
 *   8.2 充值提现状态 - pending/confirming/success/failed/riskBlocked/amlCheck/manualReview/cancelled
 *   8.3 订单状态   - open/filled/partial/cancelled/rejected/liquidated
 *   8.4 风控等级   - low/medium/high/critical/resolved
 *
 * 风格：柔和色块（文字=纯色 + 背景=对应色 10% 透明）
 *      或 实心色块（白字 + 纯色背景）
 */

export type StatusCategory = 'user' | 'tx' | 'order' | 'risk';

export type StatusVariant = 'soft' | 'solid' | 'outline';
/** soft=柔和背景(默认)，solid=实心高对比，outline=边框 */

export type StatusSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** 业务状态分类 */
  category: StatusCategory;
  /** 状态值（见 V1.0 第8章枚举） */
  status: string;
  /** 中文标签（可选，不传则显示 status 原文） */
  label?: string;
  /** 显示风格 */
  variant?: StatusVariant;
  /** 尺寸 */
  size?: StatusSize;
  /** 显示状态点（左侧圆点） */
  dot?: boolean;
}

// ==================== 状态文案映射 ====================

const userStatusLabels: Record<string, string> = {
  normal: '正常',
  noKyc: '未KYC',
  kycPending: 'KYC待审',
  kycRejected: 'KYC拒绝',
  amlReview: 'AML复核',
  highRisk: '高风险',
  frozen: '已冻结',
  blacklist: '黑名单',
};

const txStatusLabels: Record<string, string> = {
  pending: '待处理',
  confirming: '链上确认中',
  success: '成功',
  failed: '失败',
  riskBlocked: '风控拦截',
  amlCheck: 'AML审核',
  manualReview: '人工复核',
  cancelled: '已取消',
};

const orderStatusLabels: Record<string, string> = {
  open: '未成交',
  filled: '已成交',
  partial: '部分成交',
  cancelled: '已撤销',
  rejected: '已拒绝',
  liquidated: '已强平',
};

const riskLevelLabels: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
  resolved: '已处理',
};

const labelMap: Record<StatusCategory, Record<string, string>> = {
  user: userStatusLabels,
  tx: txStatusLabels,
  order: orderStatusLabels,
  risk: riskLevelLabels,
};

// ==================== 颜色获取 ====================

function getStatusColor(category: StatusCategory, status: string): string {
  switch (category) {
    case 'user':
      return getUserStatusColor(status);
    case 'tx':
      return getTxStatusColor(status);
    case 'order':
      return getOrderStatusColor(status);
    case 'risk':
      return getRiskColor(status);
  }
}

// ==================== 尺寸 ====================

const sizeStyles: Record<StatusSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-1.5',
};

const dotSizes: Record<StatusSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2 h-2',
};

// ==================== 主组件 ====================

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      category,
      status,
      label,
      variant = 'soft',
      size = 'md',
      dot = true,
      className = '',
      ...props
    },
    ref,
  ) => {
    const color = getStatusColor(category, status);
    const displayLabel = label || labelMap[category][status] || status;

    // 计算各变体样式
    let currentStyle: React.CSSProperties = {};
    let dotStyle: React.CSSProperties = {};

    if (variant === 'soft') {
      // 柔和背景：背景色 10% 透明，文字=纯色
      // 通过 rgba 解析 HEX（支持 3/6 位）
      const rgba = hexToRgba(color, 0.12);
      currentStyle = {
        backgroundColor: rgba,
        color: color,
        border: '1px solid transparent',
      };
      dotStyle = { backgroundColor: color };
    } else if (variant === 'solid') {
      // 实心：白字 + 纯色背景
      currentStyle = {
        backgroundColor: color,
        color: '#FFFFFF',
        border: '1px solid transparent',
      };
      dotStyle = { backgroundColor: '#FFFFFF' };
    } else {
      // outline：透明背景 + 边框
      currentStyle = {
        backgroundColor: 'transparent',
        color: color,
        border: `1px solid ${color}`,
      };
      dotStyle = { backgroundColor: color };
    }

    const baseClasses = [
      'inline-flex items-center font-medium rounded-md whitespace-nowrap',
      'transition-colors duration-200',
      sizeStyles[size],
    ].join(' ');

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${className}`}
        style={currentStyle}
        {...props}
      >
        {dot && (
          <span
            className={`rounded-full inline-block shrink-0 ${dotSizes[size]}`}
            style={dotStyle}
            aria-hidden="true"
          />
        )}
        <span className="truncate">{displayLabel}</span>
      </span>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';

// ==================== 辅助函数 ====================

/** HEX 转 RGBA */
function hexToRgba(hex: string, alpha: number): string {
  // 去除 # 号
  let h = hex.replace('#', '');
  // 3 位简写转为 6 位
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default StatusBadge;
export {
  userStatusLabels,
  txStatusLabels,
  orderStatusLabels,
  riskLevelLabels,
  labelMap,
};
