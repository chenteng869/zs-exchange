'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Space } from 'antd';
import {
  DollarCircleOutlined,
  FolderOpenOutlined,
  CloudServerOutlined,
  RiseOutlined,
  AuditOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';

const tokenProjects = [
  { id: '1', name: 'ZS Exchange Token', symbol: 'ZSET', chain: 'Ethereum', totalSupply: '100,000,000', status: 'deployed', deployDate: '2026-03-15' },
  { id: '2', name: 'StableCoin USD+', symbol: 'USDP', chain: 'BSC', totalSupply: '50,000,000', status: 'listing_pending', deployDate: '2026-04-20' },
  { id: '3', name: 'Governance Token', symbol: 'GOVT', chain: 'Polygon', totalSupply: '200,000,000', status: 'compliance_review', deployDate: '2026-05-01' },
  { id: '4', name: 'Reward Token V2', symbol: 'RWDV2', chain: 'Arbitrum', totalSupply: '500,000,000', status: 'deployed', deployDate: '2026-02-28' },
  { id: '5', name: 'NFT Marketplace Token', symbol: 'NMKT', chain: 'Optimism', totalSupply: '80,000,000', status: 'listing_pending', deployDate: '2026-05-10' },
  { id: '6', name: 'DeFi Lending Token', symbol: 'DLND', chain: 'Avalanche', totalSupply: '300,000,000', status: 'compliance_review', deployDate: '2026-05-18' },
  { id: '7', name: 'Cross-chain Bridge Token', symbol: 'CBRG', chain: 'Multichain', totalSupply: '150,000,000', status: 'deployed', deployDate: '2026-01-10' },
  { id: '8', name: 'AI Computing Token', symbol: 'AICT', chain: 'Solana', totalSupply: '1,000,000,000', status: 'design', deployDate: '-' },
  { id: '9', name: 'Identity Verification Token', symbol: 'IDVT', chain: 'Ethereum', totalSupply: '60,000,000', status: 'deployed', deployDate: '2026-04-05' },
  { id: '10', name: 'Carbon Credit Token', symbol: 'CRDT', chain: 'Polygon', totalSupply: '400,000,000', status: 'listing_pending', deployDate: '2026-06-01' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  design:             { color: '#9CA3AF', label: '设计中' },
  deployed:           { color: '#16A34A', label: '已部署' },
  listing_pending:    { color: '#1677FF', label: '上市申请中' },
  compliance_review:  { color: '#F59E0B', label: '合规审核中' },
};

export default function TokenDashboardPage() {
  const [projects] = useState(tokenProjects);

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '代币符号',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 110,
      render: (text: string) => (
        <Tag color="purple" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{text}</Tag>
      ),
    },
    {
      title: '部署链',
      dataIndex: 'chain',
      key: 'chain',
      width: 120,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '总供应量',
      dataIndex: 'totalSupply',
      key: 'totalSupply',
      width: 160,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (val: string) => (
        <Tag color={statusConfig[val]?.color}>{statusConfig[val]?.label || val}</Tag>
      ),
    },
    {
      title: '部署日期',
      dataIndex: 'deployDate',
      key: 'deployDate',
      width: 120,
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
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
          <DollarCircleOutlined style={{ color: '#1677FF' }} />
          代币发行管理
        </h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="代币项目总数"
              value={38}
              icon={<FolderOpenOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="4"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="已部署数量"
              value={24}
              icon={<CloudServerOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="2"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="上市申请中"
              value={8}
              icon={<RiseOutlined />}
              color="#1677FF"
              trend="none"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="合规审核中"
              value={6}
              icon={<AuditOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="1"
            />
          </Col>
        </Row>

        <Card title="代币项目列表" className="w-full">
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1080 }}
            bordered
            size="middle"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
