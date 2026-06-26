'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col, Statistic,
  Form, Input, Select, Switch, Modal, Descriptions, Progress, Divider,
  message, Tooltip, Steps, Alert,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ApiOutlined, WifiOutlined, CloudUploadOutlined, CheckCircleOutlined,
  SearchOutlined, ReloadOutlined, SettingOutlined, LinkOutlined,
  SafetyCertificateOutlined, MobileOutlined, DesktopOutlined,
  ThunderboltOutlined, QuestionCircleOutlined, SyncOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

// 设备协议类型
const PROTOCOLS = ['MQTT', 'REST/HTTP', 'CoAP', 'WebSocket', 'Modbus TCP', 'OPC UA', 'DL/T645'];

// 模拟设备列表（10条）
const mockDevices = [
  { id: 'DEV-001', name: '温湿度传感器-A01', type: '环境监测', protocol: 'MQTT', status: 'online', lastComm: '2024-06-08 14:58:22', firmware: 'v2.3.1', ipAddr: '192.168.1.101', region: '华东机房', authMethod: '证书认证', createdAt: '2024-03-15' },
  { id: 'DEV-002', name: '电力计量仪-B02', type: '能源管理', protocol: 'Modbus TCP', status: 'online', lastComm: '2024-06-08 14:57:45', firmware: 'v1.8.5', ipAddr: '192.168.1.102', region: '华东机房', authMethod: '密钥认证', createdAt: '2024-04-20' },
  { id: 'DEV-003', name: '门禁控制器-C03', type: '安防系统', protocol: 'REST/HTTP', status: 'offline', lastComm: '2024-06-07 23:15:33', firmware: 'v3.0.2', ipAddr: '192.168.1.103', region: '华北机房', authMethod: 'OAuth2.0', createdAt: '2024-05-01' },
  { id: 'DEV-004', name: '空气质量检测-D04', type: '环境监测', protocol: 'MQTT', status: 'online', lastComm: '2024-06-08 14:59:01', firmware: 'v2.1.0', ipAddr: '192.168.1.104', region: '华南机房', authMethod: '证书认证', createdAt: '2024-04-10' },
  { id: 'DEV-005', name: 'UPS电源-E05', type: '能源管理', protocol: 'SNMP', status: 'online', lastComm: '2024-06-08 14:56:18', firmware: 'v4.2.0', ipAddr: '192.168.1.105', region: '华东机房', authMethod: '密钥认证', createdAt: '2024-03-25' },
  { id: 'DEV-006', name: '摄像头-F06', type: '安防系统', protocol: 'RTSP/ONVIF', status: 'online', lastComm: '2024-06-08 14:58:55', firmware: 'v5.1.3', ipAddr: '192.168.1.106', region: '华北机房', authMethod: '证书认证', createdAt: '2024-06-01' },
  { id: 'DEV-007', name: '烟感探测器-G07', type: '消防系统', protocol: 'CoAP', status: 'alarm', lastComm: '2024-06-08 14:45:00', firmware: 'v1.5.2', ipAddr: '192.168.1.107', region: '华南机房', authMethod: 'PSK预共享', createdAt: '2024-05-15' },
  { id: 'DEV-008', name: '水浸传感器-H08', type: '消防系统', protocol: 'MQTT', status: 'online', lastComm: '2024-06-08 14:57:33', firmware: 'v1.2.1', ipAddr: '192.168.1.108', region: '华东机房', authMethod: '证书认证', createdAt: '2024-05-20' },
  { id: 'DEV-009', name: '振动传感器-I09', type: '工业设备', protocol: 'OPC UA', status: 'offline', lastComm: '2024-06-06 18:30:00', firmware: 'v2.0.0', ipAddr: '192.168.1.109', region: '华北机房', authMethod: 'X.509证书', createdAt: '2024-04-28' },
  { id: 'DEV-010', name: '智能电表-J10', type: '能源管理', protocol: 'DL/T645', status: 'online', lastComm: '2024-06-08 14:59:12', firmware: 'v3.1.0', ipAddr: '192.168.1.110', region: '华南机房', authMethod: '密钥认证', createdAt: '2024-06-05' },
];

export default function DeviceAccessPage() {
  const [form] = Form.useForm();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: devices, isLoading } = useQuery({
    queryKey: ['iot-devices'],
    queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockDevices; },
  });

  const filtered = (devices || []).filter((d: any) => {
    const matchSearch = !searchText || d.name.includes(searchText) || d.id.includes(searchText);
    const matchType = !typeFilter || d.type === typeFilter;
    return matchSearch && matchType;
  });

  // 设备类型颜色
  const getTypeColor = (type: string) => ({ '环境监测': 'green', '能源管理': 'blue', '安防系统': 'purple', '消防系统': 'red', '工业设备': 'orange' }[type] || 'default');

  // 状态渲染
  const renderStatus = (status: string) => ({ online: { color: 'success', text: '在线' }, offline: { color: 'default', text: '离线' }, alarm: { color: 'error', text: '告警' } }[status] || { color: 'default', text: '未知' });

  const columns = [
    { title: '设备ID', dataIndex: 'id', key: 'id', width: 115, render: (v: string) => <code className="text-xs">{v}</code> },
    { title: '设备名称', dataIndex: 'name', key: 'name', render: (v: string) => <span className="font-semibold">{v}</span> },
    { title: '设备类型', dataIndex: 'type', key: 'type', width: 110, render: (t: string) => <Tag color={getTypeColor(t)}>{t}</Tag> },
    { title: '通信协议', dataIndex: 'protocol', key: 'protocol', width: 120, render: (p: string) => <Tag color="cyan">{p}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => { const st = renderStatus(s); return <Badge status={st.color as any} text={st.text} />; }},
    { title: '最后通信', dataIndex: 'lastComm', key: 'lastComm', width: 160 },
    { title: '固件版本', dataIndex: 'firmware', key: 'firmware', width: 100, render: (v: string) => <code className="text-xs bg-gray-100 px-1 rounded">{v}</code> },
    { title: '所属区域', dataIndex: 'region', key: 'region', width: 100 },
    { title: '接入方式', dataIndex: 'authMethod', key: 'authMethod', width: 110, render: (v: string) => <Tag>{v}</Tag> },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedDevice(r); setDetailModalVisible(true); } },
    { key: 'edit', label: '配置', icon: <SettingOutlined />, type: 'primary', onClick: () => message.info('打开配置面板') },
    { key: 'restart', label: '重启', icon: <ReloadOutlined />, onClick: () => message.success('重启指令已发送') },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ApiOutlined className="text-cyan-600" /> 设备接入管理</h1>
            <p className="text-gray-500 mt-1">设备注册接入、多协议适配、安全认证与生命周期管理</p>
          </div>
          <Space><Button icon={<SyncOutlined />} onClick={() => message.info('同步中...')}>批量同步</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>添加设备</Button></Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="已接入设备" value={devices?.length || 0} icon={<ApiOutlined />} color="#1677FF" suffix="台" description="全部注册设备" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="在线设备" value={devices?.filter((d: any) => d.status === 'online').length || 0} icon={<WifiOutlined />} color="#16A34A" trend="up" trendValue="在线率 80%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="协议种类" value={PROTOCOLS.length} icon={<LinkOutlined />} color="#7C3AED" suffix="种" description="已支持协议" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="今日新增" value={2} icon={<CloudUploadOutlined />} color="#F59E0B" suffix="台" description="较昨日 +1" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="接入成功率" value={'99.2%'} icon={<CheckCircleOutlined />} color="#16A34A" description="近7日均值" />
          </Col>
        </Row>

        {/* 告警提示 */}
        {devices?.some((d: any) => d.status === 'alarm') && (
          <Alert type="warning" showIcon message={`当前有 ${devices.filter((d: any) => d.status === 'alarm').length} 台设备处于告警状态`} action={<Button size="small">查看</Button>} className="shadow-sm" />
        )}

        {/* 数据表格 */}
        <DataTable
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          title="设备注册列表"
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          searchPlaceholder="搜索设备ID或名称"
          onRefresh={() => message.info('刷新成功')}
        />

        {/* 详情弹窗 */}
        <Modal title={`设备详情 - ${selectedDevice?.name || ''}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>, <Button key="config" type="primary" icon={<SettingOutlined />}>进入配置</Button>]}>
          {selectedDevice && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备ID" span={2}>{selectedDevice.id}</Descriptions.Item>
              <Descriptions.Item label="设备名称"><span className="font-semibold">{selectedDevice.name}</span></Descriptions.Item>
              <Descriptions.Item label="类型"><Tag color={getTypeColor(selectedDevice.type)}>{selectedDevice.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="通信协议"><Tag color="cyan">{selectedDevice.protocol}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">{(() => { const s = renderStatus(selectedDevice.status); return <Badge status={s.color as any} text={s.text} />; })()}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{selectedDevice.ipAddr}</Descriptions.Item>
              <Descriptions.Item label="固件版本"><code>{selectedDevice.firmware}</code></Descriptions.Item>
              <Descriptions.Item label="所属区域">{selectedDevice.region}</Descriptions.Item>
              <Descriptions.Item label="认证方式"><Tag>{selectedDevice.authMethod}</Tag></Descriptions.Item>
              <Descriptions.Item label="最后通信">{selectedDevice.lastComm}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{selectedDevice.createdAt}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 添加设备弹窗 */}
        <Modal title="添加新设备" open={addModalVisible} onCancel={() => setAddModalVisible(false)} onOk={() => { message.success('设备添加成功'); setAddModalVisible(false); }} width={600}>
          <Form form={form} layout="vertical">
            <Form.Item label="设备名称" rules={[{ required: true }]}><Input placeholder="输入设备名称" /></Form.Item>
            <Row gutter={16}>
              <Col span={12}><Form.Item label="设备类型" rules={[{ required: true }]}><Select placeholder="选择类型" options={['环境监测','能源管理','安防系统','消防系统','工业设备'].map(t => ({ label: t, value: t }))} /></Form.Item></Col>
              <Col span={12}><Form.Item label="通信协议" rules={[{ required: true }]}><Select placeholder="选择协议" options={PROTOCOLS.map(p => ({ label: p, value: p }))} /></Form.Item></Col>
            </Row>
            <Form.Item label="认证方式"><Select defaultValue="证书认证" options={['证书认证','密钥认证','OAuth2.0','PSK预共享','X.509证书'].map(m => ({ label: m, value: m }))} /></Form.Item>
            <Form.Item label="所属区域"><Select placeholder="选择区域" options={['华东机房','华北机房','华南机房'].map(r => ({ label: r, value: r }))} /></Form.Item>
          </Form>
        </Modal>

        {/* 业务特性说明 */}
        <Card className="shadow-sm bg-gradient-to-r from-cyan-50 to-blue-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5" /><div><h4 className="font-semibold mb-1">多协议统一接入网关</h4><p className="text-sm text-gray-600">支持 MQTT、HTTP、CoAP、Modbus、OPC UA 等主流工业协议，自动完成协议转换和数据标准化。内置 TLS 双向认证、设备影子管理和 OTA 升级能力，保障物联网安全。</p></div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
