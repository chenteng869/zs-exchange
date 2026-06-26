'use client';

import { Spin } from 'antd';

/**
 * Admin 全局 Loading 状态
 * 在路由切换期间显示，防止 Content 区域塌陷导致页面变形
 * Next.js 会自动在路由切换时显示/隐藏此组件
 */
export default function AdminLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 600,
        width: '100%',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ color: '#9CA3AF', marginTop: 16, fontSize: 14 }}>
          加载中...
        </p>
      </div>
    </div>
  );
}
