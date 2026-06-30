export enum DappErrorCode {
  INVALID_URL = 1001,
  INVALID_ORIGIN = 1002,
  URL_BLOCKED = 1003,
  DOMAIN_BLOCKED = 1004,
  CONTRACT_BLOCKED = 1005,
  UNSUPPORTED_CHAIN = 1006,
  SESSION_NOT_FOUND = 1007,
  SESSION_EXPIRED = 1008,
  PERMISSION_DENIED = 1009,
  PERMISSION_NOT_GRANTED = 1010,
  ACCOUNT_NOT_FOUND = 1011,
  WALLET_NOT_CONNECTED = 1012,
  TRANSACTION_REJECTED = 1013,
  SIGNATURE_REJECTED = 1014,
  WALLETCONNECT_ERROR = 1015,
  BRIDGE_ERROR = 1016,
  WEBVIEW_ERROR = 1017,
  SECURITY_VIOLATION = 1018,
  PHISHING_DETECTED = 1019,
  RATE_LIMIT_EXCEEDED = 1020,
}

export class DappError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'DappError';
    this.code = code;
    this.data = data;
  }
}

export class InvalidUrlError extends DappError {
  constructor(url: string, data?: unknown) {
    super(DappErrorCode.INVALID_URL, `Invalid URL: ${url}`, data);
    this.name = 'InvalidUrlError';
  }
}

export class InvalidOriginError extends DappError {
  constructor(origin: string, data?: unknown) {
    super(DappErrorCode.INVALID_ORIGIN, `Invalid origin: ${origin}`, data);
    this.name = 'InvalidOriginError';
  }
}

export class UrlBlockedError extends DappError {
  constructor(url: string, reason?: string, data?: unknown) {
    super(DappErrorCode.URL_BLOCKED, `URL blocked: ${url}${reason ? ` - ${reason}` : ''}`, data);
    this.name = 'UrlBlockedError';
  }
}

export class DomainBlockedError extends DappError {
  constructor(hostname: string, reason?: string, data?: unknown) {
    super(DappErrorCode.DOMAIN_BLOCKED, `Domain blocked: ${hostname}${reason ? ` - ${reason}` : ''}`, data);
    this.name = 'DomainBlockedError';
  }
}

export class ContractBlockedError extends DappError {
  constructor(contractAddress: string, reason?: string, data?: unknown) {
    super(DappErrorCode.CONTRACT_BLOCKED, `Contract blocked: ${contractAddress}${reason ? ` - ${reason}` : ''}`, data);
    this.name = 'ContractBlockedError';
  }
}

export class UnsupportedChainError extends DappError {
  constructor(chainId: string, data?: unknown) {
    super(DappErrorCode.UNSUPPORTED_CHAIN, `Unsupported chain: ${chainId}`, data);
    this.name = 'UnsupportedChainError';
  }
}

export class SessionNotFoundError extends DappError {
  constructor(sessionId: string, data?: unknown) {
    super(DappErrorCode.SESSION_NOT_FOUND, `Session not found: ${sessionId}`, data);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends DappError {
  constructor(sessionId: string, data?: unknown) {
    super(DappErrorCode.SESSION_EXPIRED, `Session expired: ${sessionId}`, data);
    this.name = 'SessionExpiredError';
  }
}

export class PermissionDeniedError extends DappError {
  constructor(permission: string, origin: string, data?: unknown) {
    super(DappErrorCode.PERMISSION_DENIED, `Permission denied: ${permission} for ${origin}`, data);
    this.name = 'PermissionDeniedError';
  }
}

export class PermissionNotGrantedError extends DappError {
  constructor(permission: string, origin: string, data?: unknown) {
    super(DappErrorCode.PERMISSION_NOT_GRANTED, `Permission not granted: ${permission} for ${origin}`, data);
    this.name = 'PermissionNotGrantedError';
  }
}

export class AccountNotFoundError extends DappError {
  constructor(accountId: string, data?: unknown) {
    super(DappErrorCode.ACCOUNT_NOT_FOUND, `Account not found: ${accountId}`, data);
    this.name = 'AccountNotFoundError';
  }
}

export class WalletNotConnectedError extends DappError {
  constructor(data?: unknown) {
    super(DappErrorCode.WALLET_NOT_CONNECTED, 'Wallet is not connected.', data);
    this.name = 'WalletNotConnectedError';
  }
}

export class TransactionRejectedError extends DappError {
  constructor(data?: unknown) {
    super(DappErrorCode.TRANSACTION_REJECTED, 'Transaction was rejected by the user.', data);
    this.name = 'TransactionRejectedError';
  }
}

export class SignatureRejectedError extends DappError {
  constructor(data?: unknown) {
    super(DappErrorCode.SIGNATURE_REJECTED, 'Signature was rejected by the user.', data);
    this.name = 'SignatureRejectedError';
  }
}

export class WalletConnectError extends DappError {
  constructor(message: string, data?: unknown) {
    super(DappErrorCode.WALLETCONNECT_ERROR, `WalletConnect error: ${message}`, data);
    this.name = 'WalletConnectError';
  }
}

export class BridgeError extends DappError {
  constructor(message: string, data?: unknown) {
    super(DappErrorCode.BRIDGE_ERROR, `Bridge error: ${message}`, data);
    this.name = 'BridgeError';
  }
}

export class WebviewError extends DappError {
  constructor(message: string, data?: unknown) {
    super(DappErrorCode.WEBVIEW_ERROR, `Webview error: ${message}`, data);
    this.name = 'WebviewError';
  }
}

export class SecurityViolationError extends DappError {
  constructor(message: string, data?: unknown) {
    super(DappErrorCode.SECURITY_VIOLATION, `Security violation: ${message}`, data);
    this.name = 'SecurityViolationError';
  }
}

export class PhishingDetectedError extends DappError {
  constructor(url: string, data?: unknown) {
    super(DappErrorCode.PHISHING_DETECTED, `Phishing detected: ${url}`, data);
    this.name = 'PhishingDetectedError';
  }
}

export class RateLimitExceededError extends DappError {
  constructor(message?: string, data?: unknown) {
    super(DappErrorCode.RATE_LIMIT_EXCEEDED, message || 'Rate limit exceeded.', data);
    this.name = 'RateLimitExceededError';
  }
}

export const getDappError = (code: number, message?: string, data?: unknown): DappError => {
  switch (code) {
    case DappErrorCode.INVALID_URL:
      return new InvalidUrlError(message || '', data);
    case DappErrorCode.INVALID_ORIGIN:
      return new InvalidOriginError(message || '', data);
    case DappErrorCode.URL_BLOCKED:
      return new UrlBlockedError(message || '', undefined, data);
    case DappErrorCode.DOMAIN_BLOCKED:
      return new DomainBlockedError(message || '', undefined, data);
    case DappErrorCode.CONTRACT_BLOCKED:
      return new ContractBlockedError(message || '', undefined, data);
    case DappErrorCode.UNSUPPORTED_CHAIN:
      return new UnsupportedChainError(message || '', data);
    case DappErrorCode.SESSION_NOT_FOUND:
      return new SessionNotFoundError(message || '', data);
    case DappErrorCode.SESSION_EXPIRED:
      return new SessionExpiredError(message || '', data);
    case DappErrorCode.PERMISSION_DENIED:
      return new PermissionDeniedError(message || '', '', data);
    case DappErrorCode.PERMISSION_NOT_GRANTED:
      return new PermissionNotGrantedError(message || '', '', data);
    case DappErrorCode.ACCOUNT_NOT_FOUND:
      return new AccountNotFoundError(message || '', data);
    case DappErrorCode.WALLET_NOT_CONNECTED:
      return new WalletNotConnectedError(data);
    case DappErrorCode.TRANSACTION_REJECTED:
      return new TransactionRejectedError(data);
    case DappErrorCode.SIGNATURE_REJECTED:
      return new SignatureRejectedError(data);
    case DappErrorCode.WALLETCONNECT_ERROR:
      return new WalletConnectError(message || '', data);
    case DappErrorCode.BRIDGE_ERROR:
      return new BridgeError(message || '', data);
    case DappErrorCode.WEBVIEW_ERROR:
      return new WebviewError(message || '', data);
    case DappErrorCode.SECURITY_VIOLATION:
      return new SecurityViolationError(message || '', data);
    case DappErrorCode.PHISHING_DETECTED:
      return new PhishingDetectedError(message || '', data);
    case DappErrorCode.RATE_LIMIT_EXCEEDED:
      return new RateLimitExceededError(message, data);
    default:
      return new DappError(code, message || 'Unknown DApp error', data);
  }
};