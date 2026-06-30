export type WalletConnectState = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface WalletConnectSession {
  sessionId: string;
  topic: string;
  peerId: string;
  peerMetadata: WalletConnectPeerMetadata;
  chainId: string;
  accounts: string[];
  permissions: WalletConnectPermission[];
  expiresAt: number;
  connectedAt: number;
  updatedAt: number;
}

export interface WalletConnectPeerMetadata {
  name: string;
  description?: string;
  url: string;
  icons: string[];
}

export interface WalletConnectPermission {
  chainId: string;
  methods: string[];
  events: string[];
}

export interface WalletConnectNamespace {
  chains: string[];
  methods: string[];
  events: string[];
}

export interface WalletConnectProposal {
  id: number;
  params: {
    requiredNamespaces: Record<string, WalletConnectNamespace>;
    optionalNamespaces?: Record<string, WalletConnectNamespace>;
    peerMetadata: WalletConnectPeerMetadata;
  };
}

export interface WalletConnectRequest {
  id: number;
  topic: string;
  params: {
    method: string;
    params?: unknown[];
  };
}

export interface WalletConnectClientConfig {
  projectId: string;
  metadata: WalletConnectPeerMetadata;
  relayUrl?: string;
}

export interface WalletConnectSessionStorage {
  save(session: WalletConnectSession): Promise<void>;
  get(sessionId: string): Promise<WalletConnectSession | undefined>;
  getByTopic(topic: string): Promise<WalletConnectSession | undefined>;
  getAll(): Promise<WalletConnectSession[]>;
  update(session: WalletConnectSession): Promise<void>;
  delete(sessionId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  clear(): Promise<void>;
}