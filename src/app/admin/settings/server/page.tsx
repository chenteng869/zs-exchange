'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Statistic, Progress, Badge, Select } from 'antd';
import { ReloadOutlined, EyeOutlined, LineChartOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockServers = [
  { id: '1', name: '主服务器-01', ip: '192.168.1.101', status: 'online', cpu: 65, memory: 72, disk: 45, uptime: '45天 12小时', lastUpdate: '2024-05-13 14:30:00' },
  { id: '2', name: 'API服务器-01', ip: '192.168.1.102', status: 'online', cpu: 45, memory: 55, disk: 38, uptime: '30天 8小时', lastUpdate: '2024-05-13 14:30:00' },
  { id: '3', name: '数据库服务器-01', ip: '192.168.1.103', status: 'warning', cpu: 88, memory: 92, disk: 75, uptime: '60天 5小时', lastUpdate: '2024-05-13 14:30:00' },
  { id: '4', name: 'Web服务器-01', ip: '192.168.1.104', status: 'online', cpu: 35, memory: 48, disk: 25, uptime: '15天 3小时', lastUpdate: '2024-05-13 14:30:00' },
  { id: '5', name: '备份服务器-01', ip: '192.168.1.105', status: 'offline', cpu: 0, memory: 0, disk: 0, uptime: '0天 0小时', lastUpdate: '2024-05-13 10:00:00' },
];

const mockAlerts = [
  { id: '1', type: 'critical', server: '数据库服务器-01', message: 'CPU使用率超过85%，当前: 88%', time: '2024-05-13 14:25:00', status: 'active' },
  { id: '2', type: 'warning', server: '数据库服务器-01', message: '内存使用率超过90%，当前: 92%', time: '2024-05-13 14:20:00', status: 'active' },
  { id: '3', type: 'error', server: '备份服务器-01', message: '服务器离线', time: '2024-05-13 10:05:00', status: 'acknowledged' },
  { id: '4', type: 'info', server: '主服务器-01', message: '系统安全更新已安装', time: '2024-05-12 02:00:00', status: 'resolved' },
  { id: '5', type: 'warning', server: 'Web服务器-01', message: '磁盘空间不足20%', time: '2024-05-11 18:30:00', status: 'resolved' },
];

const timePoints = ['00:00', '04:00', '08:00', '12:00', '14:00', '16:00', '18:00'];

const cpuTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['主服务器', 'API服务器', '数据库服务器'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: timePoints },
  yAxis: { type: 'value', name: 'CPU使用率(%)', min: 0, max: 100 },
  series: [
    { type: 'line', smooth: true, data: [45, 50, 55, 60, 65, 58, 62], name: '主服务器', itemStyle: { color: '#1677FF' } },
    { type: 'line', smooth: true, data: [35, 40, 48, 50, 45, 42, 46], name: 'API服务器', itemStyle: { color: '#16A34A' } },
    { type: 'line', smooth: true, data: [70, 75, 80, 85, 88, 82, 85], name: '数据库服务器', itemStyle: { color: '#F59E0B' } },
  ],
};

const memoryTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['主服务器', 'API服务器', '数据库服务器'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: timePoints },
  yAxis: { type: 'value', name: '内存使用率(%)', min: 0, max: 100 },
  series: [
    { type: 'line', smooth: true, data: [60, 65, 68, 70, 72, 69, 71], name: '主服务器', itemStyle: { color: '#1677FF' } },
    { type: 'line', smooth: true, data: [50, 52, 55, 58, 55, 56, 54], name: 'API服务器', itemStyle: { color: '#16A34A' } },
    { type: 'line', smooth: true, data: [85, 88, 90, 92, 92, 91, 90], name: '数据库服务器', itemStyle: { color: '#F59E0B' } },
  ],
};

const networkTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['入站流量', '出站流量'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: timePoints },
  yAxis: { type: 'value', name: '流量(MB/s)' },
  series: [
    { type: 'line', smooth: true, data: [50, 80, 120, 150, 180, 160, 140], name: '入站流量', itemStyle: { color: '#1677FF' }, areaStyle: { color: 'rgba(24, 144, 255, 0.3)' } },
    { type: 'line', smooth: true, data: [40, 60, 100, 120, 140, 130, 110], name: '出站流量', itemStyle: { color: '#16A34A' }, areaStyle: { color: 'rgba(82, 196, 26, 0.3)' } },
  ],
};

export default function ServerMonitorPage() {
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
      online: { color: 'success', label: '在线' },
      warning: { color: 'warning', label: '警告' },
      offline: { color: 'error', label: '离线' },
    };
    return config[status] || config.online;
  };

  const getAlertTypeConfig = (type: string) => {
    const config: Record<string, { color: 'error' | 'warning' | 'default' | 'success'; label: string }> = {
      critical: { color: 'error', label: '严重' },
      warning: { color: 'warning', label: '警告' },
      error: { color: 'error', label: '错误' },
      info: { color: 'default', label: '信息' },
    };
    return config[type] || config.info;
  };

  const serverColumns = [
    { title: '服务器名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const c = getStatusConfig(status);
        return <Badge status={c.color} text={c.label} />;
      },
    },
    { 
      title: 'CPU', 
      dataIndex: 'cpu', 
      key: 'cpu', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress percent={val} size="small" strokeColor={val >= 80 ? '#DC2626' : val >= 60 ? '#F59E0B' : '#16A34A'} style={{ width: 100 }} />
          <span>{val}%</span>
        </div>
      ),
    },
    { 
      title: '内存', 
      dataIndex: 'memory', 
      key: 'memory', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress percent={val} size="small" strokeColor={val >= 80 ? '#DC2626' : val >= 60 ? '#F59E0B' : '#16A34A'} style={{ width: 100 }} />
          <span>{val}%</span>
        </div>
      ),
    },
    { 
      title: '磁盘', 
      dataIndex: 'disk', 
      key: 'disk', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress percent={val} size="small" strokeColor={val >= 80 ? '#DC2626' : val >= 60 ? '#F59E0B' : '#16A34A'} style={{ width: 100 }} />
          <span>{val}%</span>
        </div>
      ),
    },
    { title: '运行时间', dataIndex: 'uptime', key: 'uptime' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setSelectedServer(record)}>详情</Button>
          <Button type="link" size="small" icon={<ReloadOutlined />}>刷新</Button>
        </Space>
      ),
    },
  ];

  const alertColumns = [
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const c = getAlertTypeConfig(type);
        return <Tag color={c.color}>{c.label}</Tag>;
      },
    },
    { title: '服务器', dataIndex: 'server', key: 'server' },
    { title: '告警信息', dataIndex: 'message', key: 'message' },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'default' | 'processing' | 'error'> = {
          active: 'error',
          acknowledged: 'processing',
          resolved: 'success',
        };
        const labels: Record<string, string> = {
          active: '未处理',
          acknowledged: '已确认',
          resolved: '已解决',
        };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'active' && <Button type="link" size="small">确认</Button>}
          {record.status !== 'resolved' && <Button type="link" size="small" danger>解决</Button>}
        </Space>
      ),
    },
  ];

  const filteredServers = selectedStatus === 'all' 
    ? mockServers 
    : mockServers.filter(s => s.status === selectedStatus);

  const avgCpu = Math.round(mockServers.filter(s => s.status !== 'offline').reduce((sum, s) => sum + s.cpu, 0) / mockServers.filter(s => s.status !== 'offline').length);
  const avgMemory = Math.round(mockServers.filter(s => s.status !== 'offline').reduce((sum, s) => sum + s.memory, 0) / mockServers.filter(s => s.status !== 'offline').length);
  const avgDisk = Math.round(mockServers.filter(s => s.status !== 'offline').reduce((sum, s) => sum + s.disk, 0) / mockServers.filter(s => s.status !== 'offline').length);
  const onlineCount = mockServers.filter(s => s.status === 'online').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold m-0">服务器监控</h1>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新数据</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="CPU使用率" 
                value={avgCpu} 
                suffix="%" 
                valueStyle={{ color: avgCpu >= 80 ? '#DC2626' : avgCpu >= 60 ? '#F59E0B' : '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">所有在线服务器平均</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="内存使用率" 
                value={avgMemory} 
                suffix="%" 
                valueStyle={{ color: avgMemory >= 80 ? '#DC2626' : avgMemory >= 60 ? '#F59E0B' : '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">所有在线服务器平均</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="磁盘使用率" 
                value={avgDisk} 
                suffix="%" 
                valueStyle={{ color: avgDisk >= 80 ? '#DC2626' : avgDisk >= 60 ? '#F59E0B' : '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">所有在线服务器平均</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="在线服务器" 
                value={onlineCount} 
                suffix={`/${mockServers.length}`} 
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">在线/总数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="CPU趋势">
              <SafeECharts option={cpuTrendOption} style={{ height: 250 }} title="CPU趋势" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="内存趋势">
              <SafeECharts option={memoryTrendOption} style={{ height: 250 }} title="内存趋势" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="网络流量">
              <SafeECharts option={networkTrendOption} style={{ height: 250 }} title="网络流量" />
            </Card>
          </Col>
        </Row>

        <Card 
          title="服务器状态" 
          extra={
            <Select 
              defaultValue="all" 
              style={{ width: 150 }} 
              onChange={setSelectedStatus}
            >
              <Option value="all">全部</Option>
              <Option value="online">在线</Option>
              <Option value="warning">警告</Option>
              <Option value="offline">离线</Option>
            </Select>
          }
        >
          <Table
            dataSource={filteredServers}
            columns={serverColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Card title="告警记录">
          <Table
            dataSource={mockAlerts}
            columns={alertColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={`${selectedServer?.name} - 服务器详情`}
          open={!!selectedServer}
          onCancel={() => setSelectedServer(null)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setSelectedServer(null)}>关闭</Button>,
            <Button key="refresh" icon={<ReloadOutlined />}>刷新</Button>,
          ]}
        >
          {selectedServer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">服务器名称:</span>
                  <div className="font-semibold">{selectedServer.name}</div>
                </div>
                <div>
                  <span className="text-gray-500">IP地址:</span>
                  <div className="font-semibold font-mono">{selectedServer.ip}</div>
                </div>
                <div>
                  <span className="text-gray-500">状态:</span>
                  <div>
                    <Badge status={getStatusConfig(selectedServer.status).color} text={getStatusConfig(selectedServer.status).label} />
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">运行时间:</span>
                  <div className="font-semibold">{selectedServer.uptime}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">资源使用情况</h3>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>CPU使用率</span>
                    <span className={selectedServer.cpu >= 80 ? 'text-red-500 font-bold' : selectedServer.cpu >= 60 ? 'text-yellow-500 font-bold' : 'text-green-500 font-bold'}>{selectedServer.cpu}%</span>
                  </div>
                  <Progress percent={selectedServer.cpu} strokeColor={selectedServer.cpu >= 80 ? '#DC2626' : selectedServer.cpu >= 60 ? '#F59E0B' : '#16A34A'} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>内存使用率</span>
                    <span className={selectedServer.memory >= 80 ? 'text-red-500 font-bold' : selectedServer.memory >= 60 ? 'text-yellow-500 font-bold' : 'text-green-500 font-bold'}>{selectedServer.memory}%</span>
                  </div>
                  <Progress percent={selectedServer.memory} strokeColor={selectedServer.memory >= 80 ? '#DC2626' : selectedServer.memory >= 60 ? '#F59E0B' : '#16A34A'} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>磁盘使用率</span>
                    <span className={selectedServer.disk >= 80 ? 'text-red-500 font-bold' : selectedServer.disk >= 60 ? 'text-yellow-500 font-bold' : 'text-green-500 font-bold'}>{selectedServer.disk}%</span>
                  </div>
                  <Progress percent={selectedServer.disk} strokeColor={selectedServer.disk >= 80 ? '#DC2626' : selectedServer.disk >= 60 ? '#F59E0B' : '#16A34A'} />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-gray-500 text-sm">最后更新: {selectedServer.lastUpdate}</div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
