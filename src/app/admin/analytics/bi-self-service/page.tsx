'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message } from 'antd';
import { FileTextOutlined, TeamOutlined, DatabaseOutlined, ScheduleOutlined, ShareAltOutlined, EyeOutlined, EditOutlined, PlayCircleOutlined, BarChartOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockReports = [
  { id: 'BI-001', name: '日交易概览仪表盘', type: 'dashboard', creator: 'DataTeam', accessLevel: 'public', views: 2850, lastModified: '2024-06-23 08:00', status: 'published', dataSource: ['交易数据', '用户数据'], schedule: '每日 09:00' },
  { id: 'BI-002', name: '用户留存漏斗分析', type: 'funnel', creator: 'ProductTeam', accessLevel: 'internal', views: 1420, lastModified: '2024-06-22 18:30', status: 'published', dataSource: ['用户行为日志'], schedule: '每周一 10:00' },
  { id: 'BI-003', name: 'DeFi协议TVL趋势报告', type: 'report', creator: 'ResearchTeam', accessLevel: 'public', views: 3680, lastModified: '2024-06-22 14:00', status: 'published', dataSource: ['DefiLlama API', '链上数据'], schedule: '每小时' },
  { id: 'BI-004', name: '风控指标监控面板', type: 'dashboard', creator: 'RiskTeam', accessLevel: 'restricted', views: 890, lastModified: '2024-06-22 11:20', status: 'published', dataSource: ['风控引擎', '交易数据'], schedule: '实时' },
  { id: 'BI-005', name: '营销活动ROI分析', type: 'report', creator: 'MarketingTeam', accessLevel: 'internal', views: 760, lastModified: '2024-06-21 16:45', status: 'draft', dataSource: ['广告数据', '转化数据'], schedule: '每月1号' },
  { id: 'BI-006', name: 'Gas费用优化建议', type: 'insight', creator: 'DevOpsTeam', accessLevel: 'public', views: 2150, lastModified: '2024-06-21 09:30', status: 'published', dataSource: ['Etherscan', '内部日志'], schedule: '每周三 08:00' },
  { id: 'BI-007', name: 'NFT市场热度指数', type: 'dashboard', creator: 'NFTTeam', accessLevel: 'public', views: 1920, lastModified: '2024-06-20 22:00', status: 'published', dataSource: ['OpenSea', 'LooksRare', 'Blur'], schedule: '每6小时' },
  { id: 'BI-008', name: 'API调用质量分析', type: 'report', creator: 'DevTeam', accessLevel: 'restricted', views: 450, lastModified: '2024-06-19 15:10', status: 'archived', dataSource: ['API网关日志'], schedule: '每日 07:00' },
  { id: 'BI-009', name: '竞品对比分析矩阵', type: 'report', creator: 'StrategyTeam', accessLevel: 'internal', views: 1280, lastModified: '2024-06-18 12:00', status: 'published', dataSource: ['公开数据', '爬虫数据'], schedule: '手动更新' },
  { id: 'BI-010', name: '智能合约安全审计报告', type: 'report', creator: 'SecurityTeam', accessLevel: 'confidential', views: 320, lastModified: '2024-06-17 18:30', status: 'published', dataSource: ['审计工具', '代码仓库'], schedule: '按需生成' },
];

export default function BISelfServicePage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { data: reports, isLoading } = useQuery({ queryKey: ['bi-reports'], queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockReports; } });

  // 报表类型Tag
  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      dashboard: { color: 'blue', text: '仪表盘' }, report: { color: 'green', text: '报表' },
      funnel: { color: 'orange', text: '漏斗图' }, insight: { color: 'purple', text: '洞察' },
    };
    return map[type] || { color: 'default', text: type };
  };

  // 访问权限Badge
  const getAccessBadge = (level: string) => {
    const map: Record<string, { status: string; text: string }> = {
      public: { status: 'success', text: '公开' }, internal: { status: 'processing', text: '内部' },
      restricted: { status: 'warning', text: '受限' }, confidential: { status: 'error', text: '机密' },
    };
    const item = map[level] || { status: 'default', text: level };
    return <Badge status={item.status as any} text={item.text} />;
  };

  // 状态Tag
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      published: { color: 'green', text: '已发布' }, draft: { color: 'orange', text: '草稿' },
      archived: { color: 'default', text: '已归档' }, scheduled: { color: 'blue', text: '定时发布' },
    };
    return map[status] || { color: 'default', text: status };
  };

  const columns = [
    { title: '报表ID', dataIndex: 'id', key: 'id', width: 120, render: (t: string) => <Text code className="text-xs">{t}</Text> },
    { title: '报表名称', dataIndex: 'name', key: 'name', width: 220, render: (n: string) => <Text strong className="cursor-pointer hover:text-blue-600">{n}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => { const cfg = getTypeTag(t); return <Tag color={cfg.color}>{cfg.text}</Tag>; } },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 120, render: (c: string) => <Space><UserOutlined /><Text>{c}</Text></Space> },
    { title: '访问权限', dataIndex: 'accessLevel', key: 'accessLevel', width: 100, render: (a: string) => getAccessBadge(a) },
    { title: '浏览量', dataIndex: 'views', key: 'views', width: 90, render: (v: number) => <Text>{v.toLocaleString()}</Text> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => { const cfg = getStatusTag(s); return <Tag color={cfg.color}>{cfg.text}</Tag>; } },
    { title: '最后修改', dataIndex: 'lastModified', key: 'lastModified', width: 140 },
  ];

  const actions: any[] = [
    { key: 'view', label: '预览', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedReport(r); setDetailOpen(true); } },
    { key: 'edit', label: '编辑', icon: <EditOutlined />, type: 'primary', hidden: () => false, onClick: (r: any) => { message.info(`打开 ${r.name} 的编辑器`); } },
  ];

  const activeUsers = new Set(reports?.map(r => r.creator)).size;
  const sharedCount = reports?.filter(r => r.accessLevel === 'public').length || 0;
  const scheduledCount = reports?.filter(r => r.schedule !== '手动更新').length || 0;
  const totalViews = reports?.reduce((s: number, r: any) => s + r.views, 0) || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><FileTextOutlined className="text-3xl text-teal-500" /><div><Title level={3} className="!mb-0">BI 自助分析中心</Title><Text type="secondary">自助报表 · 拖拽式分析 · 数据集管理</Text></div></div>
          <Space><Button icon={<BarChartOutlined />}>模板市场</Button><Button type="primary" icon={<PlayCircleOutlined />}>新建报表</Button></Space>
        </div>

        {/* DataCards */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="报表数量" value={reports?.length || 0} icon={<FileTextOutlined />} color="#1677FF" suffix="份" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="活跃用户" value={activeUsers} icon={<TeamOutlined />} color="#16A34A" suffix="人/团队" trend="up" trendValue="+2" description="本周活跃创作者" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="数据集" value={12} icon={<DatabaseOutlined />} color="#F59E0B" suffix="个" description="可用分析数据源" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="定时任务" value={scheduledCount} icon={<ScheduleOutlined />} color="#7C3AED" suffix="个" description="自动刷新任务" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="共享报表" value={sharedCount} icon={<ShareAltOutlined />} color="#06B6D4" suffix="份" description="公开发布的报表" /></Col>
        </Row>

        {/* DataTable */}
        <Card title="BI 报表列表" className="shadow-sm" extra={<Space><Tag color="processing">拖拽式构建</Tag><Tag color="blue">共 {reports?.length || 0} 份 | 总浏览 {totalViews.toLocaleString()}</Tag></Space>}>
          <DataTable columns={columns} dataSource={reports || []} loading={isLoading} actions={actions} rowKey="id" showSearch searchPlaceholder="搜索报表名称或创建者" showFilter filterOptions={[{ label: '全部类型', value: '' }, { label: '仪表盘', value: 'dashboard' }, { label: '报表', value: 'report' }, { label: '漏斗图', value: 'funnel' }, { label: '洞察', value: 'insight' }]} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 份报表` }} />
        </Card>

        {/* 特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><BarChartOutlined /><span>报表类型分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {['dashboard', 'report', 'funnel', 'insight'].map(type => { const count = reports?.filter(r => r.type === type).length || 0; const pct = (count / (reports?.length || 1)) * 100; const cfg = getTypeTag(type); return (<div key={type}><div className="flex justify-between mb-1"><Tag color={cfg.color}>{cfg.text}</Tag><Text strong>{count} ({pct.toFixed(0)}%)</Text></div><Progress percent={pct} strokeColor={cfg.color} size="small" showInfo={false} /></div>); })}
                <Divider /><Alert type="success" showIcon message="BI平台运行正常" description={<Space><Badge status="success" text={`总浏览 ${totalViews.toLocaleString()} 次`} /><Badge status="processing" text={`${scheduledCount} 个定时任务运行中`} /></Space>} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><SettingOutlined /><span>自助分析能力</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert type="info" showIcon banner message="零代码自助BI平台" description="无需编程技能，通过拖拽组件即可快速构建专业级数据分析报表和可视化大屏" />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4"><Text strong>核心能力：</Text><ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                  <li><FileTextOutlined className="mr-2 text-blue-500" /> 多样化图表：支持柱状图、折线图、饼图、散点图、热力图等30+图表类型</li>
                  <li><DatabaseOutlined className="mr-2 text-green-500" /> 多数据源接入：SQL数据库、API接口、CSV/Excel、实时流等多种数据源</li>
                  <li><EditOutlined className="mr-2 text-orange-500" /> 拖拽式编辑：所见即所得的可视化设计器，支持自由布局与样式定制</li>
                  <li><ScheduleOutlined className="mr-2 text-purple-500" /> 自动化调度：支持定时刷新、邮件推送、Webhook触发等自动化能力</li>
                  <li><ShareAltOutlined className="mr-2 text-red-500" /> 协作分享：支持权限控制、评论批注、版本管理、嵌入分享</li>
                </ul></div>
                <div className="bg-teal-50 rounded-lg p-3 mt-3"><Text type="secondary" className="text-sm"><PlayCircleOutlined className="mr-1 text-teal-500" /> 支持移动端适配 | 导出PDF/PNG/Excel | 嵌入第三方系统</Text></div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal title={`报表详情 - ${selectedReport?.name || ''}`} open={detailOpen} onCancel={() => setDetailOpen(false)} footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>, <Button key="open" type="primary" icon={<EyeOutlined />} onClick={() => { message.success('正在打开报表预览'); setDetailOpen(false); }}>打开报表</Button>]} width={700}>
          {selectedReport && (<div className="space-y-4 mt-4"><Row gutter={[16, 16]}><Col span={12}><Statistic title="报表名称" value={selectedReport.name} /></Col><Col span={12}><Statistic title="报表类型" value="" prefix={<Tag color={getTypeTag(selectedReport.type).color}>{getTypeTag(selectedReport.type).text}</Tag>} /></Col><Col span={8}><Statistic title="创建者" value="" prefix={<Space><UserOutlined /><Text>{selectedReport.creator}</Text></Space>} /></Col><Col span={8}><Statistic title="访问权限" value="" prefix={getAccessBadge(selectedReport.accessLevel)} /></Col><Col span={8}><Statistic title="状态" value="" prefix={<Tag color={getStatusTag(selectedReport.status).color}>{getStatusTag(selectedReport.status).text}</Tag>} /></Col><Col span={8}><Statistic title="浏览量" value={selectedReport.views.toLocaleString()} /></Col><Col span={8}><Statistic title="刷新频率" value={selectedReport.schedule} /></Col><Col span={8}><Statistic title="最后修改" value={selectedReport.lastModified} /></Col></Row><Divider /><div><Text strong>数据源：</Text><Space wrap className="mt-1">{selectedReport.dataSource.map((ds: string, i: number) => <Tag key={i} color="geekblue">{ds}</Tag>)}</Space></div></div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
