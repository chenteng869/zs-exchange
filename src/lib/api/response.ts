import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function success<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function created<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return success(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function error(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function badRequest(message: string = 'Bad Request', details?: unknown): NextResponse<ApiErrorResponse> {
  return error('BAD_REQUEST', message, 400, details);
}

export function unauthorized(message: string = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return error('UNAUTHORIZED', message, 401);
}

export function forbidden(message: string = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return error('FORBIDDEN', message, 403);
}

export function notFound(message: string = 'Not Found'): NextResponse<ApiErrorResponse> {
  return error('NOT_FOUND', message, 404);
}

export function conflict(message: string = 'Conflict'): NextResponse<ApiErrorResponse> {
  return error('CONFLICT', message, 409);
}

export function tooManyRequests(message: string = 'Too Many Requests'): NextResponse<ApiErrorResponse> {
  return error('TOO_MANY_REQUESTS', message, 429);
}

export function internalError(message: string = 'Internal Server Error', details?: unknown): NextResponse<ApiErrorResponse> {
  return error('INTERNAL_ERROR', message, 500, details);
}

export function serverError(message: string = 'Internal Server Error', details?: unknown): NextResponse<ApiErrorResponse> {
  return internalError(message, details);
}

export function validationError(errors: Record<string, string[]>): NextResponse<ApiErrorResponse> {
  return error('VALIDATION_ERROR', 'Validation failed', 400, errors);
}

export default {
  success,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  serverError,
  validationError,
};
