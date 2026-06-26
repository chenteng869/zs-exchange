'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Rate } from 'antd';
import {
  LineChartOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  PauseCircleOutlined,
  DisconnectOutlined,
  DashboardOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface CopyPerformance {
  id: string;
  masterTraderName: string;
  followersCount: number;
  totalCopiedVolume: number;
  avgCopyRatio: number;
  masterReturn: number;
  avgFollowerReturn: number;
  alphaVsMaster: number;
  copyAccuracy: number;
  retentionRate: number;
  avgDurationDays: number;
  topSymbol: string;
  riskScore: number;
  status: 'active' | 'inactive' | 'suspended';
  sinceDate: string;
  rating: number;
}

const mockData: CopyPerformance[] = [
  { id: '1', masterTraderName: 'QuantKing', followersCount: 1256, totalCopiedVolume: 15800000, avgCopyRatio: 85, masterReturn: 42.5, avgFollowerReturn: 38.2, alphaVsMaster: -4.3, copyAccuracy: 92.5, retentionRate: 78.5, avgDurationDays: 120, topSymbol: 'BTC/USDT', riskScore: 4, status: 'active', sinceDate: '2023-06-15', rating: 4.8 },
  { id: '2', masterTraderName: 'AlphaTrader', followersCount: 892, totalCopiedVolume: 12500000, avgCopyRatio: 72, masterReturn: 35.8, avgFollowerReturn: 31.5, alphaVsMaster: -4.3, copyAccuracy: 88.2, retentionRate: 72.3, avgDurationDays: 95, topSymbol: 'ETH/USDT', riskScore: 5, status: 'active', sinceDate: '2023-08-22', rating: 4.6 },
  { id: '3', masterTraderName: 'CryptoWhale', followersCount: 2340, totalCopiedVolume: 28500000, avgCopyRatio: 65, masterReturn: 58.2, avgFollowerReturn: 45.8, alphaVsMaster: -12.4, copyAccuracy: 78.5, retentionRate: 65.2, avgDurationDays: 68, topSymbol: 'SOL/USDT', riskScore: 7, status: 'active', sinceDate: '2023-11-10', rating: 4.2 },
  { id: '4', masterTraderName: 'MomentumMaster', followersCount: 567, totalCopiedVolume: 8500000, avgCopyRatio: 90, masterReturn: 22.5, avgFollowerReturn: 20.1, alphaVsMaster: -2.4, copyAccuracy: 95.8, retentionRate: 85.6, avgDurationDays: 150, topSymbol: 'AVAX/USDT', riskScore: 3, status: 'active', sinceDate: '2024-01-05', rating: 4.9 },
  { id: '5', masterTraderName: 'DeFiGuru', followersCount: 423, totalCopiedVolume: 5200000, avgCopyRatio: 55, masterReturn: -5.2, avgFollowerReturn: -8.5, alphaVsMaster: -3.3, copyAccuracy: 82.3, retentionRate: 58.9, avgDurationDays: 45, topSymbol: 'LINK/USDT', riskScore: 8, status: 'suspended', sinceDate: '2024-02-18', rating: 2.8 },
  { id: '6', masterTraderName: 'SmartMoney', followersCount: 1890, totalCopiedVolume: 22000000, avgCopyRatio: 75, masterReturn: 28.9, avgFollowerReturn: 25.2, alphaVsMaster: -3.7, copyAccuracy: 87.5, retentionRate: 71.8, avgDurationDays: 88, topSymbol: 'DOGE/USDT', riskScore: 6, status: 'active', sinceDate: '2023-09-30', rating: 4.1 },
  { id: '7', masterTraderName: 'GridWizard', followersCount: 1567, totalCopiedVolume: 18500000, avgCopyRatio: 80, masterReturn: 15.5, avgFollowerReturn: 14.2, alphaVsMaster: -1.3, copyAccuracy: 94.2, retentionRate: 82.5, avgDurationDays: 180, topSymbol: 'MATIC/USDT', riskScore: 2, status: 'active', sinceDate: '2023-07-12', rating: 4.5 },
  { id: '8', masterTraderName: 'ArbitragePro', followersCount: 334, totalCopiedVolume: 4500000, avgCopyRatio: 95, masterReturn: 12.8, avgFollowerReturn: 11.5, alphaVsMaster: -1.3, copyAccuracy: 98.5, retentionRate: 92.3, avgDurationDays: 210, topSymbol: 'BNB/USDT', riskScore: 2, status: 'active', sinceDate: '2024-03-20', rating: 4.7 },
  { id: '9', masterTraderName: 'SentimentKing', followersCount: 678, totalCopiedVolume: 7200000, avgCopyRatio: 60, masterReturn: -12.5, avgFollowerReturn: -18.2, alphaVsMaster: -5.7, copyAccuracy: 72.5, retentionRate: 48.5, avgDurationDays: 32, topSymbol: 'ARB/USDT', riskScore: 9, status: 'inactive', sinceDate: '2024-04-08', rating: 1.8 },
  { id: '10', masterTraderName: 'AIAgent_001', followersCount: 2100, totalCopiedVolume: 32000000, avgCopyRatio: 88, masterReturn: 52.3, avgFollowerReturn: 48.5, alphaVsMaster: -3.8, copyAccuracy: 96.8, retentionRate: 88.9, avgDurationDays: 135, topSymbol: 'BTC/USDT', riskScore: 3, status: 'active', sinceDate: '2023-12-01', rating: 4.95 },
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: '#16A34A' },
  inactive: { label: '不活跃', color: '#9CA3AF' },
  suspended: { label: '已暂停', color: '#F59E0B' },
};

export default function CopyPerformancePage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPerf, setSelectedPerf] = useState<CopyPerformance | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (ratingFilter === 'high' && item.rating < 4) return false;
    if (ratingFilter === 'mid' && (item.rating < 3 || item.rating >= 4)) return false;
    if (ratingFilter === 'low' && item.rating >= 3) return false;
    if (riskFilter === 'low' && item.riskScore > 3) return false;
    if (riskFilter === 'mid' && (item.riskScore < 4 || item.riskScore > 6)) return false;
    if (riskFilter === 'high' && item.riskScore < 7) return false;
    return true;
  });

  const totalTraders = mockData.length;
  const totalFollowers = mockData.reduce((sum, i) => sum + i.followersCount, 0);
  const totalVolume = mockData.reduce((sum, i) => sum + i.totalCopiedVolume, 0);
  const avgFollowerReturn = (mockData.reduce((sum, i) => sum + i.avgFollowerReturn, 0) / mockData.length).toFixed(1);
  const highRatedCount = mockData.filter(i => i.rating >= 4).length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: CopyPerformance) => {
        setSelectedPerf(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'recommend',
      label: '推荐跟随',
      icon: <ThunderboltOutlined />,
      type: 'primary',
      hidden: (record: CopyPerformance) => record.status !== 'active',
      onClick: (record: CopyPerformance) => {
        message.success(`推荐用户跟随 "${record.masterTraderName}"`);
      },
    },
    {
      key: 'pause',
      label: '暂停',
      icon: <PauseCircleOutlined />,
      danger: true,
      hidden: (record: CopyPerformance) => record.status !== 'active',
      onClick: (record: CopyPerformance) => {
        message.warning(`暂停交易员 "${record.masterTraderName}" 的跟单服务`);
      },
    },
    {
      key: 'terminate',
      label: '解除关系',
      icon: <DisconnectOutlined />,
      danger: true,
      onClick: (record: CopyPerformance) => {
        message.error(`确认解除与 "${record.masterTraderName}" 的跟单关系？`);
      },
    },
  ];

  const columns = [
    {
      title: '交易员名',
      dataIndex: 'masterTraderName',
      key: 'masterTraderName',
      width: 140,
      render: (name: string) => <span className="font-semibold text-blue-600">{name}</span>,
    },
    {
      title: '跟随者数',
      dataIndex: 'followersCount',
      key: 'followersCount',
      width: 95,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '总跟随量$',
      dataIndex: 'totalCopiedVolume',
      key: 'totalCopiedVolume',
      width: 115,
      render: (val: number) => `$${(val / 1000000).toFixed(1)}M`,
    },
    {
      title: '平均复制比%',
      dataIndex: 'avgCopyRatio',
      key: 'avgCopyRatio',
      width: 105,
      render: (val: number) => `${val}%`,
    },
    {
      title: '交易员收益%',
      dataIndex: 'masterReturn',
      key: 'masterReturn',
      width: 110,
      render: (val: number) => (
        <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '跟随者均收%',
      dataIndex: 'avgFollowerReturn',
      key: 'avgFollowerReturn',
      width: 115,
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Alpha差%',
      dataIndex: 'alphaVsMaster',
      key: 'alphaVsMaster',
      width: 90,
      render: (val: number) => (
        <span className={`font-bold ${val > -5 ? 'text-orange-500' : 'text-red-600'}`}>
          {val > 0 ? '+' : ''}{val.toFixed(1)}
        </span>
      ),
    },
    {
      title: '复制精度%',
      dataIndex: 'copyAccuracy',
      key: 'copyAccuracy',
      width: 95,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 90 ? '#16A34A' : val >= 80 ? '#F59E0B' : '#DC2626'}
          format={() => `${val}%`}
        />
      ),
    },
    {
      title: '留存率%',
      dataIndex: 'retentionRate',
      key: 'retentionRate',
      width: 80,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: '平均天数',
      dataIndex: 'avgDurationDays',
      key: 'avgDurationDays',
      width: 90,
      render: (val: number) => `${val}天`,
    },
    {
      title: '最常标的',
      dataIndex: 'topSymbol',
      key: 'topSymbol',
      width: 110,
      render: (s: string) => <code>{s}</code>,
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
      render: (score: number) => (
        <Progress
          percent={score * 10}
          size="small"
          strokeColor={score <= 3 ? '#16A34A' : score <= 6 ? '#F59E0B' : '#DC2626'}
          format={() => `${score}/10`}
          status={score <= 3 ? 'normal' : score <= 6 ? 'exception' : 'exception'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color as any}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating: number) => (
        <span>
          <Rate disabled defaultValue={Math.floor(rating)} />{' '}
          <span className="font-bold">{rating.toFixed(1)}</span>
        </span>
      ),
    },
    {
      title: '加入日期',
      dataIndex: 'sinceDate',
      key: 'sinceDate',
      width: 110,
    },
  ];

  const mockFollowers = [
    { id: 1, user: 'user_0x1a2b', joinDate: '2024-03-15', volume: '$50,000', return: '+$8,500', duration: '98天' },
    { id: 2, user: 'user_0x3c4d', joinDate: '2024-04-02', volume: '$25,000', return: '+$3,200', duration: '82天' },
    { id: 3, user: 'user_0x5e6f', joinDate: '2024-05-10', volume: '$100,000', return: '+$18,200', duration: '44天' },
  ];

  const mockEvents = [
    { id: 1, time: '2024-06-23 14:30', event: '新用户开始跟随', detail: 'user_0x9i0j ($20,000)', type: 'info' },
    { id: 2, time: '2024-06-22 16:00', event: '月度报告生成', detail: '收益率+38.2%', type: 'success' },
    { id: 3, time: '2024-06-20 09:15', event: '风险预警触发', detail: '单日回撤超过5%', type: 'warning' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <LineChartOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">跟单绩效分析</h1>
            <p className="text-gray-500 text-sm mt-1">
              主交易员与跟随者双向绩效追踪 · 收益归因/跟随质量/关系健康度 · AIOPC匹配优化
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="主交易员总数"
              value={totalTraders}
              suffix="位"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总跟随者"
              value={(totalFollowers / 1000).toFixed(1)}
              suffix="K"
              icon={<UserOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总跟随资金"
              value={`${(totalVolume / 100000000).toFixed(1)}`}
              suffix="亿"
              prefix="$"
              icon={<DollarOutlined />}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="高评级(≥4星)"
              value={highRatedCount}
              suffix="位"
              icon={<TrophyOutlined />}
              color="#F0B90B"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select placeholder="状态" allowClear style={{ width: 110 }} value={statusFilter || undefined} onChange={setStatusFilter}>
              {Object.entries(statusMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
            </Select>
            <Select placeholder="评级" allowClear style={{ width: 110 }} value={ratingFilter || undefined} onChange={setRatingFilter}>
              <Select.Option value="high">≥4星</Select.Option>
              <Select.Option value="mid">3-4星</Select.Option>
              <Select.Option value="low">{'<3星'}</Select.Option>
            </Select>
            <Select placeholder="风险评分" allowClear style={{ width: 120 }} value={riskFilter || undefined} onChange={setRiskFilter}>
              <Select.Option value="low">低风险(1-3)</Select.Option>
              <Select.Option value="mid">中风险(4-6)</Select.Option>
              <Select.Option value="high">高风险(7-10)</Select.Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情 Modal */}
        <Modal
          title={`交易员画像 - ${selectedPerf?.masterTraderName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={860}
        >
          {selectedPerf && (
            <div className="space-y-6">
              {/* 交易员基本信息 */}
              <Descriptions title="交易员画像" bordered column={2} size="small">
                <Descriptions.Item label="交易员名称" span={2}>
                  <span className="text-xl font-bold text-blue-600">{selectedPerf.masterTraderName}</span>
                  {' '}<Rate disabled defaultValue={selectedPerf.rating} allowHalf style={{ fontSize: 16 }} />
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[selectedPerf.status]?.color as any}>{statusMap[selectedPerf.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="加入日期">{selectedPerf.sinceDate}</Descriptions.Item>
                <Descriptions.Item label="跟随者数量">
                  <span className="font-bold text-lg">{selectedPerf.followersCount.toLocaleString()}</span> 人
                </Descriptions.Item>
                <Descriptions.Item label="总跟随量">${(selectedPerf.totalCopiedVolume / 1000000).toFixed(1)}M</Descriptions.Item>
                <Descriptions.Item label="平均复制比例">{selectedPerf.avgCopyRatio}%</Descriptions.Item>
                <Descriptions.Item label="最常交易标的"><code>{selectedPerf.topSymbol}</code></Descriptions.Item>
                <Descriptions.Item label="平均跟随时长">{selectedPerf.avgDurationDays} 天</Descriptions.Item>
                <Descriptions.Item label="风险评分">
                  <Progress
                    percent={selectedPerf.riskScore * 10}
                    size="small"
                    strokeColor={selectedPerf.riskScore <= 3 ? '#16A34A' : selectedPerf.riskScore <= 6 ? '#F59E0B' : '#DC2626'}
                    format={() => `${selectedPerf.riskScore}/10`}
                  />
                </Descriptions.Item>
              </Descriptions>

              {/* 绩效对比表 */}
              <Card title="绩效对比：交易员 vs 跟随者" size="small">
                <Table
                  dataSource={[
                    { metric: '总收益率', trader: `${selectedPerf.masterReturn >= 0 ? '+' : ''}${selectedPerf.masterReturn}%`, follower: `${selectedPerf.avgFollowerReturn >= 0 ? '+' : ''}${selectedPerf.avgFollowerReturn}%`, diff: `${selectedPerf.alphaVsMaster > 0 ? '+' : ''}${selectedPerf.alphaVsMaster}%` },
                    { metric: '复制精度', trader: '-', follower: `${selectedPerf.copyAccuracy}%`, diff: '-' },
                    { metric: '留存率', trader: '-', follower: `${selectedPerf.retentionRate}%`, diff: '-' },
                  ]}
                  rowKey="metric"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '指标', dataIndex: 'metric' },
                    { title: '主交易员', dataIndex: 'trader', render: (t: string) => t !== '-' ? <span className={t.includes('+') ? 'text-green-600 font-bold' : t.includes('-') && !t.startsWith('-') ? 'text-red-600 font-bold' : ''}>{t}</span> : '-' },
                    { title: '跟随者均值', dataIndex: 'follower', render: (f: string) => f !== '-' ? <span className={f.includes('+') ? 'text-green-600' : ''}>{f}</span> : '-' },
                    { title: '差值', dataIndex: 'diff', render: (d: string) => d !== '-' ? <span className={d.startsWith('+') || d.startsWith('0') ? 'text-green-600' : 'text-red-600'}>{d}</span> : '-' },
                  ]}
                />
              </Card>

              {/* AIOPC匹配质量 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC匹配质量评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '收益一致性', score: Math.max(40, 100 - Math.abs(selectedPerf.alphaVsMaster) * 5), color: '#1677FF' },
                    { label: '风险匹配度', score: Math.max(30, 100 - selectedPerf.riskScore * 7), color: '#16A34A' },
                    { label: '复制精度', score: selectedPerf.copyAccuracy, color: '#F59E0B' },
                    { label: '互动频率', score: selectedPerf.avgDurationDays > 60 ? 88 : 65, color: '#7C3AED' },
                    { label: '长期价值', score: selectedPerf.retentionRate > 70 ? 92 : 68, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={item.score}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 跟随者列表 */}
              <Table
                dataSource={mockFollowers}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><UserOutlined /> 跟随者列表 (Top 3)</span>}
                columns={[
                  { title: '用户', dataIndex: 'user', render: (u: string) => <code>{u}</code>, width: 130 },
                  { title: '加入日期', dataIndex: 'joinDate', width: 110 },
                  { title: '跟随金额', dataIndex: 'volume' },
                  { title: '收益', dataIndex: 'return', render: (r: string) => <span className="text-green-600 font-semibold">{r}</span> },
                  { title: '跟随时长', dataIndex: 'duration', width: 90 },
                ]}
              />

              {/* 关系事件日志 */}
              <Table
                dataSource={mockEvents}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span>关系事件日志</span>}
                columns={[
                  { title: '时间', dataIndex: 'time', width: 155 },
                  { title: '事件', dataIndex: 'event' },
                  { title: '详情', dataIndex: 'detail', ellipsis: true },
                  { title: '类型', dataIndex: 'type', width: 80, render: (t: string) => t === 'success' ? <Tag color="success">成功</Tag> : t === 'warning' ? <Tag color="warning"><WarningOutlined /> 警告</Tag> : <Tag color="processing">信息</Tag> },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
