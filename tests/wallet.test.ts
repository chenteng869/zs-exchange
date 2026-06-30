/**
 * 钱包模块单元测试
 * - 地址生成/校验
 * - 钱包管理
 * - 充值流程
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAddress,
  validateAddress,
  toChecksumAddress,
  base58Encode,
  base58Decode,
  bech32Encode,
  bech32Decode,
  deriveAddress,
  WalletManager,
  DepositService,
} from '../src/lib/wallet';

// =============================================================================
// 1. 地址生成
// =============================================================================

test('BTC 地址生成：bech32 格式 + 校验和通过', () => {
  const addr = generateAddress('BTC', 'user1:btc:wallet1');
  assert.ok(addr.startsWith('bc1'));
  assert.equal(addr.length, 42); // bc + 1 + 38 数据
  assert.equal(validateAddress('BTC', addr), true);
});

test('ETH 地址生成：0x + 40 hex + EIP-55', () => {
  const addr = generateAddress('ETH', 'user1:eth:wallet1');
  assert.match(addr, /^0x[0-9A-Fa-f]{40}$/);
  // 校验和 - 必须等于 toChecksumAddress
  assert.equal(addr, toChecksumAddress(addr));
  assert.equal(validateAddress('ETH', addr), true);
});

test('BSC 地址生成：同 ETH 格式', () => {
  const addr = generateAddress('BSC', 'user1:bsc:wallet1');
  assert.match(addr, /^0x[0-9A-Fa-f]{40}$/);
});

test('TRX 地址生成：T 开头 + 34 字符 + 校验和通过', () => {
  const addr = generateAddress('TRX', 'user1:trx:wallet1');
  assert.ok(addr.startsWith('T'));
  assert.equal(addr.length, 34);
  assert.equal(validateAddress('TRX', addr), true);
});

test('SOL 地址生成：base58 + 32 字节', () => {
  const addr = generateAddress('SOL', 'user1:sol:wallet1');
  assert.ok(addr.length >= 32 && addr.length <= 44);
  assert.equal(validateAddress('SOL', addr), true);
});

test('地址校验：无效输入返回 false', () => {
  assert.equal(validateAddress('BTC', 'invalid'), false);
  assert.equal(validateAddress('ETH', '0x123'), false);
  assert.equal(validateAddress('TRX', 'TBad'), false);
  assert.equal(validateAddress('SOL', '0x123'), false);
});

test('base58 编码往返', () => {
  const buf = Buffer.from('hello world', 'utf8');
  const encoded = base58Encode(buf);
  const decoded = base58Decode(encoded);
  assert.equal(decoded.toString('utf8'), 'hello world');
});

test('bech32 编码往返', () => {
  const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const encoded = bech32Encode('bc', data);
  const { hrp, data: decoded } = bech32Decode(encoded);
  assert.equal(hrp, 'bc');
  assert.deepEqual(decoded, data);
});

test('HD 派生：相同 seed + 索引生成相同地址', () => {
  const a1 = deriveAddress(['abandon', 'ability'], 0, 'ETH');
  const a2 = deriveAddress(['abandon', 'ability'], 0, 'ETH');
  assert.equal(a1, a2);
  const a3 = deriveAddress(['abandon', 'ability'], 1, 'ETH');
  assert.notEqual(a1, a3);
});

// =============================================================================
// 2. 钱包管理
// =============================================================================

test('WalletManager：创建 BTC 钱包', () => {
  const wm = new WalletManager();
  const w = wm.createWallet('u1', 'BTC', 'hot');
  assert.equal(w.userId, 'u1');
  assert.equal(w.asset, 'BTC');
  assert.equal(w.chain, 'BTC');
  assert.ok(w.address.startsWith('bc1'));
  assert.equal(w.isDefault, true);
});

test('WalletManager：同用户同资产多个钱包，只第一个为默认', () => {
  const wm = new WalletManager();
  const w1 = wm.createWallet('u1', 'USDT', 'hot');
  const w2 = wm.createWallet('u1', 'USDT', 'hot');
  assert.equal(w1.isDefault, true);
  assert.equal(w2.isDefault, false);
  wm.setDefaultWallet(w2.id);
  assert.equal(w2.isDefault, true);
  assert.equal(w1.isDefault, false);
});

test('WalletManager：通过地址查找', () => {
  const wm = new WalletManager();
  const w = wm.createWallet('u1', 'ETH', 'hot');
  const found = wm.findByAddress(w.address);
  assert.equal(found?.id, w.id);
});

// =============================================================================
// 3. 充值流程
// =============================================================================

test('DepositService：创建充值地址', () => {
  const wm = new WalletManager();
  const ds = new DepositService(wm);
  const { address, chain, asset } = ds.createDepositAddress({ userId: 'u1', asset: 'BTC' });
  assert.equal(chain, 'BTC');
  assert.equal(asset, 'BTC');
  assert.ok(address.startsWith('bc1'));
  // 再次创建应返回同一地址
  const again = ds.createDepositAddress({ userId: 'u1', asset: 'BTC' });
  assert.equal(again.address, address);
});

test('DepositService：模拟充值 + 确认入账', () => {
  const wm = new WalletManager();
  const ds = new DepositService(wm);
  const { address } = ds.createDepositAddress({ userId: 'u1', asset: 'BTC' });
  // 注入充值事件
  ds.injectDepositEvent({
    userId: 'u1',
    asset: 'BTC',
    chain: 'BTC',
    address,
    amount: '0.5',
    txHash: '0xtx123',
    fromAddress: 'bc1qfrom...',
  });
  // 单次扫描：产生 confirming 记录
  ds.scanOnce();
  const h1 = ds.getDepositHistory('u1');
  assert.equal(h1.total, 1);
  assert.equal(h1.list[0].status, 'confirming');
  // 确认 3 次（BTC 需 3 确认）
  ds.confirmDeposit('0xtx123', 3);
  const h2 = ds.getDepositHistory('u1');
  assert.equal(h2.list[0].status, 'completed');
  // 余额应入账
  const wallet = wm.findByAddress(address);
  assert.equal(wallet?.balance, '0.5');
});

test('DepositService：内部转账即时到账', () => {
  const wm = new WalletManager();
  const ds = new DepositService(wm);
  // 准备资金
  const { address: a1 } = ds.createDepositAddress({ userId: 'u1', asset: 'USDT' });
  wm.updateBalance(wm.findByAddress(a1)!.id, '1000');
  // 内部转账
  ds.internalTransfer({
    fromUserId: 'u1',
    toUserId: 'u2',
    asset: 'USDT',
    amount: '100',
  });
  // 校验余额
  const w1 = wm.findByAddress(a1);
  assert.equal(w1?.balance, '900');
  const { address: a2 } = ds.createDepositAddress({ userId: 'u2', asset: 'USDT' });
  const w2 = wm.findByAddress(a2);
  assert.equal(w2?.balance, '100');
});

test('DepositService：充值回调触发', () => {
  const wm = new WalletManager();
  const ds = new DepositService(wm);
  const { address } = ds.createDepositAddress({ userId: 'u1', asset: 'ETH' });
  let received = 0;
  ds.onDeposit(() => { received++; });
  ds.injectDepositEvent({
    userId: 'u1', asset: 'ETH', chain: 'ETH', address,
    amount: '1', txHash: '0xa', fromAddress: '0xb',
  });
  ds.scanOnce();
  ds.confirmDeposit('0xa', 12);
  assert.equal(received, 1); // 入账时触发一次
});
