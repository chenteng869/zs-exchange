import type { WalletConnectSession, WalletConnectProposal, WalletConnectRequest } from './walletconnect.types';
import { WalletConnectStorageService } from './walletconnect-storage.service';
import { WalletConnectNamespaceService } from './walletconnect-namespace.service';
import { WalletConnectClientService } from './walletconnect-client.service';
import { WalletConnectError, SessionNotFoundError, SessionExpiredError } from '../../shared/errors';

export interface WalletConnectSessionCreateOptions {
  topic: string;
  peerId: string;
  peerMetadata: WalletConnectSession['peerMetadata'];
  chainId: string;
  accounts: string[];
  permissions: WalletConnectSession['permissions'];
  expiresAt: number;
}

export class WalletConnectSessionService {
  constructor(
    private readonly storage: WalletConnectStorageService = new WalletConnectStorageService(),
    private readonly namespaceService: WalletConnectNamespaceService = new WalletConnectNamespaceService(),
    private readonly client: WalletConnectClientService = new WalletConnectClientService({
      projectId: '',
      metadata: { name: 'StockExchange Wallet', url: '', icons: [] },
    }),
  ) {}

  async create(options: WalletConnectSessionCreateOptions): Promise<WalletConnectSession> {
    const now = Date.now();
    const session: WalletConnectSession = {
      sessionId: `wc_session_${now}_${Math.random().toString(36).slice(2, 9)}`,
      topic: options.topic,
      peerId: options.peerId,
      peerMetadata: options.peerMetadata,
      chainId: options.chainId,
      accounts: options.accounts,
      permissions: options.permissions,
      expiresAt: options.expiresAt,
      connectedAt: now,
      updatedAt: now,
    };
    await this.storage.save(session);
    await this.client.restoreSession(session);
    return session;
  }

  async get(sessionId: string): Promise<WalletConnectSession> {
    const session = await this.storage.get(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    return session;
  }

  async getByTopic(topic: string): Promise<WalletConnectSession> {
    const session = await this.storage.getByTopic(topic);
    if (!session) {
      throw new SessionNotFoundError(topic);
    }
    return session;
  }

  async getActive(): Promise<WalletConnectSession | null> {
    const sessions = await this.storage.getAll();
    const now = Date.now();
    return sessions.find((session) => session.expiresAt > now) || null;
  }

  async getAll(): Promise<WalletConnectSession[]> {
    return this.storage.getAll();
  }

  async validateProposal(proposal: WalletConnectProposal): Promise<{ valid: boolean; errors: string[] }> {
    return this.namespaceService.validateProposal(proposal);
  }

  async approveProposal(proposal: WalletConnectProposal, chainId: string, addresses: string[]): Promise<WalletConnectSession> {
    const validation = await this.validateProposal(proposal);
    if (!validation.valid) {
      throw new WalletConnectError(`Invalid proposal: ${validation.errors.join(', ')}`);
    }

    const permissions: WalletConnectSession['permissions'] = [];
    for (const [namespace, config] of Object.entries(proposal.params.requiredNamespaces)) {
      permissions.push({
        chainId: config.chains[0] || chainId,
        methods: this.namespaceService.filterAllowedMethods(config.methods || []),
        events: config.events || [],
      });
    }

    const session = await this.create({
      topic: `topic_${Math.random().toString(36).slice(2, 15)}`,
      peerId: `peer_${Math.random().toString(36).slice(2, 15)}`,
      peerMetadata: proposal.params.peerMetadata,
      chainId,
      accounts: addresses,
      permissions,
      expiresAt: Date.now() + 86400000,
    });

    await this.client.approveProposal(proposal.id, chainId, addresses);
    return session;
  }

  async rejectProposal(proposal: WalletConnectProposal, reason?: string): Promise<void> {
    await this.client.rejectProposal(proposal.id, reason);
  }

  async handleRequest(request: WalletConnectRequest): Promise<unknown> {
    try {
      const session = await this.getByTopic(request.topic);
      const now = Date.now();
      if (session.expiresAt < now) {
        throw new SessionExpiredError(session.sessionId);
      }
      return this.client.handleRequest(request);
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw new WalletConnectError('Session not found');
      }
      throw error;
    }
  }

  async sendResponse(topic: string, requestId: number, result: unknown): Promise<void> {
    await this.client.sendResponse(topic, requestId, result);
  }

  async sendError(topic: string, requestId: number, error: { code: number; message: string }): Promise<void> {
    await this.client.sendError(topic, requestId, error);
  }

  async disconnect(topic: string): Promise<void> {
    const session = await this.getByTopic(topic);
    await this.client.disconnect(topic);
    await this.storage.delete(session.sessionId);
  }

  async extend(sessionId: string, extendSeconds: number): Promise<WalletConnectSession> {
    const session = await this.get(sessionId);
    session.expiresAt += extendSeconds * 1000;
    session.updatedAt = Date.now();
    await this.storage.update(session);
    return session;
  }

  async cleanupExpired(): Promise<number> {
    return this.storage.deleteExpired();
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
}