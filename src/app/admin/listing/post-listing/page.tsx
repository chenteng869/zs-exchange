'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, message, Typography, Card } from 'antd';
import {
  FileProtectOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
  RiseOutlined,
  EyeOutlined,
  EditOutlined,
  NotificationOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockCompanies = [
  { id: 'LIST-001', code: 'ZS001', name: '星链数字科技', sector: '区块链', marketCap: 5200000, listDate: '2025-03-15', lastDisclosure: '2026-06-20', status: 'normal' },
  { id: 'LIST-002', code: 'ZS002', name: '智算云网络', sector: 'AI云计算', marketCap: 3800000, listDate: '2025-04-22', lastDisclosure: '2026-06-18', status: 'normal' },
  { id: 'LIST-003', code: 'ZS003', name: '元宇宙娱乐', sector: '元宇宙', marketCap: 2900000, listDate: '2025-06-10', lastDisclosure: '2026-06-15', status: 'warning' },
  { id: 'LIST-004', code: 'ZS004', name: '游戏资产交易所', sector: '游戏', marketCap: 1800000, listDate: '2025-07-01', lastDisclosure: '2026-06-22', status: 'normal' },
  { id: 'LIST-005', code: 'ZS005', name: '绿色能源链', sector: '新能源', marketCap: 4500000, listDate: '2025-08-18', lastDisclosure: '2026-06-19', status: 'normal' },
  { id: 'LIST-006', code: 'ZS006', name: '医疗数据通', sector: '医疗健康', marketCap: 2100000, listDate: '2025-09-25', lastDisclosure: '2026-05-30', status: 'alert' },
  { id: 'LIST-007', code: 'ZS007', name: '供应链金融平台', sector: 'FinTech', marketCap: 3200000, listDate: '2025-10-12', lastDisclosure: '2026-06-21', status: 'normal' },
  { id: 'LIST-008', code: 'ZS008', name: '智能物流链', sector: '物流', marketCap: 1600000, listDate: '2025-11-08', lastDisclosure: '2026-06-17', status: 'normal' },
  { id: 'LIST-009', code: 'ZS009', name: '教育科技集团', sector: '在线教育', marketCap: 2700000, listDate: '2025-12-01', lastDisclosure: '2026-06-14', status: 'warning' },
  { id: 'LIST-010', code: 'ZS010', name: '数字版权中心', sector: '知识产权', marketCap: 1400000, listDate: '2026-01-20', lastDisclosure: '2026-06-22', status: 'normal' },
];

export default function ListingPostListingPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedCompany(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '公司代码',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span className="font-mono font-bold" style={{ color: '#1677FF' }}>{text}</span>,
    },
    {
      title: '公司名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '板块',
      dataIndex: 'sector',
      key: 'sector',
      render: (sec: string) => <Tag color="geekblue">{sec}</Tag>,
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      render: (val: number) => (
        <span className="font-medium">
          ${(val / 1000000).toFixed(2)}M
        </span>
      ),
      sorter: (a: any, b: any) => a.marketCap - b.marketCap,
    },
    {
      title: '上市日',
      dataIndex: 'listDate',
      key: 'listDate',
      render: (d: string) => <Text>{d}</Text>,
    },
    {
      title: '最后披露',
      dataIndex: 'lastDisclosure',
      key: 'lastDisclosure',
      render: (d: string) => {
        const days = Math.floor((new Date('2026-06-23').getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
        return days <= 3 ? <Text type="success">{d}</Text> : days > 30 ? <Text type="danger">{d} ({days}天前)</Text> : <Text>{d}</Text>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          normal: { color: 'success', text: '正常运营' },
          warning: { color: 'warning', text: '关注' },
          alert: { color: 'error', text: '合规警告' },
          suspended: { color: 'default', text: '停牌' },
        };
        const item = map[status];
        return item ? <Badge status={item.color as any} text={item.text} /> : status;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
    },
    {
      key: 'disclosure',
      label: '信披管理',
      icon: <NotificationOutlined />,
      type: 'link',
    },
    {
      key: 'ir',
      label: 'IR活动',
      icon: <TeamOutlined />,
      type: 'link',
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <FileProtectOutlined style={{ color: '#F0B90B' }} />
            上市后持续管理
          </h1>
          <p className="text-gray-500 mt-2">信披合规 · 投资者关系 · 定增回购 · 退市管理</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="已上市公司"
              value={28}
              icon={<RiseOutlined />}
              color="#1677FF"
              suffix="家"
              trend="up"
              trendValue="+3家"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="披露完成率"
              value={94.5}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+2.1%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="IR活动数"
              value={156}
              suffix="场"
              icon={<TeamOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+12场"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="股东总数"
              value={185600}
              suffix="人"
              icon={<TeamOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+8.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="合规警告"
              value={2}
              suffix="条"
              icon={<WarningOutlined />}
              color="#DC2626"
              description="需处理"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockCompanies}
          rowKey="id"
          title="已上市公司列表"
          searchPlaceholder="搜索公司代码/名称..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '正常运营', value: 'normal' },
            { label: '关注', value: 'warning' },
            { label: '合规警告', value: 'alert' },
          ]}
          actions={actions}
          onAdd={() => {}}
          addButtonText="新增记录"
        />

        {/* 详情Modal */}
        <Modal
          title="公司详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={560}
        >
          {selectedCompany && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">公司代码:</Text><br /><Text strong className="text-lg" style={{ color: '#1677FF' }}>{selectedCompany.code}</Text></Col>
                <Col span={12}><Text type="secondary">公司名称:</Text><br /><Text strong>{selectedCompany.name}</Text></Col>
                <Col span={12}><Text type="secondary">所属板块:</Text><br /><Tag color="geekblue">{selectedCompany.sector}</Tag></Col>
                <Col span={12}><Text type="secondary">总市值:</Text><br /><Text strong>${(selectedCompany.marketCap / 1000000).toFixed(2)}M</Text></Col>
                <Col span={12}><Text type="secondary">上市日期:</Text><br /><Text strong>{selectedCompany.listDate}</Text></Col>
                <Col span={12}><Text type="secondary">最后披露:</Text><br /><Text strong>{selectedCompany.lastDisclosure}</Text></Col>
                <Col span={24}><Text type="secondary">运营状态:</Text><br /><Badge status={selectedCompany.status === 'normal' ? 'success' : selectedCompany.status === 'warning' ? 'warning' : 'error'} text={selectedCompany.status === 'normal' ? '正常运营' : selectedCompany.status === 'warning' ? '关注' : '合规警告'} /></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
