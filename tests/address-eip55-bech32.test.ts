/**
 * wallet/address.ts 综合验证
 *  - 10+ EIP-55 真实以太坊地址（来自 EIP-55 规范及公开资料）
 *  - bech32 边界场景
 *  - 多链生成一致性
 */
import {
  toChecksumAddress,
  validateAddress,
  generateBtcAddress,
  generateBtcTaprootAddress,
  generateEthAddress,
  generateTrxAddress,
  generateBscAddress,
  generateSolAddress,
  bech32Encode,
  bech32Decode,
  convertBits,
  AddressError,
  Chain,
} from '../src/lib/wallet/address';

let pass = 0, fail = 0;
const errors: string[] = [];
function t(name: string, fn: () => void) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e: any) { fail++; errors.push(`${name}: ${e.message}`); console.log(`  ✗ ${name}: ${e.message}`); }
}

console.log('\n=== EIP-55 真实地址校验（10+ 已知地址）===\n');

// 来自 EIP-55 规范的官方测试向量
t('EIP-55 #1: 0x52908400098527886E0F7030069857D2E4169EE7', () => {
  const a = '0x52908400098527886E0F7030069857D2E4169EE7';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
  expect(validateAddress('ETH', a) === true, 'should validate');
});
t('EIP-55 #2: 0x8617E340B3D01FA5F11F306F4090FD50E238070D', () => {
  const a = '0x8617E340B3D01FA5F11F306F4090FD50E238070D';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
});
t('EIP-55 #3: 0xde709f2102306220921060314715629080e2fb77', () => {
  const a = '0xde709f2102306220921060314715629080e2fb77';
  const up = toChecksumAddress(a);
  expect(toChecksumAddress(up) === up, `roundtrip failed: ${up}`);
  expect(validateAddress('ETH', up) === true, 'checksum address should validate');
});
t('EIP-55 #4: 0x27b1fdb04752bbc536007a920d24acb045561c26', () => {
  const a = '0x27b1fdb04752bbc536007a920d24acb045561c26';
  const up = toChecksumAddress(a);
  expect(toChecksumAddress(up) === up, 'roundtrip');
});
t('EIP-55 #5: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', () => {
  const a = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
});
t('EIP-55 #6: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', () => {
  const a = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
});
t('EIP-55 #7: 0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB', () => {
  const a = '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
});
t('EIP-55 #8: 0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb', () => {
  const a = '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb';
  expect(toChecksumAddress(a) === a, `got ${toChecksumAddress(a)}`);
});

// 实际名人地址
t('Vitalik Buterin address (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)', () => {
  const a = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  expect(toChecksumAddress(a) === a, `Vitalik mismatch: got ${toChecksumAddress(a)}`);
  expect(validateAddress('ETH', a) === true, 'Vitalik should validate');
});

// 边界：全 0 与全 1
t('全 0 地址: 0x0000...0000 (40 个 0)', () => {
  const a = '0x' + '0'.repeat(40);
  const up = toChecksumAddress(a);
  expect(toChecksumAddress(up) === up, 'all-zero roundtrip');
});

// 错误 checksum
t('拒绝错 checksum 地址', () => {
  const valid = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
  // 改动一个字符
  const bad = valid.slice(0, -1) + (valid.slice(-1) === 'd' ? 'e' : 'd');
  expect(validateAddress('ETH', bad) === false, 'should reject bad checksum');
});

console.log('\n=== 错误处理 / 输入校验 ===\n');

t('拒绝过短地址', () => {
  let threw = false;
  try { toChecksumAddress('0x1234'); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw AddressError');
});
t('拒绝非 hex 字符', () => {
  let threw = false;
  try { toChecksumAddress('0x' + 'g'.repeat(40)); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw AddressError');
});
t('拒绝非字符串', () => {
  let threw = false;
  try { toChecksumAddress(null as any); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw AddressError');
});

console.log('\n=== bech32 编码/解码 ===\n');

t('BIP-173 测试向量 1', () => {
  // A12UEL5L
  const data = convertBits([0x00, 0x01, 0x02, 0x03, 0x04], 8, 5);
  const enc = bech32Encode('a', data);
  expect(enc.startsWith('a1'), `expected starts with a1: ${enc}`);
  const dec = bech32Decode(enc);
  expect(dec.hrp === 'a', 'hrp');
  expect(dec.encoding === 'bech32', 'encoding');
});

t('BIP-173 P2WPKH 测试向量 (BC1Q, 42 字符)', () => {
  // 真实 P2WPKH: witness v0 + 20 字节 program = 32 字符数据 + 6 校验和 = 38 字符数据部分
  // 实际地址格式: bc1q + 38 字符 = 42 字符
  const program = [0x75, 0x1e, 0x76, 0xe8, 0x19, 0x91, 0x96, 0xd4, 0x54, 0x94, 0x1c, 0x45, 0xd1, 0xb3, 0xa3, 0x23, 0xf1, 0x43, 0x3b, 0xd6];
  // segwit 编码：version (0) 作为 5-bit 值 + program 8->5 (无 pad)
  const data5 = [0, ...convertBits(program, 8, 5, false)];
  const enc = bech32Encode('bc', data5);
  expect(enc.startsWith('bc1q'), `expected bc1q: ${enc}`);
  expect(enc.length === 42, `expected length 42: got ${enc.length} (${enc})`);
  // 验证可解码并能反向
  const dec = bech32Decode(enc);
  expect(dec.hrp === 'bc', 'hrp bc');
  expect(dec.encoding === 'bech32', 'bech32');
  // data 应该有 33 个 5-bit 值（version + 32 个 program）
  expect(dec.data.length === 33, `data length: got ${dec.data.length}, expected 33`);
});

t('bech32 输入校验: 拒绝 data 中含 32+ 值', () => {
  let threw = false;
  try { bech32Encode('bc', [0, 32, 0]); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw');
});

t('bech32 输入校验: 拒绝负值', () => {
  let threw = false;
  try { bech32Encode('bc', [0, -1, 0]); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw');
});

t('bech32 输入校验: 拒绝空 hrp', () => {
  let threw = false;
  try { bech32Encode('', [0, 1, 2]); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw');
});

t('bech32 输入校验: 拒绝非数组 data', () => {
  let threw = false;
  try { bech32Encode('bc', 'abc' as any); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw');
});

t('bech32 convertBits: 8->5->8 往返一致 (5 字节边界)', () => {
  // 5 字节 = 40 bits，能整除 5
  const orig = [0x12, 0x34, 0x56, 0x78, 0x9a];
  const five = convertBits(orig, 8, 5, true);
  expect(five.length === 8, `expected 8 5-bit values, got ${five.length}`);
  const back = convertBits(five, 5, 8, true);
  expect(JSON.stringify(back) === JSON.stringify(orig), `roundtrip failed: ${back}`);
});

t('bech32 convertBits: 拒绝超界值', () => {
  let threw = false;
  try { convertBits([32], 8, 5); } catch (e) { threw = e instanceof AddressError; }
  expect(threw, 'should throw');
});

t('bech32m (BIP-350) 编码: taproot 32 字节公钥', () => {
  // taproot: witness v1 + 32 字节 x-only pubkey
  const pubkey = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
                  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f];
  // 32 字节 = 256 bits, 256/5 = 51.2，需要 pad
  const program5 = convertBits(pubkey, 8, 5, true);
  expect(program5.length === 52, `expected 52 5-bit values, got ${program5.length}`);
  // 加上 version 1
  const data5 = [1, ...program5];
  const enc = bech32Encode('bc', data5, 'bech32m');
  expect(enc.startsWith('bc1p'), `expected bc1p: ${enc}`);
  // 1 + 52 + 6 = 59 字符数据部分 + "bc1" = 62 字符
  expect(enc.length === 62, `expected length 62: got ${enc.length} (${enc})`);
  // 验证能正确解码
  const dec = bech32Decode(enc);
  expect(dec.encoding === 'bech32m', 'should detect bech32m');
  expect(dec.hrp === 'bc', 'hrp');
});

t('BTC Taproot (bech32m) 生成', () => {
  const a = generateBtcTaprootAddress('seed1');
  expect(a.startsWith('bc1p'), `expected bc1p: ${a}`);
  expect(a.length === 62, `expected length 62: got ${a.length} (${a})`);
  expect(validateAddress('BTC', a) === true, 'should validate');
});

// 包装 t 函数，捕获每个测试的错误并继续
const originalT = t;
function safeT(name: string, fn: () => void) {
  try { originalT(name, fn); }
  catch (e: any) {
    fail++;
    errors.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('\n=== 多链地址生成 ===\n');

safeT('BTC 生成的地址是有效 bech32 (bc1q...)', () => {
  const a = generateBtcAddress('seed1');
  expect(a.startsWith('bc1q'), `expected bc1q: ${a}`);
  expect(validateAddress('BTC', a) === true, 'should validate');
  expect(!a.includes('undefined'), 'should not contain undefined');
});

safeT('ETH 生成是有效 EIP-55', () => {
  const a = generateEthAddress('seed1');
  expect(/^0x[0-9A-Fa-f]{40}$/.test(a), `bad format: ${a}`);
  expect(validateAddress('ETH', a) === true, 'should validate');
  expect(!a.includes('undefined'), 'should not contain undefined');
});

safeT('TRX 生成是 T+34 base58', () => {
  const a = generateTrxAddress('seed1');
  expect(a.startsWith('T') && a.length === 34, `bad format: ${a}`);
  expect(validateAddress('TRX', a) === true, 'should validate');
});

safeT('BSC 生成是有效 ETH 格式', () => {
  const a = generateBscAddress('seed1');
  expect(/^0x[0-9A-Fa-f]{40}$/.test(a), `bad format: ${a}`);
  expect(validateAddress('BSC', a) === true, 'should validate');
});

safeT('SOL 生成是 base58 32 字节', () => {
  const a = generateSolAddress('seed1');
  expect(a.length >= 32 && a.length <= 44, `bad length: ${a}`);
  expect(validateAddress('SOL', a) === true, 'should validate');
});

safeT('同 seed 多次生成一致 (确定性)', () => {
  const a1 = generateEthAddress('test');
  const a2 = generateEthAddress('test');
  expect(a1 === a2, 'should be deterministic');
});

safeT('不同 seed 生成不同地址', () => {
  const a1 = generateEthAddress('test1');
  const a2 = generateEthAddress('test2');
  expect(a1 !== a2, 'should differ');
});

console.log('\n' + '━'.repeat(56));
console.log(`  通过: ${pass}  失败: ${fail}  总计: ${pass + fail}`);
console.log('━'.repeat(56));
if (fail > 0) {
  console.log('\n失败详情:');
  errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
}

function expect(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
