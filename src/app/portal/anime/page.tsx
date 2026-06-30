'use client';

import { useState } from 'react';
import { Card, Row, Col, Tag, Button, Input, Modal, Rate, Tabs, List, Avatar } from 'antd';
import { PlaySquareOutlined, SearchOutlined, HeartOutlined, PlayCircleOutlined, RightOutlined } from '@ant-design/icons';

const animeSeries = [
  { id: '1', title: '三国演义', year: '2020', episodes: 52, rating: 9.5, genre: ['历史', '动作'], synopsis: '经典名著改编', characters: ['刘备', '关羽', '张飞'] },
  { id: '2', title: '红楼梦', year: '2022', episodes: 40, rating: 9.3, genre: ['历史'], synopsis: '大观园故事', characters: ['贾宝玉', '林黛玉'] },
  { id: '3', title: '西游记', year: '2019', episodes: 52, rating: 9.6, genre: ['奇幻'], synopsis: '西天取经', characters: ['孙悟空', '唐僧'] },
  { id: '4', title: '水浒传', year: '2021', episodes: 45, rating: 9.2, genre: ['历史', '动作'], synopsis: '梁山好汉', characters: ['宋江', '武松'] },
  { id: '5', title: '少年歌行', year: '2021', episodes: 26, rating: 9.1, genre: ['奇幻', '动作'], synopsis: '侠客江湖', characters: ['萧瑟', '无心'] },
  { id: '6', title: '狐妖小红娘', year: '2015', episodes: 150, rating: 8.9, genre: ['奇幻', '喜剧'], synopsis: '人妖之恋', characters: ['白月初', '涂山苏苏'] },
];

const characters = [
  { id: '1', name: '孙悟空', series: '西游记', desc: '齐天大圣' },
  { id: '2', name: '林黛玉', series: '红楼梦', desc: '体弱多病' },
  { id: '3', name: '关羽', series: '三国演义', desc: '武圣' },
  { id: '4', name: '无心', series: '少年歌行', desc: '少宗主' },
];

const episodes = [
  { id: '1', title: '桃园三结义', duration: '24:30', views: 125800 },
  { id: '2', title: '三英战吕布', duration: '23:45', views: 98600 },
];

export default function AnimePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<typeof animeSeries[0] | null>(null);

  const filteredAnime = animeSeries.filter((anime) => {
    return anime.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const openAnimeDetail = (anime: typeof animeSeries[0]) => {
    setSelectedAnime(anime);
    setModalVisible(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-gradient-to-r from-purple-700 to-pink-700 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <PlaySquareOutlined className="text-2xl" />
            <span className="text-xl font-bold">动漫天地</span>
          </div>
          <Input
            placeholder="搜索动漫..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 200, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none' }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-4">国漫崛起</h1>
          <p className="text-lg opacity-90">精彩的国产动漫</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">热门国漫</h2>
          <Button type="link" icon={<RightOutlined />}>查看全部</Button>
        </div>

        <Row gutter={[16, 16]} className="mb-8">
          {filteredAnime.map((anime) => (
            <Col xs={24} sm={12} md={8} key={anime.id}>
              <Card hoverable className="cursor-pointer" onClick={() => openAnimeDetail(anime)}>
                <div className="h-40 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mb-4">
                  <PlaySquareOutlined className="text-4xl text-purple-600" />
                </div>
                <div className="font-bold text-lg mb-2">{anime.title}</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">{anime.year}年</span>
                  <span className="text-sm text-gray-500">{anime.episodes}集</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <Rate disabled defaultValue={anime.rating} allowHalf className="text-sm" />
                  <span className="text-sm font-bold text-orange-500">{anime.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {anime.genre.map((g) => <Tag key={g} color="purple">{g}</Tag>)}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">人气角色</h2>
            <Row gutter={[16, 16]}>
              {characters.map((character) => (
                <Col xs={24} sm={12} key={character.id}>
                  <Card hoverable className="cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100">
                        {character.name[0]}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-bold">{character.name}</h3>
                        <p className="text-sm text-gray-500">{character.series}</p>
                        <p className="text-sm text-gray-600">{character.desc}</p>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">最新剧集</h2>
            <Card>
              <List dataSource={episodes} renderItem={(episode) => (
                <List.Item actions={[
                  <Button key="play" type="link" icon={<PlayCircleOutlined />}>播放</Button>,
                  <Button key="fav" type="link" icon={<HeartOutlined />}>收藏</Button>,
                ]}>
                  <div className="font-bold">{episode.title}</div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{episode.duration}</span>
                    <span className="text-sm text-gray-500">{episode.views.toLocaleString()} 播放</span>
                  </div>
                </List.Item>
              )} />
            </Card>
          </div>
        </div>
      </div>

      <Modal title={selectedAnime?.title} open={modalVisible} onCancel={() => setModalVisible(false)} width={800}>
        {selectedAnime && (
          <Tabs defaultActiveKey="info">
            <Tabs.TabPane tab="详情" key="info">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="w-32 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg flex items-center justify-center">
                    <PlaySquareOutlined className="text-5xl text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedAnime.title}</h2>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-gray-600">{selectedAnime.year}年</span>
                      <span className="text-gray-600">{selectedAnime.episodes}集</span>
                      <Rate disabled defaultValue={selectedAnime.rating} allowHalf />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedAnime.genre.map((g) => <Tag key={g} color="purple">{g}</Tag>)}
                    </div>
                    <p className="text-gray-700">{selectedAnime.synopsis}</p>
                  </div>
                </div>
                <Button type="primary" icon={<PlayCircleOutlined />} size="large">开始观看</Button>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="角色" key="characters">
              <Row gutter={[16, 16]}>
                {selectedAnime.characters.map((char, index) => (
                  <Col xs={24} sm={12} md={6} key={index}>
                    <Card className="text-center">
                      <Avatar className="mx-auto mb-2">{char[0]}</Avatar>
                      <h3 className="font-bold">{char}</h3>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}
