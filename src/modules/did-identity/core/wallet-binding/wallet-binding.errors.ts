export class WalletBindingError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'WalletBindingError';
  }
}

export class ChallengeExpiredError extends WalletBindingError {
  constructor(challengeId: string) {
    super(`Challenge ${challengeId} has expired`, 'CHALLENGE_EXPIRED', { challengeId });
    this.name = 'ChallengeExpiredError';
  }
}

export class ChallengeNotFoundError extends WalletBindingError {
  constructor(challengeId: string) {
    super(`Challenge ${challengeId} not found`, 'CHALLENGE_NOT_FOUND', { challengeId });
    this.name = 'ChallengeNotFoundError';
  }
}

export class InvalidSignatureError extends WalletBindingError {
  constructor(message?: string) {
    super(message || 'Invalid signature', 'INVALID_SIGNATURE');
    this.name = 'InvalidSignatureError';
  }
}

export class SignatureVerificationError extends WalletBindingError {
  constructor(message: string) {
    super(message, 'SIGNATURE_VERIFICATION_FAILED');
    this.name = 'SignatureVerificationError';
  }
}

export class BindingAlreadyExistsError extends WalletBindingError {
  constructor(did: string, address: string) {
    super(`Binding already exists for DID ${did} and address ${address}`, 'BINDING_ALREADY_EXISTS', { did, address });
    this.name = 'BindingAlreadyExistsError';
  }
}

export class BindingNotFoundError extends WalletBindingError {
  constructor(bindingId: string) {
    super(`Binding ${bindingId} not found`, 'BINDING_NOT_FOUND', { bindingId });
    this.name = 'BindingNotFoundError';
  }
}

export class MaxBindingsExceededError extends WalletBindingError {
  constructor(did: string, maxBindings: number) {
    super(`Maximum bindings exceeded for DID ${did}: ${maxBindings}`, 'MAX_BINDINGS_EXCEEDED', { did, maxBindings });
    this.name = 'MaxBindingsExceededError';
  }
}

export class BindingRevokedError extends WalletBindingError {
  constructor(bindingId: string) {
    super(`Binding ${bindingId} has been revoked`, 'BINDING_REVOKED', { bindingId });
    this.name = 'BindingRevokedError';
  }
}

export class InvalidSIWEMessageError extends WalletBindingError {
  constructor(message: string) {
    super(`Invalid SIWE message: ${message}`, 'INVALID_SIWE_MESSAGE');
    this.name = 'InvalidSIWEMessageError';
  }
}

export class UnsupportedChainError extends WalletBindingError {
  constructor(chainId: string) {
    super(`Unsupported chain: ${chainId}`, 'UNSUPPORTED_CHAIN', { chainId });
    this.name = 'UnsupportedChainError';
  }
}

export class DIDNotVerifiedError extends WalletBindingError {
  constructor(did: string) {
    super(`DID ${did} is not verified`, 'DID_NOT_VERIFIED', { did });
    this.name = 'DIDNotVerifiedError';
  }
}