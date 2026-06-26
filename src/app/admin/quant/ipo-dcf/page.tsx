'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  FundOutlined, EyeOutlined, ThunderboltOutlined, LineChartOutlined, DollarOutlined,
  PercentageOutlined, RiseOutlined, FallOutlined, CalculatorOutlined, HistoryOutlined,
  BulbOutlined, SafetyCertificateOutlined, DashboardOutlined, AlertOutlined,
  ExperimentOutlined, BarChartOutlined, SwapOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface DcfModel {
  id: number;
  companyName: string;
  baseCaseValue: number;
  bullishCase: number;
  bearishCase: number;
  wacc: number;
  terminalGrowth: number;
  projectionYears: number;
  revenueCAGR: number;
  marginAssumption: string;
  keyDrivers: string[];
  sensitivityAnalysis: Record<string, number>;
  lastUpdated: string;
  analyst: string;
}

const mockDcfModels: DcfModel[] = [
  { id: 1, companyName: '星云智能科技', baseCaseValue: 2800, bullishCase: 4200, bearishCase: 1600, wacc: 11.5, terminalGrowth: 3.0, projectionYears: 10, revenueCAGR: 45, marginAssumption: '稳态毛利率65%', keyDrivers: ['AI商业化加速', 'SaaS订阅增长'], sensitivityAnalysis: { 'WACC±1%': 180, '增长率±2%': 320 }, lastUpdated: '2025-06-15', analyst: '李明' },
  { id: 2, companyName: '绿源新能源', baseCaseValue: 8500, bullishCase: 12000, bearishCase: 5500, wacc: 9.8, terminalGrowth: 2.5, projectionYears: 12, revenueCAGR: 35, marginAssumption: '规模效应下净利率15%', keyDrivers: ['政策补贴延续', '产能扩张节奏'], sensitivityAnalysis: { 'WACC±1%': 650, '增长率±2%': 890 }, lastUpdated: '2025-06-12', analyst: '王芳' },
  { id: 3, companyName: '量子计算实验室', baseCaseValue: 1500, bullishCase: 3500, bearishCase: 600, wacc: 14.2, terminalGrowth: 4.0, projectionYears: 8, revenueCAGR: 80, marginAssumption: '高研发投入期，后期利润释放', keyDrivers: ['技术突破时点', '商业化落地速度'], sensitivityAnalysis: { 'WACC±1%': 120, '增长率±5%': 450 }, lastUpdated: '2025-06-10', analyst: '张伟' },
  { id: 4, companyName: '医联健康平台', baseCaseValue: 6200, bullishCase: 8500, bearishCase: 4000, wacc: 10.5, terminalGrowth: 3.0, projectionYears: 10, revenueCAGR: 28, marginAssumption: '平台经济边际成本递减', keyDrivers: ['用户渗透率', '监管政策走向'], sensitivityAnalysis: { 'WACC±1%': 420, '增长率±2%': 560 }, lastUpdated: '2025-06-08', analyst: '刘洋' },
  { id: 5, companyName: '深空航天科技', baseCaseValue: 4200, bullishCase: 6800, bearishCase: 2500, wacc: 12.8, terminalGrowth: 2.8, projectionYears: 15, revenueCAGR: 32, marginAssumption: '长周期项目制收入确认', keyDrivers: ['政府合同获取', '卫星发射成功率'], sensitivityAnalysis: { 'WACC±1%': 280, '增长率±3%': 520 }, lastUpdated: '2025-06-05', analyst: '陈静' },
  { id: 6, companyName: '链上金融科技', baseCaseValue: 380, bullishCase: 750, bearishCase: 150, wacc: 16.5, terminalGrowth: 3.5, projectionYears: 7, revenueCAGR: 95, marginAssumption: '高波动性收入模型', keyDrivers: ['加密市场周期', '监管合规进度'], sensitivityAnalysis: { 'WACC±2%': 85, '增长率±10%': 140 }, lastUpdated: '2025-06-03', analyst: '赵磊' },
  { id: 7, companyName: '智造机器人', baseCaseValue: 5500, bullishCase: 7800, bearishCase: 3400, wacc: 10.2, terminalGrowth: 2.5, projectionYears: 10, revenueCAGR: 25, marginAssumption: '工业自动化渗透率提升', keyDrivers: ['劳动力替代趋势', '出口订单量'], sensitivityAnalysis: { 'WACC±1%': 380, '增长率±2%': 480 }, lastUpdated: '2025-06-01', analyst: '孙丽' },
  { id: 8, companyName: '生物基因编辑', baseCaseValue: 95, bullishCase: 300, bearishCase: 30, wacc: 18.0, terminalGrowth: 5.0, projectionYears: 5, revenueCAGR: 150, marginAssumption: '临床前阶段，负现金流', keyDrivers: ['FDA审批进度', '伦理审查结果'], sensitivityAnalysis: { 'WACC±2%': 18, '增长率±20%': 55 }, lastUpdated: '2025-05-28', analyst: '周涛' },
  { id: 9, companyName: '碳捕集环保', baseCaseValue: 420, bullishCase: 720, bearishCase: 220, wacc: 11.0, terminalGrowth: 3.2, projectionYears: 10, revenueCAGR: 55, marginAssumption: '碳交易市场成熟后利润改善', keyDrivers: ['碳价走势', 'CCUS补贴政策'], sensitivityAnalysis: { 'WACC±1%': 35, '增长率±5%': 85 }, lastUpdated: '2025-05-22', analyst: '吴敏' },
  { id: 10, companyName: '自动驾驶出行', baseCaseValue: 12000, bullishCase: 18000, bearishCase: 7000, wacc: 13.5, terminalGrowth: 3.5, projectionYears: 12, revenueCAGR: 40, marginAssumption: 'Robotaxi规模化运营后高毛利', keyDrivers: ['L4/L5法规开放', '车队扩张速度'], sensitivityAnalysis: { 'WACC±1%': 950, '增长率±3%': 1500 }, lastUpdated: '2025-05-20', analyst: '郑凯' },
];

const industries = ['人工智能', '新能源', '量子科技', '医疗健康', '航空航天', '区块链', '智能制造', '生物科技', '环保科技', '自动驾驶'];

export default function IpoDcfPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DcfModel | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  const filteredData = mockDcfModels.filter((item) => {
    if (filterIndustry && !item.companyName.includes(filterIndustry.split('')[0])) return false;
    if (searchText && !item.companyName.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const totalModels = filteredData.length;
  const avgBaseValue = Math.round(filteredData.reduce((sum, i) => sum + i.baseCaseValue, 0) / (totalModels || 1));
  const avgWacc = (filteredData.reduce((sum, i) => sum + i.wacc, 0) / (totalModels || 1)).toFixed(1);
  const sensitivityVars = filteredData.reduce((sum, i) => sum + Object.keys(i.sensitivityAnalysis).length, 0);
  const aiopcAdjustCount = Math.round(totalModels * 0.78);

  const handleViewDetail = (record: DcfModel) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const columns = [
    { title: '企业名', dataIndex: 'companyName', key: 'companyName', width: 130, fixed: 'left' as const, render: (t: string) => <a style={{ fontWeight: 600 }}>{t}</a> },
    { title: '基准估值($M)', dataIndex: 'baseCaseValue', key: 'baseCaseValue', width: 110, render: (v: number) => <span style={{ fontWeight: 700, color: '#1677FF' }}>${v.toLocaleString()}M</span> },
    { title: '乐观($M)', dataIndex: 'bullishCase', key: 'bullishCase', width: 95, render: (v: number) => <span style={{ color: '#16A34A' }}>${v.toLocaleString()}M</span> },
    { title: '悲观($M)', dataIndex: 'bearishCase', key: 'bearishCase', width: 95, render: (v: number) => <span style={{ color: '#DC2626' }}>${v.toLocaleString()}M</span> },
    { title: 'WACC%', dataIndex: 'wacc', key: 'wacc', width: 70, render: (v: number) => <Tag color={v <= 10 ? 'green' : v <= 13 ? 'orange' : 'red'}>{v}%</Tag> },
    { title: '终端增长率%', dataIndex: 'terminalGrowth', key: 'terminalGrowth', width: 100 },
    { title: '预测年限', dataIndex: 'projectionYears', key: 'projectionYears', width: 80, render: (v: number) => `${v}年` },
    { title: '收入CAGR%', dataIndex: 'revenueCAGR', key: 'revenueCAGR', width: 95, render: (v: number) => <span style={{ fontWeight: 600 }}>{v}%</span> },
    { title: '关键驱动', dataIndex: 'keyDrivers', key: 'keyDrivers', width: 180, render: (d: string[]) => (
      <Space size={[0, 4]} wrap>{d.map((k, i) => <Tag key={i} color="blue" style={{ fontSize: 11 }}>{k}</Tag>)}</Space>
    )},
    { title: '分析师', dataIndex: 'analyst', key: 'analyst', width: 70 },
    { title: '更新时间', dataIndex: 'lastUpdated', key: 'lastUpdated', width: 100, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <FundOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>DCF估值模型中心</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              现金流折现估值分析 · 敏感性分析/情景模拟/跨模型对标 · AIOPC增强预测
            </p>
          </div>
        </div>

        {/* DataCard x5 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="估值模型数" value={totalModels} icon={<CalculatorOutlined />} color="#1677FF" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均基准值" value={`$${(avgBaseValue / 1000).toFixed(1)}B`} icon={<DollarOutlined />} color="#16A34A" description="Base Case均值" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="WACC均值" value={`${avgWacc}%`} icon={<PercentageOutlined />} color="#F59E0B" suffix="" description="加权平均资本成本" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="敏感性变量" value={sensitivityVars} icon={<BarChartOutlined />} color="#7C3AED" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="AIOPC调整次数" value={aiopcAdjustCount} icon={<ThunderboltOutlined />} color="#F0B90B" suffix="次" trend="up" trendValue="+12 本月" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="行业预估筛选" allowClear style={{ width: 160 }} value={filterIndustry} onChange={setFilterIndustry}>
              {industries.map((ind) => <Select.Option key={ind} value={ind}>{ind}</Select.Option>)}
            </Select>
            <input
              placeholder="搜索企业名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                padding: '5px 11px', border: '1px solid #D9D9D9', borderRadius: 6, width: 200,
                outline: 'none', fontSize: 14,
              }}
            />
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
          title={`${selectedRecord?.companyName || ''} - DCF估值详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={800}
          destroyOnHidden
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* DCF参数 */}
              <Card size="small" title={<><CalculatorOutlined /> 核心DCF参数</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="企业名称">{selectedRecord.companyName}</Descriptions.Item>
                  <Descriptions.Item label="分析师">{selectedRecord.analyst}</Descriptions.Item>
                  <Descriptions.Item label="基准估值"><span style={{ fontWeight: 700, fontSize: 18, color: '#1677FF' }}>${selectedRecord.baseCaseValue.toLocaleString()}M</span></Descriptions.Item>
                  <Descriptions.Item label="乐观情景"><span style={{ color: '#16A34A', fontWeight: 600 }}>${selectedRecord.bullishCase.toLocaleString()}M</span></Descriptions.Item>
                  <Descriptions.Item label="悲观情景"><span style={{ color: '#DC2626', fontWeight: 600 }}>${selectedRecord.bearishCase.toLocaleString()}M</span></Descriptions.Item>
                  <Descriptions.Item label="WACC"><Tag color={selectedRecord.wacc <= 10 ? 'green' : selectedRecord.wacc <= 13 ? 'orange' : 'red'}>{selectedRecord.wacc}%</Tag></Descriptions.Item>
                  <Descriptions.Item label="终端增长率">{selectedRecord.terminalGrowth}%</Descriptions.Item>
                  <Descriptions.Item label="预测年限">{selectedRecord.projectionYears}年</Descriptions.Item>
                  <Descriptions.Item label="收入CAGR">{selectedRecord.revenueCAGR}%</Descriptions.Item>
                  <Descriptions.Item label="利润假设" span={2}>{selectedRecord.marginAssumption}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 敏感性分析 */}
              <Card size="small" title={<><SwapOutlined /> 敏感性分析矩阵</>} style={{ borderRadius: 8 }}>
                <Row gutter={[12, 12]}>
                  {Object.entries(selectedRecord.sensitivityAnalysis).map(([key, val]) => (
                    <Col span={8} key={key}>
                      <div style={{ textAlign: 'center', padding: 16, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{key}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#1677FF' }}>
                          {val > 0 ? `+${val}` : val}M
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>估值变动幅度</div>
                      </div>
                    </Col>
                  ))}
                </Row>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
                  <div><RiseOutlined style={{ color: '#16A34A' }} /> 上涨空间: <strong style={{ color: '#16A34A' }}>{(((selectedRecord.bullishCase - selectedRecord.baseCaseValue) / selectedRecord.baseCaseValue) * 100).toFixed(1)}%</strong></div>
                  <div><FallOutlined style={{ color: '#DC2626' }} /> 下行风险: <strong style={{ color: '#DC2626' }}>{(((selectedRecord.baseCaseValue - selectedRecord.bearishCase) / selectedRecord.baseCaseValue) * 100).toFixed(1)}%</strong></div>
                </div>
              </Card>

              {/* 情景对比 */}
              <Card size="small" title={<><LineChartOutlined /> 三情景估值对比</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { scenario: '悲观情景 Bearish', value: selectedRecord.bearishCase, prob: '20%', color: '#DC2626', desc: '保守假设下的最低估值' },
                    { scenario: '基准情景 Base Case', value: selectedRecord.baseCaseValue, prob: '55%', color: '#1677FF', desc: '最可能实现的估值水平' },
                    { scenario: '乐观情景 Bullish', value: selectedRecord.bullishCase, prob: '25%', color: '#16A34A', desc: '理想条件下的最高估值' },
                  ]}
                  columns={[
                    { title: '情景', dataIndex: 'scenario', key: 'scenario', render: (t: string, r: any) => <span style={{ color: r.color, fontWeight: 600 }}>{t}</span> },
                    { title: '估值($M)', dataIndex: 'value', key: 'value', render: (v: number, r: any) => <span style={{ color: r.color, fontWeight: 700 }}>${v.toLocaleString()}M</span> },
                    { title: '概率', dataIndex: 'prob', key: 'prob', render: (p: string) => <Tag>{p}</Tag> },
                    { title: '说明', dataIndex: 'desc', key: 'desc' },
                  ]}
                  rowKey="scenario"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><strong>加权期望值</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong style={{ color: '#F0B90B', fontSize: 16 }}>
                          ${Math.round(selectedRecord.bearishCase * 0.2 + selectedRecord.baseCaseValue * 0.55 + selectedRecord.bullishCase * 0.25).toLocaleString()}M
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}><strong>100%</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>AIOPC概率加权估值</Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </Card>

              {/* AIOPC预测修正 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> AIOPC增强预测修正</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div style={{ background: '#FFFBE6', padding: 16, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                  <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                  <span className="font-semibold" style={{ color: '#F0B90B' }}>AIOPC智能修正建议：</span>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li>基于当前市场环境，AIOPC建议将WACC从{selectedRecord.wacc}%调整至{(selectedRecord.wacc + (Math.random() * 2 - 1)).toFixed(1)}%，反映近期无风险利率变化。</li>
                    <li>终端增长率可考虑上调至{(selectedRecord.terminalGrowth + 0.5).toFixed(1)}%，考虑到{selectedRecord.keyDrivers[0]}的积极影响。</li>
                    <li>AIOPC修正后的目标估值为 <strong style={{ color: '#F0B90B', fontSize: 16 }}>${Math.round(selectedRecord.baseCaseValue * (1 + Math.random() * 0.15)).toLocaleString()}M</strong></li>
                  </ul>
                </div>
              </Card>

              {/* 历史估值记录 */}
              <Card size="small" title={<><HistoryOutlined /> 历史估值记录</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { date: dayjs().format('YYYY-MM-DD'), baseVal: selectedRecord.baseCaseValue, change: '+0%', reason: '常规更新', analyst: selectedRecord.analyst },
                    { date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), baseVal: Math.round(selectedRecord.baseCaseValue * 0.95), change: '-5.0%', reason: '行业可比公司下调', analyst: selectedRecord.analyst },
                    { date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), baseVal: Math.round(selectedRecord.baseCaseValue * 0.88), change: '-12.0%', reason: '初始DCF建模', analyst: selectedRecord.analyst },
                  ]}
                  columns={[
                    { title: '日期', dataIndex: 'date', key: 'date' },
                    { title: '基准估值($M)', dataIndex: 'baseVal', key: 'baseVal', render: (v: number) => `$${v.toLocaleString()}M` },
                    { title: '变动', dataIndex: 'change', key: 'change', render: (c: string) => <span style={{ color: c.startsWith('+') ? '#16A34A' : '#DC2626', fontWeight: 600 }}>{c}</span> },
                    { title: '原因', dataIndex: 'reason', key: 'reason' },
                    { title: '分析师', dataIndex: 'analyst', key: 'analyst' },
                  ]}
                  rowKey="date"
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
