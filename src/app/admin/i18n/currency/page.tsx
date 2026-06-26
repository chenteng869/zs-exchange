'use client';
import { useState } from 'react';
import { Card, Table, Button, Tag, Badge, Space, Row, Col, Modal, Descriptions, message, Switch } from 'antd';
import { EyeOutlined, PlusOutlined, DollarCircleOutlined, RiseOutlined, FallOutlined, SyncOutlined, LineChartOutlined, ReloadOutlined, PercentageOutlined, BankOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const mockCurrencies = [
  { id:'CUR-001',name:'美元',code:'USD',symbol:'$',isoCode:'840',rateToBase:1.0000,change:'+0.00%',source:'美联储',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-002',name:'人民币',code:'CNY',symbol:'¥',isoCode:'156',rateToBase:0.1380,change:'+0.15%',source:'中国外汇交易中心',updateFreq:'每日',autoUpdate:true,status:'active' },
  { id:'CUR-003',name:'欧元',code:'EUR',symbol:'€',isoCode:'978',rateToBase:1.0872,change:'-0.22%',source:'欧洲央行',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-004',name:'日元',code:'JPY',symbol:'¥',isoCode:'392',rateToBase:0.00635,change:'+0.08%',source:'日本央行',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-005',name:'英镑',code:'GBP',symbol:'£',isoCode:'826',rateToBase:1.2695,change:'+0.31%',source:'英格兰银行',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-006',name:'韩元',code:'KRW',symbol:'₩',isoCode:'410',rateToBase:0.00074,change:'-0.45%',source:'韩国银行',updateFreq:'每日',autoUpdate:true,status:'active' },
  { id:'CUR-007',name:'港元',code:'HKD',symbol:'HK$',isoCode:'344',rateToBase:0.1280,change:'+0.02%',source:'香港金管局',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-008',name:'新加坡元',code:'SGD',symbol:'S$',isoCode:'702',rateToBase:0.7415,change:'+0.18%',source:'新加坡金管局',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-009',name:'澳元',code:'AUD',symbol:'A$',isoCode:'036',rateToBase:0.6520,change:'-0.56%',source:'澳洲联储',updateFreq:'实时',autoUpdate:true,status:'active' },
  { id:'CUR-010',name:'USDT(稳定币)',code:'USDT',symbol:'₮',isoCode:'-',rateToBase:1.0001,change:'+0.01%',source:'链上聚合',updateFreq:'5分钟',autoUpdate:false,status:'monitoring' },
];

export default function CurrencyPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedCur, setSelectedCur] = useState<any>(null);

  const getChangeColor = (c:string) => c.startsWith('+')?'#16A34A':c.startsWith('-')?'#DC2626':'#9CA3AF';

  const columns = [
    { title:'货币名称',dataIndex:'name',key:'name',render:(v:string,r:any)=><span className="font-semibold">{r.symbol} {v}</span> },
    { title:'代码',dataIndex:'code',key:'code',width:80,render:(v:string)=><code>{v}</code> },
    { title:'ISO编号',dataIndex:'isoCode',key:'isoCode',width:85,render:(v:string)=>v!=='-'?<Tag>{v}</Tag>:<span className="text-gray-400">-</span> },
    { title:'汇率(对USD)',dataIndex:'rateToBase',key:'rateToBase',width:120,render:(v:number)=><span className="font-mono font-medium">{v.toFixed(4)}</span> },
    { title:'涨跌幅',dataIndex:'change',key:'change',width:95,render:(c:string)=><span style={{color:getChangeColor(c)}}>{c.startsWith('+')?<RiseOutlined />:<FallOutlined />}{c}</span> },
    { title:'数据源',dataIndex:'source',key:'source',width:130,render:(v:string)=><Tag>{v}</Tag> },
    { title:'更新频率',dataIndex:'updateFreq',key:'updateFreq',width:90,render:(v:string)=><Tag color="cyan">{v}</Tag> },
    { title:'自动更新',dataIndex:'autoUpdate',key:'autoUpdate',width:90,render:(v:boolean)=><Switch checked={v} size="small" disabled/> },
    { title:'状态',dataIndex:'status',key:'status',width:95,render:(s:string)=><Badge status={s==='active'?'success':s==='monitoring'?'processing':'error'} text={s==='active'?'正常':s==='monitoring'?'监控中':'异常'}/>,
    },
  ];
  const actions:any[] = [
    { key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setSelectedCur(r);setDetailVisible(true);} },
    { key:'refresh',label:'刷新汇率',icon:<ReloadOutlined />,type:'primary',onClick:()=>message.success('已刷新')},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DollarCircleOutlined className="text-yellow-600" /> 货币管理</h1>
            <p className="text-gray-500 mt-1">多货币配置、汇率管理、格式化规则与自动更新策略</p>
          </div>
          <Space>
            <Button icon={<SyncOutlined />} onClick={()=>message.info('全部刷新')}>全部刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={()=>message.info('添加货币')}>添加货币</Button>
          </Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="支持货币" value={mockCurrencies.length} icon={<BankOutlined />} color="#1677FF" suffix="种" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="汇率来源" value={new Set(mockCurrencies.map(c=>c.source)).size} icon={<LineChartOutlined />} color="#16A34A" suffix="个" description="多源聚合" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="更新策略" value="混合模式" icon={<PercentageOutlined />} color="#7C3AED" suffix="" description="实时+定时混合" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日查询" value="8.52万" icon={<ThunderboltOutlined />} color="#F59E0B" suffix="次" trend="up" trendValue="+12%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="自动更新" value={mockCurrencies.filter(c=>c.autoUpdate).length} icon={<SyncOutlined />} color="#16A34A" suffix="种" description={`共${mockCurrencies.length}种`} /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockCurrencies} title="货币配置列表" actions={actions} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索货币名称或代码"/>

        <Modal title={`货币详情 - ${selectedCur?.name||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={650}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>,<Button key="refresh" type="primary" icon={<ReloadOutlined />} onClick={()=>{message.success('汇率已刷新');setDetailVisible(false);}}>立即刷新</Button>]}>
          {selectedCur && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="货币名称"><span className="font-semibold">{selectedCur.symbol} {selectedCur.name}</span></Descriptions.Item>
              <Descriptions.Item label="货币代码"><code>{selectedCur.code}</code></Descriptions.Item>
              <Descriptions.Item label="ISO编号">{selectedCur.isoCode!=='-'?selectedCur.isoCode:'-'}</Descriptions.Item>
              <Descriptions.Item label="当前汇率"><span className="font-mono text-lg font-bold text-green-600">{selectedCur.rateToBase.toFixed(4)}</span></Descriptions.Item>
              <Descriptions.Item label="涨跌幅"><span style={{color:getChangeColor(selectedCur.change)}}>{selectedCur.change.startsWith('+')?<RiseOutlined />:<FallOutlined />}{selectedCur.change}</span></Descriptions.Item>
              <Descriptions.Item label="数据源"><Tag>{selectedCur.source}</Tag></Descriptions.Item>
              <Descriptions.Item label="更新频率"><Tag color="cyan">{selectedCur.updateFreq}</Tag></Descriptions.Item>
              <Descriptions.Item label="自动更新"><Switch checked={selectedCur.autoUpdate} disabled/></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={selectedCur.status==='active'?'success':'processing'} text={selectedCur.status==='active'?'正常':'监控中'}/></Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-yellow-50 to-amber-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">多源汇率聚合引擎</h4>
            <p className="text-sm text-gray-600">支持从多个权威数据源（央行、交易所、聚合商）获取实时汇率。内置智能缓存策略和异常值检测机制。支持加密货币稳定币的链上价格追踪。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
