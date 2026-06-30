import { describe, it, expect, beforeEach } from 'vitest';

import { DappPermissionService } from '../src/modules/dapp-browser/core/permissions/dapp-permission.service';
import { DappSessionService } from '../src/modules/dapp-browser/core/permissions/dapp-session.service';
import { PermissionPolicyService } from '../src/modules/dapp-browser/core/permissions/permission-policy.service';
import { UrlSecurityService } from '../src/modules/dapp-browser/core/security/url-security.service';
import { DomainBlacklistService } from '../src/modules/dapp-browser/core/security/domain-blacklist.service';
import { HomographDetectorService } from '../src/modules/dapp-browser/core/security/homograph-detector.service';
import { PhishingDetectorService } from '../src/modules/dapp-browser/core/security/phishing-detector.service';

describe('DApp Permission Service', () => {
  let permissionService: DappPermissionService;
  let policyService: PermissionPolicyService;

  beforeEach(() => {
    policyService = new PermissionPolicyService();
    permissionService = new DappPermissionService(new (class {
      private grants = new Map<string, any>();
      async save(grant: any) { this.grants.set(grant.grantId, grant); }
      async get(grantId: string) { return this.grants.get(grantId); }
      async findByOrigin(origin: string, accountId?: string) {
        return Array.from(this.grants.values()).filter((g: any) => g.origin === origin && (!accountId || g.accountId === accountId));
      }
      async findByPermission(permission: string, origin: string, accountId?: string) {
        return Array.from(this.grants.values()).filter((g: any) => g.permission === permission && g.origin === origin && (!accountId || g.accountId === accountId));
      }
      async update(grant: any) { this.grants.set(grant.grantId, grant); }
      async revoke(grantId: string) {
        const g = this.grants.get(grantId);
        if (g) g.revokedAt = Date.now();
      }
      async revokeByOrigin(origin: string) {}
      async deleteExpired() { return 0; }
      async clear() { this.grants.clear(); }
    })(), policyService);
  });

  it('check permissions returns allowed for valid request', async () => {
    const result = await permissionService.check({
      origin: 'https://app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permission: 'accounts',
    });

    expect(result.allowed).toBeDefined();
    expect(result.permission).toBe('accounts');
  });

  it('grant permission creates grants', async () => {
    const result = await permissionService.grant({
      origin: 'https://app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts', 'send_transaction'],
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].permission).toBe('accounts');
    expect(result[1].permission).toBe('send_transaction');
  });

  it('revoke permission removes permission', async () => {
    const grants = await permissionService.grant({
      origin: 'https://app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts', 'send_transaction'],
    });

    await permissionService.revoke(grants[1].grantId);
    const remaining = await permissionService.getGrants('https://app.uniswap.org', '0x1234567890abcdef1234567890abcdef12345678');
    expect(remaining.length).toBe(2);
  });

  it('get grants returns granted permissions', async () => {
    await permissionService.grant({
      origin: 'https://app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
    });

    const result = await permissionService.getGrants(
      'https://app.uniswap.org',
      '0x1234567890abcdef1234567890abcdef12345678'
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].permission).toBe('accounts');
  });
});

describe('DApp Session Service', () => {
  let sessionService: DappSessionService;

  beforeEach(() => {
    sessionService = new DappSessionService();
  });

  it('create session generates unique session ID', async () => {
    const session1 = await sessionService.create({
      sessionId: 'session_1',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    const session2 = await sessionService.create({
      sessionId: 'session_2',
      origin: 'https://app.opensea.io',
      hostname: 'app.opensea.io',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    expect(session1.sessionId).not.toBe(session2.sessionId);
  });

  it('get session returns correct session', async () => {
    const session = await sessionService.create({
      sessionId: 'test_session',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    const result = await sessionService.get('test_session');
    expect(result?.sessionId).toBe('test_session');
    expect(result?.origin).toBe('https://app.uniswap.org');
  });

  it('addPermissions adds permissions to session', async () => {
    const session = await sessionService.create({
      sessionId: 'test_session',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    const updated = await sessionService.addPermissions('test_session', ['send_transaction']);

    expect(updated.permissions).toContain('send_transaction');
  });

  it('removePermissions removes permissions from session', async () => {
    const session = await sessionService.create({
      sessionId: 'test_session',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts', 'send_transaction'],
      source: 'webview',
    });

    const updated = await sessionService.removePermissions('test_session', ['send_transaction']);

    expect(updated.permissions).not.toContain('send_transaction');
    expect(updated.permissions).toContain('accounts');
  });

  it('revoke session removes session', async () => {
    await sessionService.create({
      sessionId: 'test_session',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    await sessionService.revoke('test_session');
  });

  it('findByAccount returns all sessions for account', async () => {
    await sessionService.create({
      sessionId: 'session_1',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    await sessionService.create({
      sessionId: 'session_2',
      origin: 'https://app.opensea.io',
      hostname: 'app.opensea.io',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    const sessions = await sessionService.findByAccount('0x1234567890abcdef1234567890abcdef12345678');
    expect(sessions.length).toBe(2);
  });

  it('findByOrigin returns all sessions for origin', async () => {
    await sessionService.create({
      sessionId: 'session_1',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0x1234567890abcdef1234567890abcdef12345678',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    await sessionService.create({
      sessionId: 'session_2',
      origin: 'https://app.uniswap.org',
      hostname: 'app.uniswap.org',
      accountId: '0xabcdef1234567890abcdef1234567890abcdef12',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      chainId: 'eip155:1',
      permissions: ['accounts'],
      source: 'webview',
    });

    const sessions = await sessionService.findByOrigin('https://app.uniswap.org');
    expect(sessions.length).toBe(2);
  });
});

describe('Permission Policy Service', () => {
  let policyService: PermissionPolicyService;

  beforeEach(() => {
    policyService = new PermissionPolicyService();
  });

  it('get returns policy for allowed permission', () => {
    expect(policyService.get('accounts')).toBeDefined();
    expect(policyService.get('send_transaction')).toBeDefined();
    expect(policyService.get('sign_message')).toBeDefined();
  });

  it('get returns undefined for unknown permission', () => {
    expect(policyService.get('unknown_permission' as any)).toBeUndefined();
  });

  it('requiresConsent returns true for high-risk permissions', () => {
    expect(policyService.requiresConsent('send_transaction')).toBe(true);
    expect(policyService.requiresConsent('sign_message')).toBe(true);
  });

  it('requiresConsent returns true for accounts permission', () => {
    expect(policyService.requiresConsent('accounts')).toBe(true);
  });

  it('isAutoGrant returns false for permissions', () => {
    expect(policyService.isAutoGrant('accounts')).toBe(false);
    expect(policyService.isAutoGrant('send_transaction')).toBe(false);
  });

  it('getAll returns all policies', () => {
    const policies = policyService.getAll();
    expect(policies.length).toBeGreaterThan(0);
  });

  it('getDefaultLevel returns correct level', () => {
    expect(policyService.getDefaultLevel('accounts')).toBe('session');
    expect(policyService.getDefaultLevel('send_transaction')).toBe('one_time');
    expect(policyService.getDefaultLevel('add_chain')).toBe('persistent');
  });
});

describe('URL Security Service', () => {
  let urlSecurityService: UrlSecurityService;

  beforeEach(() => {
    urlSecurityService = new UrlSecurityService();
  });

  it('check returns allowed for valid URL', async () => {
    const result = await urlSecurityService.check({
      url: 'https://example.com',
      origin: 'https://example.com',
    });

    expect(result.allowed).toBe(true);
    expect(result.riskLevel).toBe('pass');
  });

  it('check detects protocol issues', async () => {
    const result = await urlSecurityService.check({
      url: 'http://app.uniswap.org',
      origin: 'http://app.uniswap.org',
    });

    expect(result.allowed).toBe(false);
    expect(result.riskLevel).toBe('block');
  });

  it('check allows localhost', async () => {
    const result = await urlSecurityService.check({
      url: 'http://localhost:3000',
      origin: 'http://localhost:3000',
    });

    expect(result.allowed).toBe(true);
    expect(result.riskLevel).toBe('pass');
  });

  it('check detects IP address', async () => {
    const result = await urlSecurityService.check({
      url: 'http://192.168.1.100',
      origin: 'http://192.168.1.100',
    });

    expect(result.riskLevel).toBeDefined();
  });
});

describe('Domain Blacklist Service', () => {
  let blacklistService: DomainBlacklistService;

  beforeEach(() => {
    blacklistService = new DomainBlacklistService();
  });

  it('isBlocked returns false for non-blacklisted domain', async () => {
    const result = await blacklistService.isBlocked('app.uniswap.org');
    expect(result.blocked).toBe(false);
  });

  it('isBlocked returns true for blacklisted domain', async () => {
    await blacklistService.add({ hostname: 'malicious-scam.com', reason: 'Test phishing', severity: 'critical' });
    const result = await blacklistService.isBlocked('malicious-scam.com');
    expect(result.blocked).toBe(true);
  });

  it('add and get work correctly', async () => {
    const entry = await blacklistService.add({ hostname: 'test-block.com', reason: 'Test', severity: 'medium' });
    expect(entry.hostname).toBe('test-block.com');
    expect(entry.entryId).toBeDefined();

    const retrieved = await blacklistService.get('test-block.com');
    expect(retrieved?.hostname).toBe('test-block.com');
  });
});

describe('Homograph Detector Service', () => {
  let homographService: HomographDetectorService;

  beforeEach(() => {
    homographService = new HomographDetectorService();
  });

  it('detect returns false for normal domain', async () => {
    const result = await homographService.detect('app.uniswap.org');
    expect(result.suspicious).toBe(false);
  });

  it('hasHomographAttack detects attacks', async () => {
    const result = await homographService.hasHomographAttack('https://test.com');
    expect(result.attack).toBe(false);
  });

  it('sanitize works correctly', async () => {
    const sanitized = await homographService.sanitize('test.com');
    expect(sanitized).toBe('test.com');
  });

  it('compareDomains compares domains', async () => {
    const result = await homographService.compareDomains('test.com', 'test.com');
    expect(result.similar).toBe(true);
  });
});

describe('Phishing Detector Service', () => {
  let phishingService: PhishingDetectorService;

  beforeEach(() => {
    phishingService = new PhishingDetectorService();
  });

  it('detect returns false for generic domain', async () => {
    const result = await phishingService.detect('https://example.com');
    expect(result.phishing).toBe(false);
  });

  it('detect returns true for typosquatting domain with numbers', async () => {
    const result = await phishingService.detect('https://coinbase123.com');
    expect(result.phishing).toBe(true);
  });

  it('getUrlRiskInfo returns correct URL information', async () => {
    phishingService.addSafeDomain('example.com');
    const info = await phishingService.getUrlRiskInfo('https://example.com/path?query=1');
    expect(info.hostname).toBe('example.com');
    expect(info.isHttps).toBe(true);
    expect(info.pathname).toBe('/path');
    expect(info.search).toBe('?query=1');
  });

  it('addSafeDomain adds domain to safe list', () => {
    phishingService.addSafeDomain('test-safe.com');
    phishingService.removeSafeDomain('test-safe.com');
  });

  it('getUrlRiskInfo handles invalid URLs', async () => {
    const info = await phishingService.getUrlRiskInfo('invalid-url');
    expect(info.riskLevel).toBe('unknown');
  });
});