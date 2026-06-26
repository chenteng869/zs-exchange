'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Row, Col, Card, Table, Tag, Button, Space, Input, Select, Tabs, Modal, Descriptions, Statistic, Badge, Typography, Steps, Timeline, Alert, Tooltip, message, Segmented, Empty, Progress,
} from 'antd';
import {
  BlockOutlined, TransactionOutlined, SearchOutlined, EyeOutlined, QrcodeOutlined, ClockCircleOutlined, CheckCircleOutlined, ApiOutlined, DashboardOutlined, LineChartOutlined, GlobalOutlined, WalletOutlined, ArrowRightOutlined, CopyOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 最新区块数据
const mockBlocks = [
  { height: 18954215, hash: '0xblock_hash_001_very_long_hash_string_here_for_display_purposes', txCount: 45, miner: '0xMiner_A...', size: '28.5KB', gasUsed: '12.5M', gasLimit: '15M', timestamp: '2024-06-08 10:05:22', parentHash: '0xparent_001', nonce: 0x12345678, difficulty: '0' },
  { height: 18954214, hash: '0xblock_hash_002_another_long_block_hash_for_the_explorer_ui', txCount: 38, miner: '0xMiner_B...', size: '24.1KB', gasUsed: '11.2M', gasLimit: '15M', timestamp: '2024-06-08 10:04:58', parentHash: '0xparent_002', nonce: 0x87654321, difficulty: '0' },
  { height: 18954213, hash: '0xblock_hash_003_block_three_hash_data_string_content', txCount: 52, miner: '0xMiner_C...', size: '31.2KB', gasUsed: '14.1M', gasLimit: '15M', timestamp: '2024-06-08 10:04:35', parentHash: '0xparent_003', nonce: 0xabcd1234, difficulty: '0' },
  { height: 18954212, hash: '0xblock_hash_004_fourth_block_in_the_chain_sequence', txCount: 29, miner: '0xMiner_D...', size: '19.8KB', gasUsed: '9.8M', gasLimit: '15M', timestamp: '2024-06-08 10:04:12', parentHash: '0xparent_004', nonce: 0xdeadbeef, difficulty: '0' },
  { height: 18954211, hash: '0xblock_hash_005_fifth_block_hash_value_data_info', txCount: 41, miner: '0xMiner_E...', size: '26.3KB', gasUsed: '13.0M', gasLimit: '15M', timestamp: '2024-06-08 10:03:48', parentHash: '0xparent_005', nonce: 0xcafebabe, difficulty: '0' },
  { height: 18954210, hash: '0xblock_hash_006_sixth_block_chain_explorer_data', txCount: 33, miner: '0xMiner_F...', size: '22.0KB', gasUsed: '10.5M', gasLimit: '15M', timestamp: '2024-06-08 10:03:25', parentHash: '0xparent_006', nonce: 0x1234abcd, difficulty: '0' },
  { height: 18954209, hash: '0xblock_hash_007_seventh_block_in_sequence_now', txCount: 47, miner: '0xMiner_G...', size: '29.1KB', gasUsed: '13.8M', gasLimit: '15M', timestamp: '2024-06-08 10:03:02', parentHash: '0xparent_007', nonce: 0x5678efab, difficulty: '0' },
  { height: 18954208, hash: '0xblock_hash_008_eighth_block_hash_string_display', txCount: 25, miner: '0xMiner_H...', size: '17.5KB', gasUsed: '8.9M', gasLimit: '15M', timestamp: '2024-06-08 10:02:39', parentHash: '0xparent_008', nonce: 0x9abc1234, difficulty: '0' },
];

// 交易数据
const mockTransactions = [
  { txHash: '0xtx_001_abcdef1234567890abcdef1234567890abcdef12', from: '0xAlice_Wallet_Address_Here_For_Display', to: '0xBob_Wallet_Address_Here_For_Display', amount: '1,500 USDT', fee: '0.0025 ETH', status: 'success', blockHeight: 18954215, timestamp: '2024-06-08 10:05:22', method: 'transfer' },
  { txHash: '0xtx_002_fedcba9876543210fedcba9876543210fedcba98', from: '0xCharlie_Address_String_For_UI_Purposes_Now', to: 'TokenSwapDEX_Contract_Address_Here', amount: '5.5 ETH', fee: '0.0032 ETH', status: 'success', blockHeight: 18954214, timestamp: '2024-06-08 10:04:58', method: 'swap' },
  { txHash: '0xtx_003_1234567890abcdef1234567890abcdef12345678', from: '0xDave_Long_Address_For_Explorer_Display_Testing', to: 'ChainStaking_Contract_Address_Value_Here', amount: '10,000 GXT', fee: '0.0018 ETH', status: 'success', blockHeight: 18954213, timestamp: '2024-06-08 10:04:35', method: 'stake' },
  { txHash: '0xtx_004_deadbeefcafe1234deadbeefcafe1234deadbeef', from: '0xEve_Wallet_Address_For_Blockchain_Explorer_Ui', to: '0xFrank_Address_In_The_Transaction_Table_Row', amount: '0.8 WETH', fee: '0.0021 ETH', status: 'failed', blockHeight: 18954212, timestamp: '2024-06-08 10:04:12', method: 'transfer', error: 'Insufficient balance' },
  { txHash: '0xtx_005_cafebabedead1234cafebabedead1234cafebabed', from: '0xGrace_Address_For_Transaction_Data_Display', to: 'NFTMarketplace_Contract_Address_Here_Now', amount: '0.05 ETH', fee: '0.0045 ETH', status: 'success', blockHeight: 18954211, timestamp: '2024-06-08 10:03:48', method: 'mintNFT' },
  { txHash: '0xtx_006_abcdef1234567890abcdef1234567890abcdef12', from: '0xHenry_Address_String_For_Explorer_Tx_List', to: '0xIvan_Address_In_The_Middle_Of_Nowhere', amount: '2,200 USDC', fee: '0.0019 ETH', status: 'pending', blockHeight: '-', timestamp: '2024-06-08 10:03:25', method: 'transfer' },
  { txHash: '0xtx_007_9876543210fedcba9876543210fedcba98765432', from: '0xJulia_Wallet_Address_For_Tx_Table_Data_Info', to: 'EvidenceRegistry_Contract_Address_Here_Data', amount: '0 ETH', fee: '0.0028 ETH', status: 'success', blockHeight: 18954209, timestamp: '2024-06-08 10:03:02', method: 'storeHash' },
  { txHash: '0xtx_008_34567890abcdef1234567890abcdef12345678ab', from: '0xKevin_Long_Address_String_For_Tx_Explorer_View', to: '0xLeo_Address_For_The_Last_Transaction_Row', amount: '750 DAI', fee: '0.0015 ETH', status: 'success', blockHeight: 18954208, timestamp: '2024-06-08 10:02:39', method: 'transfer' },
];

// TPS 趋势
const tpsTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['TPS', 'Gas Price (Gwei)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['00:00', '04:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'] },
  yAxis: [
    { type: 'value', name: 'TPS', position: 'left' },
    { type: 'value', name: 'Gas (Gwei)', position: 'right' },
  ],
  series: [
    { name: 'TPS', type: 'line', smooth: true, yAxisIndex: 0, data: [12, 8, 15, 28, 45, 52, 48, 38, 42, 25], areaStyle: { opacity: 0.15 }, itemStyle: { color: '#1677FF' } },
    { name: 'Gas Price (Gwei)', type: 'line', smooth: true, yAxisIndex: 1, data: [18, 15, 22, 28, 35, 42, 38, 32, 28, 20], lineStyle: { type: 'dashed' }, itemStyle: { color: '#F59E0B' } },
  ],
};

export default function BlockchainExplorerPage() {
  const [activeTab, setActiveTab] = useState('blocks');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailType, setDetailType] = useState<'block' | 'tx' | 'address'>('block');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');

  const { data: blocks } = useQuery({
    queryKey: ['explorer-blocks'],
    queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockBlocks; },
  });

  const { data: transactions } = useQuery({
    queryKey: ['explorer-txs'],
    queryFn: async () => { await new Promise(r => setTimeout(r, 400)); return mockTransactions; },
  });

  // 区块表格列
  const blockColumns = [
    { title: '区块高度', dataIndex: 'height', key: 'height', width: 110, render: (h: number) => <a className="font-mono font-semibold text-blue-600" onClick={() => { setSelectedItem(mockBlocks.find(b => b.height === h)); setDetailType('block'); setDetailModalVisible(true); }}>{h.toLocaleString()}</a> },
    {
      title: '区块哈希', dataIndex: 'hash', key: 'hash', width: 240,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => { navigator.clipboard?.writeText(hash); message.success('已复制'); }}>
            {hash.slice(0, 16)}...
          </code>
        </Tooltip>
      ),
    },
    { title: '交易数', dataIndex: 'txCount', key: 'txCount', width: 80, align: 'center' as const, render: (count: number) => <Tag color="blue">{count}</Tag> },
    { title: '矿工', dataIndex: 'miner', key: 'miner', width: 140, render: (m: string) => <code className="text-xs">{m}</code> },
    { title: '大小', dataIndex: 'size', key: 'size', width: 80 },
    { title: 'Gas使用', dataIndex: 'gasUsed', key: 'gasUsed', width: 100 },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 170 },
  ];

  // 交易表格列
  const txColumns = [
    {
      title: '交易哈希', dataIndex: 'txHash', key: 'txHash', width: 260,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <a className="font-mono text-xs text-blue-600" onClick={() => { const tx = mockTransactions.find(t => t.txHash === hash); setSelectedItem(tx); setDetailType('tx'); setDetailModalVisible(true); }}>
            {hash.slice(0, 18)}...
          </a>
        </Tooltip>
      ),
    },
    {
      title: '发送方', dataIndex: 'from', key: 'from', width: 200,
      render: (addr: string) => <Tooltip title={addr}><code className="text-xs truncate block max-w-[180px]">{addr.slice(0, 12)}...</code></Tooltip>,
    },
    {
      title: '接收方', dataIndex: 'to', key: 'to', width: 200,
      render: (addr: string) => (
        <span className="flex items-center gap-1">
          <ArrowRightOutlined className="text-gray-300 text-xs" />
          <Tooltip title={addr}><code className="text-xs truncate block max-w-[170px]">{addr.slice(0, 12)}...</code></Tooltip>
        </span>
      ),
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 130, render: (amt: string) => <span className="font-semibold text-green-600">{amt}</span> },
    { title: '手续费', dataIndex: 'fee', key: 'fee', width: 100, render: (fee: string) => <span className="text-gray-500 text-sm">{fee}</span> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = { success: { color: 'success', text: '成功' }, failed: { color: 'error', text: '失败' }, pending: { color: 'warning', text: '待确认' } };
        const s = map[status]; return s ? <Badge status={s.color as any} text={s.text} /> : status;
      },
    },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 170 },
  ];

  const handleSearch = () => {
    if (!searchValue) return;
    if (searchValue.startsWith('0x') && searchValue.length === 66) {
      const tx = mockTransactions.find(t => t.txHash.startsWith(searchValue.slice(0, 10)));
      if (tx) { setSelectedItem(tx); setDetailType('tx'); setDetailModalVisible(true); return; }
    }
    const blockNum = parseInt(searchValue);
    if (!isNaN(blockNum)) {
      const block = mockBlocks.find(b => b.height === blockNum);
      if (block) { setSelectedItem(block); setDetailType('block'); setDetailModalVisible(true); return; }
    }
    message.info('未找到匹配结果，请检查输入');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <GlobalOutlined className="text-2xl text-blue-500" />
          <h1 className="text-2xl font-bold m-0">链上浏览器</h1>
        </div>

        {/* 搜索栏 */}
        <Card className="shadow-sm">
          <div className="flex gap-3">
            <Input.Search
              placeholder="搜索区块高度 / 交易哈希 / 地址..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 600 }}
            />
            <Segmented
              options={[
                { label: '区块', value: 'blocks', icon: <BlockOutlined /> },
                { label: '交易', value: 'transactions', icon: <TransactionOutlined /> },
                { label: '地址', value: 'addresses', icon: <WalletOutlined /> },
              ]}
              value={activeTab}
              onChange={(v) => setActiveTab(v as string)}
            />
          </div>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><Card className="shadow-sm"><Statistic title="最新区块" value={18954215} prefix={<BlockOutlined />} valueStyle={{ color: '#1677FF' }} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card className="shadow-sm"><Statistic title="总交易量" value={8542680} prefix={<TransactionOutlined />} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card className="shadow-sm"><Statistic title="活跃地址" value={28450} prefix={<WalletOutlined />} valueStyle={{ color: '#16A34A' }} /></Card></Col>
          <Col xs={24} sm={12} md={6}><Card className="shadow-sm"><Statistic title="当前TPS" value={28.5} suffix="/s" prefix={<LineChartOutlined />} valueStyle={{ color: '#7C3AED' }} /></Card></Col>
        </Row>

        {/* TPS趋势图 */}
        <Card title="网络性能趋势" className="shadow-sm">
          <SafeECharts option={tpsTrendOption} style={{ height: 280 }} title="TPS和Gas趋势图" />
        </Card>

        {/* 区块/交易列表 */}
        {activeTab === 'blocks' && (
          <Card title={<Space><BlockOutlined /><span>最新区块</span></Space>} className="shadow-sm" extra={<Tag color="blue">实时更新中</Tag>}>
            <Table dataSource={blocks || []} columns={blockColumns} rowKey="height" pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个区块` }} size="middle" />
          </Card>
        )}
        {activeTab === 'transactions' && (
          <Card title={<Space><TransactionOutlined /><span>最新交易</span></Space>} className="shadow-sm">
            <Table dataSource={transactions || []} columns={txColumns} rowKey="txHash" pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 笔交易` }} size="middle" scroll={{ x: 1100 }} />
          </Card>
        )}
        {activeTab === 'addresses' && (
          <Card title={<Space><WalletOutlined /><span>热门地址</span></Space>} className="shadow-sm">
            <Empty description="请通过上方搜索栏查询具体地址信息" />
          </Card>
        )}

        {/* 区块/交易详情弹窗 */}
        <Modal
          title={`${detailType === 'block' ? '区块' : detailType === 'tx' ? '交易' : '地址'}详情`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={800}
          footer={<Space><Button icon={<CopyOutlined />} onClick={() => message.success('已复制')}>复制链接</Button><Button type="primary">在区块浏览器打开</Button></Space>}
        >
          {selectedItem && detailType === 'block' && (
            <div className="space-y-4">
              <Alert type="info" showIcon message={`区块 #${selectedItem.height}`} description={`于 ${selectedItem.timestamp} 被挖出`} />
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="区块高度" span={2}><Text strong className="text-xl text-blue-600">{selectedItem.height.toLocaleString()}</Text></Descriptions.Item>
                <Descriptions.Item label="区块哈希" span={2}>
                  <div className="flex items-center gap-2"><code className="text-xs break-all bg-gray-50 p-2 rounded flex-1 font-mono">{selectedItem.hash}</code><Button size="small" icon={<CopyOutlined />} /></div>
                </Descriptions.Item>
                <Descriptions.Item label="父区块哈希" span={2}><code className="text-xs">{selectedItem.parentHash}</code></Descriptions.Item>
                <Descriptions.Item label="矿工"><code className="text-sm">{selectedItem.miner}</code></Descriptions.Item>
                <Descriptions.Item label="Nonce"><code className="text-sm">0x{selectedItem.nonce.toString(16)}</code></Descriptions.Item>
                <Descriptions.Item label="交易数量"><Tag color="blue">{selectedItem.txCount} 笔</Tag></Descriptions.Item>
                <Descriptions.Item label="区块大小">{selectedItem.size}</Descriptions.Item>
                <Descriptions.Item label="Gas已用">{selectedItem.gasUsed}</Descriptions.Item>
                <Descriptions.Item label="Gas上限">{selectedItem.gasLimit}</Descriptions.Item>
                <Descriptions.Item label="Gas利用率"><Progress percent={Math.round((parseFloat(selectedItem.gasUsed.replace('M', '')) / parseFloat(selectedItem.gasLimit.replace('M', ''))) * 100)} size="small" /></Descriptions.Item>
                <Descriptions.Item label="时间戳" span={2}>{selectedItem.timestamp}</Descriptions.Item>
              </Descriptions>
            </div>
          )}
          {selectedItem && detailType === 'tx' && (
            <div className="space-y-4">
              <Alert type={selectedItem.status === 'success' ? 'success' : selectedItem.status === 'failed' ? 'error' : 'warning'} showIcon message={selectedItem.status === 'success' ? '交易成功 ✓' : selectedItem.status === 'failed' ? '交易失败 ✗' : '等待确认 ⏳'} />
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="交易哈希" span={2}>
                  <div className="flex items-center gap-2"><code className="text-xs break-all bg-gray-50 p-2 rounded flex-1 font-mono">{selectedItem.txHash}</code><Button size="small" icon={<CopyOutlined />} /></div>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {selectedItem.status === 'success' ? <Badge status="success" text="成功" /> : selectedItem.status === 'failed' ? <Badge status="error" text="失败" /> : <Badge status="warning" text="待确认" />}
                </Descriptions.Item>
                <Descriptions.Item label="区块高度">{selectedItem.blockHeight !== '-' ? Number(selectedItem.blockHeight).toLocaleString() : '-'}</Descriptions.Item>
                <Descriptions.Item label="发送方" span={2}><code className="text-sm break-all">{selectedItem.from}</code></Descriptions.Item>
                <Descriptions.Item label="接收方" span={2}><code className="text-sm break-all">{selectedItem.to}</code></Descriptions.Item>
                <Descriptions.Item label="金额"><Text strong className="text-green-600 text-lg">{selectedItem.amount}</Text></Descriptions.Item>
                <Descriptions.Item label="手续费"><Text type="secondary">{selectedItem.fee}</Text></Descriptions.Item>
                <Descriptions.Item label="调用方法"><Tag color="purple">{selectedItem.method}</Tag></Descriptions.Item>
                <Descriptions.Item label="时间戳">{selectedItem.timestamp}</Descriptions.Item>
                {selectedItem.error && <Descriptions.Item label="错误信息" span={2}><Text type="danger">{selectedItem.error}</Text></Descriptions.Item>}
              </Descriptions>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
