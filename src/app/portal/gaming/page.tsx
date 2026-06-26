'use client';

import { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Tag, Button, Input, Rate, Tabs, List, Avatar, Badge } from 'antd';
import {
  TrophyOutlined,
  SearchOutlined,
  HeartOutlined,
  StarOutlined,
  BarChartOutlined,
  TeamOutlined,
  CalendarOutlined,
  RightOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

const categories = [
  { id: 'all', name: '全部游戏' },
  { id: 'action', name: '动作游戏' },
  { id: 'rpg', name: '角色扮演' },
  { id: 'strategy', name: '策略游戏' },
  { id: 'mmo', name: '大型网游' },
];

const games = [
  {
    id: '1',
    title: '山海经：异兽传说',
    category: 'mmo',
    rating: 9.2,
    players: 500000,
    status: 'online',
    image: '🐉',
    tags: ['热门', '国创'],
    description: '以山海经为背景的大型MMORPG游戏',
  },
  {
    id: '2',
    title: '三国风云',
    category: 'strategy',
    rating: 8.9,
    players: 320000,
    status: 'online',
    image: '⚔️',
    tags: ['策略', '历史'],
    description: '三国题材策略对战游戏',
  },
  {
    id: '3',
    title: '江湖侠客行',
    category: 'rpg',
    rating: 9.1,
    players: 450000,
    status: 'online',
    image: '🗡️',
    tags: ['武侠', 'RPG'],
    description: '经典武侠题材角色扮演游戏',
  },
  {
    id: '4',
    title: '机甲战神',
    category: 'action',
    rating: 8.7,
    players: 280000,
    status: 'online',
    image: '🤖',
    tags: ['机甲', '动作'],
    description: '热血机甲战斗游戏',
  },
  {
    id: '5',
    title: '修仙模拟器',
    category: 'rpg',
    rating: 9.0,
    players: 380000,
    status: 'online',
    image: '☁️',
    tags: ['修仙', '放置'],
    description: '轻松有趣的修仙放置游戏',
  },
  {
    id: '6',
    title: '帝国荣耀',
    category: 'strategy',
    rating: 8.8,
    players: 250000,
    status: 'maintenance',
    image: '🏰',
    tags: ['帝国', '策略'],
    description: '帝国建造与征战策略游戏',
  },
];

const news = [
  {
    id: '1',
    title: '《山海经》新版本上线，新增三大神兽',
    date: '2024-01-15',
    category: '游戏新闻',
    views: 12580,
    image: '🔥',
  },
  {
    id: '2',
    title: '电竞世界杯中国战队夺冠',
    date: '2024-01-14',
    category: '电竞资讯',
    views: 8920,
    image: '🏆',
  },
  {
    id: '3',
    title: '《江湖侠客行》新资料片即将开启',
    date: '2024-01-13',
    category: '游戏更新',
    views: 6540,
    image: '🗡️',
  },
];

const reviews = [
  {
    id: '1',
    game: '山海经：异兽传说',
    user: '玩家小明',
    rating: 5,
    content: '画面精美，玩法丰富，非常值得一玩！',
    date: '2024-01-15',
  },
  {
    id: '2',
    game: '江湖侠客行',
    user: '武侠迷',
    rating: 5,
    content: '武侠氛围浓厚，剧情精彩，推荐！',
    date: '2024-01-14',
  },
];

const tournaments = [
  { id: '1', name: '王者荣耀职业联赛', participants: 16, prize: '¥100万', status: 'ongoing' },
  { id: '2', name: '英雄联盟全国赛', participants: 32, prize: '¥50万', status: 'upcoming' },
];

export default function GamingPage() {
  const [searchQuery, setSearchOutlinedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = games.filter((game) => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearchOutlined = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearchOutlined;
  });

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <Header className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl" />
            <span className="text-xl font-bold">游戏世界</span>
          </div>

          <Menu mode="horizontal" className="flex-1 justify-center">
            {categories.map((cat) => (
              <Menu.Item key={cat.id}>{cat.name}</Menu.Item>
            ))}
          </Menu>

          <Input
            placeholder="搜索游戏..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchOutlinedQuery(e.target.value)}
            style={{ width: 200, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none' }}
          />
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">畅玩游戏世界</h1>
          <p className="text-lg opacity-90">海量精品游戏，等你来战！</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <TrophyOutlined className="text-4xl text-yellow-500 mb-2" />
            <div className="text-2xl font-bold">128</div>
            <div className="text-gray-500">游戏总数</div>
          </Card>
          <Card className="text-center">
            <TeamOutlined className="text-4xl text-blue-500 mb-2" />
            <div className="text-2xl font-bold">250万</div>
            <div className="text-gray-500">活跃玩家</div>
          </Card>
          <Card className="text-center">
            <StarOutlined className="text-4xl text-orange-500 mb-2" />
            <div className="text-2xl font-bold">9.2</div>
            <div className="text-gray-500">平均评分</div>
          </Card>
          <Card className="text-center">
            <CalendarOutlined className="text-4xl text-green-500 mb-2" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-gray-500">本月活动</div>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrophyOutlined className="text-indigo-600" />
            热门游戏
          </h2>
          <Button type="link" icon={<RightOutlined />}>查看全部</Button>
        </div>

        <Row gutter={[16, 16]} className="mb-8">
          {filteredGames.map((game) => (
            <Col xs={24} sm={12} md={8} key={game.id}>
              <Card
                hoverable
                className="cursor-pointer"
                cover={
                  <div className="h-40 bg-gradient-to-br from-indigo-200 to-blue-200 flex items-center justify-center text-5xl relative">
                    {game.image}
                    <Badge
                      status={game.status === 'online' ? 'success' : 'warning'}
                      text={game.status === 'online' ? '在线' : '维护中'}
                      className="absolute top-2 right-2"
                    />
                  </div>
                }
              >
                <Card.Meta
                  title={game.title}
                  description={
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Rate disabled defaultValue={game.rating} allowHalf className="text-sm" />
                          <span className="text-sm font-bold">{game.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {game.players.toLocaleString()} 在线
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{game.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {game.tags.map((tag) => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
                <Button type="primary" className="w-full mt-3">
                  {game.status === 'online' ? '开始游戏' : '敬请期待'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">游戏新闻</h2>
            <Card>
              <List
                dataSource={news}
                renderItem={(item) => (
                  <List.Item
                    extra={<Button type="link">阅读</Button>}
                  >
                    <List.Item.Meta
                      avatar={<Avatar>{item.image}</Avatar>}
                      title={item.title}
                      description={
                        <div className="flex items-center gap-4">
                          <Tag color="blue">{item.category}</Tag>
                          <span className="text-gray-500">{item.date}</span>
                          <span className="text-gray-500">{item.views.toLocaleString()} 阅读</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">赛事信息</h2>
            <Card>
              <div className="space-y-4">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-bold">{tournament.name}</h3>
                      <p className="text-sm text-gray-500">{tournament.participants} 支队伍</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">{tournament.prize}</div>
                      <Tag color={tournament.status === 'ongoing' ? 'green' : 'orange'}>
                        {tournament.status === 'ongoing' ? '进行中' : '即将开始'}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <h2 className="text-2xl font-bold mb-4 mt-8">玩家评测</h2>
            <Card>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{review.game}</span>
                      <Rate disabled defaultValue={review.rating} />
                    </div>
                    <p className="text-gray-600 text-sm">{review.content}</p>
                    <div className="text-xs text-gray-500">
                      {review.user} · {review.date}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
}
