'use client';

import React from 'react';
import { Row, Col, Tag, Badge, Typography, Card, Steps, Progress, Space } from 'antd';
import {
  AppstoreOutlined,
  SearchOutlined,
  AuditOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Title } = Typography;

const mockProjects = [
  { id: 'IPO-001', companyName: '星链数字科技', industry: '区块链', stage: 'review', progress: 75, manager: '张伟', estimatedDate: '2026-08-15', status: 'active' },
  { id: 'IPO-002', companyName: '智算云网络', industry: 'AI云计算', stage: 'due_diligence', progress: 45, manager: '李娜', estimatedDate: '2026-09-20', status: 'active' },
  { id: 'IPO-003', companyName: '量子金融实验室', industry: '量化交易', stage: 'screening', progress: 20, manager: '王强', estimatedDate: '2026-10-30', status: 'active' },
  { id: 'IPO-004', companyName: '元宇宙娱乐', industry: '元宇宙', stage: 'filing', progress: 90, manager: '赵敏', estimatedDate: '2026-07-28', status: 'active' },
  { id: 'IPO-005', companyName: '绿色能源链', industry: '新能源', stage: 'due_diligence', progress: 55, manager: '刘洋', estimatedDate: '2026-09-10', status: 'active' },
  { id: 'IPO-006', companyName: '医疗数据通', industry: '医疗健康', stage: 'review', progress: 70, manager: '陈静', estimatedDate: '2026-08-25', status: 'paused' },
  { id: 'IPO-007', companyName: '供应链金融平台', industry: 'FinTech', stage: 'screening', progress: 15, manager: '周杰', estimatedDate: '2026-11-15', status: 'active' },
  { id: 'IPO-008', companyName: '游戏资产交易所', industry: '游戏', stage: 'listing', progress: 98, manager: '吴芳', estimatedDate: '2026-07-01', status: 'active' },
  { id: 'IPO-009', companyName: '智能物流链', industry: '物流', stage: 'due_diligence', progress: 35, manager: '郑凯', estimatedDate: '2026-10-05', status: 'active' },
  { id: 'IPO-010', companyName: '教育科技集团', industry: '在线教育', stage: 'review', progress: 80, manager: '孙丽', estimatedDate: '2026-08-08', status: 'active' },
  { id: 'IPO-011', companyName: '农业溯源系统', industry: '农业科技', stage: 'screening', progress: 10, manager: '钱进', estimatedDate: '2026-12-01', status: 'pending' },
  { id: 'IPO-012', companyName: '数字版权中心', industry: '知识产权', stage: 'filing', progress: 88, manager: '冯雪', estimatedDate: '2026-07-20', status: 'active' },
];

export default function ListingPipelinePage() {
  const columns = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (ind: string) => <Tag color="blue">{ind}</Tag>,
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const map: Record<string, { color: string; text: string }> = {
          screening: { color: 'default', text: '项目筛选' },
          due_diligence: { color: 'processing', text: '尽调中' },
          review: { color: 'warning', text: '申报审核' },
          filing: { color: 'cyan', text: '过会挂牌' },
          listing: { color: 'success', text: '已上市' },
        };
        const item = map[stage];
        return item ? <Badge status={item.color as any} text={item.text} /> : stage;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          style={{ width: 120 }}
          status={val >= 95 ? 'success' : val >= 60 ? 'active' : 'normal'}
        />
      ),
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
      render: (text: string) => (
        <Space><UserOutlined />{text}</Space>
      ),
    },
    {
      title: '预计时间',
      dataIndex: 'estimatedDate',
      key: 'estimatedDate',
      render: (text: string) => (
        <Space><CalendarOutlined /><Text>{text}</Text></Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '推进中' },
          paused: { color: 'warning', text: '暂停' },
          pending: { color: 'default', text: '待启动' },
          completed: { color: 'cyan', text: '已完成' },
        };
        const item = map[s];
        return <Tag color={item?.color}>{item?.text}</Tag>;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
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
            <AppstoreOutlined style={{ color: '#F0B90B' }} />
            IPO上市通道管道
          </h1>
          <p className="text-gray-500 mt-2">项目筛选 → 尽调 → 申报 → 审核 → 挂牌 全流程可视</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="管道项目"
              value={48}
              icon={<AppstoreOutlined />}
              color="#1677FF"
              suffix="个"
              trend="up"
              trendValue="+5.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="尽调中"
              value={12}
              icon={<SearchOutlined />}
              color="#7C3AED"
              suffix="个"
              description="平均耗时 45 天"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="申报中"
              value={8}
              icon={<FileTextOutlined />}
              color="#F59E0B"
              suffix="个"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="过会率"
              value={87.5}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+3.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="平均周期"
              value={168}
              suffix="天"
              icon={<CalendarOutlined />}
              color="#06B6D4"
              description="筛选至挂牌"
            />
          </Col>
        </Row>

        {/* Steps 流程展示 */}
        <Card title="IPO标准流程" style={{ borderRadius: 12 }}>
          <Steps
            current={2}
            items={[
              { title: '项目筛选', description: '初步评估与准入', icon: <SearchOutlined />, status: 'finish' },
              { title: '尽职调查', description: '财务/法务/业务', icon: <AuditOutlined />, status: 'process' },
              { title: '申报材料', description: '招股书/审计报告', icon: <FileTextOutlined />, status: 'process' },
              { title: '审核过会', description: '监管审核/问询回复', icon: <CheckCircleOutlined />, status: 'wait' },
              { title: '挂牌上市', description: '路演/定价/交易', icon: <RocketOutlined />, status: 'wait' },
            ]}
          />
        </Card>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockProjects}
          rowKey="id"
          title="项目管道列表"
          searchPlaceholder="搜索企业名称..."
          showFilter
          filterOptions={[
            { label: '全部阶段', value: '' },
            { label: '项目筛选', value: 'screening' },
            { label: '尽调中', value: 'due_diligence' },
            { label: '申报审核', value: 'review' },
            { label: '过会挂牌', value: 'filing' },
            { label: '已上市', value: 'listing' },
          ]}
          actions={actions}
          onAdd={() => {}}
          addButtonText="添加项目"
        />
      </div>
    </AdminLayout>
  );
}
