'use client';

import { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Tag, Button, Input, Space, Modal, Tabs, Avatar, Badge } from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  HeartOutlined,
  ShareAltOutlined,
  RightOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Header, Content } = Layout;

const categories = [
  { id: 'all', name: '全部内容', icon: <BookOutlined /> },
  { id: 'classics', name: '经典典籍', icon: <BookOutlined /> },
  { id: 'philosophy', name: '哲学思想', icon: <BookOutlined /> },
  { id: 'heritage', name: '文化遗产', icon: <BookOutlined /> },
  { id: 'art', name: '艺术传承', icon: <BookOutlined /> },
];

const classics = [
  {
    id: '1',
    title: '《论语》',
    author: '孔子',
    era: '春秋时期',
    description: '记录孔子及其弟子言行的儒家经典',
    chapters: 20,
    tags: ['儒家', '经典'],
  },
  {
    id: '2',
    title: '《道德经》',
    author: '老子',
    era: '春秋时期',
    description: '道家思想的核心著作，阐述无为而治的智慧',
    chapters: 81,
    tags: ['道家', '经典'],
  },
  {
    id: '3',
    title: '《庄子》',
    author: '庄子',
    era: '战国时期',
    description: '道家经典，充满寓言和哲学思辨',
    chapters: 33,
    tags: ['道家', '哲学'],
  },
  {
    id: '4',
    title: '《孟子》',
    author: '孟子',
    era: '战国时期',
    description: '儒家经典，强调仁政和性善论',
    chapters: 14,
    tags: ['儒家', '经典'],
  },
];

const articles = [
  {
    id: '1',
    title: '孔子思想的现代价值',
    category: 'philosophy',
    author: '国学大师',
    views: 12580,
    likes: 2340,
    excerpt: '孔子的思想不仅是中国传统文化的瑰宝，更是现代社会治理和个人修养的重要指导...',
    tags: ['儒家', '现代价值'],
  },
  {
    id: '2',
    title: '故宫文物鉴赏：青花瓷的艺术魅力',
    category: 'heritage',
    author: '文物专家',
    views: 8920,
    likes: 1560,
    excerpt: '青花瓷是中国陶瓷艺术的巅峰之作，承载着千年的文化传承...',
    tags: ['文物', '艺术'],
  },
  {
    id: '3',
    title: '传统书法艺术赏析',
    category: 'art',
    author: '书法名家',
    views: 6540,
    likes: 980,
    excerpt: '书法是中国特有的艺术形式，体现了书写者的心境和修养...',
    tags: ['书法', '艺术'],
  },
  {
    id: '4',
    title: '《周易》的智慧：变与不变',
    category: 'philosophy',
    author: '易学专家',
    views: 5430,
    likes: 870,
    excerpt: '《周易》揭示了宇宙万物变化的规律，是中国古代智慧的结晶...',
    tags: ['易经', '哲学'],
  },
];

const quotes = [
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '道可道，非常道；名可名，非常名。', author: '老子' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '己所不欲，勿施于人。', author: '孔子' },
];

export default function CulturePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClassic, setSelectedClassic] = useState<typeof classics[0] | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openClassicDetail = (classic: typeof classics[0]) => {
    setSelectedClassic(classic);
    setModalVisible(true);
  };

  return (
    <Layout className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <Header className="bg-gradient-to-r from-amber-700 to-orange-700 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <BookOutlined className="text-2xl" />
            <span className="text-xl font-bold">传统文化</span>
          </div>

          <Menu mode="horizontal" className="flex-1 justify-center">
            {categories.map((cat) => (
              <Menu.Item key={cat.id}>{cat.name}</Menu.Item>
            ))}
          </Menu>

          <Input
            placeholder="搜索文章..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 200, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none' }}
          />
        </div>
      </Header>

      <Content className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">传承千年智慧</h1>
          <p className="text-lg opacity-90">探索中国传统文化的博大精深，感悟先贤智慧的永恒价值</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quotes.map((quote, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur">
              <div className="flex items-start gap-3">
                <MessageOutlined className="text-amber-500 text-2xl" />
                <div>
                  <p className="text-lg italic text-gray-700">{quote.text}</p>
                  <p className="text-sm text-gray-500 mt-2 text-right">—— {quote.author}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOutlined className="text-amber-600" />
            经典典籍
          </h2>
          <Button type="link" icon={<RightOutlined />}>查看全部</Button>
        </div>

        <Row gutter={[16, 16]} className="mb-8">
          {classics.map((classic) => (
            <Col xs={24} sm={12} md={6} key={classic.id}>
              <Card
                hoverable
                className="cursor-pointer bg-gradient-to-br from-amber-50 to-orange-50"
                onClick={() => openClassicDetail(classic)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">📜</div>
                  <h3 className="text-xl font-bold text-amber-800">{classic.title}</h3>
                  <p className="text-amber-600">{classic.author}</p>
                  <p className="text-sm text-gray-500">{classic.era}</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {classic.tags.map((tag) => (
                      <Tag key={tag} color="amber">{tag}</Tag>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">文化精粹</h2>
          <Button type="link" icon={<RightOutlined />}>查看全部</Button>
        </div>

        <Row gutter={[16, 16]}>
          {filteredArticles.map((article) => (
            <Col xs={24} md={12} key={article.id}>
              <Card hoverable className="cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{article.title}</h3>
                    <p className="text-gray-600 mb-3">{article.excerpt}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">作者：{article.author}</span>
                      <span className="text-sm text-gray-500">阅读：{article.views}</span>
                      <span className="text-sm text-red-500">❤️ {article.likes}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="text" icon={<HeartOutlined />} />
                    <Button type="text" icon={<ShareAltOutlined />} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.map((tag) => (
                    <Tag key={tag} color="green">{tag}</Tag>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Content>

      <Modal
        title={selectedClassic?.title}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        {selectedClassic && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="text-6xl mb-4">📜</div>
              <h2 className="text-2xl font-bold text-amber-800">{selectedClassic.title}</h2>
              <p className="text-gray-600 mt-2">
                <span className="mr-4">作者：{selectedClassic.author}</span>
                <span className="mr-4">时代：{selectedClassic.era}</span>
                <span>篇章：{selectedClassic.chapters}篇</span>
              </p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-bold mb-2">内容简介</h3>
              <p className="text-gray-700">{selectedClassic.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedClassic.tags.map((tag) => (
                <Tag key={tag} color="amber">{tag}</Tag>
              ))}
            </div>

            <Button type="primary" className="w-full">开始阅读</Button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
