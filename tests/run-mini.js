// 多链生成最小测试
const path = require('path');
const fs = require('fs');
const c = require('child_process');

console.log('Running minimal multi-chain test...\n');

const script = `
const { generateBtcAddress, generateEthAddress, generateTrxAddress, generateBscAddress, generateSolAddress, generateBtcTaprootAddress, validateAddress, toChecksumAddress, bech32Encode, bech32Decode, convertBits, AddressError } = require('../address-bundle.cjs');

function t(name, fn) {
  try { fn(); console.log('  PASS ' + name); }
  catch (e) { console.log('  FAIL ' + name + ': ' + e.message); }
}

console.log('--- EIP-55 ---');
t('Vitalik', () => { const a = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'; if (toChecksumAddress(a) !== a) throw new Error('mismatch: ' + toChecksumAddress(a)); });
t('Roundtrip', () => { const a = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'; if (toChecksumAddress(a) !== a) throw new Error('mismatch'); });
t('Zero addr', () => { const a = '0x' + '0'.repeat(40); if (toChecksumAddress(a) !== a) throw new Error('zero: ' + toChecksumAddress(a)); });

console.log('--- bech32 ---');
t('P2WPKH 42 chars', () => { const a = generateBtcAddress('test'); if (!a.startsWith('bc1q') || a.length !== 42) throw new Error('bad: ' + a + ' (len=' + a.length + ')'); });
t('Taproot 62 chars', () => { const a = generateBtcTaprootAddress('test'); if (!a.startsWith('bc1p') || a.length !== 62) throw new Error('bad: ' + a + ' (len=' + a.length + ')'); });
t('BTC validate', () => { const a = generateBtcAddress('test'); if (!validateAddress('BTC', a)) throw new Error('validate fail: ' + a); });

console.log('--- Multi-chain ---');
t('BTC', () => { const a = generateBtcAddress('test'); if (a.includes('undefined')) throw new Error('has undefined'); });
t('ETH', () => { const a = generateEthAddress('test'); if (a.includes('undefined') || !a.startsWith('0x')) throw new Error('bad: ' + a); if (!validateAddress('ETH', a)) throw new Error('validate fail'); });
t('BSC', () => { const a = generateBscAddress('test'); if (!validateAddress('BSC', a)) throw new Error('validate fail: ' + a); });
t('TRX', () => { const a = generateTrxAddress('test'); if (!a.startsWith('T') || a.length !== 34) throw new Error('bad: ' + a); if (!validateAddress('TRX', a)) throw new Error('validate fail'); });
t('SOL', () => { const a = generateSolAddress('test'); if (a.length < 32 || a.length > 44) throw new Error('bad: ' + a); if (!validateAddress('SOL', a)) throw new Error('validate fail'); });

console.log('\\n--- Done ---');
`;

const tmpFile = 'mini-test.cjs';
fs.writeFileSync(tmpFile, script);
try {
  const p = c.spawn('node', [tmpFile], { stdio: 'inherit', timeout: 30000 });
  p.on('exit', (code, signal) => {
    process.stdout.write('Exit: ' + code + ' Signal: ' + signal + '\n');
    try { fs.unlinkSync(tmpFile); } catch {}
  });
} catch (e) {
  process.stdout.write('Spawn error: ' + e.message + '\n');
  try { fs.unlinkSync(tmpFile); } catch {}
}
