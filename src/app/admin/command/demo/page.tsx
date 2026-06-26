'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert, Avatar,
} from 'antd';
import {
  ProjectOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  TeamOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  FundOutlined,
  ExperimentOutlined,
  RobotOutlined,
  BlockOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  DesktopOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const demoScenarios = [
  { id: 'DS-001', name: '全局概览大屏', icon: <DashboardOutlined />, desc: '实时展示交易所核心运营指标的全局视图', status: 'active', users: 128, apiCalls: 4520, duration: '24/7运行', category: '指挥中心' },
  { id: 'DS-002', name: '实时告警监控', icon: <BarChartOutlined />, desc: '多维度告警聚合与实时推送演示', status: 'active', users: 86, apiCalls: 3200, duration: '24/7运行', category: '安全防御' },
  { id: 'DS-003', name: '风险地图可视化', icon: <GlobalOutlined />, desc: '基于GIS的区域风险热力分布展示', status: 'active', users: 64, apiCalls: 2100, duration: '按需启动', category: '指挥中心' },
  { id: 'DS-004', name: 'AI模型推理面板', icon: <RobotOutlined />, desc: 'AI预测模型实时推理结果与置信度展示', status: 'testing', users: 32, apiCalls: 1800, duration: '测试阶段', category: 'AI分析' },
  { id: 'DS-005', name: '区块链浏览器', icon: <BlockOutlined />, desc: '存证链交易查询与区块信息浏览', status: 'active', users: 156, apiCalls: 8900, duration: '24/7运行', category: '区块链' },
  { id: 'DS-006', name: '节点拓扑图', icon: <CloudServerOutlined />, desc: '区块链网络节点连接关系与状态可视化', status: 'active', users: 45, apiCalls: 1500, duration: '24/7运行', category: '区块链' },
  { id: 'DS-007', name: '智能体编排台', icon: <ExperimentOutlined />, desc: 'OpenClaw多智能体协作编排与监控界面', status: 'developing', users: 18, apiCalls: 800, duration: '开发中', category: 'OpenClaw' },
  { id: 'DS-008', name: 'n8n工作流编辑器', icon: <ApiOutlined />, desc: '可视化工作流设计与执行监控面板', status: 'active', users: 72, apiCalls: 3400, duration: '24/7运行', category: 'n8n工作流' },
  { id: 'DS-009', name: '安全态势感知', icon: <SecurityScanOutlined />, desc: '网络安全威胁实时检测与态势呈现', status: 'active', users: 54, apiCalls: 2800, duration: '24/7运行', category: '安全防御' },
  { id: 'DS-010', name: '量化策略回测', icon: <LineChartOutlined />, desc: '量化交易策略历史表现回测与分析', status: 'active', users: 98, apiCalls: 5600, duration: '按需启动', category: '量化交易' },
];

export default function DemoPage() {
  const [selectedDemo, setSelectedDemo] = useState<typeof demoScenarios[0] | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const totalScenarios = demoScenarios.length;
  const activeUsers = demoScenarios.reduce((sum, d) => sum + d.users, 0);
  const totalApiCalls = demoScenarios.reduce((sum, d) => sum + d.apiCalls, 0);
  const activeDemos = demoScenarios.filter(d => d.status === 'active').length;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      active: { status: 'success', text: '运行中' },
      testing: { status: 'processing', text: '测试中' },
      developing: { status: 'default', text: '开发中' },
      offline: { status: 'error', text: '已下线' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: typeof demoScenarios[0]) => {
    setSelectedDemo(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '场景名称', key: 'name', width: 200,
      render: (_: any, record: typeof demoScenarios[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 text-xl">{record.icon}</div>
          <div><div className="font-medium">{record.name}</div><div className="text-xs text-gray-400">{record.category}</div></div>
        </div>
      ),
    },
    { title: '场景说明', dataIndex: 'desc', key: 'desc', render: (d: string) => <span className="text-sm text-gray-600">{d}</span> },
    { title: '状态', key: 'status', width: 100, render: (_: any, r: typeof demoScenarios[0]) => getStatusBadge(r.status) },
    { title: '在线用户', dataIndex: 'users', key: 'users', width: 100, render: (n: number) => <Tag color="blue">{n}人</Tag> },
    { title: 'API调用', dataIndex: 'apiCalls', key: 'apiCalls', width: 110, render: (n: number) => <span className="font-mono text-sm">{n.toLocaleString()}</span> },
    { title: '运行模式', dataIndex: 'duration', key: 'duration', width: 110, render: (d: string) => <Tag color="purple">{d}</Tag> },
  ];

  const actions = [
    { key: 'view', label: '预览', icon: <PlayCircleOutlined />, onClick: handleView },
    { key: 'edit', label: '配置', icon: <SettingOutlined /> },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ProjectOutlined style={{ color: '#7C3AED' }} /> 可视化演示</h1>
            <p className="text-gray-500 mt-1">系统演示面板 · 功能展示入口 · 场景化体验</p>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>创建演示场景</Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="演示场景数" value={totalScenarios} suffix="个" icon={<FundOutlined />} color="#1677FF" trend="up" trendValue="+2" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="在线用户" value={activeUsers} suffix="人" icon={<TeamOutlined />} color="#16A34A" trend="up" trendValue="+23" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="API调用(今日)" value={`${(totalApiCalls / 1000).toFixed(1)}K`} suffix="" icon={<ApiOutlined />} color="#7C3AED" trend="up" trendValue="+12%" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="活跃场景" value={activeDemos} suffix="个" icon={<ThunderboltOutlined />} color="#F59E0B" trend="none" />
          </Col>
        </Row>

        <DataTable columns={columns} dataSource={demoScenarios} rowKey="id" title="演示场景列表" searchPlaceholder="搜索场景名称..." actions={actions} pagination={{ pageSize: 10 }} />

        <Card title={<span><AppstoreOutlined style={{ color: '#1677FF' }} /> 功能模块快捷入口</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            {[
              { title: '指挥中心', icon: <DesktopOutlined />, count: 3, color: '#1677FF', desc: '全局概览/实时告警/风险地图' },
              { title: '安全防御', icon: <SafetyCertificateOutlined />, count: 2, color: '#DC2626', desc: '安全态势/入侵检测' },
              { title: '区块链', icon: <BlockOutlined />, count: 2, color: '#7C3AED', desc: '存证链浏览器/节点管理' },
              { title: 'AI分析', icon: <RobotOutlined />, count: 1, color: '#16A34A', desc: 'AI模型推理/知识图谱' },
              { title: '量化交易', icon: <LineChartOutlined />, count: 1, color: '#F59E0B', desc: '策略回测/绩效监控' },
              { title: '工作流', icon: <ApiOutlined />, count: 1, color: '#EC4899', desc: 'n8n工作流/BPM引擎' },
            ].map(module => (
              <Col key={module.title} xs={24} sm={12} lg={8} xl={4}>
                <Card hoverable className="text-center h-full border-t-4" style={{ borderTopColor: module.color }}>
                  <div className="text-3xl mb-3" style={{ color: module.color }}>{module.icon}</div>
                  <div className="font-semibold mb-1">{module.title}</div>
                  <div className="text-xs text-gray-500 mb-3">{module.desc}</div>
                  <Badge count={`${module.count} 个场景`} style={{ backgroundColor: module.color }} />
                  <div className="mt-3"><Button type="primary" size="small" ghost style={{ borderColor: module.color, color: module.color }}>进入模块</Button></div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Alert message="演示环境提示" description="当前为演示环境，所有数据均为模拟数据，仅供功能展示和用户体验评估使用" type="info" showIcon icon={<InfoCircleOutlined />} />

        <Modal title={`演示场景 - ${selectedDemo?.name}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={600} footer={<Space><Button icon={<PlayCircleOutlined />} type="primary">启动预览</Button><Button icon={<SettingOutlined />}>配置参数</Button></Space>}>
          {selectedDemo && (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="text-6xl mb-4 text-blue-500">{selectedDemo.icon}</div>
                <h2 className="text-xl font-bold">{selectedDemo.name}</h2>
                <p className="text-gray-500 mt-2">{selectedDemo.desc}</p>
              </div>
              <Descriptions column={2} size="middle">
                <Descriptions.Item label="场景ID"><Text code>{selectedDemo.id}</Text></Descriptions.Item>
                <Descriptions.Item label="所属分类"><Tag color="purple">{selectedDemo.category}</Tag></Descriptions.Item>
                <Descriptions.Item label="运行状态">{getStatusBadge(selectedDemo.status)}</Descriptions.Item>
                <Descriptions.Item label="运行模式"><Tag>{selectedDemo.duration}</Tag></Descriptions.Item>
                <Descriptions.Item label="当前在线"><Statistic value={selectedDemo.users} suffix="人" /></Descriptions.Item>
                <Descriptions.Item label="API调用"><Statistic value={selectedDemo.apiCalls} /></Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
