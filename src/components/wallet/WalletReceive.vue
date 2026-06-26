<template>
  <div class="wallet-receive">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <button class="back-btn" @click="$emit('close')">
        ←
      </button>
      <div class="nav-title">收款</div>
      <div class="nav-right"></div>
    </div>

    <div class="receive-content">
      <!-- 选择币种 -->
      <div class="token-selector" @click="showTokenList = true">
        <div class="selected-token">
          <div class="token-icon"></div>
          <div class="token-info">
            <div class="token-symbol">{{ selectedToken.symbol }}</div>
            <div class="token-network">{{ getNetworkName() }}</div>
          </div>
        </div>
        <div class="selector-arrow">▼</div>
      </div>

      <!-- 二维码区域 -->
      <div class="qr-section">
        <div class="qr-card">
          <div class="qr-code">
            <div class="qr-placeholder">
              <div class="qr-pattern">
                <div
                  v-for="i in 100"
                  :key="i"
                  class="qr-dot"
                  :class="{ filled: qrPattern[i] }"
                ></div>
              </div>
            </div>
          </div>
          <div class="address-section">
            <div class="address-label">收款地址</div>
            <div class="address-value" @click="copyAddress">
              {{ walletAddress }}
              <span class="copy-icon">📋</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn" @click="copyAddress">
          <span class="btn-icon">📋</span>
          <span class="btn-text">复制地址</span>
        </button>
        <button class="action-btn" @click="shareAddress">
          <span class="btn-icon">📤</span>
          <span class="btn-text">分享</span>
        </button>
        <button class="action-btn" @click="saveQRCode">
          <span class="btn-icon">💾</span>
          <span class="btn-text">保存二维码</span>
        </button>
      </div>

      <!-- 网络说明 -->
      <div class="warning-box">
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
          <div class="warning-title">请注意</div>
          <p class="warning-text">
            请确保向此地址仅发送 <b>{{ selectedToken.symbol }}</b>（{{ getNetworkName() }}网络），
            发送其他资产可能导致永久丢失。
          </p>
        </div>
      </div>

      <!-- 最低转账金额 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">网络</span>
          <span class="info-value">{{ getNetworkName() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">确认区块</span>
          <span class="info-value">{{ confirmedBlocks }} 个区块</span>
        </div>
        <div class="info-row">
          <span class="info-label">预计到账时间</span>
          <span class="info-value">约 {{ estimatedTime }}</span>
        </div>
      </div>
    </div>

    <!-- Token 选择弹窗 -->
    <div v-if="showTokenList" class="modal-overlay" @click="showTokenList = false">
      <div class="modal token-modal" @click.stop>
        <div class="modal-header">
          <h3>选择币种</h3>
          <button class="close-btn" @click="showTokenList = false">×</button>
        </div>
        <div class="modal-body">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input
              v-model="tokenSearchQuery"
              type="text"
              placeholder="搜索币种..."
              class="search-input"
            />
          </div>
          <div class="token-list">
            <div
              v-for="token in filteredTokenList"
              :key="token.address"
              class="token-list-item"
              @click="selectToken(token)"
            >
              <div class="token-icon-sm"></div>
              <div class="token-list-info">
                <div class="token-list-name">{{ token.name }}</div>
                <div class="token-list-network">{{ token.network || 'Ethereum' }}</div>
              </div>
              <div class="token-list-balance">
                <div class="balance-amount">{{ formatBalance(token.balance) }}</div>
                <div class="balance-value">{{ token.symbol }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <transition name="fade">
      <div v-if="showToast" class="toast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';

defineEmits(['close']);

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  network?: string;
  chainId?: number;
}

// 状态
const walletAddress = ref('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
const showTokenList = ref(false);
const tokenSearchQuery = ref('');
const showToast = ref(false);
const toastMessage = ref('');

// 当前选中的 Token
const selectedToken = ref<Token>({
  address: '0x0000000000000000000000000000000000000000',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  balance: '3.25',
  network: 'Ethereum',
  chainId: 1,
});

// Token 列表
const tokenList = ref<Token[]>([
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    balance: '3.25',
    network: 'Ethereum',
    chainId: 1,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    balance: '5000',
    network: 'Ethereum',
    chainId: 1,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    balance: '3200.50',
    network: 'Ethereum',
    chainId: 1,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    balance: '0.15',
    network: 'Ethereum',
    chainId: 1,
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    balance: '1200',
    network: 'Ethereum',
    chainId: 1,
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    balance: '0.5',
    network: 'Ethereum',
    chainId: 1,
  },
]);

// 生成伪二维码图案
const qrPattern = reactive<Record<number, boolean>>({});
for (let i = 0; i < 100; i++) {
  qrPattern[i] = Math.random() > 0.4;
}
// 确保三个定位角是满的
for (let row = 0; row < 7; row++) {
  for (let col = 0; col < 7; col++) {
    qrPattern[row * 10 + col] = row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
    qrPattern[row * 10 + (9 - col)] = row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
    qrPattern[(9 - row) * 10 + col] = row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
  }
}

const confirmedBlocks = computed(() => {
  return 12;
});

const estimatedTime = computed(() => {
  return '2-5 分钟';
});

const filteredTokenList = computed(() => {
  if (!tokenSearchQuery.value) return tokenList.value;
  const query = tokenSearchQuery.value.toLowerCase();
  return tokenList.value.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.symbol.toLowerCase().includes(query)
  );
});

function getNetworkName(): string {
  return selectedToken.value.network || 'Ethereum';
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num >= 1) return num.toFixed(4);
  if (num >= 0.01) return num.toFixed(6);
  return num.toFixed(8);
}

function selectToken(token: Token): void {
  selectedToken.value = token;
  showTokenList.value = false;
}

function copyAddress(): void {
  navigator.clipboard?.writeText(walletAddress.value);
  showToastMessage('地址已复制');
}

function shareAddress(): void {
  if (navigator.share) {
    navigator.share({
      title: '我的钱包地址',
      text: `我的 ${selectedToken.value.symbol} 收款地址: ${walletAddress.value}`,
    });
  } else {
    copyAddress();
  }
}

function saveQRCode(): void {
  showToastMessage('二维码已保存');
}

function showToastMessage(msg: string): void {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2000);
}
</script>

<style scoped>
.wallet-receive {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: 44px;
  background: rgba(16, 185, 129, 0.1);
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
}

.nav-right {
  width: 36px;
}

.receive-content {
  padding: 20px 16px;
  padding-bottom: 40px;
}

.token-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  margin-bottom: 24px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.selected-token {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
}

.token-info .token-symbol {
  font-size: 16px;
  font-weight: 600;
}

.token-info .token-network {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.selector-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.qr-section {
  margin-bottom: 24px;
}

.qr-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
}

.qr-code {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-pattern {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 1px;
  width: 180px;
  height: 180px;
}

.qr-dot {
  background: transparent;
  border-radius: 1px;
}

.qr-dot.filled {
  background: #000;
}

.address-section {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.address-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.address-value {
  font-size: 14px;
  color: #1f2937;
  font-family: monospace;
  word-break: break-all;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.copy-icon {
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(98, 126, 234, 0.15);
  border-color: rgba(98, 126, 234, 0.3);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.warning-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  margin-bottom: 20px;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #f59e0b;
}

.warning-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0;
}

.info-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
}

.info-label {
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  color: rgba(255, 255, 255, 0.9);
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

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.06);
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

.token-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.2s;
}

.token-list-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.token-icon-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  flex-shrink: 0;
}

.token-list-info {
  flex: 1;
  min-width: 0;
}

.token-list-name {
  font-size: 14px;
  font-weight: 500;
}

.token-list-network {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.token-list-balance {
  text-align: right;
}

.token-list-balance .balance-amount {
  font-size: 14px;
  font-weight: 500;
}

.token-list-balance .balance-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
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
