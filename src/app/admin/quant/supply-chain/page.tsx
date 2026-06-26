'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Select, Table, Card, Progress, Tooltip, Divider, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, ExportOutlined, AlertOutlined, NodeIndexOutlined, GlobalOutlined, SafetyCertificateOutlined, TeamOutlined, StarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface SupplyChainNode {
  id: string;
  nodeName: string;
  nodeTier: 'tier1' | 'tier2' | 'tier3' | 'raw_material' | 'logistics' | 'distribution';
  industry: string;
  relationship: 'supplier' | 'customer' | 'partner' | 'competitor';
  healthScore: number;
  riskExposure: number;
  dependencyLevel: 'high' | 'medium' | 'low';
  geoLocation: string;
  altSuppliersCount: number;
  paymentTermsDays: number;
  lastAuditDate: string;
  aiopcSupplyScore: number;
}

const mockNodes: SupplyChainNode[] = [
  { id: '1', nodeName: '台积电(TSMC)', nodeTier: 'tier1', industry: '半导体制造', relationship: 'supplier', healthScore: 95, riskExposure: 25000000, dependencyLevel: 'high', geoLocation: '中国·台湾新竹', altSuppliersCount: 2, paymentTermsDays: 45, lastAuditDate: '2024-05-15', aiopcSupplyScore: 92 },
  { id: '2', nodeName: '三星电子(Samsung)', nodeTier: 'tier1', industry: '半导体制造/存储', relationship: 'supplier', healthScore: 88, riskExposure: 18000000, dependencyLevel: 'high', geoLocation: '韩国·首尔', altSuppliersCount: 3, paymentTermsDays: 60, lastAuditDate: '2024-04-20', aiopcSupplyScore: 85 },
  { id: '3', nodeName: 'ASML Holding', nodeTier: 'tier1', industry: '光刻设备', relationship: 'supplier', healthScore: 92, riskExposure: 35000000, dependencyLevel: 'high', geoLocation: '荷兰·费尔德霍芬', altSuppliersCount: 0, paymentTermsDays: 90, lastAuditDate: '2024-06-01', aiopcSupplyScore: 78 },
  { id: '4', nodeName: '中芯国际(SMIC)', nodeTier: 'tier2', industry: '半导体制造', relationship: 'partner', healthScore: 78, riskExposure: 8500000, dependencyLevel: 'medium', geoLocation: '中国·上海', altSuppliersCount: 5, paymentTermsDays: 30, lastAuditDate: '2024-03-10', aiopcSupplyScore: 72 },
  { id: '5', nodeName: 'DHL供应链', nodeTier: 'logistics', industry: '物流运输', relationship: 'partner', healthScore: 86, riskExposure: 5200000, dependencyLevel: 'medium', geoLocation: '德国·波恩(全球)', altSuppliersCount: 8, paymentTermsDays: 15, lastAuditDate: '2024-05-28', aiopcSupplyScore: 88 },
  { id: '6', nodeName: '英伟达(NVIDIA)', nodeTier: 'tier1', industry: 'AI芯片设计', relationship: 'customer', healthScore: 96, riskExposure: 12000000, dependencyLevel: 'low', geoLocation: '美国·圣克拉拉', altSuppliersCount: 0, paymentTermsDays: 30, lastAuditDate: '2024-06-10', aiopcSupplyScore: 94 },
  { id: '7', nodeName: '信越化学(Shin-Etsu)', nodeTier: 'raw_material', industry: '化学材料/硅晶圆', relationship: 'supplier', healthScore: 90, riskExposure: 15000000, dependencyLevel: 'high', geoLocation: '日本·东京', altSuppliersCount: 4, paymentTermsDays: 60, lastAuditDate: '2024-04-15', aiopcSupplyScore: 82 },
  { id: '8', nodeName: '富士康(Foxconn)', nodeTier: 'distribution', industry: '电子制造服务', relationship: 'partner', healthScore: 75, riskExposure: 9800000, dependencyLevel: 'medium', geoLocation: '中国·深圳/台湾', altSuppliersCount: 12, paymentTermsDays: 20, lastAuditDate: '2024-02-28', aiopcSupplyScore: 68 },
  { id: '9', nodeName: '应用材料(Applied Materials)', nodeTier: 'tier2', industry: '半导体设备', relationship: 'supplier', healthScore: 89, riskExposure: 11000000, dependencyLevel: 'medium', geoLocation: '美国·圣克拉拉', altSuppliersCount: 6, paymentTermsDays: 45, lastAuditDate: '2024-05-05', aiopcSupplyScore: 86 },
  { id: '10', nodeName: '联发科(MediaTek)', nodeTier: 'tier3', industry: '芯片设计', relationship: 'competitor', healthScore: 84, riskExposure: 6500000, dependencyLevel: 'low', geoLocation: '中国·台湾新竹', altSuppliersCount: 0, paymentTermsDays: 0, lastAuditDate: '2024-01-20', aiopcSupplyScore: 79 },
];

const tierConfig: Record<string, { label: string; color: string }> = {
  tier1: { label: '一级供应商', color: '#DC2626' },
  tier2: { label: '二级供应商', color: '#F59E0B' },
  tier3: { label: '三级供应商', color: '#16A34A' },
  raw_material: { label: '原材料', color: '#7C3AED' },
  logistics: { label: '物流', color: '#1677FF' },
  distribution: { label: '分销', color: '#EC4899' },
};

const relationConfig: Record<string, { label: string; color: string }> = {
  supplier: { label: '供应商', color: '#16A34A' },
  customer: { label: '客户', color: '#1677FF' },
  partner: { label: '合作伙伴', color: '#F59E0B' },
  competitor: { label: '竞争对手', color: '#DC2626' },
};

const depConfig: Record<string, { label: string; color: string }> = {
  high: { label: '高依赖', color: 'red' },
  medium: { label: '中等', color: 'orange' },
  low: { label: '低依赖', color: 'green' },
};

export default function SupplyChainPage() {
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterRelation, setFilterRelation] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');

  const filteredNodes = mockNodes.filter((n) => {
    if (filterTier && n.nodeTier !== filterTier) return false;
    if (filterIndustry && !n.industry.includes(filterIndustry)) return false;
    if (filterRelation && n.relationship !== filterRelation) return false;
    if (filterRisk === 'high' && n.riskExposure < 10000000) return false;
    if (filterRisk === 'medium' && (n.riskExposure < 5000000 || n.riskExposure >= 15000000)) return false;
    if (filterRisk === 'low' && n.riskExposure >= 10000000) return false;
    return true;
  });

  const totalNodes = mockNodes.length;
  const tier1Count = mockNodes.filter(n => n.nodeTier === 'tier1').length;
  const highRiskCount = mockNodes.filter(n => n.riskExposure >= 15000000).length;
  const avgHealth = Math.round(mockNodes.reduce((sum, n) => sum + n.healthScore, 0) / totalNodes);
  const avgAiopc = Math.round(mockNodes.reduce((sum, n) => sum + n.aiopcSupplyScore, 0) / totalNodes);

  const columns = [
    { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName', render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    { title: '层级', dataIndex: 'nodeTier', key: 'nodeTier', render: (t: string) => <Tag color={tierConfig[t]?.color}>{tierConfig[t]?.label}</Tag> },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    { title: '关系', dataIndex: 'relationship', key: 'relationship', render: (r: string) => <Tag color={relationConfig[r]?.color}>{relationConfig[r]?.label}</Tag> },
    { title: '健康分', dataIndex: 'healthScore', key: 'healthScore', render: (v: number) => <Progress percent={v} size="small" style={{ width: 70 }} strokeColor={v >= 85 ? '#52c41a' : v >= 70 ? '#faad14' : '#ff4d4f'} /> },
    { title: '风险暴露$', dataIndex: 'riskExposure', key: 'riskExposure', render: (v: number) => <span className={v >= 20000000 ? 'text-red-600 font-semibold' : ''}>${(v / 1000000).toFixed(1)}M</span> },
    { title: '依赖度', dataIndex: 'dependencyLevel', key: 'dependencyLevel', render: (d: string) => <Tag color={depConfig[d]?.color}>{depConfig[d]?.label}</Tag> },
    { title: '地理位置', dataIndex: 'geoLocation', key: 'geoLocation', render: (l: string) => <span><EnvironmentOutlined style={{ marginRight: 4 }} />{l}</span> },
    { title: '备选数', dataIndex: 'altSuppliersCount', key: 'altSuppliersCount', render: (v: number) => v === 0 ? <span className="text-red-600">无</span> : v },
    { title: '账期(天)', dataIndex: 'paymentTermsDays', key: 'paymentTermsDays', render: (v: number) => `${v}天` },
    { title: '最后审计', dataIndex: 'lastAuditDate', key: 'lastAuditDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: 'AIOPC分', dataIndex: 'aiopcSupplyScore', key: 'aiopcSupplyScore', render: (v: number) => <span style={{ color: '#F0B90B', fontWeight: 600 }}>{v}</span> },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (record: SupplyChainNode) => { setSelectedNode(record); setDetailModalOpen(true); } },
    { key: 'assess', label: '评估', icon: <AlertOutlined />, onClick: (record: SupplyChainNode) => message.info(`风险评估: ${record.nodeName}`) },
    { key: 'alt', label: '替代方案', icon: <TeamOutlined />, onClick: (record: SupplyChainNode) => message.info(`查找替代: ${record.nodeName}`) },
    { key: 'export', label: '导出图谱', icon: <ExportOutlined />, onClick: (record: SupplyChainNode) => message.success(`导出供应链图谱`) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold m-0 flex items-center gap-3"><NodeIndexOutlined style={{ color: '#F0B90B' }} /> 供应链金融分析</h1><p className="text-gray-500 text-sm mt-2">企业供应链全景图谱 · 上游/下游/物流/资金流追踪 · AIOPC供应链大脑</p></div>
          <Space><Button icon={<ReloadOutlined />} onClick={() => message.success('刷新')}>刷新</Button><Button type="primary" icon={<PlusOutlined />}>添加节点</Button></Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="供应链节点数" value={totalNodes} icon={<NodeIndexOutlined />} color="#1677FF" description="全网络节点" />
          <DataCard title="一级供应商" value={tier1Count} icon={<SafetyCertificateOutlined />} color="#DC2626" description="关键供应商" />
          <DataCard title="高风险节点" value={highRiskCount} icon={<AlertOutlined />} color="#F59E0B" description="需重点关注" />
          <DataCard title="平均健康分" value={avgHealth} icon={<StarOutlined />} color="#16A34A" suffix="/100" description="整体健康度" />
          <DataCard title="AIOPC供应链分" value={avgAiopc} icon={<GlobalOutlined />} color="#F0B90B" suffix="/100" description="韧性评估" />
        </div>

        <Card size="small">
          <Space wrap>
            <Select placeholder="层级" style={{ width: 120 }} allowClear value={filterTier || undefined} onChange={setFilterTier}>
              <Option value="tier1">一级供应商</Option><Option value="tier2">二级供应商</Option><Option value="tier3">三级供应商</Option><Option value="raw_material">原材料</Option><Option value="logistics">物流</Option><Option value="distribution">分销</Option>
            </Select>
            <Select placeholder="行业" style={{ width: 130 }} allowClear value={filterIndustry || undefined} onChange={setFilterIndustry}>
              <Option value="半导体">半导体</Option><Option value="设备">设备</Option><Option value="材料">材料</Option><Option value="物流">物流</Option>
            </Select>
            <Select placeholder="关系类型" style={{ width: 120 }} allowClear value={filterRelation || undefined} onChange={setFilterRelation}>
              <Option value="supplier">供应商</Option><Option value="customer">客户</Option><Option value="partner">合作伙伴</Option><Option value="competitor">竞争对手</Option>
            </Select>
            <Select placeholder="风险等级" style={{ width: 110 }} allowClear value={filterRisk || undefined} onChange={setFilterRisk}>
              <Option value="high">高风险</Option><Option value="medium">中风险</Option><Option value="low">低风险</Option>
            </Select>
          </Space>
        </Card>

        <DataTable columns={columns as any} dataSource={filteredNodes as any} rowKey="id" actions={actions} showSearch={false} showAdd={false} />

        <Modal title={<span>节点详情 - <span style={{ color: '#F0B90B' }}>{selectedNode?.nodeName}</span></span>} open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>, <Button key="export" icon={<ExportOutlined />}>导出报告</Button>]} width={850}>
          {selectedNode && (
            <div className="space-y-6">
              <Divider orientation="left">节点信息</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="节点名称">{selectedNode.nodeName}</Descriptions.Item>
                <Descriptions.Item label="节点ID"><code>{selectedNode.id}</code></Descriptions.Item>
                <Descriptions.Item label="层级"><Tag color={tierConfig[selectedNode.nodeTier]?.color}>{tierConfig[selectedNode.nodeTier]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="行业">{selectedNode.industry}</Descriptions.Item>
                <Descriptions.Item label="关系类型"><Tag color={relationConfig[selectedNode.relationship]?.color}>{relationConfig[selectedNode.relationship]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="依赖度"><Tag color={depConfig[selectedNode.dependencyLevel]?.color}>{depConfig[selectedNode.dependencyLevel]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="地理位置">{selectedNode.geoLocation}</Descriptions.Item>
                <Descriptions.Item label="最后审计">{dayjs(selectedNode.lastAuditDate).format('YYYY-MM-DD')}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">上下游关系描述</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full">
                  <div className="p-3 bg-green-50 rounded-lg"><div className="font-semibold text-green-800 mb-1">上游供应</div><p className="text-sm text-gray-700">该节点为{relationConfig[selectedNode.relationship]?.label}，主要提供{selectedNode.industry}相关产品和服务，是供应链中的{tierConfig[selectedNode.nodeTier]?.label}。</p></div>
                  <div className="p-3 bg-blue-50 rounded-lg"><div className="font-semibold text-blue-800 mb-1">下游需求</div><p className="text-sm text-gray-700">当前有{selectedNode.altSuppliersCount > 0 ? selectedNode.altSuppliersCount + '家' : '无'}备选供应商可供切换，账期为{selectedNode.paymentTermsDays}天。</p></div>
                </Space>
              </Card>

              <Divider orientation="left">风险分析</Divider>
              <Card size="small" style={{ background: selectedNode.riskExposure >= 20000000 ? '#FEF2F2' : selectedNode.riskExposure >= 10000000 ? '#FFFBEB' : '#F0FDF4', borderColor: selectedNode.riskExposure >= 20000000 ? '#DC2626' : selectedNode.riskExposure >= 10000000 ? '#F59E0B' : '#16A34A' }}>
                <AlertOutlined style={{ fontSize: 18, marginRight: 8, color: selectedNode.riskExposure >= 20000000 ? '#DC2626' : selectedNode.riskExposure >= 10000000 ? '#F59E0B' : '#16A34A' }} />
                <span className="font-bold">风险暴露: ${(selectedNode.riskExposure / 1000000).toFixed(1)}M</span>
                <ul className="mt-2 ml-6 space-y-1 text-sm">
                  <li>• 地缘政治风险: {selectedNode.geoLocation.includes('台湾') || selectedNode.geoLocation.includes('韩国') ? '高' : '中'}</li>
                  <li>• 单一来源风险: {selectedNode.altSuppliersCount <= 1 ? '极高' : selectedNode.altSuppliersCount <= 3 ? '高' : '可控'}</li>
                  <li>• 财务健康度: {selectedNode.healthScore >= 85 ? '优秀' : selectedNode.healthScore >= 70 ? '良好' : '需关注'}</li>
                </ul>
              </Card>

              <Divider orientation="left"><StarOutlined style={{ color: '#F0B90B' }} /> AIOPC供应链韧性评估</Divider>
              <Card size="small" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)', borderColor: '#F0B90B' }}>
                <div className="mb-3"><span className="text-lg font-bold" style={{ color: '#F0B90B' }}>韧性评分: {selectedNode.aiopcSupplyScore}/100</span></div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div><div className="flex justify-between mb-1"><span className="text-sm">供应稳定性</span><span className="text-sm font-semibold">{Math.min(95, selectedNode.healthScore + 5)}%</span></div><Progress percent={Math.min(95, selectedNode.healthScore + 5)} strokeColor="#1677FF" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">替代可行性</span><span className="text-sm font-semibold">{Math.max(40, 95 - selectedNode.altSuppliersCount * 10)}%</span></div><Progress percent={Math.max(40, 95 - selectedNode.altSuppliersCount * 10)} strokeColor="#16A34A" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">地理多样性</span><span className="text-sm font-semibold">{selectedNode.geoLocation.includes('全球') ? 92 : 65}%</span></div><Progress percent={selectedNode.geoLocation.includes('全球') ? 92 : 65} strokeColor="#7C3AED" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">财务稳健性</span><span className="text-sm font-semibold">{selectedNode.healthScore}%</span></div><Progress percent={selectedNode.healthScore} strokeColor="#F0B90B" showInfo={false} size="small" /></div>
                </Space>
              </Card>

              <Divider orientation="left">交易记录</Divider>
              <Table size="small" pagination={false} dataSource={[
                { date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), amount: '$' + (Math.random() * 5 + 1).toFixed(1) + 'M', status: 'completed', po: 'PO-' + Math.floor(Math.random() * 10000) },
                { date: dayjs().subtract(14, 'day').format('YYYY-MM-DD'), amount: '$' + (Math.random() * 8 + 2).toFixed(1) + 'M', status: 'completed', po: 'PO-' + Math.floor(Math.random() * 10000) },
                { date: dayjs().subtract(21, 'day').format('YYYY-MM-DD'), amount: '$' + (Math.random() * 3 + 0.5).toFixed(1) + 'M', status: 'pending', po: 'PO-' + Math.floor(Math.random() * 10000) },
              ]} columns={[{ title: '日期', dataIndex: 'date', key: 'date' }, { title: '金额', dataIndex: 'amount', key: 'amount' }, { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : 'orange'}>{v}</Tag> }, { title: '采购单号', dataIndex: 'po', key: 'po', render: (v: string) => <code>{v}</code> }]} rowKey="po" />

              <Divider orientation="left">预警事件</Divider>
              <Table size="small" pagination={false} dataSource={[
                { time: dayjs().format('MM-DD HH:mm'), event: selectedNode.healthScore < 80 ? '健康分数低于阈值' : '常规监控检查', level: selectedNode.healthScore < 80 ? 'warning' : 'info' },
                { time: dayjs().subtract(3, 'day').format('MM-DD HH:mm'), event: '地缘风险指数更新', level: 'info' },
                ...(selectedNode.altSuppliersCount <= 1 ? [{ time: dayjs().subtract(10, 'day').format('MM-DD HH:mm'), event: '单一来源风险提醒', level: 'warning' }] : []),
              ]} columns={[{ title: '时间', dataIndex: 'time', key: 'time', width: 100 }, { title: '事件', dataIndex: 'event', key: 'event' }, { title: '级别', dataIndex: 'level', key: 'level', render: (v: string) => <Tag color={v === 'warning' ? 'orange' : 'blue'}>{v}</Tag> }]} rowKey={(r: any) => r.time + r.event} />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
