'use client';

import { useState } from 'react';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col,
  Progress, Modal, Descriptions, Divider, message, Select, Form, Input,
  Tabs,
} from 'antd';
import {
  EyeOutlined, EditOutlined, PlusOutlined, DownloadOutlined,
  GlobalOutlined, TranslationOutlined, CheckCircleOutlined, SyncOutlined,
  ClockCircleOutlined, FileTextOutlined, UserOutlined, SearchOutlined,
  ReloadOutlined, ExportOutlined, ImportOutlined, FlagOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 语言包列表（10条）
const mockLanguagePacks = [
  { id: 'LANG-001', language: '简体中文', code: 'zh-CN', locale: 'zh_Hans_CN', entries: 2856, completed: 100, progress: 100, translator: '李娜', status: 'published', lastUpdate: '2024-06-08 14:30', version: 'v3.2.1' },
  { id: 'LANG-002', language: 'English (US)', code: 'en-US', locale: 'en_US', entries: 2856, completed: 2780, progress: 97.3, translator: 'John Smith', status: 'reviewing', lastUpdate: '2024-06-08 13:15', version: 'v3.1.0' },
  { id: 'LANG-003', language: '日本語', code: 'ja-JP', locale: 'ja_JP', entries: 2856, completed: 2650, progress: 92.8, translator: '田中太郎', status: 'translating', lastUpdate: '2024-06-08 12:00', version: 'v2.8.5' },
  { id: 'LANG-004', language: '한국어', code: 'ko-KR', locale: 'ko_KR', entries: 2856, completed: 2540, progress: 88.9, translator: '김민수', status: 'translating', lastUpdate: '2024-06-08 10:45', version: 'v2.5.0' },
  { id: 'LANG-005', language: 'Français', code: 'fr-FR', locale: 'fr_FR', entries: 2856, completed: 2400, progress: 84.0, translator: 'Marie Dupont', status: 'translating', lastUpdate: '2024-06-07 16:30', version: 'v2.2.0' },
  { id: 'LANG-006', language: 'Deutsch', code: 'de-DE', locale: 'de_DE', entries: 2856, completed: 2200, progress: 77.0, translator: 'Hans Mueller', status: 'translating', lastUpdate: '2024-06-07 14:20', version: 'v2.0.0' },
  { id: 'LANG-007', language: 'Español', code: 'es-ES', locale: 'es_ES', entries: 2856, completed: 1980, progress: 69.3, translator: 'Carlos García', status: 'draft', lastUpdate: '2024-06-06 11:00', version: 'v1.7.0' },
  { id: 'LANG-008', language: 'Português (BR)', code: 'pt-BR', locale: 'pt_BR', entries: 2856, completed: 1750, progress: 61.3, translator: 'Ana Silva', status: 'draft', lastUpdate: '2024-06-05 09:30', version: 'v1.5.0' },
  { id: 'LANG-009', language: 'Русский', code: 'ru-RU', locale: 'ru_RU', entries: 2856, completed: 1500, progress: 52.5, translator: 'Иван Петров', status: 'planned', lastUpdate: '-', version: '-' },
  { id: 'LANG-010', language: 'العربية', code: 'ar-SA', locale: 'ar_SA', entries: 2856, completed: 850, progress: 29.8, translator: 'أحمد محمد', status: 'planned', lastUpdate: '-', version: '-' },
];

// 翻译进度分布图
const translationDistOption = {
  tooltip:{trigger:'item'},series:[{
    type:'pie',radius:['40%','70%'],data:[
      {value:1,name:'已发布',itemStyle:{color:'#16A34A'}},
      {value:1,name:'审核中',itemStyle:{color:'#F59E0B'}},
      {value:3,name:'翻译中',itemStyle:{color:'#1677FF'}},
      {value:2,name:'草稿',itemStyle:{color:'#9CA3AF'}},
      {value:2,name:'计划中',itemStyle:{color:'#DC2626'}},
    ],label:{formatter:'{b}\n{d}%'},
  }],
};

export default function LanguagePackPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLang, setSelectedLang] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 状态渲染
  const getStatusConfig = (s:string) => ({
    published:{color:'success',text:'已发布'}, reviewing:{color:'processing',text:'审核中'},
    translating:{color:'warning',text:'翻译中'}, draft:{color:'default',text:'草稿'},
    planned:{color:'error',text:'计划中'},
  }[s]||{color:'default',text:s});

  // 进度颜色
  const getProgressStatus = (p:number) => p===100?'success':p>=80?'normal':p>=50?'exception':'exception';

  const columns = [
    { title:'语言',dataIndex:'language',key:'language',render:(v:string)=><span className="font-semibold text-lg"><FlagOutlined /> {v}</span> },
    { title:'语言代码',dataIndex:'code',key:'code',width:95,render:(v:string)=><code className="text-xs">{v}</code> },
    { title:'Locale',dataIndex:'locale',key:'locale',width:110,render:(v:string)=><code className="text-xs bg-gray-100 px-1 rounded">{v}</code> },
    { title:'总条目',dataIndex:'entries',key:'entries',width:80,render:(v:number)=>v.toLocaleString() },
    { title:'已完成',dataIndex:'completed',key:'completed',width:90,render:(v:number)=>v.toLocaleString() },
    { title:'完成度',dataIndex:'progress',key:'progress',width:150,render:(p:number)=>
      <Progress percent={Math.round(p)} size="small" status={getProgressStatus(p) as any} format={()=><>{Math.round(p)}%</>} />
    },
    { title:'译者',dataIndex:'translator',key:'translator',width:120,render:(v:string)=><><UserOutlined /> {v}</> },
    { title:'状态',dataIndex:'status',key:'status',width:100,render:(s:string)=>{const st=getStatusConfig(s);return <Badge status={st.color as any} text={st.text}/>;}},
    { title:'版本',dataIndex:'version',key:'version',width:85,render:(v:string)=><Tag color="blue">{v}</Tag> },
    { title:'最后更新',dataIndex:'lastUpdate',key:'lastUpdate',width:155 },
  ];

  const actions:any[] = [
    { key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setSelectedLang(r);setDetailVisible(true);} },
    { key:'edit',label:'编辑',icon:<EditOutlined />,type:'primary',onClick:()=>message.info('打开编辑器')},
    { key:'export',label:'导出',icon:<ExportOutlined />,onClick:()=>message.success('已导出')},
  ];

  const filtered = statusFilter ? mockLanguagePacks.filter(l=>l.status===statusFilter) : mockLanguagePacks;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><GlobalOutlined className="text-blue-600" /> 语言包管理</h1>
            <p className="text-gray-500 mt-1">多语言包管理、翻译条目维护、版本控制与发布流程</p>
          </div>
          <Space>
            <Button icon={<ImportOutlined />} onClick={()=>message.info('导入翻译文件')}>导入</Button>
            <Button icon={<ExportOutlined />} onClick={()=>message.info('全部导出')}>批量导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={()=>message.info('新建语言包')}>新增语言</Button>
          </Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="支持语言" value={mockLanguagePacks.length} icon={<GlobalOutlined />} color="#1677FF" suffix="种" description="覆盖主要市场" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="翻译条目" value={mockLanguagePacks[0].entries?.toLocaleString()||'0'} icon={<TranslationOutlined />} color="#16A34A" suffix="条/语种" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均进度" value={75.9} icon={<CheckCircleOutlined />} color="#F59E0B" suffix="%" trend="up" trendValue="+2.3% 本周" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日更新" value={12} icon={<ClockCircleOutlined />} color="#7C3AED" suffix="个条目" description="较昨日 +5" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="待审核" value={mockLanguagePacks.filter(l=>l.status==='reviewing').length} icon={<SyncOutlined />} color="#DC2626" description="需人工复核" /></Col>
        </Row>

        <Row gutter={[16,16]}>
          <Col xs={24} lg={17}>
            <div className="flex items-center gap-3 mb-4">
              <Select placeholder="状态筛选" style={{width:130}} allowClear value={statusFilter||undefined} onChange={setStatusFilter}
                options={[{label:'已发布',value:'published'},{label:'审核中',value:'reviewing'},{label:'翻译中',value:'translating'},{label:'草稿',value:'draft'},{label:'计划中',value:'planned'}]} />
              <Tag color="green">已发布:{mockLanguagePacks.filter(l=>l.status==='published').length}</Tag>
              <Tag color="orange">翻译中:{mockLanguagePacks.filter(l=>l.status==='translating').length}</Tag>
              <Tag color="blue">草稿:{mockLanguagePacks.filter(l=>l.status==='draft').length}</Tag>
            </div>
            <DataTable columns={columns} dataSource={filtered} title="语言包列表" actions={actions} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索语言或代码"/>
          </Col>
          <Col xs={24} lg={7}>
            <Card title="翻译状态分布" className="shadow-sm" size="small">
              <SafeECharts option={translationDistOption} style={{height:300}} title="分布图"/>
              <Divider className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>平均完成率</span><strong>75.9%</strong></div>
                <div className="flex justify-between"><span>最高进度</span><Tag color="green">简体中文 100%</Tag></div>
                <div className="flex justify-between"><span>最低进度</span><Tag color="red">阿拉伯语 29.8%</Tag></div>
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`语言包详情 - ${selectedLang?.language||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>,<Button key="edit" type="primary" icon={<EditOutlined />} onClick={()=>{message.info('打开编辑器');setDetailVisible(false);}}>进入编辑</Button>]}>
          {selectedLang && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="语言">{selectedLang.language}</Descriptions.Item>
              <Descriptions.Item label="代码"><code>{selectedLang.code}</code></Descriptions.Item>
              <Descriptions.Item label="Locale"><code>{selectedLang.locale}</code></Descriptions.Item>
              <Descriptions.Item label="版本"><Tag color="blue">{selectedLang.version}</Tag></Descriptions.Item>
              <Descriptions.Item label="总条目">{selectedLang.entries.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="已完成">{selectedLang.completed.toLocaleString()} ({selectedLang.progress}%)</Descriptions.Item>
              <Descriptions.Item label="进度"><Progress percent={Math.round(selectedLang.progress)} format={() => selectedLang.progress + '%'} /></Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={getStatusConfig(selectedLang.status).color as any} text={getStatusConfig(selectedLang.status).text}/></Descriptions.Item>
              <Descriptions.Item label="译者">{selectedLang.translator}</Descriptions.Item>
              <Descriptions.Item label="最后更新">{selectedLang.lastUpdate}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-cyan-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">i18n 翻译工作流引擎</h4>
            <p className="text-sm text-gray-600">支持基于 JSON/YAML 的标准 i18n 格式，集成机器翻译辅助和术语库管理。提供版本对比、差异合并和一键发布能力。支持 RTL（从右到左）语言的自动布局适配。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}
