'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Table, Button, Space } from 'antd';
import {
  SafetyCertificateOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';

const licenseList = [
  { id: '1', licenseNo: 'SEC-SG-2024-001', name: '证券交易牌照', jurisdiction: '新加坡', type: 'CMS License', expiryDate: '2027-03-15', status: 'active', auditStatus: 'normal' },
  { id: '2', licenseNo: 'DCEX-HK-2024-002', name: '数字资产交易所牌照', jurisdiction: '香港', type: 'VASP License', expiryDate: '2026-12-31', status: 'active', auditStatus: 'normal' },
  { id: '3', licenseNo: 'AML-EU-2024-003', name: '反洗钱合规牌照', jurisdiction: '欧盟', type: 'AML Registration', expiryDate: '2026-09-20', status: 'renewal_pending', auditStatus: 'warning' },
  { id: '4', licenseNo: 'PAY-US-2025-004', name: '支付服务牌照', jurisdiction: '美国', type: 'Money Transmitter', expiryDate: '2028-06-01', status: 'active', auditStatus: 'normal' },
  { id: '5', licenseNo: 'CUST-AU-2024-005', name: '托管服务牌照', jurisdiction: '澳大利亚', type: 'Custody License', expiryDate: '2026-08-15', status: 'renewal_pending', auditStatus: 'exception' },
  { id: '6', licenseNo: 'DEX-JP-2025-006', name: '去中心化交易所牌照', jurisdiction: '日本', type: 'Virtual Currency', expiryDate: '2029-04-30', status: 'active', auditStatus: 'normal' },
  { id: '7', licenseNo: 'STO-CH-2024-007', name: '证券型代币发行牌照', jurisdiction: '瑞士', type: 'STO License', expiryDate: '2027-01-20', status: 'active', auditStatus: 'normal' },
  { id: '8', licenseNo: 'TRAD-UK-2025-008', name: '多边交易设施牌照', jurisdiction: '英国', type: 'MTF License', expiryDate: '2026-11-10', status: 'renewal_pending', auditStatus: 'warning' },
  { id: '9', licenseNo: 'INV-DU-2024-009', name: '投资顾问牌照', jurisdiction: '迪拜', type: 'Investment Advisory', expiryDate: '2027-07-05', status: 'active', auditStatus: 'normal' },
  { id: '10', licenseNo: 'INS-MY-2025-010', name: '保险经纪牌照', jurisdiction: '马来西亚', type: 'Insurance Broker', expiryDate: '2026-10-25', status: 'suspended', auditStatus: 'exception' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  active:           { color: '#16A34A', label: '有效' },
  renewal_pending:  { color: '#F59E0B', label: '待续期' },
  suspended:        { color: '#DC2626', label: '暂停' },
  expired:          { color: '#9CA3AF', label: '已过期' },
};

const auditConfig: Record<string, { color: string; label: string }> = {
  normal:    { color: '#16A34A', label: '正常' },
  warning:   { color: '#F59E0B', label: '预警' },
  exception: { color: '#DC2626', label: '异常' },
};

export default function LicenseDashboardPage() {
  const [licenses] = useState(licenseList);

  const columns = [
    {
      title: '牌照编号',
      dataIndex: 'licenseNo',
      key: 'licenseNo',
      width: 180,
      render: (text: string) => (
        <code style={{ background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{text}</code>
      ),
    },
    {
      title: '牌照名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: '管辖法域',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
      width: 90,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '到期日',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{text}</span>
      ),
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
      title: '审计状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 100,
      render: (val: string) => (
        <Tag color={auditConfig[val]?.color}>{auditConfig[val]?.label || val}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<FileTextOutlined />}>审计</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0 flex items-center gap-2">
          <SafetyCertificateOutlined style={{ color: '#1677FF' }} />
          牌照管理中心
        </h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="牌照总数"
              value={18}
              icon={<IdcardOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="2"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="有效牌照"
              value={14}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="1"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="待续期"
              value={3}
              icon={<ExclamationCircleOutlined />}
              color="#F59E0B"
              trend="none"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="审计异常"
              value={2}
              icon={<AlertOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="1"
            />
          </Col>
        </Row>

        <Card title="牌照列表" className="w-full">
          <Table
            columns={columns}
            dataSource={licenses}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
            scroll={{ x: 1180 }}
            bordered
            size="middle"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
