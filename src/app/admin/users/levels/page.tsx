'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Progress, Switch } from 'antd';
import { TrophyOutlined, PlusOutlined, EditOutlined, UserOutlined, ArrowUpOutlined, SettingOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockLevels = [
  { id: '1', name: '普通会员', level: 'LV1', minPoints: 0, maxPoints: 999, discount: 0, feeRate: 0.2, benefits: ['基础功能', '每日签到'], userCount: 15800, status: 'active', icon: '🥉', color: '#d9d9d9' },
  { id: '2', name: '白银会员', level: 'LV2', minPoints: 1000, maxPoints: 4999, discount: 5, feeRate: 0.18, benefits: ['LV1权益', '交易手续费折扣', '专属客服'], userCount: 3200, status: 'active', icon: '🥈', color: '#c0c0c0' },
  { id: '3', name: '黄金会员', level: 'LV3', minPoints: 5000, maxPoints: 19999, discount: 10, feeRate: 0.15, benefits: ['LV2权益', '优先提现', '生日礼包', '专属活动'], userCount: 850, status: 'active', icon: '🥇', color: '#ffd700' },
  { id: '4', name: '铂金会员', level: 'LV4', minPoints: 20000, maxPoints: 49999, discount: 15, feeRate: 0.12, benefits: ['LV3权益', '专属理财', 'VIP通道', '定制服务'], userCount: 180, status: 'active', icon: '💎', color: '#e5e4e2' },
  { id: '5', name: '钻石会员', level: 'LV5', minPoints: 50000, maxPoints: 99999, discount: 20, feeRate: 0.1, benefits: ['LV4权益', '1对1顾问', '优先上币', '线下活动'], userCount: 45, status: 'active', icon: '💠', color: '#b9f2ff' },
  { id: '6', name: '皇冠会员', level: 'LV6', minPoints: 100000, maxPoints: null, discount: 25, feeRate: 0.08, benefits: ['LV5权益', '专属经理', '董事会列席', '定制权益'], userCount: 12, status: 'active', icon: '👑', color: '#ffd700' },
];


const levelDistributionOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [
    {
      name: '等级分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 15800, name: 'LV1', itemStyle: { color: '#d9d9d9' } },
        { value: 3200, name: 'LV2', itemStyle: { color: '#c0c0c0' } },
        { value: 850, name: 'LV3', itemStyle: { color: '#ffd700' } },
        { value: 180, name: 'LV4', itemStyle: { color: '#e5e4e2' } },
        { value: 45, name: 'LV5', itemStyle: { color: '#b9f2ff' } },
        { value: 12, name: 'LV6', itemStyle: { color: '#ffd700' } },
      ],
    },
  ],
};

const pointsTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-08', '05-09', '05-10', '05-11', '05-12', '05-13'] },
  yAxis: { type: 'value' },
  series: [
    { name: '新增积分', type: 'bar', data: [8500, 12000, 9500, 15000, 11000, 13500], itemStyle: { color: '#1677FF' } },
    { name: '消耗积分', type: 'line', data: [3200, 4500, 3800, 5200, 4100, 4800], itemStyle: { color: '#DC2626' } },
  ],
};

export default function UserLevelsPage() {
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('config');
  const [userLevels, setUserLevels] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);
    fetch('/api/admin/users?pageSize=100', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items = (d?.data?.items ?? []).map((u: any) => ({
          id: u.id,
          user: u.walletAddress || u.id.slice(0, 8) + '...' + u.id.slice(-4),
          username: u.username,
                    level: `LV${Math.max(1, u.userLevel || 1)}`,
          points: 0,
                    nextLevel: `LV${Math.min(6, Math.max(1, u.userLevel || 1) + 1)}`,
          pointsToNext: 0,
          registerDate: u.createdAt?.slice(0, 10) ?? '-',
          lastActive: u.updatedAt?.slice(0, 10) ?? '-',
          status: u.isActive ? 'active' : 'inactive',
        }));
        setUserLevels(items);
      })
      .catch(() => setUserLevels([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  const totalUsers = mockLevels.reduce((sum, l) => sum + l.userCount, 0);
  const avgLevel = 'LV2';

  const levelColumns = [
    { 
      title: '等级图标', 
      key: 'icon', 
      width: 80,
      render: (_: any, record: any) => (
        <div className="text-3xl">{record.icon}</div>
      ),
    },
    { title: '等级名称', dataIndex: 'name', key: 'name' },
    { title: '等级标识', dataIndex: 'level', key: 'level', render: (text: string) => <Tag color="orange">{text}</Tag> },
    { 
      title: '积分范围', 
      key: 'points', 
      render: (_: any, record: any) => (
        <span>{record.minPoints.toLocaleString()} - {record.maxPoints ? record.maxPoints.toLocaleString() : '∞'}</span>
      ),
    },
    { title: '手续费折扣', dataIndex: 'discount', key: 'discount', render: (val: number) => <span className="text-green-600">{val}%</span> },
    { title: '手续费率', dataIndex: 'feeRate', key: 'feeRate', render: (val: number) => <span>{val}%</span> },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount', render: (val: number) => val.toLocaleString() },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '启用' : '禁用'} />
      ),
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditLevel(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const userColumns = [
    { title: '用户地址', dataIndex: 'user', key: 'user', render: (text: string) => <span className="font-mono">{text}</span> },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { 
      title: '当前等级', 
      dataIndex: 'level', 
      key: 'level', 
      render: (text: string) => {
        const level = mockLevels.find(l => l.level === text);
        return (
          <Tag color={level?.color || 'orange'}>
            {level?.icon} {text}
          </Tag>
        );
      },
    },
    { 
      title: '当前积分', 
      dataIndex: 'points', 
      key: 'points', 
      render: (val: number, record: any) => {
        const level = mockLevels.find(l => l.level === record.level);
        const nextLevel = mockLevels.find(l => l.level === record.nextLevel);
        const total = nextLevel?.minPoints || val * 2;
        const percent = (val / total) * 100;
        return (
          <div>
            <div className="flex justify-between mb-1">
              <span>{val.toLocaleString()}</span>
              <span className="text-gray-400">{record.nextLevel} 还需 {record.pointsToNext.toLocaleString()}</span>
            </div>
            <Progress percent={percent} size="small" strokeColor="#1677FF" />
          </div>
        );
      },
    },
    { title: '注册时间', dataIndex: 'registerDate', key: 'registerDate' },
    { title: '最后活跃', dataIndex: 'lastActive', key: 'lastActive' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '活跃' : '休眠'} />,
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small">调整积分</Button>
          <Button type="link" size="small">变更等级</Button>
        </Space>
      ),
    },
  ];

  const handleAddLevel = () => {
    setEditingLevel(null);
    form.resetFields();
    setIsLevelModalVisible(true);
  };

  const handleEditLevel = (record: any) => {
    setEditingLevel(record);
    form.setFieldsValue(record);
    setIsLevelModalVisible(true);
  };

  const handleSaveLevel = () => {
    form.validateFields().then((values) => {
      Modal.success({
        title: editingLevel ? '等级更新成功' : '等级创建成功',
        content: '操作已完成！',
      });
      setIsLevelModalVisible(false);
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-yellow-600" />
            <h1 className="text-2xl font-bold m-0">等级管理</h1>
          </div>
          <Space>
            <Button icon={<SettingOutlined />}>系统设置</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总用户数" value={totalUsers} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">平台用户总数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="等级数量" value={mockLevels.length} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">当前等级体系</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="平均等级" value={avgLevel} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">用户平均等级</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="最高等级用户" value={mockLevels[mockLevels.length - 1].userCount} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">LV6 用户数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="用户等级分布">
              <SafeECharts option={levelDistributionOption} style={{ height: 300 }} title="用户等级分布" />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="积分趋势">
              <SafeECharts option={pointsTrendOption} style={{ height: 300 }} title="积分趋势" />
            </Card>
          </Col>
        </Row>

        <Card
          tabList={[
            { key: 'config', tab: '等级配置' },
            { key: 'users', tab: '用户等级' },
          ]}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
          extra={
            activeTab === 'config' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLevel}>
                新增等级
              </Button>
            )
          }
        >
          {activeTab === 'config' ? (
            <Table
              dataSource={mockLevels}
              columns={levelColumns}
              pagination={false}
              rowKey="id"
            />
          ) : (
            <Table
              dataSource={userLevels}
            loading={loadingUsers}
              columns={userColumns}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          )}
        </Card>

        <Modal
          title={editingLevel ? '编辑等级' : '新增等级'}
          open={isLevelModalVisible}
          onOk={handleSaveLevel}
          onCancel={() => setIsLevelModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="等级标识" name="level" rules={[{ required: true }]}>
                  <Input placeholder="如：LV7" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="等级名称" name="name" rules={[{ required: true }]}>
                  <Input placeholder="如：至尊会员" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="最低积分" name="minPoints" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="最高积分" name="maxPoints">
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="不填表示无上限" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="手续费折扣(%)" name="discount" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} max={100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="手续费率(%)" name="feeRate" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="权益描述" name="benefits">
              <Input.TextArea rows={3} placeholder="请输入权益列表，用逗号分隔" />
            </Form.Item>
            <Form.Item label="状态" name="status" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
