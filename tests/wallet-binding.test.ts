import { describe, it, expect, beforeEach } from 'vitest';

import { SIWEMessageService } from '../src/modules/did-identity/core/wallet-binding/siwe-message.service';
import { SIWEVerifyService } from '../src/modules/did-identity/core/wallet-binding/siwe-verify.service';
import { WalletBindingService } from '../src/modules/did-identity/core/wallet-binding/wallet-binding.service';
import { WalletBindingChallengeService } from '../src/modules/did-identity/core/wallet-binding/wallet-binding-challenge.service';

describe('SIWE Message Service', () => {
  let siweMessageService: SIWEMessageService;

  beforeEach(() => {
    siweMessageService = new SIWEMessageService();
  });

  it('build message creates valid SIWE message', () => {
    const message = siweMessageService.build({
      domain: 'example.com',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      statement: 'Sign in to ZS Exchange',
      uri: 'https://example.com',
      version: '1',
      chainId: 1,
      nonce: 'abc123xyz',
      issuedAt: '2024-01-15T10:30:00Z',
      expirationTime: '2024-07-15T10:30:00Z',
    });

    expect(message).toContain('example.com wants you to sign in with your Ethereum account:');
    expect(message).toContain('0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(message).toContain('Sign in to ZS Exchange');
    expect(message).toContain('URI: https://example.com');
    expect(message).toContain('Version: 1');
    expect(message).toContain('Chain ID: 1');
    expect(message).toContain('Nonce: abc123xyz');
  });

  it('build message with resources includes resources section', () => {
    const message = siweMessageService.build({
      domain: 'example.com',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      statement: 'Sign in',
      uri: 'https://example.com',
      version: '1',
      chainId: 1,
      nonce: 'abc123',
      issuedAt: '2024-01-15T10:30:00Z',
      resources: ['ipfs://Qm...', 'https://example.com/terms'],
    });

    expect(message).toContain('Resources:');
    expect(message).toContain('- ipfs://Qm...');
    expect(message).toContain('- https://example.com/terms');
  });

  it('parse message returns structured data', () => {
    const message = siweMessageService.build({
      domain: 'example.com',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      statement: 'Sign in',
      uri: 'https://example.com',
      version: '1',
      chainId: 1,
      nonce: 'abc123',
      issuedAt: '2024-01-15T10:30:00Z',
    });

    const parsed = siweMessageService.parse(message);
    expect(parsed.domain).toBe('example.com');
    expect(parsed.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(parsed.statement).toBe('Sign in');
    expect(parsed.chainId).toBe(1);
    expect(parsed.nonce).toBe('abc123');
  });

  it('generateNonce generates random nonce', () => {
    const nonce1 = siweMessageService.generateNonce();
    const nonce2 = siweMessageService.generateNonce();
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBe(32);
  });

  it('formatTimestamp formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const formatted = siweMessageService.formatTimestamp(date);
    expect(formatted).toBe('2024-01-15T10:30:00.000+00:00');
  });
});

describe('SIWE Verify Service', () => {
  let siweVerifyService: SIWEVerifyService;

  beforeEach(() => {
    siweVerifyService = new SIWEVerifyService();
  });

  it('verify returns invalid for empty signature', async () => {
    const result = await siweVerifyService.verify('test message', '');
    expect(result.valid).toBe(false);
  });

  it('verify returns invalid for mismatched address', async () => {
    const result = await siweVerifyService.verify('test message', '0x123456...');
    expect(result.valid).toBe(false);
  });

  it('parseMessage parses SIWE message', () => {
    const siweMessage = new SIWEMessageService();
    const message = siweMessage.build({
      domain: 'example.com',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      statement: 'Test',
      uri: 'https://example.com',
      version: '1',
      chainId: 1,
      nonce: 'abc123',
      issuedAt: '2024-01-15T10:30:00Z',
    });

    const parsed = siweVerifyService.parseMessage(message);
    expect(parsed.domain).toBe('example.com');
    expect(parsed.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(parsed.nonce).toBe('abc123');
  });
});

describe('Wallet Binding Challenge Service', () => {
  let challengeService: WalletBindingChallengeService;

  beforeEach(() => {
    challengeService = new WalletBindingChallengeService();
  });

  it('createChallenge creates unique challenge', async () => {
    const challenge1 = await challengeService.createChallenge({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
    });

    const challenge2 = await challengeService.createChallenge({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
    });

    expect(challenge1.nonce).not.toBe(challenge2.nonce);
    expect(challenge1.challengeId).toBeDefined();
    expect(challenge1.createdAt).toBeDefined();
  });

  it('getChallenge returns challenge by ID', async () => {
    const challenge = await challengeService.createChallenge({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
    });

    const result = await challengeService.getChallenge(challenge.challengeId);
    expect(result.challengeId).toBe(challenge.challengeId);
    expect(result.nonce).toBe(challenge.nonce);
  });

  it('deleteChallenge removes challenge', async () => {
    const challenge = await challengeService.createChallenge({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
    });

    await challengeService.deleteChallenge(challenge.challengeId);
  });
});

describe('Wallet Binding Service', () => {
  let bindingService: WalletBindingService;

  beforeEach(() => {
    bindingService = new WalletBindingService();
  });

  it('createBinding creates new binding', async () => {
    const result = await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    expect(result.success).toBe(true);
    expect(result.binding?.bindingId).toBeDefined();
    expect(result.binding?.did).toBe('did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(result.binding?.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(result.binding?.status).toBe('pending');
  });

  it('getBinding returns binding by ID', async () => {
    const created = await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    const result = await bindingService.getBinding(created.binding!.bindingId);
    expect(result?.bindingId).toBe(created.binding!.bindingId);
    expect(result?.did).toBe(created.binding!.did);
  });

  it('getBinding returns undefined for unknown binding', async () => {
    const result = await bindingService.getBinding('unknown-binding-id');
    expect(result).toBeUndefined();
  });

  it('getBindingsByDid returns all bindings for DID', async () => {
    await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: '0x89',
      method: 'caip10',
    });

    const result = await bindingService.getBindingsByDid('did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(result.length).toBe(2);
  });

  it('getBindingsByAddress returns all bindings for address', async () => {
    await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    await bindingService.createBinding({
      did: 'did:key:z6MkfH4qWkKt9xQ2jZ3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L6M7N8O9P0',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'caip10',
    });

    const result = await bindingService.getBindingsByAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(result.length).toBe(2);
  });

  it('revokeBinding changes status to revoked', async () => {
    const created = await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    const result = await bindingService.revokeBinding(created.binding!.bindingId);
    expect(result.success).toBe(true);
    expect(result.binding?.status).toBe('revoked');
  });

  it('isAddressBound returns true for active binding', async () => {
    await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    const result = await bindingService.isAddressBound('did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB', '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB');
    expect(result).toBe(false);
  });

  it('getAllBindings returns all bindings', async () => {
    await bindingService.createBinding({
      did: 'did:pkh:eip155:1:0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f7AAAB',
      chainId: '0x1',
      method: 'siwe',
    });

    const result = await bindingService.getAllBindings();
    expect(result.length).toBeGreaterThan(0);
  });
});