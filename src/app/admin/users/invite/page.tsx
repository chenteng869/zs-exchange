'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Tree, Tabs, Descriptions } from 'antd';
import { UserAddOutlined, TeamOutlined, GiftOutlined, EyeOutlined, SearchOutlined, LinkOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockRewardRecords = [
  { id: '1', user: '0x1234...5678', username: '张三', amount: 150, type: 'direct_invite', invitee: '0xaaa...bbb', status: 'settled', createTime: '2024-05-13 10:30:00', settleTime: '2024-05-13 10:35:00' },
  { id: '2', user: '0x5678...9abc', username: '李四', amount: 80, type: 'indirect_invite', invitee: '0xccc...ddd', status: 'settled', createTime: '2024-05-12 14:20:00', settleTime: '2024-05-12 14:25:00' },
  { id: '3', user: '0x9abc...def0', username: '王五', amount: 200, type: 'trade_commission', invitee: '0xeee...fff', status: 'pending', createTime: '2024-05-13 08:15:00', settleTime: null },
  { id: '4', user: '0x1234...5678', username: '张三', amount: 120, type: 'trade_commission', invitee: '0xggg...hhh', status: 'settled', createTime: '2024-05-11 16:45:00', settleTime: '2024-05-11 16:50:00' },
  { id: '5', user: '0x2345...6789', username: '钱七', amount: 95, type: 'direct_invite', invitee: '0xiii...jjj', status: 'pending', createTime: '2024-05-13 09:00:00', settleTime: null },
];

const inviteTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['直接邀请', '间接邀请'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-08', '05-09', '05-10', '05-11', '05-12', '05-13'] },
  yAxis: { type: 'value' },
  series: [
    { name: '直接邀请', type: 'bar', data: [45, 52, 38, 65, 48, 55], itemStyle: { color: '#1677FF' } },
    { name: '间接邀请', type: 'bar', data: [88, 105, 76, 132, 95, 110], itemStyle: { color: '#16A34A' } },
  ],
};

const rewardDistributionOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [
    {
      name: '奖励类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      data: [
        { value: 45000, name: '直接邀请奖励', itemStyle: { color: '#1677FF' } },
        { value: 28000, name: '间接邀请奖励', itemStyle: { color: '#16A34A' } },
        { value: 32000, name: '交易返佣', itemStyle: { color: '#F59E0B' } },
      ],
    },
  ],
};

const inviteTreeData = [
  {
    title: '张三 (0x1234...5678)',
    key: '1',
    children: [
      {
        title: '小明 (0xaaa...bbb)',
        key: '1-1',
        children: [
          { title: '小红 (0x111...222)', key: '1-1-1' },
          { title: '小刚 (0x333...444)', key: '1-1-2' },
        ],
      },
      {
        title: '小美 (0xccc...ddd)',
        key: '1-2',
        children: [
          { title: '小强 (0x555...666)', key: '1-2-1' },
        ],
      },
    ],
  },
];

export default function InvitePage() {
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [inviteData, setInviteData] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  useEffect(() => {
    setLoadingInvites(true);
    fetch('/api/admin/users/invites?pageSize=100', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setInviteData(d?.data?.items ?? []))
      .catch(() => setInviteData([]))
      .finally(() => setLoadingInvites(false));
  }, []);

  

  const totalInvites = inviteData.reduce((sum, u) => sum + u.totalInvites, 0);
  const totalRewards = inviteData.reduce((sum, u) => sum + u.totalRewards, 0);
  const pendingRewards = inviteData.reduce((sum, u) => sum + u.pendingRewards, 0);
  const activeInviters = inviteData.filter(u => u.status === 'active').length;

  const userColumns = [
    { title: '用户地址', dataIndex: 'user', key: 'user', render: (text: string) => <span className="font-mono">{text}</span> },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邀请码', dataIndex: 'inviteCode', key: 'inviteCode', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '用户等级', dataIndex: 'level', key: 'level', render: (text: string) => <Tag color="orange">{text}</Tag> },
    { title: '直接邀请', dataIndex: 'directInvites', key: 'directInvites', render: (val: number) => <span className="text-blue-600">{val}</span> },
    { title: '间接邀请', dataIndex: 'indirectInvites', key: 'indirectInvites', render: (val: number) => <span className="text-green-600">{val}</span> },
    { title: '总邀请', dataIndex: 'totalInvites', key: 'totalInvites', render: (val: number) => <span className="font-semibold">{val}</span> },
    { title: '累计奖励', dataIndex: 'totalRewards', key: 'totalRewards', render: (val: number) => <span className="text-green-600">{val.toLocaleString()} USDT</span> },
    { title: '待发放', dataIndex: 'pendingRewards', key: 'pendingRewards', render: (val: number) => <span className="text-orange-600">{val.toLocaleString()} USDT</span> },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '活跃' : '禁用'} />,
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small">查看树</Button>
        </Space>
      ),
    },
  ];

  const rewardColumns = [
    { title: '奖励ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '奖励金额', dataIndex: 'amount', key: 'amount', render: (val: number) => <span className="text-green-600">{val} USDT</span> },
    { 
      title: '奖励类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const types = { direct_invite: '直接邀请', indirect_invite: '间接邀请', trade_commission: '交易返佣' };
        const colors = { direct_invite: 'blue', indirect_invite: 'green', trade_commission: 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{types[type as keyof typeof types]}</Tag>;
      },
    },
    { title: '被邀请人', dataIndex: 'invitee', key: 'invitee', render: (text: string) => <span className="font-mono text-gray-500">{text}</span> },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors = { settled: 'success', pending: 'warning' };
        const labels = { settled: '已发放', pending: '待发放' };
        const color = colors[status as keyof typeof colors] as 'success' | 'warning' | 'error' | 'default' | 'processing';
        return <Badge status={color} text={labels[status as keyof typeof labels]} />;
      },
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending' && <Button type="primary" size="small">发放</Button>}
        </Space>
      ),
    },
  ];

  const handleViewDetail = (record: any) => {
    setSelectedUser(record);
    setIsDetailModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAddOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">邀请关系</h1>
          </div>
          <Space>
            <Button icon={<SearchOutlined />}>搜索</Button>
            <Button icon={<LinkOutlined />}>生成邀请码</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总邀请数" value={totalInvites} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计邀请用户</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="活跃推广者" value={activeInviters} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃推广用户</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="累计发放奖励" value={totalRewards} suffix="USDT" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">已发放奖励总额</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待发放奖励" value={pendingRewards} suffix="USDT" valueStyle={{ color: '#DC2626' }} />
              <div className="text-gray-400 text-sm mt-1">待结算奖励</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="邀请趋势">
              <SafeECharts option={inviteTrendOption} style={{ height: 300 }} title="邀请趋势" />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="奖励类型分布">
              <SafeECharts option={rewardDistributionOption} style={{ height: 300 }} title="奖励类型分布" />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="邀请用户" key="users" />
            <TabPane tab="奖励记录" key="rewards" />
            <TabPane tab="邀请树" key="tree" />
          </Tabs>

          {activeTab === 'users' && (
            <Table
              dataSource={inviteData}
              loading={loadingInvites}
              columns={userColumns}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          )}

          {activeTab === 'rewards' && (
            <Table
              dataSource={mockRewardRecords}
              columns={rewardColumns}
              pagination={{ pageSize: 10 }}
              rowKey="id"
            />
          )}

          {activeTab === 'tree' && (
            <div className="p-4">
              <Card title="邀请关系树">
                <Tree
                  treeData={inviteTreeData}
                  defaultExpandAll
                  showLine={{ showLeafIcon: false }}
                />
              </Card>
            </div>
          )}
        </Card>

        <Modal
          title="用户邀请详情"
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsDetailModalVisible(false)}>关闭</Button>
          ]}
          width={800}
        >
          {selectedUser && (
            <div className="space-y-4">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
                <Descriptions.Item label="钱包地址">{selectedUser.user}</Descriptions.Item>
                <Descriptions.Item label="邀请码">{selectedUser.inviteCode}</Descriptions.Item>
                <Descriptions.Item label="用户等级">{selectedUser.level}</Descriptions.Item>
                <Descriptions.Item label="直接邀请" span={2}>{selectedUser.directInvites} 人</Descriptions.Item>
                <Descriptions.Item label="间接邀请" span={2}>{selectedUser.indirectInvites} 人</Descriptions.Item>
                <Descriptions.Item label="总邀请数" span={2}>{selectedUser.totalInvites} 人</Descriptions.Item>
                <Descriptions.Item label="累计奖励">{selectedUser.totalRewards} USDT</Descriptions.Item>
                <Descriptions.Item label="待发放奖励">{selectedUser.pendingRewards} USDT</Descriptions.Item>
              </Descriptions>

              <Card title="邀请关系树" size="small">
                <Tree
                  treeData={inviteTreeData}
                  defaultExpandAll
                  showLine={{ showLeafIcon: false }}
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
