'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col, Statistic,
  Tabs, message, Progress, Alert, Tooltip, Select,
} from 'antd';
import {
  EyeOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, DashboardOutlined,
  BarChartOutlined, ThunderboltOutlined, AlertOutlined, FireOutlined,
  ExclamationCircleOutlined, FundOutlined, LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 流程监控概览统计
const overviewStats = { running: 4, completed: 156, terminated: 3, timeout: 1, totalToday: 164 };

// 各流程效率对比数据
const processEfficiencyOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['平均耗时(分钟)', '通过率(%)'], bottom: 0 },
  grid: { left: '3%', right: '8%', bottom: '15%', containLabel: true },
  xAxis: { type: 'category', data: ['KYC认证', '提现审批', 'NFT上架', '异常交易', '项目入驻'] },
  yAxis: [
    { type: 'value', name: '耗时(分钟)', position: 'left' },
    { type: 'value', name: '通过率(%)', min: 70, max: 100, position: 'right' },
  ],
  series: [
    { name: '平均耗时(分钟)', type: 'bar', data: [18, 45, 135, 240, 7200], itemStyle: { color: '#1677FF' }, barWidth: '30%' },
    { name: '通过率(%)', type: 'line', yAxisIndex: 1, data: [98, 95, 88, 82, 75], itemStyle: { color: '#16A34A' }, smooth: true },
  ],
};

// 瓶颈节点TOP5数据
const bottleneckData = [
  { rank: 1, nodeName: '人工初审 (NFT上架)', processName: 'NFT上架审批流程', avgStayTime: '4h32m', stayCount: 128, percentage: 35.2, slaStatus: 'breach', healthScore: 42 },
  { rank: 2, nodeName: '终审批准 (NFT上架)', processName: 'NFT上架审批流程', avgStayTime: '2h15m', stayCount: 98, percentage: 22.5, slaStatus: 'warning', healthScore: 65 },
  { rank: 3, nodeName: '财务复核 (提现)', processName: '用户提现审批流程', avgStayTime: '1h48m', stayCount: 256, percentage: 18.6, slaStatus: 'ok', healthScore: 78 },
  { rank: 4, nodeName: '调查取证 (异常交易)', processName: '异常交易处理流程', avgStayTime: '3h05m', stayCount: 45, percentage: 12.8, slaStatus: 'warning', healthScore: 58 },
  { rank: 5, nodeName: '人工复审 (KYC)', processName: 'KYC认证流程', avgStayTime: '52m', stayCount: 892, percentage: 6.2, slaStatus: 'ok', healthScore: 85 },
];

// 实时执行量趋势
const realtimeTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增实例', '完成实例', '异常实例'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
  xAxis: { type: 'category', data: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] },
  yAxis: { type: 'value' },
  series: [
    { name: '新增实例', type: 'line', smooth: true, data: [12, 28, 35, 22, 8, 18, 30, 25], areaStyle: { opacity: 0.15 }, itemStyle: { color: '#1677FF' } },
    { name: '完成实例', type: 'line', smooth: true, data: [10, 25, 30, 20, 12, 15, 28, 22], areaStyle: { opacity: 0.15 }, itemStyle: { color: '#16A34A' } },
    { name: '异常实例', type: 'line', smooth: true, data: [0, 1, 0, 2, 0, 1, 0, 0], itemStyle: { color: '#DC2626' } },
  ],
};

// 告警列表
const mockAlerts = [
  { id: 'alert-001', instanceId: 'PROC-20240608-0004', processName: 'NFT上架审批流程', alertType: '超时预警', level: 'warning', message: '实例在「人工初审」节点停留超过5小时，已超出SLA阈值(4h)', triggeredAt: '2024-06-08 14:30', status: 'unresolved', handler: null },
  { id: 'alert-002', instanceId: 'PROC-20240608-0007', processName: '用户提现审批流程', alertType: '异常终止', level: 'error', message: '因风控规则触发自动终止，原因：检测到关联黑名单账户', triggeredAt: '2024-06-08 13:15', status: 'processing', handler: '王强' },
  { id: 'alert-003', instanceId: 'PROC-20240608-0009', processName: 'KYC认证流程', alertType: '系统错误', level: 'error', message: '三方API核验服务响应超时，已触发重试机制（第2/3次）', triggeredAt: '2024-06-08 12:42', status: 'resolved', handler: '张伟' },
  { id: 'alert-004', instanceId: 'PROC-20240608-0012', processName: '项目入驻申请流程', alertType: '资源不足', level: 'warning', message: '流程引擎线程池使用率达92%，建议扩容或优化并发配置', triggeredAt: '2024-06-08 11:00', status: 'resolved', handler: '陈浩' },
  { id: 'alert-005', instanceId: 'PROC-20240608-0015', processName: '合规审查工作流', alertType: 'SLA预警', level: 'warning', message: '「法务审核」节点接近SLA上限（剩余2小时）', triggeredAt: '2024-06-08 14:45', status: 'unresolved', handler: null },
  { id: 'alert-006', instanceId: 'PROC-20240608-0018', processName: '用户投诉处理流程', alertType: '堆积告警', level: 'info', message: '客服响应节点待办任务堆积达15件，超过阈值(10件)', triggeredAt: '2024-06-08 14:00', status: 'unresolved', handler: null },
  { id: 'alert-007', instanceId: 'PROC-20240608-0020', processName: '资金清算对账流程', alertType: '数据异常', level: 'error', message: '对账结果发现3笔金额不一致，需人工核查', triggeredAt: '2024-06-08 03:15', status: 'resolved', handler: '系统自动' },
  { id: 'alert-008', instanceId: 'PROC-20240608-0022', processName: 'API密钥轮换流程', alertType: '安全告警', level: 'error', message: '检测到异常登录IP尝试访问密钥管理接口', triggeredAt: '2024-06-08 13:20', status: 'processing', handler: '安全团队' },
];

export default function BPMMonitoringPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [levelFilter, setLevelFilter] = useState<string>('');

  const getLevelColor = (level: string) => ({ error: 'red', warning: 'orange', info: 'blue' }[level] || 'default');
  const getLevelLabel = (level: string) => ({ error: '严重', warning: '警告', info: '信息' }[level] || level);

  const getSlaStatus = (s: string) => ({ breach: { color: 'error', text: '违规' }, warning: { color: 'warning', text: '预警' }, ok: { color: 'success', text: '正常' } }[s] || { color: 'default', text: s });

  // 监控表格列
  const monitorColumns = [
    { title: '流程名称', dataIndex: 'processName', key: 'processName', render: (v: string) => <span className="font-medium">{v}</span> },
    { title: '运行实例', key: 'running', width: 100, render: () => <Tag color="blue">运行中</Tag> },
    { title: '健康度', key: 'health', width: 140, render: () => <Progress percent={78} size="small" status="normal" format={() => '78分'} /> },
    { title: 'SLA达标率', key: 'sla', width: 110, render: () => <Progress percent={94} size="small" status="success" format={() => '94%'} /> },
    { title: '平均周期', key: 'cycle', width: 100, render: () => '2h15m' },
    { title: '瓶颈节点', key: 'bottleneck', width: 140, render: () => <Tag color="orange">人工初审</Tag> },
    { title: '今日异常', key: 'errors', width: 100, render: () => <span className="text-red-500">2 次</span> },
  ];

  // 告警表格列
  const alertColumns = [
    { title: '级别', dataIndex: 'level', key: 'level', width: 90, render: (l: string) => <Tag color={getLevelColor(l)} icon={<WarningOutlined />}>{getLevelLabel(l)}</Tag> },
    { title: '类型', dataIndex: 'alertType', key: 'alertType', width: 110, render: (v: string) => <Tag>{v}</Tag> },
    { title: '关联实例', dataIndex: 'instanceId', key: 'instanceId', width: 180, render: (v: string) => <code className="text-xs">{v}</code> },
    { title: '告警内容', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => (
      <Badge status={s === 'resolved' ? 'success' : s === 'processing' ? 'processing' : 'error'} text={s === 'resolved' ? '已解决' : s === 'processing' ? '处理中' : '待处理'} />
    )},
    { title: '处理人', dataIndex: 'handler', key: 'handler', width: 90, render: (v: string | null) => v || <span className="text-gray-400">-</span> },
  ];

  const alertActions: any[] = [
    { key: 'handle', label: '处理', icon: <EyeOutlined />, type: 'primary', onClick: () => message.success('已指派处理') },
  ];

  // 瓶颈分析列
  const bottleneckColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 70, render: (r: number) => (
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold ${r === 1 ? 'bg-red-500' : r === 2 ? 'bg-orange-400' : r === 3 ? 'bg-yellow-500' : 'bg-gray-300 text-gray-600'}`}>{r}</span>
    )},
    { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName', render: (v: string) => <span className="font-medium">{v}</span> },
    { title: '所属流程', dataIndex: 'processName', key: 'processName', width: 160, render: (v: string) => <Tag>{v}</Tag> },
    { title: '平均停留', dataIndex: 'avgStayTime', key: 'avgStayTime', width: 110, render: (v: string) => <span className="text-red-500 font-semibold">{v}</span> },
    { title: '占比', dataIndex: 'percentage', key: 'percentage', width: 100, render: (v: number) => <Progress percent={v} size="small" format={() => `${v}%`} /> },
    { title: 'SLA状态', dataIndex: 'slaStatus', key: 'slaStatus', width: 100, render: (s: string) => { const st = getSlaStatus(s); return <Badge status={st.color as any} text={st.text} />; }},
    { title: '健康评分', dataIndex: 'healthScore', key: 'healthScore', width: 110, render: (v: number) => (
      <Progress percent={v} size="small" status={v >= 80 ? 'success' : v >= 60 ? 'normal' : 'exception'} format={() => `${v}分`} />
    )},
  ];

  const filteredAlerts = (levelFilter ? mockAlerts.filter(a => a.level === levelFilter) : mockAlerts);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DashboardOutlined className="text-red-500" />
              流程监控中心
            </h1>
            <p className="text-gray-500 mt-1">流程性能监控、瓶颈分析、SLA追踪与实时告警</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.info('监控数据已刷新')}>刷新</Button>
          </Space>
        </div>

        {/* 核心统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="监控流程数" value={5} icon={<FundOutlined />} color="#1677FF" suffix="个" description="活跃流程模板" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="平均周期" value={2.8} icon={<ClockCircleOutlined />} color="#16A34A" suffix="小时" trend="down" trendValue="-12% 较上周" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="SLA达标率" value={94.2} icon={<CheckCircleOutlined />} color="#7C3AED" suffix="%" description="近7日均值" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="瓶颈节点" value={2} icon={<FireOutlined />} color="#DC2626" suffix="个" description="需重点关注" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="异常告警" value={mockAlerts.filter(a => a.status !== 'resolved').length} icon={<ExclamationCircleOutlined />} color="#F59E0B" description="未解决告警" />
          </Col>
        </Row>

        {/* 未处理告警横幅 */}
        {mockAlerts.filter(a => a.status === 'unresolved').length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<ThunderboltOutlined />}
            message={`当前有 ${mockAlerts.filter(a => a.status === 'unresolved').length} 条未处理的告警`}
            description={mockAlerts.find(a => a.status === 'unresolved')?.message}
            action={<Button size="small" danger onClick={() => setActiveTab('alerts')}>立即处理</Button>}
            className="shadow-sm"
          />
        )}

        {/* 主要内容区 Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'overview',
            label: <span><BarChartOutlined /> 运行概况</span>,
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="各流程效率对比" className="shadow-sm" size="small">
                    <SafeECharts option={processEfficiencyOption} style={{ height: 340 }} title="效率对比" />
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card title="实时执行趋势" className="shadow-sm" size="small">
                    <SafeECharts option={realtimeTrendOption} style={{ height: 340 }} title="实时趋势" />
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'monitoring',
            label: <span><LineChartOutlined /> 流程监控</span>,
            children: (
              <DataTable
                columns={monitorColumns}
                dataSource={Array.from({ length: 5 }, (_, i) => ({ id: `mon-${i + 1}` }))}
                title="流程健康监控列表"
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'bottleneck',
            label: <span><FireOutlined /> 瓶颈分析</span>,
            children: (
              <Card title="平均停留时间最长节点 TOP5" className="shadow-sm" size="small" extra={<Tag color="red">需重点关注</Tag>}>
                <Table dataSource={bottleneckData} columns={bottleneckColumns} rowKey="rank" pagination={false} size="middle" />
              </Card>
            ),
          },
          {
            key: 'alerts',
            label: <span><AlertOutlined /> 告警中心 ({mockAlerts.length})</span>,
            children: (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Select placeholder="等级筛选" style={{ width: 120 }} allowClear value={levelFilter || undefined} onChange={setLevelFilter} options={[
                    { label: '严重', value: 'error' }, { label: '警告', value: 'warning' }, { label: '信息', value: 'info' },
                  ]} />
                </div>
                <DataTable
                  columns={alertColumns}
                  dataSource={filteredAlerts}
                  title="告警事件列表"
                  actions={alertActions}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                />
              </div>
            ),
          },
        ]} />

        {/* 业务特性说明 */}
        <Card className="shadow-sm bg-gradient-to-r from-red-50 to-orange-50" size="small">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 text-lg mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">全链路 SLA 监控体系</h4>
              <p className="text-sm text-gray-600">覆盖流程定义→实例运行→节点停留的全链路监控。自动识别瓶颈节点、预测SLA违约风险并提前告警。支持自定义SLA规则、多级升级策略和历史趋势回溯分析。</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
