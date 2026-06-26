'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Avatar,
  Progress,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  EditOutlined,
  PhoneOutlined,
  MailOutlined,
  DollarOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  CrownOutlined,
  GoldOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Option } = Select;
const { Title, Text } = Typography;

const mockCustomers = [
  { id: 'CRM-001', name: '中萨数字科技集团', contact: '张总', level: 'Platinum', aum: '$12,500,000', lastActive: '2024-06-23 09:15', status: 'active', email: 'zhang@zs-digital.com' },
  { id: 'CRM-002', name: 'MetaVerse Ventures Ltd.', contact: '李经理', level: 'Gold', aum: '$8,200,000', lastActive: '2024-06-22 16:30', status: 'active', email: 'li@metaverse.vc' },
  { id: 'CRM-003', name: 'DeFi Protocol Foundation', contact: '王理事', level: 'Gold', aum: '$6,800,000', lastActive: '2024-06-21 14:00', status: 'active', email: 'wang@defi-fund.org' },
  { id: 'CRM-004', name: 'ChainX Technology Pte Ltd', contact: '陈CTO', level: 'Silver', aum: '$3,400,000', lastActive: '2024-06-20 11:20', status: 'active', email: 'chen@chainx.tech' },
  { id: 'CRM-005', name: 'OracleNet Solutions AG', contact: '吴CEO', level: 'Platinum', aum: '$15,600,000', lastActive: '2024-06-23 08:45', status: 'active', email: 'wu@oraclenet.ch' },
  { id: 'CRM-006', name: 'GameOn Studios Ltd', contact: '周制作人', level: 'Silver', aum: '$2,100,000', lastActive: '2024-06-18 17:30', status: 'inactive', email: 'zhou@gameon.mt' },
  { id: 'CRM-007', name: 'Yield Protocol LLC', contact: '孙创始人', level: 'Gold', aum: '$5,500,000', lastActive: '2024-06-22 10:00', status: 'active', email: 'sun@yieldprotocol.llc' },
  { id: 'CRM-008', name: 'Web3 Hub Limited', contact: '赵顾问', level: 'Standard', aum: '$980,000', lastActive: '2024-06-15 13:20', status: 'inactive', email: 'zhao@web3hub.ae' },
  { id: 'CRM-009', name: 'PrivacyTech Inc.', contact: '郑CPO', level: 'Silver', aum: '$2,800,000', lastActive: '2024-06-21 16:50', status: 'active', email: 'zheng@privacytech.io' },
  { id: 'CRM-010', name: 'QuantEdge Trading Ltd', contact: '钱合伙人', level: 'Gold', aum: '$7,300,000', lastActive: '2024-06-23 07:30', status: 'active', email: 'qian@quantedge.uk' },
  { id: 'CRM-011', name: 'SocialDAO Association', contact: '吴主席', level: 'Standard', aum: '$650,000', lastActive: '2024-06-19 09:10', status: 'inactive', email: 'wu@socialdao.ch' },
  { id: 'CRM-012', name: 'NFT Finance Corp', contact: '刘总监', level: 'Silver', aum: '$1,900,000', lastActive: '2024-06-22 14:40', status: 'active', email: 'liu@nftfi.finance' },
];

const levelConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  Platinum: { color: '#7C3AED', label: '白金', icon: <CrownOutlined /> },
  Gold: { color: '#F0B90B', label: '黄金', icon: <GoldOutlined /> },
  Silver: { color: '#9CA3AF', label: '白银', icon: <RiseOutlined /> },
  Standard: { color: '#1677FF', label: '标准', icon: <UserOutlined /> },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '活跃' },
  inactive: { color: 'default', label: '不活跃' },
  suspended: { color: 'red', label: '已暂停' },
};

export default function EnterpriseCustomersPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter((c) => c.status === 'active').length;
  const newThisMonth = 3;
  const totalAUM = '$67.73M';
  const retentionRate = '89.2%';

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      render: (_: any, record: any) => (
        <Space size={4}>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677FF' }} />
          <span>{record.contact}</span>
        </Space>
      ),
    },
    {
      title: '客户级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const config = levelConfig[level];
        return config ? (
          <Tag color={config.color} icon={config.icon}>{config.label}</Tag>
        ) : <Tag>{level}</Tag>;
      },
    },
    {
      title: 'AUM(资产管理规模)',
      dataIndex: 'aum',
      key: 'aum',
      render: (val: string) => <span className="font-semibold text-green-600">{val}</span>,
    },
    {
      title: '最后活跃时间',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (time: string) => (
        <Space size={4}>
          <FieldTimeOutlined style={{ color: '#9CA3AF' }} />
          <span>{time}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: any) => {
        setCurrentRecord(record);
        setDetailOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: (record: any) => message.info(`编辑 ${record.name}`),
    },
    {
      key: 'contact',
      label: '联系',
      icon: <PhoneOutlined />,
      type: 'link' as const,
      onClick: (record: any) => message.success(`已向 ${record.contact} 发送联系请求`),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="m-0 flex items-center gap-3">
              <TeamOutlined style={{ color: '#F0B90B' }} />
              企业客户CRM
            </Title>
            <Text type="secondary" className="mt-2 block">
              企业客户关系管理 · AUM追踪 · 留存分析 · 分级服务
            </Text>
          </div>
          <Button type="primary" icon={<UserOutlined />}>添加客户</Button>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="客户总数" value={totalCustomers} icon={<TeamOutlined />} color="#1677FF" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="活跃客户" value={activeCustomers} icon={<CheckCircleOutlined />} color="#16A34A" suffix={`/${totalCustomers}`} />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="本月新增" value={newThisMonth} icon={<ThunderboltOutlined />} color="#F59E0B" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="总AUM" value={totalAUM} icon={<DollarOutlined />} color="#F0B90B" />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard title="留存率" value={retentionRate} icon={<HeartOutlined />} color="#7C3AED" />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockCustomers}
          title="企业客户列表"
          showSearch
          searchPlaceholder="搜索企业名称或联系人..."
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '白金', value: 'Platinum' },
            { label: '黄金', value: 'Gold' },
            { label: '白银', value: 'Silver' },
            { label: '标准', value: 'Standard' },
          ]}
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 客户详情 Modal */}
        <Modal
          title={`客户详情 · ${currentRecord?.name || ''}`}
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={[
            <Button key="contact" icon={<PhoneOutlined />}>联系客户</Button>,
            <Button key="edit" icon={<EditOutlined />}>编辑信息</Button>,
            <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
          ]}
          width={680}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              {/* 客户头部信息 */}
              <Card size="small" className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-4">
                  <Avatar size={56} icon={<TeamOutlined />} style={{ backgroundColor: '#1677FF', fontSize: 28 }} />
                  <div className="flex-1">
                    <Title level={4} className="m-0">{currentRecord.name}</Title>
                    <Space className="mt-1">
                      <Tag color={levelConfig[currentRecord.level]?.color} icon={levelConfig[currentRecord.level]?.icon}>
                        {levelConfig[currentRecord.level]?.label}级客户
                      </Tag>
                      <Tag color={statusConfig[currentRecord.status]?.color}>{statusConfig[currentRecord.status]?.label}</Tag>
                    </Space>
                  </div>
                  <div className="text-right">
                    <Text type="secondary">AUM</Text>
                    <div className="text-xl font-bold text-green-600">{currentRecord.aum}</div>
                  </div>
                </div>
              </Card>

              {/* 联系方式 */}
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small">
                    <Space><MailOutlined /><Text strong>联系邮箱</Text></Space>
                    <div className="mt-1"><Text copyable>{currentRecord.email}</Text></div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Space><PhoneOutlined /><Text strong>主要联系人</Text></Space>
                    <div className="mt-1"><Text>{currentRecord.contact}</Text></div>
                  </Card>
                </Col>
              </Row>

              {/* 活跃度指标 */}
              <div>
                <Text strong>活跃度评分</Text>
                <Progress
                  percent={currentRecord.status === 'active' ? 85 : 35}
                  strokeColor={currentRecord.status === 'active' ? '#16A34A' : '#9CA3AF'}
                  className="mt-2"
                />
              </div>

              {/* 服务记录预览 */}
              <div>
                <Text strong>最近交互</Text>
                <div className="mt-2 space-y-2">
                  {[
                    { action: '查看IPO咨询方案', time: currentRecord.lastActive },
                    { action: '下载合规审计报告', time: '2024-06-20 11:30' },
                    { action: '更新代币发行需求', time: '2024-06-18 09:15' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span>{item.action}</span>
                      <Text type="secondary">{item.time}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
