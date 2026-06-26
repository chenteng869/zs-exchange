'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Space } from 'antd';
import {
  SecurityScanOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';

const securityEvents = [
  { id: '1', time: '2026-06-23 14:32:18', type: 'SQL注入攻击', sourceIP: '185.220.101.0', severity: 'high', status: 'blocked' },
  { id: '2', time: '2026-06-23 13:15:42', type: 'XSS跨站脚本', sourceIP: '45.33.32.156', severity: 'medium', status: 'blocked' },
  { id: '3', time: '2026-06-23 12:08:55', type: '暴力破解登录', sourceIP: '91.121.87.128', severity: 'high', status: 'blocked' },
  { id: '4', time: '2026-06-23 11:44:30', type: 'DDoS流量攻击', sourceIP: '104.248.51.0/24', severity: 'critical', status: 'mitigated' },
  { id: '5', time: '2026-06-23 10:22:11', type: '路径遍历尝试', sourceIP: '198.35.26.96', severity: 'medium', status: 'blocked' },
  { id: '6', time: '2026-06-23 09:56:03', type: 'CSRF伪造请求', sourceIP: '172.67.182.0', severity: 'low', status: 'monitored' },
  { id: '7', time: '2026-06-23 08:31:27', type: '命令注入探测', sourceIP: '51.159.4.0', severity: 'high', status: 'blocked' },
  { id: '8', time: '2026-06-23 07:15:49', type: '敏感文件扫描', sourceIP: '89.34.25.176', severity: 'low', status: 'blocked' },
  { id: '9', time: '2026-06-23 06:02:16', type: 'API速率异常', sourceIP: '140.82.48.0', severity: 'medium', status: 'monitored' },
  { id: '10', time: '2026-06-23 05:40:38', type: '恶意爬虫访问', sourceIP: '66.249.73.0', severity: 'low', status: 'blocked' },
];

const severityMap: Record<string, { color: string; label: string }> = {
  critical: { color: '#DC2626', label: '严重' },
  high:    { color: '#F59E0B', label: '高危' },
  medium:  { color: '#1677FF', label: '中危' },
  low:     { color: '#16A34A', label: '低危' },
};

const statusMap: Record<string, { color: string; label: string }> = {
  blocked:   { color: '#16A34A', label: '已拦截' },
  mitigated: { color: '#1677FF', label: '已缓解' },
  monitored: { color: '#F59E0B', label: '监控中' },
};

export default function SecurityDashboardPage() {
  const [events] = useState(securityEvents);

  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</span>
      ),
    },
    {
      title: '事件类型',
      dataIndex: 'type',
      key: 'type',
      width: 160,
    },
    {
      title: '来源IP',
      dataIndex: 'sourceIP',
      key: 'sourceIP',
      width: 170,
      render: (text: string) => (
        <code style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{text}</code>
      ),
    },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (val: string) => (
        <Tag color={severityMap[val]?.color}>{severityMap[val]?.label || val}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => (
        <Tag color={statusMap[val]?.color}>{statusMap[val]?.label || val}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" danger>处置</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
          <SecurityScanOutlined style={{ color: '#1677FF' }} />
          安全总览
        </h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日攻击数"
              value={2847}
              icon={<AlertOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="12.5%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="已拦截数"
              value={2791}
              icon={<SafetyCertificateOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="98.0%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="活跃规则数"
              value={156}
              icon={<SettingOutlined />}
              color="#1677FF"
              suffix="条"
              trend="none"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均响应时间"
              value={23}
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              suffix="ms"
              trend="down"
              trendValue="5.2%"
            />
          </Col>
        </Row>

        <Card title="安全事件列表" className="w-full">
          <Table
            columns={columns}
            dataSource={events}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 960 }}
            bordered
            size="middle"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
