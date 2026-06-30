export type KeyType =
  | 'Ed25519'
  | 'Secp256k1'
  | 'Secp256r1'
  | 'secp256k1'
  | 'secp256r1'
  | 'RSA'
  | 'P-256'
  | 'P-384'
  | 'P-521';

export type KeyPurpose =
  | 'authentication'
  | 'assertionMethod'
  | 'keyAgreement'
  | 'capabilityInvocation'
  | 'capabilityDelegation';

export type KeyStorageType = 'local' | 'encrypted' | 'hardware' | 'remote';

export interface KeyInfo {
  keyId: string;
  keyType: KeyType;
  publicKey: string;
  privateKey?: string;
  controller: string;
  purposes: KeyPurpose[];
  storageType: KeyStorageType;
  createdAt: number;
  expiresAt?: number;
  revokedAt?: number;
  status: 'active' | 'inactive' | 'revoked';
}

export type KeyExportFormat = 'base58' | 'pem' | 'jwk' | 'hex';

export type KeyImportFormat = 'base58' | 'pem' | 'jwk' | 'hex';

export interface KeyPair {
  privateKey?: string;
  publicKey?: string;
  keyType?: KeyType;
  keyId?: string;
  type?: KeyType;
  publicKeyBase58?: string;
  privateKeyBase58?: string;
  createdAt?: string;
  revokedAt?: string;
  status?: 'active' | 'inactive' | 'revoked';
}

export interface KeyGenerationOptions {
  keyType: KeyType;
  controller?: string;
  purposes?: KeyPurpose[];
  storageType?: KeyStorageType;
}

export interface KeyDerivationOptions {
  seed: string;
  keyType: KeyType;
  derivationPath?: string;
}

export interface KeyEncryptionOptions {
  keyId: string;
  encryptionKey: string;
  algorithm?: string;
}

export interface KeyDecryptionOptions {
  keyId: string;
  decryptionKey: string;
  algorithm?: string;
}

export interface KeySignOptions {
  keyId: string;
  data: string | Uint8Array;
  algorithm?: string;
}

export interface KeyVerifyOptions {
  keyId: string;
  data: string | Uint8Array;
  signature: string;
  algorithm?: string;
}

export interface KeyAgreementOptions {
  keyId: string;
  peerPublicKey: string;
}

export interface KeyStorageConfig {
  type: KeyStorageType;
  path?: string;
  encryption?: boolean;
  backupEnabled?: boolean;
  autoLock?: boolean;
  lockTimeout?: number;
}

export interface KeyRotationOptions {
  keyId: string;
  newKeyType?: KeyType;
  migratePurposes?: boolean;
}

export interface KeyRotationRecord {
  rotationId: string;
  oldKeyId: string;
  newKeyId: string;
  rotatedAt: number;
  migrationComplete: boolean;
  migrationDetails?: Record<string, unknown>;
}
