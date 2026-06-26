'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Button, Modal, Descriptions, Divider, Badge, Avatar } from 'antd';
import {
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  StarOutlined,
  WalletOutlined,
  EyeOutlined,
  EditOutlined,
  ExportOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  GoldOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 成员列表
const memberData = [
  { id: 'MBR-001', name: '张明远', enterprise: '萨摩亚数字资产控股', role: '核心合伙人', joinDate: '2024-01-15', aiopcLevel: 'S级', equityRatio: '15.0%', assets: '¥2.8亿', status: 'active' },
  { id: 'MBR-002', name: '李思涵', enterprise: '链上科技(新加坡)', role: '技术总监', joinDate: '2024-02-20', aiopcLevel: 'A级', equityRatio: '8.5%', assets: '¥1.5亿', status: 'active' },
  { id: 'MBR-003', name: '王浩然', enterprise: 'AIOPC智能合约实验室', role: '首席审计师', joinDate: '2024-03-10', aiopcLevel: 'S级', equityRatio: '12.0%', assets: '¥2.1亿', status: 'active' },
  { id: 'MBR-004', name: '陈雨桐', enterprise: '中萨跨境支付中心', role: '运营VP', joinDate: '2024-04-05', aiopcLevel: 'B级', equityRatio: '6.0%', assets: '¥9,800万', status: 'pending' },
  { id: 'MBR-005', name: '刘子轩', enterprise: 'Web3孵化器亚太总部', role: '投资经理', joinDate: '2024-03-28', aiopcLevel: 'A级', equityRatio: '7.2%', assets: '¥1.2亿', status: 'active' },
  { id: 'MBR-006', name: '赵雅琪', enterprise: '代币经济研究院', role: '研究员', joinDate: '2024-05-18', aiopcLevel: 'B级', equityRatio: '4.5%', assets: '¥6,500万', status: 'active' },
  { id: 'MBR-007', name: '孙博文', enterprise: '合规托管服务公司', role: '合规官', joinDate: '2024-02-14', aiopcLevel: 'S级', equityRatio: '10.5%', assets: '¥1.9亿', status: 'active' },
  { id: 'MBR-008', name: '周梦瑶', enterprise: 'DCF估值模型中心', role: '估值分析师', joinDate: '2024-06-22', aiopcLevel: 'C级', equityRatio: '3.0%', assets: '¥4,200万', status: 'pending' },
  { id: 'MBR-009', name: '吴天成', enterprise: '链上数据分析平台', role: '数据科学家', joinDate: '2024-04-30', aiopcLevel: 'A级', equityRatio: '6.8%', assets: '¥1.1亿', status: 'active' },
  { id: 'MBR-010', name: '郑欣怡', enterprise: 'SPV架构设计事务所', role: '法律顾问', joinDate: '2024-07-08', aiopcLevel: 'B级', equityRatio: '5.5%', assets: '¥8,800万', status: 'inactive' },
  { id: 'MBR-011', name: '黄俊杰', enterprise: '税务优化咨询集团', role: '税务专家', joinDate: '2024-03-05', aiopcLevel: 'A级', equityRatio: '7.8%', assets: '¥1.35亿', status: 'active' },
  { id: 'MBR-012', name: '林诗涵', enterprise: '全球复制方案中心', role: '战略总监', joinDate: '2024-08-12', aiopcLevel: 'B级', equityRatio: '3.2%', assets: '¥5,600万', status: 'pending' },
];

export default function AiopcMembersPage() {
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedMember(record);
    setDetailModalOpen(true);
  };

  const getAiopcLevelTag = (level: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      'S级': { color: '#F0B90B', icon: <CrownOutlined /> },
      'A级': { color: '#1677FF', icon: <StarOutlined /> },
      'B级': { color: '#16A34A', icon: <ThunderboltOutlined /> },
      'C级': { color: '#9CA3AF', icon: <SafetyCertificateOutlined /> },
    };
    const item = map[level] || { color: 'default', icon: null };
    return (
      <Tag color={item.color} style={{ fontWeight: 600 }}>
        <Space size={4}>
          {item.icon}
          {level}
        </Space>
      </Tag>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge status="success" text="已入驻" />;
    if (status === 'pending') return <Badge status="processing" text="审核中" />;
    return <Badge status="default" text="未激活" />;
  };

  const getRoleColor = (role: string) => {
    if (role.includes('核心') || role.includes('首席')) return '#F0B90B';
    if (role.includes('总监') || role.includes('VP')) return '#1677FF';
    if (role.includes('经理') || role.includes('顾问')) return '#16A34A';
    return '#666';
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: handleViewDetail,
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('编辑:', record.name),
    },
    {
      key: 'export',
      label: '导出报告',
      icon: <ExportOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('导出:', record.name),
    },
  ];

  const columns = [
    {
      title: '成员ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '名称/企业',
      key: 'nameEnterprise',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size="small" style={{ background: record.aiopcLevel === 'S级' ? '#F0B90B' : '#1677FF' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ color: '#0F1B3D' }}>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.enterprise}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: string) => (
        <Tag style={{ color: getRoleColor(text), borderColor: getRoleColor(text) }}>{text}</Tag>
      ),
    },
    {
      title: '入驻日期',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a: any, b: any) => a.joinDate.localeCompare(b.joinDate),
    },
    {
      title: 'AIOPC等级',
      dataIndex: 'aiopcLevel',
      key: 'aiopcLevel',
      render: (level: string) => getAiopcLevelTag(level),
      filters: [
        { text: 'S级', value: 'S级' },
        { text: 'A级', value: 'A级' },
        { text: 'B级', value: 'B级' },
        { text: 'C级', value: 'C级' },
      ],
      onFilter: (value: any, record: any) => record.aiopcLevel === value,
    },
    {
      title: '权益比例',
      dataIndex: 'equityRatio',
      key: 'equityRatio',
      render: (text: string) => <Text strong style={{ color: '#F0B90B' }}>{text}</Text>,
      sorter: (a: any, b: any) =>
        parseFloat(a.equityRatio) - parseFloat(b.equityRatio),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F1B3D 0%, #1a2d5c 100%)',
          borderRadius: 16,
          padding: '32px 40px',
          color: '#fff',
        }}
      >
        <Space align="center">
          <TeamOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              园区成员管理中心
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              成员入驻审核 · 权益分配 · 分润结算 · 退出机制
            </Text>
          </div>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Tag color="#F0B90B" style={{ border: 'none', color: '#0F1B3D', fontWeight: 600 }}>AIOPC生态</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>权益通证</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>分润机制</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>DAO治理</Tag>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={5}>
          <DataCard
            title="申请待审"
            value={18}
            suffix="人"
            icon={<ClockCircleOutlined />}
            color="#F59E0B"
            trend="down"
            trendValue="-3"
            description="等待审核处理"
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <DataCard
            title="已入驻"
            value={128}
            suffix="人"
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            trend="up"
            trendValue="+8"
            description="正式园区成员"
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <DataCard
            title="本月新增"
            value={12}
            suffix="人"
            icon={<UserAddOutlined />}
            color="#1677FF"
            trend="up"
            trendValue="+25%"
            description="新增申请通过"
          />
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <DataCard
            title="平均AIOPC分"
            value="86.5"
            suffix=""
            icon={<StarOutlined />}
            color="#F0B90B"
            trend="up"
            trendValue="+2.3"
            description="综合评分均值"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="总资产规模"
            value="18.6"
            suffix="亿"
            prefix="¥"
            icon={<WalletOutlined />}
            color="#7C3AED"
            trend="up"
            trendValue="+12%"
            description="成员总资产"
          />
        </Col>
      </Row>

      {/* 成员列表 */}
      <DataTable
        title="成员列表"
        columns={columns}
        dataSource={memberData}
        actions={actions}
        rowKey="id"
        searchPlaceholder="搜索成员名称/企业..."
        showAdd={true}
        addButtonText="邀请新成员"
        onAdd={() => console.log('邀请成员')}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 位成员`,
        }}
      />

      {/* 成员详情弹窗 */}
      <Modal
        title={
          <Space>
            <GoldOutlined style={{ color: '#F0B90B' }} />
            <span>成员详情 - {selectedMember?.name}</span>
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => {}}>
            编辑信息
          </Button>,
        ]}
        width={720}
      >
        {selectedMember && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={64} style={{ background: selectedMember.aiopcLevel === 'S级' ? '#F0B90B' : '#1677FF', fontSize: 28 }}>
                {selectedMember.name.charAt(0)}
              </Avatar>
              <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                {selectedMember.name}
              </Title>
              <Space>
                {getAiopcLevelTag(selectedMember.aiopcLevel)}
                {getStatusBadge(selectedMember.status)}
              </Space>
            </div>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="成员ID">{selectedMember.id}</Descriptions.Item>
              <Descriptions.Item label="所属企业">{selectedMember.enterprise}</Descriptions.Item>
              <Descriptions.Item label="角色职位">
                <Tag style={{ color: getRoleColor(selectedMember.role), borderColor: getRoleColor(selectedMember.role) }}>
                  {selectedMember.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="入驻日期">{selectedMember.joinDate}</Descriptions.Item>
              <Descriptions.Item label="权益比例">
                <Text strong style={{ color: '#F0B90B', fontSize: 18 }}>{selectedMember.equityRatio}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="资产规模">
                <Text strong>{selectedMember.assets}</Text>
              </Descriptions.Item>
            </Descriptions>
            <Divider>权益与分润信息</Divider>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">月度分润</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#16A34A', marginTop: 4 }}>
                    ¥{(parseFloat(selectedMember.equityRatio) * 285).toFixed(1)}万
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">累计收益</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#F0B90B', marginTop: 4 }}>
                    ¥{(parseFloat(selectedMember.equityRatio) * 1280).toFixed(0)}万
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <Text type="secondary">投票权重</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1677FF', marginTop: 4 }}>
                    {selectedMember.equityRatio}
                  </div>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Modal>
    </div>
  );
}
