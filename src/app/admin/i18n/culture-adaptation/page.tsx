'use client';
import { useState } from 'react';
import { Card, Table, Button, Tag, Badge, Space, Row, Col, Modal, Descriptions, message, Select } from 'antd';
import { EyeOutlined, EditOutlined, PlusOutlined, GlobalOutlined, CheckCircleOutlined, SettingOutlined, ExperimentOutlined, FlagOutlined, CalendarOutlined, WarningOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const mockCultureRules = [
  { id:'CUL-001',category:'日期格式',ruleName:'短日期显示',targetRegion:'全球',dimension:'时间观念',priority:'critical',currentValue:'YYYY-MM-DD',status:'active',impactScope:'全局',lastAdjust:'2024-06-01' },
  { id:'CUL-002',category:'数字格式',ruleName:'千分位分隔符',targetRegion:'欧美',dimension:'数字习惯',priority:'high',currentValue:', (逗号)',status:'active',impactScope:'金额/统计',lastAdjust:'2024-05-20' },
  { id:'CUL-003',category:'文本方向',ruleName:'RTL布局支持',targetRegion:'阿拉伯/希伯来',dimension:'阅读方向',priority:'critical',currentValue:'LTR→RTL自适应',status:'active',impactScope:'页面布局',lastAdjust:'2024-06-05' },
  { id:'CUL-004',category:'货币符号位置',ruleName:'金额显示规则',targetRegion:'按地区',dimension:'商业习惯',priority:'high',currentValue:'符号在数值前',status:'reviewing',impactScope:'交易/钱包',lastAdjust:'2024-06-07' },
  { id:'CUL-005',category:'姓名排序',ruleName:'用户名显示顺序',targetRegion:'东亚',dimension:'社会文化',priority:'medium',currentValue:'姓在前',status:'active',impactScope:'用户资料',lastAdjust:'2024-04-15' },
  { id:'CUL-006',category:'颜色含义',ruleName:'颜色语义映射',targetRegion:'全球',dimension:'视觉心理',priority:'medium',currentValue:'红=警告/错误',status:'reviewing',impactScope:'UI反馈',lastAdjust:'2024-05-28' },
  { id:'CUL-007',category:'地址格式',ruleName:'地址输入顺序',targetRegion:'按国家',dimension:'行政体系',priority:'high',currentValue:'从大到小(国→市→街)',status:'active',impactScope:'KYC/配送',lastAdjust:'2024-05-10' },
  { id:'CUL-008',category:'星期起始日',ruleName:'日历周起始',targetRegion:'按地区',dimension:'时间观念',priority:'low',currentValue:'周一(默认)',status:'planned',impactScope:'日历组件',lastAdjust:null },
  { id:'CUL-009',category:'度量单位',ruleName:'单位制选择',targetRegion:'按地区',dimension:'计量标准',priority:'high',currentValue:'公制(默认)',status:'active',impactScope:'设备数据/物流',lastAdjust:'2024-04-01' },
  { id:'CUL-010',category:'图片禁忌',ruleName:'敏感内容过滤',targetRegion:'伊斯兰国家',dimension:'宗教文化',priority:'critical',currentValue:'自动检测+替换',status:'active',impactScope:'营销素材/NFT',lastAdjust:'2024-06-08' },
];

export default function CultureAdaptationPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  const getPriorityConfig = (p:string) => ({ critical:{color:'red',text:'紧急'}, high:{color:'orange',text:'高'}, medium:{color:'blue',text:'中'}, low:{color:'default',text:'低'} }[p]||{color:'default',text:p});
  const getStatusBadge = (s:string) => ({ active:{color:'success',text:'生效'}, reviewing:{color:'processing',text:'评审中'}, planned:{color:'warning',text:'计划中'} }[s]||{color:'default',text:s});

  const columns = [
    { title:'分类',dataIndex:'category',key:'category',width:110,render:(c:string)=><Tag color="purple">{c}</Tag> },
    { title:'规则名称',dataIndex:'ruleName',key:'ruleName',render:(v:string)=><span className="font-semibold">{v}</span> },
    { title:'目标地区',dataIndex:'targetRegion',key:'targetRegion',width:120,render:(v:string)=><><FlagOutlined />{v}</> },
    { title:'文化维度',dataIndex:'dimension',key:'dimension',width:100,render:(d:string)=><Tag color="cyan">{d}</Tag> },
    { title:'优先级',dataIndex:'priority',key:'priority',width:85,render:(p:string)=>{const c=getPriorityConfig(p);return <Tag color={c.color}>{c.text}</Tag>;}},
    { title:'当前值',dataIndex:'currentValue',key:'currentValue',width:150,render:(v:string)=><code className="text-xs bg-gray-50 px-1 rounded block max-w-full truncate">{v}</code> },
    { title:'状态',dataIndex:'status',key:'status',width:90,render:(s:string)=>{const st=getStatusBadge(s);return <Badge status={st.color as any} text={st.text}/>;}},
    { title:'影响范围',dataIndex:'impactScope',key:'impactScope',width:100,render:(v:string)=><Tag>{v}</Tag> },
    { title:'最后调整',dataIndex:'lastAdjust',key:'lastAdjust',width:130,render:(v:string|null)=>v||<span className="text-gray-400">-</span> },
  ];
  const actions:any[] = [
    { key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setSelectedRule(r);setDetailVisible(true);} },
    { key:'edit',label:'调整',icon:<SettingOutlined />,type:'primary',onClick:()=>message.info('打开调整面板')},
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><GlobalOutlined className="text-purple-600" /> 文化适配管理</h1>
            <p className="text-gray-500 mt-1">本地化规则配置、文化差异处理、格式适配与区域化策略</p>
          </div>
          <Space><Button type="primary" icon={<PlusOutlined />} onClick={()=>message.info('新增适配规则')}>新增规则</Button></Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="适配规则" value={mockCultureRules.length} icon={<ExperimentOutlined />} color="#1677FF" suffix="条" description="全部维度覆盖" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="覆盖地区" value={28} icon={<FlagOutlined />} color="#16A34A" suffix="个国家/地区" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="文化维度" value={new Set(mockCultureRules.map(r=>r.dimension)).size} icon={<TeamOutlined />} color="#7C3AED" suffix="个维度" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日调整" value={mockCultureRules.filter(r=>r.lastAdjust?.includes('2024-06-08')).length} icon={<ThunderboltOutlined />} color="#F59E0B" suffix="条" description="较昨日 +2" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="待优化" value={mockCultureRules.filter(r=>r.status!=='active').length} icon={<WarningOutlined />} color="#DC2626" suffix="条" description="需关注" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockCultureRules} title="文化适配规则列表" actions={actions} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索规则名称或分类"/>

        <Modal title={`规则详情 - ${selectedRule?.ruleName||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>,<Button key="adjust" type="primary" icon={<SettingOutlined />} onClick={()=>{message.info('调整已保存');setDetailVisible(false);}}>保存调整</Button>]}>
          {selectedRule && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="分类"><Tag color="purple">{selectedRule.category}</Tag></Descriptions.Item>
              <Descriptions.Item label="规则名称"><span className="font-semibold">{selectedRule.ruleName}</span></Descriptions.Item>
              <Descriptions.Item label="目标地区"><><FlagOutlined />{selectedRule.targetRegion}</></Descriptions.Item>
              <Descriptions.Item label="文化维度"><Tag color="cyan">{selectedRule.dimension}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={getPriorityConfig(selectedRule.priority).color}>{getPriorityConfig(selectedRule.priority).text}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={getStatusBadge(selectedRule.status).color as any} text={getStatusBadge(selectedRule.status).text}/></Descriptions.Item>
              <Descriptions.Item label="当前值"><code className="bg-gray-50 px-1 rounded">{selectedRule.currentValue}</code></Descriptions.Item>
              <Descriptions.Item label="影响范围"><Tag>{selectedRule.impactScope}</Tag></Descriptions.Item>
              <Descriptions.Item label="最后调整" span={2}>{selectedRule.lastAdjust||'--'}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-purple-50 to-pink-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">Hofstede 文化维度框架集成</h4>
            <p className="text-sm text-gray-600">基于 Hofstede 六维文化理论（权力距离、个人主义、男性化、不确定性规避、长期导向、 indulgence），自动适配UI布局、交互方式和内容呈现。支持 A/B 测试验证区域化效果。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
