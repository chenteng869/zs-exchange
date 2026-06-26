'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message } from 'antd';
import { AlertOutlined, ThunderboltOutlined, DashboardOutlined, ClockCircleOutlined, AimOutlined, EyeOutlined, SettingOutlined, WarningOutlined, CheckCircleOutlined, ExperimentOutlined, RadarChartOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockEvents = [
  { id: 'AE-001', detectorName: '价格异常检测器-IQR', severity: 'critical', eventType: '价格骤降', description: 'BTC在15分钟内下跌超过8%', detectedAt: '2024-06-23 09:25', status: 'confirmed', responseTime: 12, value: -8.3, threshold: 5 },
  { id: 'AE-002', detectorName: '交易量异常-IsolationForest', severity: 'high', eventType: '异常大额交易', description: '检测到单笔500万USDT异常转账', detectedAt: '2024-06-23 08:42', status: 'investigating', responseTime: 35, value: 5000000, threshold: 1000000 },
  { id: 'AE-003', detectorName: 'API调用频率-ZScore', severity: 'medium', eventType: 'API突发流量', description: '某API Key请求频率突增300%', detectedAt: '2024-06-23 07:58', status: 'resolved', responseTime: 8, value: 300, threshold: 200 },
  { id: 'AE-004', detectorName: '链上监控-启发式', severity: 'low', eventType: '大额钱包异动', description: '鲸鱼地址转移2000ETH', detectedAt: '2024-06-23 07:15', status: 'monitoring', responseTime: 0, value: 2000, threshold: 1000 },
  { id: 'AE-005', detectorName: '用户行为-LSTM-AE', severity: 'high', eventType: '账号异常操作', description: '用户短时间内修改密码+绑定新设备+大额提现', detectedAt: '2024-06-23 06:30', status: 'confirmed', responseTime: 45, value: 3, threshold: 2 },
  { id: 'AE-006', detectorName: '流动性监控-统计模型', severity: 'critical', eventType: '流动性枯竭预警', description: 'USDT/ETH池深度降至历史低位15%', detectedAt: '2024-06-23 05:45', status: 'investigating', responseTime: 28, value: 15, threshold: 30 },
  { id: 'AE-007', detectorName: '智能合约-符号执行', severity: 'medium', eventType: '可疑合约交互', description: '某地址批量调用未审计合约的transfer方法', detectedAt: '2024-06-23 04:20', status: 'resolved', responseTime: 120, value: 150, threshold: 50 },
  { id: 'AE-008', detectorName: '市场情绪-NLP', severity: 'low', eventType: '舆情异常波动', description: '社交媒体负面情绪指数飙升', detectedAt: '2024-06-23 03:10', status: 'monitoring', responseTime: 0, value: -0.35, threshold: -0.2 },
  { id: 'AE-009', detectorName: 'Gas费用-Prophet', severity: 'high', eventType: 'Gas异常峰值', description: '网络Gas价格突然飙升至500Gwei', detectedAt: '2024-06-23 02:00', status: 'confirmed', responseTime: 18, value: 500, threshold: 100 },
  { id: 'AE-010', detectorName: 'KYC异常-规则引擎', severity: 'medium', eventType: '身份欺诈尝试', description: '同一IP短时间注册多个账号并完成KYC', detectedAt: '2024-06-23 01:30', status: 'resolved', responseTime: 95, value: 5, threshold: 3 },
];

const severityConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  critical: { color: '#DC2626', text: '严重', bgColor: '#FEE2E2' },
  high: { color: '#F59E0B', text: '高危', bgColor: '#FEF3C7' },
  medium: { color: '#1677FF', text: '中等', bgColor: '#DBEAFE' },
  low: { color: '#06B6D4', text: '低危', bgColor: '#ECFEFF' },
};

export default function AnomalyDetectionPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { data: events, isLoading } = useQuery({ queryKey: ['anomaly-events'], queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockEvents; } });

  const getSeverityTag = (sev: string) => { const c = severityConfig[sev]; return c ? <Tag color={c.color} style={{ color: '#fff' }}>{c.text}</Tag> : <Tag>{sev}</Tag>; };
  const getStatusBadge = (st: string) => {
    const map: Record<string, { status: string; text: string }> = { confirmed: { status: 'error', text: '已确认' }, investigating: { status: 'warning', text: '调查中' }, resolved: { status: 'success', text: '已解决' }, monitoring: { status: 'processing', text: '监控中' } };
    const item = map[st] || { status: 'default', text: st }; return <Badge status={item.status as any} text={item.text} />;
  };

  const columns = [
    { title: '事件ID', dataIndex: 'id', key: 'id', width: 130, render: (t: string) => <Text code className="text-xs">{t}</Text> },
    { title: '检测器', dataIndex: 'detectorName', key: 'detectorName', width: 200, render: (n: string) => <Text strong className="text-sm">{n}</Text> },
    { title: '严重程度', dataIndex: 'severity', key: 'severity', width: 100, render: (s: string) => getSeverityTag(s) },
    { title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 140, render: (t: string) => <Tag color="volcano">{t}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true, render: (d: string) => <Tooltip title={d}><Text type="secondary" className="cursor-pointer">{d}</Text></Tooltip> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => getStatusBadge(s) },
    { title: '检测时间', dataIndex: 'detectedAt', key: 'detectedAt', width: 150 },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (e: any) => { setSelectedEvent(e); setDetailOpen(true); } },
    { key: 'config', label: '规则配置', icon: <SettingOutlined />, hidden: (e: any) => e.status === 'resolved', onClick: (e: any) => { message.info(`配置 ${e.detectorName}`); } },
  ];

  const todayAnomalies = events?.filter(e => e.severity === 'critical' || e.severity === 'high').length || 0;
  const falsePositiveRate = 3.2;
  const avgLatency = events?.filter(e => e.responseTime > 0).reduce((s: number, e: any) => s + e.responseTime, 0) / (events?.filter(e => e.responseTime > 0).length || 1);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><AlertOutlined className="text-3xl text-red-500" /><div><Title level={3} className="!mb-0">异常检测中心</Title><Text type="secondary">算法管理 · 告警规则 · 案例库</Text></div></div>
          <Space><Button icon={<RadarChartOutlined />}>检测器面板</Button><Button type="primary" icon={<ExperimentOutlined />}>新建检测器</Button></Space>
        </div>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="检测器数量" value={new Set(events?.map(e => e.detectorName)).size || 0} icon={<DashboardOutlined />} color="#1677FF" suffix="个" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="今日异常" value={todayAnomalies} icon={<WarningOutlined />} color="#DC2626" suffix="件" trend="up" trendValue="+3" description="高危以上事件" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="误报率" value={falsePositiveRate} icon={<AimOutlined />} color="#F59E0B" suffix="%" trend="down" trendValue="-0.8%" description="近7日平均值" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="平均检测延迟" value={avgLatency.toFixed(0)} icon={<ClockCircleOutlined />} color="#7C3AED" suffix="秒" description="从发现到告警" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="覆盖面" value={94.6} icon={<RadarChartOutlined />} color="#06B6D4" suffix="%" description="核心场景覆盖率" /></Col>
        </Row>

        <Card title="异常事件列表" className="shadow-sm" extra={<Space><Badge count={events?.filter(e => e.severity === 'critical').length || 0} style={{ backgroundColor: '#DC2626' }}><Tag color="red">严重</Tag></Badge><Tag color="blue">共 {events?.length || 0} 条</Tag></Space>}>
          <DataTable columns={columns} dataSource={events || []} loading={isLoading} actions={actions} rowKey="id" showSearch searchPlaceholder="搜索事件或检测器" showFilter filterOptions={[{ label: '全部级别', value: '' }, { label: '严重', value: 'critical' }, { label: '高危', value: 'high' }, { label: '中等', value: 'medium' }, { label: '低危', value: 'low' }]} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 条事件` }} />
        </Card>

        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><WarningOutlined /><span>严重程度分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {Object.entries(severityConfig).map(([key, cfg]) => { const count = events?.filter(e => e.severity === key).length || 0; const pct = (count / (events?.length || 1)) * 100; return (<div key={key}><div className="flex justify-between mb-1"><Tag color={cfg.color} style={{ color: '#fff' }}>{cfg.text}</Tag><Text strong>{count} ({pct.toFixed(0)}%)</Text></div><Progress percent={pct} strokeColor={cfg.color} size="small" showInfo={false} /></div>); })}
                <Divider /><Alert type="warning" showIcon message="今日需关注" description={`${todayAnomalies} 个高危以上异常待处理，建议优先处理严重级别事件`} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><ExperimentOutlined /><span>检测能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert type="error" showIcon banner message="多层次异常检测体系" description="融合统计学方法、机器学习、深度学习和规则引擎的多维异常检测框架，实现全方位风险感知" />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4"><Text strong>核心能力：</Text><ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                  <li><DashboardOutlined className="mr-2 text-blue-500" /> 多算法集成：IQR/Z-Score/IsolationForest/LSTM-AE等10+检测算法</li>
                  <li><ThunderboltOutlined className="mr-2 text-green-500" /> 实时检测：流式数据处理，平均检测延迟 &lt; 30秒</li>
                  <li><SettingOutlined className="mr-2 text-orange-500" /> 灵活告警：支持多级告警策略、升级机制、静默期配置</li>
                  <li><CheckCircleOutlined className="mr-2 text-purple-500" /> 闭环处理：从检测→确认→处置→归档的全流程跟踪</li>
                  <li><RadarChartOutlined className="mr-2 text-red-500" /> 自适应学习：根据反馈持续优化检测阈值，降低误报率</li>
                </ul></div>
                <div className="bg-red-50 rounded-lg p-3 mt-3"><Text type="secondary" className="text-sm"><AlertOutlined className="mr-1 text-red-500" /> 7×24小时监控 | 多通道通知 | 自动升级机制</Text></div>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`异常详情 - ${selectedEvent?.id || ''}`} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>, <Button key="handle" type="primary" icon={<ThunderboltOutlined />} onClick={() => { message.success('已转交给安全团队'); setDetailOpen(false); }}>立即处置</Button>]} width={700}>
          {selectedEvent && (<div className="space-y-4 mt-4"><Row gutter={[16, 16]}><Col span={12}><Statistic title="检测器" value={selectedEvent.detectorName} valueStyle={{ fontSize: 14 }} /></Col><Col span={12}><Statistic title="事件类型" value="" prefix={<Tag color="volcano">{selectedEvent.eventType}</Tag>} /></Col><Col span={8}><Statistic title="严重程度" value="" prefix={getSeverityTag(selectedEvent.severity)} /></Col><Col span={8}><Statistic title="当前状态" value="" prefix={getStatusBadge(selectedEvent.status)} /></Col><Col span={8}><Statistic title="响应时间" value={selectedEvent.responseTime} suffix="秒" /></Col></Row><Divider /><Alert type="error" showIcon message="事件描述" description={selectedEvent.description} /><Row gutter={[16, 16]} className="mt-3"><Col span={12}><Statistic title="异常值" value={selectedEvent.value} valueStyle={{ color: '#DC2626' }} /></Col><Col span={12}><Statistic title="阈值" value={selectedEvent.threshold} /></Col></Row><Text type="secondary">检测时间：{selectedEvent.detectedAt}</Text></div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
