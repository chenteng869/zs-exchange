'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  ExperimentOutlined, EyeOutlined, EditOutlined, CopyOutlined, PlayCircleOutlined,
  InboxOutlined, TrophyOutlined, ThunderboltOutlined, LineChartOutlined, SettingOutlined,
  HistoryOutlined, BulbOutlined, PercentageOutlined, FundOutlined, SafetyCertificateOutlined,
  StarOutlined, RocketOutlined, ToolOutlined, CheckCircleOutlined, DashboardOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface Factor {
  name: string;
  weight: number;
  description: string;
}

interface ScoringModel {
  id: number;
  modelName: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  factors: Factor[];
  backtestSharpe: number;
  backtestWinRate: number;
  sampleSize: number;
  lastTunedAt: string;
  createdBy: string;
  accuracy: number;
}

const mockModels: ScoringModel[] = [
  { id: 1, modelName: 'AIOPC-IPO-V3 综合评分引擎', version: 'v3.2.1', status: 'active', factors: [{ name: '财务健康度', weight: 25, description: '营收增长+盈利能力' }, { name: '市场地位', weight: 20, description: '行业排名与份额' }, { name: '团队质量', weight: 20, description: '核心团队背景经验' }, { name: '技术壁垒', weight: 20, description: '专利护城河深度' }, { name: 'ESG合规', weight: 15, description: '环境社会治理评分' }], backtestSharpe: 2.35, backtestWinRate: 72.5, sampleSize: 1280, lastTunedAt: '2025-06-10', createdBy: 'AIOPC团队', accuracy: 91.2 },
  { id: 2, modelName: '成长型IPO筛选器', version: 'v2.1.0', status: 'active', factors: [{ name: '收入增长率', weight: 30, description: '近三年复合增长率' }, { name: '市场规模', weight: 25, description: 'TAM/SAM/SOM分析' }, { name: '毛利率趋势', weight: 25, description: '边际改善程度' }, { name: '客户留存率', weight: 20, description: 'NDR/Churn指标' }], backtestSharpe: 1.89, backtestWinRate: 68.3, sampleSize: 856, lastTunedAt: '2025-05-28', createdBy: '量化研究组', accuracy: 86.7 },
  { id: 3, modelName: '价值型IPO估值模型', version: 'v1.8.3', status: 'active', factors: [{ name: 'PE/PB比率', weight: 28, description: '相对估值水平' }, { name: 'ROE/ROIC', weight: 27, description: '资本回报效率' }, { name: '现金流稳定性', weight: 25, description: 'FCF波动性' }, { name: '分红潜力', weight: 20, description: '未来派息能力' }], backtestSharpe: 1.56, backtestWinRate: 64.8, sampleSize: 642, lastTunedAt: '2025-05-15', createdBy: '基本面团队', accuracy: 82.4 },
  { id: 4, modelName: '科技赛道专用评分器', version: 'v2.0.0-rc', status: 'draft', factors: [{ name: '研发投入比', weight: 25, description: 'R&D占营收比例' }, { name: '专利数量', weight: 22, description: '有效专利资产' }, { name: '人才密度', weight: 23, description: '博士/硕士占比' }, { name: '产品迭代速度', weight: 18, description: '版本发布频率' }, { name: '开源影响力', weight: 12, description: 'GitHub Stars等' }], backtestSharpe: 0, backtestWinRate: 0, sampleSize: 0, lastTunedAt: '2025-06-18', createdBy: '科技行业组', accuracy: 0 },
  { id: 5, modelName: 'ESG-IPO绿色通道模型', version: 'v1.5.0', status: 'active', factors: [{ name: '碳排放强度', weight: 24, description: '单位营收碳排放' }, { name: '治理结构', weight: 26, description: '董事会独立性' }, { name: '社会责任', weight: 25, description: '社区贡献度' }, { name: '供应链透明度', weight: 25, description: '供应商ESG评级' }], backtestSharpe: 1.42, backtestWinRate: 61.2, sampleSize: 320, lastTunedAt: '2025-04-20', createdBy: 'ESG研究中心', accuracy: 78.9 },
  { id: 6, modelName: '早期阶段风险预警模型', version: 'v1.2.1', status: 'archived', factors: [{ name: '烧钱速率', weight: 30, description: 'Runway月数' }, { name: '融资间隔', weight: 25, description: '轮次间隔时间' }, { name: '核心人员流失', weight: 25, description: '关键员工离职率' }, { name: '市场热度下降', weight: 20, description: '关注度指标' }], backtestSharpe: 1.12, backtestWinRate: 58.6, sampleSize: 480, lastTunedAt: '2025-02-10', createdBy: '风控组', accuracy: 73.5 },
  { id: 7, modelName: '港股IPO适配模型-HK', version: 'v1.0.3', status: 'draft', factors: [{ name: '流动性预期', weight: 28, description: '预计日均成交额' }, { name: '基石投资者', weight: 26, description: '锁定期配置' }, { name: '绿鞋机制', weight: 24, description: '超额配售比例' }, { name: '暗盘表现', weight: 22, description: 'Grey Market定价' }], backtestSharpe: 0, backtestWinRate: 0, sampleSize: 45, lastTunedAt: '2025-06-14', createdBy: '港美股组', accuracy: 65.0 },
  { id: 8, modelName: '多因子融合超级模型', version: 'v4.0.0-beta', status: 'active', factors: [{ name: '动量因子', weight: 18, description: '价格动量信号' }, { name: '质量因子', weight: 22, description: '财务质量综合' }, { name: '价值因子', weight: 16, description: '内在价值偏离' }, { name: '成长因子', weight: 20, description: '长期成长预期' }, { name: '情绪因子', weight: 15, description: '市场情绪指数' }, { name: '分析师修正', weight: 9, description: '目标价调整方向' }], backtestSharpe: 2.78, backtestWinRate: 76.8, sampleSize: 2100, lastTunedAt: '2025-06-19', createdBy: 'AIOPC核心引擎', accuracy: 94.6 },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'success', label: '活跃' },
  draft: { color: 'processing', label: '草稿' },
  archived: { color: 'default', label: '已归档' },
};

const creators = ['AIOPC团队', '量化研究组', '基本面团队', '科技行业组', 'ESG研究中心', '风控组', '港美股组', 'AIOPC核心引擎'];

export default function IpoScorePage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScoringModel | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCreator, setFilterCreator] = useState<string | undefined>();

  const filteredData = mockModels.filter((item) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterCreator && item.createdBy !== filterCreator) return false;
    return true;
  });

  const totalModels = filteredData.length;
  const activeCount = filteredData.filter((i) => i.status === 'active').length;
  const maxAccuracy = Math.max(...filteredData.filter((i) => i.accuracy > 0).map((i) => i.accuracy), 0);
  const avgSharpe = (filteredData.filter((i) => i.backtestSharpe > 0).reduce((sum, i) => sum + i.backtestSharpe, 0) / (filteredData.filter((i) => i.backtestSharpe > 0).length || 1)).toFixed(2);
  const thisMonthTuned = filteredData.filter((i) => dayjs(i.lastTunedAt).month() === dayjs().month()).length;

  const handleViewDetail = (record: ScoringModel) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleEdit = (record: ScoringModel) => {
    message.info(`正在编辑模型: ${record.modelName}`);
  };

  const handleCopy = (record: ScoringModel) => {
    message.success(`已复制模型: ${record.modelName} → ${record.modelName}(副本)`);
  };

  const handleBacktest = (record: ScoringModel) => {
    message.loading(`正在运行 ${record.modelName} 的回测验证...`, 2);
  };

  const handleArchive = (record: ScoringModel) => {
    message.success(`已归档模型: ${record.modelName}`);
  };

  const columns = [
    { title: '模型名称', dataIndex: 'modelName', key: 'modelName', width: 220, fixed: 'left' as const, render: (t: string) => <a style={{ fontWeight: 600 }}>{t}</a> },
    { title: '版本', dataIndex: 'version', key: 'version', width: 110, render: (v: string) => <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.label}</Tag> },
    { title: '因子数', dataIndex: 'factors', key: 'factorCount', width: 70, render: (f: Factor[]) => f.length },
    { title: 'Sharpe', dataIndex: 'backtestSharpe', key: 'sharpe', width: 75, render: (v: number) => v > 0 ? <span style={{ fontWeight: 600, color: v >= 2 ? '#16A34A' : '#1677FF' }}>{v.toFixed(2)}</span> : <span style={{ color: '#D9D9D9' }}>-</span> },
    { title: '胜率%', dataIndex: 'backtestWinRate', key: 'winRate', width: 75, render: (v: number) => v > 0 ? `${v}%` : '-' },
    { title: '样本量', dataIndex: 'sampleSize', key: 'sampleSize', width: 80, render: (v: number) => v.toLocaleString() },
    { title: '准确度', dataIndex: 'accuracy', key: 'accuracy', width: 85, render: (v: number) => v > 0 ? (
      <Progress percent={v} size="small" format={(p) => `${p}%`} strokeColor={v >= 90 ? '#16A34A' : v >= 80 ? '#1677FF' : '#F59E0B'} />
    ) : '-' },
    { title: '最后调优', dataIndex: 'lastTunedAt', key: 'lastTunedAt', width: 105, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
    { title: '创建者', dataIndex: 'createdBy', key: 'createdBy', width: 120, render: (t: string) => <Tag>{t}</Tag> },
  ];

  const actions = [
    { key: 'view', label: '查看', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
    { key: 'edit', label: '编辑', icon: <EditOutlined />, type: 'link' as const, onClick: handleEdit, hidden: () => false },
    { key: 'copy', label: '复制', icon: <CopyOutlined />, type: 'link' as const, onClick: handleCopy },
    { key: 'backtest', label: '回测', icon: <PlayCircleOutlined />, type: 'link' as const, hidden: (r: any) => r.status === 'archived', onClick: handleBacktest },
    { key: 'archive', label: '归档', icon: <InboxOutlined />, type: 'link' as const, danger: true, hidden: (r: any) => r.status === 'archived', onClick: handleArchive },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <ExperimentOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>IPO评分模型配置</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              可配置的多因子评分引擎 · 权重调整/回测验证/版本管理 · AIOPC智能权重优化
            </p>
          </div>
        </div>

        {/* DataCard x5 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="模型总数" value={totalModels} icon={<SettingOutlined />} color="#1677FF" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="活跃模型" value={activeCount} icon={<CheckCircleOutlined />} color="#16A34A" suffix="个" trend="up" trendValue="+1 本月" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="最高准确率" value={`${maxAccuracy}%`} icon={<TrophyOutlined />} color="#F0B90B" description="最佳模型表现" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均Sharpe" value={avgSharpe} icon={<LineChartOutlined />} color="#7C3AED" description="回测风险调整收益" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="本月调优" value={thisMonthTuned} icon={<ToolOutlined />} color="#F59E0B" suffix="次" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="模型状态" allowClear style={{ width: 140 }} value={filterStatus} onChange={setFilterStatus}>
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="archived">已归档</Select.Option>
            </Select>
            <Select placeholder="创建人" allowClear style={{ width: 160 }} value={filterCreator} onChange={setFilterCreator}>
              {creators.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
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
          title={`${selectedRecord?.modelName || ''} - 模型详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={800}
          destroyOnHidden
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* 模型基本信息 */}
              <Card size="small" title={<><DashboardOutlined /> 模型信息</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="模型名称">{selectedRecord.modelName}</Descriptions.Item>
                  <Descriptions.Item label="版本号"><Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{selectedRecord.version}</Tag></Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusConfig[selectedRecord.status]?.color}>{statusConfig[selectedRecord.status]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="创建者"><Tag>{selectedRecord.createdBy}</Tag></Descriptions.Item>
                  <Descriptions.Item label="最后调优">{dayjs(selectedRecord.lastTunedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                  <Descriptions.Item label="样本量">{selectedRecord.sampleSize.toLocaleString()}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 因子权重表 */}
              <Card size="small" title={<><PercentageOutlined /> 因子权重配置</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={selectedRecord.factors.map((f, idx) => ({ ...f, key: idx + 1 }))}
                  columns={[
                    { title: '序号', dataIndex: 'key', key: 'key', width: 55 },
                    { title: '因子名称', dataIndex: 'name', key: 'name', render: (t: string) => <span style={{ fontWeight: 600 }}>{t}</span> },
                    { title: '权重', dataIndex: 'weight', key: 'weight', width: 150, render: (w: number) => (
                      <div className="flex items-center gap-2">
                        <Progress percent={w} size="small" format={(p) => `${p}%`} strokeColor="#1677FF" style={{ flex: 1 }} />
                        <span style={{ fontWeight: 600, minWidth: 36 }}>{w}%</span>
                      </div>
                    )},
                    { title: '说明', dataIndex: 'description', key: 'description' },
                  ]}
                  rowKey="key"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}><strong>合计权重</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong style={{ color: selectedRecord.factors.reduce((s, f) => s + f.weight, 0) === 100 ? '#16A34A' : '#DC2626' }}>
                          {selectedRecord.factors.reduce((s, f) => s + f.weight, 0)}%
                        </strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  )}
                />
              </Card>

              {/* 回测绩效 */}
              {selectedRecord.sampleSize > 0 && (
                <Card size="small" title={<><RocketOutlined /> 回测绩效报告</>} style={{ borderRadius: 8 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: '12px 0', background: '#F0FDF4', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>Sharpe Ratio</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: selectedRecord.backtestSharpe >= 2 ? '#16A34A' : '#1677FF' }}>{selectedRecord.backtestSharpe.toFixed(2)}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: '12px 0', background: '#EFF6FF', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>胜率</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#1677FF' }}>{selectedRecord.backtestWinRate}%</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: '12px 0', background: '#FEF3C7', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>准确度</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#F0B90B' }}>{selectedRecord.accuracy}%</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: '12px 0', background: '#F5F3FF', borderRadius: 8 }}>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>回测样本</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>{(selectedRecord.sampleSize / 1000).toFixed(1)}K</div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* AIOPC优化建议 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> AIOPC优化建议</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div style={{ background: '#FFFBE6', padding: 16, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                  <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                  <span className="font-semibold" style={{ color: '#F0B90B' }}>智能优化建议：</span>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li>建议将「{selectedRecord.factors[0]?.name}」权重从{selectedRecord.factors[0]?.weight}%调整为{Math.min(selectedRecord.factors[0]?.weight + 3, 40)}%，历史回测显示该因子近期预测力提升。</li>
                    <li>新增「市场情绪」因子（建议权重8%），可提升整体准确率约{(Math.random() * 3 + 1).toFixed(1)}个百分点。</li>
                    <li>当前因子间相关性偏高，建议引入正交化处理以降低多重共线性影响。</li>
                  </ul>
                </div>
              </Card>

              {/* 版本历史 */}
              <Card size="small" title={<><HistoryOutlined /> 版本迭代记录</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { version: selectedRecord.version, date: selectedRecord.lastTunedAt, changes: `因子权重微调，准确率提升至${selectedRecord.accuracy}%`, operator: selectedRecord.createdBy },
                    { version: `v${parseFloat(selectedRecord.version) - 0.1}`, date: dayjs(selectedRecord.lastTunedAt).subtract(15, 'day').format('YYYY-MM-DD'), changes: '新增数据源接入，扩充样本集', operator: selectedRecord.createdBy },
                    { version: `v${parseFloat(selectedRecord.version) - 0.2}`, date: dayjs(selectedRecord.lastTunedAt).subtract(45, 'day').format('YYYY-MM-DD'), changes: '重构因子计算逻辑，优化特征工程', operator: selectedRecord.createdBy },
                  ]}
                  columns={[
                    { title: '版本', dataIndex: 'version', key: 'version', render: (v: string) => <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{v}</Tag> },
                    { title: '更新日期', dataIndex: 'date', key: 'date' },
                    { title: '变更内容', dataIndex: 'changes', key: 'changes' },
                    { title: '操作人', dataIndex: 'operator', key: 'operator' },
                  ]}
                  rowKey="version"
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
