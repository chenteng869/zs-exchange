'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic, Tabs } from 'antd';
import { VideoCameraOutlined, PlusOutlined, EditOutlined, EyeOutlined, TrophyOutlined, UserOutlined, PlayCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockGames = [
  { id: '1', name: '国学知识竞答', type: 'quiz', status: 'active', players: 12500, totalMatches: 5600, prizePool: 50000, createdAt: '2024-05-01' },
  { id: '2', name: '成语接龙大赛', type: 'chain', status: 'active', players: 8900, totalMatches: 3200, prizePool: 30000, createdAt: '2024-04-15' },
  { id: '3', name: '诗词大会', type: 'poem', status: 'maintenance', players: 0, totalMatches: 0, prizePool: 0, createdAt: '2024-06-01' },
  { id: '4', name: '围棋挑战赛', type: 'board', status: 'ended', players: 2300, totalMatches: 890, prizePool: 20000, createdAt: '2024-03-01' },
];

const mockTournaments = [
  { id: '1', gameId: '1', name: '每日知识竞赛', status: 'ongoing', participants: 1500, prizePool: 5000, startDate: '2024-05-13', endDate: '2024-05-13' },
  { id: '2', gameId: '1', name: '周末大师赛', status: 'upcoming', participants: 0, prizePool: 10000, startDate: '2024-05-18', endDate: '2024-05-19' },
  { id: '3', gameId: '2', name: '成语王者争霸', status: 'ended', participants: 2000, prizePool: 8000, startDate: '2024-05-05', endDate: '2024-05-05' },
];

const mockLeaderboard = [
  { id: '1', rank: 1, username: '国学达人', userId: 'user_001', score: 12500, wins: 89, avatar: 'https://via.placeholder.com/40' },
  { id: '2', rank: 2, username: '诗词王子', userId: 'user_002', score: 11800, wins: 82, avatar: 'https://via.placeholder.com/40' },
  { id: '3', rank: 3, username: '成语大师', userId: 'user_003', score: 10500, wins: 75, avatar: 'https://via.placeholder.com/40' },
  { id: '4', rank: 4, username: '围棋圣手', userId: 'user_004', score: 9800, wins: 68, avatar: 'https://via.placeholder.com/40' },
  { id: '5', rank: 5, username: '历史学者', userId: 'user_005', score: 9200, wins: 62, avatar: 'https://via.placeholder.com/40' },
];

const gameActivityOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'] },
  yAxis: { type: 'value', name: '在线玩家' },
  series: [
    { type: 'line', smooth: true, data: [200, 150, 300, 800, 1200, 900], areaStyle: { color: 'rgba(24, 144, 255, 0.3)' }, itemStyle: { color: '#1677FF' }, name: '在线玩家' },
  ],
};

export default function GamesPage() {
  const [isGameModalVisible, setIsGameModalVisible] = useState(false);
  const [isTournamentModalVisible, setIsTournamentModalVisible] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [editingTournament, setEditingTournament] = useState<any>(null);
  const [form] = Form.useForm();
  const [tournamentForm] = Form.useForm();

  const gameTypeColors = {
    quiz: 'blue',
    chain: 'green',
    poem: 'purple',
    board: 'orange',
  };

  const gameTypeLabels = {
    quiz: '知识问答',
    chain: '接龙游戏',
    poem: '诗词大会',
    board: '棋类游戏',
  };

  const gameColumns = [
    { title: '游戏名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { 
      title: '游戏类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => <Tag color={gameTypeColors[type as keyof typeof gameTypeColors]}>{gameTypeLabels[type as keyof typeof gameTypeLabels]}</Tag>,
    },
    { title: '玩家数', dataIndex: 'players', key: 'players', render: (val: number) => val.toLocaleString() },
    { title: '对局数', dataIndex: 'totalMatches', key: 'totalMatches', render: (val: number) => val.toLocaleString() },
    { title: '奖池', dataIndex: 'prizePool', key: 'prizePool', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
          active: { color: 'success', label: '运行中' },
          maintenance: { color: 'warning', label: '维护中' },
          ended: { color: 'default', label: '已结束' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditGame(record)}>编辑</Button>
          {record.status === 'active' ? (
            <Button type="link" size="small" danger>维护</Button>
          ) : record.status === 'maintenance' ? (
            <Button type="link" size="small">上线</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const tournamentColumns = [
    { title: '赛事名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-purple-600">{text}</span> },
    { title: '参与人数', dataIndex: 'participants', key: 'participants', render: (val: number) => val.toLocaleString() },
    { title: '奖池', dataIndex: 'prizePool', key: 'prizePool', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '时间', 
      key: 'time', 
      render: (_: any, record: any) => (
        <div>
          <div className="text-sm">开始: {record.startDate}</div>
          <div className="text-sm text-gray-500">结束: {record.endDate}</div>
        </div>
      ),
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default'; label: string }> = {
          ongoing: { color: 'success', label: '进行中' },
          upcoming: { color: 'warning', label: '即将开始' },
          ended: { color: 'default', label: '已结束' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<TrophyOutlined />}>排行榜</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditTournament(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const leaderboardColumns = [
    { 
      title: '排名', 
      dataIndex: 'rank', 
      key: 'rank', 
      width: 80, 
      render: (val: number) => {
        const colors = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' };
        return (
          <div className="flex items-center justify-center">
            <span 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: colors[val as keyof typeof colors] || '#1677FF' }}
            >
              {val}
            </span>
          </div>
        );
      },
    },
    { 
      title: '玩家', 
      key: 'player', 
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <img src={record.avatar} className="w-8 h-8 rounded-full" />
          <span>{record.username}</span>
        </div>
      ),
    },
    { title: '积分', dataIndex: 'score', key: 'score', render: (val: number) => val.toLocaleString() },
    { title: '胜场', dataIndex: 'wins', key: 'wins', render: (val: number) => val.toLocaleString() },
  ];

  const handleAddGame = () => {
    setEditingGame(null);
    form.resetFields();
    setIsGameModalVisible(true);
  };

  const handleEditGame = (record: any) => {
    setEditingGame(record);
    form.setFieldsValue(record);
    setIsGameModalVisible(true);
  };

  const handleAddTournament = () => {
    setEditingTournament(null);
    tournamentForm.resetFields();
    setIsTournamentModalVisible(true);
  };

  const handleEditTournament = (record: any) => {
    setEditingTournament(record);
    tournamentForm.setFieldsValue(record);
    setIsTournamentModalVisible(true);
  };

  const handleSaveGame = () => {
    form.validateFields().then(() => {
      Modal.success({ title: '操作成功', content: editingGame ? '游戏已更新！' : '游戏已创建！' });
      setIsGameModalVisible(false);
    });
  };

  const handleSaveTournament = () => {
    tournamentForm.validateFields().then(() => {
      Modal.success({ title: '操作成功', content: editingTournament ? '赛事已更新！' : '赛事已创建！' });
      setIsTournamentModalVisible(false);
    });
  };

  const totalGames = mockGames.length;
  const activeGames = mockGames.filter(g => g.status === 'active').length;
  const totalPlayers = mockGames.reduce((sum, g) => sum + g.players, 0);
  const totalPrizePool = mockGames.reduce((sum, g) => sum + g.prizePool, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VideoCameraOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">竞技游戏</h1>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddGame}>创建游戏</Button>
            <Button icon={<PlusOutlined />} onClick={handleAddTournament}>创建赛事</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="游戏总数" value={totalGames} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">竞技游戏数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="运行中" value={activeGames} suffix={`/${totalGames}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃游戏数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总玩家" value={totalPlayers.toLocaleString()} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">累计参与玩家</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总奖池" value={(totalPrizePool / 10000).toFixed(2)} prefix="$" suffix="万" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">所有游戏累计</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="玩家活跃度">
              <SafeECharts option={gameActivityOption} style={{ height: 250 }} title="玩家活跃度" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="games">
          <TabPane tab="游戏管理" key="games">
            <Card>
              <Table
                dataSource={mockGames}
                columns={gameColumns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
          <TabPane tab="赛事管理" key="tournaments">
            <Card>
              <Table
                dataSource={mockTournaments}
                columns={tournamentColumns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
          <TabPane tab="排行榜" key="leaderboard">
            <Card title="总排行榜">
              <Table
                dataSource={mockLeaderboard}
                columns={leaderboardColumns}
                pagination={{ pageSize: 20 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title={editingGame ? '编辑游戏' : '创建游戏'}
          open={isGameModalVisible}
          onOk={handleSaveGame}
          onCancel={() => setIsGameModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="游戏名称" name="name" rules={[{ required: true, message: '请输入游戏名称' }]}>
              <Input placeholder="例如：国学知识竞答" />
            </Form.Item>
            <Form.Item label="游戏类型" name="type" rules={[{ required: true, message: '请选择游戏类型' }]}>
              <Select placeholder="选择游戏类型">
                <Option value="quiz">知识问答</Option>
                <Option value="chain">接龙游戏</Option>
                <Option value="poem">诗词大会</Option>
                <Option value="board">棋类游戏</Option>
              </Select>
            </Form.Item>
            <Form.Item label="初始奖池($)" name="prizePool">
              <InputNumber placeholder="初始奖池" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="游戏描述">
              <Input.TextArea rows={3} placeholder="请输入游戏描述..." />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={editingTournament ? '编辑赛事' : '创建赛事'}
          open={isTournamentModalVisible}
          onOk={handleSaveTournament}
          onCancel={() => setIsTournamentModalVisible(false)}
          width={600}
        >
          <Form form={tournamentForm} layout="vertical">
            <Form.Item label="赛事名称" name="name" rules={[{ required: true, message: '请输入赛事名称' }]}>
              <Input placeholder="例如：每日知识竞赛" />
            </Form.Item>
            <Form.Item label="关联游戏" name="gameId" rules={[{ required: true, message: '请选择关联游戏' }]}>
              <Select placeholder="选择游戏">
                {mockGames.map(game => (
                  <Option key={game.id} value={game.id}>{game.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="奖池($)" name="prizePool" rules={[{ required: true, message: '请输入奖池金额' }]}>
              <InputNumber placeholder="奖池金额" style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="开始时间" name="startDate" rules={[{ required: true, message: '请选择开始时间' }]}>
                  <Input type="datetime-local" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="结束时间" name="endDate" rules={[{ required: true, message: '请选择结束时间' }]}>
                  <Input type="datetime-local" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
