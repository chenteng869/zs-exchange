'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col, Statistic,
  Tabs, Modal, message, Tooltip, Descriptions, Progress, Steps, Select,
} from 'antd';
import {
  EyeOutlined, RetweetOutlined, StopOutlined, RollbackOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, PlayCircleOutlined, ExclamationCircleOutlined,
  ReloadOutlined, SendOutlined, TeamOutlined, FileTextOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

// 模拟运行中的流程实例（10条）
const mockInstances = [
  { id: 'inst-001', instanceId: 'PROC-20240608-0001', processName: 'NFT上架审批流程', initiator: '创作者-王小明', currentNode: 'AI自动审核中', status: 'running', startTime: '2024-06-08 13:25:00', duration: '1h08m', priority: 'high', completedNodes: 2, totalNodes: 8 },
  { id: 'inst-002', instanceId: 'PROC-20240608-0002', processName: '用户提现审批流程', initiator: '投资者-张三', currentNode: '等待财务复核', status: 'running', startTime: '2024-06-08 11:42:00', duration: '2h51m', priority: 'normal', completedNodes: 5, totalNodes: 10 },
  { id: 'inst-003', instanceId: 'PROC-20240608-0003', processName: 'KYC认证流程', initiator: '新用户-李四', currentNode: '三方API核验', status: 'running', startTime: '2024-06-08 14:10:00', duration: '22m', priority: 'normal', completedNodes: 4, totalNodes: 12 },
  { id: 'inst-004', instanceId: 'PROC-20240608-0004', processName: 'NFT上架审批流程', initiator: '创作者-赵六', currentNode: '人工初审', status: 'running', startTime: '2024-06-08 09:30:00', duration: '5h02m', priority: 'low', completedNodes: 3, totalNodes: 8 },
  { id: 'inst-005', instanceId: 'PROC-20240608-0005', processName: '用户提现审批流程', initiator: 'VIP用户-孙七', currentNode: '已完成', status: 'completed', startTime: '2024-06-08 08:15:00', duration: '32m', priority: 'urgent', completedNodes: 10, totalNodes: 10 },
  { id: 'inst-006', instanceId: 'PROC-20240608-0006', processName: 'NFT上架审批流程', initiator: '创作者-钱八', currentNode: '已终止', status: 'terminated', startTime: '2024-06-07 16:00:00', duration: '18h30m', priority: 'normal', completedNodes: 3, totalNodes: 8 },
  { id: 'inst-007', instanceId: 'PROC-20240608-0007', processName: '合规审查工作流', initiator: '项目方-DAppX', currentNode: '法务审核', status: 'running', startTime: '2024-06-08 10:00:00', duration: '4h33m', priority: 'high', completedNodes: 7, totalNodes: 14 },
  { id: 'inst-008', instanceId: 'PROC-20240608-0008', processName: '用户投诉处理流程', initiator: '用户-周九', currentNode: '客服响应', status: 'running', startTime: '2024-06-08 13:00:00', duration: '1h33m', priority: 'normal', completedNodes: 2, totalNodes: 9 },
  { id: 'inst-009', instanceId: 'PROC-20240608-0009', processName: '资金清算对账流程', initiator: '系统自动', currentNode: '对账完成', status: 'completed', startTime: '2024-06-08 02:00:00', duration: '48m', priority: 'normal', completedNodes: 11, totalNodes: 11 },
  { id: 'inst-010', instanceId: 'PROC-20240608-0010', processName: 'KYC认证流程', initiator: '新用户-吴十', currentNode: 'OCR识别', status: 'timeout', startTime: '2024-06-07 22:00:00', duration: '超时', priority: 'low', completedNodes: 2, totalNodes: 12 },
];

// 待办任务列表
const mockPendingTasks = [
  { id: 'task-001', taskName: 'NFT上架初审', processName: 'NFT上架审批流程', initiator: '创作者-赵六', arrivedAt: '2024-06-08 10:02', priority: 'low', dueTime: '2024-06-08 18:00' },
  { id: 'task-002', taskName: '提现财务复核', processName: '用户提现审批流程', initiator: '投资者-张三', arrivedAt: '2024-06-08 14:15', priority: 'medium', dueTime: '2024-06-08 17:00' },
  { id: 'task-003', taskName: '异常交易调查', processName: '异常交易处理流程', initiator: '风控系统', arrivedAt: '2024-06-08 13:50', priority: 'high', dueTime: '2024-06-08 15:30' },
  { id: 'task-004', taskName: '项目入驻终审', processName: '项目入驻申请流程', initiator: '项目方-DAppX', arrivedAt: '2024-06-08 11:20', priority: 'medium', dueTime: '2024-06-09 12:00' },
  { id: 'task-005', taskName: '法务合规审查', processName: '合规审查工作流', initiator: '项目方-DAppY', arrivedAt: '2024-06-08 14:30', priority: 'high', dueTime: '2024-06-09 10:00' },
  { id: 'task-006', taskName: '用户投诉处理', processName: '用户投诉处理流程', initiator: '用户-周九', arrivedAt: '2024-06-08 13:05', priority: 'medium', dueTime: '2024-06-08 17:00' },
  { id: 'task-007', taskName: 'KYC人工复审', processName: 'KYC认证流程', initiator: '新用户-吴九', arrivedAt: '2024-06-08 09:45', priority: 'low', dueTime: '2024-06-09 10:00' },
  { id: 'task-008', taskName: '资金对账确认', processName: '资金清算对账流程', initiator: '财务系统', arrivedAt: '2024-06-08 02:48', priority: 'high', dueTime: '2024-06-08 06:00' },
];

export default function BPMRuntimePage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('instances');

  const { data: instances, isLoading } = useQuery({
    queryKey: ['bpm-instances'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockInstances;
    },
  });

  const filtered = (instances || []).filter((inst: any) => {
    const matchSearch = !searchText || inst.processName.includes(searchText) || inst.initiator.includes(searchText) || inst.instanceId.includes(searchText);
    const matchStatus = !statusFilter || inst.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 状态渲染
  const renderStatus = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      running: { color: 'processing', text: '运行中' },
      completed: { color: 'success', text: '已完成' },
      terminated: { color: 'error', text: '已终止' },
      timeout: { color: 'warning', text: '超时' },
    };
    const s = map[status] || { color: 'default', text: '未知' };
    return <Badge status={s.color as any} text={s.text} />;
  };

  // 优先级颜色
  const getPriorityColor = (p: string) => ({ urgent: 'red', high: 'orange', normal: 'blue', low: 'default' }[p] || 'default');
  const getPriorityLabel = (p: string) => ({ urgent: '紧急', high: '高', normal: '普通', low: '低' }[p] || p);

  const columns = [
    { title: '实例ID', dataIndex: 'instanceId', key: 'instanceId', width: 180, render: (v: string) => <code className="text-xs">{v}</code> },
    { title: '流程名称', dataIndex: 'processName', key: 'processName', render: (v: string) => <span className="font-medium">{v}</span> },
    { title: '发起人', dataIndex: 'initiator', key: 'initiator', width: 130 },
    { title: '当前节点', dataIndex: 'currentNode', key: 'currentNode', width: 140, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => renderStatus(s) },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p: string) => <Tag color={getPriorityColor(p)}>{getPriorityLabel(p)}</Tag> },
    { title: '进度', key: 'progress', width: 120, render: (_: any, r: any) => <Progress percent={Math.round(r.completedNodes / r.totalNodes * 100)} size="small" format={() => `${r.completedNodes}/${r.totalNodes}`} /> },
    { title: '耗时', dataIndex: 'duration', key: 'duration', width: 100 },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedInstance(r); setDetailModalVisible(true); } },
    ...(typeof window !== 'undefined' ? [] : []),
  ];

  // 待办任务列
  const taskColumns = [
    { title: '任务名称', dataIndex: 'taskName', key: 'taskName', render: (v: string) => <span className="font-semibold">{v}</span> },
    { title: '所属流程', dataIndex: 'processName', key: 'processName', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '发起人', dataIndex: 'initiator', key: 'initiator' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 90, render: (p: string) => <Tag color={getPriorityColor(p)}>{getPriorityLabel(p)}</Tag> },
    { title: '到达时间', dataIndex: 'arrivedAt', key: 'arrivedAt', width: 140 },
    { title: '截止时间', dataIndex: 'dueTime', key: 'dueTime', width: 140, render: (v: string) => <span className={new Date(v) < new Date() ? 'text-red-500 font-medium' : ''}>{v}</span> },
  ];

  const taskActions: any[] = [
    { key: 'handle', label: '办理', icon: <SendOutlined />, type: 'primary', onClick: () => message.success('已办理') },
    { key: 'transfer', label: '转办', icon: <RetweetOutlined />, onClick: () => message.success('已转办') },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PlayCircleOutlined className="text-green-600" />
              流程运行中心
            </h1>
            <p className="text-gray-500 mt-1">流程实例监控、任务分配、超时处理与实时状态追踪</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.info('刷新数据')}>刷新</Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="运行实例" value={instances?.filter((i: any) => i.status === 'running').length || 0} icon={<ClockCircleOutlined />} color="#1677FF" description="当前正在执行" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="待处理任务" value={mockPendingTasks.length} icon={<ExclamationCircleOutlined />} color="#F59E0B" trend="up" trendValue="+5 今日新增" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="今日完成" value={156} icon={<CheckCircleOutlined />} color="#16A34A" description="较昨日 +12%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="平均耗时" value={2.8} icon={<WarningOutlined />} color="#DC2626" suffix="小时" description="含超时实例" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="超时预警" value={instances?.filter((i: any) => i.status === 'timeout').length || 0} icon={<CloseCircleOutlined />} color="#DC2626" description="需立即处理" />
          </Col>
        </Row>

        {/* Tab切换内容 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'instances',
            label: <span><FileTextOutlined /> 运行实例</span>,
            children: (
              <DataTable
                columns={columns}
                dataSource={filtered}
                loading={isLoading}
                title="流程实例列表"
                actions={actions}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                searchPlaceholder="搜索实例ID、流程名或发起人"
                onRefresh={() => message.info('刷新成功')}
              />
            ),
          },
          {
            key: 'tasks',
            label: <span><TeamOutlined /> 我的待办 ({mockPendingTasks.length})</span>,
            children: (
              <DataTable
                columns={taskColumns}
                dataSource={mockPendingTasks}
                title="待办任务队列"
                actions={taskActions}
                rowKey="id"
                pagination={{ pageSize: 8 }}
              />
            ),
          },
        ]} />

        {/* 实例详情弹窗 */}
        <Modal
          title={`实例详情 - ${selectedInstance?.instanceId || ''}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={750}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            ...(selectedInstance?.status === 'running' ? [
              <Button key="transfer" icon={<RetweetOutlined />} onClick={() => { message.success('已转办'); setDetailModalVisible(false); }}>转办</Button>,
              <Button key="terminate" danger icon={<StopOutlined />} onClick={() => { message.success('已终止'); setDetailModalVisible(false); }}>终止</Button>,
            ] : []),
          ]}
        >
          {selectedInstance && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="实例ID" span={2}>{selectedInstance.instanceId}</Descriptions.Item>
                <Descriptions.Item label="流程名称">{selectedInstance.processName}</Descriptions.Item>
                <Descriptions.Item label="状态">{renderStatus(selectedInstance.status)}</Descriptions.Item>
                <Descriptions.Item label="发起人">{selectedInstance.initiator}</Descriptions.Item>
                <Descriptions.Item label="当前节点"><Tag color="blue">{selectedInstance.currentNode}</Tag></Descriptions.Item>
                <Descriptions.Item label="优先级"><Tag color={getPriorityColor(selectedInstance.priority)}>{getPriorityLabel(selectedInstance.priority)}</Tag></Descriptions.Item>
                <Descriptions.Item label="开始时间">{selectedInstance.startTime}</Descriptions.Item>
                <Descriptions.Item label="已运行时长">{selectedInstance.duration}</Descriptions.Item>
              </Descriptions>
              <div>
                <h4 className="font-semibold mb-2">执行进度</h4>
                <Progress percent={Math.round(selectedInstance.completedNodes / selectedInstance.totalNodes * 100)} status={selectedInstance.completedNodes === selectedInstance.totalNodes ? 'success' : 'active'} format={() => `已完成 ${selectedInstance.completedNodes}/${selectedInstance.totalNodes} 节点`} />
              </div>
              {selectedInstance.status === 'timeout' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <span className="text-orange-600 font-medium"><WarningOutlined /> 该实例已超时，建议立即处理或终止</span>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* 业务特性说明 */}
        <Card className="shadow-sm bg-gradient-to-r from-green-50 to-emerald-50" size="small">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 text-lg mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">智能任务分配引擎</h4>
              <p className="text-sm text-gray-600">基于负载均衡和技能匹配算法，自动将任务分配给最合适的处理人。支持超时自动升级、SLA预警和多级转办机制，确保每个流程实例都能按时完成。</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
