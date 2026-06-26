'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Select,
  Table,
  Card,
  Progress,
  Tooltip,
  Divider,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExportOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface SettlementRecord {
  id: string;
  settlementPeriod: string;
  partnerId: string;
  partnerName: string;
  productId: string;
  productName: string;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  adjustments: number;
  netPayable: number;
  status: 'pending_review' | 'approved' | 'paid' | 'disputed';
  processedBy: string;
  paidDate: string;
  notes: string;
  invoiceId: string;
}

const mockSettlements: SettlementRecord[] = [
  {
    id: 'STL-001',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-1',
    partnerName: 'Alpha Capital Partners',
    productId: 'PRD-ALPHA-001',
    productName: 'Alpha动量信号V3',
    grossRevenue: 2850000,
    commissionRate: 25,
    commissionAmount: 712500,
    adjustments: -15000,
    netPayable: 697500,
    status: 'paid',
    processedBy: 'finance_team',
    paidDate: '2024-07-15',
    notes: '季度达标奖励已包含',
    invoiceId: 'INV-2024Q2-001',
  },
  {
    id: 'STL-002',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-4',
    partnerName: 'QuantEdge 白标方案',
    productId: 'PRD-RISK-009',
    productName: '机构级风控系统',
    grossRevenue: 6800000,
    commissionRate: 15,
    commissionAmount: 1020000,
    adjustments: 25000,
    netPayable: 1045000,
    status: 'approved',
    processedBy: 'finance_team',
    paidDate: '',
    notes: '大客户折扣调整',
    invoiceId: 'INV-2024Q2-002',
  },
  {
    id: 'STL-003',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-2',
    partnerName: 'CryptoKOL 小明',
    productId: 'PRD-TREND-005',
    productName: '趋势跟踪基础版',
    grossRevenue: 1450000,
    commissionRate: 30,
    commissionAmount: 435000,
    adjustments: 0,
    netPayable: 435000,
    status: 'pending_review',
    processedBy: '',
    paidDate: '',
    notes: '待审核佣金计算明细',
    invoiceId: 'INV-2024Q2-003',
  },
  {
    id: 'STL-004',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-3',
    partnerName: 'TradeFlow IB Services',
    productId: 'PRD-ARB-002',
    productName: '量化套利基金Pro',
    grossRevenue: 3200000,
    commissionRate: 20,
    commissionAmount: 640000,
    adjustments: -8000,
    netPayable: 632000,
    status: 'disputed',
    processedBy: 'finance_team',
    paidDate: '',
    notes: '伙伴对交易量统计有异议',
    invoiceId: 'INV-2024Q2-004',
  },
  {
    id: 'STL-005',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-8',
    partnerName: '中东财富管理集团',
    productId: 'PRD-AI-004',
    productName: 'AI智能投顾账户',
    grossRevenue: 4200000,
    commissionRate: 24,
    commissionAmount: 1008000,
    adjustments: 12000,
    netPayable: 1020000,
    status: 'approved',
    processedBy: 'finance_manager',
    paidDate: '',
    notes: '汇率调整已确认',
    invoiceId: 'INV-2024Q2-005',
  },
  {
    id: 'STL-006',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-5',
    partnerName: '东南亚交易联盟',
    productId: 'PRD-GRID-003',
    productName: '网格交易入门版',
    grossRevenue: 920000,
    commissionRate: 22,
    commissionAmount: 202400,
    adjustments: 0,
    netPayable: 202400,
    status: 'paid',
    processedBy: 'auto_system',
    paidDate: '2024-07-10',
    notes: '自动结算，无异常',
    invoiceId: 'INV-2024Q2-006',
  },
  {
    id: 'STL-007',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-9',
    partnerName: '日本加密货币协会',
    productId: 'PRD-MM-006',
    productName: '做市商专用工具包',
    grossRevenue: 1850000,
    commissionRate: 20,
    commissionAmount: 370000,
    adjustments: -5200,
    netPayable: 364800,
    status: 'pending_review',
    processedBy: '',
    paidDate: '',
    notes: '待确认税务文件',
    invoiceId: 'INV-2024Q2-007',
  },
  {
    id: 'STL-008',
    settlementPeriod: '2024-Q1',
    partnerId: 'PTN-1',
    partnerName: 'Alpha Capital Partners',
    productId: 'PRD-ALPHA-001',
    productName: 'Alpha动量信号V3',
    grossRevenue: 2420000,
    commissionRate: 25,
    commissionAmount: 605000,
    adjustments: -10000,
    netPayable: 595000,
    status: 'paid',
    processedBy: 'finance_team',
    paidDate: '2024-04-15',
    notes: 'Q1正常结算',
    invoiceId: 'INV-2024Q1-001',
  },
  {
    id: 'STL-009',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-6',
    partnerName: 'DeFi达人老王',
    productId: 'PRD-VOL-007',
    productName: '波动率套利信号',
    grossRevenue: 1200000,
    commissionRate: 28,
    commissionAmount: 336000,
    adjustments: 8500,
    netPayable: 344500,
    status: 'disputed',
    processedBy: 'finance_team',
    paidDate: '',
    notes: '账户暂停期间佣金争议',
    invoiceId: 'INV-2024Q2-009',
  },
  {
    id: 'STL-010',
    settlementPeriod: '2024-Q2',
    partnerId: 'PTN-7',
    partnerName: 'EuroTrade IB Network',
    productId: 'PRD-DEFI-008',
    productName: 'DeFi收益聚合器',
    grossRevenue: 350000,
    commissionRate: 18,
    commissionAmount: 63000,
    adjustments: 0,
    netPayable: 63000,
    status: 'pending_review',
    processedBy: '',
    paidDate: '',
    notes: '新伙伴首期结算',
    invoiceId: 'INV-2024Q2-010',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_review: { label: '待审核', color: 'default' },
  approved: { label: '已批准', color: 'processing' },
  paid: { label: '已支付', color: 'success' },
  disputed: { label: '有争议', color: 'error' },
};

export default function DistributionSettlementPage() {
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPartner, setFilterPartner] = useState<string>('');

  const filteredSettlements = mockSettlements.filter((record) => {
    if (filterPeriod && record.settlementPeriod !== filterPeriod) return false;
    if (filterStatus && record.status !== filterStatus) return false;
    if (filterPartner && !record.partnerName.includes(filterPartner)) return false;
    return true;
  });

  const totalRecords = mockSettlements.length;
  const totalPayable = mockSettlements.reduce((sum, r) => sum + r.netPayable, 0);
  const paidAmount = mockSettlements
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.netPayable, 0);
  const disputedCount = mockSettlements.filter((r) => r.status === 'disputed').length;
  const avgProcessingDays = 5.2;

  const columns = [
    {
      title: '结算期间',
      dataIndex: 'settlementPeriod',
      key: 'settlementPeriod',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '合作伙伴',
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (text: string) => <span className="text-blue-600">{text}</span>,
    },
    {
      title: '产品',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '毛收入',
      dataIndex: 'grossRevenue',
      key: 'grossRevenue',
      render: (val: number) => `$${(val / 1000).toFixed(0)}K`,
    },
    {
      title: '佣金率%',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (val: number) => <span className="font-semibold text-green-600">{val}%</span>,
    },
    {
      title: '佣金金额',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      render: (val: number) => `$${(val / 1000).toFixed(1)}K`,
    },
    {
      title: '调整',
      dataIndex: 'adjustments',
      key: 'adjustments',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#16A34A' : '#DC2626' }}>
          {val >= 0 ? '+' : ''}${(val / 1000).toFixed(1)}K
        </span>
      ),
    },
    {
      title: '应付净额',
      dataIndex: 'netPayable',
      key: 'netPayable',
      render: (val: number) => <span className="font-bold text-blue-600">${(val / 1000).toFixed(1)}K</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>
      ),
    },
    { title: '处理人', dataIndex: 'processedBy', key: 'processedBy' },
    {
      title: '支付日期',
      dataIndex: 'paidDate',
      key: 'paidDate',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '发票号',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (val: string) => <code className="text-xs">{val}</code>,
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: SettlementRecord) => {
        setSelectedSettlement(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'approve',
      label: '审核通过',
      icon: <CheckCircleOutlined />,
      hidden: (record: SettlementRecord) => record.status !== 'pending_review',
      onClick: (record: SettlementRecord) => {
        message.success(`结算 ${record.id} 已审核通过`);
      },
    },
    {
      key: 'dispute',
      label: '标记争议',
      icon: <WarningOutlined />,
      hidden: (record: SettlementRecord) =>
        record.status === 'paid' || record.status === 'disputed',
      onClick: (record: SettlementRecord) => {
        message.warning(`结算 ${record.id} 已标记为争议`);
      },
    },
    {
      key: 'export',
      label: '导出',
      icon: <ExportOutlined />,
      onClick: (record: SettlementRecord) => {
        message.success(`已导出结算单: ${record.invoiceId}`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <DollarOutlined style={{ color: '#F0B90B' }} />
              分销结算中心
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              自动化佣金结算系统 · 计算/审核/支付/对账 · AIOPC异常检测
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              新建结算
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="本期结算笔数"
            value={totalRecords}
            icon={<FileTextOutlined />}
            color="#1677FF"
            description="全部结算记录"
          />
          <DataCard
            title="应付总额"
            value={`${(totalPayable / 1000000).toFixed(1)}M`}
            prefix="$"
            icon={<DollarOutlined />}
            color="#16A34A"
            description="本期总金额"
          />
          <DataCard
            title="已付/待付"
            value={`${(paidAmount / 1000000).toFixed(1)}M`}
            prefix="$"
            suffix={`/${(totalPayable / 1000000).toFixed(1)}M`}
            icon={<CheckCircleOutlined />}
            color="#7C3AED"
            description="支付进度"
          />
          <DataCard
            title="争议笔数"
            value={disputedCount}
            icon={<AlertOutlined />}
            color="#DC2626"
            description="需人工处理"
          />
          <DataCard
            title="平均处理天数"
            value={`${avgProcessingDays}`}
            suffix="天"
            icon={<ClockCircleOutlined />}
            color="#F59E0B"
            description="结算效率指标"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select
              placeholder="结算周期"
              style={{ width: 140 }}
              allowClear
              value={filterPeriod || undefined}
              onChange={setFilterPeriod}
            >
              <Option value="2024-Q2">2024 Q2</Option>
              <Option value="2024-Q1">2024 Q1</Option>
              <Option value="2024-M6">2024年6月</Option>
              <Option value="2024-M5">2024年5月</Option>
            </Select>
            <Select
              placeholder="状态"
              style={{ width: 130 }}
              allowClear
              value={filterStatus || undefined}
              onChange={setFilterStatus}
            >
              <Option value="pending_review">待审核</Option>
              <Option value="approved">已批准</Option>
              <Option value="paid">已支付</Option>
              <Option value="disputed">有争议</Option>
            </Select>
            <Select
              placeholder="合作伙伴"
              style={{ width: 200 }}
              allowClear
              showSearch
              value={filterPartner || undefined}
              onChange={setFilterPartner}
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {Array.from(new Set(mockSettlements.map((s) => s.partnerName))).map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredSettlements as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              结算详情 - <span style={{ color: '#F0B90B' }}>{selectedSettlement?.id}</span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>,
            <Button key="export" icon={<ExportOutlined />}>导出PDF</Button>,
          ]}
          width={860}
        >
          {selectedSettlement && (
            <div className="space-y-6">
              {/* 结算明细 */}
              <Divider orientation="left">结算明细</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="结算ID">
                  <code className="font-mono">{selectedSettlement.id}</code>
                </Descriptions.Item>
                <Descriptions.Item label="结算期间">{selectedSettlement.settlementPeriod}</Descriptions.Item>
                <Descriptions.Item label="合作伙伴">{selectedSettlement.partnerName}</Descriptions.Item>
                <Descriptions.Item label="产品名称">{selectedSettlement.productName}</Descriptions.Item>
                <Descriptions.Item label="发票编号">
                  <code className="font-mono">{selectedSettlement.invoiceId}</code>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusConfig[selectedSettlement.status]?.color}>
                    {statusConfig[selectedSettlement.status]?.label}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* 收入构成 */}
              <Divider orientation="left">收入构成</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full" size="middle">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>毛收入 (Gross Revenue)</span>
                    <span className="font-bold">${selectedSettlement.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>基础佣金 ({selectedSettlement.commissionRate}%)</span>
                    <span className="font-bold text-green-600">
                      ${selectedSettlement.commissionAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded" style={{ background: selectedSettlement.adjustments >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
                    <span>调整项</span>
                    <span
                      className="font-bold"
                      style={{ color: selectedSettlement.adjustments >= 0 ? '#16A34A' : '#DC2626' }}
                    >
                      {selectedSettlement.adjustments >= 0 ? '+' : ''}${selectedSettlement.adjustments.toLocaleString()}
                    </span>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-bold text-lg">应付净额 (Net Payable)</span>
                    <span className="font-bold text-xl text-blue-600">
                      ${selectedSettlement.netPayable.toLocaleString()}
                    </span>
                  </div>
                </Space>
              </Card>

              {/* AIOPC异常标记 */}
              <Divider orientation="left">
                <SafetyCertificateOutlined style={{ color: '#F0B90B' }} /> AIOPC异常检测
              </Divider>
              <Card
                size="small"
                style={{
                  background:
                    selectedSettlement.status === 'disputed'
                      ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)'
                      : selectedSettlement.status === 'pending_review'
                      ? 'linear-gradient(135deg, #FFFBEB 0%, #FFFEF5 100%)'
                      : 'linear-gradient(135deg, #F0FDF4 0%, #F5FFFA 100%)',
                  borderColor:
                    selectedSettlement.status === 'disputed'
                      ? '#DC2626'
                      : selectedSettlement.status === 'pending_review'
                      ? '#F59E0B'
                      : '#16A34A',
                }}
              >
                <Space direction="vertical" size="small" className="w-full">
                  <div className="flex gap-3">
                    <SafetyCertificateOutlined
                      style={{
                        fontSize: 20,
                        color:
                          selectedSettlement.status === 'disputed'
                            ? '#DC2626'
                            : selectedSettlement.status === 'pending_review'
                            ? '#F59E0B'
                            : '#16A34A',
                      }}
                    />
                    <div>
                      <div className="font-semibold">
                        检测结果:{' '}
                        {selectedSettlement.status === 'disputed'
                          ? '发现异常'
                          : selectedSettlement.status === 'pending_review'
                          ? '待人工复核'
                          : '正常'}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedSettlement.status === 'disputed'
                          ? `异常原因: ${selectedSettlement.notes}`
                          : selectedSettlement.status === 'pending_review'
                          ? '系统自动计算已完成，等待财务团队最终审核确认'
                          : '所有数据校验通过，无异常标记'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">数据完整性</div>
                      <div className="font-bold text-green-600">100%</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">计算准确度</div>
                      <div className="font-bold text-green-600">99.8%</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded">
                      <div className="text-xs text-gray-500">合规检查</div>
                      <div
                        className="font-bold"
                        style={{
                          color: selectedSettlement.status === 'disputed' ? '#DC2626' : '#16A34A',
                        }}
                      >
                        {selectedSettlement.status === 'disputed' ? '需复查' : '通过'}
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* 历史结算记录 */}
              <Divider orientation="left">历史结算记录</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { period: '2024-Q2', amount: selectedSettlement.netPayable, status: selectedSettlement.status, date: '2024-07-01' },
                  { period: '2024-Q1', amount: Math.round(selectedSettlement.netPayable * 0.85), status: 'paid', date: '2024-04-01' },
                  { period: '2023-Q4', amount: Math.round(selectedSettlement.netPayable * 0.78), status: 'paid', date: '2024-01-01' },
                ]}
                columns={[
                  { title: '结算周期', dataIndex: 'period', key: 'period' },
                  { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `$${v.toLocaleString()}` },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (val: string) => <Tag color={statusConfig[val]?.color}>{statusConfig[val]?.label}</Tag>,
                  },
                  { title: '日期', dataIndex: 'date', key: 'date' },
                ]}
                rowKey="period"
              />

              {/* 操作日志 */}
              <Divider orientation="left">操作日志</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { time: '2024-06-28 14:30', action: '生成结算单', operator: 'system', detail: '自动计算完成' },
                  { time: '2024-06-29 09:15', action: '数据核对', operator: 'finance_bot', detail: '交易数据与平台一致' },
                  ...(selectedSettlement.processedBy
                    ? [{ time: '2024-07-01 11:00', action: selectedSettlement.status, operator: selectedSettlement.processedBy, detail: selectedSettlement.notes }]
                    : []),
                ].filter(Boolean)}
                columns={[
                  { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
                  { title: '操作', dataIndex: 'action', key: 'action' },
                  { title: '操作人', dataIndex: 'operator', key: 'operator' },
                  { title: '详情', dataIndex: 'detail', key: 'detail' },
                ]}
                rowKey="time"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
