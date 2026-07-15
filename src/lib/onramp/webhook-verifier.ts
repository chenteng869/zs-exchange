import { createHmac, timingSafeEqual } from 'crypto';

export class MoonPayWebhookSignatureError extends Error {
  public readonly code:
    | 'SIGNATURE_MISSING'
    | 'SIGNATURE_INVALID'
    | 'KEY_MISSING'
    | 'LENGTH_MISMATCH';

  constructor(
    code: 'SIGNATURE_MISSING' | 'SIGNATURE_INVALID' | 'KEY_MISSING' | 'LENGTH_MISMATCH',
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = 'MoonPayWebhookSignatureError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function signMoonPayWebhook(rawBody: string, secret: string): string {
  if (!secret) {
    throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is required');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }
  return createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
}

export function signMoonPayWebhookV2(
  rawBody: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  if (!secret) {
    throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is required');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }

  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},s=${signature}`;
}

function parseMoonPayV2SignatureHeader(signature: string): { timestamp: number; signature: string } | null {
  if (!signature.includes('=') || !signature.includes(',')) return null;

  const parts = Object.fromEntries(
    signature
      .split(',')
      .map((part) => part.trim().split('='))
      .filter((part): part is [string, string] => part.length === 2),
  );

  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp) || !parts.s) return null;
  return { timestamp, signature: parts.s };
}

function timingSafeHexEqual(actualHex: string, expectedHex: string): boolean {
  const a = Buffer.from(actualHex.toLowerCase(), 'utf8');
  const b = Buffer.from(expectedHex.toLowerCase(), 'utf8');
  if (a.length !== b.length) {
    throw new MoonPayWebhookSignatureError(
      'LENGTH_MISMATCH',
      `Signature length mismatch: got ${a.length}, expected ${b.length}`,
    );
  }
  if (!timingSafeEqual(a, b)) {
    throw new MoonPayWebhookSignatureError('SIGNATURE_INVALID', 'MoonPay signature is invalid');
  }
  return true;
}

export function verifyMoonPaySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret) {
    throw new MoonPayWebhookSignatureError('KEY_MISSING', 'secret is not configured');
  }
  if (!signature || typeof signature !== 'string') {
    throw new MoonPayWebhookSignatureError('SIGNATURE_MISSING', 'MoonPay signature header is missing');
  }
  if (typeof rawBody !== 'string') {
    rawBody = String(rawBody ?? '');
  }

  const parsedV2 = parseMoonPayV2SignatureHeader(signature);
  if (parsedV2) {
    const now = Math.floor(Date.now() / 1000);
    const maxAgeSeconds = Number(process.env.MOONPAY_WEBHOOK_MAX_AGE_SECONDS || 300);
    if (Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0 && Math.abs(now - parsedV2.timestamp) > maxAgeSeconds) {
      throw new MoonPayWebhookSignatureError('SIGNATURE_INVALID', 'MoonPay signature timestamp is outside tolerance');
    }

    const expected = createHmac('sha256', secret)
      .update(`${parsedV2.timestamp}.${rawBody}`, 'utf8')
      .digest('hex');
    return timingSafeHexEqual(parsedV2.signature, expected);
  }

  const expected = signMoonPayWebhook(rawBody, secret);
  return timingSafeHexEqual(signature, expected);
}
