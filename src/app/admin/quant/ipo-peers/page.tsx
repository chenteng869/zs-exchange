'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  TeamOutlined, EyeOutlined, ThunderboltOutlined, LineChartOutlined, DollarOutlined,
  PercentageOutlined, RiseOutlined, BarChartOutlined, SwapOutlined, HistoryOutlined,
  BulbOutlined, DashboardOutlined, AimOutlined, FundOutlined, GlobalOutlined,
  ExperimentOutlined, ClusterOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface PeerComparison {
  id: number;
  targetCompany: string;
  peerCompany: string;
  industry: string;
  marketCap: number;
  peRatio: number;
  psRatio: number;
  evEbitda: number;
  revenueGrowth: number;
  roe: number;
  roic: number;
  grossMargin: number;
  operatingMargin: number;
  debtEquity: number;
  similarityScore: number;
  dataSource: string;
  comparedAt: string;
}

const mockPeers: PeerComparison[] = [
  { id: 1, targetCompany: '星云智能科技', peerCompany: 'OpenAI对标', industry: '人工智能', marketCap: 2800, peRatio: 45.2, psRatio: 12.5, evEbitda: 32.8, revenueGrowth: 89, roe: 18.5, roic: 22.3, grossMargin: 72, operatingMargin: 28, debtEquity: 0.15, similarityScore: 92, dataSource: 'Bloomberg', comparedAt: '2025-06-15' },
  { id: 2, targetCompany: '星云智能科技', peerCompany: 'Anthropic对标', industry: '人工智能', marketCap: 2200, peRatio: 38.6, psRatio: 10.8, evEbitda: 28.5, revenueGrowth: 95, roe: 15.2, roic: 19.7, grossMargin: 75, operatingMargin: 25, debtEquity: 0.22, similarityScore: 88, dataSource: 'Capital IQ', comparedAt: '2025-06-15' },
  { id: 3, targetCompany: '绿源新能源', peerCompany: '宁德时代', industry: '新能源', marketCap: 9800, peRatio: 28.5, psRatio: 4.2, evEbitda: 18.6, revenueGrowth: 52, roe: 14.8, roic: 16.2, grossMargin: 32, operatingMargin: 12, debtEquity: 0.45, similarityScore: 95, dataSource: 'Wind', comparedAt: '2025-06-12' },
  { id: 4, targetCompany: '绿源新能源', peerCompany: '比亚迪', industry: '新能源汽车', marketCap: 12500, peRatio: 22.3, psRatio: 3.5, evEbitda: 15.2, revenueGrowth: 42, roe: 12.5, roic: 13.8, grossMargin: 28, operatingMargin: 10, debtEquity: 0.38, similarityScore: 85, dataSource: 'Wind', comparedAt: '2025-06-12' },
  { id: 5, targetCompany: '量子计算实验室', peerCompany: 'IonQ', industry: '量子科技', marketCap: 1800, peRatio: -65.0, psRatio: 35.2, evEbitda: -120, revenueGrowth: 110, roe: -45.2, roic: -38.5, grossMargin: 78, operatingMargin: -35, debtEquity: 0.08, similarityScore: 82, dataSource: 'FactSet', comparedAt: '2025-06-10' },
  { id: 6, targetCompany: '医联健康平台', peerCompany: '京东健康', industry: '医疗健康', marketCap: 7500, peRatio: 35.8, psRatio: 2.8, evEbitda: 22.5, revenueGrowth: 35, roe: 10.2, roic: 11.5, grossMargin: 52, operatingMargin: 8, debtEquity: 0.18, similarityScore: 90, dataSource: 'Wind', comparedAt: '2025-06-08' },
  { id: 7, targetCompany: '医联健康平台', peerCompany: '阿里健康', industry: '医疗健康', marketCap: 5200, peRatio: 42.5, psRatio: 3.2, evEbitda: 26.8, revenueGrowth: 28, roe: 8.5, roic: 9.2, grossMargin: 48, operatingMargin: 6, debtEquity: 0.12, similarityScore: 87, dataSource: 'Wind', comparedAt: '2025-06-08' },
  { id: 8, targetCompany: '自动驾驶出行', peerCompany: 'Waymo(估)', industry: '自动驾驶', marketCap: 15000, peRatio: -120, psRatio: 8.5, evEbitda: -200, revenueGrowth: 55, roe: -25.8, roic: -18.2, grossMargin: 35, operatingMargin: -15, debtEquity: 0.55, similarityScore: 78, dataSource: 'PitchBook', comparedAt: '2025-05-20' },
  { id: 9, targetCompany: '碳捕集环保', peerCompany: 'Climeworks', industry: '环保科技', marketCap: 550, peRatio: -85, psRatio: 18.5, evEbitda: -95, revenueGrowth: 68, roe: -32.5, roic: -28.0, grossMargin: 42, operatingMargin: -20, debtEquity: 0.62, similarityScore: 91, dataSource: 'Bloomberg', comparedAt: '2025-05-22' },
  { id: 10, targetCompany: '智造机器人', peerCompany: '库卡机器人', industry: '智能制造', marketCap: 6200, peRatio: 25.6, psRatio: 2.2, evEbitda: 14.8, revenueGrowth: 22, roe: 11.8, roic: 13.5, grossMargin: 40, operatingMargin: 9, debtEquity: 0.32, similarityScore: 86, dataSource: 'Wind', comparedAt: '2025-06-01' },
];

const industries = ['人工智能', '新能源', '量子科技', '医疗健康', '自动驾驶', '环保科技', '智能制造'];
const dataSources = ['Bloomberg', 'Wind', 'Capital IQ', 'FactSet', 'PitchBook'];

export default function IpoPeersPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PeerComparison | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>();
  const [filterSource, setFilterSource] = useState<string | undefined>();

  const filteredData = mockPeers.filter((item) => {
    if (filterIndustry && item.industry !== filterIndustry) return false;
    if (filterSource && item.dataSource !== filterSource) return false;
    return true;
  });

  const totalGroups = [...new Set(filteredData.map((i) => i.targetCompany))].length;
  const coveredIndustries = [...new Set(filteredData.map((i) => i.industry))].length;
  const avgSimilarity = (filteredData.reduce((sum, i) => sum + i.similarityScore, 0) / (filteredData.length || 1)).toFixed(0);
  const sourceCount = [...new Set(filteredData.map((i) => i.dataSource))].length;
  const thisMonthNew = filteredData.filter((i) => dayjs(i.comparedAt).month() === dayjs().month()).length;

  const handleViewDetail = (record: PeerComparison) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const columns = [
    { title: '目标公司', dataIndex: 'targetCompany', key: 'targetCompany', width: 130, fixed: 'left' as const, render: (t: string) => <a style={{ fontWeight: 600 }}>{t}</a> },
    { title: '同行公司', dataIndex: 'peerCompany', key: 'peerCompany', width: 130, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 100, render: (t: string) => <Tag color="purple">{t}</Tag> },
    { title: '市值($M)', dataIndex: 'marketCap', key: 'marketCap', width: 90, render: (v: number) => `$${v.toLocaleString()}M` },
    { title: 'PE', dataIndex: 'peRatio', key: 'peRatio', width: 70, render: (v: number) => <span style={{ color: v < 0 ? '#DC2626' : v > 40 ? '#F59E0B' : '#1677FF', fontWeight: 600 }}>{v.toFixed(1)}</span> },
    { title: 'PS', dataIndex: 'psRatio', key: 'psRatio', width: 60, render: (v: number) => v.toFixed(1) },
    { title: 'EV/EBITDA', dataIndex: 'evEbitda', key: 'evEbitda', width: 90, render: (v: number) => <span style={{ color: v < 0 ? '#DC2626' : '#111827' }}>{v.toFixed(1)}</span> },
    { title: '收入增长%', dataIndex: 'revenueGrowth', key: 'revenueGrowth', width: 90, render: (v: number) => <span style={{ color: v > 50 ? '#16A34A' : '#1677FF', fontWeight: 600 }}>{v}%</span> },
    { title: 'ROE%', dataIndex: 'roe', key: 'roe', width: 70, render: (v: number) => <span style={{ color: v >= 15 ? '#16A34A' : v >= 0 ? '#1677FF' : '#DC2626' }}>{v.toFixed(1)}</span> },
    { title: 'ROIC%', dataIndex: 'roic', key: 'roic', width: 75, render: (v: number) => <span style={{ color: v >= 15 ? '#16A34A' : v >= 0 ? '#1677FF' : '#DC2626' }}>{v.toFixed(1)}</span> },
    { title: '毛利率%', dataIndex: 'grossMargin', key: 'grossMargin', width: 80 },
    { title: '营业利润率%', dataIndex: 'operatingMargin', key: 'operatingMargin', width: 105, render: (v: number) => <span style={{ color: v >= 15 ? '#16A34A' : v >= 0 ? '#F59E0B' : '#DC2626' }}>{v}%</span> },
    { title: 'D/E', dataIndex: 'debtEquity', key: 'debtEquity', width: 60, render: (v: number) => v.toFixed(2) },
    { title: '相似度', dataIndex: 'similarityScore', key: 'similarityScore', width: 110, render: (v: number) => (
      <Tooltip title={`相似度评分: ${v}/100`}>
        <Progress percent={v} size="small" format={(p) => `${p}`} strokeColor={v >= 90 ? '#16A34A' : v >= 80 ? '#1677FF' : '#F59E0B'} />
      </Tooltip>
    )},
    { title: '数据源', dataIndex: 'dataSource', key: 'dataSource', width: 95, render: (t: string) => <Tag>{t}</Tag> },
    { title: '对比日期', dataIndex: 'comparedAt', key: 'comparedAt', width: 100, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <TeamOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>同业对标分析</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              上市公司同行对比矩阵 · 多维度Benchmark/估值倍数/运营效率 · AIOPC智能匹配
            </p>
          </div>
        </div>

        {/* DataCard x5 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="对标组数" value={totalGroups} icon={<ClusterOutlined />} color="#1677FF" suffix="组" description={`${filteredData.length}条对标记录`} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="覆盖行业" value={coveredIndustries} icon={<GlobalOutlined />} color="#16A34A" suffix="个" trend="up" trendValue="+1 本季" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均相似度" value={`${avgSimilarity}`} icon={<SwapOutlined />} color="#F0B90B" suffix="/100" description="AIOPC智能匹配精度" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="数据源数" value={sourceCount} icon={<DatabaseOutlined />} color="#7C3AED" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="本月新增" value={thisMonthNew} icon={<RiseOutlined />} color="#F59E0B" suffix="条" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="筛选行业" allowClear style={{ width: 160 }} value={filterIndustry} onChange={setFilterIndustry}>
              {industries.map((ind) => <Select.Option key={ind} value={ind}>{ind}</Select.Option>)}
            </Select>
            <Select placeholder="数据源" allowClear style={{ width: 140 }} value={filterSource} onChange={setFilterSource}>
              {dataSources.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions as any[]}
          showSearch={false}
          showAdd={false}
          onRefresh={() => message.info('数据已刷新')}
        />

        {/* 详情 Modal */}
        <Modal
          title={`${selectedRecord?.targetCompany || ''} vs ${selectedRecord?.peerCompany || ''} - 同业对标详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={850}
          destroyOnHidden
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* 对标概览 */}
              <Card size="small" title={<><DashboardOutlined /> 对标概览</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="目标公司"><strong>{selectedRecord.targetCompany}</strong></Descriptions.Item>
                  <Descriptions.Item label="同行公司"><Tag color="blue">{selectedRecord.peerCompany}</Tag></Descriptions.Item>
                  <Descriptions.Item label="所属行业"><Tag color="purple">{selectedRecord.industry}</Tag></Descriptions.Item>
                  <Descriptions.Item label="相似度"><Progress percent={selectedRecord.similarityScore} size="small" format={(p) => `${p}/100`} strokeColor="#F0B90B" /></Descriptions.Item>
                  <Descriptions.Item label="数据来源"><Tag>{selectedRecord.dataSource}</Tag></Descriptions.Item>
                  <Descriptions.Item label="对比日期">{dayjs(selectedRecord.comparedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 估值倍数对比表 */}
              <Card size="small" title={<><DollarOutlined /> 估值倍数对比</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { metric: '市值($M)', target: selectedRecord.marketCap, peer: Math.round(selectedRecord.marketCap * (0.8 + Math.random() * 0.6)), diff: `${((Math.random() * 40 - 20)).toFixed(0)}%` },
                    { metric: 'P/E倍数', target: selectedRecord.peRatio, peer: +(selectedRecord.peRatio * (0.7 + Math.random() * 0.6)).toFixed(1), diff: `${((Math.random() * 30 - 15)).toFixed(0)}%` },
                    { metric: 'P/S倍数', target: selectedRecord.psRatio, peer: +(selectedRecord.psRatio * (0.8 + Math.random() * 0.4)).toFixed(1), diff: `${((Math.random() * 25 - 12)).toFixed(0)}%` },
                    { metric: 'EV/EBITDA', target: selectedRecord.evEbitda, peer: +(selectedRecord.evEbitda * (0.75 + Math.random() * 0.5)).toFixed(1), diff: `${((Math.random() * 35 - 17)).toFixed(0)}%` },
                    { metric: 'P/GMV', target: +(selectedRecord.psRatio * 1.5).toFixed(1), peer: +(selectedRecord.psRatio * 1.8).toFixed(1), diff: `${((Math.random() * 20 - 10)).toFixed(0)}%` },
                  ]}
                  columns={[
                    { title: '指标', dataIndex: 'metric', key: 'metric', render: (t: string) => <span className="font-semibold">{t}</span> },
                    { title: selectedRecord.targetCompany, dataIndex: 'target', key: 'target', render: (v: number) => <strong>{typeof v === 'number' && !isNaN(v) ? (v % 1 === 0 ? v : v.toFixed(1)) : v}</strong> },
                    { title: selectedRecord.peerCompany, dataIndex: 'peer', key: 'peer' },
                    { title: '差异', dataIndex: 'diff', key: 'diff', render: (d: string) => (
                      <Tag color={d.startsWith('+') || parseFloat(d) > 0 ? 'green' : d.startsWith('-') || parseFloat(d) < 0 ? 'red' : 'default'}>{d}</Tag>
                    )},
                  ]}
                  rowKey="metric"
                />
              </Card>

              {/* 运营效率对比 */}
              <Card size="small" title={<><LineChartOutlined /> 运营效率对比</>} style={{ borderRadius: 8 }}>
                <Row gutter={[16, 16]}>
                  {[
                    { label: '收入增长率', targetVal: selectedRecord.revenueGrowth, peerVal: Math.round(selectedRecord.revenueGrowth * (0.7 + Math.random() * 0.5)), unit: '%', good: true },
                    { label: 'ROE', targetVal: selectedRecord.roe, peerVal: +(selectedRecord.roe * (0.8 + Math.random() * 0.4)).toFixed(1), unit: '%', good: true },
                    { label: 'ROIC', targetVal: selectedRecord.roic, peerVal: +(selectedRecord.roic * (0.85 + Math.random() * 0.3)).toFixed(1), unit: '%', good: true },
                    { label: '毛利率', targetVal: selectedRecord.grossMargin, peerVal: Math.round(selectedRecord.grossMargin * (0.9 + Math.random() * 0.15)), unit: '%', good: true },
                    { label: '营业利润率', targetVal: selectedRecord.operatingMargin, peerVal: Math.round(selectedRecord.operatingMargin * (0.8 + Math.random() * 0.4)), unit: '%' },
                    { label: '资产负债率', targetVal: selectedRecord.debtEquity * 100, peerVal: +(selectedRecord.debtEquity * 100 * (0.8 + Math.random() * 0.4)).toFixed(0), unit: '%', invert: true },
                  ].map((item) => (
                    <Col span={8} key={item.label}>
                      <div style={{ padding: 12, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{item.label}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <div><small>目标:</small> <strong style={{
                            color: item.good
                              ? (item.targetVal >= (typeof item.peerVal === 'number' ? item.peerVal : 0) ? '#16A34A' : '#F59E0B')
                              : (item.invert ? (item.targetVal <= (typeof item.peerVal === 'number' ? item.peerVal : 999) ? '#16A34A' : '#F59E0B') : '#111827')
                          }}>{typeof item.targetVal === 'number' ? (item.targetVal % 1 === 0 ? item.targetVal : item.targetVal.toFixed(1)) : item.targetVal}{item.unit}</strong></div>
                          <div><small>同行:</small> <span style={{ color: '#6B7280' }}>{item.peerVal}{item.unit}</span></div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* AIOPC差异化分析 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> AIOPC差异化分析</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div style={{ background: '#FFFBE6', padding: 16, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                  <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                  <span className="font-semibold" style={{ color: '#F0B90B' }}>AIOPC差异化洞察：</span>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li><strong>核心优势：</strong>{selectedRecord.targetCompany}在{selectedRecord.industry}领域的{selectedRecord.revenueGrowth > 50 ? '收入增速显著领先同行' : '运营效率优于可比公司'}，{selectedRecord.similarityScore >= 90 ? '与标杆企业高度可比，估值参考性强。' : '但商业模式存在一定差异，需谨慎参考。'}</li>
                    <li><strong>估值差距：</strong>当前PE倍数{(selectedRecord.peRatio > 30 ? '偏高，市场给予成长溢价' : '处于合理区间')}，建议关注{selectedRecord.grossMargin > 50 ? '高毛利可持续性' : '盈利能力改善空间'}。</li>
                    <li><strong>风险提示：</strong>{selectedRecord.debtEquity > 0.4 ? '杠杆水平偏高，需关注偿债能力。' : '财务结构稳健，债务风险较低。'}</li>
                  </ul>
                </div>
              </Card>

              {/* 历史对标记录 */}
              <Card size="small" title={<><HistoryOutlined /> 历史对标记录</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { date: dayjs().format('YYYY-MM-DD'), peers: selectedRecord.peerCompany, score: selectedRecord.similarityScore, action: '常规更新' },
                    { date: dayjs().subtract(14, 'day').format('YYYY-MM-DD'), peers: `${selectedRecord.industry}新增同行`, score: Math.round(selectedRecord.similarityScore - 5), action: '扩充对标池' },
                    { date: dayjs().subtract(45, 'day').format('YYYY-MM-DD'), peers: selectedRecord.peerCompany, score: Math.round(selectedRecord.similarityScore - 8), action: '首次建立对标' },
                  ]}
                  columns={[
                    { title: '日期', dataIndex: 'date', key: 'date' },
                    { title: '对标对象', dataIndex: 'peers', key: 'peers' },
                    { title: '相似度', dataIndex: 'score', key: 'score', render: (s: number) => <Progress percent={s} size="small" format={(p) => p} /> },
                    { title: '操作', dataIndex: 'action', key: 'action', render: (t: string) => <Tag>{t}</Tag> },
                  ]}
                  rowKey={(r) => r.date + r.peers}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
