'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
  Divider,
} from 'antd';
import {
  TeamOutlined,
  WarningOutlined,
  CheckSquareOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockRiskEntities = [
  {
    id: 1,
    name: 'GlobalTech Ventures Ltd',
    type: '企业',
    riskScore: 88,
    level: 'critical',
    lastAssessment: '2024-06-22',
    status: 'active',
  },
  {
    id: 2,
    name: '0x8f3a...9c2d',
    type: '钱包地址',
    riskScore: 76,
    level: 'high',
    lastAssessment: '2024-06-21',
    status: 'monitoring',
  },
  {
    id: 3,
    name: 'user_78234',
    type: '个人用户',
    riskScore: 65,
    level: 'medium',
    lastAssessment: '2024-06-20',
    status: 'reviewing',
  },
  {
    id: 4,
    name: 'Alpha Capital Fund',
    type: '基金',
    riskScore: 92,
    level: 'critical',
    lastAssessment: '2024-06-22',
    status: 'active',
  },
  {
    id: 5,
    name: '0x2b1e...4f8a',
    type: '钱包地址',
    riskScore: 54,
    level: 'low',
    lastAssessment: '2024-06-19',
    status: 'cleared',
  },
  {
    id: 6,
    name: 'Pacific Trading Corp',
    type: '企业',
    riskScore: 71,
    level: 'high',
    lastAssessment: '2024-06-21',
    status: 'monitoring',
  },
  {
    id: 7,
    name: 'user_45621',
    type: '个人用户',
    riskScore: 43,
    level: 'low',
    lastAssessment: '2024-06-18',
    status: 'cleared',
  },
  {
    id: 8,
    name: 'Quantum Investment LLC',
    type: '基金',
    riskScore: 82,
    level: 'high',
    lastAssessment: '2024-06-20',
    status: 'active',
  },
  {
    id: 9,
    name: '0x5d7c...1e3b',
    type: '钱包地址',
    riskScore: 67,
    level: 'medium',
    lastAssessment: '2024-06-19',
    status: 'reviewing',
  },
  {
    id: 10,
    name: 'Nordic Holdings AB',
    type: '企业',
    riskScore: 58,
    level: 'medium',
    lastAssessment: '2024-06-17',
    status: 'monitoring',
  },
];

export default function RiskAssessmentPage() {
  const getRiskLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      critical: '#DC2626',
      high: '#F59E0B',
      medium: '#F97316',
      low: '#16A34A',
    };
    return colorMap[level] || '#9CA3AF';
  };

  const getRiskTag = (level: string) => {
    const tagMap: Record<string, { color: string; text: string }> = {
      critical: { color: 'error', text: '极高' },
      high: { color: 'warning', text: '高' },
      medium: { color: 'orange', text: '中' },
      low: { color: 'success', text: '低' },
    };
    const config = tagMap[level] || { color: 'default', text: level };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'red', text: '活跃监控' },
      monitoring: { color: 'orange', text: '持续观察' },
      reviewing: { color: 'blue', text: '评估中' },
      cleared: { color: 'green', text: '已通过' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#DC2626';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#F97316';
    return '#16A34A';
  };

  const columns = [
    {
      title: '实体名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 120,
      render: (score: number) => (
        <Text strong style={{ color: getScoreColor(score), fontSize: 16 }}>
          {score}
        </Text>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: string) => getRiskTag(level),
    },
    {
      title: '最近评估',
      dataIndex: 'lastAssessment',
      key: 'lastAssessment',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => getStatusTag(status),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
    {
      key: 'assess',
      label: '重新评估',
      icon: <FileSearchOutlined />,
      type: 'link',
      hidden: () => false,
      onClick: (record: any) => console.log('评估:', record.id),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
      hidden: (record: any) => record.status === 'cleared',
      onClick: (record: any) => console.log('编辑:', record.id),
    },
  ];

  const criticalCount = mockRiskEntities.filter((e) => e.level === 'critical').length;
  const highCount = mockRiskEntities.filter((e) => e.level === 'high').length;
  const avgScore = (
    mockRiskEntities.reduce((sum, e) => sum + e.riskScore, 0) / mockRiskEntities.length
  ).toFixed(1);

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            风险评估管理中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            实体风险评估 · 动态评级 · 整改跟踪
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="风险实体总数"
              value={1247}
              suffix="个"
              icon={<TeamOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+5.3%"
              description="全量覆盖"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="高风险数量"
              value={criticalCount + highCount}
              suffix="个"
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-8.2%"
              description="需重点关注"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="评估覆盖面"
              value={98.5}
              suffix="%"
              icon={<CheckSquareOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+2.1%"
              description="定期更新"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="平均风险分"
              value={avgScore}
              suffix="/100"
              icon={<LineChartOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-3.5%"
              description="整体趋稳"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="整改完成率"
              value={87.6}
              suffix="%"
              icon={<ThunderboltOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+12.8%"
              description="持续改善"
            />
          </Col>
        </Row>

        {/* 风险矩阵图 */}
        <Card
          bordered={false}
          className="mb-6"
          title="风险矩阵分布"
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>极高风险实体</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {mockRiskEntities
                      .filter((e) => e.level === 'critical')
                      .map((entity) => (
                        <Tag
                          key={entity.id}
                          color="error"
                          style={{ padding: '4px 12px', fontSize: 13 }}
                        >
                          {entity.name} ({entity.riskScore})
                        </Tag>
                      ))}
                  </Space>
                </div>
                <div>
                  <Text strong>高风险实体</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {mockRiskEntities
                      .filter((e) => e.level === 'high')
                      .map((entity) => (
                        <Tag
                          key={entity.id}
                          color="warning"
                          style={{ padding: '4px 12px', fontSize: 13 }}
                        >
                          {entity.name} ({entity.riskScore})
                        </Tag>
                      ))}
                  </Space>
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>中等风险实体</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {mockRiskEntities
                      .filter((e) => e.level === 'medium')
                      .map((entity) => (
                        <Tag
                          key={entity.id}
                          color="orange"
                          style={{ padding: '4px 12px', fontSize: 13 }}
                        >
                          {entity.name} ({entity.riskScore})
                        </Tag>
                      ))}
                  </Space>
                </div>
                <div>
                  <Text strong>低风险实体</Text>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space wrap>
                    {mockRiskEntities
                      .filter((e) => e.level === 'low')
                      .map((entity) => (
                        <Tag
                          key={entity.id}
                          color="success"
                          style={{ padding: '4px 12px', fontSize: 13 }}
                        >
                          {entity.name} ({entity.riskScore})
                        </Tag>
                      ))}
                  </Space>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 实体列表 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockRiskEntities}
            title="风险评估列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索实体名称..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个实体`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
