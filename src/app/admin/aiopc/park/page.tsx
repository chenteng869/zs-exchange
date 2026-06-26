'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Button, Modal, Descriptions, Divider } from 'antd';
import {
  HomeOutlined,
  BankOutlined,
  TrophyOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  RobotOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 园区企业列表
const enterpriseData = [
  { id: 'ENT-001', name: '萨摩亚数字资产控股', industry: '数字金融', joinDate: '2024-03-15', aiopcScore: 95, spvStatus: '活跃', revenue: '¥12,800万', status: 'active' },
  { id: 'ENT-002', name: '链上科技(新加坡)', industry: '区块链技术', joinDate: '2024-04-22', aiopcScore: 88, spvStatus: '审核中', revenue: '¥8,600万', status: 'pending' },
  { id: 'ENT-003', name: 'AIOPC智能合约实验室', industry: '智能合约审计', joinDate: '2024-05-08', aiopcScore: 92, spvStatus: '活跃', revenue: '¥5,200万', status: 'active' },
  { id: 'ENT-004', name: '中萨跨境支付中心', industry: '跨境支付', joinDate: '2024-06-01', aiopcScore: 85, spvStatus: '待激活', revenue: '¥15,300万', status: 'inactive' },
  { id: 'ENT-005', name: 'Web3孵化器亚太总部', industry: '创业孵化', joinDate: '2024-02-18', aiopcScore: 90, spvStatus: '活跃', revenue: '¥3,800万', status: 'active' },
  { id: 'ENT-006', name: '代币经济研究院', industry: '经济研究', joinDate: '2024-07-10', aiopcScore: 87, spvStatus: '活跃', revenue: '¥2,100万', status: 'active' },
  { id: 'ENT-007', name: '合规托管服务公司', industry: '合规服务', joinDate: '2024-03-28', aiopcScore: 93, spvStatus: '活跃', revenue: '¥9,700万', status: 'active' },
  { id: 'ENT-008', name: 'DCF估值模型中心', industry: '估值咨询', joinDate: '2024-05-20', aiopcScore: 82, spvStatus: '审核中', revenue: '¥1,500万', status: 'pending' },
  { id: 'ENT-009', name: '链上数据分析平台', industry: '数据分析', joinDate: '2024-04-05', aiopcScore: 89, spvStatus: '活跃', revenue: '¥6,400万', status: 'active' },
  { id: 'ENT-010', name: 'SPV架构设计事务所', industry: '法律架构', joinDate: '2024-06-15', aiopcScore: 91, spvStatus: '活跃', revenue: '¥4,200万', status: 'active' },
  { id: 'ENT-011', name: '税务优化咨询集团', industry: '财税服务', joinDate: '2024-01-20', aiopcScore: 86, spvStatus: '活跃', revenue: '¥7,900万', status: 'active' },
  { id: 'ENT-012', name: '全球复制方案中心', industry: '战略扩张', joinDate: '2024-08-01', aiopcScore: 78, spvStatus: '待激活', revenue: '¥900万', status: 'inactive' },
];

export default function AiopcParkPage() {
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = React.useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedEnterprise(record);
    setDetailModalOpen(true);
  };

  const handleEdit = (record: any) => {
    console.log('编辑企业:', record.name);
  };

  const handleAiAssess = (record: any) => {
    console.log('AI评估:', record.name);
  };

  const getSpvStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      活跃: { color: 'green', text: '活跃' },
      审核中: { color: 'orange', text: '审核中' },
      待激活: { color: 'default', text: '待激活' },
    };
    const item = map[status] || { color: 'default', text: status };
    return <Tag color={item.color}>{item.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    if (status === 'active') return <Tag color="success" icon={<CheckCircleOutlined />}>运营中</Tag>;
    if (status === 'pending') return <Tag color="warning" icon={<ClockCircleOutlined />}>审核中</Tag>;
    return <Tag color="default" icon={<WarningOutlined />}>未激活</Tag>;
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
      onClick: handleEdit,
    },
    {
      key: 'ai',
      label: 'AI评估',
      icon: <RobotOutlined />,
      type: 'link' as const,
      onClick: handleAiAssess,
    },
  ];

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong style={{ color: '#0F1B3D' }}>{text}</Text>,
    },
    {
      title: '所属行业',
      dataIndex: 'industry',
      key: 'industry',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '入驻时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
      sorter: (a: any, b: any) => a.joinDate.localeCompare(b.joinDate),
    },
    {
      title: 'AIOPC评分',
      dataIndex: 'aiopcScore',
      key: 'aiopcScore',
      render: (score: number) => (
        <span style={{ fontWeight: 600, color: score >= 90 ? '#F0B90B' : score >= 80 ? '#1677FF' : '#666' }}>
          {score}
        </span>
      ),
      sorter: (a: any, b: any) => a.aiopcScore - b.aiopcScore,
    },
    {
      title: 'SPV状态',
      dataIndex: 'spvStatus',
      key: 'spvStatus',
      render: (status: string) => getSpvStatusTag(status),
    },
    {
      title: '营收贡献',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
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
          <HomeOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              AIOPC超级合子·产业园总览
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              全球数字资产产业园区运营中枢 · SPV架构 · 税务优化 · 合规托管
            </Text>
          </div>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Tag color="#F0B90B" style={{ border: 'none', color: '#0F1B3D', fontWeight: 600 }}>ZS Exchange</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>萨摩亚模式</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>SPV隔离</Tag>
          <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' }}>合规托管</Tag>
        </div>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="入驻企业数"
            value={128}
            suffix="家"
            icon={<BankOutlined />}
            color="#F0B90B"
            trend="up"
            trendValue="+12%"
            description="较上月新增"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="园区总估值"
            value="86.5"
            suffix="亿"
            prefix="¥"
            icon={<TrophyOutlined />}
            color="#1677FF"
            trend="up"
            trendValue="+8.3%"
            description="AIOPC综合评分"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="年度营收"
            value="42.8"
            suffix="亿"
            prefix="¥"
            icon={<DollarOutlined />}
            color="#16A34A"
            trend="up"
            trendValue="+15.2%"
            description="累计贡献值"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="SPV数量"
            value={56}
            suffix="个"
            icon={<SafetyCertificateOutlined />}
            color="#7C3AED"
            trend="up"
            trendValue="+5"
            description="特殊目的载体"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="合规评级"
            value="AAA"
            suffix=""
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            trend="none"
            description="国际合规认证"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <DataCard
            title="活跃项目"
            value={234}
            suffix="个"
            icon={<ThunderboltOutlined />}
            color="#F59E0B"
            trend="up"
            trendValue="+18"
            description="在运行项目"
          />
        </Col>
      </Row>

      {/* 园区企业列表 */}
      <DataTable
        title="园区企业列表"
        columns={columns}
        dataSource={enterpriseData}
        actions={actions}
        rowKey="id"
        searchPlaceholder="搜索企业名称/行业..."
        showAdd={false}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 家企业`,
        }}
      />

      {/* 企业详情弹窗 */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: '#F0B90B' }} />
            <span>企业详情 - {selectedEnterprise?.name}</span>
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
        {selectedEnterprise && (
          <>
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="企业ID">{selectedEnterprise.id}</Descriptions.Item>
              <Descriptions.Item label="企业名称">{selectedEnterprise.name}</Descriptions.Item>
              <Descriptions.Item label="所属行业">
                <Tag>{selectedEnterprise.industry}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="入驻时间">{selectedEnterprise.joinDate}</Descriptions.Item>
              <Descriptions.Item label="AIOPC评分">
                <span style={{ fontWeight: 600, color: '#F0B90B', fontSize: 18 }}>
                  {selectedEnterprise.aiopcScore}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="SPV状态">{getSpvStatusTag(selectedEnterprise.spvStatus)}</Descriptions.Item>
              <Descriptions.Item label="营收贡献">
                <Text strong>{selectedEnterprise.revenue}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusTag(selectedEnterprise.status)}</Descriptions.Item>
            </Descriptions>
            <Divider>AI评估摘要</Divider>
            <Card size="small" style={{ background: '#FAFAFA' }}>
              <Text type="secondary">
                该企业在AIOPC评分体系中表现{selectedEnterprise.aiopcScore >= 90 ? '优秀' : selectedEnterprise.aiopcScore >= 80 ? '良好' : '一般'}，
                SPV架构{selectedEnterprise.spvStatus === '活跃' ? '运行正常' : '需关注'}。
                建议关注{selectedEnterprise.aiopcScore < 85 ? '提升合规水平与营收能力' : '保持当前运营状态'}。
              </Text>
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
}
