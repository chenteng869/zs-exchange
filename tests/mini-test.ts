// Minimal test to verify our broadcaster works - subset 1
import test from 'node:test';
import assert from 'node:assert/strict';
import { WithdrawalBroadcaster } from '../src/lib/wallet/withdrawal-broadcaster';

const TEST_PK = '0x' + 'a'.repeat(64);

test('A: build EIP-1559 ETH', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  assert.equal(tx.chain, 'ETH');
});

test('B: sign EIP-1559 ETH', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'ETH',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  const signed = wb.signTx(tx, TEST_PK);
  assert.ok(signed.txHash.startsWith('0x'));
});

test('C: build BSC EIP-1559', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'BSC',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  assert.equal(tx.raw.chainId, '0x38');
});

test('D: sign BSC EIP-1559', () => {
  const wb = new WithdrawalBroadcaster({ fetchImpl: (() => Promise.resolve(new Response('{}'))) as any });
  const tx = wb.buildEip1559Tx({
    chain: 'BSC',
    from: '0x' + '1'.repeat(40),
    to: '0x' + '2'.repeat(40),
    value: '0x0',
  });
  const signed = wb.signTx(tx, TEST_PK);
  assert.ok(signed.txHash.startsWith('0x'));
});

test('E: secp256k1 known addr', () => {
  // private 1 -> address 0x7e5f4552091a69125d5dfcb7b8c2659029395bdf
  const { Secp256k1 } = require('../src/lib/wallet/withdrawal-broadcaster');
  const { keccak256 } = require('js-sha3');
  const pk = 1n;
  const pub = Secp256k1.scalarMul(pk, { x: Secp256k1.Gx, y: Secp256k1.Gy });
  const xBytes = pub.x.toString(16).padStart(64, '0');
  const yBytes = pub.y.toString(16).padStart(64, '0');
  const concat = xBytes + yBytes;
  const hash = keccak256(concat);
  const addr = '0x' + hash.slice(24);
  assert.equal(addr.toLowerCase(), '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf');
});
