'use client';

import { useState } from 'react';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col,
  Progress, Modal, Descriptions, Divider, message, Select,
} from 'antd';
import {
  EyeOutlined, EditOutlined, PlusOutlined, SettingOutlined,
  ClockCircleOutlined, GlobalOutlined, SwapOutlined, CheckCircleOutlined,
  WarningOutlined, ThunderboltOutlined, EnvironmentOutlined, CalendarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const mockTimezones = [
  { id:'TZ-001',name:'中国标准时间 (CST)',timezone:'Asia/Shanghai',utcOffset:'+08:00',abbreviation:'CST',dstObserved:false,dstRule:null,coveredRegions:['中国大陆','香港','澳门','台湾'],activeUsers:158000,todayQueries:42500,status:'active',priority:'primary' },
  { id:'TZ-002',name:'协调世界时 (UTC)',timezone:'UTC',utcOffset:'+00:00',abbreviation:'UTC',dstObserved:false,dstRule:null,coveredRegions:['全球基准'],activeUsers:45000,todayQueries:12800,status:'active',priority:'reference' },
  { id:'TZ-003',name:'美国东部时间 (ET)',timezone:'America/New_York',utcOffset:'-05:00',abbreviation:'EST',dstObserved:true,dstRule:'DST:3月第2周日→11月第1周日(+1h)',coveredRegions:['美国东部','加拿大东部'],activeUsers:32000,todayQueries:8900,status:'active',priority:'secondary' },
  { id:'TZ-004',name:'美国太平洋时间 (PT)',timezone:'America/Los_Angeles',utcOffset:'-08:00',abbreviation:'PST',dstObserved:true,dstRule:'DST:3月第2周日→11月第1周日(+1h)',coveredRegions:['美国西部','加拿大西部'],activeUsers:28000,todayQueries:7200,status:'active',priority:'secondary' },
  { id:'TZ-005',name:'日本标准时间 (JST)',timezone:'Asia/Tokyo',utcOffset:'+09:00',abbreviation:'JST',dstObserved:false,dstRule:null,coveredRegions:['日本'],activeUsers:22000,todayQueries:6500,status:'active',priority:'secondary' },
  { id:'TZ-006',name:'欧洲中部时间 (CET)',timezone:'Europe/Berlin',utcOffset:'+01:00',abbreviation:'CET',dstObserved:true,dstRule:'DST:3月最后周日→10月最后周日(+1h)',coveredRegions:['德国','法国','意大利'],activeUsers:18500,todayQueries:5200,status:'active',priority:'secondary' },
  { id:'TZ-007',name:'韩国标准时间 (KST)',timezone:'Asia/Seoul',utcOffset:'+09:00',abbreviation:'KST',dstObserved:false,dstRule:null,coveredRegions:['韩国'],activeUsers:15000,todayQueries:4200,status:'active',priority:'secondary' },
  { id:'TZ-008',name:'新加坡标准时间 (SGT)',timezone:'Asia/Singapore',utcOffset:'+08:00',abbreviation:'SGT',dstObserved:false,dstRule:null,coveredRegions:['新加坡','马来西亚'],activeUsers:12000,todayQueries:3500,status:'active',priority:'tertiary' },
  { id:'TZ-009',name:'澳大利亚东部 (AET)',timezone:'Australia/Sydney',utcOffset:'+10:00',abbreviation:'AEST',dstObserved:true,dstRule:'DST:10月第1周日→4月第1周日(+1h)',coveredRegions:['澳大利亚东部'],activeUsers:8000,todayQueries:2100,status:'active',priority:'tertiary' },
  { id:'TZ-010',name:'印度标准时间 (IST)',timezone:'Asia/Kolkata',utcOffset:'+05:30',abbreviation:'IST',dstObserved:false,dstRule:null,coveredRegions:['印度','斯里兰卡'],activeUsers:25000,todayQueries:6800,status:'warning',priority:'secondary' },
];

export default function TimezonePage() {
  const [configVisible, setConfigVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedTz, setSelectedTz] = useState<any>(null);

  const getPriorityColor = (p:string) => ({primary:'red',secondary:'orange',tertiary:'blue',reference:'purple'}[p]||'default');
  const columns = [
    { title:'时区名称',dataIndex:'name',key:'name',render:(v:string)=><span className="font-semibold">{v}</span> },
    { title:'IANA标识',dataIndex:'timezone',key:'timezone',width:170,render:(v:string)=><code className="text-xs bg-gray-100 px-1 rounded">{v}</code> },
    { title:'UTC偏移',dataIndex:'utcOffset',key:'utcOffset',width:100,render:(v:string)=><Tag color="blue" className="font-mono">{v}</Tag> },
    { title:'缩写',dataIndex:'abbreviation',key:'abbreviation',width:80,render:(v:string)=><code>{v}</code> },
    { title:'夏令时',dataIndex:'dstObserved',key:'dstObserved',width:85,render:(v:boolean)=><Badge status={v?'warning':'success'} text={v?'是':'否'}/> },
    { title:'覆盖地区',dataIndex:'coveredRegions',key:'coveredRegions',width:170,render:(v:string[])=>v.map((r:string,i:number)=><Tag key={i}>{r}</Tag>) },
    { title:'优先级',dataIndex:'priority',key:'priority',width:90,render:(p:string)=><Tag color={getPriorityColor(p)}>{({primary:'主时区',secondary:'常用',tertiary:'一般',reference:'基准'}[p])}</Tag> },
    { title:'活跃用户',dataIndex:'activeUsers',key:'activeUsers',width:100,render:(v:number)=>v.toLocaleString() },
    { title:'今日查询',dataIndex:'todayQueries',key:'todayQueries',width:100,render:(v:number)=>v.toLocaleString() },
    { title:'状态',dataIndex:'status',key:'status',width:85,render:(s:string)=><Badge status={s==='active'?'success':'warning'} text={s==='active'?'正常':'注意'}/> },
  ];
  const actions:any[] = [
    { key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setSelectedTz(r);setConfigVisible(true);} },
    { key:'preview',label:'转换预览',icon:<SwapOutlined />,type:'primary',onClick:()=>setPreviewVisible(true) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ClockCircleOutlined className="text-green-600" /> 时区管理</h1>
            <p className="text-gray-500 mt-1">时区配置、夏令时规则管理、跨时区转换预览与自动校准</p>
          </div>
          <Space><Button icon={<PlusOutlined />} onClick={()=>message.info('添加时区')}>添加时区</Button></Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="配置时区" value={mockTimezones.length} icon={<GlobalOutlined />} color="#1677FF" suffix="个" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="覆盖地区" value={25} icon={<EnvironmentOutlined />} color="#16A34A" suffix="个国家/地区" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="转换规则" value={15} icon={<SwapOutlined />} color="#7C3AED" suffix="套" description={`含${mockTimezones.filter(t=>t.dstObserved).length}个DST`} /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日查询" value={'10.95万'} icon={<ThunderboltOutlined />} color="#F59E0B" suffix="次" trend="up" trendValue="+15%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="异常数" value={mockTimezones.filter(t=>t.status!=='active').length} icon={<WarningOutlined />} color="#DC2626" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockTimezones} title="时区配置列表" actions={actions} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索时区名称或城市"/>

        {/* 转换预览弹窗 */}
        <Modal title="跨时区转换预览" open={previewVisible} onCancel={()=>setPreviewVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setPreviewVisible(false)}>关闭</Button>]}>
          <Table size="middle" pagination={false} dataSource={[
            { from:'上海(UTC+8)', to:'纽约(UTC-5/EDT)', src:'2024-06-08 15:00', dst:'2024-06-08 03:00 (EDT)', diff:'-12h' },
            { from:'上海(UTC+8)', to:'伦敦(BST UTC+1)', src:'2024-06-08 15:00', dst:'2024-06-08 08:00 (BST)', diff:'-7h' },
            { from:'纽约(EDT UTC-4)', to:'东京(JST UTC+9)', src:'2024-06-08 09:00', dst:'2024-06-08 22:00 (JST)', diff:'+13h' },
            { from:'伦敦(BST UTC+1)', to:'悉尼(AEST UTC+10)', src:'2024-06-08 14:00', dst:'2024-06-08 23:00 (AEST)', diff:'+9h' },
          ]} columns={[
            {title:'源时区',dataIndex:'from'},{title:'目标时区',dataIndex:'to'},
            {title:'源时间',dataIndex:'src',render:(v:string)=><code className="bg-blue-50 px-1">{v}</code>},
            {title:'目标时间',dataIndex:'dst',render:(v:string)=><code className="bg-green-50 px-1 font-semibold">{v}</code>},
            {title:'时差',dataIndex:'diff',render:(v:string)=><Tag color={v.startsWith('+')?'green':'red'}>{v}</Tag>},
          ]} rowKey={(_:any,i:number)=>i}/>
        </Modal>

        {/* 配置详情 */}
        <Modal title={`时区配置 - ${selectedTz?.name||''}`} open={configVisible} onCancel={()=>setConfigVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setConfigVisible(false)}>关闭</Button>,<Button key="edit" type="primary" icon={<EditOutlined />}>编辑配置</Button>]}>
          {selectedTz && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="时区名称">{selectedTz.name}</Descriptions.Item>
              <Descriptions.Item label="IANA标识"><code>{selectedTz.timezone}</code></Descriptions.Item>
              <Descriptions.Item label="UTC偏移"><Tag color="blue" className="font-mono text-lg">{selectedTz.utcOffset}</Tag></Descriptions.Item>
              <Descriptions.Item label="缩写"><code>{selectedTz.abbreviation}</code></Descriptions.Item>
              <Descriptions.Item label="夏令时"><Badge status={selectedTz.dstObserved?'warning':'success'} text={selectedTz.dstObserved?'是':'否'}/></Descriptions.Item>
              <Descriptions.Item label="DST规则">{selectedTz.dstRule||'无夏令时'}</Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={getPriorityColor(selectedTz.priority)}>{({primary:'主时区',secondary:'常用',tertiary:'一般'}[selectedTz.priority])}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={selectedTz.status==='active'?'success':'warning'} text={selectedTz.status==='active'?'正常':'注意'}/></Descriptions.Item>
              <Descriptions.Item label="覆盖地区" span={2}>{selectedTz.coveredRegions.map((r:string)=><Tag key={r}>{r}</Tag>)}</Descriptions.Item>
              <Descriptions.Item label="活跃用户">{selectedTz.activeUsers.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="今日查询">{selectedTz.todayQueries.toLocaleString()} 次</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-green-50 to-emerald-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">IANA 时区数据库实时同步</h4>
            <p className="text-sm text-gray-600">自动同步 IANA Olson 时区数据库更新，支持所有已知夏令时过渡规则。内置智能 DST 边界检测，在切换前后自动提醒用户确认时间准确性。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
