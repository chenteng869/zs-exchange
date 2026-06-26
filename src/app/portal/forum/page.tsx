'use client';

import { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Tag, Button, Input, Modal, Form, Avatar, List } from 'antd';
import {
  MessageOutlined,
  SearchOutlined,
  HeartOutlined,
  ShareAltOutlined,
  RightOutlined,
  EditOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

const categories = [
  { id: 'all', name: '全部板块', count: 1258 },
  { id: 'culture', name: '文化讨论', count: 328 },
  { id: 'anime', name: '动漫交流', count: 456 },
  { id: 'gaming', name: '游戏讨论', count: 289 },
  { id: 'ecommerce', name: '购物分享', count: 185 },
];

const posts = [
  {
    id: '1',
    title: '《论语》中的智慧对现代生活的启示',
    author: '国学爱好者',
    avatar: '👨‍🏫',
    category: 'culture',
    replies: 128,
    views: 2560,
    likes: 345,
    time: '2小时前',
    tags: ['论语', '智慧', '现代'],
  },
  {
    id: '2',
    title: '《三国演义》动画版观后感',
    author: '动漫迷',
    avatar: '🎬',
    category: 'anime',
    replies: 89,
    views: 1890,
    likes: 234,
    time: '5小时前',
    tags: ['三国演义', '动画', '国漫'],
  },
  {
    id: '3',
    title: '《山海经》游戏新版本攻略分享',
    author: '游戏达人',
    avatar: '🎮',
    category: 'gaming',
    replies: 156,
    views: 3450,
    likes: 456,
    time: '昨天',
    tags: ['山海经', '攻略', '游戏'],
  },
  {
    id: '4',
    title: '汉服购买心得分享',
    author: '汉服爱好者',
    avatar: '👗',
    category: 'ecommerce',
    replies: 67,
    views: 1230,
    likes: 189,
    time: '昨天',
    tags: ['汉服', '购物', '分享'],
  },
  {
    id: '5',
    title: '讨论：庄子的逍遥境界',
    author: '哲学爱好者',
    avatar: '🧠',
    category: 'culture',
    replies: 78,
    views: 1560,
    likes: 267,
    time: '2天前',
    tags: ['庄子', '哲学', '逍遥'],
  },
];

const hotTopics = [
  { id: '1', title: '#国漫崛起# 话题讨论', posts: 528 },
  { id: '2', title: '#传统文化# 传承与创新', posts: 345 },
  { id: '3', title: '#游戏攻略# 分享交流', posts: 289 },
];

export default function ForumPage() {
  const [searchQuery, setSearchOutlinedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearchOutlined = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearchOutlined;
  });

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <MessageOutlined className="text-2xl text-blue-600" />
            <span className="text-xl font-bold">社区论坛</span>
          </div>

          <Input
            placeholder="搜索帖子..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchOutlinedQuery(e.target.value)}
            style={{ width: 300 }}
          />

          <Button type="primary" icon={<EditOutlined />} onClick={() => setModalVisible(true)}>
            发帖
          </Button>
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type={selectedCategory === cat.id ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.name} <span className="ml-1 text-sm opacity-70">({cat.count})</span>
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Card key={post.id} hoverable className="cursor-pointer">
                  <div className="flex gap-4">
                    <Avatar className="flex-shrink-0">{post.avatar}</Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg hover:text-blue-600">{post.title}</h3>
                        <Tag color="blue">{categories.find((c) => c.id === post.category)?.name}</Tag>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.map((tag) => (
                          <Tag key={tag} color="gray">{tag}</Tag>
                        ))}
                      </div>
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserOutlined />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined />
                          {post.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageOutlined />
                          {post.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <EyeOutlined />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <HeartOutlined />
                          {post.likes}
                        </span>
                      </div>
                    </div>
                    <RightOutlined className="text-gray-400" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card title="热门话题">
              <div className="space-y-3">
                {hotTopics.map((topic) => (
                  <div key={topic.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span>{topic.title}</span>
                    <Tag color="red">{topic.posts}</Tag>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="活跃用户" className="mt-4">
              <List
                dataSource={[
                  { name: '国学爱好者', posts: 128 },
                  { name: '动漫迷', posts: 96 },
                  { name: '游戏达人', posts: 87 },
                  { name: '汉服爱好者', posts: 65 },
                ]}
                renderItem={(item) => (
                  <List.Item className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Avatar icon={<UserOutlined />} />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{item.posts} 帖子</span>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="版规" className="mt-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 遵守社区规则</li>
                <li>• 尊重他人观点</li>
                <li>• 禁止发布广告</li>
                <li>• 文明发言讨论</li>
              </ul>
            </Card>
          </div>
        </div>
      </Content>

      <Modal
        title="发布新帖"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入帖子标题" />
          </Form.Item>

          <Form.Item
            label="板块"
            name="category"
            rules={[{ required: true, message: '请选择板块' }]}
          >
            <select className="w-full p-2 border rounded">
              {categories.filter((c) => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <textarea className="w-full p-2 border rounded" rows={6} placeholder="请输入帖子内容..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" className="w-full">发布帖子</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
