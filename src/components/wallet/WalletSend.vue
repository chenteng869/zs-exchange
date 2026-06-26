<template>
  <div class="wallet-send">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <button class="back-btn" @click="$emit('close')">
        ←
      </button>
      <div class="nav-title">转账</div>
      <button class="history-btn" @click="showHistory = true">
        🕒
      </button>
    </div>

    <div class="send-content">
      <!-- 选择 Token -->
      <div class="token-selector" @click="showTokenList = true">
        <div class="selected-token">
          <div class="token-icon">
            <span v-if="!selectedToken.logoURI" class="token-icon-fallback">
              {{ selectedToken.symbol.charAt(0) }}
            </span>
          </div>
          <div class="token-info">
            <div class="token-symbol">{{ selectedToken.symbol }}</div>
            <div class="token-balance">余额: {{ formatBalance(selectedToken.balance) }}</div>
          </div>
        </div>
        <div class="selector-arrow">▼</div>
      </div>

      <!-- 接收地址 -->
      <div class="form-section">
        <label class="form-label">接收地址</label>
        <div class="input-wrapper address-input">
          <input
            v-model="toAddress"
            type="text"
            placeholder="输入地址或扫描二维码"
            class="form-input"
          />
          <button class="input-action-btn" @click="pasteAddress">
            📋
          </button>
          <button class="input-action-btn" @click="scanQRCode">
            📷
          </button>
        </div>
        <div v-if="toAddress && !isValidAddress" class="error-text">
          无效的地址格式
        </div>
        <div v-if="toAddress && isValidAddress && isOwnAddress" class="warning-text">
          ⚠️ 这是您自己的地址
        </div>
      </div>

      <!-- 转账金额 -->
      <div class="form-section">
        <div class="amount-header">
          <label class="form-label">转账数量</label>
          <span class="balance-text">可用: {{ formatBalance(selectedToken.balance) }}</span>
        </div>
        <div class="amount-input-wrapper">
          <input
            v-model.number="amount"
            type="number"
            placeholder="0.00"
            class="amount-input"
            @input="onAmountChange"
          />
          <span class="amount-symbol">{{ selectedToken.symbol }}</span>
        </div>
        <div class="amount-usd">
          ≈ ${{ formatNumber(amountUSD, 2) }}
        </div>
        <div class="percent-buttons">
          <button
            v-for="p in [25, 50, 75, 100]"
            :key="p"
            class="percent-btn"
            @click="setAmountPercent(p)"
          >
            {{ p }}%
          </button>
        </div>
      </div>

      <!-- 网络费用 -->
      <div class="fee-section" @click="showFeeSettings = true">
        <div class="fee-left">
          <span class="fee-icon">⛽</span>
          <span class="fee-label">网络费用</span>
          <span class="fee-value">{{ gasFeeETH }} ETH</span>
          <span class="fee-usd">(${{ formatNumber(gasFeeUSD, 2) }})</span>
        </div>
        <div class="fee-right">
          <span class="fee-speed">{{ gasSpeedLabel }}</span>
          <span class="fee-arrow">›</span>
        </div>
      </div>

      <!-- 备注（可选） -->
      <div class="form-section">
        <label class="form-label">备注（可选）</label>
        <input
          v-model="memo"
          type="text"
          placeholder="添加备注（仅本地可见）"
          class="form-input"
        />
      </div>

      <!-- 转账摘要 -->
      <div class="summary-card">
        <div class="summary-row">
          <span class="summary-label">发送数量</span>
          <span class="summary-value">{{ formatNumber(amount, 6) }} {{ selectedToken.symbol }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">发送金额</span>
          <span class="summary-value">${{ formatNumber(amountUSD, 2) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">网络费用</span>
          <span class="summary-value">${{ formatNumber(gasFeeUSD, 2) }}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row total">
          <span class="summary-label">总计</span>
          <span class="summary-value">${{ formatNumber(totalUSD, 2) }}</span>
        </div>
      </div>

      <!-- 发送按钮 -->
      <button
        class="send-btn"
        :class="{ disabled: !canSend }"
        :disabled="!canSend"
        @click="handleSend"
      >
        {{ isSending ? '发送中...' : '确认发送' }}
      </button>
    </div>

    <!-- Token 选择弹窗 -->
    <div v-if="showTokenList" class="modal-overlay" @click="showTokenList = false">
      <div class="modal token-modal" @click.stop>
        <div class="modal-header">
          <h3>选择代币</h3>
          <button class="close-btn" @click="showTokenList = false">×</button>
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
              @click="selectToken(token)"
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

    <!-- Gas 设置弹窗 -->
    <div v-if="showFeeSettings" class="modal-overlay" @click="showFeeSettings = false">
      <div class="modal fee-modal" @click.stop>
        <div class="modal-header">
          <h3>网络费用设置</h3>
          <button class="close-btn" @click="showFeeSettings = false">×</button>
        </div>
        <div class="modal-body">
          <div class="fee-options">
            <div
              v-for="option in gasOptions"
              :key="option.speed"
              class="fee-option"
              :class="{ active: selectedGasOption === option.speed }"
              @click="selectGasOption(option.speed)"
            >
              <div class="option-left">
                <span class="option-icon">{{ option.icon }}</span>
                <div>
                  <div class="option-title">{{ option.label }}</div>
                  <div class="option-desc">{{ option.desc }}</div>
                </div>
              </div>
              <div class="option-right">
                <div class="option-gwei">{{ option.gwei }} Gwei</div>
                <div class="option-usd">${{ formatNumber(option.usdCost, 2) }}</div>
              </div>
            </div>
          </div>

          <div class="advanced-toggle" @click="showAdvancedGas = !showAdvancedGas">
            <span>高级设置</span>
            <span :class="{ rotated: showAdvancedGas }">▼</span>
          </div>

          <div v-if="showAdvancedGas" class="advanced-fee">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label-sm">Max Base Fee (Gwei)</label>
                <input v-model="customMaxBaseFee" type="number" class="form-input-sm" />
              </div>
              <div class="form-group">
                <label class="form-label-sm">Priority Fee (Gwei)</label>
                <input v-model="customPriorityFee" type="number" class="form-input-sm" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label-sm">Gas Limit</label>
              <input v-model="customGasLimit" type="number" class="form-input-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="showConfirmModal = false">
      <div class="modal confirm-modal" @click.stop>
        <div class="confirm-header">
          <div class="confirm-icon send">⬆️</div>
          <h3>确认转账</h3>
        </div>
        <div class="confirm-body">
          <div class="confirm-amount">
            <span class="amount-number">{{ formatNumber(amount, 6) }}</span>
            <span class="amount-token">{{ selectedToken.symbol }}</span>
          </div>
          <div class="confirm-amount-usd">${{ formatNumber(amountUSD, 2) }}</div>

          <div class="confirm-details">
            <div class="detail-row">
              <span class="detail-label">收款地址</span>
              <span class="detail-value address">{{ shortAddress(toAddress) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">网络费用</span>
              <span class="detail-value">${{ formatNumber(gasFeeUSD, 2) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">到账时间</span>
              <span class="detail-value">≈ {{ estimatedTime }}</span>
            </div>
          </div>

          <button class="confirm-btn" @click="confirmSend">
            确认并发送
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
  logoURI?: string;
  isNative: boolean;
}

// 状态
const toAddress = ref('');
const amount = ref<number>(0);
const memo = ref('');
const isSending = ref(false);
const showTokenList = ref(false);
const showFeeSettings = ref(false);
const showConfirmModal = ref(false);
const showHistory = ref(false);
const showAdvancedGas = ref(false);
const tokenSearchQuery = ref('');
const selectedGasOption = ref('standard');
const showToast = ref(false);
const toastMessage = ref('');

// 自定义 Gas
const customMaxBaseFee = ref('30');
const customPriorityFee = ref('2');
const customGasLimit = ref('21000');

// 当前选中的 Token
const selectedToken = ref<Token>({
  address: '0x0000000000000000000000000000000000000000',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  balance: '3.25',
  valueUSD: 9750.00,
  priceUSD: 3000.00,
  isNative: true,
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
    isNative: false,
  },
]);

// Gas 选项
const gasOptions = ref([
  {
    speed: 'slow',
    label: '慢速',
    desc: '约 5-10 分钟',
    icon: '🐢',
    gwei: 20,
    usdCost: 0.126,
  },
  {
    speed: 'standard',
    label: '标准',
    desc: '约 1-2 分钟',
    icon: '🚶',
    gwei: 30,
    usdCost: 0.189,
  },
  {
    speed: 'fast',
    label: '快速',
    desc: '约 15-30 秒',
    icon: '🚀',
    gwei: 50,
    usdCost: 0.315,
  },
  {
    speed: 'urgent',
    label: '极速',
    desc: '立即打包',
    icon: '⚡',
    gwei: 100,
    usdCost: 0.63,
  },
]);

// 计算属性
const isValidAddress = computed(() => {
  if (!toAddress.value) return true;
  return /^0x[a-fA-F0-9]{40}$/.test(toAddress.value);
});

const isOwnAddress = computed(() => {
  return (
    toAddress.value.toLowerCase() ===
    '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'.toLowerCase()
  );
});

const amountUSD = computed(() => {
  return (amount.value || 0) * selectedToken.value.priceUSD;
});

const gasFeeETH = computed(() => {
  const option = gasOptions.value.find((g) => g.speed === selectedGasOption.value);
  const gwei = option?.gwei || 30;
  const gasLimit = 21000;
  return ((gwei * 1e9 * gasLimit) / 1e18).toFixed(6);
});

const gasFeeUSD = computed(() => {
  return parseFloat(gasFeeETH.value) * 3000;
});

const gasSpeedLabel = computed(() => {
  const option = gasOptions.value.find((g) => g.speed === selectedGasOption.value);
  return option?.label || '标准';
});

const totalUSD = computed(() => {
  return amountUSD.value + gasFeeUSD.value;
});

const estimatedTime = computed(() => {
  const option = gasOptions.value.find((g) => g.speed === selectedGasOption.value);
  return option?.desc || '1-2 分钟';
});

const canSend = computed(() => {
  return (
    toAddress.value &&
    isValidAddress.value &&
    !isOwnAddress.value &&
    amount.value > 0 &&
    amount.value <= parseFloat(selectedToken.value.balance) &&
    !isSending.value
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

function shortAddress(address: string): string {
  if (!address) return '';
  return address.slice(0, 8) + '...' + address.slice(-6);
}

function pasteAddress(): void {
  navigator.clipboard?.readText().then((text) => {
    toAddress.value = text.trim();
  });
}

function scanQRCode(): void {
  showToastMessage('扫码功能开发中');
}

function setAmountPercent(percent: number): void {
  const balance = parseFloat(selectedToken.value.balance);
  amount.value = parseFloat(((balance * percent) / 100).toFixed(6));
}

function onAmountChange(): void {
  const balance = parseFloat(selectedToken.value.balance);
  if (amount.value > balance) {
    amount.value = balance;
  }
}

function selectToken(token: Token): void {
  selectedToken.value = token;
  showTokenList.value = false;
  amount.value = 0;
}

function selectGasOption(speed: string): void {
  selectedGasOption.value = speed;
}

function handleSend(): void {
  if (!canSend.value) return;
  showConfirmModal.value = true;
}

async function confirmSend(): Promise<void> {
  showConfirmModal.value = false;
  isSending.value = true;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  isSending.value = false;
  showToastMessage('转账已提交');
  emit('success', {
    hash: '0x' + Math.random().toString(16).slice(2, 66),
    to: toAddress.value,
    amount: amount.value,
    token: selectedToken.value,
  });

  setTimeout(() => {
    emit('close');
  }, 1500);
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
.wallet-send {
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
  background: rgba(102, 126, 234, 0.1);
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

.send-content {
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
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-icon-fallback {
  font-weight: 600;
  font-size: 14px;
}

.token-info .token-symbol {
  font-size: 16px;
  font-weight: 600;
}

.token-info .token-balance {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.selector-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.address-input .form-input {
  padding-right: 90px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #627eea;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-action-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 6px;
}

.address-input .input-action-btn:first-of-type {
  right: 48px;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
}

.warning-text {
  color: #f59e0b;
  font-size: 12px;
  margin-top: 8px;
}

.amount-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.amount-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  outline: none;
  width: 100%;
}

.amount-symbol {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 10px;
}

.amount-usd {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8px;
  margin-bottom: 12px;
}

.percent-buttons {
  display: flex;
  gap: 8px;
}

.percent-btn {
  flex: 1;
  padding: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.percent-btn:hover {
  background: rgba(98, 126, 234, 0.2);
  color: #fff;
}

.fee-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 24px;
  cursor: pointer;
}

.fee-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.fee-icon {
  font-size: 16px;
}

.fee-label {
  color: rgba(255, 255, 255, 0.6);
}

.fee-value {
  font-weight: 500;
}

.fee-usd {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.fee-right {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #627eea;
  font-size: 13px;
}

.fee-arrow {
  font-size: 12px;
}

.summary-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
}

.summary-label {
  color: rgba(255, 255, 255, 0.5);
}

.summary-value {
  color: rgba(255, 255, 255, 0.9);
}

.summary-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.summary-row.total .summary-label,
.summary-row.total .summary-value {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.send-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:not(.disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(98, 126, 234, 0.4);
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
  background: linear-gradient(135deg, #627eea, #8b5cf6);
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

.fee-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.fee-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.fee-option.active {
  border-color: #627eea;
  background: rgba(98, 126, 234, 0.1);
}

.option-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-icon {
  font-size: 24px;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
}

.option-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.option-right {
  text-align: right;
}

.option-gwei {
  font-size: 14px;
  font-weight: 500;
}

.option-usd {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.advanced-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.advanced-toggle .rotated {
  transform: rotate(180deg);
  display: inline-block;
}

.advanced-fee {
  padding-top: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-label-sm {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.form-input-sm {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
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
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.confirm-icon.send {
  background: rgba(59, 130, 246, 0.2);
}

.confirm-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.confirm-body {
  padding: 0 20px 24px;
}

.confirm-amount {
  text-align: center;
  margin-bottom: 8px;
}

.amount-number {
  font-size: 32px;
  font-weight: 700;
}

.amount-token {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 8px;
}

.confirm-amount-usd {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
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

.detail-value.address {
  font-family: monospace;
  font-size: 12px;
}

.confirm-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
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
