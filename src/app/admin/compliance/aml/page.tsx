'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Space,
  Typography,
  Divider,
  Statistic,
} from 'antd';
import {
  TransactionOutlined,
  WarningOutlined,
  StopOutlined,
  FileProtectOutlined,
  AimOutlined,
  EyeOutlined,
  EditOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockTransactionData = [
  {
    id: 'TXN-2024-001',
    account: '0x8f3a...9c2d',
    amount: 158000.5,
    riskScore: 92,
    reason: '大额分拆交易',
    status: 'blocked',
  },
  {
    id: 'TXN-2024-002',
    account: 'user_78234',
    amount: 45600.0,
    riskScore: 78,
    reason: '频繁跨境转账',
    status: 'flagged',
  },
  {
    id: 'TXN-2024-003',
    account: '0x2b1e...4f8a',
    amount: 89200.75,
    riskScore: 85,
    reason: '与制裁实体关联',
    status: 'blocked',
  },
  {
    id: 'TXN-2024-004',
    account: '0x5d7c...1e3b',
    amount: 23400.0,
    riskScore: 65,
    reason: '交易模式异常',
    status: 'monitoring',
  },
  {
    id: 'TXN-2024-005',
    account: 'user_45621',
    amount: 67800.25,
    riskScore: 72,
    reason: '资金来源不明',
    status: 'flagged',
  },
  {
    id: 'TXN-2024-006',
    account: '0x9a4f...7c2e',
    amount: 125000.0,
    riskScore: 88,
    reason: '结构化存款',
    status: 'blocked',
  },
  {
    id: 'TXN-2024-007',
    account: '0x3c8d...5a1f',
    amount: 38900.5,
    riskScore: 58,
    reason: '账户行为异常',
    status: 'monitoring',
  },
  {
    id: 'TXN-2024-008',
    account: '0x7e2b...9d4c',
    amount: 256000.0,
    riskScore: 95,
    reason: '疑似洗钱通道',
    status: 'blocked',
  },
  {
    id: 'TXN-2024-009',
    account: 'user_89342',
    amount: 19200.0,
    riskScore: 52,
    reason: '高频小额交易',
    status: 'cleared',
  },
  {
    id: 'TXN-2024-010',
    account: '0x1f6a...3b8e',
    amount: 76400.75,
    riskScore: 81,
    reason: '第三方代付异常',
    status: 'flagged',
  },
  {
    id: 'TXN-2024-011',
    account: 'user_12876',
    amount: 52300.0,
    riskScore: 69,
    reason: 'IP地址异常',
    status: 'monitoring',
  },
  {
    id: 'TXN-2024-012',
    account: '0x6d9c...2f5a',
    amount: 145000.25,
    riskScore: 90,
    reason: '空壳公司关联',
    status: 'blocked',
  },
];

export default function AMLMonitorPage() {
  const getRiskColor = (score: number) => {
    if (score >= 85) return '#DC2626';
    if (score >= 70) return '#F59E0B';
    if (score >= 55) return '#F97316';
    return '#16A34A';
  };

  const getRiskTag = (score: number) => {
    if (score >= 85) return <Tag color="error">极高</Tag>;
    if (score >= 70) return <Tag color="warning">高</Tag>;
    if (score >= 55) return <Tag color="orange">中</Tag>;
    return <Tag color="success">低</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      blocked: { color: 'red', text: '已阻断' },
      flagged: { color: 'orange', text: '已标记' },
      monitoring: { color: 'blue', text: '监控中' },
      cleared: { color: 'green', text: '已放行' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '账户',
      dataIndex: 'account',
      key: 'account',
      width: 160,
      render: (text: string) => (
        <Text code style={{ fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '金额(USDT)',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: '#1677FF' }}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 120,
      render: (score: number) => (
        <Space direction="vertical" size={0}>
          <Progress
            percent={score}
            size="small"
            strokeColor={getRiskColor(score)}
            format={(percent) => `${percent}`}
          />
          {getRiskTag(score)}
        </Space>
      ),
    },
    {
      title: '标记原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 160,
    },
    {
      title: '处理状态',
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
      key: 'process',
      label: '处理',
      icon: <EditOutlined />,
      type: 'link',
      hidden: () => false,
      onClick: (record: any) => console.log('处理:', record.id),
    },
    {
      key: 'export',
      label: '导出报告',
      icon: <ExportOutlined />,
      type: 'link',
      hidden: (record: any) => record.status === 'cleared',
      onClick: (record: any) => console.log('导出:', record.id),
    },
  ];

  const highRiskCount = mockTransactionData.filter((t) => t.riskScore >= 85).length;
  const mediumRiskCount = mockTransactionData.filter((t) => t.riskScore >= 70 && t.riskScore < 85).length;
  const lowRiskCount = mockTransactionData.filter((t) => t.riskScore < 70).length;

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            AML反洗钱监控系统
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            交易行为分析 · 可疑交易识别 · 监管报送
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日交易笔数"
              value={12847}
              suffix="笔"
              icon={<TransactionOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+15.2%"
              description="实时监控中"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="可疑交易标记"
              value={156}
              suffix="笔"
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+8.5%"
              description="需人工审核"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="自动阻断数"
              value={23}
              suffix="笔"
              icon={<StopOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-5.2%"
              description="AI自动拦截"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="报送数量"
              value={42}
              suffix="份"
              icon={<FileProtectOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+12%"
              description="监管机构"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="覆盖率"
              value={99.7}
              suffix="%"
              icon={<AimOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+0.3%"
              description="全链路监控"
            />
          </Col>
        </Row>

        {/* 风险分布 */}
        <Card
          bordered={false}
          className="mb-6"
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} md={12}>
              <Title level={4} style={{ margin: 0 }}>
                风险等级分布
              </Title>
              <Divider style={{ margin: '16px 0' }} />
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Row justify="space-between" className="mb-2">
                    <Text>极高风险 {'>'}85分</Text>
                    <Text strong style={{ color: '#DC2626' }}>{highRiskCount} 笔</Text>
                  </Row>
                  <Progress
                    percent={(highRiskCount / 12) * 100}
                    strokeColor="#DC2626"
                    showInfo={false}
                  />
                </div>
                <div>
                  <Row justify="space-between" className="mb-2">
                    <Text>高风险 70-84分</Text>
                    <Text strong style={{ color: '#F59E0B' }}>{mediumRiskCount} 笔</Text>
                  </Row>
                  <Progress
                    percent={(mediumRiskCount / 12) * 100}
                    strokeColor="#F59E0B"
                    showInfo={false}
                  />
                </div>
                <div>
                  <Row justify="space-between" className="mb-2">
                    <Text>中等风险 {'<'}70分</Text>
                    <Text strong style={{ color: '#16A34A' }}>{lowRiskCount} 笔</Text>
                  </Row>
                  <Progress
                    percent={(lowRiskCount / 12) * 100}
                    strokeColor="#16A34A"
                    showInfo={false}
                  />
                </div>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Title level={4} style={{ margin: 0 }}>
                关键指标
              </Title>
              <Divider style={{ margin: '16px 0' }} />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="平均风险分"
                    value={74.6}
                    suffix="/100"
                    valueStyle={{ color: '#F59E0B' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="拦截率"
                    value={18.6}
                    suffix="%"
                    valueStyle={{ color: '#DC2626' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="误报率"
                    value={2.3}
                    suffix="%"
                    valueStyle={{ color: '#16A34A' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="平均处理时长"
                    value={4.2}
                    suffix="小时"
                    valueStyle={{ color: '#1677FF' }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* 可疑交易数据表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockTransactionData}
            title="可疑交易列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索交易ID或账户..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
