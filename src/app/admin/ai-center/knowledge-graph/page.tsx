'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  ApartmentOutlined, NodeIndexOutlined, TeamOutlined, ApiOutlined, ThunderboltOutlined,
  EyeOutlined, SearchOutlined, ShareAltOutlined, DatabaseOutlined, GlobalOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 实体关系列表
const mockRelations = [
  { id: 'KG-001', source: 'BTC', relation: '交易对', target: 'USDT', sourceType: '资产', targetType: '稳定币', confidence: 0.98, updatedAt: '2024-06-23 08:00' },
  { id: 'KG-002', source: 'Ethereum', relation: '原生代币', target: 'ETH', sourceType: '公链', targetType: '资产', confidence: 1.0, updatedAt: '2024-06-22 18:30' },
  { id: 'KG-003', source: 'Uniswap', relation: '基于', target: 'Ethereum', sourceType: '协议', targetType: '公链', confidence: 0.95, updatedAt: '2024-06-22 15:20' },
  { id: 'KG-004', source: 'USDC', relation: '锚定', target: 'USD', sourceType: '稳定币', targetType: '法币', confidence: 0.99, updatedAt: '2024-06-22 12:00' },
  { id: 'KG-005', source: 'Vitalik', relation: '创始人', target: 'Ethereum', sourceType: '人物', targetType: '公链', confidence: 1.0, updatedAt: '2024-06-21 20:45' },
  { id: 'KG-006', source: 'AAVE', relation: '借贷协议', target: 'DeFi', sourceType: '协议', targetType: '领域', confidence: 0.92, updatedAt: '2024-06-21 16:30' },
  { id: 'KG-007', source: 'SOL', relation: '竞争链', target: 'ETH', sourceType: '资产', targetType: '资产', confidence: 0.88, updatedAt: '2024-06-21 10:15' },
  { id: 'KG-008', source: 'Chainlink', relation: '预言机服务', target: 'DeFi生态', sourceType: '协议', targetType: '领域', confidence: 0.94, updatedAt: '2024-06-20 22:00' },
  { id: 'KG-009', source: 'Binance', relation: '交易所', target: 'CEX', sourceType: '机构', targetType: '类型', confidence: 0.97, updatedAt: '2024-06-20 14:50' },
  { id: 'KG-010', source: 'NFT', relation: '标准', target: 'ERC-721', sourceType: '概念', targetType: '标准', confidence: 0.96, updatedAt: '2024-06-20 09:30' },
];

// 实体类型颜色
const entityTypeColors: Record<string, string> = {
  '资产': '#1677FF',
  '稳定币': '#16A34A',
  '公链': '#7C3AED',
  '协议': '#F59E0B',
  '人物': '#EC4899',
  '法币': '#06B6D4',
  '领域': '#6366F1',
  '机构': '#F97316',
  '概念': '#8B5CF6',
  '类型': '#64748B',
};

export default function KnowledgeGraphPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: relations, isLoading } = useQuery({
    queryKey: ['kg-relations'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockRelations;
    },
  });

  const columns = [
    {
      title: '源实体',
      dataIndex: 'source',
      key: 'source',
      width: 140,
      render: (source: string, record: any) => (
        <Tag color={entityTypeColors[record.sourceType] || 'default'} style={{ color: '#fff' }}>{source}</Tag>
      ),
    },
    {
      title: '关系',
      dataIndex: 'relation',
      key: 'relation',
      width: 120,
      render: (rel: string) => (
        <Space>
          <ShareAltOutlined className="text-blue-500" />
          <Text strong className="text-blue-600">{rel}</Text>
        </Space>
      ),
    },
    {
      title: '目标实体',
      dataIndex: 'target',
      key: 'target',
      width: 140,
      render: (target: string, record: any) => (
        <Tag color={entityTypeColors[record.targetType] || 'default'} style={{ color: '#fff' }}>{target}</Tag>
      ),
    },
    {
      title: '源类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 100,
      render: (type: string) => (
        <Text style={{ color: entityTypeColors[type] || '#666' }} className="text-xs">{type}</Text>
      ),
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (type: string) => (
        <Text style={{ color: entityTypeColors[type] || '#666' }} className="text-xs">{type}</Text>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      render: (val: number) => (
        <Progress
          percent={Math.round(val * 100)}
          size="small"
          strokeColor={val >= 0.95 ? '#16A34A' : val >= 0.9 ? '#1677FF' : '#F59E0B'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看路径',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'explore',
      label: '探索关联',
      icon: <SearchOutlined />,
      hidden: () => false,
      onClick: (record: any) => {
        message.info(`正在探索 ${record.source} 的关联实体`);
      },
    },
  ];

  // 统计唯一实体数
  const allEntities = new Set([...(relations || []).map((r: any) => r.source), ...(relations || []).map((r: any) => r.target)]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ApartmentOutlined className="text-3xl text-indigo-500" />
            <div>
              <Title level={3} className="!mb-0">知识图谱</Title>
              <Text type="secondary">图谱构建 · 实体关系 · 智能查询</Text>
            </div>
          </div>
          <Space>
            <Button icon={<GlobalOutlined />}>图谱可视化</Button>
            <Button type="primary" icon={<DatabaseOutlined />}>同步数据</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="实体总数"
              value={allEntities.size}
              icon={<NodeIndexOutlined />}
              color="#1677FF"
              suffix="个"
              trend="up"
              trendValue="+5.2%"
              description="去重后的独立实体"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="关系总数"
              value={relations?.length || 0}
              icon={<ShareAltOutlined />}
              color="#16A34A"
              suffix="条"
              description="已确认的实体关系"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="图谱版本"
              value="v2.4.1"
              icon={<ApiOutlined />}
              color="#7C3AED"
              description="最近更新于今日"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="查询QPS"
              value={2850}
              icon={<ThunderboltOutlined />}
              color="#F59E0B"
              suffix=""
              description="平均每秒查询量"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="覆盖率"
              value={91.3}
              icon={<TeamOutlined />}
              color="#06B6D4"
              suffix="%"
              description="核心实体覆盖"
            />
          </Col>
        </Row>

        {/* DataTable - 实体关系列表 */}
        <Card title="实体关系列表" className="shadow-sm" extra={
          <Space>
            <Tag color="processing">实时更新</Tag>
            <Tag color="blue">共 {relations?.length || 0} 条关系</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={relations || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索实体名称或关系"
            showFilter
            filterOptions={[
              { label: '全部类型', value: '' },
              { label: '资产相关', value: '资产' },
              { label: '协议相关', value: '协议' },
              { label: '公链相关', value: '公链' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条关系`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><NodeIndexOutlined /><span>实体类型分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {Object.entries(entityTypeColors).slice(0, 6).map(([type, color]) => {
                  const count = relations?.filter((r: any) => r.sourceType === type || r.targetType === type).length || 0;
                  const percent = (count / ((relations?.length || 1) * 2)) * 100;
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <Tag color={color} style={{ color: '#fff' }}>{type}</Tag>
                        <Text strong>出现 {count} 次 ({percent.toFixed(0)}%)</Text>
                      </div>
                      <Progress percent={percent} strokeColor={color} size="small" showInfo={false} />
                    </div>
                  );
                })}
                <Divider />
                <Alert
                  type="info"
                  showIcon
                  message="图谱健康状态良好"
                  description={
                    <Space>
                      <Badge status="success" text={`${allEntities.size} 个实体已索引`} />
                      <Badge status="processing" text="自动更新运行中" />
                    </Space>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><ApartmentOutlined /><span>图谱能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="success"
                  showIcon
                  banner
                  message="多模态知识图谱引擎"
                  description="整合链上数据、社交媒体、新闻资讯等多源信息，构建全面的加密货币知识网络"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心能力：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><ApartmentOutlined className="mr-2 text-blue-500" /> 实体识别：自动从非结构化文本中抽取命名实体</li>
                    <li><ShareAltOutlined className="mr-2 text-green-500" /> 关系抽取：深度学习模型识别实体间的语义关系</li>
                    <li><SearchOutlined className="mr-2 text-orange-500" /> 图谱查询：支持SPARQL和自然语言混合查询</li>
                    <li><ThunderboltOutlined className="mr-2 text-purple-500" /> 推理能力：基于规则和嵌入的隐含关系发现</li>
                    <li><GlobalOutlined className="mr-2 text-red-500" /> 可视化：交互式力导向图展示与探索</li>
                  </ul>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <DatabaseOutlined className="mr-1 text-indigo-500" />
                    覆盖 10+ 实体类型 | 支持 Neo4j/JanusGraph | 每日增量更新
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`关系详情 - ${selectedRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="explore" type="primary" icon={<SearchOutlined />} onClick={() => {
              message.success('已打开图谱探索视图');
              setDetailModalOpen(false);
            }}>在图谱中查看</Button>,
          ]}
          width={650}
        >
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-center gap-4 py-6 bg-gray-50 rounded-lg">
                <Tag color={entityTypeColors[selectedRecord.sourceType]} style={{ color: '#fff', fontSize: 16, padding: '4px 12px' }}>
                  {selectedRecord.source}
                </Tag>
                <Space direction="vertical" align="center">
                  <ShareAltOutlined className="text-2xl text-blue-500" />
                  <Text strong className="text-blue-600">{selectedRecord.relation}</Text>
                </Space>
                <Tag color={entityTypeColors[selectedRecord.targetType]} style={{ color: '#fff', fontSize: 16, padding: '4px 12px' }}>
                  {selectedRecord.target}
                </Tag>
              </div>
              <Row gutter={[16, 16]}>
                <Col span={12}><Statistic title="源实体类型" value="" prefix={<Tag color={entityTypeColors[selectedRecord.sourceType]}>{selectedRecord.sourceType}</Tag>} /></Col>
                <Col span={12}><Statistic title="目标实体类型" value="" prefix={<Tag color={entityTypeColors[selectedRecord.targetType]}>{selectedRecord.targetType}</Tag>} /></Col>
                <Col span={12}><Statistic title="置信度" value={(selectedRecord.confidence * 100).toFixed(1)} suffix="%" valueStyle={{ color: selectedRecord.confidence >= 0.95 ? '#16A34A' : '#1677FF' }} /></Col>
                <Col span={12}><Statistic title="最后更新" value={selectedRecord.updatedAt} /></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
