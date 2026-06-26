<template>
  <div class="wallet-home">
    <!-- 钱包头部 -->
    <div class="wallet-header">
      <div class="header-top">
        <div class="network-selector" @click="showNetworkList = true">
          <span class="network-icon" :class="currentNetwork?.chainType || 'evm'"></span>
          <span class="network-name">{{ currentNetwork?.name || 'Ethereum' }}</span>
          <span class="chevron-icon">▼</span>
        </div>
        <div class="header-actions">
          <button class="icon-btn" @click="handleScan">
            <span class="icon">📷</span>
          </button>
          <button class="icon-btn" @click="showSettings = true">
            <span class="icon">⚙️</span>
          </button>
        </div>
      </div>

      <!-- 钱包账户信息 -->
      <div class="account-info">
        <div class="avatar">
          <div class="avatar-inner">
            {{ walletName.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="account-details">
          <div class="wallet-name" @click="showAccountList = true">
            {{ walletName }}
            <span class="chevron-icon">▼</span>
          </div>
          <div class="address" @click="copyAddress">
            {{ displayAddress }}
            <span class="copy-icon">📋</span>
          </div>
        </div>
      </div>

      <!-- 资产总览 -->
      <div class="total-balance-card">
        <div class="balance-row">
          <span class="balance-label">总资产</span>
          <button class="toggle-visibility" @click="showBalance = !showBalance">
            {{ showBalance ? '👁️' : '🙈' }}
          </button>
        </div>
        <div class="balance-value">
          <span v-if="showBalance">${{ formatNumber(totalBalanceUSD, 2) }}</span>
          <span v-else class="hidden-balance">****</span>
        </div>
        <div class="balance-change" :class="priceChangeClass">
          <span v-if="showBalance">
            {{ priceChange24h >= 0 ? '+' : '' }}{{ formatNumber(priceChange24h, 2) }} ({{ priceChangePercent24h >= 0 ? '+' : '' }}{{ formatNumber(priceChangePercent24h, 2) }}%)
          </span>
          <span v-else>--</span>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <div class="action-item" @click="handleSend">
          <div class="action-icon send-icon">
            <span>⬆️</span>
          </div>
          <span class="action-label">转账</span>
        </div>
        <div class="action-item" @click="handleReceive">
          <div class="action-icon receive-icon">
            <span>⬇️</span>
          </div>
          <span class="action-label">收款</span>
        </div>
        <div class="action-item" @click="handleSwap">
          <div class="action-icon swap-icon">
            <span>🔄</span>
          </div>
          <span class="action-label">兑换</span>
        </div>
        <div class="action-item" @click="handleStaking">
          <div class="action-icon staking-icon">
            <span>📈</span>
          </div>
          <span class="action-label">理财</span>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 资产 Tab -->
      <div v-if="activeTab === 'assets'" class="assets-tab">
        <!-- 搜索框 -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索代币..."
            class="search-input"
          />
        </div>

        <!-- Token 列表 -->
        <div class="token-list">
          <div
            v-for="token in filteredTokens"
            :key="token.address"
            class="token-item"
            @click="showTokenDetail(token)"
          >
            <div class="token-icon">
              <img v-if="token.logoURI" :src="token.logoURI" :alt="token.symbol" />
              <span v-else class="token-icon-fallback">{{ token.symbol.charAt(0) }}</span>
            </div>
            <div class="token-info">
              <div class="token-name">{{ token.name }}</div>
              <div class="token-symbol">{{ token.symbol }}</div>
            </div>
            <div class="token-balance">
              <div class="balance-amount">
                {{ showBalance ? formatNumber(token.balance, token.decimals > 6 ? 4 : 2) : '****' }}
              </div>
              <div class="balance-value">
                {{ showBalance ? '$' + formatNumber(token.valueUSD, 2) : '****' }}
              </div>
            </div>
            <div class="token-change" :class="getTokenChangeClass(token)">
              {{ token.priceChangePercent24h >= 0 ? '+' : '' }}{{ formatNumber(token.priceChangePercent24h, 2) }}%
            </div>
          </div>
        </div>

        <!-- 添加代币按钮 -->
        <button class="add-token-btn" @click="showAddToken = true">
          <span class="plus-icon">+</span>
          添加自定义代币
        </button>
      </div>

      <!-- NFT Tab -->
      <div v-else-if="activeTab === 'nft'" class="nft-tab">
        <div v-if="nftCollections.length === 0" class="empty-state">
          <div class="empty-icon">🖼️</div>
          <div class="empty-text">暂无 NFT 资产</div>
          <button class="empty-action-btn" @click="refreshNFTs">
            刷新
          </button>
        </div>
        <div v-else>
          <div
            v-for="collection in nftCollections"
            :key="collection.address"
            class="nft-collection"
          >
            <div class="collection-header">
              <div class="collection-info">
                <img class="collection-icon" :src="collection.logo" :alt="collection.name" />
                <div>
                  <div class="collection-name">{{ collection.name }}</div>
                  <div class="collection-count">{{ collection.count }} 个</div>
                </div>
              </div>
              <div class="collection-floor">
                <div class="floor-label">地板价</div>
                <div class="floor-price">{{ collection.floorPrice }} ETH</div>
              </div>
            </div>
            <div class="nft-grid">
              <div
                v-for="nft in collection.items.slice(0, 4)"
                :key="nft.tokenId"
                class="nft-item"
                @click="showNFTDetail(nft)"
              >
                <img :src="nft.image" :alt="nft.name" class="nft-image" />
                <div class="nft-id">#{{ nft.tokenId }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 活动 Tab -->
      <div v-else-if="activeTab === 'activity'" class="activity-tab">
        <div class="activity-filter">
          <button
            v-for="filter in activityFilters"
            :key="filter.key"
            class="filter-btn"
            :class="{ active: activityFilter === filter.key }"
            @click="activityFilter = filter.key"
          >
            {{ filter.label }}
          </button>
        </div>

        <div class="activity-list">
          <div
            v-for="tx in filteredActivities"
            :key="tx.hash"
            class="activity-item"
            @click="showTransactionDetail(tx)"
          >
            <div class="activity-icon" :class="getTxTypeClass(tx.type)">
              {{ getTxTypeIcon(tx.type) }}
            </div>
            <div class="activity-info">
              <div class="activity-title">{{ getTxTypeLabel(tx.type) }}</div>
              <div class="activity-time">{{ formatTime(tx.timestamp) }}</div>
            </div>
            <div class="activity-amount">
              <div class="amount-value" :class="tx.direction === 'out' ? 'out' : 'in'">
                {{ tx.direction === 'out' ? '-' : '+' }}{{ formatNumber(tx.amount, 4) }} {{ tx.symbol }}
              </div>
              <div class="amount-status" :class="tx.status">
                {{ getStatusLabel(tx.status) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredActivities.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-text">暂无交易记录</div>
        </div>
      </div>
    </div>

    <!-- 网络选择弹窗 -->
    <div v-if="showNetworkList" class="modal-overlay" @click="showNetworkList = false">
      <div class="modal network-modal" @click.stop>
        <div class="modal-header">
          <h3>选择网络</h3>
          <button class="close-btn" @click="showNetworkList = false">×</button>
        </div>
        <div class="modal-body">
          <div class="network-section">
            <div class="section-title">主网</div>
            <div
              v-for="network in mainnetNetworks"
              :key="network.id"
              class="network-item"
              :class="{ active: currentNetworkId === network.id }"
              @click="switchNetwork(network.id)"
            >
              <div class="network-left">
                <span class="network-icon" :class="network.chainType"></span>
                <span class="network-name">{{ network.name }}</span>
              </div>
              <span v-if="currentNetworkId === network.id" class="check-icon">✓</span>
            </div>
          </div>
          <div class="network-section">
            <div class="section-title">测试网</div>
            <div
              v-for="network in testnetNetworks"
              :key="network.id"
              class="network-item"
              :class="{ active: currentNetworkId === network.id }"
              @click="switchNetwork(network.id)"
            >
              <div class="network-left">
                <span class="network-icon" :class="network.chainType"></span>
                <span class="network-name">{{ network.name }}</span>
              </div>
              <span v-if="currentNetworkId === network.id" class="check-icon">✓</span>
            </div>
          </div>
          <button class="add-network-btn" @click="showAddNetwork = true">
            + 添加网络
          </button>
        </div>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <transition name="fade">
      <div v-if="showCopySuccess" class="toast">
        地址已复制
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 类型定义
interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  valueUSD: number;
  priceUSD: number;
  priceChangePercent24h: number;
  logoURI?: string;
  isNative: boolean;
}

interface NFTCollection {
  address: string;
  name: string;
  logo: string;
  count: number;
  floorPrice: number;
  items: NFTItem[];
}

interface NFTItem {
  tokenId: string;
  name: string;
  image: string;
  collection: string;
}

interface Transaction {
  hash: string;
  type: 'send' | 'receive' | 'swap' | 'approve' | 'stake' | 'unstake';
  direction: 'in' | 'out';
  amount: string;
  symbol: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  from: string;
  to: string;
  fee?: string;
}

// 状态
const showBalance = ref(true);
const activeTab = ref('assets');
const searchQuery = ref('');
const showNetworkList = ref(false);
const showSettings = ref(false);
const showAccountList = ref(false);
const showAddToken = ref(false);
const showAddNetwork = ref(false);
const showCopySuccess = ref(false);
const activityFilter = ref('all');

// 钱包信息
const walletName = ref('我的钱包');
const walletAddress = ref('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
const currentNetworkId = ref('ethereum');

// 资产数据
const totalBalanceUSD = ref(25680.50);
const priceChange24h = ref(523.80);
const priceChangePercent24h = ref(2.08);

// Tabs
const tabs = [
  { key: 'assets', label: '资产' },
  { key: 'nft', label: 'NFT' },
  { key: 'activity', label: '活动' },
];

// 活动筛选
const activityFilters = [
  { key: 'all', label: '全部' },
  { key: 'send', label: '转账' },
  { key: 'receive', label: '收款' },
  { key: 'swap', label: '兑换' },
  { key: 'stake', label: '理财' },
];

// 网络列表
const networks = [
  { id: 'ethereum', name: 'Ethereum Mainnet', chainType: 'evm', type: 'mainnet' },
  { id: 'bsc', name: 'BNB Chain', chainType: 'evm', type: 'mainnet' },
  { id: 'polygon', name: 'Polygon', chainType: 'evm', type: 'mainnet' },
  { id: 'arbitrum', name: 'Arbitrum One', chainType: 'evm', type: 'mainnet' },
  { id: 'optimism', name: 'Optimism', chainType: 'evm', type: 'mainnet' },
  { id: 'base', name: 'Base', chainType: 'evm', type: 'mainnet' },
  { id: 'avalanche', name: 'Avalanche', chainType: 'evm', type: 'mainnet' },
  { id: 'sepolia', name: 'Sepolia Testnet', chainType: 'evm', type: 'testnet' },
  { id: 'goerli', name: 'Goerli Testnet', chainType: 'evm', type: 'testnet' },
];

// Token 列表
const tokens = ref<Token[]>([
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    balance: '3.25',
    valueUSD: 9750.00,
    priceUSD: 3000.00,
    priceChangePercent24h: 1.5,
    isNative: true,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    balance: '5000',
    valueUSD: 5000.00,
    priceUSD: 1.00,
    priceChangePercent24h: 0.01,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    balance: '3200.50',
    valueUSD: 3200.50,
    priceUSD: 1.00,
    priceChangePercent24h: -0.02,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    balance: '0.15',
    valueUSD: 9750.00,
    priceUSD: 65000.00,
    priceChangePercent24h: 3.2,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    balance: '1200',
    valueUSD: 1200.00,
    priceUSD: 1.00,
    priceChangePercent24h: 0.005,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    balance: '0.5',
    valueUSD: 1500.00,
    priceUSD: 3000.00,
    priceChangePercent24h: 1.5,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    balance: '150',
    valueUSD: 1500.00,
    priceUSD: 10.00,
    priceChangePercent24h: -2.5,
    logoURI: '',
    isNative: false,
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    name: 'Aave Token',
    symbol: 'AAVE',
    decimals: 18,
    balance: '25',
    valueUSD: 2500.00,
    priceUSD: 100.00,
    priceChangePercent24h: 5.8,
    logoURI: '',
    isNative: false,
  },
]);

// NFT 收藏
const nftCollections = ref<NFTCollection[]>([
  {
    address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    name: 'Bored Ape Yacht Club',
    logo: '',
    count: 2,
    floorPrice: 35.5,
    items: [
      { tokenId: '1234', name: 'BAYC #1234', image: '', collection: 'BAYC' },
      { tokenId: '5678', name: 'BAYC #5678', image: '', collection: 'BAYC' },
    ],
  },
  {
    address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
    name: 'Azuki',
    logo: '',
    count: 3,
    floorPrice: 12.8,
    items: [
      { tokenId: '1001', name: 'Azuki #1001', image: '', collection: 'Azuki' },
      { tokenId: '2002', name: 'Azuki #2002', image: '', collection: 'Azuki' },
      { tokenId: '3003', name: 'Azuki #3003', image: '', collection: 'Azuki' },
      { tokenId: '4004', name: 'Azuki #4004', image: '', collection: 'Azuki' },
    ],
  },
]);

// 交易历史
const transactions = ref<Transaction[]>([
  {
    hash: '0x1234...abcd',
    type: 'send',
    direction: 'out',
    amount: '0.5',
    symbol: 'ETH',
    status: 'success',
    timestamp: Date.now() - 3600000,
    from: '0x71C7...976F',
    to: '0xAbc1...2345',
    fee: '0.0012',
  },
  {
    hash: '0x5678...efgh',
    type: 'receive',
    direction: 'in',
    amount: '1000',
    symbol: 'USDT',
    status: 'success',
    timestamp: Date.now() - 7200000,
    from: '0xDef9...8765',
    to: '0x71C7...976F',
    fee: '0.0008',
  },
  {
    hash: '0x9abc...ijkl',
    type: 'swap',
    direction: 'out',
    amount: '500',
    symbol: 'USDC',
    status: 'success',
    timestamp: Date.now() - 86400000,
    from: '0x71C7...976F',
    to: 'Uniswap V3',
    fee: '0.0025',
  },
  {
    hash: '0xdef0...mnop',
    type: 'stake',
    direction: 'out',
    amount: '100',
    symbol: 'AAVE',
    status: 'success',
    timestamp: Date.now() - 172800000,
    from: '0x71C7...976F',
    to: 'Aave Protocol',
    fee: '0.0015',
  },
  {
    hash: '0x3456...qrst',
    type: 'approve',
    direction: 'out',
    amount: '0',
    symbol: 'UNI',
    status: 'success',
    timestamp: Date.now() - 259200000,
    from: '0x71C7...976F',
    to: '0xContract...',
    fee: '0.0005',
  },
  {
    hash: '0x7890...uvwx',
    type: 'receive',
    direction: 'in',
    amount: '1.5',
    symbol: 'ETH',
    status: 'pending',
    timestamp: Date.now() - 60000,
    from: '0xXyz3...9999',
    to: '0x71C7...976F',
  },
]);

// 计算属性
const displayAddress = computed(() => {
  const addr = walletAddress.value;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
});

const currentNetwork = computed(() => {
  return networks.find((n) => n.id === currentNetworkId.value);
});

const mainnetNetworks = computed(() => {
  return networks.filter((n) => n.type === 'mainnet');
});

const testnetNetworks = computed(() => {
  return networks.filter((n) => n.type === 'testnet');
});

const priceChangeClass = computed(() => {
  return priceChangePercent24h.value >= 0 ? 'positive' : 'negative';
});

const filteredTokens = computed(() => {
  if (!searchQuery.value) return tokens.value;
  const query = searchQuery.value.toLowerCase();
  return tokens.value.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.symbol.toLowerCase().includes(query)
  );
});

const filteredActivities = computed(() => {
  if (activityFilter.value === 'all') return transactions.value;
  return transactions.value.filter((t) => t.type === activityFilter.value);
});

// 方法
function formatNumber(value: number | string, decimals: number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function copyAddress(): void {
  navigator.clipboard?.writeText(walletAddress.value);
  showCopySuccess.value = true;
  setTimeout(() => {
    showCopySuccess.value = false;
  }, 2000);
}

function switchNetwork(networkId: string): void {
  currentNetworkId.value = networkId;
  showNetworkList.value = false;
}

function getTokenChangeClass(token: Token): string {
  return token.priceChangePercent24h >= 0 ? 'positive' : 'negative';
}

function getTxTypeClass(type: string): string {
  return `tx-${type}`;
}

function getTxTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    send: '⬆️',
    receive: '⬇️',
    swap: '🔄',
    approve: '✅',
    stake: '📈',
    unstake: '📉',
  };
  return icons[type] || '📝';
}

function getTxTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    send: '转账',
    receive: '收款',
    swap: '兑换',
    approve: '授权',
    stake: '质押',
    unstake: '赎回',
  };
  return labels[type] || type;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    success: '成功',
    failed: '失败',
    pending: '处理中',
  };
  return labels[status] || status;
}

function handleSend(): void {
  console.log('Send clicked');
}

function handleReceive(): void {
  console.log('Receive clicked');
}

function handleSwap(): void {
  console.log('Swap clicked');
}

function handleStaking(): void {
  console.log('Staking clicked');
}

function handleScan(): void {
  console.log('Scan clicked');
}

function showTokenDetail(token: Token): void {
  console.log('Token detail:', token.symbol);
}

function showNFTDetail(nft: NFTItem): void {
  console.log('NFT detail:', nft.name);
}

function showTransactionDetail(tx: Transaction): void {
  console.log('Tx detail:', tx.hash);
}

function refreshNFTs(): void {
  console.log('Refresh NFTs');
}

onMounted(() => {
  console.log('Wallet home mounted');
});
</script>

<style scoped>
.wallet-home {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.wallet-header {
  padding: 16px;
  padding-top: 48px;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.3) 0%, transparent 100%);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.network-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.network-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #627eea;
}

.network-icon.evm {
  background: linear-gradient(135deg, #627eea, #8b5cf6);
}

.chevron-icon {
  font-size: 10px;
  opacity: 0.7;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  backdrop-filter: blur(10px);
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.avatar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-details {
  flex: 1;
}

.wallet-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.address {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.copy-icon {
  font-size: 12px;
}

.total-balance-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.toggle-visibility {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.balance-value {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.hidden-balance {
  letter-spacing: 4px;
}

.balance-change {
  margin-top: 6px;
  font-size: 13px;
}

.balance-change.positive {
  color: #10b981;
}

.balance-change.negative {
  color: #ef4444;
}

.quick-actions {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.send-icon {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.receive-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.swap-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.staking-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.action-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.tab-bar {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.tab-item.active {
  color: #fff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #627eea, #8b5cf6);
  border-radius: 2px;
}

.tab-content {
  padding: 16px;
  padding-bottom: 100px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.search-icon {
  opacity: 0.5;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.token-list {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
}

.token-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}

.token-item:last-child {
  border-bottom: none;
}

.token-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.token-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.token-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-icon-fallback {
  font-weight: 600;
  font-size: 14px;
}

.token-info {
  flex: 1;
  min-width: 0;
}

.token-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.token-symbol {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.token-balance {
  text-align: right;
}

.balance-amount {
  font-size: 14px;
  font-weight: 500;
}

.balance-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.token-change {
  font-size: 12px;
  font-weight: 500;
  min-width: 60px;
  text-align: right;
}

.token-change.positive {
  color: #10b981;
}

.token-change.negative {
  color: #ef4444;
}

.add-token-btn {
  width: 100%;
  margin-top: 16px;
  padding: 14px;
  background: rgba(98, 126, 234, 0.15);
  border: 1px dashed rgba(98, 126, 234, 0.5);
  border-radius: 12px;
  color: #627eea;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.plus-icon {
  font-size: 18px;
}

.nft-tab {
  min-height: 300px;
}

.nft-collection {
  margin-bottom: 24px;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.collection-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #333;
}

.collection-name {
  font-size: 14px;
  font-weight: 600;
}

.collection-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.collection-floor {
  text-align: right;
}

.floor-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.floor-price {
  font-size: 13px;
  font-weight: 500;
  color: #627eea;
}

.nft-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.nft-item {
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  position: relative;
}

.nft-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.nft-id {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

.activity-tab {
  min-height: 300px;
}

.activity-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active {
  background: rgba(98, 126, 234, 0.3);
  border-color: rgba(98, 126, 234, 0.5);
  color: #fff;
}

.activity-list {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.activity-icon.tx-send {
  background: rgba(59, 130, 246, 0.2);
}

.activity-icon.tx-receive {
  background: rgba(16, 185, 129, 0.2);
}

.activity-icon.tx-swap {
  background: rgba(245, 158, 11, 0.2);
}

.activity-icon.tx-approve {
  background: rgba(139, 92, 246, 0.2);
}

.activity-icon.tx-stake {
  background: rgba(16, 185, 129, 0.2);
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 14px;
  font-weight: 500;
}

.activity-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.activity-amount {
  text-align: right;
}

.amount-value {
  font-size: 14px;
  font-weight: 500;
}

.amount-value.in {
  color: #10b981;
}

.amount-value.out {
  color: #fff;
}

.amount-status {
  font-size: 11px;
  margin-top: 2px;
}

.amount-status.success {
  color: #10b981;
}

.amount-status.failed {
  color: #ef4444;
}

.amount-status.pending {
  color: #f59e0b;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  margin-bottom: 20px;
}

.empty-action-btn {
  padding: 10px 24px;
  background: rgba(98, 126, 234, 0.3);
  border: 1px solid rgba(98, 126, 234, 0.5);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal {
  width: 100%;
  max-width: 500px;
  background: #1a1a2e;
  border-radius: 20px 20px 0 0;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 16px 20px;
}

.network-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 6px;
  transition: background 0.2s;
}

.network-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.network-item.active {
  background: rgba(98, 126, 234, 0.2);
}

.network-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.network-name {
  font-size: 14px;
}

.check-icon {
  color: #627eea;
  font-weight: 600;
}

.add-network-btn {
  width: 100%;
  padding: 14px;
  background: rgba(98, 126, 234, 0.15);
  border: 1px dashed rgba(98, 126, 234, 0.5);
  border-radius: 12px;
  color: #627eea;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
}

.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2000;
  backdrop-filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
