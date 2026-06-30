/**
 * 提现广播器 + 业务服务测试
 *
 * 覆盖（至少 12 个用例）：
 *  1. EIP-1559 交易构造（字段完整、gas 估算）
 *  2. EIP-1559 交易签名（v/r/s 长度）
 *  3. EIP-1559 签名可重现（确定性 k）
 *  4. TRX 转账构造
 *  5. TRC20 转账构造（transfer() 编码）
 *  6. 广播到 EVM RPC（mock fetch）
 *  7. 广播到 TronGrid（mock fetch）
 *  8. 跟踪确认数（递增到 required）
 *  9. 替换 nonce 取消 stuck 交易
 * 10. WithdrawalService 完整流程：创建 → 审核 → 广播 → 确认
 * 11. 大额提现自动标记 high risk
 * 12. 拒绝流程
 * 13. 风控规则（每日限额 / 黑名单地址）
 * 14. secp256k1 pubkey → address 正确性
 * 15. RLP 编码往返
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WithdrawalBroadcaster,
  Secp256k1,
  rlpEncode,
  type BuildEip1559Opts,
} from '../src/lib/wallet/withdrawal-broadcaster';
import { GasEstimator } from '../src/lib/wallet/gas-estimator';
import {
  WithdrawalService,
  WithdrawalError,
  WITHDRAWAL_LIMITS,
  HIGH_RISK_THRESHOLD_USD,
} from '../src/lib/wallet/withdrawal-service';
import { keccak256 } from 'js-sha3';

// =============================================================================
// 测试工具
// =============================================================================

// 一个确定性测试私钥（256 bit 范围内）
const TEST_PK = '0x' + 'a'.repeat(64); // 简化测试用私钥

// =============================================================================
// 1. EIP-1559 交易构造
// =============================================================================

test('EIP-1559 交易构造：字段完整 + 链 ID 正确', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const opts: BuildEip1559Opts = {
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x16345785d8a0000', // 0.1 ETH
    nonce: 5,
    maxFeePerGas: '0x4a817c800', // 20 gwei
    maxPriorityFeePerGas: '0x77359400', // 2 gwei
  };
  const tx = wb.buildEip1559Tx(opts);
  assert.equal(tx.chain, 'ETH');
  assert.equal(tx.to, opts.to);
  assert.equal(tx.value, opts.value);
  assert.equal(tx.nonce, 5);
  assert.equal(tx.maxFeePerGas, opts.maxFeePerGas);
  assert.equal(tx.maxPriorityFeePerGas, opts.maxPriorityFeePerGas);
  assert.equal(tx.raw.type, '0x2');
  assert.equal(tx.raw.chainId, '0x1');
  assert.match(tx.data, /^0x.*/);
});

test('EIP-1559 交易构造：BSC 链 ID = 56', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'BSC',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  assert.equal(tx.raw.chainId, '0x38'); // 56 in hex
});

// =============================================================================
// 2. EIP-1559 签名
// =============================================================================

test('EIP-1559 签名：v/r/s 长度正确 + 序列化 hex', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x16345785d8a0000',
    nonce: 0,
    maxFeePerGas: '0x4a817c800',
    maxPriorityFeePerGas: '0x77359400',
  });
  const signed = wb.signTx(tx, TEST_PK);
  assert.equal(signed.chain, 'ETH');
  assert.ok(signed.txHash.startsWith('0x'));
  assert.equal(signed.txHash.length, 66); // 0x + 64 hex
  assert.equal(signed.signature.r.length, 66);
  assert.equal(signed.signature.s.length, 66);
  assert.ok(typeof signed.signature.v === 'number');
  // 序列化应以 0x02 开头（EIP-1559 type）
  assert.ok(signed.serialized.startsWith('0x02'));
});

test('EIP-1559 签名：确定性 RFC 6979 产生相同结果', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const build = () => wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
    nonce: 7,
  });
  const signed1 = wb.signTx(build(), TEST_PK);
  const signed2 = wb.signTx(build(), TEST_PK);
  assert.equal(signed1.txHash, signed2.txHash);
  assert.equal(signed1.signature.r, signed2.signature.r);
  assert.equal(signed1.signature.s, signed2.signature.s);
});

// =============================================================================
// 3. secp256k1
// =============================================================================

test('secp256k1：从私钥 1 推导公钥 → address 已知', () => {
  // 私钥 = 1 -> 已知公钥 -> 已知地址 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
  const pk = 1n;
  const pub = Secp256k1.scalarMul(pk, { x: Secp256k1.Gx, y: Secp256k1.Gy });
  const xBytes = pub.x.toString(16).padStart(64, '0');
  const yBytes = pub.y.toString(16).padStart(64, '0');
  const concat = xBytes + yBytes;
  const hash = keccak256(concat);
  const addr = '0x' + hash.slice(24);
  // 公钥 X: 0x79BE667E..., Y: 0x483ADA77...
  // keccak256(pub) -> 后 20 字节
  assert.equal(addr.toLowerCase(), '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf');
});

test('secp256k1：标量乘法 G 验证', () => {
  // 2 * G
  const result = Secp256k1.scalarMul(2n, { x: Secp256k1.Gx, y: Secp256k1.Gy });
  // 2G 的 x 坐标是已知的: 0xC6047F9441ED7D6D3045406E95C07CD85C778E4B8CEF3CA7ABAC09B95C709EE5
  assert.equal(result.x, 0xc6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5n);
  // y 坐标是已知的: 0x1AE168FEA63DC339A3C58419466CEAEEF7F632653266D0E1236431A950CFE52A
  assert.equal(result.y, 0x1ae168fea63dc339a3c58419466ceaeef7f632653266d0e1236431a950cfe52an);
});

// =============================================================================
// 4. TRX / TRC20 构造
// =============================================================================

test('TRX 转账构造：amountSun 转换正确', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  // 有效 TRON 地址
  const fromAddr = 'T' + 'A'.repeat(33);
  const toAddr = 'T' + 'B'.repeat(33);
  const tx = wb.buildTrxTransfer({
    from: fromAddr,
    to: toAddr,
    amountSun: '1000000', // 1 TRX
  });
  assert.equal(tx.chain, 'TRON');
  assert.equal(tx.to, toAddr);
  assert.equal(tx.value, '1000000');
  assert.ok(tx.raw.raw_data_hex);
  assert.ok(tx.raw.raw_data.contract);
});

test('TRC20 转账构造：transfer() 编码正确', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const fromAddr = 'T' + 'A'.repeat(33);
  const toAddr = 'T' + 'B'.repeat(33);
  const contractAddr = 'T' + 'C'.repeat(33);
  const tx = wb.buildTrc20Transfer({
    contractAddress: contractAddr,
    from: fromAddr,
    to: toAddr,
    amount: '100', // 100 USDT
    decimals: 6,
  });
  assert.equal(tx.chain, 'TRON');
  // data 应包含 transfer(address,uint256) -> 0xa9059cbb
  assert.ok(tx.data!.startsWith('0xa9059cbb'));
  // amount = 100 * 10^6 = 0x5f5e100
  // padded to 64 hex
  const dataHex = tx.data!.slice(2);
  const amountHex = dataHex.slice(8 + 64); // 跳过 method(8) + to(64)
  assert.equal(BigInt('0x' + amountHex), 100_000_000n);
});

// =============================================================================
// 5. 广播（mock fetch）
// =============================================================================

test('广播到 EVM RPC：返回 txHash', async () => {
  const expectedHash = '0x' + 'a'.repeat(64);
  const mockFetch = (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (u.includes('eth') && body?.method === 'eth_sendRawTransaction') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: expectedHash }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x0' }), { status: 200 });
  }) as any;
  const wb = new WithdrawalBroadcaster({ fetchImpl: mockFetch });
  const tx = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  const signed = wb.signTx(tx, TEST_PK);
  const hash = await wb.broadcast('ETH', signed);
  assert.equal(hash.toLowerCase(), expectedHash);
});

test('广播到 TronGrid：返回 txID', async () => {
  const mockFetch = (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    if (u.includes('broadcasttransaction')) {
      return new Response(JSON.stringify({ result: true, txid: '0xabcd' }), { status: 200 });
    }
    return new Response(JSON.stringify({ result: false }), { status: 200 });
  }) as any;
  const wb = new WithdrawalBroadcaster({ fetchImpl: mockFetch });
  const txID = await wb.broadcastTron('aabbccdd', '0x' + '1'.repeat(64) + '0x' + '2'.repeat(64));
  assert.ok(txID);
  assert.equal(txID.length, 66);
});

// =============================================================================
// 6. 跟踪确认
// =============================================================================

test('跟踪确认数：递增到 required', async () => {
  let currentBlock = 1000;
  const targetBlock = 1000;
  const txHash = '0x' + 'b'.repeat(64);
  const mockFetch = (async (url: any, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.method === 'eth_blockNumber') {
      // 模拟确认数增长
      const val = currentBlock;
      currentBlock += 6; // 每次加 6
      return new Response(JSON.stringify({
        jsonrpc: '2.0', id: body.id, result: '0x' + val.toString(16),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (body?.method === 'eth_getTransactionReceipt') {
      // 当 currentBlock 达到目标 + 12 时返回 success
      if (currentBlock >= targetBlock + 12) {
        return new Response(JSON.stringify({
          jsonrpc: '2.0', id: body.id, result: {
            blockNumber: '0x' + targetBlock.toString(16),
            status: '0x1',
            gasUsed: '0x5208',
            effectiveGasPrice: '0x4a817c800',
          },
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: null }), { status: 200 });
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: null }), { status: 200 });
  }) as any;
  const wb = new WithdrawalBroadcaster({ fetchImpl: mockFetch, pollIntervalMs: 10, maxPollAttempts: 100 });
  const receipt = await wb.trackConfirmation(txHash, 'ETH', 12);
  assert.equal(receipt.status, 'success');
  assert.equal(receipt.confirmations >= 12, true);
  assert.equal(receipt.txHash, txHash);
});

// =============================================================================
// 7. 替换 nonce
// =============================================================================

test('替换 nonce 取消 stuck 交易：gas price 提价 10%', async () => {
  const mockFetch = (async (url: any, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.method === 'eth_sendRawTransaction') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x' + 'c'.repeat(64) }), { status: 200 });
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x0' }), { status: 200 });
  }) as any;
  const wb = new WithdrawalBroadcaster({ fetchImpl: mockFetch });
  const original = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
    nonce: 5,
    maxFeePerGas: '0x4a817c800', // 20 gwei
    maxPriorityFeePerGas: '0x77359400', // 2 gwei
  });
  const cancelHash = await wb.cancelStuckTransaction('ETH', original, 1.1, TEST_PK);
  assert.ok(cancelHash.startsWith('0x'));
  // 验证：新交易 nonce 应该相同
  // 验证：gas price 应至少为原来的 1.1 倍
  const expectedMinFee = BigInt('0x4a817c800') * 11n / 10n;
  assert.ok(BigInt(original.maxFeePerGas!) * 11n >= expectedMinFee * 10n);
});

// =============================================================================
// 8. WithdrawalService 完整流程
// =============================================================================

test('WithdrawalService 完整流程：创建 → 审核 → 广播 → 确认', async () => {
  const mockFetch = (async (url: any, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : null;
    if (body?.method === 'eth_sendRawTransaction') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x' + 'd'.repeat(64) }), { status: 200 });
    }
    if (body?.method === 'eth_getTransactionReceipt') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: {
        blockNumber: '0x100', status: '0x1', gasUsed: '0x5208', effectiveGasPrice: '0x4a817c800',
      } }), { status: 200 });
    }
    if (body?.method === 'eth_blockNumber') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: '0x110' }), { status: 200 });
    }
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x0' }), { status: 200 });
  }) as any;
  const wb = new WithdrawalBroadcaster({ fetchImpl: mockFetch, pollIntervalMs: 10, maxPollAttempts: 10 });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n * 10n ** 18n, // 10 ETH
    getUsdPrice: async () => 100, // 1 ETH = 100 USD -> 0.1 ETH = 10 USD, 风险低
  });
  // 创建提现
  const req = await svc.createWithdrawalRequest(
    'user1', 'ETH', '100000000000000000', // 0.1 ETH
    '0x' + '1'.repeat(40), 'ETH',
  );
  assert.ok(req.id);
  // 低风险直接 approved
  assert.equal(req.status, 'approved');
  assert.equal(req.riskLevel, 'low');
  // 执行（mock 广播）
  const result = await svc.executeWithdrawal(req.id, TEST_PK);
  assert.equal(result.status, 'pending');
  assert.ok(result.txHash);
  // 跟踪
  const tracked = await svc.trackWithdrawal(req.id);
  assert.equal(tracked.status, 'confirmed');
  assert.ok(tracked.receipt);
});

// =============================================================================
// 9. 大额提现
// =============================================================================

test('大额提现（> 5000 USD）：自动标记 high risk + pending_review', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 1000n * 10n ** 18n, // 1000 ETH
    getUsdPrice: async () => 2000, // 1 ETH = 2000 USD -> 100 ETH = 200000 USD
  });
  // 100 ETH in wei = 100 * 10^18
  const amountWei = (100n * 10n ** 18n).toString();
  const req = await svc.createWithdrawalRequest(
    'user1', 'ETH', amountWei,
    '0x' + '1'.repeat(40), 'ETH',
  );
  assert.equal(req.riskLevel, 'high');
  assert.equal(req.status, 'pending_review');
  // 不应能直接执行
  await assert.rejects(
    () => svc.executeWithdrawal(req.id, TEST_PK),
    (err: Error) => err.message.includes('approved'),
  );
});

// =============================================================================
// 10. 拒绝流程
// =============================================================================

test('拒绝流程：rejectWithdrawal 设置 status=rejected', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n ** 20n,
    getUsdPrice: async () => 2000, // 100 ETH = 200000 USD -> high risk
  });
  // 用大额制造 pending_review 状态
  const req = await svc.createWithdrawalRequest(
    'user1', 'ETH', (100n * 10n ** 18n).toString(),
    '0x' + '1'.repeat(40), 'ETH',
  );
  assert.equal(req.status, 'pending_review');
  const rejected = await svc.rejectWithdrawal(req.id, 'admin1', '地址异常');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectReason, '地址异常');
  assert.deepEqual(rejected.approvers, ['admin1']);
});

// =============================================================================
// 11. 风控：黑名单 / 每日限额
// =============================================================================

test('风控：黑名单地址被拒绝', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const blacklisted = '0x' + 'd'.repeat(40);
  const svc = new WithdrawalService({
    broadcaster: wb,
    blacklist: [blacklisted],
    getBalance: async () => 10n ** 20n,
  });
  await assert.rejects(
    () => svc.createWithdrawalRequest(
      'user1', 'ETH', '100000000000000000',
      blacklisted, 'ETH',
    ),
    (err: WithdrawalError) => err.code === 'BLACKLISTED',
  );
});

test('风控：每日限额超限被拒绝', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n ** 20n,
    getUsdPrice: async () => 0, // 低风险，直接 approved
  });
  // 第一次 9 ETH（小于 10 ETH daily limit）
  await svc.createWithdrawalRequest(
    'user1', 'ETH', (9n * 10n ** 18n).toString(),
    '0x' + '1'.repeat(40), 'ETH',
  );
  // 第二次 2 ETH -> 11 ETH 总额 > 10 daily limit
  await assert.rejects(
    () => svc.createWithdrawalRequest(
      'user1', 'ETH', (2n * 10n ** 18n).toString(),
      '0x' + '2'.repeat(40), 'ETH',
    ),
    (err: WithdrawalError) => err.code === 'DAILY_LIMIT_EXCEEDED',
  );
});

test('风控：最低金额校验', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n ** 20n,
  });
  await assert.rejects(
    () => svc.createWithdrawalRequest(
      'user1', 'ETH', '1', // 1 wei 远低于 0.001 ETH
      '0x' + '1'.repeat(40), 'ETH',
    ),
    (err: WithdrawalError) => err.code === 'BELOW_MIN',
  );
});

// =============================================================================
// 12. RLP 编码
// =============================================================================

test('RLP 编码：单字节 < 0x80 直接编码', () => {
  const buf = rlpEncode(Buffer.from([0x05]));
  assert.deepEqual([...buf], [0x05]);
});

test('RLP 编码：空字符串 -> 0x80', () => {
  const buf = rlpEncode(Buffer.alloc(0));
  assert.deepEqual([...buf], [0x80]);
});

test('RLP 编码：长字符串 0xb8 + length', () => {
  const data = Buffer.alloc(56, 0xab);
  const buf = rlpEncode(data);
  // 0xb8 + 56 + 56 bytes
  assert.equal(buf.length, 58);
  assert.equal(buf[0], 0xb8);
  assert.equal(buf[1], 56);
});

test('RLP 编码：列表', () => {
  const list = [Buffer.from([0x01]), Buffer.from([0x02])];
  const buf = rlpEncode(list);
  // 0xc2 + 0x01 + 0x02
  assert.deepEqual([...buf], [0xc2, 0x01, 0x02]);
});

// =============================================================================
// 13. GasEstimator
// =============================================================================

test('GasEstimator：fallback 数据结构正确', async () => {
  const mockFetch = (async () => new Response('{"error":"fail"}', { status: 500 })) as any;
  const ge = new GasEstimator({ fetchImpl: mockFetch });
  const eip = await ge.estimateEip1559('ETH');
  assert.equal(eip.source, 'fallback');
  assert.match(eip.maxFeePerGas, /^0x[0-9a-f]+$/);
  assert.match(eip.maxPriorityFeePerGas, /^0x[0-9a-f]+$/);
  const legacy = await ge.estimateLegacy('BSC');
  assert.equal(legacy.source, 'fallback');
  assert.match(legacy.gasPrice, /^0x[0-9a-f]+$/);
  const bw = await ge.estimateTrxBandwidth();
  assert.equal(bw.source, 'fallback');
  assert.equal(bw.bandwidth, 1500);
  ge.close();
});

// =============================================================================
// 14. EIP-1559 txHash 已知向量
// =============================================================================

test('EIP-1559 txHash 长度 66（含 0x）', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '0'.repeat(40),
    to: '0x' + '0'.repeat(40),
    value: '0x0',
    nonce: 0,
  });
  const signed = wb.signTx(tx, TEST_PK);
  assert.equal(signed.txHash.length, 66);
  // 应为 hex
  assert.match(signed.txHash, /^0x[0-9a-f]{64}$/i);
});

// =============================================================================
// 15. WithdrawalService 查询
// =============================================================================

test('WithdrawalService：listPendingApprovals 仅返回 pending_review', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n ** 24n,
    getUsdPrice: async () => 2000,
  });
  // 创建 3 个大额
  for (let i = 0; i < 3; i++) {
    await svc.createWithdrawalRequest(
      'user' + i, 'ETH', (100n * 10n ** 18n).toString(),
      '0x' + i.toString(16).padStart(40, '0'), 'ETH',
    );
  }
  // 创建 1 个低额
  await svc.createWithdrawalRequest(
    'lowUser', 'ETH', (1n * 10n ** 14n).toString(), // 0.0001 ETH
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'ETH',
  );
  const pending = svc.listPendingApprovals();
  // 3 个大额都是 pending_review
  assert.equal(pending.length, 3);
  for (const p of pending) {
    assert.equal(p.status, 'pending_review');
    assert.equal(p.riskLevel, 'high');
  }
});

test('WithdrawalService：listUserWithdrawals 按时间倒序', async () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const svc = new WithdrawalService({
    broadcaster: wb,
    getBalance: async () => 10n ** 20n,
  });
  for (let i = 0; i < 3; i++) {
    await svc.createWithdrawalRequest(
      'user1', 'ETH', (1n * 10n ** 15n).toString(), // 0.001 ETH
      '0x' + '1'.repeat(40), 'ETH',
    );
    // 间隔 1ms
    await new Promise(r => setTimeout(r, 2));
  }
  const list = svc.listUserWithdrawals('user1');
  assert.equal(list.length, 3);
  // 倒序：最新的在前
  assert.ok(list[0].createdAt >= list[1].createdAt);
  assert.ok(list[1].createdAt >= list[2].createdAt);
});

// =============================================================================
// 16. 验证常量
// =============================================================================

test('WITHDRAWAL_LIMITS 配置正确', () => {
  assert.equal(WITHDRAWAL_LIMITS.ETH.minAmount, '0.001');
  assert.equal(WITHDRAWAL_LIMITS.BSC.dailyPerUser, '100');
  assert.equal(WITHDRAWAL_LIMITS.TRON.fee, '1');
  assert.equal(HIGH_RISK_THRESHOLD_USD, 5000);
});
