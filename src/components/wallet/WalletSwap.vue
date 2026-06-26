<template>
  <div class="wallet-swap">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <button class="back-btn" @click="$emit('close')">
        ←
      </button>
      <div class="nav-title">兑换</div>
      <button class="history-btn" @click="showHistory = true">
        📜
      </button>
    </div>

    <div class="swap-content">
      <!-- 价格影响提示 -->
      <div v-if="priceImpact > 1" class="price-impact-banner warning">
        <span class="impact-icon">⚠️</span>
        <span class="impact-text">价格影响较大: {{ formatNumber(priceImpact, 2) }}%</span>
      </div>

      <!-- 兑换卡片 -->
      <div class="swap-card">
        <!-- 支付 -->
        <div class="swap-section">
          <div class="section-header">
            <span class="section-label">支付</span>
            <span class="balance-text">余额: {{ formatBalance(fromToken.balance) }}</span>
          </div>
          <div class="swap-input-row">
            <input
              v-model.number="fromAmount"
              type="number"
              placeholder="0.0"
              class="swap-input"
              @input="onFromAmountChange"
            />
            <button class="token-selector-btn" @click="showFromTokenList = true">
              <div class="token-icon-sm"></div>
              <span class="token-symbol">{{ fromToken.symbol }}</span>
              <span class="chevron">▼</span>
            </button>
          </div>
          <div class="amount-usd">≈ ${{ formatNumber(fromAmountUSD, 2) }}</div>
        </div>

        <!-- 切换按钮 -->
        <div class="swap-divider">
          <button class="swap-button" @click="swapTokens">
            ⇅
          </button>
        </div>

        <!-- 收到 -->
        <div class="swap-section">
          <div class="section-header">
            <span class="section-label">收到</span>
            <span class="balance-text">余额: {{ formatBalance(toToken.balance) }}</span>
          </div>
          <div class="swap-input-row">
            <input
              v-model.number="toAmount"
              type="number"
              placeholder="0.0"
              class="swap-input"
              @input="onToAmountChange"
            />
            <button class="token-selector-btn" @click="showToTokenList = true">
              <div class="token-icon-sm alt"></div>
              <span class="token-symbol">{{ toToken.symbol }}</span>
              <span class="chevron">▼</span>
            </button>
          </div>
          <div class="amount-usd">≈ ${{ formatNumber(toAmountUSD, 2) }}</div>
        </div>
      </div>

      <!-- 兑换信息 -->
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">汇率</span>
          <span class="info-value">
            1 {{ fromToken.symbol }} = {{ formatNumber(exchangeRate, 6) }} {{ toToken.symbol }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">价格影响</span>
          <span class="info-value" :class="priceImpactClass">
            {{ formatNumber(priceImpact, 2) }}%
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">最小收到</span>
          <span class="info-value">
            {{ formatNumber(minReceived, 6) }} {{ toToken.symbol }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">网络费用</span>
          <span class="info-value">~${{ formatNumber(gasFeeUSD, 2) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">交易路由</span>
          <span class="info-value route">
            <span class="route-badge">Uniswap V3</span>
          </span>
        </div>
      </div>

      <!-- 滑点设置 -->
      <div class="slippage-section" @click="showSlippageSettings = true">
        <div class="slippage-left">
          <span class="slippage-icon">⚙️</span>
          <span class="slippage-label">滑点容忍度</span>
        </div>
        <div class="slippage-right">
          <span class="slippage-value">{{ slippage }}%</span>
          <span class="slippage-arrow">›</span>
        </div>
      </div>

      <!-- 快速金额按钮 -->
      <div class="quick-amounts">
        <button
          v-for="p in [25, 50, 75, 100]"
          :key="p"
          class="quick-btn"
          @click="setFromAmountPercent(p)"
        >
          {{ p }}%
        </button>
      </div>

      <!-- 兑换按钮 -->
      <button
        class="swap-submit-btn"
        :class="{ disabled: !canSwap }"
        :disabled="!canSwap"
        @click="handleSwap"
      >
        <span v-if="isSwapping">兑换中...</span>
        <span v-else-if="!fromToken || !toToken">选择代币</span>
        <span v-else-if="fromAmount <= 0">输入金额</span>
        <span v-else-if="insufficientBalance">余额不足</span>
        <span v-else>确认兑换</span>
      </button>

      <!-- 常用兑换对 -->
      <div class="popular-section">
        <div class="section-title">热门兑换对</div>
        <div class="popular-grid">
          <div
            v-for="pair in popularPairs"
            :key="pair.id"
            class="popular-item"
            @click="selectPopularPair(pair)"
          >
            <div class="popular-tokens">
              <div class="token-icon-xs"></div>
              <div class="swap-arrow-icon">→</div>
              <div class="token-icon-xs alt"></div>
            </div>
            <div class="popular-rate">
              {{ pair.rate }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Token 选择弹窗 (From) -->
    <div v-if="showFromTokenList" class="modal-overlay" @click="showFromTokenList = false">
      <div class="modal token-modal" @click.stop>
        <div class="modal-header">
          <h3>选择支付代币</h3>
          <button class="close-btn" @click="showFromTokenList = false">×</button>
        </div>
        <div class="modal-body">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input
              v-model="tokenSearchQuery"
              type="text"
              placeholder="搜索代币..."
              class="search-input"
            />
          </div>
          <div class="token-list">
            <div
              v-for="token in filteredTokenList"
              :key="token.address"
              class="token-list-item"
              @click="selectFromToken(token)"
            >
              <div class="token-icon-sm"></div>
              <div class="token-list-info">
                <div class="token-list-name">{{ token.name }}</div>
                <div class="token-list-symbol">{{ token.symbol }}</div>
              </div>
              <div class="token-list-balance">
                <div class="balance-amount">{{ formatBalance(token.balance) }}</div>
                <div class="balance-value">${{ formatNumber(token.valueUSD, 2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Token 选择弹窗 (To) -->
    <div v-if="showToTokenList" class="modal-overlay" @click="showToTokenList = false">
      <div class="modal token-modal" @click.stop>
        <div class="modal-header">
          <h3>选择收到代币</h3>
          <button class="close-btn" @click="showToTokenList = false">×</button>
        </div>
        <div class="modal-body">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input
              v-model="tokenSearchQuery2"
              type="text"
              placeholder="搜索代币..."
              class="search-input"
            />
          </div>
          <div class="token-list">
            <div
              v-for="token in filteredTokenList2"
              :key="token.address"
              class="token-list-item"
              @click="selectToToken(token)"
            >
              <div class="token-icon-sm"></div>
              <div class="token-list-info">
                <div class="token-list-name">{{ token.name }}</div>
                <div class="token-list-symbol">{{ token.symbol }}</div>
              </div>
              <div class="token-list-balance">
                <div class="balance-amount">{{ formatBalance(token.balance) }}</div>
                <div class="balance-value">${{ formatNumber(token.valueUSD, 2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 滑点设置弹窗 -->
    <div v-if="showSlippageSettings" class="modal-overlay" @click="showSlippageSettings = false">
      <div class="modal slippage-modal" @click.stop>
        <div class="modal-header">
          <h3>滑点设置</h3>
          <button class="close-btn" @click="showSlippageSettings = false">×</button>
        </div>
        <div class="modal-body">
          <div class="slippage-presets">
            <button
              v-for="preset in [0.1, 0.5, 1]"
              :key="preset"
              class="preset-btn"
              :class="{ active: slippage === preset }"
              @click="slippage = preset"
            >
              {{ preset }}%
            </button>
            <div class="custom-slippage">
              <input
                v-model.number="slippage"
                type="number"
                step="0.1"
                class="custom-input"
              />
              <span class="percent-sign">%</span>
            </div>
          </div>
          <div class="slippage-info">
            <p>滑点是指您能接受的价格变动范围。如果实际价格超出此范围，交易将被撤销。</p>
            <p class="warning">⚠️ 滑点设置过低可能导致交易失败</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
      <div class="modal confirm-modal" @click.stop>
        <div class="confirm-header">
          <div class="confirm-icon">🔄</div>
          <h3>确认兑换</h3>
        </div>
        <div class="confirm-body">
          <div class="confirm-swap">
            <div class="confirm-from">
              <span class="amount">{{ formatNumber(fromAmount, 6) }}</span>
              <span class="symbol">{{ fromToken.symbol }}</span>
            </div>
            <div class="confirm-arrow">↓</div>
            <div class="confirm-to">
              <span class="amount">{{ formatNumber(toAmount, 6) }}</span>
              <span class="symbol">{{ toToken.symbol }}</span>
            </div>
          </div>

          <div class="confirm-details">
            <div class="detail-row">
              <span class="detail-label">汇率</span>
              <span class="detail-value">1 {{ fromToken.symbol }} = {{ formatNumber(exchangeRate, 6) }} {{ toToken.symbol }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">价格影响</span>
              <span class="detail-value" :class="priceImpactClass">{{ formatNumber(priceImpact, 2) }}%</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">最小收到</span>
              <span class="detail-value">{{ formatNumber(minReceived, 6) }} {{ toToken.symbol }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">网络费用</span>
              <span class="detail-value">~${{ formatNumber(gasFeeUSD, 2) }}</span>
            </div>
          </div>

          <button class="confirm-btn" @click="confirmSwap">
            确认兑换
          </button>
          <button class="cancel-btn" @click="showConfirmModal = false">
            取消
          </button>
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
import { ref, computed } from 'vue';

const emit = defineEmits(['close', 'success']);

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  valueUSD: number;
  priceUSD: number;
}

interface PopularPair {
  id: string;
  from: string;
  to: string;
  rate: string;
}

// 状态
const fromAmount = ref<number>(0);
const toAmount = ref<number>(0);
const isSwapping = ref(false);
const slippage = ref(0.5);
const showFromTokenList = ref(false);
const showToTokenList = ref(false);
const showSlippageSettings = ref(false);
const showConfirmModal = ref(false);
const showHistory = ref(false);
const tokenSearchQuery = ref('');
const tokenSearchQuery2 = ref('');
const showToast = ref(false);
const toastMessage = ref('');

// Token 数据
const fromToken = ref<Token>({
  address: '0x0000000000000000000000000000000000000000',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  balance: '3.25',
  valueUSD: 9750.00,
  priceUSD: 3000.00,
});

const toToken = ref<Token>({
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  name: 'Tether',
  symbol: 'USDT',
  decimals: 6,
  balance: '5000',
  valueUSD: 5000.00,
  priceUSD: 1.00,
});

// Token 列表
const tokenList = ref<Token[]>([
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    balance: '3.25',
    valueUSD: 9750.00,
    priceUSD: 3000.00,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether',
    symbol: 'USDT',
    decimals: 6,
    balance: '5000',
    valueUSD: 5000.00,
    priceUSD: 1.00,
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    balance: '3200.50',
    valueUSD: 3200.50,
    priceUSD: 1.00,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    balance: '0.15',
    valueUSD: 9750.00,
    priceUSD: 65000.00,
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    balance: '1200',
    valueUSD: 1200.00,
    priceUSD: 1.00,
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    balance: '0.5',
    valueUSD: 1500.00,
    priceUSD: 3000.00,
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
    balance: '150',
    valueUSD: 1500.00,
    priceUSD: 10.00,
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    name: 'Aave Token',
    symbol: 'AAVE',
    decimals: 18,
    balance: '25',
    valueUSD: 2500.00,
    priceUSD: 100.00,
  },
]);

// 热门兑换对
const popularPairs = ref<PopularPair[]>([
  { id: '1', from: 'ETH', to: 'USDT', rate: '3,000.00' },
  { id: '2', from: 'ETH', to: 'USDC', rate: '3,000.00' },
  { id: '3', from: 'WBTC', to: 'ETH', rate: '21.67' },
  { id: '4', from: 'USDT', to: 'USDC', rate: '1.00' },
  { id: '5', from: 'UNI', to: 'ETH', rate: '0.0033' },
  { id: '6', from: 'AAVE', to: 'ETH', rate: '0.0333' },
]);

// 计算属性
const fromAmountUSD = computed(() => {
  return (fromAmount.value || 0) * fromToken.value.priceUSD;
});

const toAmountUSD = computed(() => {
  return (toAmount.value || 0) * toToken.value.priceUSD;
});

const exchangeRate = computed(() => {
  if (fromToken.value.priceUSD === 0) return 0;
  return fromToken.value.priceUSD / toToken.value.priceUSD;
});

const priceImpact = computed(() => {
  const baseImpact = (fromAmount.value * fromToken.value.priceUSD) / 100000;
  return Math.min(baseImpact * 100, 5);
});

const priceImpactClass = computed(() => {
  if (priceImpact.value < 0.5) return 'low';
  if (priceImpact.value < 1) return 'medium';
  if (priceImpact.value < 2) return 'high';
  return 'critical';
});

const minReceived = computed(() => {
  return toAmount.value * (1 - slippage.value / 100);
});

const gasFeeUSD = computed(() => {
  return 2.5;
});

const insufficientBalance = computed(() => {
  return fromAmount.value > parseFloat(fromToken.value.balance);
});

const canSwap = computed(() => {
  return (
    fromAmount.value > 0 &&
    toAmount.value > 0 &&
    !insufficientBalance.value &&
    !isSwapping.value
  );
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

const filteredTokenList2 = computed(() => {
  if (!tokenSearchQuery2.value) return tokenList.value;
  const query = tokenSearchQuery2.value.toLowerCase();
  return tokenList.value.filter(
    (t) =>
      t.name.toLowerCase().includes(query) ||
      t.symbol.toLowerCase().includes(query)
  );
});

// 方法
function formatNumber(value: number, decimals: number): string {
  if (isNaN(value)) return '0';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatBalance(balance: string): string {
  const num = parseFloat(balance);
  if (num >= 1) return num.toFixed(4);
  if (num >= 0.01) return num.toFixed(6);
  return num.toFixed(8);
}

function onFromAmountChange(): void {
  if (fromAmount.value < 0) fromAmount.value = 0;
  toAmount.value = parseFloat((fromAmount.value * exchangeRate.value).toFixed(6));
}

function onToAmountChange(): void {
  if (toAmount.value < 0) toAmount.value = 0;
  fromAmount.value = parseFloat((toAmount.value / exchangeRate.value).toFixed(6));
}

function swapTokens(): void {
  const temp = fromToken.value;
  fromToken.value = toToken.value;
  toToken.value = temp;

  const tempAmount = fromAmount.value;
  fromAmount.value = toAmount.value;
  toAmount.value = tempAmount;
}

function setFromAmountPercent(percent: number): void {
  const balance = parseFloat(fromToken.value.balance);
  fromAmount.value = parseFloat(((balance * percent) / 100).toFixed(6));
  onFromAmountChange();
}

function selectFromToken(token: Token): void {
  fromToken.value = token;
  showFromTokenList.value = false;
  onFromAmountChange();
}

function selectToToken(token: Token): void {
  toToken.value = token;
  showToTokenList.value = false;
  onFromAmountChange();
}

function selectPopularPair(pair: PopularPair): void {
  const from = tokenList.value.find((t) => t.symbol === pair.from);
  const to = tokenList.value.find((t) => t.symbol === pair.to);
  if (from) fromToken.value = from;
  if (to) toToken.value = to;
}

function handleSwap(): void {
  if (!canSwap.value) return;
  showConfirmModal.value = true;
}

async function confirmSwap(): Promise<void> {
  showConfirmModal.value = false;
  isSwapping.value = true;

  await new Promise((resolve) => setTimeout(resolve, 2500));

  isSwapping.value = false;
  showToastMessage('兑换已提交');
  emit('success', {
    hash: '0x' + Math.random().toString(16).slice(2, 66),
    from: { token: fromToken.value, amount: fromAmount.value },
    to: { token: toToken.value, amount: toAmount.value },
  });

  fromAmount.value = 0;
  toAmount.value = 0;
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
.wallet-swap {
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
  background: rgba(245, 158, 11, 0.1);
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

.history-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-content {
  padding: 20px 16px;
  padding-bottom: 40px;
}

.price-impact-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 13px;
}

.price-impact-banner.warning {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.swap-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.swap-section {
  padding: 8px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.balance-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.swap-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.swap-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  outline: none;
  width: 100%;
}

.token-selector-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.token-selector-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.token-icon-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
}

.token-icon-sm.alt {
  background: linear-gradient(135deg, #10b981, #059669);
}

.token-symbol {
  font-size: 14px;
  font-weight: 600;
}

.chevron {
  font-size: 10px;
  opacity: 0.6;
}

.amount-usd {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 6px;
}

.swap-divider {
  display: flex;
  justify-content: center;
  position: relative;
  padding: 4px 0;
}

.swap-divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.swap-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: 3px solid #1a1a2e;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: transform 0.2s;
}

.swap-button:hover {
  transform: rotate(180deg);
}

.info-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.info-value.low {
  color: #10b981;
}

.info-value.medium {
  color: #f59e0b;
}

.info-value.high {
  color: #f97316;
}

.info-value.critical {
  color: #ef4444;
}

.info-value.route {
  display: flex;
  gap: 4px;
}

.route-badge {
  padding: 2px 8px;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 4px;
  font-size: 11px;
  color: #f59e0b;
}

.slippage-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
}

.slippage-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.slippage-icon {
  font-size: 14px;
}

.slippage-label {
  color: rgba(255, 255, 255, 0.7);
}

.slippage-right {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 13px;
  font-weight: 500;
}

.slippage-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.quick-amounts {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.quick-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.swap-submit-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
  transition: all 0.2s;
}

.swap-submit-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.swap-submit-btn:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.popular-section {
  margin-top: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.popular-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.popular-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.popular-item:hover {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

.popular-tokens {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 6px;
}

.token-icon-xs {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
}

.token-icon-xs.alt {
  background: linear-gradient(135deg, #10b981, #059669);
}

.swap-arrow-icon {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.popular-rate {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
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

.token-list-info {
  flex: 1;
  min-width: 0;
}

.token-list-name {
  font-size: 14px;
  font-weight: 500;
}

.token-list-symbol {
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

.slippage-presets {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.preset-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn.active {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
  color: #f59e0b;
}

.custom-slippage {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 12px;
}

.custom-input {
  flex: 1;
  width: 50px;
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  text-align: center;
  outline: none;
}

.percent-sign {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.slippage-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

.slippage-info p {
  margin: 0 0 8px;
}

.slippage-info .warning {
  color: #f59e0b;
}

.confirm-modal {
  margin: auto;
  border-radius: 20px;
  max-height: none;
  align-self: center;
}

.confirm-header {
  text-align: center;
  padding: 24px 20px 16px;
}

.confirm-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.2);
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.confirm-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.confirm-body {
  padding: 0 20px 24px;
}

.confirm-swap {
  text-align: center;
  margin-bottom: 20px;
}

.confirm-from,
.confirm-to {
  padding: 8px 0;
}

.confirm-from .amount,
.confirm-to .amount {
  font-size: 28px;
  font-weight: 700;
  margin-right: 8px;
}

.confirm-from .symbol,
.confirm-to .symbol {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.confirm-arrow {
  font-size: 20px;
  color: #f59e0b;
  padding: 4px 0;
}

.confirm-details {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
}

.detail-label {
  color: rgba(255, 255, 255, 0.5);
}

.detail-value {
  color: #fff;
  font-weight: 500;
}

.detail-value.low {
  color: #10b981;
}

.detail-value.medium {
  color: #f59e0b;
}

.detail-value.high {
  color: #f97316;
}

.detail-value.critical {
  color: #ef4444;
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}

.cancel-btn {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
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
