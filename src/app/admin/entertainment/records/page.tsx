'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic, DatePicker, Image } from 'antd';
import { HistoryOutlined, SearchOutlined, EyeOutlined, CheckOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import type { RangePickerProps } from 'antd/es/date-picker';

const { Option } = Select;

const mockRecords = [
  { id: '1', userId: 'user_001', username: '国学达人', userAvatar: 'https://via.placeholder.com/40', prizeName: '孔子像NFT', prizeType: 'nft', prizeRarity: 'legendary', prizeValue: 10000, sourceType: 'lottery', sourceName: '每日幸运抽奖', time: '2024-05-13 14:30:00', status: 'distributed', txHash: '0x1234...5678', image: 'https://via.placeholder.com/100' },
  { id: '2', userId: 'user_002', username: '诗词王子', userAvatar: 'https://via.placeholder.com/40', prizeName: '1000 USDT', prizeType: 'token', prizeRarity: 'rare', prizeValue: 1000, sourceType: 'blindbox', sourceName: '国学院限量盲盒', time: '2024-05-13 12:15:00', status: 'pending', txHash: '', image: 'https://via.placeholder.com/100' },
  { id: '3', userId: 'user_003', username: '成语大师', userAvatar: 'https://via.placeholder.com/40', prizeName: '书法真迹', prizeType: 'physical', prizeRarity: 'epic', prizeValue: 5000, sourceType: 'game', sourceName: '成语接龙大赛', time: '2024-05-12 18:45:00', status: 'distributed', txHash: '0xabc1...def2', image: 'https://via.placeholder.com/100' },
  { id: '4', userId: 'user_004', username: '围棋圣手', userAvatar: 'https://via.placeholder.com/40', prizeName: '国学经典书籍', prizeType: 'physical', prizeRarity: 'common', prizeValue: 100, sourceType: 'lottery', sourceName: '每日幸运抽奖', time: '2024-05-12 10:20:00', status: 'failed', txHash: '', image: 'https://via.placeholder.com/100' },
  { id: '5', userId: 'user_005', username: '历史学者', userAvatar: 'https://via.placeholder.com/40', prizeName: 'VIP会员年卡', prizeType: 'membership', prizeRarity: 'epic', prizeValue: 2000, sourceType: 'blindbox', sourceName: '经典国学盲盒', time: '2024-05-11 20:00:00', status: 'distributed', txHash: '0x9876...5432', image: 'https://via.placeholder.com/100' },
];

const winningTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['抽奖', '盲盒', '游戏'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-01', '05-05', '05-08', '05-10', '05-12', '05-13'] },
  yAxis: { type: 'value', name: '中奖次数' },
  series: [
    { type: 'line', data: [20, 35, 28, 45, 38, 42], itemStyle: { color: '#F59E0B' }, name: '抽奖' },
    { type: 'line', data: [15, 25, 22, 30, 28, 35], itemStyle: { color: '#7C3AED' }, name: '盲盒' },
    { type: 'line', data: [10, 18, 15, 22, 20, 25], itemStyle: { color: '#1677FF' }, name: '游戏' },
  ],
};

export default function RecordsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchForm] = Form.useForm();

  const rarityColors = {
    legendary: 'gold',
    epic: 'purple',
    rare: 'blue',
    common: 'gray',
  };

  const rarityLabels = {
    legendary: '传说',
    epic: '史诗',
    rare: '稀有',
    common: '普通',
  };

  const sourceTypeColors = {
    lottery: 'orange',
    blindbox: 'purple',
    game: 'blue',
  };

  const sourceTypeLabels = {
    lottery: '抽奖',
    blindbox: '盲盒',
    game: '游戏',
  };

  const recordColumns = [
    { 
      title: '用户', 
      key: 'user', 
      width: 180, 
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Image src={record.userAvatar} style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div>
            <div className="font-medium">{record.username}</div>
            <div className="text-xs text-gray-500">{record.userId}</div>
          </div>
        </div>
      ),
    },
    { 
      title: '奖品', 
      key: 'prize', 
      width: 200, 
      render: (_: any, record: any) => (
        <div className="flex items-center gap-2">
          <Image src={record.image} style={{ width: 40, height: 40, borderRadius: 4 }} />
          <div>
            <div className="font-medium">{record.prizeName}</div>
            <Tag color={rarityColors[record.prizeRarity as keyof typeof rarityColors]}>{rarityLabels[record.prizeRarity as keyof typeof rarityLabels]}</Tag>
          </div>
        </div>
      ),
    },
    { title: '价值', dataIndex: 'prizeValue', key: 'prizeValue', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '来源', 
      key: 'source', 
      render: (_: any, record: any) => (
        <div>
          <Tag color={sourceTypeColors[record.sourceType as keyof typeof sourceTypeColors]}>{sourceTypeLabels[record.sourceType as keyof typeof sourceTypeLabels]}</Tag>
          <div className="text-xs text-gray-500 mt-1">{record.sourceName}</div>
        </div>
      ),
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
          pending: { color: 'warning', label: '待发放' },
          distributed: { color: 'success', label: '已发放' },
          failed: { color: 'error', label: '发放失败' },
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {record.status === 'pending' ? (
            <Button type="link" size="small" icon={<CheckOutlined />}>发放</Button>
          ) : null}
          {record.status === 'failed' ? (
            <Button type="link" size="small" icon={<CheckOutlined />}>重试</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const totalRecords = mockRecords.length;
  const distributedRecords = mockRecords.filter(r => r.status === 'distributed').length;
  const pendingRecords = mockRecords.filter(r => r.status === 'pending').length;
  const totalValue = mockRecords.reduce((sum, r) => sum + r.prizeValue, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HistoryOutlined className="text-2xl text-red-600" />
            <h1 className="text-2xl font-bold m-0">中奖记录</h1>
          </div>
          <Space>
            <Button icon={<SearchOutlined />} onClick={() => searchForm.submit()}>搜索</Button>
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        </div>

        <Card>
          <Form form={searchForm} layout="inline" className="flex flex-wrap gap-4">
            <Form.Item name="username" label="用户">
              <Input placeholder="用户名/ID" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="sourceType" label="来源">
              <Select placeholder="来源类型" style={{ width: 150 }}>
                <Option value="lottery">抽奖</Option>
                <Option value="blindbox">盲盒</Option>
                <Option value="game">游戏</Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="状态" style={{ width: 150 }}>
                <Option value="pending">待发放</Option>
                <Option value="distributed">已发放</Option>
                <Option value="failed">发放失败</Option>
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="时间">
              <DatePicker.RangePicker style={{ width: 300 }} />
            </Form.Item>
          </Form>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总记录" value={totalRecords} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">中奖总次数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已发放" value={distributedRecords} suffix={`/${totalRecords}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">发放成功率 {Math.round((distributedRecords / totalRecords) * 100)}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待发放" value={pendingRecords} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">需处理记录</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总价值" value={(totalValue / 10000).toFixed(2)} prefix="$" suffix="万" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">奖品总价值</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="中奖趋势">
              <SafeECharts option={winningTrendOption} style={{ height: 250 }} title="中奖趋势" />
            </Card>
          </Col>
        </Row>

        <Card title="中奖记录列表">
          <Table
            dataSource={mockRecords}
            columns={recordColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="中奖详情"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>关闭</Button>,
            selectedRecord?.status === 'pending' ? (
              <Button key="distribute" type="primary">发放奖品</Button>
            ) : null,
          ]}
          width={600}
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Image src={selectedRecord.userAvatar} style={{ width: 64, height: 64, borderRadius: '50%' }} />
                <div>
                  <div className="text-lg font-bold">{selectedRecord.username}</div>
                  <div className="text-gray-500">{selectedRecord.userId}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <Image src={selectedRecord.image} style={{ width: 80, height: 80, borderRadius: 8 }} />
                <div>
                  <div className="text-lg font-bold">{selectedRecord.prizeName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Tag color={rarityColors[selectedRecord.prizeRarity as keyof typeof rarityColors]}>{rarityLabels[selectedRecord.prizeRarity as keyof typeof rarityLabels]}</Tag>
                    <span className="text-xl font-bold text-orange-600">${selectedRecord.prizeValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-sm">来源</div>
                  <div className="font-medium">
                    <Tag color={sourceTypeColors[selectedRecord.sourceType as keyof typeof sourceTypeColors]} className="mb-1">{sourceTypeLabels[selectedRecord.sourceType as keyof typeof sourceTypeLabels]}</Tag>
                    <div>{selectedRecord.sourceName}</div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-sm">时间</div>
                  <div className="font-medium">{selectedRecord.time}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-500 text-sm">状态</div>
                  <div className="font-medium">
                    {(() => {
                      const config: Record<string, { color: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
                        pending: { color: 'warning', label: '待发放' },
                        distributed: { color: 'success', label: '已发放' },
                        failed: { color: 'error', label: '发放失败' },
                      };
                      const c = config[selectedRecord.status];
                      return <Badge status={c?.color} text={c?.label} />;
                    })()}
                  </div>
                </div>
                {selectedRecord.txHash && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 text-sm">交易哈希</div>
                    <div className="font-medium font-mono text-sm">{selectedRecord.txHash}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
