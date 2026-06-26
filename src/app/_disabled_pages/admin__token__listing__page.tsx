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
  Steps,
  message,
  Typography,
  Descriptions,
  Timeline,
  Avatar,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ApproveOutlined,
  StopOutlined,
  FileSearchOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Option } = Select;
const { Title, Text } = Typography;

const mockListingApps = [
  { id: 'APP-001', token: 'AIOPC', tokenName: 'AIOPC Protocol', applicant: '中萨数字科技', submitTime: '2024-06-01 09:30', reviewer: '张审核员', status: 'approved', step: 4 },
  { id: 'APP-002', token: 'META3', tokenName: 'MetaVerse 3.0', applicant: '元宇宙工作室', submitTime: '2024-06-05 14:20', reviewer: '李审核员', status: 'reviewing', step: 2 },
  { id: 'APP-003', token: 'NFTFI', tokenName: 'NFT Finance', applicant: 'DeFi Labs', submitTime: '2024-06-08 11:00', reviewer: '王审核员', status: 'pending', step: 1 },
  { id: 'APP-004', token: 'WEB3H', tokenName: 'Web3 Hub', applicant: 'Web3 Foundation', submitTime: '2024-06-10 16:45', reviewer: '赵审核员', status: 'reviewing', step: 3 },
  { id: 'APP-005', token: 'YIELDA', tokenName: 'Yield Aggregator', applicant: 'Yield Protocol Inc.', submitTime: '2024-06-12 10:15', reviewer: '刘审核员', status: 'rejected', step: 2 },
  { id: 'APP-006', token: 'GAMEON', tokenName: 'GameOn Platform', applicant: 'GameFi Studio', submitTime: '2024-06-14 08:30', reviewer: '陈审核员', status: 'approved', step: 4 },
  { id: 'APP-007', token: 'SOCIAL', tokenName: 'SocialFi DAO', applicant: 'SocialDAO Org', submitTime: '2024-06-16 13:00', reviewer: '孙审核员', status: 'pending', step: 0 },
  { id: 'APP-008', token: 'CHAINX', tokenName: 'Chain X Network', applicant: 'ChainX Dev Team', submitTime: '2024-06-18 09:45', reviewer: '周审核员', status: 'approved', step: 4 },
  { id: 'APP-009', token: 'ORACLE', tokenName: 'Oracle Data Chain', applicant: 'OracleNet Ltd.', submitTime: '2024-06-19 15:30', reviewer: '吴审核员', status: 'reviewing', step: 2 },
  { id: 'APP-010', token: 'PRIVX', tokenName: 'Privacy Shield', applicant: 'PrivacyTech Co.', submitTime: '2024-06-20 11:20', reviewer: '郑审核员', status: 'approved', step: 4 },
  { id: 'APP-011', token: 'DEFI+', tokenName: 'DeFi Plus Protocol', applicant: 'DeFiPlus Team', submitTime: '2024-06-21 10:00', reviewer: '张审核员', status: 'pending', step: 1 },
  { id: 'APP-012', token: 'ZSDEX', tokenName: 'ZS Exchange Token', applicant: 'ZS Exchange', submitTime: '2024-06-22 14:30', reviewer: '李审核员', status: 'reviewing', step: 3 },
];

const appStatusConfig: Record<string, { color: string; label: string }> = {
  approved: { color: 'green', label: '已通过' },
  rejected: { color: 'red', label: '已拒绝' },
  reviewing: { color: 'blue', label: '审核中' },
  pending: { color: 'orange', label: '待审核' },
};

const reviewSteps = [
  { title: '材料初审', description: '基础资料完整性检查' },
  { title: '技术评估', description: '合约安全与性能审查' },
  { title: '合规审查', description: '法规与KYC/AML验证' },
  { title: '最终审批', description: '管理层决策确认' },
];

export default function TokenListingPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const pendingCount = mockListingApps.filter((a) => a.status === 'pending').length;
  const approvedCount = mockListingApps.filter((a) => a.status === 'approved').length;
  const rejectedCount = mockListingApps.filter((a) => a.status === 'rejected').length;
  const weeklyProcessed = 28;
  const avgReviewTime = '2.3天';

  const columns = [
    {
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '代币',
      dataIndex: 'token',
      key: 'token',
      render: (_: any, record: any) => (
        <Space>
          <Tag color="gold">{record.token}</Tag>
          <span className="text-sm text-gray-500">{record.tokenName}</span>
        </Space>
      ),
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
    },
    {
      title: '审核员',
      dataIndex: 'reviewer',
      key: 'reviewer',
      render: (text: string) => (
        <Space size={4}>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1677FF' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = appStatusConfig[status];
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
        setDetailModalOpen(true);
      },
    },
    {
      key: 'approve',
      label: '通过',
      icon: <CheckCircleOutlined />,
      type: 'link' as const,
      hidden: (r: any) => r.status !== 'reviewing' && r.status !== 'pending',
      confirm: {
        title: '确认通过该申请？',
        onConfirm: (record: any) => message.success(`已通过 ${record.token}`),
      },
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <CloseCircleOutlined />,
      type: 'link' as const,
      danger: true,
      hidden: (r: any) => r.status !== 'reviewing' && r.status !== 'pending',
      confirm: {
        title: '确认拒绝该申请？',
        onConfirm: (record: any) => message.warning(`已拒绝 ${record.token}`),
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Title level={2} className="m-0 flex items-center gap-3">
            <AuditOutlined style={{ color: '#F0B90B' }} />
            代币上架审核
          </Title>
          <Text type="secondary" className="mt-2 block">
            代币上架申请的全流程审核管理 · 材料初审{'→'}技术评估{'→'}合规审查{'→'}最终审批
          </Text>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="待审核" value={pendingCount} icon={<ClockCircleOutlined />} color="#F59E0B" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="已通过" value={approvedCount} icon={<CheckCircleOutlined />} color="#16A34A" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="已拒绝" value={rejectedCount} icon={<CloseCircleOutlined />} color="#DC2626" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="本周处理量" value={weeklyProcessed} icon={<FileSearchOutlined />} color="#7C3AED" suffix="件" />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard title="平均审核时长" value={avgReviewTime} icon={<FieldTimeOutlined />} color="#1677FF" />
          </Col>
        </Row>

        {/* 审核流程 Steps 展示 */}
        <Card title="标准审核流程" className="mb-6">
          <Steps current={-1} items={reviewSteps.map((s, i) => ({
            title: s.title,
            description: s.description,
            icon: i === 0 ? <FileSearchOutlined /> : i === 1 ? <TeamOutlined /> : i === 2 ? <SafetyCertificateOutlined /> : <ApproveOutlined />,
          }))} />
        </Card>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockListingApps}
          title="上架申请列表"
          showSearch
          searchPlaceholder="搜索申请ID或代币..."
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 详情 Modal */}
        <Modal
          title={`申请详情 · ${currentRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            currentRecord?.status === 'reviewing' || currentRecord?.status === 'pending' ? (
              <Button key="reject" danger icon={<StopOutlined />}>拒绝</Button>
            ) : null,
            currentRecord?.status === 'reviewing' || currentRecord?.status === 'pending' ? (
              <Button key="approve" type="primary" icon={<CheckCircleOutlined />}>通过</Button>
            ) : null,
          ]}
          width={700}
        >
          {currentRecord && (
            <div className="mt-4 space-y-6">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="申请ID">{currentRecord.id}</Descriptions.Item>
                <Descriptions.Item label="代币符号"><Tag color="gold">{currentRecord.token}</Tag></Descriptions.Item>
                <Descriptions.Item label="项目名称">{currentRecord.tokenName}</Descriptions.Item>
                <Descriptions.Item label="申请人">{currentRecord.applicant}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{currentRecord.submitTime}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={appStatusConfig[currentRecord.status]?.color}>{appStatusConfig[currentRecord.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="负责审核员">{currentRecord.reviewer}</Descriptions.Item>
                <Descriptions.Item label="当前阶段">第{currentRecord.step + 1}步 / 共4步</Descriptions.Item>
              </Descriptions>

              <div>
                <Text strong>审核进度</Text>
                <div className="mt-3">
                  <Steps
                    current={currentRecord.step}
                    size="small"
                    direction="vertical"
                    items={reviewSteps.map((s) => ({ title: s.title, description: s.description }))}
                  />
                </div>
              </div>

              <div>
                <Text strong>操作日志</Text>
                <Timeline
                  className="mt-3"
                  items={[
                    { children: `${currentRecord.submitTime} 提交上架申请`, color: 'green' },
                    ...(currentRecord.step >= 1 ? [{ children: '材料初审通过', color: 'green' }] : []),
                    ...(currentRecord.step >= 2 ? [{ children: '技术评估完成', color: 'blue' }] : []),
                    ...(currentRecord.step >= 3 ? [{ children: '合规审查进行中...', color: 'orange' }] : []),
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
