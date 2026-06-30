/**
 * 纯 Node 验证脚本（不依赖 tsx）
 * 直接用 .js + require() 验证核心模块逻辑
 */

const path = require('path');
const assert = require('assert');

// 路径别名：@/ -> src/
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/')) {
    request = path.join(__dirname, 'src', request.slice(2));
  }
  return origResolve.call(this, request, parent, ...rest);
};

// 加载 .ts 文件：尝试 require 解析
require.extensions['.ts'] = function (module, filename) {
  const source = require('fs').readFileSync(filename, 'utf-8');
  // 简单转换：去掉类型注解
  const js = source
    .replace(/: [A-Za-z<>[\]|, &]+(\s*=)/g, '$1')
    .replace(/: [A-Za-z<>[\]|, &]+(\s*[\),])/g, '$1')
    .replace(/^import .+ from .+;$/gm, '')
    .replace(/^export /gm, '');
  module._compile(js, filename);
};

let pass = 0, fail = 0;

function t(name, fn) {
  try {
    fn();
    console.log('  ✓', name);
    pass++;
  } catch (e) {
    console.log('  ✗', name, '-', e.message);
    fail++;
  }
}

console.log('\n=== Wallet ===');
try {
  const { generateAddress, validateAddress, toChecksumAddress, base58Encode, base58Decode, bech32Encode, bech32Decode, deriveAddress, WalletManager, DepositService } = require('./src/lib/wallet/index.ts');

  t('BTC 地址生成 + 校验', () => {
    const a = generateAddress('BTC', 'u1:btc:w1');
    assert.ok(a.startsWith('bc1'));
    assert.equal(validateAddress('BTC', a), true);
  });

  t('ETH 地址生成 + 校验', () => {
    const a = generateAddress('ETH', 'u1:eth:w1');
    assert.match(a, /^0x[0-9A-Fa-f]{40}$/);
    assert.equal(validateAddress('ETH', a), true);
  });

  t('TRX 地址生成 + 校验', () => {
    const a = generateAddress('TRX', 'u1:trx:w1');
    assert.ok(a.startsWith('T'));
    assert.equal(a.length, 34);
    assert.equal(validateAddress('TRX', a), true);
  });

  t('SOL 地址生成 + 校验', () => {
    const a = generateAddress('SOL', 'u1:sol:w1');
    assert.equal(validateAddress('SOL', a), true);
  });

  t('base58 往返', () => {
    const buf = Buffer.from('hello world');
    assert.equal(base58Decode(base58Encode(buf)).toString(), 'hello world');
  });

  t('bech32 往返', () => {
    const data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const e = bech32Encode('bc', data);
    const d = bech32Decode(e);
    assert.equal(d.hrp, 'bc');
    assert.deepEqual(d.data, data);
  });

  t('HD 派生确定性', () => {
    const a = deriveAddress(['abandon', 'ability'], 0, 'ETH');
    const b = deriveAddress(['abandon', 'ability'], 0, 'ETH');
    assert.equal(a, b);
  });

  t('WalletManager 默认钱包', () => {
    const wm = new WalletManager();
    const w1 = wm.createWallet('u1', 'USDT', 'hot');
    const w2 = wm.createWallet('u1', 'USDT', 'hot');
    assert.equal(w1.isDefault, true);
    assert.equal(w2.isDefault, false);
  });

  t('充值地址 + 入账', () => {
    const wm = new WalletManager();
    const ds = new DepositService(wm);
    const { address } = ds.createDepositAddress({ userId: 'u1', asset: 'BTC' });
    ds.injectDepositEvent({ userId: 'u1', asset: 'BTC', chain: 'BTC', address, amount: '0.5', txHash: 'tx1', fromAddress: 'bc1qfrom' });
    ds.scanOnce();
    ds.confirmDeposit('tx1', 3);
    const w = wm.findByAddress(address);
    assert.equal(w.balance, '0.5');
  });

  t('内部转账', () => {
    const wm = new WalletManager();
    const ds = new DepositService(wm);
    const { address: a1 } = ds.createDepositAddress({ userId: 'u1', asset: 'USDT' });
    wm.updateBalance(wm.findByAddress(a1).id, '1000');
    ds.internalTransfer({ fromUserId: 'u1', toUserId: 'u2', asset: 'USDT', amount: '100' });
    assert.equal(wm.findByAddress(a1).balance, '900');
  });
} catch (e) {
  console.log('  ✗ 模块加载失败:', e.message);
  fail++;
}

console.log('\n=== Market ===');
try {
  const { MarketFeed, createDefaultMarket, DEFAULT_SYMBOLS } = require('./src/lib/market/index.ts');
  const { generateKlineFromTrades, generateHistoricalKlines } = require('./src/lib/market/index.ts');

  t('MarketFeed 注册交易对', () => {
    const f = new MarketFeed();
    f.registerSymbol('BTC/USDT', 67000);
    const t = f.getTicker('BTC/USDT');
    assert.equal(t.lastPrice, '67000.00');
  });

  t('默认 50+ 交易对', () => {
    const f = createDefaultMarket();
    assert.equal(f.getAllTickers().length, DEFAULT_SYMBOLS.length);
    assert.ok(f.getAllTickers().length >= 50);
  });

  t('K 线从 trades 聚合', () => {
    const trades = [
      { id: '1', symbol: 'X', price: '100', quantity: '1', side: 'buy', timestamp: new Date(1000).toISOString() },
      { id: '2', symbol: 'X', price: '101', quantity: '2', side: 'sell', timestamp: new Date(2000).toISOString() },
      { id: '3', symbol: 'X', price: '99', quantity: '1.5', side: 'buy', timestamp: new Date(3000).toISOString() },
    ];
    const ks = generateKlineFromTrades(trades, '1m');
    assert.equal(ks.length, 1);
    assert.equal(ks[0].open, '100');
    assert.equal(ks[0].high, '101');
    assert.equal(ks[0].low, '99');
  });

  t('K 线历史确定性', () => {
    const a = generateHistoricalKlines('BTC/USDT', '1h', 24, 1700000000000, 67000, 1);
    const b = generateHistoricalKlines('BTC/USDT', '1h', 24, 1700000000000, 67000, 1);
    assert.equal(a.length, 24);
    for (let i = 0; i < 24; i++) assert.equal(a[i].open, b[i].open);
  });
} catch (e) {
  console.log('  ✗ 模块加载失败:', e.message);
  fail++;
}

console.log('\n=== DeFi ===');
try {
  const { StakingService, LiquidityService, SwapService } = require('./src/lib/defi/index.ts');

  t('Staking 创建池 + 质押', () => {
    const s = new StakingService();
    s.createPool({ id: 'p1', asset: 'USDT', type: 'flexible', apy: 5, lockDays: 0, minAmount: '100', maxAmount: '100000', capacity: '1000000', enabled: true });
    const p = s.stake('u1', 'p1', '1000');
    assert.equal(p.principal, '1000');
  });

  t('Staking 定期锁定', () => {
    const s = new StakingService();
    s.createPool({ id: 'p2', asset: 'BTC', type: 'locked', apy: 8, lockDays: 30, minAmount: '0.01', maxAmount: '10', capacity: '100', enabled: true });
    const p = s.stake('u1', 'p2', '0.5');
    assert.throws(() => s.unstake('u1', p.id), /locked/);
  });

  t('Liquidity 首次添加', () => {
    const s = new LiquidityService();
    s.createPool({ id: 'l1', baseAsset: 'ETH', quoteAsset: 'USDT', baseReserve: '0', quoteReserve: '0', apr: 10, feeRate: 0.003 });
    const p = s.addLiquidity('u1', 'l1', '1', '3500');
    const pool = s.getPool('l1');
    assert.equal(pool.baseReserve, '1');
    assert.equal(pool.quoteReserve, '3500');
    assert.ok(parseFloat(p.lpAmount) > 59 && parseFloat(p.lpAmount) < 60);
  });

  t('Swap 输出计算', () => {
    const liq = new LiquidityService();
    liq.createPool({ id: 's1', baseAsset: 'ETH', quoteAsset: 'USDT', baseReserve: '10', quoteReserve: '35000', apr: 5, feeRate: 0.003 });
    const out = liq.getSwapOutput('s1', 'ETH', '1');
    assert.ok(parseFloat(out.amountOut) > 3170);
    assert.ok(parseFloat(out.amountOut) < 3180);
  });

  t('Swap 三角路径', () => {
    const liq = new LiquidityService();
    liq.createPool({ id: 't1', baseAsset: 'ETH', quoteAsset: 'USDT', baseReserve: '100', quoteReserve: '350000', apr: 5, feeRate: 0.003 });
    liq.createPool({ id: 't2', baseAsset: 'SOL', quoteAsset: 'USDT', baseReserve: '1000', quoteReserve: '150000', apr: 8, feeRate: 0.003 });
    const sw = new SwapService(liq);
    const q = sw.quote('ETH', 'SOL', '1', 50);
    assert.equal(q.path.length, 3);
  });

  t('Swap 滑点保护', () => {
    const liq = new LiquidityService();
    liq.createPool({ id: 't3', baseAsset: 'BTC', quoteAsset: 'USDT', baseReserve: '0.01', quoteReserve: '670', apr: 5, feeRate: 0.003 });
    const sw = new SwapService(liq);
    assert.throws(() => sw.swap('u1', { fromAsset: 'BTC', toAsset: 'USDT', amountIn: '0.005', slippageBps: 1 }), /Slippage/);
  });
} catch (e) {
  console.log('  ✗ 模块加载失败:', e.message);
  fail++;
}

console.log(`\n📊 汇总: ${pass + fail} 测试 / ${pass} 通过 / ${fail} 失败\n`);
process.exit(fail === 0 ? 0 : 1);
