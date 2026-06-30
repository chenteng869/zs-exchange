import type { KeyType } from './key-manager.types';

export type DidMethod = 'key' | 'pkh' | 'web' | 'ethr' | 'sol';

export type Did = string & { readonly __brand?: 'Did' };

export interface DidParserResult {
  did: string;
  method: DidMethod;
  id: string;
  methodSpecificId: string;
  path?: string;
  query?: string | Record<string, string>;
  fragment?: string;
  hasPath?: boolean;
  hasQuery?: boolean;
  hasFragment?: boolean;
}

export interface DidCreationOptions {
  method: DidMethod;
  keyType?: KeyType;
  privateKey?: string;
  publicKey?: string;
  blockchainAddress?: string;
  accountId?: string;
  chainId?: string;
  domain?: string;
  verificationMethodId?: string;
}

export interface DidResolutionResult {
  didDocument?: DidDocument;
  didDocumentMetadata: DidDocumentMetadata;
  didResolutionMetadata: DidResolutionMetadata;
}

export interface DidDocumentMetadata {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  versionId?: string;
  nextUpdate?: string;
  nextVersionId?: string;
  equivalentId?: string;
  canonicalId?: string;
  error?: DidResolverError;
  errorMessage?: string;
}

export interface DidResolutionMetadata {
  contentType?: string;
  error?: DidResolverError;
  errorMessage?: string;
}

export type DidResolverError =
  | 'invalidDid'
  | 'notFound'
  | 'representationNotSupported'
  | 'unsupportedDidMethod'
  | 'internalError';

export interface DidAnchorOptions {
  did: string;
  transactionHash?: string;
  chainId: string;
  blockNumber?: number;
  blockTimestamp?: number;
}

export interface DidAnchorRecord {
  anchorId: string;
  did: string;
  transactionHash: string;
  chainId: string;
  blockNumber: number;
  blockTimestamp: number;
  anchoredAt: number;
}

export interface DidDocument {
  '@context': string | string[];
  id: string;
  verificationMethod?: VerificationMethod[];
  authentication?: Array<string | VerificationMethod>;
  assertionMethod?: Array<string | VerificationMethod>;
  keyAgreement?: Array<string | VerificationMethod>;
  capabilityInvocation?: Array<string | VerificationMethod>;
  capabilityDelegation?: Array<string | VerificationMethod>;
  service?: Service[];
  alsoKnownAs?: string[];
  created?: string;
  updated?: string;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyHex?: string;
  publicKeyJwk?: JsonWebKey;
  publicKeyBase58?: string;
  publicKeyPem?: string;
  blockchainAccountId?: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | ServiceEndpoint[];
  description?: string;
  [key: string]: unknown;
}

export interface ServiceEndpoint {
  uri?: string;
  description?: string;
  type?: string;
}

export interface JsonWebKey {
  kty: string;
  alg?: string;
  use?: string;
  kid?: string;
  n?: string;
  e?: string;
  d?: string;
  p?: string;
  q?: string;
  dp?: string;
  dq?: string;
  qi?: string;
  crv?: string;
  x?: string;
  y?: string;
  [key: string]: unknown;
}

export interface DidPublicKey {
  id: string;
  type: string;
  publicKey: string;
  controller: string;
  format: 'multibase' | 'hex' | 'jwk' | 'base58' | 'pem';
}

export interface DidPrivateKey {
  id: string;
  type: string;
  privateKey: string;
  publicKey: string;
  controller: string;
}

export interface DidKeyPair {
  privateKey: DidPrivateKey;
  publicKey: DidPublicKey;
}

export type AuditAction =
  | 'did_created'
  | 'did_updated'
  | 'did_deleted'
  | 'key_added'
  | 'key_revoked'
  | 'did_anchored'
  | 'credential_issued'
  | 'credential_revoked';

export type AuditActorType = 'user' | 'admin' | 'issuer' | 'system' | string;

export interface AuditEvent {
  id: string;
  did: Did;
  action: AuditAction;
  actorId: string;
  actorType: AuditActorType;
  timestamp: string;
  details: Record<string, unknown>;
}
