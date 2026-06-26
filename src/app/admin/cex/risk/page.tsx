'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert,
} from 'antd';
import {
  SafetyCertificateOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  WarningOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  FundOutlined,
  LockOutlined,
  ExclamationCircleOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface RiskEvent {
  id: string;
  ruleName: string;
  ruleType: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'ignored';
  triggerCount: number;
  blockCount: number;
  frozenAmount: number;
  processRate: number;
  triggeredAt: string;
  resolvedAt?: string;
  description: string;
  affectedAccounts: number;
}

const mockRiskEvents: RiskEvent[] = [
  { id: 'RK-001', ruleName: '大额提现异常检测', ruleType: '资金安全', riskLevel: 'critical', status: 'active', triggerCount: 25, blockCount: 8, frozenAmount: 2500000, processRate: 95, triggeredAt: '2024-06-08 13:20:00', description: '检测到单笔超过$500K的异常提现行为，触发多因素认证拦截', affectedAccounts: 8 },
  { id: 'RK-002', ruleName: '高频交易风控规则', ruleType: '交易风控', riskLevel: 'high', status: 'active', triggerCount: 156, blockCount: 42, frozenAmount: 180000, processRate: 88, triggeredAt: '2024-06-08 12:45:00', description: '单账户每秒下单超过50次，疑似程序化刷单或API滥用', affectedAccounts: 42 },
  { id: 'RK-003', ruleName: 'IP地址黑名单匹配', ruleType: '访问控制', riskLevel: 'high', status: 'resolved', triggerCount: 89, blockCount: 89, frozenAmount: 0, processRate: 100, triggeredAt: '2024-06-08 10:30:00', resolvedAt: '2024-06-08 11:15:00', description: '来自已知恶意IP段的登录尝试，已自动封禁并通知安全团队', affectedAccounts: 0 },
  { id: 'RK-004', ruleName: 'KYC信息变更异常', ruleType: '合规风控', riskLevel: 'medium', status: 'active', triggerCount: 12, blockCount: 3, frozenAmount: 45000, processRate: 75, triggeredAt: '2024-06-08 09:15:00', description: '短时间内多次修改KYC身份信息，需人工复核', affectedAccounts: 3 },
  { id: 'RK-005', ruleName: '洗钱模式识别引擎', ruleType: '反洗钱', riskLevel: 'critical', status: 'active', triggerCount: 5, blockCount: 5, frozenAmount: 1200000, processRate: 100, triggeredAt: '2024-06-08 08:00:00', description: 'ML模型识别出符合分层转账特征的交易链，已冻结相关账户', affectedAccounts: 5 },
  { id: 'RK-006', ruleName: '单日累计限额超限', ruleType: '额度管理', riskLevel: 'medium', status: 'resolved', triggerCount: 340, blockCount: 280, frozenAmount: 0, processRate: 100, triggeredAt: '2024-06-07 22:00:00', resolvedAt: '2024-06-07 23:30:00', description: 'VIP客户临时调高限额申请，经审批后恢复正常', affectedAccounts: 280 },
  { id: 'RK-007', ruleName: '关联账户集群检测', ruleType: '反欺诈', riskLevel: 'high', status: 'active', triggerCount: 18, blockCount: 12, frozenAmount: 380000, processRate: 82, triggeredAt: '2024-06-08 07:45:00', description: '图计算发现多个账号共享设备指纹/IP地址，疑似羊毛党团伙', affectedAccounts: 12 },
  { id: 'RK-008', ruleName: '合约爆仓风险预警', ruleType: '衍生品风控', riskLevel: 'low', status: 'ignored', triggerCount: 3200, blockCount: 0, frozenAmount: 0, processRate: 60, triggeredAt: '2024-06-08 06:00:00', description: '批量保证金率低于130%的账户提醒（非强制执行）', affectedAccounts: 3200 },
  { id: 'RK-009', ruleName: 'API密钥异常调用', ruleType: '技术安全', riskLevel: 'medium', status: 'active', triggerCount: 67, blockCount: 15, frozenAmount: 95000, processRate: 91, triggeredAt: '2024-06-08 05:30:00', description: '检测到API Key在非常规时间段的高频调用，可能存在Key泄露风险', affectedAccounts: 15 },
  { id: 'RK-010', ruleName: '跨境资金流动监控', ruleType: '监管合规', riskLevel: 'high', status: 'resolved', triggerCount: 8, blockCount: 6, frozenAmount: 520000, processRate: 100, triggeredAt: '2024-06-07 18:00:00', resolvedAt: '2024-06-07 19:45:00', description: '单日跨境转账总额超过$1M阈值，已完成AML报告提交', affectedAccounts: 6 },
];

export default function RiskPage() {
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const totalRules = mockRiskEvents.length;
  const todayBlocked = mockRiskEvents.reduce((sum, r) => sum + r.blockCount, 0);
  const abnormalAccounts = [...new Set(mockRiskEvents.flatMap(r => Array(r.affectedAccounts).fill(null)))].length;
  const totalFrozen = mockRiskEvents.reduce((sum, r) => sum + r.frozenAmount, 0);
  const avgProcessRate = (mockRiskEvents.filter(r => r.status !== 'ignored').reduce((sum, r) => sum + r.processRate, 0) / mockRiskEvents.filter(r => r.status !== 'ignored').length).toFixed(1);

  const getRiskTag = (level: string) => {
    const map: Record<string, { color: string; text: string }> = { critical: { color: 'red', text: '极危' }, high: { color: 'orange', text: '高危' }, medium: { color: 'gold', text: '中危' }, low: { color: 'blue', text: '低危' } };
    const config = map[level];
    return config ? <Tag color={config.color}>{config.text}</Tag> : level;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = { active: { status: 'processing', text: '处理中' }, resolved: { status: 'success', text: '已解决' }, ignored: { status: 'default', text: '已忽略' } };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: RiskEvent) => { setSelectedEvent(record); setDetailModalVisible(true); };

  const columns = [
    { title: '事件ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => <Text code className="text-xs">{id}</Text> },
    { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 190, render: (n: string) => <span className="font-medium text-sm">{n}</span> },
    { title: '规则类型', dataIndex: 'ruleType', key: 'ruleType', width: 100, render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: '风险等级', key: 'riskLevel', width: 90, render: (_: any, r: RiskEvent) => getRiskTag(r.riskLevel) },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: RiskEvent) => getStatusBadge(r.status) },
    { title: '触发次数', dataIndex: 'triggerCount', key: 'triggerCount', width: 90, render: (n: number) => <Badge count={n} style={{ backgroundColor: n > 100 ? '#DC2626' : n > 20 ? '#F59E0B' : '#1677FF' }} /> },
    { title: '拦截次数', dataIndex: 'blockCount', key: 'blockCount', width: 90, render: (n: number) => <Tag color="red">{n}</Tag> },
    { title: '冻结金额', dataIndex: 'frozenAmount', key: 'frozenAmount', width: 120, render: (a: number) => a > 0 ? <span className="font-mono text-orange-600">${(a / 1000).toFixed(0)}K</span> : '-' },
    { title: '处理率', dataIndex: 'processRate', key: 'processRate', width: 100, render: (rate: number) => <Progress percent={rate} size="small" strokeColor={rate >= 90 ? '#16A34A' : rate >= 70 ? '#F59E0B' : '#DC2626'} format={() => `${rate}%`} /> },
    { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 150, render: (t: string) => <span className="text-xs text-gray-500">{t}</span> },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '处理', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><SafetyCertificateOutlined style={{ color: '#DC2626' }} /> 风控管理</h1><p className="text-gray-500 mt-1">风控规则 · 限额管理 · 异常监控 · 合规审计</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>新建规则</Button><Button icon={<ReloadOutlined />}>刷新</Button><Button icon={<LockOutlined />}>规则库</Button></Space>
        </div>

        <Alert message={`今日已拦截 ${todayBlocked} 次风险操作，涉及 ${abnormalAccounts} 个异常账户`} type="warning" showIcon icon={<ExclamationCircleOutlined />} action={<Button size="small">查看详情</Button>} />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="风控规则数" value={totalRules} suffix="条" icon={<SafetyCertificateOutlined />} color="#1677FF" trend="up" trendValue="+3" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="今日拦截" value={todayBlocked} suffix="次" icon={<StopOutlined />} color="#DC2626" trend="up" trendValue="+28" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="异常账户" value={abnormalAccounts} suffix="个" icon={<WarningOutlined />} color="#F59E0B" trend="down" trendValue="-5" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="冻结资金" value={`${(totalFrozen / 1000000).toFixed(1)}M`} suffix=" USDT" icon={<LockOutlined />} color="#F97316" trend="up" trendValue="+$350K" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="处理率" value={avgProcessRate} suffix="" icon={<CheckCircleOutlined />} color="#16A34A" trend="up" trendValue="+4.2" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockRiskEvents} rowKey="id" title="风控事件列表" searchPlaceholder="搜索规则名称或类型..." actions={actions} pagination={{ pageSize: 10 }} showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '处理中', value: 'active' }, { label: '已解决', value: 'resolved' }, { label: '已忽略', value: 'ignored' }]} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><AimOutlined style={{ color: '#7C3AED' }} /> 风控规则分类统计</span>} className="shadow-sm">
              <div className="space-y-3">
                {[{ t: '资金安全', n: mockRiskEvents.filter(r => r.ruleType === '资金安全').length }, { t: '交易风控', n: mockRiskEvents.filter(r => r.ruleType === '交易风控').length }, { t: '反洗钱/反欺诈', n: mockRiskEvents.filter(r => ['反洗钱', '反欺诈'].includes(r.ruleType)).length }, { t: '合规/监管', n: mockRiskEvents.filter(r => ['合规风控', '监管合规'].includes(r.ruleType)).length }, { t: '技术安全', n: mockRiskEvents.filter(r => r.ruleType === '技术安全').length }].map(item => (
                  <div key={item.t}><div className="flex justify-between mb-1"><span>{item.t}</span><span className="font-semibold text-purple-600">{item.n} 条</span></div><Progress percent={(item.n / totalRules) * 100} strokeColor="#7C3AED" showInfo={false} /></div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><ThunderboltOutlined style={{ color: '#F59E0B' }} /> 高优先级待处理事项</span>} className="shadow-sm">
              <List size="small" dataSource={mockRiskEvents.filter(e => e.status === 'active' && ['critical', 'high'].includes(e.riskLevel))} renderItem={item => (
                <List.Item>
                  <div className="w-full"><div className="flex justify-between"><span className="font-medium">{getRiskTag(item.riskLevel)} {item.ruleName}</span><Badge count={item.blockCount} style={{ backgroundColor: '#DC2626' }} /></div><div className="text-xs text-gray-500 mt-1">{item.description.substring(0, 50)}...</div></div>
                </List.Item>
              )} />
            </Card>
          </Col>
        </Row>

        <Modal title={`风控事件详情 - ${selectedEvent?.ruleName}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={<Space><Button icon={<EditOutlined />}>处理事件</Button><Button type="primary" icon={<EyeOutlined />}>查看详情</Button></Space>}>
          {selectedEvent && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="事件ID"><Text strong className="text-blue-600">{selectedEvent.id}</Text></Descriptions.Item>
              <Descriptions.Item label="规则名称">{selectedEvent.ruleName}</Descriptions.Item>
              <Descriptions.Item label="规则类型"><Tag color="purple">{selectedEvent.ruleType}</Tag></Descriptions.Item>
              <Descriptions.Item label="风险等级">{getRiskTag(selectedEvent.riskLevel)}</Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusBadge(selectedEvent.status)}</Descriptions.Item>
              <Descriptions.Item label="处理率"><Progress percent={selectedEvent.processRate} format={() => `${selectedEvent.processRate}%`} strokeColor={selectedEvent.processRate >= 90 ? '#16A34A' : '#F59E0B'} /></Descriptions.Item>
              <Descriptions.Item label="触发次数">{selectedEvent.triggerCount} 次</Descriptions.Item>
              <Descriptions.Item label="拦截次数"><Tag color="red">{selectedEvent.blockCount} 次</Tag></Descriptions.Item>
              <Descriptions.Item label="冻结金额">{selectedEvent.frozenAmount > 0 ? `$${(selectedEvent.frozenAmount / 1000).toFixed(0)}K` : '无'}</Descriptions.Item>
              <Descriptions.Item label="影响账户">{selectedEvent.affectedAccounts} 个</Descriptions.Item>
              <Descriptions.Item label="触发时间">{selectedEvent.triggeredAt}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{selectedEvent.resolvedAt || '未解决'}</Descriptions.Item>
              <Descriptions.Item label="事件描述" span={2}>{selectedEvent.description}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
