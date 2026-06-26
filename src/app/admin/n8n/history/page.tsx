'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Table, Descriptions, Statistic, Badge, Typography, Tooltip, message, Progress, Alert, Divider, Timeline,
} from 'antd';
import {
  HistoryOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined, FilterOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, SyncOutlined, WarningOutlined,
  PlayCircleOutlined, FileTextOutlined, ThunderboltOutlined, CalendarOutlined,
  LineChartOutlined, SafetyCertificateOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟执行历史数据
const mockExecutions = [
  {
    id: 'EXEC-001', workflowName: '安全事件响应', workflowId: 'WF-001', status: 'success',
    startTime: '2024-06-08 14:32:15', endTime: '2024-06-08 14:32:20', duration: '5.04s',
    triggeredBy: 'webhook', nodesRun: 6, nodesSuccess: 6, tokensUsed: 2340, cost: '$0.023',
    executionId: 'exec_abc123def456',
  },
  {
    id: 'EXEC-002', workflowName: 'KYC自动验证', workflowId: 'WF-003', status: 'success',
    startTime: '2024-06-08 14:30:00', endTime: '2024-06-08 14:30:12', duration: '12.38s',
    triggeredBy: 'schedule', nodesRun: 5, nodesSuccess: 5, tokensUsed: 5890, cost: '$0.058',
    executionId: 'exec_ghi789jkl012',
  },
  {
    id: 'EXEC-003', workflowName: '交易风控检测', workflowId: 'WF-001', status: 'success',
    startTime: '2024-06-08 14:29:58', endTime: '2024-06-08 14:29:59', duration: '0.89s',
    triggeredBy: 'realtime', nodesRun: 4, nodesSuccess: 4, tokensUsed: 450, cost: '$0.004',
    executionId: 'exec_mno345pqr678',
  },
  {
    id: 'EXEC-004', workflowName: 'NFT审核流程', workflowId: 'WF-002', status: 'failed',
    startTime: '2024-06-08 14:28:45', endTime: '2024-06-08 14:29:03', duration: '18.22s',
    triggeredBy: 'webhook', nodesRun: 5, nodesSuccess: 3, tokensUsed: 3200, cost: '$0.032',
    failReason: 'AI审核节点超时：第三方API响应超过15秒阈值',
    executionId: 'exec_stu901vwx234',
  },
  {
    id: 'EXEC-005', workflowName: '结算对账处理', workflowId: 'WF-004', status: 'success',
    startTime: '2024-06-07 02:00:00', endTime: '2024-06-07 02:18:34', duration: '18m 34s',
    triggeredBy: 'schedule', nodesRun: 8, nodesSuccess: 8, tokensUsed: 45600, cost: '$0.456',
    executionId: 'exec_yza567bcd890',
  },
  {
    id: 'EXEC-006', workflowName: '智能合约事件', workflowId: 'WF-005', status: 'success',
    startTime: '2024-06-08 14:27:30', endTime: '2024-06-08 14:27:31', duration: '0.65s',
    triggeredBy: 'blockchain', nodesRun: 3, nodesSuccess: 3, tokensUsed: 120, cost: '$0.001',
    executionId: 'exec_def123ghi456',
  },
  {
    id: 'EXEC-007', workflowName: '邮件营销追踪', workflowId: 'WF-006', status: 'success',
    startTime: '2024-06-08 14:25:12', endTime: '2024-06-08 14:25:14', duration: '2.15s',
    triggeredBy: 'webhook', nodesRun: 4, nodesSuccess: 4, tokensUsed: 890, cost: '$0.009',
    executionId: 'exec_jkl789mno012',
  },
  {
    id: 'EXEC-008', workflowName: '交易风控检测', workflowId: 'WF-001', status: 'warning',
    startTime: '2024-06-08 14:22:00', endTime: '2024-06-08 14:22:08', duration: '8.45s',
    triggeredBy: 'realtime', nodesRun: 4, nodesSuccess: 4, tokensUsed: 1680, cost: '$0.017',
    warningMsg: '风控评分节点延迟偏高(>5s)，建议优化',
    executionId: 'exec_pqr345stu678',
  },
];

const execStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  success: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
  failed: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> },
  running: { color: 'blue', text: '运行中', icon: <SyncOutlined spin /> },
  warning: { color: 'orange', text: '警告', icon: <WarningOutlined /> },
};

const triggerByConfig: Record<string, { color: string; label: string }> = {
  webhook: { color: 'blue', label: 'Webhook' },
  schedule: { color: 'green', label: '定时' },
  realtime: { color: 'cyan', label: '实时流' },
  blockchain: { color: 'purple', label: '链上' },
};

export default function HistoryPage() {
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  const todayTotal = mockExecutions.length;
  const successCount = mockExecutions.filter(e => e.status === 'success').length;
  const failedCount = mockExecutions.filter(e => e.status === 'failed').length;
  const successRate = ((successCount / todayTotal) * 100).toFixed(1);

  const columns = [
    {
      title: '执行记录', key: 'execution', width: 240,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.status === 'success' ? 'bg-green-100 text-green-600' : record.status === 'failed' ? 'bg-red-100 text-red-600' : record.status === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
            {(() => { const cfg = execStatusConfig[record.status]; return cfg?.icon || <ClockCircleOutlined />; })()}
          </div>
          <div><div className="font-semibold text-sm">{record.workflowName}</div><div className="text-xs text-gray-400"><Text code className="!text-xs !bg-transparent">{record.executionId.slice(0, 12)}...</Text></div></div>
        </div>
      ),
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (status: string) => { const cfg = execStatusConfig[status]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : status; } },
    { title: '触发方式', dataIndex: 'triggeredBy', key: 'triggeredBy', width: 90, render: (by: string) => { const cfg = triggerByConfig[by]; return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : by; } },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 150 },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 100, render: (dur: string) => <span className={dur.includes('m') ? 'text-orange-500' : parseFloat(dur) > 10 ? 'text-orange-500' : 'text-green-600'}>{dur}</span> },
    { title: '节点进度', key: 'nodes', width: 120, render: (_: any, r: any) => <span className={r.nodesSuccess === r.nodesRun ? 'text-green-600' : 'text-red-500'}>{r.nodesSuccess}/{r.nodesRun}</span> },
    { title: '费用', dataIndex: 'cost', key: 'cost', width: 80, align: 'right', render: (c: string) => <span className="text-green-600 font-medium">{c}</span> },
    { title: '操作', key: 'actions', width: 100, render: (_: any, r: any) => (<Space size="small"><Tooltip title="查看详情"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedExecution(r); setDetailDrawerVisible(true); }} /></Tooltip>{r.status === 'failed' && <Tooltip title="重试"><Button type="text" size="small" icon={<ReloadOutlined />} className="text-blue-500" onClick={() => message.info('重试请求已发送')} /></Tooltip>}</Space>) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><HistoryOutlined className="text-2xl text-purple-600" /><h1 className="text-2xl font-bold m-0">执行历史</h1></div>
          <Space><Button icon={<DownloadOutlined />}>导出日志</Button><Button icon={<FilterOutlined />}>高级筛选</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="今日执行" value={todayTotal} icon={<ThunderboltOutlined />} color="#1677FF" trend="up" trendValue="+8%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="成功率" value={`${successRate}%`} icon={<CheckCircleOutlined />} color="#16A34A" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均耗时" value="12.5s" icon={<ClockCircleOutlined />} color="#F59E0B" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="失败数" value={failedCount} icon={<CloseCircleOutlined />} color="#DC2626" description="需要关注" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="重试成功" value={2} icon={<ReloadOutlined />} color="#7C3AED" description="自动恢复" /></Col>
        </Row>

        <DataTable columns={columns as any} dataSource={mockExecutions} rowKey="id" title="执行历史列表" showSearch searchPlaceholder="搜索工作流名称或执行ID..." showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '成功', value: 'success' }, { label: '失败', value: 'failed' }, { label: '警告', value: 'warning' }]} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条记录` }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title={<span><LineChartOutlined /> 执行状态分布</span>} className="shadow-sm" size="small">
              <div className="space-y-3">
                {[{ label: '成功执行', count: successCount, color: '#16A34A' }, { label: '执行失败', count: failedCount, color: '#DC2626' }, { label: '带警告完成', count: mockExecutions.filter(e => e.status === 'warning').length, color: '#F59E0B' }].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <Space>{item.label === '成功执行' ? <CheckCircleOutlined className="text-green-500" /> : item.label === '执行失败' ? <CloseCircleOutlined className="text-red-500" /> : <WarningOutlined className="text-orange-500" />}<span>{item.label}</span></Space>
                    <Progress percent={Math.round((item.count / todayTotal) * 100)} strokeColor={item.color} size="small" style={{ flex: 1, marginLeft: 16 }} format={() => `${item.count}`} />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<span><CalendarOutlined /> 今日时间线</span>} className="shadow-sm" size="small">
              <Timeline items={mockExecutions.slice(0, 5).reverse().map(exec => ({ color: exec.status === 'success' ? 'green' : exec.status === 'failed' ? 'red' : 'orange', children: <div><div className="font-medium text-sm">{exec.workflowName}</div><div className="text-xs text-gray-400">{exec.startTime} · 耗时 {exec.duration}</div></div> }))} />
            </Card>
          </Col>
        </Row>

        <Modal title={`执行详情 - ${selectedExecution?.workflowName}`} open={detailDrawerVisible} onCancel={() => setDetailDrawerVisible(false)} width={700} footer={[<Button key="close" onClick={() => setDetailDrawerVisible(false)}>关闭</Button>, selectedExecution?.status === 'failed' && <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={() => { message.success('重新执行请求已发送'); setDetailDrawerVisible(false); }}>重新执行</Button>].filter(Boolean)}>
          {selectedExecution && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="执行ID" span={2}><Text code>{selectedExecution.executionId}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const c = execStatusConfig[selectedExecution.status]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : selectedExecution.status; })()}</Descriptions.Item>
                <Descriptions.Item label="触发方式">{(() => { const c = triggerByConfig[selectedExecution.triggeredBy]; return c ? <Tag color={c.color}>{c.label}</Tag> : selectedExecution.triggeredBy; })()}</Descriptions.Item>
                <Descriptions.Item label="开始时间">{selectedExecution.startTime}</Descriptions.Item>
                <Descriptions.Item label="结束时间">{selectedExecution.endTime}</Descriptions.Item>
                <Descriptions.Item label="总耗时"><Text strong>{selectedExecution.duration}</Text></Descriptions.Item>
                <Descriptions.Item label="Token消耗">{selectedExecution.tokensUsed.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="费用"><Text className="text-green-600 font-bold">{selectedExecution.cost}</Text></Descriptions.Item>
              </Descriptions>
              {selectedExecution.failReason && <Alert type="error" showIcon icon={<ExclamationCircleOutlined />} message="失败原因" description={selectedExecution.failReason} />}
              {selectedExecution.warningMsg && <Alert type="warning" showIcon icon={<WarningOutlined />} message="警告信息" description={selectedExecution.warningMsg} />}
              <Divider orientation="left">执行步骤</Divider>
              <Timeline items={[{ color: 'green', children: <><strong>触发器</strong> · 接收触发信号<div className="text-xs text-gray-400">+0.01s</div></> }, { color: 'green', children: <><strong>数据准备</strong> · 解析输入参数<div className="text-xs text-gray-400">+0.15s</div></> }, { color: selectedExecution.nodesSuccess >= 3 ? 'green' : 'red', children: <><strong>核心处理</strong> · 执行业务逻辑<div className="text-xs text-gray-400">+{(parseFloat(selectedExecution.duration) * 0.7).toFixed(2)}s</div></> }, { color: 'green', children: <><strong>结果输出</strong> · 返回结果<div className="text-xs text-gray-400">+0.05s</div></> }, { color: selectedExecution.status === 'success' ? 'green' : 'red', children: <><strong>完成</strong> · {selectedExecution.status === 'success' ? '成功' : '失败'}<div className="text-xs text-gray-400">总计 {selectedExecution.duration}</div></> }]} />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
