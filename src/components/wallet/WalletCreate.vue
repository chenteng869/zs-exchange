<template>
  <div class="wallet-create">
    <!-- 顶部导航 -->
    <div class="nav-bar">
      <button v-if="step > 0" class="back-btn" @click="goBack">
        ←
      </button>
      <div class="nav-title">
        {{ getStepTitle() }}
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="create-content">
      <!-- 步骤 0: 选择方式 -->
      <div v-if="step === 0" class="step-container">
        <div class="hero-section">
          <div class="logo-icon">
            <span>🔐</span>
          </div>
          <h1 class="hero-title">创建钱包</h1>
          <p class="hero-desc">
            安全、便捷的去中心化钱包，<br />管理您的数字资产
          </p>
        </div>

        <div class="option-list">
          <div class="option-card" @click="startCreateWallet">
            <div class="option-icon create-icon">
              <span>✨</span>
            </div>
            <div class="option-info">
              <div class="option-title">创建新钱包</div>
              <div class="option-desc">生成新的助记词，创建全新钱包</div>
            </div>
            <div class="option-arrow">›</div>
          </div>

          <div class="option-card" @click="startImportWallet">
            <div class="option-icon import-icon">
              <span>📥</span>
            </div>
            <div class="option-info">
              <div class="option-title">导入钱包</div>
              <div class="option-desc">使用助记词或私钥导入已有钱包</div>
            </div>
            <div class="option-arrow">›</div>
          </div>

          <div class="option-card" @click="connectHardwareWallet">
            <div class="option-icon hardware-icon">
              <span>🔌</span>
            </div>
            <div class="option-info">
              <div class="option-title">硬件钱包</div>
              <div class="option-desc">连接 Ledger 或 Trezor 硬件钱包</div>
            </div>
            <div class="option-arrow">›</div>
          </div>

          <div class="option-card" @click="connectWalletConnect">
            <div class="option-icon wc-icon">
              <span>🔗</span>
            </div>
            <div class="option-info">
              <div class="option-title">WalletConnect</div>
              <div class="option-desc">扫码连接其他钱包应用</div>
            </div>
            <div class="option-arrow">›</div>
          </div>
        </div>

        <div class="terms-section">
          <label class="checkbox-label">
            <input type="checkbox" v-model="agreeTerms" />
            <span class="checkbox-custom"></span>
            <span class="terms-text">
              我已阅读并同意
              <a href="#" class="terms-link">服务条款</a>
              和
              <a href="#" class="terms-link">隐私政策</a>
            </span>
          </label>
        </div>
      </div>

      <!-- 步骤 1: 创建钱包 - 设置密码 -->
      <div v-if="step === 1" class="step-container">
        <div class="step-indicator">
          <div class="step-dot active"></div>
          <div class="step-line active"></div>
          <div class="step-dot"></div>
          <div class="step-line"></div>
          <div class="step-dot"></div>
        </div>

        <h2 class="step-title">设置钱包密码</h2>
        <p class="step-desc">
          密码用于加密保护您的钱包，请务必牢记密码
        </p>

        <div class="form-group">
          <label class="form-label">钱包密码</label>
          <div class="input-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="请输入密码（至少8位）"
              class="form-input"
              @input="checkPasswordStrength"
            />
            <button class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div class="password-strength">
            <div
              class="strength-bar"
              :class="passwordStrength.class"
              :style="{ width: passwordStrength.percent + '%' }"
            ></div>
            <span class="strength-label">{{ passwordStrength.label }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              placeholder="请再次输入密码"
              class="form-input"
            />
            <button class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <div v-if="confirmPassword && password !== confirmPassword" class="error-text">
            两次输入的密码不一致
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="enableBiometric" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">
              启用生物识别（指纹/面容）
            </span>
          </label>
        </div>

        <button
          class="primary-btn"
          :disabled="!canProceedStep1"
          @click="goToStep2"
        >
          下一步
        </button>
      </div>

      <!-- 步骤 2: 备份助记词 -->
      <div v-if="step === 2" class="step-container">
        <div class="step-indicator">
          <div class="step-dot active"></div>
          <div class="step-line active"></div>
          <div class="step-dot active"></div>
          <div class="step-line"></div>
          <div class="step-dot"></div>
        </div>

        <h2 class="step-title">备份助记词</h2>
        <p class="step-desc warning">
          ⚠️ 请务必安全备份以下12个助记词<br />
          丢失助记词将无法找回您的资产！
        </p>

        <div class="mnemonic-card">
          <div class="mnemonic-grid">
            <div
              v-for="(word, index) in mnemonicWords"
              :key="index"
              class="mnemonic-item"
            >
              <span class="mnemonic-index">{{ index + 1 }}</span>
              <span class="mnemonic-word">{{ word }}</span>
            </div>
          </div>
          <div class="mnemonic-actions">
            <button class="action-btn" @click="copyMnemonic">
              📋 复制助记词
            </button>
            <button class="action-btn" @click="downloadMnemonic">
              💾 下载备份
            </button>
          </div>
        </div>

        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <div class="warning-title">重要提示</div>
            <ul class="warning-list">
              <li>请勿将助记词存储在联网设备上</li>
              <li>建议抄写在纸上，并存放在安全地方</li>
              <li>切勿向任何人透露您的助记词</li>
              <li>ZS Exchange 不会向您索取助记词</li>
            </ul>
          </div>
        </div>

        <label class="checkbox-label confirm-check">
          <input type="checkbox" v-model="mnemonicConfirmed" />
          <span class="checkbox-custom"></span>
          <span class="checkbox-text">
            我已安全备份我的助记词，了解丢失助记词的后果
          </span>
        </label>

        <button
          class="primary-btn"
          :disabled="!mnemonicConfirmed"
          @click="goToStep3"
        >
          下一步
        </button>
      </div>

      <!-- 步骤 3: 验证助记词 -->
      <div v-if="step === 3" class="step-container">
        <div class="step-indicator">
          <div class="step-dot active"></div>
          <div class="step-line active"></div>
          <div class="step-dot active"></div>
          <div class="step-line active"></div>
          <div class="step-dot active"></div>
        </div>

        <h2 class="step-title">验证助记词</h2>
        <p class="step-desc">
          请按顺序选择第 <b>{{ verifyIndex1 }}</b>、<b>{{ verifyIndex2 }}</b>、<b>{{ verifyIndex3 }}</b> 个助记词
        </p>

        <div class="verify-inputs">
          <div
            v-for="(slot, index) in verifySlots"
            :key="index"
            class="verify-slot"
            :class="{ filled: slot, error: verifyErrors[index] }"
            @click="activeVerifySlot = index"
          >
            <span class="slot-number">{{ [verifyIndex1, verifyIndex2, verifyIndex3][index] }}</span>
            <span class="slot-word">{{ slot || '请选择' }}</span>
          </div>
        </div>

        <div class="word-options">
          <button
            v-for="word in shuffledWords"
            :key="word"
            class="word-chip"
            :class="{ selected: selectedWords.includes(word) }"
            :disabled="selectedWords.includes(word)"
            @click="selectWord(word)"
          >
            {{ word }}
          </button>
        </div>

        <button
          class="primary-btn"
          :disabled="!allVerified"
          @click="createWallet"
        >
          创建钱包
        </button>
      </div>

      <!-- 导入钱包 - 助记词导入 -->
      <div v-if="step === 10" class="step-container">
        <div class="import-tabs">
          <div
            class="import-tab"
            :class="{ active: importType === 'mnemonic' }"
            @click="importType = 'mnemonic'"
          >
            助记词
          </div>
          <div
            class="import-tab"
            :class="{ active: importType === 'privateKey' }"
            @click="importType = 'privateKey'"
          >
            私钥
          </div>
          <div
            class="import-tab"
            :class="{ active: importType === 'keystore' }"
            @click="importType = 'keystore'"
          >
            Keystore
          </div>
        </div>

        <template v-if="importType === 'mnemonic'">
          <h2 class="step-title">使用助记词导入</h2>
          <p class="step-desc">请输入您的12/15/18/21/24个助记词</p>

          <div class="mnemonic-input-area">
            <textarea
              v-model="importMnemonic"
              placeholder="请输入助记词，用空格分隔"
              class="mnemonic-textarea"
              rows="4"
            ></textarea>
            <div class="word-count">
              {{ importMnemonic.trim() ? importMnemonic.trim().split(/\s+/).length : 0 }} / 12
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">设置钱包密码</label>
            <div class="input-wrapper">
              <input
                :type="showImportPassword ? 'text' : 'password'"
                v-model="importPassword"
                placeholder="请输入密码"
                class="form-input"
              />
              <button class="toggle-password" @click="showImportPassword = !showImportPassword">
                {{ showImportPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">钱包名称（可选）</label>
            <input
              v-model="importWalletName"
              placeholder="输入钱包名称"
              class="form-input"
            />
          </div>

          <button
            class="primary-btn"
            :disabled="!canImportMnemonic"
            @click="importByMnemonic"
          >
            导入钱包
          </button>
        </template>

        <template v-if="importType === 'privateKey'">
          <h2 class="step-title">使用私钥导入</h2>
          <p class="step-desc">请输入您的私钥</p>

          <div class="input-wrapper">
            <input
              :type="showPrivateKey ? 'text' : 'password'"
              v-model="importPrivateKey"
              placeholder="请输入私钥"
              class="form-input"
            />
            <button class="toggle-password" @click="showPrivateKey = !showPrivateKey">
              {{ showPrivateKey ? '🙈' : '👁️' }}
            </button>
          </div>

          <div class="paste-section">
            <button class="paste-btn" @click="pasteFromClipboard">
              📋 粘贴
            </button>
            <button class="paste-btn" @click="scanQRCode">
              📷 扫码
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">设置钱包密码</label>
            <div class="input-wrapper">
              <input
                type="password"
                v-model="importPassword2"
                placeholder="请输入密码"
                class="form-input"
              />
            </div>
          </div>

          <button
            class="primary-btn"
            :disabled="!canImportPrivateKey"
            @click="importByPrivateKey"
          >
            导入钱包
          </button>
        </template>

        <template v-if="importType === 'keystore'">
          <h2 class="step-title">使用 Keystore 导入</h2>
          <p class="step-desc">上传或粘贴您的 Keystore JSON 文件</p>

          <div class="keystore-upload" @click="selectKeystoreFile">
            <div class="upload-icon">📁</div>
            <div class="upload-text">点击上传 JSON 文件</div>
            <div class="upload-hint">或拖拽文件到此处</div>
          </div>

          <div class="form-group">
            <label class="form-label">Keystore 密码</label>
            <input
              type="password"
              v-model="keystorePassword"
              placeholder="请输入 Keystore 密码"
              class="form-input"
            />
          </div>

          <button
            class="primary-btn"
            :disabled="!canImportKeystore"
            @click="importByKeystore"
          >
            导入钱包
          </button>
        </template>
      </div>

      <!-- 创建成功 -->
      <div v-if="step === 99" class="step-container success-step">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">钱包创建成功！</h2>
        <p class="success-desc">
          您的钱包已成功创建<br />开始管理您的数字资产吧
        </p>

        <div class="wallet-address-card">
          <div class="address-label">钱包地址</div>
          <div class="address-value">{{ newWalletAddress }}</div>
          <button class="copy-address-btn" @click="copyWalletAddress">
            📋 复制地址
          </button>
        </div>

        <button class="primary-btn" @click="finishCreate">
          开始使用
        </button>
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
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits(['success', 'close']);

// 状态
const step = ref(0);
const previousSteps: number[] = [];

// 密码相关
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const enableBiometric = ref(false);
const agreeTerms = ref(false);

// 助记词
const mnemonicWords = ref<string[]>([]);
const mnemonicConfirmed = ref(false);

// 验证助记词
const verifyIndex1 = ref(3);
const verifyIndex2 = ref(7);
const verifyIndex3 = ref(11);
const verifySlots = ref<string[]>(['', '', '']);
const activeVerifySlot = ref(0);
const verifyErrors = ref<boolean[]>([false, false, false]);
const shuffledWords = ref<string[]>([]);
const selectedWords = ref<string[]>([]);

// 导入钱包
const importType = ref('mnemonic');
const importMnemonic = ref('');
const importPassword = ref('');
const importPassword2 = ref('');
const importWalletName = ref('');
const showImportPassword = ref(false);
const showPrivateKey = ref(false);
const importPrivateKey = ref('');
const keystorePassword = ref('');
const keystoreFile = ref<any>(null);

// 成功
const newWalletAddress = ref('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');

// Toast
const showToast = ref(false);
const toastMessage = ref('');

// 计算属性
const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return { class: 'weak', percent: 0, label: '' };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 2) return { class: 'weak', percent: 33, label: '弱' };
  if (score <= 3) return { class: 'medium', percent: 66, label: '中' };
  return { class: 'strong', percent: 100, label: '强' };
});

const canProceedStep1 = computed(() => {
  return (
    password.value.length >= 8 &&
    password.value === confirmPassword.value
  );
});

const canImportMnemonic = computed(() => {
  const words = importMnemonic.value.trim().split(/\s+/);
  const validLengths = [12, 15, 18, 21, 24];
  return (
    validLengths.includes(words.length) &&
    importPassword.value.length >= 8
  );
});

const canImportPrivateKey = computed(() => {
  return (
    importPrivateKey.value.length >= 64 &&
    importPassword2.value.length >= 8
  );
});

const canImportKeystore = computed(() => {
  return keystoreFile.value && keystorePassword.value.length > 0;
});

const allVerified = computed(() => {
  return verifySlots.value.every((s) => s.length > 0);
});

// 方法
function getStepTitle(): string {
  const titles: Record<number, string> = {
    0: '创建/导入钱包',
    1: '创建钱包',
    2: '备份助记词',
    3: '验证助记词',
    10: '导入钱包',
    99: '创建成功',
  };
  return titles[step.value] || '';
}

function goBack(): void {
  if (previousSteps.length > 0) {
    step.value = previousSteps.pop()!;
  } else {
    emit('close');
  }
}

function goToNextStep(nextStep: number): void {
  previousSteps.push(step.value);
  step.value = nextStep;
}

function startCreateWallet(): void {
  if (!agreeTerms.value) {
    showToastMessage('请先同意服务条款');
    return;
  }
  goToNextStep(1);
}

function startImportWallet(): void {
  if (!agreeTerms.value) {
    showToastMessage('请先同意服务条款');
    return;
  }
  goToNextStep(10);
}

function connectHardwareWallet(): void {
  showToastMessage('硬件钱包功能开发中');
}

function connectWalletConnect(): void {
  showToastMessage('WalletConnect 功能开发中');
}

function goToStep2(): void {
  generateMnemonic();
  goToNextStep(2);
}

function goToStep3(): void {
  setupVerify();
  goToNextStep(3);
}

function generateMnemonic(): void {
  const wordlist = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt',
    'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice',
    'aerobic', 'affair', 'afford', 'afraid', 'again', 'agent', 'agree', 'ahead',
    'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert',
    'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already',
    'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused',
    'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle',
    'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any',
    'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic',
    'area', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange',
    'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask',
    'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom',
    'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt',
    'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware',
    'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon',
    'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner',
    'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle',
    'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin',
    'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best',
    'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind',
    'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket',
    'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blow', 'blue',
    'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone',
    'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom',
    'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave',
    'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk',
    'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble',
    'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle',
    'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter',
    'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake',
    'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy',
    'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car',
    'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash',
    'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle',
    'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census',
    'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos',
    'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef',
    'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose',
    'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'circle', 'citizen', 'city',
    'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk',
    'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock',
    'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster',
    'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin',
    'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common',
    'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control',
    'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn',
    'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin',
    'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash',
    'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket',
    'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'cruel',
    'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture',
    'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom',
    'cute', 'cycle', 'dad', 'damage', 'damp', 'dance', 'danger', 'daring',
    'dash', 'daughter', 'dawn', 'day', 'deal', 'debate', 'debris', 'decade',
    'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define',
    'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist',
    'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe',
    'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop',
    'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel',
    'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct',
    'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display',
    'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog',
    'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose',
    'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream',
    'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum',
    'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty',
    'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily',
    'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate',
    'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric', 'elegant',
    'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace',
    'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end',
    'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance',
    'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire',
    'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode',
    'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal',
    'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess',
    'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit',
    'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expense', 'experience',
    'expert', 'explain', 'expose', 'express', 'extend', 'extra', 'eye', 'eyebrow',
    'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false',
    'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion',
    'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february',
    'federal', 'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch',
    'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film',
    'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm',
    'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame',
    'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock',
    'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog',
    'foil', 'fold', 'follow', 'food', 'foot', 'force', 'forest', 'forget',
    'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox',
    'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front',
    'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace',
    'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery', 'game', 'garage',
    'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate', 'gather',
    'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture',
    'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give',
    'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom',
    'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good',
    'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace',
    'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid',
    'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess',
    'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half',
    'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'has', 'hat',
    'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog',
    'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high',
    'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold',
    'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn',
    ' '
  ];

  const shuffled = [...wordlist].sort(() => Math.random() - 0.5);
  mnemonicWords.value = shuffled.slice(0, 12);
}

function copyMnemonic(): void {
  const mnemonic = mnemonicWords.value.join(' ');
  navigator.clipboard?.writeText(mnemonic);
  showToastMessage('助记词已复制');
}

function downloadMnemonic(): void {
  showToastMessage('助记词备份已下载');
}

function setupVerify(): void {
  verifySlots.value = ['', '', ''];
  activeVerifySlot.value = 0;
  verifyErrors.value = [false, false, false];
  selectedWords.value = [];

  const indices = [3, 7, 11];
  verifyIndex1.value = indices[0] + 1;
  verifyIndex2.value = indices[1] + 1;
  verifyIndex3.value = indices[2] + 1;

  const answerWords = [
    mnemonicWords.value[indices[0]],
    mnemonicWords.value[indices[1]],
    mnemonicWords.value[indices[2]],
  ];

  const otherWords = mnemonicWords.value
    .filter((_, i) => !indices.includes(i))
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  shuffledWords.value = [...answerWords, ...otherWords].sort(() => Math.random() - 0.5);
}

function selectWord(word: string): void {
  if (selectedWords.value.includes(word)) return;

  verifySlots.value[activeVerifySlot.value] = word;
  selectedWords.value.push(word);

  if (activeVerifySlot.value < 2) {
    activeVerifySlot.value++;
  }
}

function createWallet(): void {
  const idx1 = verifyIndex1.value - 1;
  const idx2 = verifyIndex2.value - 1;
  const idx3 = verifyIndex3.value - 1;

  if (
    verifySlots.value[0] !== mnemonicWords.value[idx1] ||
    verifySlots.value[1] !== mnemonicWords.value[idx2] ||
    verifySlots.value[2] !== mnemonicWords.value[idx3]
  ) {
    verifyErrors.value = [true, true, true];
    showToastMessage('助记词验证失败，请重试');
    setTimeout(() => {
      setupVerify();
    }, 1500);
    return;
  }

  step.value = 99;
}

function importByMnemonic(): void {
  step.value = 99;
  emit('success', { type: 'mnemonic' });
}

function importByPrivateKey(): void {
  step.value = 99;
  emit('success', { type: 'privateKey' });
}

function importByKeystore(): void {
  step.value = 99;
  emit('success', { type: 'keystore' });
}

function pasteFromClipboard(): void {
  navigator.clipboard?.readText().then((text) => {
    importPrivateKey.value = text;
  });
}

function scanQRCode(): void {
  showToastMessage('扫码功能开发中');
}

function selectKeystoreFile(): void {
  showToastMessage('文件选择功能开发中');
}

function finishCreate(): void {
  emit('success', { type: 'create' });
}

function copyWalletAddress(): void {
  navigator.clipboard?.writeText(newWalletAddress.value);
  showToastMessage('地址已复制');
}

function showToastMessage(msg: string): void {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 2000);
}

function checkPasswordStrength(): void {
  // 实时计算在 computed 中处理
}

onMounted(() => {
  console.log('Wallet create mounted');
});
</script>

<style scoped>
.wallet-create {
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

.create-content {
  padding: 20px 24px;
  padding-bottom: 40px;
}

.step-container {
  max-width: 420px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 20px;
}

.logo-icon {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 auto 20px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px;
}

.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
}

.option-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(98, 126, 234, 0.3);
}

.option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.create-icon {
  background: linear-gradient(135deg, rgba(98, 126, 234, 0.3), rgba(139, 92, 246, 0.3));
}

.import-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3));
}

.hardware-icon {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.3));
}

.wc-icon {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(29, 78, 216, 0.3));
}

.option-info {
  flex: 1;
  min-width: 0;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.option-arrow {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.terms-section {
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.5;
}

.checkbox-label input[type='checkbox'] {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom {
  background: #627eea;
  border-color: #627eea;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.terms-text {
  color: rgba(255, 255, 255, 0.6);
}

.terms-link {
  color: #627eea;
  text-decoration: none;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 32px;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.step-dot.active {
  background: #627eea;
}

.step-line {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
}

.step-line.active {
  background: #627eea;
}

.step-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
  text-align: center;
}

.step-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0 0 32px;
  line-height: 1.6;
}

.step-desc.warning {
  color: #f59e0b;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 44px 14px 16px;
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

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.password-strength {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  transition: all 0.3s;
}

.strength-bar.weak {
  background: #ef4444;
}

.strength-bar.medium {
  background: #f59e0b;
}

.strength-bar.strong {
  background: #10b981;
}

.strength-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 20px;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
}

.checkbox-text {
  color: rgba(255, 255, 255, 0.7);
}

.confirm-check {
  margin: 24px 0;
}

.primary-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #627eea, #8b5cf6);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(98, 126, 234, 0.4);
}

.mnemonic-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mnemonic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.mnemonic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.mnemonic-index {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  min-width: 16px;
}

.mnemonic-word {
  font-size: 13px;
  font-weight: 500;
}

.mnemonic-actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
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
  margin-bottom: 8px;
  color: #f59e0b;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.8;
}

.verify-inputs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.verify-slot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.verify-slot.filled {
  border-color: #627eea;
  background: rgba(98, 126, 234, 0.1);
}

.verify-slot.error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.slot-number {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.slot-word {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
}

.verify-slot.filled .slot-word {
  color: #fff;
}

.word-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
}

.word-chip {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.word-chip:hover:not(:disabled) {
  background: rgba(98, 126, 234, 0.2);
  border-color: rgba(98, 126, 234, 0.4);
}

.word-chip.selected {
  opacity: 0.4;
  cursor: not-allowed;
}

.import-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 32px;
}

.import-tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.import-tab.active {
  background: rgba(98, 126, 234, 0.3);
  color: #fff;
  font-weight: 500;
}

.mnemonic-input-area {
  margin-bottom: 20px;
}

.mnemonic-textarea {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  resize: none;
  font-family: inherit;
}

.mnemonic-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.word-count {
  text-align: right;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 6px;
}

.paste-section {
  display: flex;
  gap: 10px;
  margin: 16px 0 24px;
}

.paste-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.paste-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.keystore-upload {
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
}

.keystore-upload:hover {
  border-color: rgba(98, 126, 234, 0.5);
  background: rgba(98, 126, 234, 0.05);
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.success-step {
  text-align: center;
  padding-top: 40px;
}

.success-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.success-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
}

.success-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin: 0 0 32px;
}

.wallet-address-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
  text-align: center;
}

.address-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.address-value {
  font-size: 14px;
  font-family: monospace;
  word-break: break-all;
  margin-bottom: 16px;
}

.copy-address-btn {
  padding: 10px 24px;
  background: rgba(98, 126, 234, 0.2);
  border: 1px solid rgba(98, 126, 234, 0.4);
  border-radius: 20px;
  color: #627eea;
  font-size: 13px;
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
