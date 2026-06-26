'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Alert, Form, Input, Select, Space, message, Badge, Steps, Descriptions, Timeline, Avatar, Popconfirm, Statistic, Progress, Empty, List, Typography, Tooltip } from 'antd';
import {
  ThunderboltOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  PhoneOutlined,
  MessageOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  CarOutlined,
  ToolOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
const { Text } = Typography;

// 事件状态
type IncidentStatus = 'new' | 'assigned' | 'investigating' | 'containing' | 'eradicating' | 'recovering' | 'closed';
type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
type IncidentType = 'security_breach' | 'ddos_attack' | 'malware' | 'data_leak' | 'phishing' | 'fraud' | 'blockchain_incident' | 'insider_threat';

// 应急事件工单接口
interface IncidentTicket {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignee: string;
  assigneeAvatar?: string;
  department: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  description: string;
  impactScope: string;
  affectedAssets: string[];

  // 处理进度
  currentStep: number;
  stepHistory: { step: number; time: string; operator: string; note: string }[];
}

// 应急预案模板
interface EmergencyPlan {
  id: string;
  name: string;
  category: IncidentType;
  version: string;
  description: string;
  steps: string[];
  contacts: { role: string; name: string; phone: string }[];
  lastUpdated: string;
}

// 模拟事件工单数据
const mockIncidents: IncidentTicket[] = [
  {
    id: 'INC-240608-001', title: 'DDoS攻击导致交易所API服务不可用', type: 'ddos_attack', severity: 'critical', status: 'containing',
    assignee: 'wang_fang', department: '安全运营组', createdAt: '2024-06-08 14:20:00', updatedAt: '2024-06-08 14:45:00',
    description: '遭受大规模DDoS攻击，峰值流量达8Gbps，导致交易API响应超时率升至85%，用户无法正常下单和查询。',
    impactScope: '核心交易系统、API网关、用户前端', affectedAssets: ['api-gateway-01', 'api-gateway-02', 'load-balancer'],
    currentStep: 3, stepHistory: [
      { step: 1, time: '14:20:00', operator: 'system', note: '自动检测到异常流量并创建工单' },
      { step: 2, time: '14:22:00', operator: 'zhang_wei', note: '确认DDoS攻击，评估影响范围' },
      { step: 3, time: '14:30:00', operator: 'wang_fang', note: '启动CDN清洗和流量牵引，联系云厂商' },
    ],
  },
  {
    id: 'INC-240608-002', title: '疑似内部人员异常访问敏感数据', type: 'insider_threat', severity: 'high', status: 'investigating',
    assignee: 'li_ming', department: '安全部', createdAt: '2024-06-08 13:15:00', updatedAt: '2024-06-08 14:00:00',
    description: 'DLP系统检测到某内部账号在非工作时间大量下载用户KYC数据和交易记录，行为模式异常。',
    impactScope: '用户隐私数据、交易数据', affectedAssets: ['database-primary', 'file-storage'],
    currentStep: 2, stepHistory: [
      { step: 1, time: '13:15:00', operator: 'system', note: 'DLP规则触发告警' },
      { step: 2, time: '13:30:00', operator: 'li_ming', note: '开始调查，调取访问日志和行为分析' },
    ],
  },
  {
    id: 'INC-240608-003', title: 'DeFi协议闪电贷攻击预警', type: 'blockchain_incident', severity: 'critical', status: 'new',
    assignee: '', department: '-', createdAt: '2024-06-08 12:45:00', updatedAt: '2024-06-08 12:45:00',
    description: '链上监控系统检测到针对本所DeFi流动性池的可疑大额闪电贷操作模式，与近期已知攻击手法高度相似。',
    impactScope: 'DeFi协议、流动性池、用户资金', affectedAssets: ['defi-contract-v2', 'liquidity-pool-a', 'price-oracle'],
    currentStep: 1, stepHistory: [
      { step: 1, time: '12:45:00', operator: 'chain-monitor', note: '链上异常交易模式检测告警' },
    ],
  },
  {
    id: 'INC-240608-004', title: '钓鱼网站冒充中萨交易所', type: 'phishing', severity: 'high', status: 'assigned',
    assignee: 'zhao_jun', department: '合规部', createdAt: '2024-06-08 11:30:00', updatedAt: '2024-06-08 12:00:00',
    description: '收到多起用户反馈称在搜索引擎点击到假冒的中萨交易所官网链接，已收集到3个可疑域名。',
    impactScope: '品牌声誉、用户资产安全', affectedAssets: [],
    currentStep: 2, stepHistory: [
      { step: 1, time: '11:30:00', operator: 'user_report', note: '用户举报钓鱼网站' },
      { step: 2, time: '11:45:00', operator: 'zhao_jun', note: '初步验证并收集证据，准备下架申请' },
    ],
  },
  {
    id: 'INC-240608-005', title: '勒索软件感染终端隔离处置', type: 'malware', severity: 'high', status: 'recovering',
    assignee: 'chen_hui', department: '运维部', createdAt: '2024-06-08 09:00:00', updatedAt: '2024-06-08 13:30:00',
    description: '财务部门一台终端感染LockBit变体勒索软件，已及时隔离，正在进行恢复和数据完整性验证。',
    impactScope: '财务部门终端', affectedAssets: ['workstation-finance-03'],
    currentStep: 6, stepHistory: [
      { step: 1, time: '09:00:00', operator: 'EDR', note: '检测到恶意进程执行' },
      { step: 2, time: '09:02:00', operator: 'chen_hui', note: '确认勒索软件感染，立即隔离终端' },
      { step: 3, time: '09:15:00', operator: 'chen_hui', note: '断开网络连接，保留现场证据' },
      { step: 4, time: '10:00:00', operator: 'chen_hui', note: '清除恶意软件，全面扫描' },
      { step: 5, time: '12:00:00', operator: 'chen_hui', note: '从备份恢复数据' },
      { step: 6, time: '13:30:00', operator: 'chen_hui', note: '数据完整性验证进行中' },
    ],
  },
  {
    id: 'INC-240607-001', title: '用户投诉疑似交易欺诈', type: 'fraud', severity: 'medium', status: 'closed',
    assignee: 'li_ming', department: '安全部', createdAt: '2024-06-07 16:00:00', updatedAt: '2024-06-07 20:00:00', resolvedAt: '2024-06-07 20:00:00',
    description: '用户投诉其账户在未知情况下发生一笔大额USDT转账，经调查确认为用户自身操作失误（误触快速转账）。',
    impactScope: '单个用户账户', affectedAssets: [],
    currentStep: 7, stepHistory: [
      { step: 1, time: '16:00:00', operator: 'user_complaint', note: '用户提交投诉' },
      { step: 2, time: '16:15:00', operator: 'li_ming', note: '开始调查交易记录' },
      { step: 3, time: '17:00:00', operator: 'li_ming', note: '调取操作日志和登录记录' },
      { step: 4, time: '18:00:00', operator: 'li_ming', note: '分析行为特征' },
      { step: 5, time: '18:30:00', operator: 'li_ming', note: '联系用户核实情况' },
      { step: 6, time: '19:00:00', operator: 'li_ming', note: '确认调查结论' },
      { step: 7, time: '20:00:00', operator: 'li_ming', note: '结案：用户误操作，已提供操作指引' },
    ],
  },
];

// 应急预案模板数据
const mockPlans: EmergencyPlan[] = [
  {
    id: 'PLAN-001', name: 'DDoS攻击应急响应预案', category: 'ddos_attack', version: 'v3.2',
    description: '针对各类DDoS攻击的标准化应急响应流程，涵盖识别、遏制、根除、恢复各阶段的具体操作步骤。',
    steps: ['事件发现与报告', '攻击类型识别与评估', '启动应急小组', '流量清洗与牵引', '服务降级与切换', '攻击源追踪', '服务恢复验证', '事后总结改进'],
    contacts: [
      { role: '应急总指挥', name: '张伟', phone: '+86-138-0001-0001' },
      { role: '技术负责人', name: '王芳', phone: '+86-138-0002-0002' },
      { role: '云厂商对接人', name: '李明', phone: '+86-138-0003-0003' },
      { role: '公关负责人', name: '赵军', phone: '+86-138-0004-0004' },
    ],
    lastUpdated: '2024-05-20',
  },
  {
    id: 'PLAN-002', name: '数据泄露应急响应预案', category: 'data_leak', version: 'v2.1',
    description: '数据泄露事件的应急响应流程，包括泄露范围评估、止损措施、通报机制和后续整改要求。',
    steps: ['泄露发现与确认', '影响范围评估', '紧急止损措施', '监管机构通报', '用户通知', '取证与溯源', '系统加固', '复盘改进'],
    contacts: [
      { role: '应急总指挥', name: '张伟', phone: '+86-138-0001-0001' },
      { role: '法务负责人', name: '赵军', phone: '+86-138-0004-0004' },
      { role: '技术负责人', name: '王芳', phone: '+86-138-0002-0002' },
    ],
    lastUpdated: '2024-04-15',
  },
  {
    id: 'PLAN-003', name: '区块链安全事件预案', category: 'blockchain_incident', version: 'v1.5',
    description: '针对智能合约漏洞利用、链上攻击、私钥泄露等区块链特有安全事件的应急响应预案。',
    steps: ['链上异常检测', '攻击模式分析', '合约暂停/紧急升级', '资产追踪冻结', '用户公告', '损失评估', '链上修复', '事后审计'],
    contacts: [
      { role: '区块链安全专家', name: '李明', phone: '+86-138-0003-0003' },
      { role: '法务顾问', name: '赵军', phone: '+86-138-0004-0004' },
      { role: '技术负责人', name: '王芳', phone: '+86-138-0002-0002' },
    ],
    lastUpdated: '2024-06-01',
  },
];

// 事件统计图表
const incidentStatsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['新建', '处理中', '已关闭'] },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { name: '新建', type: 'bar', stack: 'total', data: [3, 5, 2, 4, 6, 2, 3], itemStyle: { color: '#DC2626' } },
    { name: '处理中', type: 'bar', stack: 'total', data: [2, 3, 4, 3, 2, 1, 2], itemStyle: { color: '#F59E0B' } },
    { name: '已关闭', type: 'bar', stack: 'total', data: [2, 3, 2, 4, 5, 3, 1], itemStyle: { color: '#16A34A' } },
  ],
};

export default function IncidentResponsePage() {
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<IncidentTicket | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');

  // 更新事件状态
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncidentStatus }) => {
      await new Promise(r => setTimeout(r, 400));
      return { id, status };
    },
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const filteredIncidents = mockIncidents.filter(inc => {
    const matchStatus = !statusFilter || inc.status === statusFilter;
    const matchSeverity = !severityFilter || inc.severity === severityFilter;
    return matchStatus && matchSeverity;
  });

  // 处理步骤配置
  const stepsConfig = [
    { title: '事件发现', icon: <ExclamationCircleOutlined /> },
    { title: '初步评估', icon: <EyeOutlined /> },
    { title: '遏制控制', icon: <WarningOutlined /> },
    { title: '根除处理', icon: <ToolOutlined /> },
    { title: '恢复业务', icon: <CarOutlined /> },
    { title: '验证确认', icon: <CheckCircleOutlined /> },
    { title: '结案归档', icon: <FileTextOutlined /> },
  ];

  // 表格列
  const columns = [
    { title: '事件ID', dataIndex: 'id', key: 'id', width: 150, render: (id: string) => <span className="font-mono text-xs font-bold text-blue-600">{id}</span> },
    {
      title: '事件标题', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (title: string, record: IncidentTicket) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-400 mt-1">{{ security_breach: '安全入侵', ddos_attack: 'DDoS攻击', malware: '恶意软件', data_leak: '数据泄露', phishing: '钓鱼攻击', fraud: '交易欺诈', blockchain_incident: '区块链事件', insider_threat: '内部威胁' }[record.type]}</div>
        </div>
      ),
    },
    {
      title: '级别', dataIndex: 'severity', key: 'severity', width: 80,
      render: (sev: IncidentSeverity) => <Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'green' }[sev]}>{{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[sev]}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: IncidentStatus) => {
        const colors: Record<IncidentStatus, string> = { new: 'red', assigned: 'blue', investigating: 'processing', containing: 'orange', eradicating: 'purple', recovering: 'cyan', closed: 'green' };
        const texts: Record<IncidentStatus, string> = { new: '新建', assigned: '已分配', investigating: '调查中', containing: '遏制中', eradicating: '处理中', recovering: '恢复中', closed: '已关闭' };
        return <Badge status={colors[status] as any} text={texts[status]} />;
      },
    },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 100, render: (name: string) => name || <Text type="secondary">待分配</Text> },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '进度', key: 'progress', width: 120,
      render: (_: any, record: IncidentTicket) => (
        <Progress percent={Math.round((record.currentStep / 7) * 100)} size="small" status={record.status === 'closed' ? 'success' : 'active'} />
      ),
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, record: IncidentTicket) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedIncident(record); setDetailVisible(true); }}>详情</Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <ThunderboltOutlined className="text-2xl text-yellow-600" />
          <h1 className="text-2xl font-bold m-0">应急响应中心</h1>
          <Badge count={mockIncidents.filter(i => i.severity === 'critical').length} style={{ backgroundColor: '#B91C1C' }} />
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="今日事件" value={6} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#DC2626' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="处理中" value={mockIncidents.filter(i => !['closed', 'new'].includes(i.status)).length} valueStyle={{ color: '#F59E0B' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="平均响应" value={12.5} suffix="分钟" precision={1} valueStyle={{ color: '#1677FF' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="本周结案" value={8} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#16A34A' }} /></Card></Col>
        </Row>

        {/* 图表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="近7天事件趋势" className="shadow-sm">
              <SafeECharts option={incidentStatsOption} style={{ height: 250 }} title="事件趋势" />
            </Card>
          </Col>
        </Row>

        {/* 事件工单列表 */}
        <Card title="应急事件工单" className="shadow-sm" extra={<Button type="primary" icon={<PlusOutlined />}>创建工单</Button>}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select placeholder="状态筛选" style={{ width: 130 }} allowClear value={statusFilter || undefined} onChange={setStatusFilter} options={[
              { label: '新建', value: 'new' }, { label: '已分配', value: 'assigned' }, { label: '调查中', value: 'investigating' },
              { label: '遏制中', value: 'containing' }, { label: '处理中', value: 'eradicating' }, { label: '恢复中', value: 'recovering' }, { label: '已关闭', value: 'closed' },
            ]} />
            <Select placeholder="级别筛选" style={{ width: 120 }} allowClear value={severityFilter || undefined} onChange={setSeverityFilter} options={[
              { label: '严重', value: 'critical' }, { label: '高危', value: 'high' }, { label: '中危', value: 'medium' }, { label: '低危', value: 'low' },
            ]} />
            <span className="text-sm text-gray-500 ml-auto">共 {filteredIncidents.length} 个事件</span>
          </div>
          <Table dataSource={filteredIncidents} columns={columns} rowKey="id" pagination={{ pageSize: 6 }} size="middle" />
        </Card>

        {/* 应急预案模板 */}
        <Card title="应急预案模板库" className="shadow-sm">
          <List
            grid={{ gutter: 16, column: 3 }}
            dataSource={mockPlans}
            renderItem={plan => (
              <List.Item>
                <Card size="small" hoverable className="h-full">
                  <div className="flex items-start justify-between mb-2">
                    <Tag color="blue">{plan.version}</Tag>
                    <Text type="secondary" className="text-xs">更新: {plan.lastUpdated}</Text>
                  </div>
                  <h4 className="font-bold m-0 mb-2">{plan.name}</h4>
                  <p className="text-sm text-gray-500 m-0 mb-3 line-clamp-2">{plan.description}</p>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400">响应步骤: {plan.steps.length} 步</div>
                    <div className="text-xs text-gray-400">联系人: {plan.contacts.length} 人</div>
                  </div>
                  <div className="mt-3 pt-2 border-t flex justify-between items-center">
                    <Space size={4}>
                      {plan.contacts.slice(0, 3).map(c => (
                        <Tooltip key={c.role} title={`${c.role}: ${c.phone}`}>
                          <Avatar size={24} icon={<UserOutlined />} className="bg-blue-100 text-blue-600" />
                        </Tooltip>
                      ))}
                    </Space>
                    <Button type="link" size="small" icon={<EyeOutlined />}>查看预案</Button>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Card>

        {/* 事件详情弹窗 */}
        <Modal
          title={`事件详情 - ${selectedIncident?.id || ''}`}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          width={850}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
            selectedIncident?.status !== 'closed' && <Button key="update" type="primary" onClick={() => updateStatusMutation.mutate({ id: selectedIncident!.id, status: 'investigating' })}>推进状态</Button>,
          ]}
        >
          {selectedIncident && (
            <div className="space-y-5">
              {/* 基本信息 */}
              <Alert
                type={selectedIncident.severity === 'critical' ? 'error' : selectedIncident.severity === 'high' ? 'warning' : 'info'}
                showIcon
                message={<span className="font-bold">{selectedIncident.title}</span>}
                description={selectedIncident.description}
              />

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="事件ID"><span className="font-mono font-bold">{selectedIncident.id}</span></Descriptions.Item>
                <Descriptions.Item label="事件类型">{{ security_breach: '安全入侵', ddos_attack: 'DDoS攻击', malware: '恶意软件', data_leak: '数据泄露', phishing: '钓鱼攻击', fraud: '交易欺诈', blockchain_incident: '区块链事件', insider_threat: '内部威胁' }[selectedIncident.type]}</Descriptions.Item>
                <Descriptions.Item label="严重程度"><Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'green' }[selectedIncident.severity]}>{{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[selectedIncident.severity]}</Tag></Descriptions.Item>
                <Descriptions.Item label="当前状态"><Badge status={{ new: 'error', assigned: 'blue', investigating: 'processing', containing: 'orange', eradicating: 'purple', recovering: 'cyan', closed: 'green' }[selectedIncident.status] as any} text={{ new: '新建', assigned: '已分配', investigating: '调查中', containing: '遏制中', eradicating: '处理中', recovering: '恢复中', closed: '已关闭' }[selectedIncident.status]} /></Descriptions.Item>
                <Descriptions.Item label="负责人">{selectedIncident.assignee || '待分配'} ({selectedIncident.department})</Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedIncident.createdAt}</Descriptions.Item>
                <Descriptions.Item label="影响范围" span={2}>{selectedIncident.impactScope}</Descriptions.Item>
                <Descriptions.Item label="受影响资产" span={2}>{selectedIncident.affectedAssets.map(a => <Tag key={a} color="red">{a}</Tag>)}</Descriptions.Item>
              </Descriptions>

              {/* 处理流程可视化 */}
              <div>
                <h4 className="font-bold mb-3">处理流程</h4>
                <Steps current={selectedIncident.currentStep - 1} items={stepsConfig.map(s => ({ ...s }))} />
              </div>

              {/* 操作时间线 */}
              <div>
                <h4 className="font-bold mb-3">操作记录</h4>
                <Timeline
                  items={selectedIncident.stepHistory.map(h => ({
                    color: h.step === selectedIncident.currentStep ? 'blue' : 'green',
                    children: (
                      <div>
                        <strong>步骤{h.step}: {stepsConfig[h.step - 1]?.title}</strong>
                        <br /><span className="text-gray-500 text-xs">{h.time} | 操作人: {h.operator}</span>
                        <br /><span className="text-sm mt-1 block">{h.note}</span>
                      </div>
                    ),
                  }))}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-yellow-500 mt-1" />
            <div>
              <h4 className="font-bold text-yellow-700 m-0 mb-1">应急响应SLA标准</h4>
              <p className="text-sm text-yellow-600 m-0">
                中萨数字科技交易所应急响应遵循以下SLA标准：
                严重(Critical): 5分钟内响应，30分钟内开始遏制；
                高危(High): 15分钟内响应，1小时内开始处理；
                中危(Medium): 30分钟内响应，4小时内开始处理。
                所有严重和高危事件必须由安全负责人审批后才能结案。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
