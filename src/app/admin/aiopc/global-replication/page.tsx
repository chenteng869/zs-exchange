'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Space, Button, Progress, Steps, Descriptions, Divider, Badge, Statistic, Tooltip } from 'antd';
import {
  GlobalOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
  RocketOutlined,
  FileSearchOutlined,
  AuditOutlined,
  SolutionOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  AimOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// 区域分布数据
const regionData = [
  {
    key: 'apac',
    name: '亚太区',
    icon: <EnvironmentOutlined />,
    color: '#F0B90B',
    countries: ['新加坡', '日本', '韩国', '香港', '澳大利亚'],
    projects: 8,
    investment: '¥28.6亿',
    status: 'active',
    progress: 78,
  },
  {
    key: 'europe',
    name: '欧洲区',
    icon: <FlagOutlined />,
    color: '#1677FF',
    countries: ['瑞士', '爱沙尼亚', '马耳他', '英国'],
    projects: 5,
    investment: '¥15.2亿',
    status: 'active',
    progress: 55,
  },
  {
    key: 'americas',
    name: '美洲区',
    icon: <AimOutlined />,
    color: '#16A34A',
    countries: ['美国(特拉华)', '加拿大', '开曼群岛'],
    projects: 4,
    investment: '¥12.8亿',
    status: 'pending',
    progress: 32,
  },
  {
    key: 'middle-east',
    name: '中东区',
    icon: <BankOutlined />,
    color: '#7C3AED',
    countries: ['迪拜', '阿布扎比', '沙特阿拉伯'],
    projects: 3,
    investment: '¥9.5亿',
    status: 'planning',
    progress: 15,
  },
  {
    key: 'africa',
    name: '非洲区',
    icon: <SafetyCertificateOutlined />,
    color: '#EC4899',
    countries: ['毛里求斯', '南非', '塞舌尔'],
    projects: 2,
    investment: '¥3.2亿',
    status: 'planning',
    progress: 8,
  },
];

// Mock数据 - 复制项目列表
const replicationData = [
  { id: 'REP-001', targetCountry: '新加坡', stage: '运营中', localPartner: 'SG Digital Pte Ltd', estimatedInvestment: '¥8.5亿', aiopcScore: 92, progress: 95, status: 'active' },
  { id: 'REP-002', targetCountry: '瑞士(苏黎世)', stage: '合规审批', localPartner: 'Swiss Crypto Valley AG', estimatedInvestment: '¥6.2亿', aiopcScore: 88, progress: 68, status: 'pending' },
  { id: 'REP-003', targetCountry: '日本(东京)', stage: '运营中', localPartner: 'Japan Blockchain Assoc.', estimatedInvestment: '¥5.8亿', aiopcScore: 90, progress: 88, status: 'active' },
  { id: 'REP-004', targetCountry: '迪拜(DIFC)', stage: '筹备中', localPartner: 'DIFC Authority Partner', estimatedInvestment: '¥4.5亿', aiopcScore: 85, progress: 25, status: 'planning' },
  { id: 'REP-005', targetCountry: '香港', stage: '运营中', localPartner: 'HK Fintech Alliance', estimatedInvestment: '¥7.2亿', aiopcScore: 94, progress: 92, status: 'active' },
  { id: 'REP-006', targetCountry: '爱沙尼亚(塔林)', stage: '合规审批', localPartner: 'e-Residency Partner OÜ', estimatedInvestment: '¥3.1亿', aiopcScore: 82, progress: 52, status: 'pending' },
  { id: 'REP-007', targetCountry: '美国(特拉华)', stage: '筹备中', localPartner: 'Delaware Corp Services', estimatedInvestment: '¥9.8亿', aiopcScore: 86, progress: 18, status: 'planning' },
  { id: 'REP-008', targetCountry: '澳大利亚(悉尼)', stage: '运营中', localPartner: 'AusFinTech Group Pty', estimatedInvestment: '¥4.1亿', aiopcScore: 87, progress: 75, status: 'active' },
];

export default function AiopcGlobalReplicationPage() {
  const getStageTag = (stage: string) => {
    const map: Record<string, { color: string; icon?: React.ReactNode }> = {
      '运营中': { color: 'success', icon: <CheckCircleOutlined /> },
      '合规审批': { color: 'processing', icon: <ClockCircleOutlined /> },
      '筹备中': { color: 'warning', icon: <SyncOutlined /> },
      '规划中': { color: 'default' },
    };
    const item = map[stage] || { color: 'default' };
    return <Tag color={item.color} icon={item.icon}>{stage}</Tag>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge status="success" text="正常推进" />;
    if (status === 'pending') return <Badge status="processing" text="等待审批" />;
    return <Badge status="warning" text="前期筹备" />;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#16A34A';
    if (progress >= 50) return '#F0B90B';
    return '#1677FF';
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('查看:', record.targetCountry),
    },
    {
      key: 'edit',
      label: '编辑计划',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('编辑:', record.targetCountry),
    },
  ];

  const columns = [
    {
      title: '目标国家/地区',
      dataIndex: 'targetCountry',
      key: 'targetCountry',
      render: (text: string) => (
        <Space>
          <GlobalOutlined style={{ color: '#F0B90B' }} />
          <Text strong style={{ color: '#0F1B3D' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '项目阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => getStageTag(stage),
      filters: [
        { text: '运营中', value: '运营中' },
        { text: '合规审批', value: '合规审批' },
        { text: '筹备中', value: '筹备中' },
      ],
      onFilter: (value: any, record: any) => record.stage === value,
    },
    {
      title: '本地合作伙伴',
      dataIndex: 'localPartner',
      key: 'localPartner',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '预计投资',
      dataIndex: 'estimatedInvestment',
      key: 'estimatedInvestment',
      render: (text: string) => <Text strong style={{ color: '#F0B90B' }}>{text}</Text>,
      sorter: (a: any, b: any) =>
        parseFloat(a.estimatedInvestment.replace(/[^0-9.]/g, '')) -
        parseFloat(b.estimatedInvestment.replace(/[^0-9.]/g, '')),
    },
    {
      title: 'AIOPC评分',
      dataIndex: 'aiopcScore',
      key: 'aiopcScore',
      render: (score: number) => (
        <span style={{ fontWeight: 600, color: score >= 90 ? '#F0B90B' : '#1677FF' }}>
          {score}
        </span>
      ),
      sorter: (a: any, b: any) => a.aiopcScore - b.aiopcScore,
    },
    {
      title: '复制进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (progress: number) => (
        <Progress
          percent={progress}
          size="small"
          strokeColor={getProgressColor(progress)}
          format={percent => `${percent}%`}
        />
      ),
      sorter: (a: any, b: any) => a.progress - b.progress,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
  ];

  // 汇总统计
  const totalInvestment = replicationData.reduce(
    (sum, r) => sum + parseFloat(r.estimatedInvestment.replace(/[^0-9.]/g, '')), 0
  );
  const avgProgress = Math.round(replicationData.reduce((sum, r) => sum + r.progress, 0) / replicationData.length);
  const activeCount = replicationData.filter(r => r.status === 'active').length;

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
          <GlobalOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 4 }}>
              AIOPC全球复制方案
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              萨摩亚模式全球复刻 · 多法域适配 · 本地化合规
            </Text>
          </div>
        </Space>
        <div style={{ marginTop: 16 }}>
          <Row gutter={[12, 8]}>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>覆盖区域</span>}
                value={regionData.length}
                suffix="大洲"
                valueStyle={{ color: '#F0B90B', fontSize: 20 }}
              />
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>复制项目</span>}
                value={replicationData.length}
                suffix="个"
                valueStyle={{ color: '#fff', fontSize: 20 }}
              />
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>总投资规模</span>}
                value={totalInvestment.toFixed(1)}
                suffix="亿"
                prefix="¥"
                valueStyle={{ color: '#16A34A', fontSize: 20 }}
              />
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>平均进度</span>}
                value={avgProgress}
                suffix="%"
                valueStyle={{ color: '#1677FF', fontSize: 20 }}
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* 区域分布卡片 */}
      <Title level={4} style={{ marginBottom: 16 }}>
        <Space>
          <EnvironmentOutlined style={{ color: '#F0B90B' }} />
          全球区域布局
        </Space>
      </Title>
      <Row gutter={[16, 16]}>
        {regionData.map(region => (
          <Col xs={24} sm={12} lg={5} key={region.key}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                borderTop: `3px solid ${region.color}`,
                height: '100%',
              }}
            >
              <Space align="start" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${region.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: region.color,
                  }}
                >
                  {region.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: 15 }}>{region.name}</Text>
                  <br />
                  <Tag
                    color={
                      region.status === 'active'
                        ? 'success'
                        : region.status === 'pending'
                        ? 'warning'
                        : 'default'
                    }
                    style={{ marginTop: 2, fontSize: 11 }}
                  >
                    {region.status === 'active' ? '活跃' : region.status === 'pending' ? '推进中' : '规划中'}
                  </Tag>
                </div>
              </Space>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>覆盖国家/地区</Text>
                <div style={{ marginTop: 4 }}>
                  {region.countries.map(country => (
                    <Tag key={country} style={{ margin: '2px 4px 2px 0', fontSize: 11 }}>
                      {country}
                    </Tag>
                  ))}
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Row gutter={[8, 4]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>项目数</Text>
                  <div style={{ fontWeight: 600, color: region.color, fontSize: 16 }}>
                    {region.projects}
                    <Text type="secondary" style={{ fontSize: 11 }}>个</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>投资额</Text>
                  <div style={{ fontWeight: 600, color: '#0F1B3D', fontSize: 14 }}>
                    {region.investment}
                  </div>
                </Col>
              </Row>

              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>区域进度</Text>
                  <Text style={{ fontSize: 11, fontWeight: 600, color: region.color }}>
                    {region.progress}%
                  </Text>
                </div>
                <Progress
                  percent={region.progress}
                  size="small"
                  showInfo={false}
                  strokeColor={region.color}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 复制项目列表 */}
      <DataTable
        title="全球复制项目列表"
        columns={columns}
        dataSource={replicationData}
        actions={actions}
        rowKey="id"
        searchPlaceholder="搜索目标国家/合作伙伴..."
        showAdd={true}
        addButtonText="发起复制"
        onAdd={() => console.log('发起新复制')}
        pagination={{
          pageSize: 8,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个复制项目`,
        }}
      />

      {/* 典型复制流程 - Steps组件 */}
      <Card
        title={
          <Space>
            <RocketOutlined style={{ color: '#F0B90B' }} />
            <span>AIOPC典型复制流程（萨摩亚模式）</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Steps
          direction="horizontal"
          current={3}
          items={[
            {
              title: '法域调研',
              description: '评估目标国监管环境、税收政策、数字资产法规',
              icon: <FileSearchOutlined />,
            },
            {
              title: '本地伙伴对接',
              description: '筛选合规的本地律所、托管机构、技术伙伴',
              icon: <TeamOutlined />,
            },
            {
              title: 'SPV架构搭建',
              description: '注册特殊目的载体、资产隔离设计、税务优化方案',
              icon: <SolutionOutlined />,
            },
            {
              title: '合规审计',
              description: '提交监管文件、通过AML/KYC审查、获取运营牌照',
              icon: <AuditOutlined />,
            },
            {
              title: '系统部署上线',
              description: '技术系统迁移、本地化适配、正式对外运营',
              icon: <RocketOutlined />,
            },
          ]}
        />
        <Divider />
        <Row gutter={[24, 16]} style={{ marginTop: 8 }}>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#FFFBEA' }}>
              <Text type="secondary">平均复制周期</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#F0B90B', marginTop: 4 }}>
                6-12
                <Text type="secondary" style={{ fontSize: 13 }}>个月</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#F0FDF4' }}>
              <Text type="secondary">合规通过率</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A', marginTop: 4 }}>
                94
                <Text type="secondary" style={{ fontSize: 13 }}>%</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#EFF6FF' }}>
              <Text type="secondary">已落地节点</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1677FF', marginTop: 4 }}>
                {activeCount}
                <Text type="secondary" style={{ fontSize: 13 }}>/ {replicationData.length}</Text>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ textAlign: 'center', background: '#FAF5FF' }}>
              <Text type="secondary">ROI预期</Text>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#7C3AED', marginTop: 4 }}>
                18-35
                <Text type="secondary" style={{ fontSize: 13 }}>%</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
