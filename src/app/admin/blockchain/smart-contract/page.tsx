﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';
import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Row, Col, Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge,
  Tabs, message, Typography, Tooltip, Progress, Alert, Avatar, Dropdown, Upload, Switch, InputNumber,
} from 'antd';
import {
  CodeOutlined, PlayCircleOutlined, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
  CloudUploadOutlined, FileTextOutlined, ApiOutlined, HistoryOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ThunderboltOutlined, DeploymentUnitOutlined, BugOutlined, CopyOutlined,
  DownloadOutlined, InboxOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Text } = Typography;

// 合约模拟数据
const mockContracts = [
  {
    id: 'CT-001', name: 'TokenSwapDEX', address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3', version: 'v2.3.1',
    status: 'active', deployTime: '2024-03-15 10:00', callCount: 158420, gasUsed: '245.6M', language: 'Solidity 0.8.19',
    compiler: 'solc 0.8.19+commit', optimizer: true, runs: 200, abiLength: 28,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenSwapDEX is ReentrancyGuard {
    address public owner;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidity;

    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event AddLiquidity(address indexed provider, address token, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() { owner = msg.sender; }

    function swap(
        address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        amountOut = _calculateOutput(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "Slippage too high");
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    function _calculateOutput(address tokenIn, address tokenOut, uint256 amountIn)
        internal view returns (uint256) {
        uint256 reserveIn = IERC20(tokenIn).balanceOf(address(this));
        uint256 reserveOut = IERC20(tokenOut).balanceOf(address(this));
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn * 997;
        return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }
}`,
  },
  {
    id: 'CT-002', name: 'ChainStaking', address: '0xabcdef1234567890abcdef1234567890abcdef1234', version: 'v1.8.0',
    status: 'active', deployTime: '2024-02-20 14:30', callCount: 89350, gasUsed: '156.2M', language: 'Solidity 0.8.17',
    compiler: 'solc 0.8.17', optimizer: true, runs: 999999, abiLength: 18,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract ChainStaking {
    struct StakeInfo { uint256 amount; uint256 startTime; uint256 rewardRate; bool active; }
    mapping(address => StakeInfo) public stakes;
    IERC20 public stakingToken;
    uint256 public totalStaked;
    uint256 public aprBasisPoints;

    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _token) {
        stakingToken = IERC20(_token);
        aprBasisPoints = 1500;
    }

    function stake(uint256 _amount, uint256 _lockDays) external {
        require(_amount > 0, "Amount must be > 0");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        stakes[msg.sender] = StakeInfo({ amount: _amount, startTime: block.timestamp, rewardRate: _getRewardRate(_lockDays), active: true });
        totalStaked += _amount;
        emit Staked(msg.sender, _amount, _lockDays);
    }

    function claimReward() external returns (uint256) {
        require(stakes[msg.sender].active, "No active stake");
        uint256 reward = _calculateReward(msg.sender);
        require(reward > 0, "No reward available");
        stakes[msg.sender].startTime = block.timestamp;
        stakingToken.transfer(msg.sender, reward);
        return reward;
    }
}`,
  },
  {
    id: 'CT-003', name: 'NFTMarketplace', address: '0x1111111111111111111111111111111111111111', version: 'v1.5.2',
    status: 'maintenance', deployTime: '2024-04-01 09:00', callCount: 42580, gasUsed: '89.3M', language: 'Solidity 0.8.19',
    compiler: 'solc 0.8.19', optimizer: true, runs: 200, abiLength: 35,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTMarketplace is ERC721URIStorage {
    struct Listing { uint256 tokenId; address seller; uint256 price; bool active; }
    mapping(uint256 => Listing) public listings;
    uint256 private _nextTokenId = 1;

    event Listed(uint256 indexed tokenId, address seller, uint256 price);
    event Sold(uint256 indexed tokenId, address buyer, address seller, uint256 price);

    constructor() ERC721("GuoxueNFT", "GNFT") {}

    function mint(string memory uri) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
    }
}`,
  },
  {
    id: 'CT-004', name: 'EvidenceRegistry', address: '0x2222222222222222222222222222222222222222', version: 'v1.2.0',
    status: 'active', deployTime: '2024-01-10 16:00', callCount: 15842, gasUsed: '42.1M', language: 'Solidity 0.8.17',
    compiler: 'solc 0.8.17', optimizer: true, runs: 999999, abiLength: 12,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract EvidenceRegistry {
    struct EvidenceRecord { bytes32 hash; string dataType; address submitter; uint256 timestamp; uint256 blockNumber; }
    mapping(bytes32 => EvidenceRecord) public records;
    bytes32[] private hashList;

    event EvidenceStored(bytes32 indexed hash, string dataType, address submitter);

    function storeHash(string memory dataType, bytes32 dataHash) external {
        require(records[dataHash].timestamp == 0, "Already exists");
        records[dataHash] = EvidenceRecord({ hash: dataHash, dataType: dataType, submitter: msg.sender, timestamp: block.timestamp, blockNumber: block.number });
        hashList.push(dataHash);
        emit EvidenceStored(dataHash, dataType, msg.sender);
    }
}`,
  },
  {
    id: 'CT-005', name: 'MultiSigWallet', address: '0x3333333333333333333333333333333333333333', version: 'v2.0.0',
    status: 'active', deployTime: '2023-12-01 11:00', callCount: 3250, gasUsed: '18.7M', language: 'Solidity 0.8.16',
    compiler: 'solc 0.8.16', optimizer: true, runs: 999999, abiLength: 15,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

contract MultiSigWallet {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction { address to; uint256 value; bytes data; bool executed; uint256 confirmations; }
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    event Submitted(uint256 indexed txIndex, address indexed sender);
    event Executed(uint256 indexed txIndex, address indexed sender);

    constructor(address[] memory _owners, uint256 _required) {
        for (uint256 i = 0; i < _owners.length; i++) { owners.push(_owners[i]); isOwner[_owners[i]] = true; }
        required = _required;
    }
}`,
  },
  {
    id: 'CT-006', name: 'GovernanceToken', address: '0x4444444444444444444444444444444444444444', version: 'v1.0.0',
    status: 'deprecated', deployTime: '2023-08-15 08:00', callCount: 0, gasUsed: '0', language: 'Solidity 0.8.12',
    compiler: 'solc 0.8.12', optimizer: false, runs: 0, abiLength: 8,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GovernanceToken is ERC20 {
    constructor() ERC20("GovernanceToken", "GOV") { _mint(msg.sender, 1000000 * 10 ** decimals()); }
}`,
  },
];

// 调用记录模拟数据
const mockCallRecords = [
  { id: 'CALL-001', contractName: 'TokenSwapDEX', method: 'swap', params: '{tokenIn: USDT, tokenOut: GXT, amountIn: 1000}', status: 'success', gasConsumed: 125430, caller: '0xUserA...', timestamp: '2024-06-08 09:30:15', txHash: '0xabc...123' },
  { id: 'CALL-002', contractName: 'ChainStaking', method: 'stake', params: '{amount: 5000 GXT, lockDays: 90}', status: 'success', gasConsumed: 89200, caller: '0xUserB...', timestamp: '2024-06-08 09:28:42', txHash: '0xdef...456' },
  { id: 'CALL-003', contractName: 'TokenSwapDEX', method: 'addLiquidity', params: '{token: USDT, amount: 10000}', status: 'success', gasConsumed: 156800, caller: '0xLPProvider', timestamp: '2024-06-08 09:25:00', txHash: '0xghi...789' },
  { id: 'CALL-004', contractName: 'NFTMarketplace', method: 'mintNFT', params: '{metadataURI: ipfs://...}', status: 'failed', gasConsumed: 65430, caller: '0xArtist...', timestamp: '2024-06-08 09:20:33', txHash: '0xjkl...012', error: 'Insufficient approval' },
  { id: 'CALL-005', contractName: 'EvidenceRegistry', method: 'storeHash', params: '{hash: 0x7f9e..., dataType: audit_log}', status: 'success', gasConsumed: 45200, caller: 'System', timestamp: '2024-06-08 09:15:10', txHash: '0xmno...345' },
  { id: 'CALL-006', contractName: 'ChainStaking', method: 'claimReward', params: '{}', status: 'success', gasConsumed: 52100, caller: '0xUserC...', timestamp: '2024-06-08 09:10:22', txHash: '0xpqr...678' },
  { id: 'CALL-007', contractName: 'MultiSigWallet', method: 'submitTransaction', params: '{to: 0xTreasury, value: 50000, data: 0x}', status: 'pending', gasConsumed: 0, caller: 'Admin-A', timestamp: '2024-06-08 09:05:00', txHash: '-' },
  { id: 'CALL-008', contractName: 'TokenSwapDEX', method: 'swap', params: '{tokenIn: GXT, tokenOut: ETH, amountIn: 2000}', status: 'success', gasConsumed: 132100, caller: '0xTrader...', timestamp: '2024-06-08 09:00:45', txHash: '0xstu...901' },
];

export default function SmartContractPage() {
  const [activeTab, setActiveTab] = useState('contracts');
  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [deployForm] = Form.useForm();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['smart-contracts'],
    queryFn: async () => { await new Promise(r => setTimeout(r, 500)); return mockContracts; },
  });

  // 合约状态标签
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '运行中' },
      maintenance: { color: 'orange', text: '维护中' },
      deprecated: { color: 'default', text: '已废弃' },
    };
    const s = map[status];
    return s ? <Tag color={s.color}>{s.text}</Tag> : <Tag>{status}</Tag>;
  };

  // 合约表格列定义
  const contractColumns = [
    {
      title: '合约信息',
      key: 'info',
      width: 230,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar shape="square" className="bg-orange-100 text-orange-600" icon={<CodeOutlined />} size={44} />
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-xs text-gray-400">{record.version} · {record.language}</div>
          </div>
        </div>
      ),
    },
    {
      title: '合约地址',
      dataIndex: 'address',
      key: 'address',
      width: 240,
      render: (addr: string) => (
        <Tooltip title={addr}>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200"
            onClick={() => { navigator.clipboard?.writeText(addr); message.success('地址已复制'); }}>
            {addr.slice(0, 10)}...{addr.slice(-8)}
          </code>
        </Tooltip>
      ),
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => getStatusTag(s) },
    { title: '调用次数', dataIndex: 'callCount', key: 'callCount', width: 100, render: (val: number) => val.toLocaleString() },
    { title: 'Gas消耗', dataIndex: 'gasUsed', key: 'gasUsed', width: 100 },
    { title: '部署时间', dataIndex: 'deployTime', key: 'deployTime', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看源码">
            <Button type="text" size="small" icon={<FileTextOutlined />}
              onClick={() => { setSelectedContract(record); setCodeModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="调用合约">
            <Button type="text" size="small" icon={<PlayCircleOutlined />}
              onClick={() => message.info(`准备调用 ${record.name}`)} />
          </Tooltip>
          <Dropdown menu={{
            items: [
              { key: 'upgrade', label: '升级合约', icon: <DeploymentUnitOutlined /> },
              { key: 'pause', label: record.status === 'active' ? '暂停合约' : '恢复合约', icon: <BugOutlined /> },
              { key: 'delete', label: '废弃', icon: <DeleteOutlined />, danger: true },
            ],
          }}>
            <Button type="text" size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // 调用记录列定义
  const callColumns = [
    { title: '调用ID', dataIndex: 'id', key: 'id', width: 100, render: (t: string) => <span className="font-mono text-blue-600 text-sm">{t}</span> },
    { title: '合约', dataIndex: 'contractName', key: 'contractName', render: (name: string) => <Tag color="blue">{name}</Tag> },
    { title: '方法', dataIndex: 'method', key: 'method', width: 130, render: (m: string) => <code className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-sm">{m}()</code> },
    { title: '参数', dataIndex: 'params', key: 'params', ellipsis: true, render: (p: string) => <span className="text-xs text-gray-500 font-mono">{p}</span> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          failed: { color: 'error', text: '失败' },
          pending: { color: 'warning', text: '待确认' },
        };
        const s = map[status];
        return s ? <Badge status={s.color as any} text={s.text} /> : <Tag>{status}</Tag>;
      },
    },
    { title: 'Gas消耗', dataIndex: 'gasConsumed', key: 'gasConsumed', width: 110, render: (g: number) => g > 0 ? g.toLocaleString() : '-' },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 160 },
  ];

  // 部署合约处理
  const handleDeploy = async () => {
    try {
      await deployForm.validateFields();
      message.success('合约部署任务已提交，预计2-3分钟完成上链');
      setDeployModalVisible(false);
      deployForm.resetFields();
    } catch (e) {
      logger.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <CodeOutlined className="text-2xl text-orange-500" />
          <h1 className="text-2xl font-bold m-0">智能合约管理</h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="合约总数" value={mockContracts.length} prefix={<CodeOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="运行中" value={mockContracts.filter(c => c.status === 'active').length}
                valueStyle={{ color: '#16A34A' }} prefix={<ThunderboltOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="总调用次数" value={308440} prefix={<ApiOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="总Gas消耗" value={552.2} suffix="M" prefix={<BugOutlined />}
                valueStyle={{ color: '#F59E0B' }} />
            </Card>
          </Col>
        </Row>

        {/* 合约列表和调用记录 Tab */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'contracts',
            label: <Space><FileTextOutlined /><span>合约列表</span></Space>,
            children: (
              <Card className="shadow-sm" extra={
                <Space>
                  <Button icon={<CloudUploadOutlined />} type="primary" onClick={() => setDeployModalVisible(true)}>
                    部署新合约
                  </Button>
                </Space>
              }>
                <Table dataSource={contracts || []} columns={contractColumns} rowKey="id" loading={isLoading}
                  pagination={{ pageSize: 6, showTotal: (t) => `共 ${t} 个合约` }} scroll={{ x: 1100 }} />
              </Card>
            ),
          },
          {
            key: 'calls',
            label: <Space><HistoryOutlined /><span>调用记录</span></Space>,
            children: (
              <Card className="shadow-sm">
                <Table dataSource={mockCallRecords} columns={callColumns} rowKey="id"
                  pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条调用记录` }}
                  scroll={{ x: 900 }} size="middle" />
              </Card>
            ),
          },
        ]} />

        {/* 合约源码查看弹窗 */}
        <Modal
          title={`合约源码 - ${selectedContract?.name} (${selectedContract?.version})`}
          open={codeModalVisible}
          onCancel={() => setCodeModalVisible(false)}
          width={900}
          footer={
            <Space>
              <Button icon={<CopyOutlined />} onClick={() => {
                navigator.clipboard?.writeText(selectedContract?.code || '');
                message.success('源码已复制到剪贴板');
              }}>复制源码</Button>
              <Button icon={<DownloadOutlined />}>下载源码</Button>
              <Button type="primary" icon={<PlayCircleOutlined />}>调用此合约</Button>
            </Space>
          }
        >
          {selectedContract && (
            <div className="space-y-4">
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="合约地址"><code className="text-xs">{selectedContract.address}</code></Descriptions.Item>
                <Descriptions.Item label="语言版本">{selectedContract.language}</Descriptions.Item>
                <Descriptions.Item label="编译器">{selectedContract.compiler}</Descriptions.Item>
                <Descriptions.Item label="编译优化">
                  {selectedContract.optimizer ? <Tag color="green">已启用 ({selectedContract.runs}次)</Tag> : <Tag>未启用</Tag>}
                </Descriptions.Item>
                <Descriptions.Item label="ABI接口数">{selectedContract.abiLength} 个方法</Descriptions.Item>
                <Descriptions.Item label="总调用次数">{selectedContract.callCount.toLocaleString()} 次</Descriptions.Item>
              </Descriptions>

              <Alert type="info" showIcon message="源码预览" description="以下为部署在链上的智能合约源码（只读），不可在线编辑。" />

              <div className="relative">
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-5 rounded-lg text-sm overflow-x-auto leading-relaxed m-0 max-h-[450px]"
                  style={{ fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace" }}>
                  <code>{selectedContract.code}</code>
                </pre>
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Progress percent={Math.min(95, selectedContract.callCount / 2000)} format={() => '安全评分'} strokeColor="#16A34A" />
                </Col>
                <Col span={8}>
                  <Progress percent={selectedContract.optimizer ? 85 : 40} format={() => '代码质量'} strokeColor="#1677FF" />
                </Col>
                <Col span={8}>
                  <Progress percent={selectedContract.abiLength > 20 ? 90 : 60} format={() => '文档完整度'} strokeColor="#7C3AED" />
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* 部署新合约弹窗 */}
        <Modal
          title="部署新合约"
          open={deployModalVisible}
          onCancel={() => setDeployModalVisible(false)}
          width={700}
          okText="开始部署"
          cancelText="取消"
          onOk={handleDeploy}
        >
          <Alert type="warning" showIcon className="mb-4" message="部署须知"
            description="合约一旦部署到区块链上将不可修改（除非使用代理模式）。请务必在部署前进行充分测试和安全审计。" />

          <Form form={deployForm} layout="vertical" className="mt-2">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="contractName" label="合约名称" rules={[{ required: true, message: '请输入合约名称' }]}>
                  <Input placeholder="例如：NewProtocol" prefix={<CodeOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="solidityVersion" label="Solidity版本" initialValue="^0.8.19">
                  <Select options={[
                    { label: '^0.8.19 (最新稳定)', value: '0.8.19' },
                    { label: '^0.8.17', value: '0.8.17' },
                    { label: '^0.8.12', value: '0.8.12' },
                    { label: '^0.6.12 (旧版)', value: '0.6.12' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="sourceCode" label="上传合约源码" rules={[{ required: true, message: '请上传或粘贴合约源码' }]}>
              <Upload.Dragger accept=".sol,.zip" maxCount={1}>
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽上传 .sol 源码文件</p>
                <p className="ant-upload-hint">支持单个 Solidity 文件或压缩包，最大 5MB</p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item name="sourceCodeText" label="或直接粘贴源码">
              <Input.TextArea rows={6} placeholder="// SPDX-License-Identifier: MIT&#10;pragma solidity ^0.8.19;&#10;&#10;contract MyContract { ... }" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="optimizerEnabled" label="编译器优化" initialValue={true} valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="runs" label="优化运行次数" initialValue={200}>
                  <InputNumber min={0} max={999999} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="network" label="部署网络" initialValue="testnet">
                  <Select options={[
                    { label: '主网 Mainnet', value: 'mainnet' },
                    { label: '测试网 Testnet', value: 'testnet' },
                    { label: '开发网 Devnet', value: 'devnet' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
