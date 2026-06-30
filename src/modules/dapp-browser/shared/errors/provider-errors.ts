export enum ProviderErrorCode {
  USER_REJECTED_REQUEST = 4001,
  UNAUTHORIZED = 4100,
  UNSUPPORTED_METHOD = 4200,
  DISCONNECTED = 4900,
  CHAIN_DISCONNECTED = 4901,
  CHAIN_NOT_ADDED = 4902,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  PARSE_ERROR = -32700,
  METHOD_NOT_FOUND = -32601,
}

export class ProviderRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ProviderRpcError';
    this.code = code;
    this.data = data;
  }
}

export class UserRejectedRequestError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.USER_REJECTED_REQUEST, 'User rejected the request.', data);
    this.name = 'UserRejectedRequestError';
  }
}

export class UnauthorizedError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.UNAUTHORIZED, 'The request is not authorized.', data);
    this.name = 'UnauthorizedError';
  }
}

export class UnsupportedMethodError extends ProviderRpcError {
  constructor(method: string, data?: unknown) {
    super(ProviderErrorCode.UNSUPPORTED_METHOD, `The method ${method} is not supported.`, data);
    this.name = 'UnsupportedMethodError';
  }
}

export class DisconnectedError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.DISCONNECTED, 'The provider is disconnected.', data);
    this.name = 'DisconnectedError';
  }
}

export class ChainDisconnectedError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.CHAIN_DISCONNECTED, 'The chain is disconnected.', data);
    this.name = 'ChainDisconnectedError';
  }
}

export class ChainNotAddedError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.CHAIN_NOT_ADDED, 'The chain has not been added to the wallet.', data);
    this.name = 'ChainNotAddedError';
  }
}

export class InvalidParamsError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.INVALID_PARAMS, 'Invalid parameters.', data);
    this.name = 'InvalidParamsError';
  }
}

export class InternalError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.INTERNAL_ERROR, 'Internal error.', data);
    this.name = 'InternalError';
  }
}

export class ParseError extends ProviderRpcError {
  constructor(data?: unknown) {
    super(ProviderErrorCode.PARSE_ERROR, 'Parse error.', data);
    this.name = 'ParseError';
  }
}

export class MethodNotFoundError extends ProviderRpcError {
  constructor(method: string, data?: unknown) {
    super(ProviderErrorCode.METHOD_NOT_FOUND, `The method ${method} does not exist.`, data);
    this.name = 'MethodNotFoundError';
  }
}

export const getProviderError = (code: number, message?: string, data?: unknown): ProviderRpcError => {
  switch (code) {
    case ProviderErrorCode.USER_REJECTED_REQUEST:
      return new UserRejectedRequestError(data);
    case ProviderErrorCode.UNAUTHORIZED:
      return new UnauthorizedError(data);
    case ProviderErrorCode.UNSUPPORTED_METHOD:
      return new UnsupportedMethodError(message || '', data);
    case ProviderErrorCode.DISCONNECTED:
      return new DisconnectedError(data);
    case ProviderErrorCode.CHAIN_DISCONNECTED:
      return new ChainDisconnectedError(data);
    case ProviderErrorCode.CHAIN_NOT_ADDED:
      return new ChainNotAddedError(data);
    case ProviderErrorCode.INVALID_PARAMS:
      return new InvalidParamsError(data);
    case ProviderErrorCode.INTERNAL_ERROR:
      return new InternalError(data);
    case ProviderErrorCode.PARSE_ERROR:
      return new ParseError(data);
    case ProviderErrorCode.METHOD_NOT_FOUND:
      return new MethodNotFoundError(message || '', data);
    default:
      return new ProviderRpcError(code, message || 'Unknown error', data);
  }
};