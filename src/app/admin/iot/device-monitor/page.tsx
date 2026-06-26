'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col,
  Progress, Modal, Descriptions, Divider, message, Alert, Tabs,
} from 'antd';
import {
  EyeOutlined, ReloadOutlined, WarningOutlined, CheckCircleOutlined,
  WifiOutlined, DatabaseOutlined, BellOutlined, DashboardOutlined,
  LineChartOutlined, MobileOutlined, SignalFilled, ThunderboltOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 实时监控数据（10条）
const mockMonitorData = [
  { id: 'MON-001', deviceId: 'DEV-001', deviceName: '温湿度传感器-A01', type: '环境监测', status: 'online', signalStrength: 92, batteryLevel: 85, dataPointsPerMin: 60, totalToday: 86400, dataIntegrity: 99.9, cpuUsage: 12, memoryUsage: 35, lastUpdate: '2024-06-08 14:59:58' },
  { id: 'MON-002', deviceId: 'DEV-002', deviceName: '电力计量仪-B02', type: '能源管理', status: 'online', signalStrength: 88, batteryLevel: null, dataPointsPerMin: 10, totalToday: 14400, dataIntegrity: 100, cpuUsage: 8, memoryUsage: 28, lastUpdate: '2024-06-08 14:59:55' },
  { id: 'MON-003', deviceId: 'DEV-003', deviceName: '门禁控制器-C03', type: '安防系统', status: 'offline', signalStrength: 0, batteryLevel: null, dataPointsPerMin: 0, totalToday: 1200, dataIntegrity: 85.2, cpuUsage: 0, memoryUsage: 0, lastUpdate: '2024-06-07 23:15:33' },
  { id: 'MON-004', deviceId: 'DEV-004', deviceName: '空气质量检测-D04', type: '环境监测', status: 'online', signalStrength: 95, batteryLevel: 72, dataPointsPerMin: 30, totalToday: 43200, dataIntegrity: 99.8, cpuUsage: 18, memoryUsage: 42, lastUpdate: '2024-06-08 14:59:57' },
  { id: 'MON-005', deviceId: 'DEV-005', deviceName: 'UPS电源-E05', type: '能源管理', status: 'online', signalStrength: 78, batteryLevel: null, dataPointsPerMin: 5, totalToday: 7200, dataIntegrity: 100, cpuUsage: 5, memoryUsage: 20, lastUpdate: '2024-06-08 14:59:50' },
  { id: 'MON-006', deviceId: 'DEV-006', deviceName: '摄像头-F06', type: '安防系统', status: 'online', signalStrength: 82, batteryLevel: null, dataPointsPerMin: 0, totalToday: 3600, dataIntegrity: 99.5, cpuUsage: 65, memoryUsage: 72, lastUpdate: '2024-06-08 14:59:52' },
  { id: 'MON-007', deviceId: 'DEV-007', deviceName: '烟感探测器-G07', type: '消防系统', status: 'alarm', signalStrength: 75, batteryLevel: 18, dataPointsPerMin: 120, totalToday: 172800, dataIntegrity: 97.3, cpuUsage: 45, memoryUsage: 58, lastUpdate: '2024-06-08 14:59:59' },
  { id: 'MON-008', deviceId: 'DEV-008', deviceName: '水浸传感器-H08', type: '消防系统', status: 'online', signalStrength: 90, batteryLevel: 92, dataPointsPerMin: 15, totalToday: 21600, dataIntegrity: 100, cpuUsage: 6, memoryUsage: 18, lastUpdate: '2024-06-08 14:59:54' },
  { id: 'MON-009', deviceId: 'DEV-009', deviceName: '振动传感器-I09', type: '工业设备', status: 'offline', signalStrength: 0, batteryLevel: null, dataPointsPerMin: 0, totalToday: 4800, dataIntegrity: 72.5, cpuUsage: 0, memoryUsage: 0, lastUpdate: '2024-06-06 18:30:00' },
  { id: 'MON-010', deviceId: 'DEV-010', deviceName: '智能电表-J10', type: '能源管理', status: 'online', signalStrength: 96, batteryLevel: null, dataPointsPerMin: 10, totalToday: 14400, dataIntegrity: 100, cpuUsage: 4, memoryUsage: 15, lastUpdate: '2024-06-08 14:59:59' },
];

// 数据采集趋势
const dataTrendOption = {
  tooltip: { trigger: 'axis' }, legend: { data: ['数据点/分钟','异常数'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00','04:00','08:00','12:00','14:00','16:00'] },
  yAxis: [{ type: 'value', name: '数据点/分' }, { type: 'value', name: '异常数' }],
  series: [
    { name: '数据点/分钟', type: 'line', smooth: true, data: [180,165,320,380,350,290], areaStyle:{opacity:0.1}, itemStyle:{color:'#1677FF'} },
    { name: '异常数', type: 'bar', data: [2,1,5,3,8,4], itemStyle:{color:'#DC2626'}, barWidth:'40%' },
  ],
};

export default function DeviceMonitorPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedMon, setSelectedMon] = useState<any>(null);

  const getSignalColor = (v: number) => v >= 80 ? '#16A34A' : v >= 50 ? '#F59E0B' : v > 0 ? '#DC2626' : '#d9d9d9';
  const getBatteryStatus = (v: number | null) => v === null ? 'default' : v >= 70 ? 'success' : v >= 30 ? 'normal' : 'exception';

  const columns = [
    { title: '设备ID', dataIndex: 'deviceId', key: 'deviceId', width: 110, render: (v:string) => <code className="text-xs">{v}</code> },
    { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName', render:(v:string)=><span className="font-semibold">{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render:(t:string)=><Tag color={{'环境监测':'green','能源管理':'blue','安防系统':'purple','消防系统':'red','工业设备':'orange'}[t]}>{t}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render:(s:string)=>(
      <Badge status={s==='online'?'success':s==='offline'?'default':'error'} text={s==='online'?'在线':s==='offline'?'离线':'告警'} />
    )},
    { title: '信号强度', dataIndex:'signalStrength',key:'signalStrength',width:130,render:(v:number)=>v>0?
      <Progress percent={v} size="small" format={()=>`${v}%`} strokeColor={getSignalColor(v)} />:<span className="text-gray-400">--</span>},
    { title: '电池电量', dataIndex:'batteryLevel',key:'batteryLevel',width:110,render:(v:number|null)=>v!==null?
      <Progress percent={v} size="small" status={getBatteryStatus(v) as any} format={()=><><MobileOutlined />{v}%</>} />:<span className="text-gray-400 text-xs">市电</span>},
    { title: '数据点/分', dataIndex:'dataPointsPerMin',key:'dataPointsPerMin',width:100,render:(v:number)=>v.toLocaleString()},
    { title: '数据完整性', dataIndex:'dataIntegrity',key:'dataIntegrity',width:120,render:(v:number)=>(
      <Progress percent={Math.round(v)} size="small" status={v>=99?'success':v>=90?'normal':'exception'} format={()=>`${v}%`} />
    )},
    { title: 'CPU/内存', key:'resource', width:120, render:(_:any,r:any)=>r.cpuUsage>0?`CPU ${r.cpuUsage}% / MEM ${r.memoryUsage}%`:'--'},
    { title: '最后更新', dataIndex:'lastUpdate',key:'lastUpdate',width:155},
  ];

  const actions = [
    { key:'view',label:'实时数据',icon:<EyeOutlined />,type:'primary',onClick:(r:any)=>{setSelectedMon(r);setDetailVisible(true);} },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DashboardOutlined className="text-blue-600" /> 设备实时监控</h1>
            <p className="text-gray-500 mt-1">实时设备状态监控、数据采集质量追踪与性能指标分析</p>
          </div>
          <Space><Button icon={<ReloadOutlined />} onClick={()=>message.info('已刷新')}>刷新</Button></Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="监控设备" value={mockMonitorData.length} icon={<DatabaseOutlined />} color="#1677FF" suffix="台" description="全部纳入监控" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="数据吞吐" value={350} icon={<LineChartOutlined />} color="#16A34A" suffix="点/分" trend="up" trendValue="+12%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="活跃告警" value={mockMonitorData.filter(d=>d.status==='alarm').length} icon={<BellOutlined />} color="#DC2626" description="需立即处理" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="在线率" value={Math.round(mockMonitorData.filter(d=>d.status==='online').length/mockMonitorData.length*100)} icon={<WifiOutlined />} color="#7C3AED" suffix="%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="数据完整性" value={'98.6%'} icon={<CheckCircleOutlined />} color="#16A34A" description="全设备均值" />
          </Col>
        </Row>

        {mockMonitorData.some(d=>d.status==='alarm') && (
          <Alert type="error" showIcon message={`${mockMonitorData.filter(d=>d.status==='alarm').length} 台设备告警中`}
            description="烟感探测器-G07 检测到异常烟雾浓度，请立即处理"
            action={<Button size="small" danger>查看详情</Button>} className="shadow-sm" />
        )}

        <Tabs items={[
          { key:'list', label:'<span><DatabaseOutlined /> 监控列表</span>',
            children: <DataTable columns={columns} dataSource={mockMonitorData} title="设备监控列表" actions={actions as any[]} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索设备名称或ID"/> },
          { key:'chart', label:'<span><LineChartOutlined /> 数据趋势</span>',
            children: <Card title="今日数据采集趋势" className="shadow-sm"><SafeECharts option={dataTrendOption} style={{height:360}} title="采集趋势"/></Card> },
        ]} />

        <Modal title={`实时数据 - ${selectedMon?.deviceName||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>]}>
          {selectedMon && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备ID">{selectedMon.deviceId}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{selectedMon.deviceName}</Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={selectedMon.status==='online'?'success':selectedMon.status==='offline'?'default':'error'}
                text={selectedMon.status==='online'?'在线':selectedMon.status==='offline'?'离线':'告警'} /></Descriptions.Item>
              <Descriptions.Item label="信号强度"><Progress percent={selectedMon.signalStrength} size="small"/></Descriptions.Item>
              <Descriptions.Item label="电池电量">{selectedMon.batteryLevel!==null?<Progress percent={selectedMon.batteryLevel} size="small"/>:'市电供电'}</Descriptions.Item>
              <Descriptions.Item label="CPU使用率">{selectedMon.cpuUsage>0?`${selectedMon.cpuUsage}%`:'--'}</Descriptions.Item>
              <Descriptions.Item label="内存使用">{selectedMon.memoryUsage>0?`${selectedMon.memoryUsage}%`:'--'}</Descriptions.Item>
              <Descriptions.Item label="数据完整性"><Progress percent={Math.round(selectedMon.dataIntegrity)} size="small"/></Descriptions.Item>
              <Descriptions.Item label="今日数据量">{(selectedMon.totalToday).toLocaleString()} 条</Descriptions.Item>
              <Descriptions.Item label="最后更新" span={2}>{selectedMon.lastUpdate}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">毫秒级实时数据管道</h4>
            <p className="text-sm text-gray-600">基于 MQTT Broker 的实时消息队列，支持每秒万级数据吞吐。内置数据清洗、异常检测和自动补全机制，确保数据完整性和一致性达到 99.9% 以上。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
