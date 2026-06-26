'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Row,
  Col,
  Card,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Avatar,
  Descriptions,
  Tabs,
  List,
  message,
  InputNumber,
  Divider,
  Table,
} from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  RiseOutlined,
  DollarOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
  CrownOutlined,
  TrophyOutlined,
  WalletOutlined,
  IdcardOutlined,
  ArrowUpOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

const { Option } = Select;

// 渠道等级配置
const CHANNEL_LEVELS = {
  director: { label: '董事', color: 'gold', icon: <CrownOutlined />, order: 1 },
  president: { label: '总裁', color: 'purple', icon: <CrownOutlined />, order: 2 },
  director_general: { label: '总监', color: 'blue', icon: <TrophyOutlined />, order: 3 },
  manager: { label: '经理', color: 'cyan', icon: <UserOutlined />, order: 4 },
  member: { label: '会员', color: 'green', icon: <TeamOutlined />, order: 5 },
  normal: { label: '普通', color: 'default', icon: <UserOutlined />, order: 6 },
};

// 模拟渠道数据
const mockChannels = [
  {
    id: 'QD001',
    name: '王建国',
    phone: '138****0001',
    level: 'director',
    teamCount: 128,
    totalPerformance: 1250000,
    monthPerformance: 156000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo',
    joinDate: '2024-03-15',
    idCard: '3501**********0001',
    address: '福建省福州市鼓楼区',
    bankCard: '6222 **** **** 0001',
    bankName: '中国工商银行',
    totalProfit: 187500,
    pendingProfit: 32000,
    directInvites: 12,
    levelUpTime: '2025-06-20',
  },
  {
    id: 'QD002',
    name: '李明华',
    phone: '139****0002',
    level: 'president',
    teamCount: 86,
    totalPerformance: 890000,
    monthPerformance: 98000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liminghua',
    joinDate: '2024-05-20',
    idCard: '3502**********0002',
    address: '福建省厦门市思明区',
    bankCard: '6222 **** **** 0002',
    bankName: '中国建设银行',
    totalProfit: 133500,
    pendingProfit: 21000,
    directInvites: 8,
    levelUpTime: '2025-08-10',
  },
  {
    id: 'QD003',
    name: '张伟强',
    phone: '137****0003',
    level: 'director_general',
    teamCount: 52,
    totalPerformance: 520000,
    monthPerformance: 67000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangweiqiang',
    joinDate: '2024-07-10',
    idCard: '3503**********0003',
    address: '福建省泉州市丰泽区',
    bankCard: '6222 **** **** 0003',
    bankName: '中国农业银行',
    totalProfit: 78000,
    pendingProfit: 12000,
    directInvites: 6,
    levelUpTime: '2025-09-15',
  },
  {
    id: 'QD004',
    name: '刘芳',
    phone: '136****0004',
    level: 'director_general',
    teamCount: 45,
    totalPerformance: 480000,
    monthPerformance: 52000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufang',
    joinDate: '2024-08-05',
    idCard: '3504**********0004',
    address: '福建省漳州市芗城区',
    bankCard: '6222 **** **** 0004',
    bankName: '中国银行',
    totalProfit: 72000,
    pendingProfit: 9800,
    directInvites: 5,
    levelUpTime: '2025-10-20',
  },
  {
    id: 'QD005',
    name: '陈大海',
    phone: '135****0005',
    level: 'manager',
    teamCount: 28,
    totalPerformance: 280000,
    monthPerformance: 35000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chendahai',
    joinDate: '2024-09-12',
    idCard: '3505**********0005',
    address: '福建省龙岩市新罗区',
    bankCard: '6222 **** **** 0005',
    bankName: '交通银行',
    totalProfit: 42000,
    pendingProfit: 6500,
    directInvites: 4,
    levelUpTime: '2025-11-05',
  },
  {
    id: 'QD006',
    name: '杨晓燕',
    phone: '134****0006',
    level: 'manager',
    teamCount: 22,
    totalPerformance: 210000,
    monthPerformance: 28000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yangxiaoyan',
    joinDate: '2024-10-18',
    idCard: '3506**********0006',
    address: '福建省三明市梅列区',
    bankCard: '6222 **** **** 0006',
    bankName: '招商银行',
    totalProfit: 31500,
    pendingProfit: 5200,
    directInvites: 3,
    levelUpTime: '2025-12-01',
  },
  {
    id: 'QD007',
    name: '周明辉',
    phone: '133****0007',
    level: 'member',
    teamCount: 12,
    totalPerformance: 98000,
    monthPerformance: 12000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouminghui',
    joinDate: '2025-01-08',
    idCard: '3507**********0007',
    address: '福建省南平市延平区',
    bankCard: '6222 **** **** 0007',
    bankName: '兴业银行',
    totalProfit: 14700,
    pendingProfit: 2100,
    directInvites: 2,
    levelUpTime: '2026-01-15',
  },
  {
    id: 'QD008',
    name: '吴小红',
    phone: '132****0008',
    level: 'normal',
    teamCount: 3,
    totalPerformance: 25000,
    monthPerformance: 3000,
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wuxiaohong',
    joinDate: '2025-03-22',
    idCard: '3508**********0008',
    address: '福建省宁德市蕉城区',
    bankCard: '6222 **** **** 0008',
    bankName: '平安银行',
    totalProfit: 3750,
    pendingProfit: 500,
    directInvites: 1,
    levelUpTime: '2026-02-20',
  },
];

// 模拟分润记录
const mockProfitRecords = [
  { id: 'PR001', date: '2026-06-25', amount: 5200, type: '直推奖励', orderNo: 'DD202606250001', status: '已结算' },
  { id: 'PR002', date: '2026-06-24', amount: 3800, type: '团队业绩奖', orderNo: 'DD202606240002', status: '已结算' },
  { id: 'PR003', date: '2026-06-23', amount: 2100, type: '级差奖励', orderNo: 'DD202606230003', status: '已结算' },
  { id: 'PR004', date: '2026-06-22', amount: 4500, type: '直推奖励', orderNo: 'DD202606220004', status: '待结算' },
  { id: 'PR005', date: '2026-06-21', amount: 3200, type: '团队业绩奖', orderNo: 'DD202606210005', status: '待结算' },
  { id: 'PR006', date: '2026-06-20', amount: 1800, type: '平级奖', orderNo: 'DD202606200006', status: '待结算' },
];

// 模拟团队成员数据
const mockTeamMembers = [
  { id: 'TM001', name: '张三', level: 'manager', joinDate: '2025-05-10', performance: 85000, status: 'active' },
  { id: 'TM002', name: '李四', level: 'member', joinDate: '2025-06-15', performance: 42000, status: 'active' },
  { id: 'TM003', name: '王五', level: 'member', joinDate: '2025-07-20', performance: 38000, status: 'active' },
  { id: 'TM004', name: '赵六', level: 'normal', joinDate: '2025-08-10', performance: 15000, status: 'active' },
  { id: 'TM005', name: '钱七', level: 'normal', joinDate: '2025-09-05', performance: 8000, status: 'inactive' },
];

export default function FujianChannelPage() {
  const queryClient = useQueryClient();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [addForm] = Form.useForm();
  const [levelForm] = Form.useForm();

  // 查询渠道列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fujian-channels', searchKeyword, levelFilter, statusFilter],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let filtered = [...mockChannels];
      
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(c => 
          c.id.toLowerCase().includes(keyword) ||
          c.name.toLowerCase().includes(keyword) ||
          c.phone.includes(keyword)
        );
      }
      
      if (levelFilter) {
        filtered = filtered.filter(c => c.level === levelFilter);
      }
      
      if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
      }
      
      return { items: filtered, total: filtered.length, page: 1, pageSize: 10 };
    },
  });

  // 切换渠道状态
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return { id, status };
    },
    onSuccess: (_, { status }) => {
      message.success(status === 'active' ? '渠道已启用' : '渠道已禁用');
      queryClient.invalidateQueries({ queryKey: ['fujian-channels'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // 调整等级
  const adjustLevelMutation = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: string }) => {
      await new Promise(resolve => setTimeout(resolve, 400));
      return { id, level };
    },
    onSuccess: () => {
      message.success('等级调整成功');
      setLevelModalVisible(false);
      levelForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['fujian-channels'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // 新增渠道
  const addChannelMutation = useMutation({
    mutationFn: async (values: any) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return values;
    },
    onSuccess: () => {
      message.success('渠道创建成功');
      setAddModalVisible(false);
      addForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['fujian-channels'] });
    },
    onError: () => {
      message.error('创建失败');
    },
  });

  // 统计数据
  const stats = useMemo(() => {
    const channels = data?.items || mockChannels;
    const totalChannels = channels.length;
    const totalTeamCount = channels.reduce((sum, c) => sum + c.teamCount, 0);
    const totalPerformance = channels.reduce((sum, c) => sum + c.totalPerformance, 0);
    const monthPerformance = channels.reduce((sum, c) => sum + c.monthPerformance, 0);
    const pendingProfit = channels.reduce((sum, c) => sum + c.pendingProfit, 0);
    const newThisMonth = 3;
    
    return {
      totalChannels,
      totalTeamCount,
      newThisMonth,
      monthPerformance,
      totalPerformance,
      pendingProfit,
    };
  }, [data]);

  // 渠道等级分布饼图
  const levelDistributionOption = useMemo(() => {
    const channels = data?.items || mockChannels;
    const levelCount: Record<string, number> = {};
    
    channels.forEach(c => {
      levelCount[c.level] = (levelCount[c.level] || 0) + 1;
    });
    
    const colors = {
      director: '#FAAD14',
      president: '#722ED1',
      director_general: '#1677FF',
      manager: '#13C2C2',
      member: '#52C41A',
      normal: '#8C8C8C',
    };
    
    const pieData = Object.entries(CHANNEL_LEVELS)
      .filter(([key]) => levelCount[key])
      .map(([key, val]) => ({
        value: levelCount[key],
        name: val.label,
        itemStyle: { color: colors[key as keyof typeof colors] },
      }));
    
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'center' },
      series: [
        {
          name: '渠道等级',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
          },
          data: pieData,
        },
      ],
    };
  }, [data]);

  // 业绩排行榜数据
  const performanceRanking = useMemo(() => {
    const channels = data?.items || mockChannels;
    return [...channels]
      .sort((a, b) => b.monthPerformance - a.monthPerformance)
      .slice(0, 5);
  }, [data]);

  // 表格列定义
  const columns = [
    {
      title: '渠道ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => (
        <span className="font-mono text-gray-600">{text}</span>
      ),
    },
    {
      title: '渠道信息',
      key: 'channelInfo',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} size={40} />
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-gray-500 text-xs flex items-center gap-1">
              <PhoneOutlined style={{ fontSize: 10 }} />
              {record.phone}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '渠道等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level: string) => {
        const cfg = CHANNEL_LEVELS[level as keyof typeof CHANNEL_LEVELS];
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '团队人数',
      dataIndex: 'teamCount',
      key: 'teamCount',
      width: 110,
      render: (count: number) => (
        <Space>
          <TeamOutlined className="text-blue-500" />
          <span>{count}人</span>
        </Space>
      ),
    },
    {
      title: '累计业绩',
      dataIndex: 'totalPerformance',
      key: 'totalPerformance',
      width: 140,
      render: (amount: number) => (
        <span className="font-semibold">¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '本月业绩',
      dataIndex: 'monthPerformance',
      key: 'monthPerformance',
      width: 140,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
  ];

  // 操作按钮
  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedChannel(record);
        setActiveTab('basic');
        setDetailModalVisible(true);
      },
    },
    {
      key: 'adjust-level',
      label: '调整等级',
      icon: <EditOutlined />,
      onClick: (record: any) => {
        setSelectedChannel(record);
        levelForm.setFieldsValue({ level: record.level });
        setLevelModalVisible(true);
      },
    },
    {
      key: 'toggle-status',
      label: (record: any) => (record.status === 'active' ? '禁用' : '启用'),
      icon: (record: any) => (record.status === 'active' ? <StopOutlined /> : <PlayCircleOutlined />),
      danger: (record: any) => record.status === 'active',
      confirm: (record: any) => ({
        title: record.status === 'active' ? '确定要禁用该渠道吗？' : '确定要启用该渠道吗？',
        description: record.status === 'active'
          ? '禁用后该渠道将无法登录和获取分润'
          : '启用后该渠道将恢复所有权限',
        onConfirm: () => {
          toggleStatusMutation.mutate({
            id: record.id,
            status: record.status === 'active' ? 'inactive' : 'active',
          });
        },
      }),
    },
    {
      key: 'view-team',
      label: '查看团队',
      icon: <TeamOutlined />,
      onClick: (record: any) => {
        setSelectedChannel(record);
        setTeamModalVisible(true);
      },
    },
  ];

  // 等级筛选选项
  const levelFilterOptions = [
    { label: '全部等级', value: '' },
    { label: '董事', value: 'director' },
    { label: '总裁', value: 'president' },
    { label: '总监', value: 'director_general' },
    { label: '经理', value: 'manager' },
    { label: '会员', value: 'member' },
    { label: '普通', value: 'normal' },
  ];

  // 状态筛选选项
  const statusFilterOptions = [
    { label: '全部状态', value: '' },
    { label: '正常', value: 'active' },
    { label: '禁用', value: 'inactive' },
  ];

  // 详情弹窗 Tab 配置
  const detailTabs = [
    {
      key: 'basic',
      label: '基本信息',
    },
    {
      key: 'team',
      label: '团队结构',
    },
    {
      key: 'performance',
      label: '业绩数据',
    },
    {
      key: 'profit',
      label: '分润记录',
    },
  ];

  // 分润记录表格列
  const profitColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => <span className="text-green-600 font-semibold">¥{v.toLocaleString()}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === '已结算' ? 'green' : 'orange'}>{v}</Tag>
      ),
    },
  ];

  // 团队成员表格列
  const teamColumns = [
    {
      title: '成员',
      key: 'member',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const cfg = CHANNEL_LEVELS[level as keyof typeof CHANNEL_LEVELS];
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '加入时间', dataIndex: 'joinDate', key: 'joinDate' },
    {
      title: '个人业绩',
      dataIndex: 'performance',
      key: 'performance',
      render: (v: number) => <span>¥{v.toLocaleString()}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : 'red'}>
          {v === 'active' ? '活跃' : '不活跃'}
        </Tag>
      ),
    },
  ];

  const handleAddChannel = () => {
    addForm.validateFields().then(values => {
      addChannelMutation.mutate(values);
    });
  };

  const handleAdjustLevel = () => {
    levelForm.validateFields().then(values => {
      adjustLevelMutation.mutate({
        id: selectedChannel?.id,
        level: values.level,
      });
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold m-0">福建老酒渠道中心</h1>
            <p className="text-gray-500 m-0 mt-1">渠道分销管理 · 等级体系 · 业绩分润</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
            >
              新增渠道
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="渠道总数"
              value={stats.totalChannels}
              suffix="个"
              icon={<TeamOutlined />}
              color="#1677FF"
              description="全部注册渠道"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="总团队人数"
              value={stats.totalTeamCount}
              suffix="人"
              icon={<UserOutlined />}
              color="#722ED1"
              description="所有渠道团队成员"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="本月新增渠道"
              value={stats.newThisMonth}
              suffix="个"
              icon={<RiseOutlined />}
              color="#52C41A"
              trend="up"
              trendValue="12%"
              description="较上月增长"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="本月销售额"
              value={stats.monthPerformance.toLocaleString()}
              prefix="¥"
              icon={<DollarOutlined />}
              color="#13C2C2"
              trend="up"
              trendValue="8.5%"
              description="较上月增长"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="总销售额"
              value={stats.totalPerformance.toLocaleString()}
              prefix="¥"
              icon={<WalletOutlined />}
              color="#FAAD14"
              description="累计销售总额"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <DataCard
              title="待结算分润"
              value={stats.pendingProfit.toLocaleString()}
              prefix="¥"
              icon={<ArrowUpOutlined />}
              color="#F5222D"
              description="待发放渠道分润"
            />
          </Col>
        </Row>

        {/* 图表区域：等级分布 + 业绩排行 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="渠道等级分布" className="h-full">
              <SafeECharts
                option={levelDistributionOption}
                style={{ height: 320 }}
                title="渠道等级分布"
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="本月业绩排行榜 TOP5" className="h-full">
              <List
                dataSource={performanceRanking}
                renderItem={(item: any, index) => {
                  const rankColors = ['#FAAD14', '#8C8C8C', '#D48806', '#52C41A', '#1677FF'];
                  const bgColors = ['#FFFBE6', '#FAFAFA', '#FFF7E6', '#F6FFED', '#E6F4FF'];
                  const cfg = CHANNEL_LEVELS[item.level as keyof typeof CHANNEL_LEVELS];
                  
                  return (
                    <List.Item key={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                            style={{ backgroundColor: rankColors[index] }}
                          >
                            {index + 1}
                          </div>
                          <Avatar src={item.avatar} size={36} />
                          <div>
                            <div className="font-semibold">{item.name}</div>
                            <div className="text-xs text-gray-500">
                              <Tag color={cfg.color} style={{ marginRight: 4 }}>
                                {cfg.label}
                              </Tag>
                              {item.teamCount}人团队
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ¥{item.monthPerformance.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">本月业绩</div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 渠道列表表格 */}
        <DataTable
          title="渠道列表"
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索渠道ID、名称或手机号"
          onSearch={setSearchKeyword}
          showFilter
          filterOptions={levelFilterOptions}
          onFilter={setLevelFilter}
          showAdd={false}
          actions={actions}
          rowKey="id"
          onRefresh={() => refetch()}
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条渠道记录`,
          }}
        />

        {/* 渠道详情弹窗 */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <Avatar src={selectedChannel?.avatar} size={40} />
              <div>
                <div className="font-bold text-lg">{selectedChannel?.name}</div>
                <div className="text-xs text-gray-500">渠道ID: {selectedChannel?.id}</div>
              </div>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
            <Button key="edit" type="primary">
              编辑渠道
            </Button>,
          ]}
          width={900}
          destroyOnClose
        >
          {selectedChannel && (
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={detailTabs} />
          )}

          {selectedChannel && activeTab === 'basic' && (
            <div className="pt-4 space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="渠道ID">{selectedChannel.id}</Descriptions.Item>
                <Descriptions.Item label="渠道等级">
                  <Tag
                    color={CHANNEL_LEVELS[selectedChannel.level as keyof typeof CHANNEL_LEVELS].color}
                    icon={CHANNEL_LEVELS[selectedChannel.level as keyof typeof CHANNEL_LEVELS].icon}
                  >
                    {CHANNEL_LEVELS[selectedChannel.level as keyof typeof CHANNEL_LEVELS].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="姓名">{selectedChannel.name}</Descriptions.Item>
                <Descriptions.Item label="手机号">{selectedChannel.phone}</Descriptions.Item>
                <Descriptions.Item label="身份证">
                  <span className="flex items-center gap-1">
                    <IdcardOutlined />
                    {selectedChannel.idCard}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="联系地址">{selectedChannel.address}</Descriptions.Item>
                <Descriptions.Item label="加入时间">
                  <span className="flex items-center gap-1">
                    <IdcardOutlined />
                    {selectedChannel.joinDate}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="等级晋升时间">{selectedChannel.levelUpTime}</Descriptions.Item>
                <Descriptions.Item label="银行卡">{selectedChannel.bankCard}</Descriptions.Item>
                <Descriptions.Item label="开户银行">{selectedChannel.bankName}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="团队人数">
                  <span className="text-lg font-bold text-blue-600">{selectedChannel.teamCount}人</span>
                </Descriptions.Item>
                <Descriptions.Item label="直推人数">
                  <span className="text-lg font-bold text-purple-600">{selectedChannel.directInvites}人</span>
                </Descriptions.Item>
                <Descriptions.Item label="账户状态">
                  <Tag color={selectedChannel.status === 'active' ? 'green' : 'red'}>
                    {selectedChannel.status === 'active' ? '正常' : '禁用'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          {selectedChannel && activeTab === 'team' && (
            <div className="pt-4">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <Row gutter={16}>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">团队总人数</div>
                    <div className="text-xl font-bold text-blue-600">{selectedChannel.teamCount}人</div>
                  </Col>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">直推人数</div>
                    <div className="text-xl font-bold text-purple-600">{selectedChannel.directInvites}人</div>
                  </Col>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">团队层级</div>
                    <div className="text-xl font-bold text-green-600">5层</div>
                  </Col>
                </Row>
              </div>
              <Table
                columns={teamColumns}
                dataSource={mockTeamMembers}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          )}

          {selectedChannel && activeTab === 'performance' && (
            <div className="pt-4 space-y-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="本月业绩">
                    <div className="text-2xl font-bold text-green-600">
                      ¥{selectedChannel.monthPerformance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">较上月 +12.5%</div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="累计业绩">
                    <div className="text-2xl font-bold text-blue-600">
                      ¥{selectedChannel.totalPerformance.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">自加入以来</div>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="近6个月业绩趋势">
                <SafeECharts
                  option={{
                    tooltip: { trigger: 'axis' },
                    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
                    },
                    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
                    series: [
                      {
                        name: '业绩',
                        type: 'line',
                        smooth: true,
                        data: [45000, 52000, 68000, 82000, 95000, selectedChannel.monthPerformance],
                        itemStyle: { color: '#1677FF' },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(22, 119, 255, 0.4)' },
                              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
                            ],
                          },
                        },
                      },
                    ],
                  }}
                  style={{ height: 250 }}
                  title="业绩趋势"
                />
              </Card>
            </div>
          )}

          {selectedChannel && activeTab === 'profit' && (
            <div className="pt-4 space-y-4">
              <Row gutter={16}>
                <Col span={8}>
                  <Card size="small">
                    <div className="text-gray-500 text-sm">累计分润</div>
                    <div className="text-xl font-bold text-green-600">
                      ¥{selectedChannel.totalProfit.toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <div className="text-gray-500 text-sm">已结算</div>
                    <div className="text-xl font-bold text-blue-600">
                      ¥{(selectedChannel.totalProfit - selectedChannel.pendingProfit).toLocaleString()}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <div className="text-gray-500 text-sm">待结算</div>
                    <div className="text-xl font-bold text-orange-600">
                      ¥{selectedChannel.pendingProfit.toLocaleString()}
                    </div>
                  </Card>
                </Col>
              </Row>

              <Table
                columns={profitColumns}
                dataSource={mockProfitRecords}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5, size: 'small' }}
              />
            </div>
          )}
        </Modal>

        {/* 新增渠道弹窗 */}
        <Modal
          title="新增渠道"
          open={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            addForm.resetFields();
          }}
          onOk={handleAddChannel}
          okText="创建"
          confirmLoading={addChannelMutation.isPending}
          width={600}
        >
          <Form form={addForm} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="渠道姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[{ required: true, message: '请输入手机号' }]}
                >
                  <Input placeholder="请输入手机号" maxLength={11} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="level"
                  label="渠道等级"
                  rules={[{ required: true, message: '请选择等级' }]}
                  initialValue="normal"
                >
                  <Select placeholder="请选择等级">
                    {Object.entries(CHANNEL_LEVELS).map(([key, val]) => (
                      <Option key={key} value={key}>
                        {val.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="idCard"
                  label="身份证号"
                  rules={[{ required: true, message: '请输入身份证号' }]}
                >
                  <Input placeholder="请输入身份证号" maxLength={18} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="address" label="联系地址">
              <Input placeholder="请输入联系地址" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="bankCard" label="银行卡号">
                  <Input placeholder="请输入银行卡号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="bankName" label="开户银行">
                  <Input placeholder="请输入开户银行" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="inviterId"
              label="上级推荐人ID"
              extra="填写后自动建立团队关系"
            >
              <Input placeholder="请输入上级渠道ID，选填" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 调整等级弹窗 */}
        <Modal
          title="调整渠道等级"
          open={levelModalVisible}
          onCancel={() => setLevelModalVisible(false)}
          onOk={handleAdjustLevel}
          okText="确认调整"
          confirmLoading={adjustLevelMutation.isPending}
          width={500}
        >
          {selectedChannel && (
            <div className="py-4">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={selectedChannel.avatar} size={40} />
                  <div>
                    <div className="font-semibold">{selectedChannel.name}</div>
                    <div className="text-sm text-gray-500">{selectedChannel.id}</div>
                  </div>
                </div>
                <div className="text-sm">
                  当前等级：
                  <Tag
                    color={CHANNEL_LEVELS[selectedChannel.level as keyof typeof CHANNEL_LEVELS].color}
                  >
                    {CHANNEL_LEVELS[selectedChannel.level as keyof typeof CHANNEL_LEVELS].label}
                  </Tag>
                </div>
              </div>

              <Form form={levelForm} layout="vertical">
                <Form.Item
                  name="level"
                  label="调整后等级"
                  rules={[{ required: true, message: '请选择等级' }]}
                >
                  <Select placeholder="请选择新的等级">
                    {Object.entries(CHANNEL_LEVELS).map(([key, val]) => (
                      <Option key={key} value={key}>
                        {val.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="reason" label="调整原因">
                  <Input.TextArea
                    rows={3}
                    placeholder="请输入等级调整原因（选填）"
                    maxLength={200}
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>

        {/* 查看团队弹窗 */}
        <Modal
          title={`团队成员 - ${selectedChannel?.name}`}
          open={teamModalVisible}
          onCancel={() => setTeamModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setTeamModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={800}
        >
          {selectedChannel && (
            <div className="pt-2">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <Row gutter={16}>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">团队总人数</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedChannel.teamCount} 人
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">直推成员</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedChannel.directInvites} 人
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-gray-500 text-sm">团队总业绩</div>
                    <div className="text-2xl font-bold text-green-600">
                      ¥{selectedChannel.totalPerformance.toLocaleString()}
                    </div>
                  </Col>
                </Row>
              </div>
              <Table
                columns={teamColumns}
                dataSource={mockTeamMembers}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
