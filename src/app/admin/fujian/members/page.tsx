'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Space,
  Button,
  Modal,
  Descriptions,
  Divider,
  Input,
  Select,
  Badge,
  Tabs,
  List,
  message,
  Form,
  InputNumber,
  Popconfirm,
  Radio,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  FireOutlined,
  EyeOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  GiftOutlined,
  SearchOutlined,
  StarOutlined,
  HistoryOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

const { Option } = Select;

// 会员等级配置
const LEVEL_CONFIG = {
  normal: { name: '普通会员', color: '#9CA3AF', icon: <UserOutlined />, minAmount: 0, discount: '无', benefits: ['基础购物权益', '生日祝福'] },
  vip1: { name: 'VIP1', color: '#60A5FA', icon: <StarOutlined />, minAmount: 2000, discount: '9.5折', benefits: ['9.5折优惠', '积分1.2倍', '专属客服'] },
  vip2: { name: 'VIP2', color: '#3B82F6', icon: <StarOutlined />, minAmount: 5000, discount: '9折', benefits: ['9折优惠', '积分1.5倍', '优先发货', '生日礼品'] },
  vip3: { name: 'VIP3', color: '#8B5CF6', icon: <StarOutlined />, minAmount: 10000, discount: '8.5折', benefits: ['8.5折优惠', '积分2倍', '专属顾问', '新品优先购'] },
  diamond: { name: '钻石VIP', color: '#06B6D4', icon: <CrownOutlined />, minAmount: 20000, discount: '8折', benefits: ['8折优惠', '积分3倍', 'VIP专线', '限量款优先', '年度礼盒'] },
  blackgold: { name: '黑金VIP', color: '#F59E0B', icon: <CrownOutlined />, minAmount: 50000, discount: '7.5折', benefits: ['7.5折优惠', '积分5倍', '1对1管家', '私人定制', '顶级活动邀请', '免费品鉴会'] },
};

// Mock会员数据
const mockMembers = [
  {
    id: 'M00001',
    nickname: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    phone: '138****1234',
    level: 'blackgold',
    totalConsume: 52800,
    monthConsume: 3690,
    points: 12580,
    registerDate: '2026-01-15',
    status: 'active',
    realName: '张三',
    gender: '男',
    birthday: '1990-05-20',
    address: '福建省福州市鼓楼区',
    inviterId: 'M00000',
    inviterName: '系统推荐',
  },
  {
    id: 'M00002',
    nickname: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    phone: '139****5678',
    level: 'diamond',
    totalConsume: 28500,
    monthConsume: 2097,
    points: 6850,
    registerDate: '2026-02-20',
    status: 'active',
    realName: '李四',
    gender: '男',
    birthday: '1988-08-15',
    address: '福建省厦门市思明区',
    inviterId: 'M00001',
    inviterName: '张三',
  },
  {
    id: 'M00003',
    nickname: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    phone: '137****9012',
    level: 'vip3',
    totalConsume: 15200,
    monthConsume: 1398,
    points: 3620,
    registerDate: '2026-03-10',
    status: 'active',
    realName: '王五',
    gender: '男',
    birthday: '1992-03-08',
    address: '福建省泉州市丰泽区',
    inviterId: 'M00001',
    inviterName: '张三',
  },
  {
    id: 'M00004',
    nickname: '赵六',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao',
    phone: '136****3456',
    level: 'vip2',
    totalConsume: 8600,
    monthConsume: 699,
    points: 1980,
    registerDate: '2026-04-05',
    status: 'active',
    realName: '赵六',
    gender: '女',
    birthday: '1995-11-25',
    address: '福建省漳州市芗城区',
    inviterId: 'M00002',
    inviterName: '李四',
  },
  {
    id: 'M00005',
    nickname: '孙七',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun',
    phone: '135****7890',
    level: 'vip1',
    totalConsume: 4200,
    monthConsume: 369,
    points: 920,
    registerDate: '2026-05-12',
    status: 'active',
    realName: '孙七',
    gender: '男',
    birthday: '1993-07-14',
    address: '福建省莆田市城厢区',
    inviterId: 'M00002',
    inviterName: '李四',
  },
  {
    id: 'M00006',
    nickname: '周八',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhou',
    phone: '134****2345',
    level: 'normal',
    totalConsume: 1200,
    monthConsume: 0,
    points: 280,
    registerDate: '2026-06-01',
    status: 'active',
    realName: '周八',
    gender: '女',
    birthday: '1997-09-30',
    address: '福建省南平市延平区',
    inviterId: 'M00003',
    inviterName: '王五',
  },
  {
    id: 'M00007',
    nickname: '吴九',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wu',
    phone: '133****6789',
    level: 'blackgold',
    totalConsume: 68500,
    monthConsume: 5280,
    points: 18960,
    registerDate: '2025-12-08',
    status: 'active',
    realName: '吴九',
    gender: '男',
    birthday: '1985-04-18',
    address: '福建省福州市仓山区',
    inviterId: 'M00000',
    inviterName: '系统推荐',
  },
  {
    id: 'M00008',
    nickname: '郑十',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zheng',
    phone: '132****0123',
    level: 'diamond',
    totalConsume: 32600,
    monthConsume: 1890,
    points: 8520,
    registerDate: '2026-01-25',
    status: 'frozen',
    realName: '郑十',
    gender: '男',
    birthday: '1991-06-22',
    address: '福建省龙岩市新罗区',
    inviterId: 'M00007',
    inviterName: '吴九',
  },
  {
    id: 'M00009',
    nickname: '陈十一',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chen',
    phone: '131****4567',
    level: 'vip3',
    totalConsume: 12800,
    monthConsume: 890,
    points: 3150,
    registerDate: '2026-02-14',
    status: 'active',
    realName: '陈十一',
    gender: '女',
    birthday: '1994-12-05',
    address: '福建省宁德市蕉城区',
    inviterId: 'M00007',
    inviterName: '吴九',
  },
  {
    id: 'M00010',
    nickname: '林十二',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lin',
    phone: '130****8901',
    level: 'vip2',
    totalConsume: 7200,
    monthConsume: 560,
    points: 1680,
    registerDate: '2026-03-22',
    status: 'active',
    realName: '林十二',
    gender: '男',
    birthday: '1996-02-10',
    address: '福建省三明市梅列区',
    inviterId: 'M00001',
    inviterName: '张三',
  },
  {
    id: 'M00011',
    nickname: '黄十三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huang',
    phone: '159****2345',
    level: 'vip1',
    totalConsume: 3500,
    monthConsume: 280,
    points: 780,
    registerDate: '2026-04-18',
    status: 'active',
    realName: '黄十三',
    gender: '女',
    birthday: '1998-08-08',
    address: '福建省厦门市湖里区',
    inviterId: 'M00004',
    inviterName: '赵六',
  },
  {
    id: 'M00012',
    nickname: '刘十四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu',
    phone: '158****6789',
    level: 'normal',
    totalConsume: 680,
    monthConsume: 0,
    points: 150,
    registerDate: '2026-05-28',
    status: 'active',
    realName: '刘十四',
    gender: '男',
    birthday: '2000-01-01',
    address: '福建省福州市晋安区',
    inviterId: 'M00005',
    inviterName: '孙七',
  },
];

// 消费记录Mock
const mockConsumeRecords = [
  { id: 'O20260620001', date: '2026-06-20 14:30', product: '福建老酒·三十年陈酿', amount: 1280, points: 128, status: '已完成' },
  { id: 'O20260615002', date: '2026-06-15 10:20', product: '福建老酒·十五年陈酿', amount: 680, points: 68, status: '已完成' },
  { id: 'O20260610003', date: '2026-06-10 16:45', product: '福建老酒·礼盒装', amount: 890, points: 89, status: '已完成' },
  { id: 'O20260605004', date: '2026-06-05 09:15', product: '福建老酒·八年陈酿', amount: 380, points: 38, status: '已完成' },
  { id: 'O20260528005', date: '2026-05-28 11:30', product: '福建老酒·五年陈酿', amount: 260, points: 26, status: '已完成' },
];

// 积分明细Mock
const mockPointsRecords = [
  { id: 'P001', date: '2026-06-20 14:30', type: '消费获得', amount: 128, balance: 12580, remark: '订单O20260620001消费返积分' },
  { id: 'P002', date: '2026-06-18 09:00', type: '签到赠送', amount: 10, balance: 12452, remark: '每日签到奖励' },
  { id: 'P003', date: '2026-06-15 10:20', type: '消费获得', amount: 68, balance: 12442, remark: '订单O20260615002消费返积分' },
  { id: 'P004', date: '2026-06-10 16:45', type: '消费获得', amount: 89, balance: 12374, remark: '订单O20260610003消费返积分' },
  { id: 'P005', date: '2026-06-01 00:00', type: '等级赠送', amount: 500, balance: 12285, remark: '黑金VIP月度赠送' },
];

// 等级历史Mock
const mockLevelHistory = [
  { id: 'L001', date: '2026-01-15', fromLevel: '-', toLevel: 'VIP1', reason: '注册新会员，首单达标' },
  { id: 'L002', date: '2026-02-20', fromLevel: 'VIP1', toLevel: 'VIP2', reason: '累计消费满5000元' },
  { id: 'L003', date: '2026-03-15', fromLevel: 'VIP2', toLevel: 'VIP3', reason: '累计消费满10000元' },
  { id: 'L004', date: '2026-04-10', fromLevel: 'VIP3', toLevel: '钻石VIP', reason: '累计消费满20000元' },
  { id: 'L005', date: '2026-05-08', fromLevel: '钻石VIP', toLevel: '黑金VIP', reason: '累计消费满50000元' },
];

export default function FujianMembersPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [pointsModalVisible, setPointsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [form] = Form.useForm();
  const [pointsForm] = Form.useForm();

  // 统计数据
  const stats = {
    totalMembers: 12586,
    monthNew: 328,
    vipCount: 2156,
    totalConsume: 2856000,
    monthConsume: 186500,
    activeMembers: 8965,
  };

  // 饼图数据
  const pieChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
    },
    series: [
      {
        name: '会员等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 10430, name: '普通会员', itemStyle: { color: '#9CA3AF' } },
          { value: 856, name: 'VIP1', itemStyle: { color: '#60A5FA' } },
          { value: 528, name: 'VIP2', itemStyle: { color: '#3B82F6' } },
          { value: 412, name: 'VIP3', itemStyle: { color: '#8B5CF6' } },
          { value: 256, name: '钻石VIP', itemStyle: { color: '#06B6D4' } },
          { value: 104, name: '黑金VIP', itemStyle: { color: '#F59E0B' } },
        ],
      },
    ],
  };

  // 过滤后的会员列表
  const filteredMembers = mockMembers.filter(member => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchId = member.id.toLowerCase().includes(keyword);
      const matchName = member.nickname.toLowerCase().includes(keyword);
      const matchPhone = member.phone.includes(keyword);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    if (levelFilter && member.level !== levelFilter) return false;
    if (statusFilter && member.status !== statusFilter) return false;
    return true;
  });

  // 获取等级标签
  const getLevelTag = (level: string) => {
    const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.normal;
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontWeight: 500 }}>
        {config.name}
      </Tag>
    );
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    if (status === 'active') return <Badge status="success" text="正常" />;
    if (status === 'frozen') return <Badge status="warning" text="已冻结" />;
    return <Badge status="default" text="未激活" />;
  };

  // 查看详情
  const handleViewDetail = (record: any) => {
    setSelectedMember(record);
    setActiveTab('basic');
    setDetailModalVisible(true);
  };

  // 调整等级
  const handleAdjustLevel = (record: any) => {
    setSelectedMember(record);
    form.setFieldsValue({ level: record.level });
    setLevelModalVisible(true);
  };

  // 确认调整等级
  const handleLevelConfirm = () => {
    form.validateFields().then(values => {
      message.success(`已将会员等级调整为 ${LEVEL_CONFIG[values.level as keyof typeof LEVEL_CONFIG]?.name}`);
      setLevelModalVisible(false);
    });
  };

  // 冻结/解冻
  const handleToggleStatus = (record: any) => {
    const isFrozen = record.status === 'frozen';
    message.success(isFrozen ? '会员已解冻' : '会员已冻结');
  };

  // 赠送积分
  const handleGiftPoints = (record: any) => {
    setSelectedMember(record);
    pointsForm.resetFields();
    setPointsModalVisible(true);
  };

  // 确认赠送积分
  const handlePointsConfirm = () => {
    pointsForm.validateFields().then(values => {
      message.success(`已赠送 ${values.points} 积分`);
      setPointsModalVisible(false);
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '会员ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <span style={{ fontFamily: 'monospace', color: '#666' }}>{text}</span>,
    },
    {
      title: '会员信息',
      key: 'memberInfo',
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} size={40} />
          <div>
            <div className="font-semibold text-gray-800">{record.nickname}</div>
            <div className="text-gray-500 text-xs">{record.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level: string) => getLevelTag(level),
      filters: Object.entries(LEVEL_CONFIG).map(([key, config]) => ({
        text: config.name,
        value: key,
      })),
      onFilter: (value: any, record: any) => record.level === value,
    },
    {
      title: '累计消费',
      dataIndex: 'totalConsume',
      key: 'totalConsume',
      width: 120,
      sorter: (a: any, b: any) => a.totalConsume - b.totalConsume,
      render: (amount: number) => (
        <span className="font-semibold text-gray-800">¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '本月消费',
      dataIndex: 'monthConsume',
      key: 'monthConsume',
      width: 120,
      sorter: (a: any, b: any) => a.monthConsume - b.monthConsume,
      render: (amount: number) => (
        <span className={amount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
          ¥{amount.toLocaleString()}
        </span>
      ),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      sorter: (a: any, b: any) => a.points - b.points,
      render: (points: number) => (
        <Space size={4}>
          <StarOutlined style={{ color: '#F59E0B' }} />
          <span className="font-medium">{points.toLocaleString()}</span>
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'registerDate',
      key: 'registerDate',
      width: 120,
      sorter: (a: any, b: any) => a.registerDate.localeCompare(b.registerDate),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
    },
  ];

  // 操作按钮
  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: handleViewDetail,
    },
    {
      key: 'adjust-level',
      label: '调整等级',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: handleAdjustLevel,
    },
    {
      key: 'toggle-status',
      label: (record: any) => (record.status === 'frozen' ? '解冻' : '冻结'),
      icon: (record: any) => (record.status === 'frozen' ? <UnlockOutlined /> : <LockOutlined />),
      type: 'link' as const,
      danger: (record: any) => record.status !== 'frozen',
      confirm: (record: any) => ({
        title: record.status === 'frozen' ? '确定要解冻该会员吗？' : '确定要冻结该会员吗？',
        description: record.status === 'frozen'
          ? '解冻后会员将恢复正常使用权限'
          : '冻结后会员将无法登录和消费',
        onConfirm: () => handleToggleStatus(record),
      }),
    },
    {
      key: 'gift-points',
      label: '赠送积分',
      icon: <GiftOutlined />,
      type: 'link' as const,
      onClick: handleGiftPoints,
    },
  ];

  // 等级筛选选项
  const levelFilterOptions = [
    { label: '全部等级', value: '' },
    ...Object.entries(LEVEL_CONFIG).map(([key, config]) => ({
      label: config.name,
      value: key,
    })),
  ];

  // 状态筛选选项
  const statusFilterOptions = [
    { label: '全部状态', value: '' },
    { label: '正常', value: 'active' },
    { label: '已冻结', value: 'frozen' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7C2D12 0%, #92400E 50%, #B45309 100%)',
            borderRadius: 16,
            padding: '28px 32px',
            color: '#fff',
          }}
        >
          <Space align="center" size={16}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              <CrownOutlined />
            </div>
            <div>
              <h1 className="text-2xl font-bold m-0 text-white">福建老酒会员体系管理</h1>
              <p className="text-sm m-0 mt-1 opacity-80">
                会员等级管理 · 消费积分 · 权益配置 · 精准营销
              </p>
            </div>
          </Space>
          <div className="mt-4">
            <Tag color="#F59E0B" style={{ border: 'none', fontWeight: 600 }}>
              <CrownOutlined /> 黑金VIP
            </Tag>
            <Tag color="#06B6D4" style={{ border: 'none', fontWeight: 600, color: '#fff' }}>
              <CrownOutlined /> 钻石VIP
            </Tag>
            <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', background: 'transparent' }}>
              六级会员体系
            </Tag>
            <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', background: 'transparent' }}>
              消费累计升级
            </Tag>
            <Tag style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', background: 'transparent' }}>
              专属权益
            </Tag>
          </div>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="会员总数"
              value={stats.totalMembers.toLocaleString()}
              suffix="人"
              icon={<TeamOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+5.2%"
              description="累计注册会员"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="本月新增"
              value={stats.monthNew}
              suffix="人"
              icon={<UserOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+12.8%"
              description="本月新增注册"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="VIP会员数"
              value={stats.vipCount.toLocaleString()}
              suffix="人"
              icon={<CrownOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+8.3%"
              description="VIP及以上会员"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="累计消费"
              value={(stats.totalConsume / 10000).toFixed(1)}
              prefix="¥"
              suffix="万"
              icon={<DollarOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+15.6%"
              description="历史累计消费"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="本月消费"
              value={(stats.monthConsume / 10000).toFixed(1)}
              prefix="¥"
              suffix="万"
              icon={<ShoppingCartOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+22.1%"
              description="本月消费总额"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="活跃会员"
              value={stats.activeMembers.toLocaleString()}
              suffix="人"
              icon={<FireOutlined />}
              color="#EF4444"
              trend="up"
              trendValue="+3.7%"
              description="近30天活跃"
            />
          </Col>
        </Row>

        {/* 图表和等级配置区 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <PieChartOutlined />
                  <span>会员等级分布</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <SafeECharts option={pieChartOption} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <CrownOutlined />
                  <span>会员等级配置</span>
                </Space>
              }
              style={{ borderRadius: 12 }}
              bodyStyle={{ padding: '16px 20px' }}
            >
              <div className="space-y-3">
                {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: `${config.color}10` }}
                  >
                    <Space size={12}>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ background: config.color }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: config.color }}>
                          {config.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          满{config.minAmount.toLocaleString()}元升级 · {config.discount}
                        </div>
                      </div>
                    </Space>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">权益数</div>
                      <div className="font-bold" style={{ color: config.color }}>
                        {config.benefits.length}项
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 会员列表 */}
        <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
          {/* 搜索和筛选栏 */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold m-0">会员列表</h2>
              <Input.Search
                placeholder="搜索会员ID、昵称、手机号"
                allowClear
                style={{ width: 280 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={setSearchKeyword}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="会员等级"
                style={{ width: 140 }}
                allowClear
                value={levelFilter || undefined}
                onChange={setLevelFilter}
              >
                {levelFilterOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="会员状态"
                style={{ width: 140 }}
                allowClear
                value={statusFilter || undefined}
                onChange={setStatusFilter}
              >
                {statusFilterOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchKeyword('');
                setLevelFilter('');
                setStatusFilter('');
                message.success('已重置筛选条件');
              }}>
                重置
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>
                新增会员
              </Button>
            </Space>
          </div>

          {/* 表格 */}
          <DataTable
            title=""
            columns={columns}
            dataSource={filteredMembers}
            actions={actions}
            rowKey="id"
            showSearch={false}
            showAdd={false}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 位会员`,
              total: filteredMembers.length,
            }}
          />
        </Card>

        {/* 会员详情弹窗 */}
        <Modal
          title={
            <Space>
              <UserOutlined />
              <span>会员详情</span>
            </Space>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
            <Button key="edit" type="primary" icon={<EditOutlined />}>
              编辑会员
            </Button>,
          ]}
          width={900}
          bodyStyle={{ padding: 0 }}
        >
          {selectedMember && (
            <div>
              {/* 会员头部信息 */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${LEVEL_CONFIG[selectedMember.level as keyof typeof LEVEL_CONFIG]?.color}20 0%, ${LEVEL_CONFIG[selectedMember.level as keyof typeof LEVEL_CONFIG]?.color}05 100%)`,
                  padding: '24px 32px',
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar src={selectedMember.avatar} size={72} icon={<UserOutlined />} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold m-0">{selectedMember.nickname}</h2>
                      {getLevelTag(selectedMember.level)}
                      {getStatusBadge(selectedMember.status)}
                    </div>
                    <div className="text-gray-500 mt-1">
                      会员ID：{selectedMember.id} · {selectedMember.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">当前积分</div>
                    <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
                      {selectedMember.points.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab内容 */}
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ padding: '0 24px' }}
                items={[
                  {
                    key: 'basic',
                    label: (
                      <Space size={4}>
                        <UserOutlined />
                        基本信息
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <Descriptions bordered column={2} size="middle">
                          <Descriptions.Item label="真实姓名">{selectedMember.realName}</Descriptions.Item>
                          <Descriptions.Item label="性别">{selectedMember.gender}</Descriptions.Item>
                          <Descriptions.Item label="手机号码">{selectedMember.phone}</Descriptions.Item>
                          <Descriptions.Item label="出生日期">{selectedMember.birthday}</Descriptions.Item>
                          <Descriptions.Item label="注册时间">{selectedMember.registerDate}</Descriptions.Item>
                          <Descriptions.Item label="会员等级">{getLevelTag(selectedMember.level)}</Descriptions.Item>
                          <Descriptions.Item label="收货地址" span={2}>
                            {selectedMember.address}
                          </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">消费概览</Divider>
                        <Row gutter={[16, 16]}>
                          <Col span={8}>
                            <Card size="small" style={{ textAlign: 'center' }}>
                              <div className="text-gray-500 text-sm">累计消费</div>
                              <div className="text-xl font-bold text-gray-800 mt-1">
                                ¥{selectedMember.totalConsume.toLocaleString()}
                              </div>
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card size="small" style={{ textAlign: 'center' }}>
                              <div className="text-gray-500 text-sm">本月消费</div>
                              <div className="text-xl font-bold text-green-600 mt-1">
                                ¥{selectedMember.monthConsume.toLocaleString()}
                              </div>
                            </Card>
                          </Col>
                          <Col span={8}>
                            <Card size="small" style={{ textAlign: 'center' }}>
                              <div className="text-gray-500 text-sm">可用积分</div>
                              <div className="text-xl font-bold mt-1" style={{ color: '#F59E0B' }}>
                                {selectedMember.points.toLocaleString()}
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    ),
                  },
                  {
                    key: 'consume',
                    label: (
                      <Space size={4}>
                        <ShoppingCartOutlined />
                        消费记录
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <List
                          size="small"
                          dataSource={mockConsumeRecords}
                          renderItem={(item: any) => (
                            <List.Item
                              actions={[
                                <span key="amount" className="font-semibold text-gray-800">¥{item.amount}</span>,
                              ]}
                            >
                              <List.Item.Meta
                                title={item.product}
                                description={
                                  <Space size={12}>
                                    <span className="text-gray-500">{item.date}</span>
                                    <Tag color="blue" style={{ margin: 0 }}>
                                      +{item.points}积分
                                    </Tag>
                                    <span className="text-green-600">{item.status}</span>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'points',
                    label: (
                      <Space size={4}>
                        <StarOutlined />
                        积分明细
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <List
                          size="small"
                          dataSource={mockPointsRecords}
                          renderItem={(item: any) => (
                            <List.Item
                              actions={[
                                <span key="delta" className={item.amount > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                  {item.amount > 0 ? '+' : ''}{item.amount}
                                </span>,
                              ]}
                            >
                              <List.Item.Meta
                                title={item.type}
                                description={
                                  <Space size={12}>
                                    <span className="text-gray-500">{item.date}</span>
                                    <span className="text-gray-400">{item.remark}</span>
                                  </Space>
                                }
                              />
                              <div className="text-gray-500 text-sm">余额: {item.balance.toLocaleString()}</div>
                            </List.Item>
                          )}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'level',
                    label: (
                      <Space size={4}>
                        <HistoryOutlined />
                        等级历史
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <List
                          size="small"
                          dataSource={mockLevelHistory}
                          renderItem={(item: any) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <span className="text-gray-400">{item.fromLevel}</span>
                                    <span className="text-gray-500">→</span>
                                    <span className="font-semibold" style={{ color: LEVEL_CONFIG[item.toLevel.toLowerCase().replace('vip', 'vip') as keyof typeof LEVEL_CONFIG]?.color || '#1677FF' }}>
                                      {item.toLevel}
                                    </span>
                                  </Space>
                                }
                                description={
                                  <Space size={12}>
                                    <span className="text-gray-500">{item.date}</span>
                                    <span className="text-gray-400">{item.reason}</span>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'invite',
                    label: (
                      <Space size={4}>
                        <ShareAltOutlined />
                        推荐关系
                      </Space>
                    ),
                    children: (
                      <div style={{ padding: '16px 0' }}>
                        <Descriptions bordered column={2} size="middle">
                          <Descriptions.Item label="推荐人">
                            <Space>
                              <Avatar size="small" icon={<UserOutlined />} />
                              <span>{selectedMember.inviterName}</span>
                              <span className="text-gray-500">({selectedMember.inviterId})</span>
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="推荐等级">一级推荐</Descriptions.Item>
                          <Descriptions.Item label="直接推荐人数">3 人</Descriptions.Item>
                          <Descriptions.Item label="团队总人数">8 人</Descriptions.Item>
                          <Descriptions.Item label="累计推荐奖励">
                            <span className="text-green-600 font-semibold">¥2,580</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="本月推荐奖励">
                            <span className="text-green-600 font-semibold">¥380</span>
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </Modal>

        {/* 调整等级弹窗 */}
        <Modal
          title="调整会员等级"
          open={levelModalVisible}
          onCancel={() => setLevelModalVisible(false)}
          onOk={handleLevelConfirm}
          okText="确认调整"
          cancelText="取消"
        >
          {selectedMember && (
            <Form form={form} layout="vertical">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedMember.avatar} size={48} />
                  <div>
                    <div className="font-semibold">{selectedMember.nickname}</div>
                    <div className="text-gray-500 text-sm">
                      当前等级：{getLevelTag(selectedMember.level)}
                    </div>
                  </div>
                </div>
              </div>
              <Form.Item
                label="调整至"
                name="level"
                rules={[{ required: true, message: '请选择会员等级' }]}
              >
                <Select placeholder="请选择会员等级">
                  {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
                    <Option key={key} value={key}>
                      <Space>
                        <span style={{ color: config.color }}>{config.icon}</span>
                        {config.name}
                        <span className="text-gray-400 text-xs">
                          (满{config.minAmount.toLocaleString()}元)
                        </span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="调整原因" name="reason">
                <Input.TextArea rows={3} placeholder="请输入调整原因（选填）" />
              </Form.Item>
            </Form>
          )}
        </Modal>

        {/* 赠送积分弹窗 */}
        <Modal
          title="赠送积分"
          open={pointsModalVisible}
          onCancel={() => setPointsModalVisible(false)}
          onOk={handlePointsConfirm}
          okText="确认赠送"
          cancelText="取消"
        >
          {selectedMember && (
            <Form form={pointsForm} layout="vertical">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedMember.avatar} size={48} />
                    <div>
                      <div className="font-semibold">{selectedMember.nickname}</div>
                      <div className="text-gray-500 text-sm">{selectedMember.id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">当前积分</div>
                    <div className="text-xl font-bold" style={{ color: '#F59E0B' }}>
                      {selectedMember.points.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              <Form.Item
                label="赠送类型"
                name="type"
                initialValue="add"
                rules={[{ required: true, message: '请选择操作类型' }]}
              >
                <Radio.Group>
                  <Radio.Button value="add">
                    <PlusOutlined /> 增加积分
                  </Radio.Button>
                  <Radio.Button value="minus">
                    <MinusOutlined /> 扣减积分
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="积分数量"
                name="points"
                rules={[{ required: true, message: '请输入积分数量' }]}
              >
                <InputNumber
                  min={1}
                  max={100000}
                  style={{ width: '100%' }}
                  placeholder="请输入积分数量"
                  addonAfter="积分"
                />
              </Form.Item>
              <Form.Item label="赠送原因" name="reason">
                <Input.TextArea rows={3} placeholder="请输入赠送/扣减原因（选填）" />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

function PieChartOutlined() {
  return <span>📊</span>;
}
