'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  ExperimentOutlined, EyeOutlined, ReloadOutlined, FilePdfOutlined, CopyOutlined,
  ThunderboltOutlined, LineChartOutlined, DollarOutlined, PercentageOutlined,
  RiseOutlined, FallOutlined, DashboardOutlined, BulbOutlined, HistoryOutlined,
  SafetyCertificateOutlined, RocketOutlined, BarChartOutlined, AimOutlined,
  FireOutlined, CalculatorOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface SimulatedResults {
  medianFirstDayChange: number;
  pop95Range: string;
  medianSubscriptionX: number;
  probabilityOfSuccess: number;
  estimatedRaise: number;
}

interface IpoSimulation {
  id: number;
  scenarioName: string;
  company: string;
  offerPriceRange: [number, number];
  sharesOfferedM: number;
  simulatedResults: SimulatedResults;
  marketCondition: 'bull' | 'base' | 'bear';
  runCount: number;
  createdAt: string;
  parameters: Record<string, string>;
}

const mockSimulations: IpoSimulation[] = [
  { id: 1, scenarioName: '星云智能-乐观发行', company: '星云智能科技', offerPriceRange: [28, 35], sharesOfferedM: 120, simulatedResults: { medianFirstDayChange: 42.5, pop95Range: '+15% ~ +78%', medianSubscriptionX: 28.5, probabilityOfSuccess: 87, estimatedRaise: 3780 }, marketCondition: 'bull', runCount: 50000, createdAt: '2025-06-18', parameters: { volTarget: '25%', lockupDays: '180', greenshoe: '15%' } },
  { id: 2, scenarioName: '绿源新能源-基准情景', company: '绿源新能源', offerPriceRange: [45, 55], sharesOfferedM: 200, simulatedResults: { medianFirstDayChange: 18.2, pop95Range: '-5% ~ +45%', medianSubscriptionX: 12.3, probabilityOfSuccess: 92, estimatedRaise: 10000 }, marketCondition: 'base', runCount: 100000, createdAt: '2025-06-15', parameters: { volTarget: '20%', lockupDays: '365', greenshoe: '15%' } },
  { id: 3, scenarioName: '量子计算-高波动模拟', company: '量子计算实验室', offerPriceRange: [12, 18], sharesOfferedM: 50, simulatedResults: { medianFirstDayChange: 65.8, pop95Range: '-25% ~ +180%', medianSubscriptionX: 45.0, probabilityOfSuccess: 68, estimatedRaise: 750 }, marketCondition: 'bull', runCount: 80000, createdAt: '2025-06-12', parameters: { volTarget: '55%', lockupDays: '90', greenshoe: '20%' } },
  { id: 4, scenarioName: '医联健康-稳健发行', company: '医联健康平台', offerPriceRange: [32, 38], sharesOfferedM: 150, simulatedResults: { medianFirstDayChange: 12.5, pop95Range: '-8% ~ +32%', medianSubscriptionX: 8.5, probabilityOfSuccess: 94, estimatedRaise: 5250 }, marketCondition: 'base', runCount: 75000, createdAt: '2025-06-10', parameters: { volTarget: '18%', lockupDays: '180', greenshoe: '15%' } },
  { id: 5, scenarioName: '深空航天-保守定价', company: '深空航天科技', offerPriceRange: [22, 26], sharesOfferedM: 80, simulatedResults: { medianFirstDayChange: 8.3, pop95Range: '-12% ~ +28%', medianSubscriptionX: 6.2, probabilityOfSuccess: 88, estimatedRaise: 1920 }, marketCondition: 'bear', runCount: 60000, createdAt: '2025-06-08', parameters: { volTarget: '22%', lockupDays: '365', greenshoe: '10%' } },
  { id: 6, scenarioName: '链上金融-极端行情', company: '链上金融科技', offerPriceRange: [5, 8], sharesOfferedM: 30, simulatedResults: { medianFirstDayChange: -15.2, pop95Range: '-55% ~ +95%', medianSubscriptionX: 3.5, probabilityOfSuccess: 52, estimatedRaise: 195 }, marketCondition: 'bear', runCount: 45000, createdAt: '2025-06-05', parameters: { volTarget: '85%', lockupDays: '60', greenshoe: '0%' } },
  { id: 7, scenarioName: '智造机器人-成长溢价', company: '智造机器人', offerPriceRange: [18, 24], sharesOfferedM: 200, simulatedResults: { medianFirstDayChange: 25.6, pop95Range: '+2% ~ +58%', medianSubscriptionX: 15.8, probabilityOfSuccess: 85, estimatedRaise: 4200 }, marketCondition: 'bull', runCount: 65000, createdAt: '2025-06-02', parameters: { volTarget: '30%', lockupDays: '180', greenshoe: '15%' } },
  { id: 8, scenarioName: '自动驾驶-高关注度', company: '自动驾驶出行', offerPriceRange: [55, 68], sharesOfferedM: 300, simulatedResults: { medianFirstDayChange: 35.2, pop95Range: '+10% ~ +72%', medianSubscriptionX: 22.4, probabilityOfSuccess: 82, estimatedRaise: 18450 }, marketCondition: 'bull', runCount: 120000, createdAt: '2025-05-28', parameters: { volTarget: '35%', lockupDays: '180', greenshoe: '15%' } },
  { id: 9, scenarioName: '碳捕集环保-ESG溢价', company: '碳捕集环保', offerPriceRange: [14, 17], sharesOfferedM: 40, simulatedResults: { medianFirstDayChange: 20.1, pop95Range: '-3% ~ +48%', medianSubscriptionX: 10.2, probabilityOfSuccess: 90, estimatedRaise: 620 }, marketCondition: 'base', runCount: 55000, createdAt: '2025-05-25', parameters: { volTarget: '20%', lockupDays: '270', greenshoe: '15%' } },
  { id: 10, scenarioName: '生物基因-高风险探索', company: '生物基因编辑', offerPriceRange: [8, 12], sharesOfferedM: 15, simulatedResults: { medianFirstDayChange: -5.8, pop95Range: '-40% ~ +65%', medianSubscriptionX: 2.1, probabilityOfSuccess: 45, estimatedRaise: 150 }, marketCondition: 'bear', runCount: 35000, createdAt: '2025-05-22', parameters: { volTarget: '70%', lockupDays: '90', greenshoe: '0%' } },
];

const marketConfig: Record<string, { color: string; label: string }> = {
  bull: { color: 'success', label: '牛市' },
  base: { color: 'processing', label: '基准' },
  bear: { color: 'error', label: '熊市' },
};

export default function IpoSimulatorPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IpoSimulation | null>(null);
  const [filterMarket, setFilterMarket] = useState<string | undefined>();
  const [filterSuccessRate, setFilterSuccessRate] = useState<string | undefined>();

  const filteredData = mockSimulations.filter((item) => {
    if (filterMarket && item.marketCondition !== filterMarket) return false;
    if (filterSuccessRate === 'high' && item.simulatedResults.probabilityOfSuccess < 80) return false;
    if (filterSuccessRate === 'mid' && (item.simulatedResults.probabilityOfSuccess < 60 || item.simulatedResults.probabilityOfSuccess >= 80)) return false;
    if (filterSuccessRate === 'low' && item.simulatedResults.probabilityOfSuccess >= 60) return false;
    return true;
  });

  const totalScenarios = filteredData.length;
  const avgSuccessRate = Math.round(filteredData.reduce((sum, i) => sum + i.simulatedResults.probabilityOfSuccess, 0) / (totalScenarios || 1));
  const bestPriceRatio = `${(filteredData.sort((a, b) => b.simulatedResults.medianFirstDayChange - a.simulatedResults.medianFirstDayChange)[0]?.simulatedResults.medianFirstDayChange || 0).toFixed(1)}%`;
  const totalRuns = filteredData.reduce((sum, i) => sum + i.runCount, 0);
  const thisMonthNew = filteredData.filter((i) => dayjs(i.createdAt).month() === dayjs().month()).length;

  const handleViewDetail = (record: IpoSimulation) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleRerun = (record: IpoSimulation) => {
    message.loading(`正在重新运行 ${record.scenarioName} 蒙特卡洛模拟...`, 2);
  };

  const handleExportPDF = (record: IpoSimulation) => {
    message.success(`正在导出 ${record.scenarioName} 的模拟报告PDF...`);
  };

  const handleClone = (record: IpoSimulation) => {
    message.success(`已克隆场景: ${record.scenarioName} → ${record.scenarioName}(副本)`);
  };

  const columns = [
    { title: '场景名', dataIndex: 'scenarioName', key: 'scenarioName', width: 170, fixed: 'left' as const, render: (t: string) => <a style={{ fontWeight: 600 }}>{t}</a> },
    { title: '企业', dataIndex: 'company', key: 'company', width: 130, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '发行价区间($)', dataIndex: 'offerPriceRange', key: 'offerPriceRange', width: 125, render: (r: [number, number]) => <span style={{ fontWeight: 600 }}>${r[0]}-${r[1]}</span> },
    { title: '发行量(M股)', dataIndex: 'sharesOfferedM', key: 'sharesOfferedM', width: 100, render: (v: number) => `${v}M` },
    { title: '中位数首日涨幅%', dataIndex: ['simulatedResults', 'medianFirstDayChange'] as any, key: 'firstDay', width: 130, render: (_: any, r: IpoSimulation) => (
      <span style={{ fontWeight: 700, fontSize: 14, color: r.simulatedResults.medianFirstDayChange > 20 ? '#16A34A' : r.simulatedResults.medianFirstDayChange > 0 ? '#1677FF' : '#DC2626' }}>
        {r.simulatedResults.medianFirstDayChange > 0 ? '+' : ''}{r.simulatedResults.medianFirstDayChange}%
      </span>
    )},
    { title: 'P95区间', dataIndex: ['simulatedResults', 'pop95Range'] as any, key: 'p95range', width: 110, render: (_: any, r: IpoSimulation) => (
      <Tooltip title="95%置信区间">
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.simulatedResults.pop95Range}</span>
      </Tooltip>
    )},
    { title: '中位数认购倍', dataIndex: ['simulatedResults', 'medianSubscriptionX'] as any, key: 'subX', width: 115, render: (_: any, r: IpoSimulation) => (
      <span style={{ fontWeight: 700, color: r.simulatedResults.medianSubscriptionX >= 20 ? '#16A34A' : '#1677FF' }}>{r.simulatedResults.medianSubscriptionX}x</span>
    )},
    { title: '成功率%', dataIndex: ['simulatedResults', 'probabilityOfSuccess'] as any, key: 'successRate', width: 105, render: (_: any, r: IpoSimulation) => (
      <Progress percent={r.simulatedResults.probabilityOfSuccess} size="small" format={(p) => `${p}%`} strokeColor={r.simulatedResults.probabilityOfSuccess >= 85 ? '#16A34A' : r.simulatedResults.probabilityOfSuccess >= 70 ? '#1677FF' : '#F59E0B'} />
    )},
    { title: '募资额估计($M)', dataIndex: ['simulatedResults', 'estimatedRaise'] as any, key: 'raiseEst', width: 120, render: (_: any, r: IpoSimulation) => `$${r.simulatedResults.estimatedRaise.toLocaleString()}M` },
    { title: '市场环境', dataIndex: 'marketCondition', key: 'marketCondition', width: 85, render: (m: string) => <Tag color={marketConfig[m]?.color}>{marketConfig[m]?.label}</Tag> },
    { title: '运行次数', dataIndex: 'runCount', key: 'runCount', width: 85, render: (v: number) => v.toLocaleString() },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 100, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
    { key: 'rerun', label: '重新运行', icon: <ReloadOutlined />, type: 'link' as const, onClick: handleRerun },
    { key: 'pdf', label: '导出PDF', icon: <FilePdfOutlined />, type: 'link' as const, onClick: handleExportPDF },
    { key: 'clone', label: '克隆参数', icon: <CopyOutlined />, type: 'link' as const, onClick: handleClone },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <ExperimentOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>IPO发行模拟器</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              蒙特卡洛IPO模拟引擎 · 定价区间/认购倍数/首日表现预测 · AIOPC概率模型
            </p>
          </div>
        </div>

        {/* DataCard x5 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="模拟场景数" value={totalScenarios} icon={<CalculatorOutlined />} color="#1677FF" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均成功率" value={`${avgSuccessRate}%`} icon={<SafetyCertificateOutlined />} color="#16A34A" description="AIOPC概率模型" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="最优首日涨幅" value={bestPriceRatio} icon={<RocketOutlined />} color="#F0B90B" description="中位数首日表现" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="模拟总运行次数" value={(totalRuns / 1000).toFixed(0)} icon={<FireOutlined />} color="#7C3AED" suffix="K次" trend="up" trendValue="+15K 本周" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="本月新建" value={thisMonthNew} icon={<BarChartOutlined />} color="#F59E0B" suffix="个" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="市场环境" allowClear style={{ width: 130 }} value={filterMarket} onChange={setFilterMarket}>
              <Select.Option value="bull">牛市</Select.Option>
              <Select.Option value="base">基准</Select.Option>
              <Select.Option value="bear">熊市</Select.Option>
            </Select>
            <Select placeholder="成功率区间" allowClear style={{ width: 140 }} value={filterSuccessRate} onChange={setFilterSuccessRate}>
              <Select.Option value="high">高 (≥80%)</Select.Option>
              <Select.Option value="mid">中 (60-79%)</Select.Option>
              <Select.Option value="low">低 (&lt;60%)</Select.Option>
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
          title={`${selectedRecord?.scenarioName || ''} - 模拟详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={850}
          destroyOnHidden
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* 模拟参数 */}
              <Card size="small" title={<><DashboardOutlined /> 模拟参数配置</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="场景名称"><strong>{selectedRecord.scenarioName}</strong></Descriptions.Item>
                  <Descriptions.Item label="目标企业"><Tag color="blue">{selectedRecord.company}</Tag></Descriptions.Item>
                  <Descriptions.Item label="发行价区间"><span style={{ fontWeight: 700 }}>${selectedRecord.offerPriceRange[0]} - ${selectedRecord.offerPriceRange[1]}</span></Descriptions.Item>
                  <Descriptions.Item label="发行量">{selectedRecord.sharesOfferedM}M 股</Descriptions.Item>
                  <Descriptions.Item label="市场环境"><Tag color={marketConfig[selectedRecord.marketCondition]?.color}>{marketConfig[selectedRecord.marketCondition]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="蒙特卡洛次数">{selectedRecord.runCount.toLocaleString()} 次</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{dayjs(selectedRecord.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                </Descriptions>
                <Divider orientation="left" style={{ marginTop: 12 }}>高级参数</Divider>
                <Row gutter={[16, 8]}>
                  {Object.entries(selectedRecord.parameters).map(([key, val]) => (
                    <Col span={8} key={key}>
                      <div style={{ padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{key}</span>: <strong>{val}</strong>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 概率分布描述 */}
              <Card size="small" title={<><LineChartOutlined /> 首日涨幅概率分布</>} style={{ borderRadius: 8 }}>
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px 0', background: selectedRecord.simulatedResults.medianFirstDayChange > 0 ? '#F0FDF4' : '#FEF2F2', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>中位数首日涨幅</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: selectedRecord.simulatedResults.medianFirstDayChange > 20 ? '#16A34A' : selectedRecord.simulatedResults.medianFirstDayChange > 0 ? '#1677FF' : '#DC2626' }}>
                        {selectedRecord.simulatedResults.medianFirstDayChange > 0 ? '+' : ''}{selectedRecord.simulatedResults.medianFirstDayChange}%
                      </div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px 0', background: '#EFF6FF', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>95%置信区间</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1677FF', fontFamily: 'monospace' }}>{selectedRecord.simulatedResults.pop95Range}</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px 0', background: '#FEF3C7', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>中位数认购倍数</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#F59E0B' }}>{selectedRecord.simulatedResults.medianSubscriptionX}x</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '16px 0', background: '#F5F3FF', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, color: '#6B7280' }}>成功概率</div>
                      <Progress type="circle" percent={selectedRecord.simulatedResults.probabilityOfSuccess} size={56} format={(p) => <span style={{ fontSize: 16, fontWeight: 700 }}>{p}%</span>} strokeColor={selectedRecord.simulatedResults.probabilityOfSuccess >= 85 ? '#16A34A' : '#F59E0B'} />
                    </div>
                  </Col>
                </Row>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div><RiseOutlined style={{ color: '#16A34A' }} /> 上涨概率: <strong style={{ color: '#16A34A' }}>{Math.round(50 + selectedRecord.simulatedResults.medianFirstDayChange * 1.5)}%</strong></div>
                  <div><DollarOutlined style={{ color: '#1677FF' }} /> 预计募资: <strong style={{ color: '#1677FF' }}>${selectedRecord.simulatedResults.estimatedRaise.toLocaleString()}M</strong></div>
                  <div><FallOutlined style={{ color: '#DC2626' }} /> 破发概率: <strong style={{ color: '#DC2626' }}>{Math.max(0, Math.round(50 - selectedRecord.simulatedResults.medianFirstDayChange * 1.5))}%</strong></div>
                </div>
              </Card>

              {/* 敏感性分析 */}
              <Card size="small" title={<><AimOutlined /> 参数敏感性分析</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { param: '发行价+10%', impactOnFirstDay: `±${(Math.random() * 8 + 3).toFixed(1)}%`, impactOnSub: `±${(Math.random() * 4 + 1).toFixed(1)}x`, impactOnSuccess: `±${Math.round(Math.random() * 6 + 2)}%` },
                    { param: '发行量+20%', impactOnFirstDay: `∓${(Math.random() * 6 + 2).toFixed(1)}%`, impactOnSub: `∓${(Math.random() * 3 + 1).toFixed(1)}x`, impactOnSuccess: `±${Math.round(Math.random() * 4 + 1)}%` },
                    { param: '市场波动率+5%', impactOnFirstDay: `±${(Math.random() * 12 + 5).toFixed(1)}%`, impactOnSub: `±${(Math.random() * 6 + 2).toFixed(1)}x`, impactOnSuccess: `∓${Math.round(Math.random() * 8 + 3)}%` },
                    { param: '锁定期延长90天', impactOnFirstDay: `∓${(Math.random() * 4 + 1).toFixed(1)}%`, impactOnSub: `∓${(Math.random() * 2 + 0.5).toFixed(1)}x`, impactOnSuccess: `+${Math.round(Math.random() * 3 + 1)}%` },
                  ]}
                  columns={[
                    { title: '参数变化', dataIndex: 'param', key: 'param', render: (t: string) => <span className="font-semibold">{t}</span> },
                    { title: '首日涨幅影响', dataIndex: 'impactOnFirstDay', key: 'impactOnFirstDay' },
                    { title: '认购倍数影响', dataIndex: 'impactOnSub', key: 'impactOnSub' },
                    { title: '成功率影响', dataIndex: 'impactOnSuccess', key: 'impactOnSuccess' },
                  ]}
                  rowKey="param"
                />
              </Card>

              {/* AIOPC优化建议 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> AIOPC优化建议</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div style={{ background: '#FFFBE6', padding: 16, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                  <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                  <span className="font-semibold" style={{ color: '#F0B90B' }}>AIOPC蒙特卡洛优化建议：</span>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li><strong>定价建议：</strong>基于当前{marketConfig[selectedRecord.marketCondition]?.label}环境，AIOPC推荐将发行价定在区间的{(selectedRecord.offerPriceRange[0] + (selectedRecord.offerPriceRange[1] - selectedRecord.offerPriceRange[0]) * 0.45).toFixed(0)}附近，可最大化首日表现与认购热情的平衡。</li>
                    <li><strong>绿鞋机制：</strong>当前{selectedRecord.parameters.greenshoe || 'N/A'}的超额配售比例{parseInt(selectedRecord.parameters.greenshoe || '0') >= 15 ? '充足，可有效稳定股价。' : '偏低，建议提升至15%以增强承销信心。'}</li>
                    <li><strong>时机选择：</strong>{selectedRecord.marketCondition === 'bear' ? '当前熊市环境下，建议推迟发行或缩减规模，待市场回暖。' : selectedRecord.marketCondition === 'bull' ? '牛市窗口良好，建议尽快锁定发行窗口。' : '基准市场下可按计划推进，关注宏观指标变化。'}</li>
                  </ul>
                </div>
              </Card>

              {/* 历史运行记录 */}
              <Card size="small" title={<><HistoryOutlined /> 历史运行记录</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { runId: `#${String(selectedRecord.id).padStart(4, '0')}`, date: selectedRecord.createdAt, runs: selectedRecord.runCount.toLocaleString(), firstDay: `${selectedRecord.simulatedResults.medianFirstDayChange}%`, success: `${selectedRecord.simulatedResults.probabilityOfSuccess}%`, status: '最新' },
                    { runId: `#${String(selectedRecord.id).padStart(4, '0')}-1`, date: dayjs(selectedRecord.createdAt).subtract(3, 'day').format('YYYY-MM-DD'), runs: Math.round(selectedRecord.runCount * 0.8).toLocaleString(), firstDay: `${(selectedRecord.simulatedResults.medianFirstDayChange * (0.9 + Math.random() * 0.2)).toFixed(1)}%`, success: `${Math.round(selectedRecord.simulatedResults.probabilityOfSuccess * (0.95 + Math.random() * 0.08))}%`, status: '历史' },
                    { runId: `#${String(selectedRecord.id).padStart(4, '0')}-2`, date: dayjs(selectedRecord.createdAt).subtract(10, 'day').format('YYYY-MM-DD'), runs: Math.round(selectedRecord.runCount * 0.6).toLocaleString(), firstDay: `${(selectedRecord.simulatedResults.medianFirstDayChange * (0.85 + Math.random() * 0.2)).toFixed(1)}%`, success: `${Math.round(selectedRecord.simulatedResults.probabilityOfSuccess * (0.9 + Math.random() * 0.15))}%`, status: '历史' },
                  ]}
                  columns={[
                    { title: '运行ID', dataIndex: 'runId', key: 'runId', render: (t: string) => <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{t}</Tag> },
                    { title: '运行时间', dataIndex: 'date', key: 'date' },
                    { title: '模拟次数', dataIndex: 'runs', key: 'runs' },
                    { title: '首日涨幅', dataIndex: 'firstDay', key: 'firstDay', render: (f: string) => <span style={{ fontWeight: 600 }}>{f}</span> },
                    { title: '成功率', dataIndex: 'success', key: 'success' },
                    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => s === '最新' ? <Tag color="gold">最新</Tag> : <Tag>历史</Tag> },
                  ]}
                  rowKey="runId"
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
