'use client';

/**
 * 量化模块「开发中」占位页组件
 * 用于尚未完成开发的页面路由，避免404崩溃
 * 统一展示：页面标题 + 功能说明 + 开发进度 + 预计上线时间
 */

import { ToolOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

interface UnderConstructionProps {
  /** 页面名称（对应菜单title） */
  title: string;
  /** 所属菜单组 */
  group?: string;
  /** 功能描述 */
  description?: string;
  /** 预计开发阶段 */
  phase?: 'P0' | 'P1' | 'P2' | 'P3';
}

const phaseConfig = {
  P0: { color: '#1677FF', label: '核心功能 · 开发中', icon: <RocketOutlined /> },
  P1: { color: '#7C3AED', label: '差异化能力 · 规划中', icon: <ClockCircleOutlined /> },
  P2: { color: '#F59E0B', label: '高级功能 · 待排期', icon: <ClockCircleOutlined /> },
  P3: { color: '#6B7280', label: '生态壁垒 · 远期规划', icon: <ClockCircleOutlined /> },
};

export default function UnderConstruction({ title, group, description, phase = 'P1' }: UnderConstructionProps) {
  const config = phaseConfig[phase];

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
        {/* 图标区域 */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: `${config.color}15`, border: `2px dashed ${config.color}40` }}
        >
          <ToolOutlined style={{ fontSize: 40, color: config.color }} />
        </div>

        {/* 标题 */}
        <h1 className="text-3xl font-bold text-gray-100 mb-2">{title}</h1>
        {group && (
          <span
            className="text-sm px-3 py-1 rounded-full mb-4"
            style={{ background: `${config.color}20`, color: config.color }}
          >
            {group}
          </span>
        )}

        {/* 描述 */}
        {description && (
          <p className="text-gray-400 text-center max-w-lg mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {/* 进度卡片 */}
        <div
          className="w-full max-w-md rounded-xl p-6"
          style={{
            background: 'rgba(15, 24, 48, 0.6)',
            border: `1px solid rgba(148, 163, 184, 0.12)`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span style={{ color: config.color }}>{config.icon}</span>
            <span className="font-semibold" style={{ color: config.color }}>
              {config.label}
            </span>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: phase === 'P0' ? '60%' : phase === 'P1' ? '30%' : phase === 'P2' ? '10%' : '0%',
                background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-gray-500">
            <span>开发进度</span>
            <span>{phase === 'P0' ? '60%' : phase === 'P1' ? '30%' : phase === 'P2' ? '10%' : '0%'}</span>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-gray-600 text-sm mt-6">
          该页面正在开发中，敬请期待。
          <br />
          如有紧急需求，请联系技术团队。
        </p>
      </div>
    </AdminLayout>
  );
}
