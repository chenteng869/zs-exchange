import type { WalletConnectClientConfig, WalletConnectProposal, WalletConnectRequest, WalletConnectSession } from './walletconnect.types';
import { WalletConnectError } from '../../shared/errors';

export interface WalletConnectClientHandlers {
  onSessionProposal?: (proposal: WalletConnectProposal) => void;
  onSessionRequest?: (request: WalletConnectRequest) => void;
  onSessionDelete?: (topic: string) => void;
  onSessionExpire?: (topic: string) => void;
}

export class WalletConnectClientService {
  private state: 'idle' | 'connecting' | 'connected' = 'idle';
  private activeSession: WalletConnectSession | null = null;

  constructor(
    private readonly config: WalletConnectClientConfig,
    private readonly handlers: WalletConnectClientHandlers = {},
  ) {}

  getState(): 'idle' | 'connecting' | 'connected' {
    return this.state;
  }

  getActiveSession(): WalletConnectSession | null {
    return this.activeSession;
  }

  async init(): Promise<void> {}

  async connect(chainId: string, accounts: string[]): Promise<{ uri: string; approvalCallback: (approved: boolean) => Promise<void> }> {
    this.state = 'connecting';
    return {
      uri: `wc:${Math.random().toString(36).slice(2, 15)}@2?relay-protocol=irn`,
      approvalCallback: async (approved) => {
        if (approved) {
          this.state = 'connected';
        } else {
          this.state = 'idle';
          throw new WalletConnectError('User rejected the connection');
        }
      },
    };
  }

  async approveProposal(proposalId: number, chainId: string, accounts: string[]): Promise<void> {
    this.state = 'connected';
  }

  async rejectProposal(proposalId: number, reason?: string): Promise<void> {
    this.state = 'idle';
    throw new WalletConnectError(reason || 'Proposal rejected');
  }

  async handleRequest(request: WalletConnectRequest): Promise<unknown> {
    if (this.state !== 'connected') {
      throw new WalletConnectError('Not connected');
    }
    return null;
  }

  async sendResponse(topic: string, requestId: number, result: unknown): Promise<void> {}

  async sendError(topic: string, requestId: number, error: { code: number; message: string }): Promise<void> {}

  async disconnect(topic: string): Promise<void> {
    this.state = 'idle';
    this.activeSession = null;
    this.handlers.onSessionDelete?.(topic);
  }

  async emitEvent(topic: string, event: string, data: unknown): Promise<void> {}

  async ping(topic: string): Promise<void> {}

  async getSessions(): Promise<WalletConnectSession[]> {
    return this.activeSession ? [this.activeSession] : [];
  }

  async restoreSession(session: WalletConnectSession): Promise<void> {
    this.activeSession = session;
    this.state = 'connected';
  }
}