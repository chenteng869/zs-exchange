'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Progress, Timeline, Alert, Space, Badge, Statistic } from 'antd';
import {
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface ComplianceEvent {
  id: string;
  eventId: string;
  type: string;
  description: string;
  node: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  date: string;
  handler?: string;
}

const mockEvents: ComplianceEvent[] = [
  {
    id: '1',
    eventId: 'CMP-2024-001',
    type: '异常交易',
    description: '节点ND-2024-009单日交易量超阈值300%',
    node: '周涛',
    severity: 'high',
    status: 'investigating',
    date: '2024-06-20',
    handler: '系统自动',
  },
  {
    id: '2',
    eventId: 'CMP-2024-002',
    type: '层级违规',
    description: '疑似跨区域推荐，触发层级限制规则',
    node: '陈明',
    severity: 'medium',
    status: 'open',
    date: '2024-06-19',
  },
  {
    id: '3',
    eventId: 'CMP-2024-003',
    type: '佣金异常',
    description: '单笔佣金金额超过月度上限',
    node: '张伟',
    severity: 'medium',
    status: 'resolved',
    date: '2024-06-18',
    handler: '人工审核',
  },
  {
    id: '4',
    eventId: 'CMP-2024-004',
    type: 'KYC缺失',
    description: '新增下级未完成身份认证',
    node: '赵刚',
    severity: 'low',
    status: 'open',
    date: '2024-06-17',
  },
  {
    id: '5',
    eventId: 'CMP-2024-005',
    type: '推广违规',
    description: '检测到夸大收益承诺的推广内容',
    node: '刘芳',
    severity: 'high',
    status: 'investigating',
    date: '2024-06-16',
    handler: '内容审核组',
  },
  {
    id: '6',
    eventId: 'CMP-2024-006',
    type: '资金异常',
    description: '入金来源与申报信息不符',
    node: '黄磊',
    severity: 'high',
    status: 'open',
    date: '2024-06-15',
  },
  {
    id: '7',
    eventId: 'CMP-2024-007',
    type: '数据泄露风险',
    description: '检测到异常API调用模式',
    node: '系统',
    severity: 'high',
    status: 'resolved',
    date: '2024-06-14',
    handler: '安全团队',
  },
  {
    id: '8',
    eventId: 'CMP-2024-008',
    type: '合规报告逾期',
    description: '季度合规报告提交截止日期临近',
    node: '杨丽',
    severity: 'low',
    status: 'resolved',
    date: '2024-06-13',
    handler: '合规部',
  },
  {
    id: '9',
    eventId: 'CMP-2024-009',
    type: '关联账户',
    description: '发现多个账号使用相同设备指纹',
    node: '孙静',
    severity: 'medium',
    status: 'closed',
    date: '2024-06-12',
    handler: '风控系统',
  },
  {
    id: '10',
    eventId: 'CMP-2024-010',
    type: '培训记录缺失',
    description: '必修课程完成率低于要求',
    node: '郑华',
    severity: 'low',
    status: 'open',
    date: '2024-06-11',
  },
];

const getSeverityConfig = (severity: string) => {
  const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    high: { color: 'error', text: '高', icon: <ExclamationCircleOutlined /> },
    medium: { color: 'warning', text: '中', icon: <WarningOutlined /> },
    low: { color: 'blue', text: '低', icon: <InfoCircle /> },
  };
  return map[severity] || { color: 'default', text: severity, icon: <InfoCircle /> };
};

const getStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    open: { color: 'orange', text: '待处理' },
    investigating: { color: 'processing', text: '调查中' },
    resolved: { color: 'success', text: '已解决' },
    closed: { color: 'default', text: '已关闭' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

function InfoCircle() {
  return <span style={{ display: 'inline-block', width: 14 }} />;
}

export default function DsalesCompliancePage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: ComplianceEvent) =>
        console.log('查看事件:', record.eventId),
      hidden: () => false,
    },
    {
      key: 'handle',
      label: '处理',
      icon: <ThunderboltOutlined />,
      type: 'link',
      onClick: (record: ComplianceEvent) =>
        console.log('处理事件:', record.eventId),
      hidden: (record: ComplianceRecord) => 
        record.status !== 'open' && record.status !== 'investigating',
    },
  ];

  const columns = [
    {
      title: '事件编号',
      dataIndex: 'eventId',
      key: 'eventId',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '事件类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      ellipsis: true,
    },
    {
      title: '涉及节点',
      dataIndex: 'node',
      key: 'node',
      width: 100,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => {
        const config = getSeverityConfig(severity);
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '发生日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
  ];

  const alertCount = mockEvents.filter((e) => e.severity === 'high').length;
  const resolvedRate = Math.round(
    (mockEvents.filter((e) => e.status === 'resolved' || e.status === 'closed').length /
      mockEvents.length) *
      100
  );

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          直销合规监控
        </Title>
        <Text type="secondary">实时预警 · 风险识别 · 合规审计</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="合规评分"
            value="86.5"
            icon={<SafetyOutlined />}
            color="#16A34A"
            suffix="/100"
            trend="up"
            trendValue="+2.3"
            description="整体合规状况良好"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="预警数"
            value={alertCount}
            icon={<WarningOutlined />}
            color="#DC2626"
            suffix="条"
            trend="down"
            trendValue="-3条"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="审核通过率"
            value={`${resolvedRate}%`}
            icon={<CheckCircleOutlined />}
            color="#1677FF"
            trend="up"
            trendValue="+5%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="违规处理数"
            value={23}
            icon={<AuditOutlined />}
            color="#F59E0B"
            suffix="件"
            trend="up"
            trendValue="+2件"
          />
        </Col>
      </Row>

      {/* 高危预警提示 */}
      {alertCount > 0 && (
        <Alert
          message={`当前有 ${alertCount} 条高危预警需要处理`}
          description="请及时查看并处理以下高风险合规事件，确保业务运营符合监管要求。"
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ borderRadius: 8 }}
        />
      )}

      {/* 风险分布概览 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="高危事件"
              value={mockEvents.filter((e) => e.severity === 'high').length}
              valueStyle={{ color: '#DC2626', fontSize: 28 }}
              prefix={<ExclamationCircleOutlined />}
            />
            <Progress
              percent={Math.round(
                (mockEvents.filter((e) => e.severity === 'high').length / mockEvents.length) * 100
              )}
              strokeColor="#DC2626"
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="中危事件"
              value={mockEvents.filter((e) => e.severity === 'medium').length}
              valueStyle={{ color: '#F59E0B', fontSize: 28 }}
              prefix={<WarningOutlined />}
            />
            <Progress
              percent={Math.round(
                (mockEvents.filter((e) => e.severity === 'medium').length / mockEvents.length) * 100
              )}
              strokeColor="#F59E0B"
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="低危事件"
              value={mockEvents.filter((e) => e.severity === 'low').length}
              valueStyle={{ color: '#1677FF', fontSize: 28 }}
              prefix={<SafetyCertificateOutlined />}
            />
            <Progress
              percent={Math.round(
                (mockEvents.filter((e) => e.severity === 'low').length / mockEvents.length) * 100
              )}
              strokeColor="#1677FF"
              showInfo={false}
              size="small"
              className="mt-2"
            />
          </Card>
        </Col>
      </Row>

      {/* 合规事件表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="合规事件列表"
          columns={columns}
          dataSource={mockEvents}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索事件或节点..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '待处理', value: 'open' },
            { label: '调查中', value: 'investigating' },
            { label: '已解决', value: 'resolved' },
            { label: '已关闭', value: 'closed' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条事件`,
          }}
        />
      </Card>
    </div>
  );
}

// 类型别名，用于上面的hidden函数
type ComplianceRecord = ComplianceEvent;
