'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Space } from 'antd';
import {
  ClusterOutlined,
  TeamOutlined,
  BankOutlined,
  ProjectOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';

const enterpriseList = [
  { id: '1', name: '中萨数字科技有限公司', regNumber: 'SG-2024-00128', type: 'SPV', industry: '金融科技', country: '新加坡', projects: 5, status: 'active', joinDate: '2024-03-15' },
  { id: '2', name: '萨摩亚国际控股集团', regNumber: 'WS-2024-00876', type: 'Enterprise', industry: '投资管理', country: '萨摩亚', projects: 3, status: 'active', joinDate: '2024-05-20' },
  { id: '3', name: '香港区块链创新中心', regNumber: 'HK-2025-00156', type: 'SPV', industry: '区块链', country: '香港', projects: 8, status: 'active', joinDate: '2025-01-10' },
  { id: '4', name: '阿联酋数字资产基金', regNumber: 'AE-2024-03342', type: 'Enterprise', industry: '资产管理', country: '阿联酋', projects: 2, status: 'reviewing', joinDate: '2025-04-08' },
  { id: '5', name: '瑞士加密对冲基金', regNumber: 'CH-2025-00789', type: 'Enterprise', industry: '量化交易', country: '瑞士', projects: 4, status: 'active', joinDate: '2025-02-28' },
  { id: '6', name: '马来西亚NFT交易平台', regNumber: 'MY-2025-02134', type: 'SPV', industry: 'NFT交易', country: '马来西亚', projects: 1, status: 'pending', joinDate: '2026-05-15' },
  { id: '7', name: '日本Web3孵化器株式会社', regNumber: 'JP-2024-04567', type: 'Enterprise',行业: '创业孵化', country: '日本', projects: 6, status: 'active', joinDate: '2024-11-20' },
  { id: '8', name: '澳大利亚DeFi实验室', regNumber: 'AU-2025-01998', type: 'SPV', industry: 'DeFi研发', country: '澳大利亚', projects: 3, status: 'active', joinDate: '2025-06-01' },
  { id: '9', name: '英国跨境支付解决方案公司', regNumber: 'GB-2025-01234', type: 'Enterprise', industry: '跨境支付', country: '英国', projects: 2, status: 'suspended', joinDate: '2025-03-18' },
  { id: '10', name: '开曼群岛信托管理公司', regNumber: 'KY-2024-06789', type: 'SPV', industry: '信托服务', country: '开曼群岛', projects: 4, status: 'active', joinDate: '2024-08-05' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  active:    { color: '#16A34A', label: '服务中' },
  reviewing: { color: '#1677FF', label: '审核中' },
  pending:   { color: '#F59E0B', label: '待激活' },
  suspended: { color: '#DC2626', label: '已暂停' },
};

export default function EnterpriseDashboardPage() {
  const [enterprises] = useState(enterpriseList);

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      width: 240,
    },
    {
      title: '注册编号',
      dataIndex: 'regNumber',
      key: 'regNumber',
      width: 160,
      render: (text: string) => (
        <code style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{text}</code>
      ),
    },
    {
      title: '企业类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (val: string) => (
        <Tag color={val === 'SPV' ? 'purple' : 'blue'}>{val === 'SPV' ? 'SPV公司' : '企业客户'}</Tag>
      ),
    },
    {
      title: '所属行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 110,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '注册地',
      dataIndex: 'country',
      key: 'country',
      width: 90,
    },
    {
      title: '服务项目数',
      dataIndex: 'projects',
      key: 'projects',
      width: 100,
      align: 'center' as const,
      render: (val: number) => (
        <Tag color={val >= 5 ? '#1677FF' : '#9CA3AF'}>{val} 个</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 95,
      render: (val: string) => (
        <Tag color={statusConfig[val]?.color}>{statusConfig[val]?.label || val}</Tag>
      ),
    },
    {
      title: '加入日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 115,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
          <ClusterOutlined style={{ color: '#1677FF' }} />
          企业管理中心
        </h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="企业客户总数"
              value={86}
              icon={<TeamOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="6"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="SPV公司数"
              value={34}
              icon={<BankOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="3"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="服务中项目数"
              value={152}
              icon={<ProjectOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="12"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="本月新增"
              value={6}
              icon={<PlusCircleOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="2"
            />
          </Col>
        </Row>

        <Card title="企业列表" className="w-full">
          <Table
            columns={columns}
            dataSource={enterprises}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1260 }}
            bordered
            size="middle"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
