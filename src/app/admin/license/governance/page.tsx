'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Avatar, Progress, Tree } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  BankOutlined,
  AuditOutlined,
  SettingOutlined,
  CrownOutlined,
  ApartmentOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface GovernanceFile {
  id: string;
  name: string;
  category: string;
  version: string;
  effectiveDate: string;
  status: 'active' | 'draft' | 'archived' | 'under-review';
  owner: string;
  lastUpdated: string;
}

const mockGovernanceFiles: GovernanceFile[] = [
  {
    id: '1',
    name: '公司治理章程',
    category: '章程文件',
    version: 'v3.2',
    effectiveDate: '2024-01-01',
    status: 'active',
    owner: '董事会秘书处',
    lastUpdated: '2024-03-15',
  },
  {
    id: '2',
    name: '合规管理制度汇编',
    category: '合规制度',
    version: 'v5.1',
    effectiveDate: '2024-02-01',
    status: 'active',
    owner: '首席合规官',
    lastUpdated: '2024-06-10',
  },
  {
    id: '3',
    name: '风险管理框架',
    category: '风控体系',
    version: 'v2.8',
    effectiveDate: '2024-01-15',
    status: 'active',
    owner: '首席风险官',
    lastUpdated: '2024-05-20',
  },
  {
    id: '4',
    name: '内部控制手册',
    category: '内控体系',
    version: 'v4.0',
    effectiveDate: '2024-03-01',
    status: 'active',
    owner: '内审部',
    lastUpdated: '2024-04-18',
  },
  {
    id: '5',
    name: '反洗钱(AML)政策',
    category: 'AML/CTF',
    version: 'v6.3',
    effectiveDate: '2024-04-01',
    status: 'under-review',
    owner: 'MLRO',
    lastUpdated: '2024-06-15',
  },
  {
    id: '6',
    name: '数据保护与隐私政策',
    category: '数据安全',
    version: 'v3.1',
    effectiveDate: '2024-05-01',
    status: 'active',
    owner: 'DPO',
    lastUpdated: '2024-05-28',
  },
  {
    id: '7',
    name: '利益冲突管理办法',
    category: '道德准则',
    version: 'v2.2',
    effectiveDate: '2023-12-01',
    status: 'active',
    owner: '道德委员会',
    lastUpdated: '2024-02-10',
  },
  {
    id: '8',
    name: '关联交易披露规则',
    category: '信息披露',
    version: 'v1.8',
    effectiveDate: '2024-01-20',
    status: 'draft',
    owner: '财务部',
    lastUpdated: '2024-06-01',
  },
];

const getStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '生效中' },
    draft: { color: 'default', text: '草案' },
    archived: { color: 'default', text: '已归档' },
    'under-review': { color: 'processing', text: '审核中' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    '章程文件': <SafetyCertificateOutlined />,
    '合规制度': <AuditOutlined />,
    '风控体系': <BankOutlined />,
    '内控体系': <SettingOutlined />,
    'AML/CTF': <ThunderboltOutlined />,
    '数据安全': <FileTextOutlined />,
    '道德准则': <CrownOutlined />,
    '信息披露': <EyeOutlined />,
  };
  return icons[category] || <FileTextOutlined />;
};

const orgTreeData = [
  {
    title: '董事会',
    key: 'board',
    icon: <CrownOutlined style={{ color: '#F0B90B' }} />,
    children: [
      {
        title: '审计委员会',
        key: 'audit-committee',
        icon: <AuditOutlined style={{ color: '#1677FF' }} />,
        children: [
          { title: '内部审计部 (3人)', key: 'internal-audit', icon: <UserOutlined /> },
          { title: '外部审计协调 (2人)', key: 'external-audit', icon: <UserOutlined /> },
        ],
      },
      {
        title: '风险委员会',
        key: 'risk-committee',
        icon: <BankOutlined style={{ color: '#DC2626' }} />,
        children: [
          { title: '首席风险官', key: 'cro', icon: <UserOutlined /> },
          { title: '风控团队 (5人)', key: 'risk-team', icon: <TeamOutlined /> },
        ],
      },
      {
        title: '合规委员会',
        key: 'compliance-committee',
        icon: <SafetyCertificateOutlined style={{ color: '#16A34A' }} />,
        children: [
          { title: '首席合规官', key: 'cco', icon: <UserOutlined /> },
          { title: '合规部 (8人)', key: 'compliance-team', icon: <TeamOutlined /> },
          { title: 'MLRO (反洗钱负责人)', key: 'mlro', icon: <UserOutlined /> },
        ],
      },
      {
        title: '提名与薪酬委员会',
        key: 'nomination-committee',
        icon: <TeamOutlined style={{ color: '#7C3AED' }} />,
        children: [
          { title: 'HR总监', key: 'hrd', icon: <UserOutlined /> },
          { title: '薪酬团队 (2人)', key: 'comp-team', icon: <TeamOutlined /> },
        ],
      },
    ],
  },
  {
    title: '执行管理层',
    key: 'executive',
    icon: <ApartmentOutlined style={{ color: '#1677FF' }} />,
    children: [
      {
        title: 'CEO办公室',
        key: 'ceo-office',
        icon: <CrownOutlined style={{ color: '#F59E0B' }} />,
        children: [
          { title: 'CEO', key: 'ceo', icon: <UserOutlined /> },
          { title: '首席运营官COO', key: 'coo', icon: <UserOutlined /> },
          { title: '首席技术官CTO', key: 'cto', icon: <UserOutlined /> },
          { title: '首席财务官CFO', key: 'cfo', icon: <UserOutlined /> },
        ],
      },
      {
        title: '各业务线负责人',
        key: 'business-heads',
        icon: <ApartmentOutlined />,
        children: [
          { title: '交易事业部', key: 'trading-bu', icon: <TeamOutlined /> },
          { title: '技术事业部', key: 'tech-bu', icon: <TeamOutlined /> },
          { title: '合规事业部', key: 'compliance-bu', icon: <TeamOutlined /> },
          { title: '运营事业部', key: 'ops-bu', icon: <TeamOutlined /> },
        ],
      },
    ],
  },
];

export default function LicenseGovernancePage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: GovernanceFile) =>
        console.log('查看文件:', record.name),
      hidden: () => false,
    },
  ];

  const columns = [
    {
      title: '文件名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: GovernanceFile) => (
        <Space>
          {getCategoryIcon(record.category)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '责任部门',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 120,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          治理结构管理
        </Title>
        <Text type="secondary">组织架构 · 制度体系 · 权责分明</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="治理文件"
            value={mockGovernanceFiles.length}
            icon={<FileTextOutlined />}
            color="#F0B90B"
            suffix="份"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="生效文件"
            value={mockGovernanceFiles.filter((f) => f.status === 'active').length}
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            suffix="份"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="审核中"
            value={mockGovernanceFiles.filter((f) => f.status === 'under-review').length}
            icon={<AuditOutlined />}
            color="#1677FF"
            suffix="份"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="治理层级"
            value="3级"
            icon={<ApartmentOutlined />}
            color="#7C3AED"
            description="董事会-委员会-部门"
          />
        </Col>
      </Row>

      {/* 组织架构展示 */}
      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#1677FF' }} />
            <Text strong>组织架构</Text>
          </Space>
        }
      >
        <Tree
          showIcon
          defaultExpandAll
          treeData={orgTreeData}
          style={{ fontSize: 14 }}
        />
      </Card>

      {/* 治理文件表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="治理文件库"
          columns={columns}
          dataSource={mockGovernanceFiles}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索文件名..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '生效中', value: 'active' },
            { label: '审核中', value: 'under-review' },
            { label: '草案', value: 'draft' },
            { label: '已归档', value: 'archived' },
          ]}
          addButtonText="新增文件"
          onAdd={() => console.log('新增治理文件')}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 份文件`,
          }}
        />
      </Card>

      {/* 治理原则卡片 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderTop: '3px solid #16A34A',
              textAlign: 'center',
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 28, color: '#16A34A', marginBottom: 8 }} />
            <Title level={5} style={{ marginTop: 8 }}>透明度</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              所有决策过程公开透明，确保利益相关方知情权
            </Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderTop: '3px solid #1677FF',
              textAlign: 'center',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 28, color: '#1677FF', marginBottom: 8 }} />
            <Title level={5} style={{ marginTop: 8 }}>问责制</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              明确权责边界，建立有效的监督和追责机制
            </Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            size="small"
            style={{
              borderRadius: 12,
              borderTop: '3px solid #F0B90B',
              textAlign: 'center',
            }}
          >
            <TeamOutlined style={{ fontSize: 28, color: '#F0B90B', marginBottom: 8 }} />
            <Title level={5} style={{ marginTop: 8 }}>制衡机制</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              董事会、管理层、监事层相互制约，防止权力集中
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
