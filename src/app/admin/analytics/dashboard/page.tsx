'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Space, Progress } from 'antd';
import {
  LineChartOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  WarningOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';

const analysisTasks = [
  { id: '1', name: '用户行为画像分析', dataSource: '用户行为日志', status: 'running', progress: 78, startTime: '2026-06-23 08:00:00', duration: '2h 15m' },
  { id: '2', name: '交易异常检测模型', dataSource: '交易流水表', status: 'completed', progress: 100, startTime: '2026-06-22 20:00:00', duration: '4h 32m' },
  { id: '3', name: '市场情绪趋势预测', dataSource: '社交媒体数据', status: 'pending', progress: 0, startTime: '-', duration: '-' },
  { id: '4', name: '资产关联网络分析', dataSource: '链上交易数据', status: 'running', progress: 45, startTime: '2026-06-23 10:30:00', duration: '1h 08m' },
  { id: '5', name: 'KYC合规风险评分', dataSource: '用户身份库', status: 'completed', progress: 100, startTime: '2026-06-21 09:00:00', duration: '3h 10m' },
  { id: '6', name: '流动性深度分析', dataSource: '订单簿快照', status: 'failed', progress: 62, startTime: '2026-06-23 07:00:00', duration: '0h 45m' },
  { id: '7', name: '做市商绩效评估', dataSource: '成交记录表', status: 'completed', progress: 100, startTime: '2026-06-20 14:00:00', duration: '5h 20m' },
  { id: '8', name: '智能合约漏洞扫描', dataSource: '合约字节码', status: 'running', progress: 33, startTime: '2026-06-23 11:00:00', duration: '0h 52m' },
  { id: '9', name: '跨链资产追踪分析', dataSource: '多链桥接日志', status: 'pending', progress: 0, startTime: '-', duration: '-' },
  { id: '10', name: '反洗钱规则引擎测试', dataSource: 'AML样本集', status: 'completed', progress: 100, startTime: '2026-06-19 16:00:00', duration: '2h 58m' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  running:   { color: '#1677FF', label: '运行中' },
  completed: { color: '#16A34A', label: '已完成' },
  pending:    { color: '#9CA3AF', label: '等待中' },
  failed:     { color: '#DC2626', label: '失败' },
};

export default function AnalyticsDashboardPage() {
  const [tasks] = useState(analysisTasks);

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '数据源',
      dataIndex: 'dataSource',
      key: 'dataSource',
      width: 160,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={statusConfig[val]?.color}>{statusConfig[val]?.label || val}</Tag>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (val: number) => (
        <Progress percent={val} size="small" strokeColor={val === 100 ? '#16A34A' : '#1677FF'} />
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 170,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</span>
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} style={{ color: '#1677FF' }}>启动</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
          <LineChartOutlined style={{ color: '#1677FF' }} />
          数据分析中心
        </h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="分析任务数"
              value={128}
              icon={<ThunderboltOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="8.3%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="数据源接入数"
              value={24}
              icon={<DatabaseOutlined />}
              color="#7C3AED"
              suffix="个"
              trend="up"
              trendValue="2"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="报告生成数"
              value={56}
              icon={<FileTextOutlined />}
              color="#16A34A"
              suffix="份"
              trend="up"
              trendValue="15.2%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="异常检出数"
              value={17}
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="3.1%"
            />
          </Col>
        </Row>

        <Card title="分析任务列表" className="w-full">
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1100 }}
            bordered
            size="middle"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
