export class WalletKeyError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'WalletKeyError';
  }
}

export const WalletKeyErrors = {
  INVALID_MNEMONIC: (detail?: unknown) =>
    new WalletKeyError('INVALID_MNEMONIC', 'Invalid mnemonic phrase', detail),

  INVALID_PRIVATE_KEY: (detail?: unknown) =>
    new WalletKeyError('INVALID_PRIVATE_KEY', 'Invalid private key', detail),

  KEY_MATERIAL_NOT_FOUND: (walletId?: string) =>
    new WalletKeyError('KEY_MATERIAL_NOT_FOUND', `Key material not found for wallet: ${walletId}`),

  DECRYPT_FAILED: () =>
    new WalletKeyError('DECRYPT_FAILED', 'Failed to decrypt key material. Wrong password or corrupted data.'),

  SIGN_REJECTED_BY_RISK: (reason?: string) =>
    new WalletKeyError('SIGN_REJECTED_BY_RISK', `Signing rejected by risk policy: ${reason}`),

  WATCH_ONLY_CANNOT_SIGN: () =>
    new WalletKeyError('WATCH_ONLY_CANNOT_SIGN', 'Watch-only wallet cannot sign transactions'),

  INVALID_DERIVATION_PATH: () =>
    new WalletKeyError('INVALID_DERIVATION_PATH', 'Invalid derivation path'),

  INVALID_CHAIN_TYPE: (chainType: string) =>
    new WalletKeyError('INVALID_CHAIN_TYPE', `Unsupported chain type: ${chainType}`),

  PASSWORD_REQUIRED: () =>
    new WalletKeyError('PASSWORD_REQUIRED', 'Password is required for decryption'),

  KEY_ROTATION_FAILED: (reason?: string) =>
    new WalletKeyError('KEY_ROTATION_FAILED', `Key rotation failed: ${reason}`),

  ADDRESS_DERIVATION_FAILED: (reason?: string) =>
    new WalletKeyError('ADDRESS_DERIVATION_FAILED', `Address derivation failed: ${reason}`),

  UNSUPPORTED_SIGN_TYPE: (signType: string) =>
    new WalletKeyError('UNSUPPORTED_SIGN_TYPE', `Unsupported sign type: ${signType}`),

  HARDWARE_WALLET_ERROR: (detail?: unknown) =>
    new WalletKeyError('HARDWARE_WALLET_ERROR', 'Hardware wallet operation failed', detail),

  MPC_SIGNING_ERROR: (detail?: unknown) =>
    new WalletKeyError('MPC_SIGNING_ERROR', 'MPC signing operation failed', detail),

  KEY_DESTROY_CONFIRM_MISMATCH: () =>
    new WalletKeyError('KEY_DESTROY_CONFIRM_MISMATCH', 'Confirmation text does not match'),

  KEY_ALREADY_DESTROYED: (walletId?: string) =>
    new WalletKeyError('KEY_ALREADY_DESTROYED', `Key already destroyed for wallet: ${walletId}`),

  EXPORT_NOT_ALLOWED: (reason?: string) =>
    new WalletKeyError('EXPORT_NOT_ALLOWED', `Key export not allowed: ${reason}`),

  BACKUP_VERIFICATION_FAILED: (reason?: string) =>
    new WalletKeyError('BACKUP_VERIFICATION_FAILED', `Backup verification failed: ${reason}`),

  INVALID_WATCH_ONLY_ADDRESS: () =>
    new WalletKeyError('INVALID_WATCH_ONLY_ADDRESS', 'Invalid watch-only wallet address'),

  HARDWARE_WALLET_NOT_CONNECTED: () =>
    new WalletKeyError('HARDWARE_WALLET_NOT_CONNECTED', 'Hardware wallet not connected'),

  MPC_WALLET_NOT_INITIALIZED: () =>
    new WalletKeyError('MPC_WALLET_NOT_INITIALIZED', 'MPC wallet not initialized'),

  MULTI_PASSWORD_DERIVATION_FAILED: (reason?: string) =>
    new WalletKeyError('MULTI_PASSWORD_DERIVATION_FAILED', `Multi-password derivation failed: ${reason}`),

  AUDIT_LOG_RECORD_FAILED: (reason?: string) =>
    new WalletKeyError('AUDIT_LOG_RECORD_FAILED', `Failed to record audit log: ${reason}`),

  UNSUPPORTED_HARDWARE_DEVICE: (deviceType?: string) =>
    new WalletKeyError('UNSUPPORTED_HARDWARE_DEVICE', `Unsupported hardware device: ${deviceType}`),
};
