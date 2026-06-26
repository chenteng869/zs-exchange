'use client';

import { useState } from 'react';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col,
  Progress, Modal, Tabs, Descriptions, Divider, message, Alert, Select, Switch,
} from 'antd';
import {
  EyeOutlined, PlusOutlined, EditOutlined,
  BellOutlined, WarningOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, ToolOutlined,
  ClockCircleOutlined, SettingOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const mockRules = [
  { id:'RULE-001',name:'温度超限告警',level:'critical',condition:'温度 > 40°C',devices:['温湿度传感器'],enabled:true,triggerCount:156,avgResponseTime:'3min',notifyChannels:['短信','邮件'],createdAt:'2024-03-01' },
  { id:'RULE-002',name:'设备离线检测',level:'major',condition:'心跳超时 > 5min',devices:['全部设备'],enabled:true,triggerCount:89,avgResponseTime:'5min',notifyChannels:['邮件','钉钉'],createdAt:'2024-03-05' },
  { id:'RULE-003',name:'电池低电量预警',level:'minor',condition:'电池 < 20%',devices:['无线传感器组'],enabled:true,triggerCount:234,avgResponseTime:'10min',notifyChannels:['邮件'],createdAt:'2024-03-10' },
  { id:'RULE-004',name:'网络延迟异常',level:'major',condition:'RTT > 500ms',devices:['全部设备'],enabled:true,triggerCount:45,avgResponseTime:'8min',notifyChannels:['钉钉','Webhook'],createdAt:'2024-03-15' },
  { id:'RULE-005',name:'数据丢包告警',level:'critical',condition:'丢包率 > 5%',devices:['关键传感器'],enabled:false,triggerCount:12,avgResponseTime:'2min',notifyChannels:['短信','电话'],createdAt:'2024-04-01' },
  { id:'RULE-006',name:'存储空间不足',level:'warning',condition:'使用率 > 85%',devices:['边缘网关'],enabled:true,triggerCount:67,avgResponseTime:'30min',notifyChannels:['邮件'],createdAt:'2024-04-10' },
  { id:'RULE-007',name:'固件版本过期',level:'minor',condition:'版本落后 > 2个',devices:['全部设备'],enabled:true,triggerCount:320,avgResponseTime:'1d',notifyChannels:['邮件','系统通知'],createdAt:'2024-05-01' },
  { id:'RULE-008',name:'非法访问尝试',level:'critical',condition:'认证失败 > 3次/h',devices:['安全设备'],enabled:true,triggerCount:8,avgResponseTime:'1min',notifyChannels:['短信','电话','Webhook'],createdAt:'2024-05-15' },
];

const mockAlertEvents = [
  { id:'ALERT-001',ruleName:'温度超限告警',deviceName:'烟感探测器-G07',level:'critical',value:'38.5°C (阈值40°C)',status:'open',triggeredAt:'2024-06-08 14:45:00',handler:null },
  { id:'ALERT-002',ruleName:'电池低电量预警',deviceName:'烟感探测器-G07',level:'minor',value:'18% (阈值20%)',status:'acknowledged',triggeredAt:'2024-06-08 13:20:00',handler:'运维组' },
  { id:'ALERT-003',ruleName:'设备离线检测',deviceName:'门禁控制器-C03',level:'major',value:'离线 15h30m',status:'processing',triggeredAt:'2024-06-07 23:15:33',handler:'张工' },
  { id:'ALERT-004',ruleName:'设备离线检测',deviceName:'振动传感器-I09',level:'major',value:'离线 44h30m',status:'open',triggeredAt:'2024-06-06 18:30:00',handler:null },
  { id:'ALERT-005',ruleName:'存储空间不足',deviceName:'边缘网关-华东',level:'warning',value:'使用率 87%',status:'resolved',triggeredAt:'2024-06-08 10:00:00',handler:'系统自动' },
  { id:'ALERT-006',ruleName:'固件版本过期',deviceName:'温湿度传感器-A01',level:'minor',value:'v2.3.1 (最新v2.5.0)',status:'open',triggeredAt:'2024-06-08 09:00:00',handler:null },
  { id:'ALERT-007',ruleName:'网络延迟异常',deviceName:'UPS电源-E05',level:'major',value:'RTT 680ms',status:'resolved',triggeredAt:'2024-06-08 08:30:00',handler:'网络组' },
  { id:'ALERT-008',ruleName:'电池低电量预警',deviceName:'空气质量检测-D04',level:'minor',value:'72% (阈值20%)',status:'resolved',triggeredAt:'2024-06-07 22:00:00',handler:null },
  { id:'ALERT-009',ruleName:'温度超限告警',deviceName:'烟感探测器-G07',level:'critical',value:'36.2°C',status:'resolved',triggeredAt:'2024-06-08 11:30:00',handler:'消防组' },
  { id:'ALERT-010',ruleName:'非法访问尝试',deviceName:'防火墙-主控',level:'critical',value:'5次认证失败',status:'processing',triggeredAt:'2024-06-08 13:20:00',handler:'安全团队' },
];

export default function DeviceAlertPage() {
  const [activeTab, setActiveTab] = useState('events');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [levelFilter, setLevelFilter] = useState<string>('');

  const getLevelConfig = (l:string) => ({ critical:{color:'red',text:'严重'}, major:{color:'orange',text:'重要'}, minor:{color:'gold',text:'次要'}, warning:{color:'blue',text:'警告'} }[l]||{color:'default',text:l});
  const getStatusBadge = (s:string) => ({ open:{color:'error',text:'待处理'}, acknowledged:{color:'warning',text:'已确认'}, processing:{color:'processing',text:'处理中'}, resolved:{color:'success',text:'已解决'} }[s]||{color:'default',text:s});

  const eventColumns = [
    { title:'等级',dataIndex:'level',key:'level',width:90,render:(l:string)=>{const c=getLevelConfig(l);return <Tag color={c.color} icon={<ExclamationCircleOutlined />}>{c.text}</Tag>;}},
    { title:'告警规则',dataIndex:'ruleName',key:'ruleName',render:(v:string)=><span className="font-medium">{v}</span> },
    { title:'关联设备',dataIndex:'deviceName',key:'deviceName',width:150,render:(v:string)=><Tag>{v}</Tag> },
    { title:'触发值',dataIndex:'value',key:'value',ellipsis:true,render:(v:string)=><code className="text-xs">{v}</code> },
    { title:'状态',dataIndex:'status',key:'status',width:100,render:(s:string)=>{const st=getStatusBadge(s);return <Badge status={st.color as any} text={st.text} />;}},
    { title:'触发时间',dataIndex:'triggeredAt',key:'triggeredAt',width:160 },
    { title:'处理人',dataIndex:'handler',key:'handler',width:100,render:(v:string|null)=>v||<span className="text-gray-400">-</span> },
  ];
  const eventActions:any[] = [{ key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setSelectedAlert(r);setDetailVisible(true);}},{ key:'handle',label:'处理',icon:<ToolOutlined />,type:'primary',onClick:()=>message.success('已记录')}];

  const ruleColumns = [
    { title:'规则名称',dataIndex:'name',key:'name',render:(v:string)=><span className="font-semibold">{v}</span> },
    { title:'等级',dataIndex:'level',key:'level',width:90,render:(l:string)=><Tag color={getLevelConfig(l).color}>{getLevelConfig(l).text}</Tag> },
    { title:'触发条件',dataIndex:'condition',key:'condition',render:(v:string)=><code className="text-xs bg-red-50 px-1 rounded">{v}</code> },
    { title:'适用设备',dataIndex:'devices',key:'devices',width:140,render:(v:string[])=>v.join(', ') },
    { title:'启用',dataIndex:'enabled',key:'enabled',width:70,render:(v:boolean)=><Switch checked={v} size="small" disabled/> },
    { title:'触发次数',dataIndex:'triggerCount',key:'triggerCount',width:100,render:(v:number)=>v.toLocaleString() },
    { title:'平均响应',dataIndex:'avgResponseTime',key:'avgResponseTime',width:110 },
    { title:'通知渠道',dataIndex:'notifyChannels',key:'notifyChannels',width:150,render:(v:string[])=>v.map((ch:string)=><Tag key={ch}>{ch}</Tag>) },
  ];
  const ruleActions:any[] = [{ key:'edit',label:'编辑',icon:<EditOutlined />,onClick:()=>message.info('编辑规则')},{ key:'toggle',label:'启停',icon:<SettingOutlined />,onClick:()=>message.success('已切换')}];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BellOutlined className="text-red-500" /> 设备告警中心</h1>
            <p className="text-gray-500 mt-1">告警规则配置、实时告警通知与工单联动处理</p>
          </div>
          <Space><Button icon={<PlusOutlined />} onClick={()=>message.info('新建规则')}>新建规则</Button></Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="告警规则" value={mockRules.length} icon={<SettingOutlined />} color="#1677FF" suffix="条" description={`启用 ${mockRules.filter(r=>r.enabled).length}`} /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日告警" value={7} icon={<WarningOutlined />} color="#F59E0B" trend="up" trendValue="+3 较昨日" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="已处理" value={mockAlertEvents.filter(e=>e.status==='resolved').length} icon={<CheckCircleOutlined />} color="#16A34A" description="解决率 40%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均响应" value={8.5} icon={<ClockCircleOutlined />} color="#7C3AED" suffix="分钟" description="MTTR" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="严重告警" value={mockAlertEvents.filter(e=>e.level==='critical').length} icon={<ExclamationCircleOutlined />} color="#DC2626" description="需立即关注" /></Col>
        </Row>

        {mockAlertEvents.some(e=>e.status==='open'&&e.level==='critical') && (
          <Alert type="error" showIcon message={`${mockAlertEvents.filter(e=>e.status==='open'&&e.level==='critical').length} 条严重告警待处理`}
            action={<Button size="small" danger onClick={()=>setActiveTab('events')}>立即查看</Button>} className="shadow-sm" />
        )}

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key:'events',label:`<span><BellOutlined /> 告警事件 (${mockAlertEvents.length})</span>`,
            children:(
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Select placeholder="等级筛选" style={{width:120}} allowClear value={levelFilter||undefined} onChange={setLevelFilter}
                    options={[{label:'严重',value:'critical'},{label:'重要',value:'major'},{label:'次要',value:'minor'},{label:'警告',value:'warning'}]} />
                  <Tag color="red">严重:{mockAlertEvents.filter(e=>e.level==='critical').length}</Tag>
                  <Tag color="orange">重要:{mockAlertEvents.filter(e=>e.level==='major').length}</Tag>
                </div>
                <DataTable columns={eventColumns} dataSource={levelFilter?mockAlertEvents.filter(e=>e.level===levelFilter):mockAlertEvents}
                  title="告警事件列表" actions={eventActions} rowKey="id" pagination={{pageSize:10}} />
              </div>
            )
          },
          { key:'rules',label:`<span><SettingOutlined /> 规则管理 (${mockRules.length})</span>`,
            children: <DataTable columns={ruleColumns} dataSource={mockRules} title="告警规则配置" actions={ruleActions} rowKey="id" pagination={{pageSize:8}} />
          },
        ]} />

        <Modal title={`告警详情 - ${selectedAlert?.id||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={650}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>,<Button type="primary" key="handle" icon={<ToolOutlined />} onClick={()=>{message.success('已处理');setDetailVisible(false);}}>标记处理</Button>]}>
          {selectedAlert && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="告警ID">{selectedAlert.id}</Descriptions.Item>
              <Descriptions.Item label="告警规则">{selectedAlert.ruleName}</Descriptions.Item>
              <Descriptions.Item label="告警等级"><Tag color={getLevelConfig(selectedAlert.level).color}>{getLevelConfig(selectedAlert.level).text}</Tag></Descriptions.Item>
              <Descriptions.Item label="当前状态"><Badge status={getStatusBadge(selectedAlert.status).color as any} text={getStatusBadge(selectedAlert.status).text}/></Descriptions.Item>
              <Descriptions.Item label="关联设备">{selectedAlert.deviceName}</Descriptions.Item>
              <Descriptions.Item label="触发值"><code>{selectedAlert.value}</code></Descriptions.Item>
              <Descriptions.Item label="触发时间">{selectedAlert.triggeredAt}</Descriptions.Item>
              <Descriptions.Item label="处理人">{selectedAlert.handler||'--'}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-red-50 to-orange-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">智能告警降噪与升级机制</h4>
            <p className="text-sm text-gray-600">支持告警抑制、去重聚合和自动升级。基于历史数据学习误报模式，自动降低低价值告警噪音。严重告警自动升级至值班电话，确保关键事件零遗漏。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
