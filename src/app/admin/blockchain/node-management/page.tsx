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
  CloudServerOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  HddOutlined,
  GlobalOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  FundOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface BlockchainNode {
  id: string;
  name: string;
  nodeType: 'full' | 'validator' | 'archive' | 'light' | 'rpc';
  status: 'online' | 'syncing' | 'offline' | 'maintenance';
  region: string;
  ip: string;
  blockHeight: number;
  peerCount: number;
  tps: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: string;
  lastBlockTime: string;
  version: string;
}

const mockNodes: BlockchainNode[] = [
  { id: 'BN-001', name: '主网验证节点-新加坡', nodeType: 'validator', status: 'online', region: '亚太-新加坡', ip: '10.0.1.101', blockHeight: 19845620, peerCount: 45, tps: 1250, cpuUsage: 42, memoryUsage: 68, diskUsage: 75, uptime: '45d 12h 30m', lastBlockTime: '2024-06-08 14:59:58', version: 'v2.1.3-stable' },
  { id: 'BN-002', name: '全节点备份-法兰克福', nodeType: 'full', status: 'online', region: '欧洲-法兰克福', ip: '10.0.2.102', blockHeight: 19845619, peerCount: 38, tps: 980, cpuUsage: 35, memoryUsage: 72, diskUsage: 82, uptime: '120d 8h 15m', lastBlockTime: '2024-06-08 14:59:57', version: 'v2.1.3-stable' },
  { id: 'BN-003', name: '归档节点-弗吉尼亚', nodeType: 'archive', status: 'syncing', region: '北美-弗吉尼亚', ip: '10.0.3.103', blockHeight: 19845000, peerCount: 52, tps: 850, cpuUsage: 78, memoryUsage: 85, diskUsage: 91, uptime: '15d 4h 20m', lastBlockTime: '2024-06-08 14:59:55', version: 'v2.1.3-stable' },
  { id: 'BN-004', name: 'RPC服务节点-东京', nodeType: 'rpc', status: 'online', region: '东亚-东京', ip: '10.0.4.104', blockHeight: 19845620, peerCount: 28, tps: 2100, cpuUsage: 56, memoryUsage: 62, diskUsage: 45, uptime: '90d 18h 45m', lastBlockTime: '2024-06-08 14:59:58', version: 'v2.1.3-stable' },
  { id: 'BN-005', name: '轻量级同步节点-迪拜', nodeType: 'light', status: 'online', region: '中东-迪拜', ip: '10.0.5.105', blockHeight: 19845618, peerCount: 12, tps: 320, cpuUsage: 22, memoryUsage: 35, diskUsage: 28, uptime: '60d 5h 10m', lastBlockTime: '2024-06-08 14:59:54', version: 'v2.1.2-beta' },
  { id: 'BN-006', name: '备用验证节点-圣保罗', nodeType: 'validator', status: 'offline', region: '南美-圣保罗', ip: '10.0.6.106', blockHeight: 19844200, peerCount: 0, tps: 0, cpuUsage: 0, memoryUsage: 0, diskUsage: 65, uptime: '-', lastBlockTime: '2024-06-08 08:30:00', version: 'v2.1.3-stable' },
  { id: 'BN-007', name: '全节点-约翰内斯堡', nodeType: 'full', status: 'maintenance', region: '非洲-约翰内斯堡', ip: '10.0.7.107', blockHeight: 19845617, peerCount: 15, tps: 180, cpuUsage: 12, memoryUsage: 25, diskUsage: 40, uptime: '30d 12h', lastBlockTime: '2024-06-08 13:00:00', version: 'v2.1.3-stable' },
  { id: 'BN-008', name: 'RPC高可用集群-雅加达', nodeType: 'rpc', status: 'online', region: '东南亚-雅加达', ip: '10.0.8.108', blockHeight: 19845620, peerCount: 42, tps: 1850, cpuUsage: 48, memoryUsage: 58, diskUsage: 52, uptime: '75d 6h 35m', lastBlockTime: '2024-06-08 14:59:58', version: 'v2.1.3-stable' },
  { id: 'BN-009', name: '验证候选节点-悉尼', nodeType: 'validator', status: 'online', region: '大洋洲-悉尼', ip: '10.0.9.109', blockHeight: 19845619, peerCount: 32, tps: 650, cpuUsage: 38, memoryUsage: 55, diskUsage: 60, uptime: '200d 3h 50m', lastBlockTime: '2024-06-08 14:59:57', version: 'v2.1.3-stable' },
  { id: 'BN-010', name: '开发测试节点-本地', nodeType: 'full', status: 'online', region: '本地开发环境', ip: '127.0.0.1', blockHeight: 19845620, peerCount: 5, tps: 50, cpuUsage: 15, memoryUsage: 42, diskUsage: 33, uptime: '2d 8h 15m', lastBlockTime: '2024-06-08 14:59:56', version: 'v2.2.0-dev' },
];

export default function NodeManagementPage() {
  const [selectedNode, setSelectedNode] = useState<BlockchainNode | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const onlineCount = mockNodes.filter(n => n.status === 'online').length;
  const totalCount = mockNodes.length;
  const avgBlockHeight = Math.max(...mockNodes.map(n => n.blockHeight));
  const syncingCount = mockNodes.filter(n => n.status === 'syncing').length;
  const totalTPS = mockNodes.reduce((sum, n) => sum + n.tps, 0);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      online: { status: 'success', text: '在线' },
      syncing: { status: 'processing', text: '同步中' },
      offline: { status: 'error', text: '离线' },
      maintenance: { status: 'warning', text: '维护中' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      full: { color: 'blue', text: '全节点' },
      validator: { color: 'gold', text: '验证节点' },
      archive: { color: 'purple', text: '归档节点' },
      light: { color: 'green', text: '轻量节点' },
      rpc: { color: 'cyan', text: 'RPC节点' },
    };
    const config = map[type];
    return config ? <Tag color={config.color}>{config.text}</Tag> : type;
  };

  const handleView = (record: BlockchainNode) => { setSelectedNode(record); setDetailModalVisible(true); };

  const columns = [
    { title: '节点ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => <Text code className="text-xs">{id}</Text> },
    { title: '节点名称', dataIndex: 'name', key: 'name', width: 200, render: (n: string) => <span className="font-medium text-sm">{n}</span> },
    { title: '类型', key: 'nodeType', width: 100, render: (_: any, r: BlockchainNode) => getTypeTag(r.nodeType) },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: BlockchainNode) => getStatusBadge(r.status) },
    { title: '区块高度', dataIndex: 'blockHeight', key: 'blockHeight', width: 110, render: (h: number) => <span className="font-mono">{h.toLocaleString()}</span> },
    { title: '连接数', dataIndex: 'peerCount', key: 'peerCount', width: 80, render: (n: number) => <Tag color="blue">{n}</Tag> },
    { title: 'TPS', dataIndex: 'tps', key: 'tps', width: 80, render: (t: number) => <span className={`font-mono font-semibold ${t > 1000 ? 'text-green-600' : t > 500 ? 'text-blue-600' : 'text-gray-600'}`}>{t}</span> },
    { title: 'CPU/内存', key: 'resources', width: 130, render: (_: any, r: BlockchainNode) => (<div className="flex flex-col gap-1"><Progress percent={r.cpuUsage} size="small" showInfo={false} strokeColor={r.cpuUsage > 70 ? '#DC2626' : '#1677FF'} /><Progress percent={r.memoryUsage} size="small" showInfo={false} strokeColor={r.memoryUsage > 80 ? '#DC2626' : '#16A34A'} /></div>) },
    { title: '磁盘使用', dataIndex: 'diskUsage', key: 'diskUsage', width: 100, render: (u: number) => <Progress percent={u} size="small" format={() => `${u}%`} strokeColor={u > 85 ? '#DC2626' : u > 70 ? '#F59E0B' : '#16A34A'} /> },
    { title: '运行时间', dataIndex: 'uptime', key: 'uptime', width: 120, render: (t: string) => <span className="text-xs text-gray-500">{t}</span> },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '管理', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><CloudServerOutlined style={{ color: '#16A34A' }} /> 节点管理</h1><p className="text-gray-500 mt-1">区块链节点监控 · 状态管理 · 性能指标 · 同步状态</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>添加节点</Button><Button icon={<ReloadOutlined />}>刷新状态</Button><Button icon={<GlobalOutlined />}>网络拓扑</Button></Space>
        </div>

        {mockNodes.some(n => n.status === 'offline') && <Alert message={`${mockNodes.filter(n => n.status === 'offline').length} 个节点处于离线状态，需要立即排查`} type="error" showIcon icon={<WarningOutlined />} action={<Button size="small">查看详情</Button>} />}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="在线节点" value={onlineCount} suffix={`/ ${totalCount}`} icon={<CheckCircleOutlined />} color="#16A34A" trend="up" trendValue="+1" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="总节点数" value={totalCount} suffix="个" icon={<DashboardOutlined />} color="#1677FF" trend="none" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="平均区块高度" value={avgBlockHeight.toLocaleString()} suffix="" icon={<FundOutlined />} color="#7C3AED" trend="up" trendValue="+120" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="同步异常" value={syncingCount} suffix="个" icon={<SyncOutlined />} color="#F59E0B" trend={syncingCount > 0 ? 'up' : 'none'} /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="总TPS" value={totalTPS.toLocaleString()} suffix="" icon={<ThunderboltOutlined />} color="#EC4899" trend="up" trendValue="+156" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockNodes} rowKey="id" title="节点信息列表" searchPlaceholder="搜索节点名称或IP地址..." actions={actions} pagination={{ pageSize: 10 }} showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '在线', value: 'online' }, { label: '同步中', value: 'syncing' }, { label: '维护中', value: 'maintenance' }, { label: '离线', value: 'offline' }]} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><SafetyCertificateOutlined style={{ color: '#1677FF' }} /> 节点健康度概览</span>} className="shadow-sm">
              <List size="small" dataSource={[
                { t: '整体可用性', v: `${((onlineCount / totalCount) * 100).toFixed(1)}%`, c: onlineCount === totalCount ? '#16A34A' : '#F59E0B' },
                { t: '平均CPU使用率', v: `${(mockNodes.filter(n => n.status !== 'offline').reduce((sum, n) => sum + n.cpuUsage, 0) / mockNodes.filter(n => n.status !== 'offline').length).toFixed(1)}%`, c: '#1677FF' },
                { t: '平均内存使用率', v: `${(mockNodes.filter(n => n.status !== 'offline').reduce((sum, n) => sum + n.memoryUsage, 0) / mockNodes.filter(n => n.status !== 'offline').length).toFixed(1)}%`, c: '#7C3AED' },
                { t: '最高区块高度', v: avgBlockHeight.toLocaleString(), c: '#16A34A' },
                { t: '网络总吞吐量', v: `${totalTPS.toLocaleString()} TPS`, c: '#EC4899' },
              ]} renderItem={item => (<List.Item><div className="flex justify-between w-full"><span>{item.t}</span><span className="font-semibold" style={{ color: item.c }}>{item.v}</span></div></List.Item>)} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><HddOutlined style={{ color: '#F59E0B' }} /> 资源使用分布</span>} className="shadow-sm">
              <div className="space-y-4">
                {[{ l: 'CPU使用率', data: mockNodes.map(n => ({ name: n.name.split('-')[0], value: n.cpuUsage })) }, { l: '内存使用率', data: mockNodes.map(n => ({ name: n.name.split('-')[0], value: n.memoryUsage })) }, { l: '磁盘使用率', data: mockNodes.map(n => ({ name: n.name.split('-')[0], value: n.diskUsage })) }].map(item => (
                  <div key={item.l}>
                    <div className="font-medium mb-2 text-sm">{item.l}</div>
                    <Row gutter={[4, 4]}>
                      {item.data.slice(0, 5).map((d, i) => (
                        <Col key={i} span={24 / Math.min(item.data.length, 5)}>
                          <div className="text-center p-2 rounded bg-gray-50"><div className="text-lg font-bold" style={{ color: d.value > 80 ? '#DC2626' : d.value > 60 ? '#F59E0B' : '#16A34A' }}>{d.value}%</div><div className="text-xs text-gray-500 truncate">{d.name}</div></div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`节点详情 - ${selectedNode?.name}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={<Space><Button icon={<EditOutlined />}>管理节点</Button><Button type="primary" icon={<EyeOutlined />}>实时监控</Button></Space>}>
          {selectedNode && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="节点ID"><Text strong className="text-blue-600">{selectedNode.id}</Text></Descriptions.Item>
              <Descriptions.Item label="节点名称">{selectedNode.name}</Descriptions.Item>
              <Descriptions.Item label="节点类型">{getTypeTag(selectedNode.nodeType)}</Descriptions.Item>
              <Descriptions.Item label="运行状态">{getStatusBadge(selectedNode.status)}</Descriptions.Item>
              <Descriptions.Item label="所在区域"><Tag color="geekblue">{selectedNode.region}</Tag></Descriptions.Item>
              <Descriptions.Item label="IP地址"><Text code>{selectedNode.ip}</Text></Descriptions.Item>
              <Descriptions.Item label="当前区块高度"><span className="font-mono font-bold">{selectedNode.blockHeight.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="对等连接数"><Tag color="blue">{selectedNode.peerCount} 个</Tag></Descriptions.Item>
              <Descriptions.Item label="TPS"><span className="font-mono font-bold text-green-600">{selectedNode.tps}</span></Descriptions.Item>
              <Descriptions.Item label="软件版本"><Tag>{selectedNode.version}</Tag></Descriptions.Item>
              <Descriptions.Item label="CPU使用率"><Progress percent={selectedNode.cpuUsage} format={() => `${selectedNode.cpuUsage}%`} strokeColor={selectedNode.cpuUsage > 70 ? '#DC2626' : '#1677FF'} /></Descriptions.Item>
              <Descriptions.Item label="内存使用率"><Progress percent={selectedNode.memoryUsage} format={() => `${selectedNode.memoryUsage}%`} strokeColor={selectedNode.memoryUsage > 80 ? '#DC2626' : '#16A34A'} /></Descriptions.Item>
              <Descriptions.Item label="磁盘使用率"><Progress percent={selectedNode.diskUsage} format={() => `${selectedNode.diskUsage}%`} strokeColor={selectedNode.diskUsage > 85 ? '#DC2626' : '#F59E0B'} /></Descriptions.Item>
              <Descriptions.Item label="运行时长" span={2}>{selectedNode.uptime}</Descriptions.Item>
              <Descriptions.Item label="最近出块时间" span={2}>{selectedNode.lastBlockTime}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
