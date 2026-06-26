'use client';

import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Modal,
  Descriptions,
  message,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Tabs,
  Statistic,
  Divider,
  Alert,
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PieChartOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  AccountBookOutlined,
  GlobalOutlined,
  LinkOutlined,
  BlockOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { SafeECharts } from '@/components/admin/SafeECharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface ProfitRecord {
  id: string;
  orderId: string;
  userName: string;
  channelId: string;
  channelName: string;
  channelLevel: string;
  orderAmount: number;
  profitAmount: number;
  platformProfit: number;
  channelProfit: number;
  fundProfit: number;
  profitTime: string;
  status: 'settled' | 'pending' | 'paid' | 'frozen';
}

const mockProfitData: ProfitRecord[] = [
  {
    id: 'FR202606250001',
    orderId: 'FJ202606250001',
    userName: '张三',
    channelId: 'QD001',
    channelName: '王建国',
    channelLevel: '一级渠道',
    orderAmount: 738,
    profitAmount: 295.2,
    platformProfit: 118.08,
    channelProfit: 88.56,
    fundProfit: 88.56,
    profitTime: '2026-06-25 14:32:18',
    status: 'settled',
  },
  {
    id: 'FR202606250002',
    orderId: 'FJ202606250002',
    userName: '李四',
    channelId: 'QD002',
    channelName: '李明华',
    channelLevel: '二级渠道',
    orderAmount: 699,
    profitAmount: 279.6,
    platformProfit: 111.84,
    channelProfit: 83.88,
    fundProfit: 83.88,
    profitTime: '2026-06-25 13:15:42',
    status: 'pending',
  },
  {
    id: 'FR202606250003',
    orderId: 'FJ202606250003',
    userName: '王五',
    channelId: 'QD003',
    channelName: '张伟强',
    channelLevel: '一级渠道',
    orderAmount: 399,
    profitAmount: 159.6,
    platformProfit: 63.84,
    channelProfit: 47.88,
    fundProfit: 47.88,
    profitTime: '2026-06-25 11:08:26',
    status: 'paid',
  },
  {
    id: 'FR202606240001',
    orderId: 'FJ202606240001',
    userName: '赵六',
    channelId: 'QD001',
    channelName: '王建国',
    channelLevel: '一级渠道',
    orderAmount: 1288,
    profitAmount: 515.2,
    platformProfit: 206.08,
    channelProfit: 154.56,
    fundProfit: 154.56,
    profitTime: '2026-06-24 16:45:33',
    status: 'settled',
  },
  {
    id: 'FR202606240002',
    orderId: 'FJ202606240002',
    userName: '钱七',
    channelId: 'QD004',
    channelName: '陈秀英',
    channelLevel: '三级渠道',
    orderAmount: 299,
    profitAmount: 119.6,
    platformProfit: 47.84,
    channelProfit: 35.88,
    fundProfit: 35.88,
    profitTime: '2026-06-24 15:20:11',
    status: 'frozen',
  },
  {
    id: 'FR202606240003',
    orderId: 'FJ202606240003',
    userName: '孙八',
    channelId: 'QD002',
    channelName: '李明华',
    channelLevel: '二级渠道',
    orderAmount: 899,
    profitAmount: 359.6,
    platformProfit: 143.84,
    channelProfit: 107.88,
    fundProfit: 107.88,
    profitTime: '2026-06-24 10:55:47',
    status: 'pending',
  },
  {
    id: 'FR202606230001',
    orderId: 'FJ202606230001',
    userName: '周九',
    channelId: 'QD005',
    channelName: '刘德福',
    channelLevel: '一级渠道',
    orderAmount: 1588,
    profitAmount: 635.2,
    platformProfit: 254.08,
    channelProfit: 190.56,
    fundProfit: 190.56,
    profitTime: '2026-06-23 17:30:22',
    status: 'settled',
  },
  {
    id: 'FR202606230002',
    orderId: 'FJ202606230002',
    userName: '吴十',
    channelId: 'QD003',
    channelName: '张伟强',
    channelLevel: '一级渠道',
    orderAmount: 568,
    profitAmount: 227.2,
    platformProfit: 90.88,
    channelProfit: 68.16,
    fundProfit: 68.16,
    profitTime: '2026-06-23 14:12:09',
    status: 'paid',
  },
  {
    id: 'FR202606230003',
    orderId: 'FJ202606230003',
    userName: '郑十一',
    channelId: 'QD006',
    channelName: '黄丽华',
    channelLevel: '二级渠道',
    orderAmount: 459,
    profitAmount: 183.6,
    platformProfit: 73.44,
    channelProfit: 55.08,
    fundProfit: 55.08,
    profitTime: '2026-06-23 09:45:56',
    status: 'pending',
  },
  {
    id: 'FR202606220001',
    orderId: 'FJ202606220001',
    userName: '冯十二',
    channelId: 'QD001',
    channelName: '王建国',
    channelLevel: '一级渠道',
    orderAmount: 999,
    profitAmount: 399.6,
    platformProfit: 159.84,
    channelProfit: 119.88,
    fundProfit: 119.88,
    profitTime: '2026-06-22 16:28:34',
    status: 'settled',
  },
  {
    id: 'FR202606220002',
    orderId: 'FJ202606220002',
    userName: '陈十三',
    channelId: 'QD004',
    channelName: '陈秀英',
    channelLevel: '三级渠道',
    orderAmount: 358,
    profitAmount: 143.2,
    platformProfit: 57.28,
    channelProfit: 42.96,
    fundProfit: 42.96,
    profitTime: '2026-06-22 13:55:18',
    status: 'settled',
  },
  {
    id: 'FR202606220003',
    orderId: 'FJ202606220003',
    userName: '褚十四',
    channelId: 'QD007',
    channelName: '林志强',
    channelLevel: '一级渠道',
    orderAmount: 1888,
    profitAmount: 755.2,
    platformProfit: 302.08,
    channelProfit: 226.56,
    fundProfit: 226.56,
    profitTime: '2026-06-22 11:30:42',
    status: 'paid',
  },
  {
    id: 'FR202606210001',
    orderId: 'FJ202606210001',
    userName: '卫十五',
    channelId: 'QD002',
    channelName: '李明华',
    channelLevel: '二级渠道',
    orderAmount: 688,
    profitAmount: 275.2,
    platformProfit: 110.08,
    channelProfit: 82.56,
    fundProfit: 82.56,
    profitTime: '2026-06-21 15:42:07',
    status: 'frozen',
  },
  {
    id: 'FR202606210002',
    orderId: 'FJ202606210002',
    userName: '蒋十六',
    channelId: 'QD005',
    channelName: '刘德福',
    channelLevel: '一级渠道',
    orderAmount: 1199,
    profitAmount: 479.6,
    platformProfit: 191.84,
    channelProfit: 143.88,
    fundProfit: 143.88,
    profitTime: '2026-06-21 10:18:53',
    status: 'pending',
  },
  {
    id: 'FR202606200001',
    orderId: 'FJ202606200001',
    userName: '沈十七',
    channelId: 'QD003',
    channelName: '张伟强',
    channelLevel: '一级渠道',
    orderAmount: 768,
    profitAmount: 307.2,
    platformProfit: 122.88,
    channelProfit: 92.16,
    fundProfit: 92.16,
    profitTime: '2026-06-20 14:05:31',
    status: 'settled',
  },
];

const statusMap: Record<string, { color: string; text: string }> = {
  settled: { color: 'green', text: '已结算' },
  pending: { color: 'orange', text: '待结算' },
  paid: { color: 'blue', text: '已发放' },
  frozen: { color: 'red', text: '已冻结' },
};

// 链上订单数据
interface OnChainOrder {
  orderId: number;
  buyer: string;
  referrer: string;
  priceTier: number;
  productCost: number;
  aiopcCommission: number;
  profitPoolTotal: number;
  zsVentureShare: number;
  overseasCryptoShare: number;
  businessSchoolShare: number;
  techTeamShare: number;
  operationsShare: number;
  affairsDeptShare: number;
  referrerShare: number;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

const mockOnChainOrders: OnChainOrder[] = [
  {
    orderId: 1,
    buyer: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB12',
    referrer: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
    priceTier: 369,
    productCost: 147.6,
    aiopcCommission: 110.7,
    profitPoolTotal: 110.7,
    zsVentureShare: 50.32,
    overseasCryptoShare: 21.13,
    businessSchoolShare: 12.08,
    techTeamShare: 12.08,
    operationsShare: 8.04,
    affairsDeptShare: 4.03,
    referrerShare: 3.02,
    txHash: '0x8f7a8b9c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a',
    blockNumber: 12345678,
    timestamp: '2026-06-25 15:42:18',
    status: 'success',
  },
  {
    orderId: 2,
    buyer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    referrer: '0x0000000000000000000000000000000000000000',
    priceTier: 699,
    productCost: 279.6,
    aiopcCommission: 209.7,
    profitPoolTotal: 209.7,
    zsVentureShare: 95.27,
    overseasCryptoShare: 40.02,
    businessSchoolShare: 22.86,
    techTeamShare: 22.86,
    operationsShare: 15.24,
    affairsDeptShare: 10.33,
    referrerShare: 5.71,
    txHash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
    blockNumber: 12345690,
    timestamp: '2026-06-25 16:15:42',
    status: 'success',
  },
  {
    orderId: 3,
    buyer: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    referrer: '0x742d35Cc6634C0532925a3b844Bc9e7595f5bB12',
    priceTier: 369,
    productCost: 147.6,
    aiopcCommission: 110.7,
    profitPoolTotal: 110.7,
    zsVentureShare: 50.32,
    overseasCryptoShare: 21.13,
    businessSchoolShare: 12.08,
    techTeamShare: 12.08,
    operationsShare: 8.04,
    affairsDeptShare: 4.03,
    referrerShare: 3.02,
    txHash: '0x3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
    blockNumber: 12345720,
    timestamp: '2026-06-25 17:08:55',
    status: 'success',
  },
  {
    orderId: 4,
    buyer: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    referrer: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    priceTier: 699,
    productCost: 279.6,
    aiopcCommission: 209.7,
    profitPoolTotal: 209.7,
    zsVentureShare: 95.27,
    overseasCryptoShare: 40.02,
    businessSchoolShare: 22.86,
    techTeamShare: 22.86,
    operationsShare: 15.24,
    affairsDeptShare: 10.33,
    referrerShare: 5.71,
    txHash: '0x7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d',
    blockNumber: 12345750,
    timestamp: '2026-06-25 18:22:30',
    status: 'success',
  },
  {
    orderId: 5,
    buyer: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    referrer: '0x0000000000000000000000000000000000000000',
    priceTier: 369,
    productCost: 147.6,
    aiopcCommission: 110.7,
    profitPoolTotal: 110.7,
    zsVentureShare: 50.32,
    overseasCryptoShare: 21.13,
    businessSchoolShare: 12.08,
    techTeamShare: 12.08,
    operationsShare: 8.04,
    affairsDeptShare: 7.05,
    referrerShare: 0,
    txHash: '0x1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f',
    blockNumber: 12345780,
    timestamp: '2026-06-25 19:45:12',
    status: 'success',
  },
];

export default function FujianProfitsPage() {
  const [activeTab, setActiveTab] = useState<string>('offchain');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ProfitRecord | null>(null);
  const [onChainDetailVisible, setOnChainDetailVisible] = useState(false);
  const [currentOnChainOrder, setCurrentOnChainOrder] = useState<OnChainOrder | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [dataList, setDataList] = useState<ProfitRecord[]>(mockProfitData);
  const [onChainSearchText, setOnChainSearchText] = useState('');

  const totalProfit = mockProfitData.reduce((sum, item) => sum + item.profitAmount, 0);
  const settledProfit = mockProfitData.filter(item => item.status === 'settled').reduce((sum, item) => sum + item.profitAmount, 0);
  const pendingProfit = mockProfitData.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.profitAmount, 0);
  const paidProfit = mockProfitData.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.profitAmount, 0);

  const todayProfit = mockProfitData.filter(item => item.profitTime.startsWith('2026-06-25')).reduce((sum, item) => sum + item.profitAmount, 0);
  const monthProfit = mockProfitData.filter(item => item.profitTime.startsWith('2026-06')).reduce((sum, item) => sum + item.profitAmount, 0);

  // 链上订单统计
  const totalOnChainOrders = mockOnChainOrders.length;
  const totalOnChainVolume = mockOnChainOrders.reduce((sum, item) => sum + item.priceTier, 0);
  const totalOnChainProfitPool = mockOnChainOrders.reduce((sum, item) => sum + item.profitPoolTotal, 0);
  const totalOnChainReferrerRewards = mockOnChainOrders.reduce((sum, item) => sum + item.referrerShare, 0);

  const filteredOnChainOrders = useMemo(() => {
    return mockOnChainOrders.filter(item => {
      const matchSearch = !onChainSearchText ||
        item.orderId.toString().includes(onChainSearchText) ||
        item.buyer.toLowerCase().includes(onChainSearchText.toLowerCase()) ||
        item.txHash.toLowerCase().includes(onChainSearchText.toLowerCase());
      return matchSearch;
    });
  }, [onChainSearchText]);

  const handleViewOnChainDetail = (record: OnChainOrder) => {
    setCurrentOnChainOrder(record);
    setOnChainDetailVisible(true);
  };

  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch = !searchText || 
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.orderId.toLowerCase().includes(searchText.toLowerCase()) ||
        item.userName.includes(searchText) ||
        item.channelName.includes(searchText);
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchChannel = !channelFilter || item.channelLevel === channelFilter;
      return matchSearch && matchStatus && matchChannel;
    });
  }, [dataList, searchText, statusFilter, channelFilter]);

  const handleViewDetail = (record: ProfitRecord) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleManualSettle = (record: ProfitRecord) => {
    Modal.confirm({
      title: '手动结算确认',
      content: `确定要对分润记录 ${record.id} 进行手动结算吗？`,
      okText: '确认结算',
      cancelText: '取消',
      onOk: () => {
        setDataList(prev => 
          prev.map(item => 
            item.id === record.id ? { ...item, status: 'settled' as const } : item
          )
        );
        message.success('结算成功');
      },
    });
  };

  const handleBatchSettle = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要结算的分润记录');
      return;
    }
    Modal.confirm({
      title: '批量结算确认',
      content: `确定要对选中的 ${selectedRowKeys.length} 条分润记录进行批量结算吗？`,
      okText: '确认结算',
      cancelText: '取消',
      onOk: () => {
        setDataList(prev =>
          prev.map(item =>
            selectedRowKeys.includes(item.id) && item.status === 'pending'
              ? { ...item, status: 'settled' as const }
              : item
          )
        );
        setSelectedRowKeys([]);
        message.success(`成功结算 ${selectedRowKeys.length} 条记录`);
      },
    });
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: { color: '#374151' },
    },
    legend: {
      data: ['分润金额', '订单金额'],
      top: 0,
      textStyle: { color: '#6B7280' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['6/1', '6/3', '6/5', '6/7', '6/9', '6/11', '6/13', '6/15', '6/17', '6/19', '6/21', '6/23', '6/25'],
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280', formatter: '¥{value}' },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
    },
    series: [
      {
        name: '分润金额',
        type: 'line',
        smooth: true,
        data: [2850, 3200, 2980, 3500, 3850, 3650, 4100, 4350, 4200, 4680, 4520, 4950, 5280],
        lineStyle: { color: '#1677FF', width: 3 },
        itemStyle: { color: '#1677FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
            ],
          },
        },
      },
      {
        name: '订单金额',
        type: 'line',
        smooth: true,
        data: [7125, 8000, 7450, 8750, 9625, 9125, 10250, 10875, 10500, 11700, 11300, 12375, 13200],
        lineStyle: { color: '#16A34A', width: 2, type: 'dashed' },
        itemStyle: { color: '#16A34A' },
      },
    ],
  };

  const pieChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: { color: '#374151' },
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#6B7280' },
    },
    series: [
      {
        name: '渠道分润占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: [
          { value: 15280, name: '一级渠道', itemStyle: { color: '#1677FF' } },
          { value: 8640, name: '二级渠道', itemStyle: { color: '#16A34A' } },
          { value: 3560, name: '三级渠道', itemStyle: { color: '#7C3AED' } },
        ],
      },
    ],
  };

  const columns: ColumnsType<ProfitRecord> = [
    {
      title: '分润ID',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      render: (text: string) => (
        <Text code style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 80,
    },
    {
      title: '渠道',
      key: 'channel',
      width: 160,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text>{record.channelId}({record.channelName})</Text>
          <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{record.channelLevel}</Tag>
        </Space>
      ),
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      width: 110,
      render: (amount: number) => (
        <Text strong style={{ color: '#374151' }}>
          ¥{amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '分润金额',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      width: 110,
      render: (amount: number) => (
        <Text strong style={{ color: '#1677FF', fontSize: 14 }}>
          ¥{amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '平台分润(40%)',
      dataIndex: 'platformProfit',
      key: 'platformProfit',
      width: 130,
      render: (amount: number) => (
        <Text style={{ color: '#16A34A' }}>¥{amount.toFixed(2)}</Text>
      ),
    },
    {
      title: '渠道分润(30%)',
      dataIndex: 'channelProfit',
      key: 'channelProfit',
      width: 130,
      render: (amount: number) => (
        <Text style={{ color: '#7C3AED' }}>¥{amount.toFixed(2)}</Text>
      ),
    },
    {
      title: '基金分润(30%)',
      dataIndex: 'fundProfit',
      key: 'fundProfit',
      width: 130,
      render: (amount: number) => (
        <Text style={{ color: '#F59E0B' }}>¥{amount.toFixed(2)}</Text>
      ),
    },
    {
      title: '分润时间',
      dataIndex: 'profitTime',
      key: 'profitTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: ProfitRecord) => ({
      disabled: record.status !== 'pending',
    }),
  };

  const tabItems = [
    {
      key: 'offchain',
      label: (
        <Space>
          <AccountBookOutlined />
          链下分润记录
        </Space>
      ),
    },
    {
      key: 'onchain',
      label: (
        <Space>
          <GlobalOutlined />
          链上订单分润
          <Tag color="green" style={{ marginLeft: 4 }}>智能合约</Tag>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            福建老酒分润管理
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            4/3/3分润制度 · 链下人工结算 + 链上智能合约自动分润双轨并行
          </Text>
        </div>

        <Card
          bordered={false}
          className="mb-6"
          style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          bodyStyle={{ padding: 0 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ marginBottom: 0 }}
            tabBarStyle={{ padding: '0 24px', borderBottom: '1px solid #F3F4F6' }}
          />
        </Card>

        {activeTab === 'offchain' && (
          <>
            <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="总分润金额"
              value={totalProfit.toFixed(2)}
              prefix="¥"
              icon={<DollarOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+18.5%"
              description="累计分润总额"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="已发放"
              value={paidProfit.toFixed(2)}
              prefix="¥"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+22.3%"
              description="已发放至渠道"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待结算"
              value={pendingProfit.toFixed(2)}
              prefix="¥"
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-8.2%"
              description="等待结算金额"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="本月分润"
              value={monthProfit.toFixed(2)}
              prefix="¥"
              icon={<CalendarOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+15.7%"
              description="6月累计分润"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日分润"
              value={todayProfit.toFixed(2)}
              prefix="¥"
              icon={<LineChartOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+12.4%"
              description="今日新增分润"
            />
          </Col>
        </Row>

        <Card
          bordered={false}
          className="mb-6"
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#1677FF' }} />
              <span>分润规则说明</span>
            </Space>
          }
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: '#EFF6FF', borderRadius: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1677FF' }}>40%</div>
                <div style={{ fontSize: 14, color: '#1E40AF', marginTop: 4, fontWeight: 500 }}>平台运营</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                  用于平台技术维护、服务器成本、运营推广等
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: '#F5F3FF', borderRadius: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#7C3AED' }}>30%</div>
                <div style={{ fontSize: 14, color: '#5B21B6', marginTop: 4, fontWeight: 500 }}>渠道团队</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                  分配给推广渠道，按渠道等级进行层级分配
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center', padding: '16px 24px', background: '#FFFBEB', borderRadius: 12 }}>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#F59E0B' }}>30%</div>
                <div style={{ fontSize: 14, color: '#B45309', marginTop: 4, fontWeight: 500 }}>市场基金</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                  用于市场活动、品牌推广、用户激励基金等
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#1677FF' }} />
                  <span>分润趋势图</span>
                </Space>
              }
              extra={<Text type="secondary" style={{ fontSize: 12 }}>近30天</Text>}
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}
            >
              <SafeECharts option={trendChartOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              bordered={false}
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#7C3AED' }} />
                  <span>渠道分润占比</span>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: '100%' }}
            >
              <SafeECharts option={pieChartOption} style={{ height: 320 }} />
            </Card>
          </Col>
        </Row>

        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <h2 className="text-lg font-semibold m-0">分润明细</h2>
              
              <Input
                placeholder="搜索分润ID/订单号/用户/渠道"
                allowClear
                style={{ width: 280 }}
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Select
                placeholder="状态筛选"
                style={{ width: 140 }}
                allowClear
                value={statusFilter || undefined}
                onChange={(value) => setStatusFilter(value || '')}
              >
                <Option value="settled">已结算</Option>
                <Option value="pending">待结算</Option>
                <Option value="paid">已发放</Option>
                <Option value="frozen">已冻结</Option>
              </Select>

              <Select
                placeholder="渠道等级"
                style={{ width: 140 }}
                allowClear
                value={channelFilter || undefined}
                onChange={(value) => setChannelFilter(value || '')}
              >
                <Option value="一级渠道">一级渠道</Option>
                <Option value="二级渠道">二级渠道</Option>
                <Option value="三级渠道">三级渠道</Option>
              </Select>

              <RangePicker style={{ width: 260 }} />
            </div>

            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchText('');
                setStatusFilter('');
                setChannelFilter('');
                setDataList(mockProfitData);
                message.success('已刷新');
              }}>
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<SyncOutlined />} 
                onClick={handleBatchSettle}
                disabled={selectedRowKeys.length === 0}
              >
                批量结算 ({selectedRowKeys.length})
              </Button>
            </Space>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Tag icon={<TeamOutlined />} color="blue">
              总记录: {filteredData.length} 条
            </Tag>
            <Tag icon={<PieChartOutlined />} color="green">
              筛选后金额: ¥{filteredData.reduce((sum, item) => sum + item.profitAmount, 0).toFixed(2)}
            </Tag>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedRowKeys.length === filteredData.filter(item => item.status === 'pending').length && filteredData.some(item => item.status === 'pending')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRowKeys(filteredData.filter(item => item.status === 'pending').map(item => item.id));
                      } else {
                        setSelectedRowKeys([]);
                      }
                    }}
                  />
                </th>
                {columns.map((col: any) => (
                  <th key={col.key || col.dataIndex} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: col.width }}>
                    {col.title}
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 160 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((record) => (
                <tr key={record.id} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50">
                  <td style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedRowKeys.includes(record.id)}
                      disabled={record.status !== 'pending'}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowKeys([...selectedRowKeys, record.id]);
                        } else {
                          setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.id));
                        }
                      }}
                    />
                  </td>
                  {columns.map((col: any) => (
                    <td key={col.key || col.dataIndex} style={{ padding: '12px 16px', fontSize: 13 }}>
                      {col.render ? col.render((record as any)[col.dataIndex], record, 0) : (record as any)[col.dataIndex]}
                    </td>
                  ))}
                  <td style={{ padding: '12px 16px' }}>
                    <Space size="small">
                      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
                        详情
                      </Button>
                      <Tooltip title={record.status !== 'pending' ? '只有待结算状态可手动结算' : ''}>
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<SyncOutlined />} 
                          disabled={record.status !== 'pending'}
                          onClick={() => handleManualSettle(record)}
                        >
                          手动结算
                        </Button>
                      </Tooltip>
                    </Space>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              暂无匹配的分润记录
            </div>
          )}

          <div style={{ marginTop: 16, textAlign: 'right', color: '#6B7280', fontSize: 13 }}>
            共 {filteredData.length} 条记录
          </div>
        </Card>
        </>)}

        {activeTab === 'onchain' && (
          <>
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} lg={8} xl={6}>
                <DataCard
                  title="链上订单总数"
                  value={totalOnChainOrders.toString()}
                  suffix="笔"
                  icon={<BlockOutlined />}
                  color="#06B6D4"
                  description="智能合约累计订单"
                />
              </Col>
              <Col xs={24} sm={12} lg={8} xl={6}>
                <DataCard
                  title="链上成交总额"
                  value={totalOnChainVolume.toFixed(2)}
                  prefix="$"
                  icon={<DollarOutlined />}
                  color="#1677FF"
                  description="USDC 计价"
                />
              </Col>
              <Col xs={24} sm={12} lg={8} xl={6}>
                <DataCard
                  title="累计分润池"
                  value={totalOnChainProfitPool.toFixed(2)}
                  prefix="$"
                  icon={<PieChartOutlined />}
                  color="#16A34A"
                  description="剩余分润池累计"
                />
              </Col>
              <Col xs={24} sm={12} lg={8} xl={6}>
                <DataCard
                  title="推荐人奖励总额"
                  value={totalOnChainReferrerRewards.toFixed(2)}
                  prefix="$"
                  icon={<TeamOutlined />}
                  color="#F59E0B"
                  description="已发放推荐奖励"
                />
              </Col>
            </Row>

            <Card
              bordered={false}
              title={
                <Space>
                  <InfoCircleOutlined style={{ color: '#06B6D4' }} />
                  <span>链上分润规则说明（智能合约自动执行）</span>
                </Space>
              }
              extra={
                <Space>
                  <Tag icon={<LinkOutlined />} color="blue">
                    合约地址: 0x...f8e7d6c5
                  </Tag>
                  <Button type="link" size="small" icon={<ExportOutlined />} href="https://sepolia.basescan.org/address/0x..." target="_blank">
                    区块浏览器查看
                  </Button>
                </Space>
              }
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center', padding: '16px 24px', background: '#FFF7ED', borderRadius: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#EA580C' }}>40%</div>
                    <div style={{ fontSize: 14, color: '#9A3412', marginTop: 4, fontWeight: 500 }}>产品成本</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                      产品本体、包装、仓储、物流、损耗
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center', padding: '16px 24px', background: '#EFF6FF', borderRadius: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#2563EB' }}>30%</div>
                    <div style={{ fontSize: 14, color: '#1E40AF', marginTop: 4, fontWeight: 500 }}>AIOPC 创业家大宗提成</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                      一线销售、渠道拓展、区域复制、企业订单
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ textAlign: 'center', padding: '16px 24px', background: '#F0FDF4', borderRadius: 12 }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#16A34A' }}>30%</div>
                    <div style={{ fontSize: 14, color: '#166534', marginTop: 4, fontWeight: 500 }}>剩余分润池（7角色）</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                      平台运营、技术、商学院、推荐奖励等
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card
              bordered={false}
              style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <h2 className="text-lg font-semibold m-0">链上订单明细</h2>
                  
                  <Input
                    placeholder="搜索订单号/买家地址/交易哈希"
                    allowClear
                    style={{ width: 320 }}
                    prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                    value={onChainSearchText}
                    onChange={(e) => setOnChainSearchText(e.target.value)}
                  />

                  <Select placeholder="价格档位" style={{ width: 140 }} allowClear>
                    <Option value="369">$369 经典款</Option>
                    <Option value="699">$699 典藏款</Option>
                  </Select>
                </div>

                <Space>
                  <Button icon={<ReloadOutlined />} onClick={() => {
                    setOnChainSearchText('');
                    message.success('已刷新');
                  }}>
                    刷新
                  </Button>
                  <Button type="primary" icon={<SyncOutlined />}>
                    从链上同步
                  </Button>
                </Space>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Tag icon={<GlobalOutlined />} color="cyan">
                  链上订单: {filteredOnChainOrders.length} 笔
                </Tag>
                <Tag icon={<DollarOutlined />} color="green">
                  成交总额: ${filteredOnChainOrders.reduce((sum, item) => sum + item.priceTier, 0).toFixed(2)}
                </Tag>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13 }}>
                      订单号
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13 }}>
                      买家地址
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13 }}>
                      推荐人
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 100 }}>
                      价格档位
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 120 }}>
                      分润总额
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 140 }}>
                      区块
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 160 }}>
                      时间
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 80 }}>
                      状态
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #E5E7EB', fontWeight: 600, color: '#374151', fontSize: 13, width: 120 }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOnChainOrders.map((record) => (
                    <tr key={record.orderId} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50">
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        #{record.orderId}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
                        {record.buyer.substring(0, 8)}...{record.buyer.substring(36)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>
                        {record.referrer === '0x0000000000000000000000000000000000000000'
                          ? <Tag color="default">无</Tag>
                          : `${record.referrer.substring(0, 6)}...${record.referrer.substring(38)}`
                        }
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Tag color={record.priceTier === 369 ? 'blue' : 'purple'}>
                          ${record.priceTier}
                        </Tag>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#16A34A' }}>
                        ${record.profitPoolTotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>
                        #{record.blockNumber}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B7280' }}>
                        {record.timestamp}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Tag color="success">成功</Tag>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Space size="small">
                          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewOnChainDetail(record)}>
                            详情
                          </Button>
                        </Space>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOnChainOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                  暂无链上订单
                </div>
              )}

              <div style={{ marginTop: 16, textAlign: 'right', color: '#6B7280', fontSize: 13 }}>
                共 {filteredOnChainOrders.length} 条链上记录
              </div>
            </Card>
          </>
        )}

        <Modal
          title="分润详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={600}
        >
          {currentRecord && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="分润ID" span={2}>
                <Text copyable>{currentRecord.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="订单号" span={2}>
                <Text code>{currentRecord.orderId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户">{currentRecord.userName}</Descriptions.Item>
              <Descriptions.Item label="分润状态">
                <Tag color={statusMap[currentRecord.status]?.color}>
                  {statusMap[currentRecord.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="渠道信息" span={2}>
                {currentRecord.channelId} - {currentRecord.channelName}
                <Tag color="purple" style={{ marginLeft: 8 }}>{currentRecord.channelLevel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额" span={2}>
                <Text strong style={{ fontSize: 16 }}>¥{currentRecord.orderAmount.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="分润比例" span={2}>
                平台40% / 渠道30% / 基金30%
              </Descriptions.Item>
              <Descriptions.Item label="分润总金额" span={2}>
                <Text strong style={{ color: '#1677FF', fontSize: 18 }}>
                  ¥{currentRecord.profitAmount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="平台分润 (40%)">
                <Text style={{ color: '#16A34A' }}>¥{currentRecord.platformProfit.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="渠道分润 (30%)">
                <Text style={{ color: '#7C3AED' }}>¥{currentRecord.channelProfit.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="市场基金分润 (30%)" span={2}>
                <Text style={{ color: '#F59E0B' }}>¥{currentRecord.fundProfit.toFixed(2)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="分润时间" span={2}>
                {currentRecord.profitTime}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Modal
          title="链上订单分润详情"
          open={onChainDetailVisible}
          onCancel={() => setOnChainDetailVisible(false)}
          footer={[
            <Button key="close" onClick={() => setOnChainDetailVisible(false)}>
              关闭
            </Button>,
            currentOnChainOrder && (
              <Button
                key="explorer"
                type="primary"
                icon={<ExportOutlined />}
                onClick={() => window.open(`https://sepolia.basescan.org/tx/${currentOnChainOrder.txHash}`, '_blank')}
              >
                在区块浏览器查看
              </Button>
            ),
          ]}
          width={720}
        >
          {currentOnChainOrder && (
            <div>
              <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="订单号" span={2}>
                  <Text strong style={{ fontSize: 16 }}>#{currentOnChainOrder.orderId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="购买者地址" span={2}>
                  <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {currentOnChainOrder.buyer}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="推荐人地址" span={2}>
                  {currentOnChainOrder.referrer === '0x0000000000000000000000000000000000000000'
                    ? <Tag color="default">无推荐人</Tag>
                    : <Text copyable style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {currentOnChainOrder.referrer}
                      </Text>
                  }
                </Descriptions.Item>
                <Descriptions.Item label="价格档位">
                  <Tag color={currentOnChainOrder.priceTier === 369 ? 'blue' : 'purple'}>
                    ${currentOnChainOrder.priceTier}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="区块高度">
                  <span style={{ fontFamily: 'monospace' }}>#{currentOnChainOrder.blockNumber}</span>
                </Descriptions.Item>
                <Descriptions.Item label="交易哈希" span={2}>
                  <Text copyable style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {currentOnChainOrder.txHash}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="下单时间" span={2}>
                  {currentOnChainOrder.timestamp}
                </Descriptions.Item>
              </Descriptions>

              <div
                style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #F0F9FF 0%, #EFF6FF 100%)',
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500, marginBottom: 12 }}>
                  💰 分润总额（剩余分润池 30%）
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2563EB' }}>
                  ${currentOnChainOrder.profitPoolTotal.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  = ${currentOnChainOrder.priceTier} × 30%
                </div>
              </div>

              <Title level={5} style={{ marginBottom: 12, color: '#374151' }}>
                7 角色分润明细
              </Title>
              <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12 }}>
                {[
                  { name: '招商创投部', field: 'zsVentureShare' as const, percent: 45 },
                  { name: '海外加密部', field: 'overseasCryptoShare' as const, percent: 19 },
                  { name: '商学院', field: 'businessSchoolShare' as const, percent: 11 },
                  { name: '技术团队', field: 'techTeamShare' as const, percent: 11 },
                  { name: '运营部', field: 'operationsShare' as const, percent: 7 },
                  { name: '事业部', field: 'affairsDeptShare' as const, percent: 4 },
                  { name: '推荐人奖励', field: 'referrerShare' as const, percent: 3 },
                ].map((item) => (
                  <div
                    key={item.field}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #F0F0F0',
                    }}
                  >
                    <div>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                        {item.percent}%
                      </Text>
                    </div>
                    <Text strong style={{ color: '#16A34A', fontSize: 14 }}>
                      ${currentOnChainOrder[item.field].toFixed(2)}
                    </Text>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 12,
                    marginTop: 4,
                    borderTop: '2px solid #E5E7EB',
                  }}
                >
                  <Text strong style={{ fontSize: 14 }}>合计</Text>
                  <Text strong style={{ color: '#2563EB', fontSize: 16 }}>
                    ${currentOnChainOrder.profitPoolTotal.toFixed(2)}
                  </Text>
                </div>
              </div>

              <Alert
                message="链上交易信息"
                description={
                  <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: 12, color: '#6B7280' }}>
                    <li>所有分润计算和分配由智能合约自动执行，不可篡改</li>
                    <li>分润金额实时转入各角色对应的链上钱包地址</li>
                    <li>可在 Base 区块链浏览器中查询完整交易记录</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginTop: 16, borderRadius: 8 }}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
