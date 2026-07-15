/**
 * WebAuthn / FIDO2 服务 (L-3)
 *
 * 核心功能：
 *  - generateRegistrationOptions: 生成注册选项
 *  - verifyRegistrationResponse: 验证注册响应
 *  - generateAuthenticationOptions: 生成认证选项
 *  - verifyAuthenticationResponse: 验证认证响应
 *
 * 凭证管理：
 *  - 列出用户的凭证
 *  - 撤销凭证
 *  - 更新最后使用时间 + counter
 *
 * 挑战管理：
 *  - 存储 challenge（5 分钟 TTL）
 *  - 一次性使用（防重放）
 */

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  PublicKeyCredentialDescriptorFuture,
} from '@simplewebauthn/types';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { safeJsonParse } from '@/lib/security/safe-json-parse';

// ============================================================
// 配置
// ============================================================
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'Stock Exchange Dapp';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN || 'http://localhost:3200';
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 分钟

// ============================================================
// 类型
// ============================================================
export interface RegistrationOptions {
  challenge: string;
  user: { id: string; name: string; displayName: string };
  rp: { id: string; name: string };
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  timeout: number;
  attestation: 'none' | 'direct' | 'enterprise';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey?: 'discouraged' | 'preferred' | 'required';
    userVerification?: 'discouraged' | 'preferred' | 'required';
  };
  excludeCredentials: { id: string; type: 'public-key'; transports?: string[] }[];
}

export interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: { id: string; type: 'public-key'; transports?: string[] }[];
  userVerification: 'discouraged' | 'preferred' | 'required';
}

export interface VerifyRegistrationResult {
  verified: boolean;
  credentialId?: string;
  aaguid?: string;
  fmt?: string;
  userVerified?: boolean;
  error?: string;
}

export interface VerifyAuthenticationResult {
  verified: boolean;
  credentialId?: string;
  newCounter?: number;
  userVerified?: boolean;
  error?: string;
}

// ============================================================
// 1. 注册阶段
// ============================================================

/**
 * 生成注册选项
 *  - 用户名 = userId（base64url）
 *  - 排除已注册的凭证
 */
export async function generateWebAuthnRegistrationOptions(params: {
  userId: string;
  userName: string;
  userDisplayName?: string;
  authenticatorType?: 'platform' | 'cross-platform' | 'any';
  userVerification?: 'discouraged' | 'preferred' | 'required';
}): Promise<RegistrationOptions> {
  const existingCreds = await prisma.fjnWebAuthnCredential.findMany({
    where: {
      userId: params.userId as any,
      revokedAt: null,
    } as any,
    select: { credentialId: true, transports: true } as any,
  });

  const excludeCredentials: PublicKeyCredentialDescriptorFuture[] = existingCreds.map((c: any) => ({
    id: c.credentialId, // string (Base64URLString)
    type: 'public-key' as const,
    transports: (c.transports as AuthenticatorTransportFuture[]) || undefined,
  }));

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: params.userId, // string in v9
    userName: params.userName,
    userDisplayName: params.userDisplayName || params.userName,
    timeout: 60_000,
    attestationType: 'none',
    excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment:
        params.authenticatorType === 'platform'
          ? 'platform'
          : params.authenticatorType === 'cross-platform'
            ? 'cross-platform'
            : undefined,
      userVerification: params.userVerification || 'preferred',
      residentKey: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256 (P-256) + RS256
  };

  const options = await generateRegistrationOptions(opts);

  // 存储 challenge
  await storeChallenge({
    userId: params.userId,
    challenge: options.challenge,
    type: 'registration',
  });

  return options as RegistrationOptions;
}

/**
 * 验证注册响应
 *  - 解析 attestationObject
 *  - 提取公钥
 *  - 存储凭证
 */
export async function verifyWebAuthnRegistration(params: {
  userId: string;
  response: RegistrationResponseJSON;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<VerifyRegistrationResult> {
  try {
    // 查询 challenge
    const challengeRecord = await consumeChallenge({
      userId: params.userId,
      challenge: (params.response as any).response?.clientDataJSON
        ? extractChallengeFromClientData((params.response as any).response.clientDataJSON)
        : null,
      type: 'registration',
    });

    if (!challengeRecord) {
      return { verified: false, error: 'Invalid or expired challenge' };
    }

    const opts: VerifyRegistrationResponseOpts = {
      response: params.response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false, error: 'Verification failed' };
    }

    const regInfo = verification.registrationInfo;
    const credentialID = regInfo.credentialID; // v9: 直接是 Uint8Array
    const credentialPublicKey = regInfo.credentialPublicKey;
    const counter = regInfo.counter;

    // base64 编码公钥
    const publicKeyB64 = Buffer.from(credentialPublicKey).toString('base64');
    // base64url 编码 credentialId
    const credentialIdB64 = Buffer.from(credentialID).toString('base64url');

    // 存储凭证
    await prisma.fjnWebAuthnCredential.create({
      data: {
        userId: params.userId as any,
        credentialId: credentialIdB64,
        publicKey: publicKeyB64,
        counter: BigInt(counter),
        credentialType: 'public-key',
        transports: (regInfo.credentialBackedUp ? ['hybrid'] : []) as string[],
        aaguid: regInfo.aaguid || null,
        fmt: regInfo.fmt || null,
        deviceName: params.deviceName,
        deviceType: regInfo.credentialBackedUp ? 'multi_device' : 'single_device',
        backupEligible: regInfo.credentialBackedUp || false,
        backupState: regInfo.credentialBackedUp || false,
        userVerified: regInfo.userVerified || false,
        metadata: {
          ipAddress: params.ipAddress,
          userAgent: params.userAgent?.slice(0, 500),
        },
      } as any,
    });

    logger.info(
      `[webauthn] Registered credential ${credentialIdB64.slice(0, 16)}... for user ${params.userId}`,
    );

    return {
      verified: true,
      credentialId: credentialIdB64,
      aaguid: regInfo.aaguid,
      fmt: regInfo.fmt,
      userVerified: regInfo.userVerified,
    };
  } catch (e: any) {
    logger.error(`[webauthn] Registration verification failed: ${e.message}`);
    return { verified: false, error: e.message };
  }
}

// ============================================================
// 2. 认证阶段
// ============================================================

/**
 * 生成认证选项
 *  - 列出用户已注册凭证
 *  - 生成 challenge
 */
export async function generateWebAuthnAuthenticationOptions(params: {
  userId?: string; // 可选：usernameless 模式
  userVerification?: 'discouraged' | 'preferred' | 'required';
}): Promise<AuthenticationOptions> {
  let allowCredentials: PublicKeyCredentialDescriptorFuture[] = [];

  if (params.userId) {
    const creds = await prisma.fjnWebAuthnCredential.findMany({
      where: {
        userId: params.userId as any,
        revokedAt: null,
      } as any,
      select: { credentialId: true, transports: true } as any,
    });
    allowCredentials = creds.map((c: any) => ({
      id: c.credentialId,
      type: 'public-key' as const,
      transports: (c.transports as AuthenticatorTransportFuture[]) || undefined,
    }));
  }

  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: RP_ID,
    timeout: 60_000,
    userVerification: params.userVerification || 'preferred',
    allowCredentials,
  };

  const options = await generateAuthenticationOptions(opts);

  // 存储 challenge
  await storeChallenge({
    userId: params.userId,
    challenge: options.challenge,
    type: 'authentication',
  });

  return options as AuthenticationOptions;
}

/**
 * 验证认证响应
 *  - 验证签名
 *  - 更新 counter
 *  - 更新 lastUsedAt
 */
export async function verifyWebAuthnAuthentication(params: {
  userId?: string;
  response: AuthenticationResponseJSON;
  ipAddress?: string;
  userAgent?: string;
}): Promise<VerifyAuthenticationResult> {
  try {
    // 查询 challenge
    const challengeRecord = await consumeChallenge({
      userId: params.userId,
      challenge: (params.response as any).response?.clientDataJSON
        ? extractChallengeFromClientData((params.response as any).response.clientDataJSON)
        : null,
      type: 'authentication',
    });

    if (!challengeRecord) {
      return { verified: false, error: 'Invalid or expired challenge' };
    }

    // 查询凭证
    const credential = await prisma.fjnWebAuthnCredential.findUnique({
      where: { credentialId: params.response.id },
    });

    if (!credential || credential.revokedAt) {
      return { verified: false, error: 'Credential not found or revoked' };
    }

    // 公钥反序列化
    const publicKey = Buffer.from(credential.publicKey, 'base64');
    // credentialId 反序列化
    const credentialIdBuf = Buffer.from(credential.credentialId, 'base64url');

    const opts: VerifyAuthenticationResponseOpts = {
      response: params.response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: new Uint8Array(credentialIdBuf),
        credentialPublicKey: new Uint8Array(publicKey),
        counter: Number(credential.counter),
        transports: (credential.transports as AuthenticatorTransportFuture[]) || [],
      },
      requireUserVerification: false,
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (!verification.verified) {
      return { verified: false, error: 'Authentication verification failed' };
    }

    // 更新 counter + lastUsedAt
    await prisma.fjnWebAuthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      } as any,
    });

    logger.info(
      `[webauthn] Authenticated credential ${credential.credentialId.slice(0, 16)}... for user ${credential.userId}`,
    );

    return {
      verified: true,
      credentialId: credential.credentialId,
      newCounter: verification.authenticationInfo.newCounter,
      userVerified: verification.authenticationInfo.userVerified,
    };
  } catch (e: any) {
    logger.error(`[webauthn] Authentication verification failed: ${e.message}`);
    return { verified: false, error: e.message };
  }
}

// ============================================================
// 3. 凭证管理
// ============================================================

/**
 * 列出用户的所有凭证
 */
export async function listUserCredentials(userId: string) {
  return prisma.fjnWebAuthnCredential.findMany({
    where: {
      userId: userId as any,
      revokedAt: null,
    } as any,
    orderBy: { registeredAt: 'desc' },
    select: {
      id: true,
      credentialId: true,
      aaguid: true,
      deviceName: true,
      deviceType: true,
      backupEligible: true,
      backupState: true,
      userVerified: true,
      transports: true,
      lastUsedAt: true,
      registeredAt: true,
    } as any,
  });
}

/**
 * 撤销凭证
 *  - 验证所有权
 */
export async function revokeCredential(userId: string, credentialId: string): Promise<boolean> {
  const result = await prisma.fjnWebAuthnCredential.updateMany({
    where: {
      credentialId,
      userId: userId as any,
      revokedAt: null,
    } as any,
    data: { revokedAt: new Date() } as any,
  });
  return result.count > 0;
}

// ============================================================
// 4. Challenge 管理
// ============================================================

async function storeChallenge(params: {
  userId?: string;
  challenge: string;
  type: 'registration' | 'authentication';
}) {
  // 清理过期 challenge
  await prisma.fjnWebAuthnChallenge.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  return prisma.fjnWebAuthnChallenge.create({
    data: {
      userId: (params.userId || null) as any,
      challenge: params.challenge,
      type: params.type,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    } as any,
  });
}

async function consumeChallenge(params: {
  userId?: string;
  challenge?: string | null;
  type: 'registration' | 'authentication';
}) {
  if (!params.challenge) return null;

  // 查找未使用的 challenge
  const record = await prisma.fjnWebAuthnChallenge.findUnique({
    where: { challenge: params.challenge },
  });

  if (!record) return null;
  if (record.usedAt) return null; // 已被使用
  if (record.expiresAt < new Date()) return null;
  if (record.type !== params.type) return null;

  // 标记已使用（一次性）
  await prisma.fjnWebAuthnChallenge.update({
    where: { id: record.id },
    data: { usedAt: new Date() } as any,
  });

  return record;
}

/**
 * 从 clientDataJSON 提取 challenge
 *  - 避免依赖 simplewebauthn/parser
 */
function extractChallengeFromClientData(clientDataJSON: string): string | null {
  try {
    const decoded = Buffer.from(clientDataJSON, 'base64url').toString('utf-8');
    const clientData = safeJsonParse<{ challenge?: unknown }>(decoded, {
      context: 'webauthn-client-data',
      maxBytes: 4 * 1024,
      silent: true,
      defaultValue: null,
    });
    if (!clientData) return null;
    return typeof clientData.challenge === 'string' ? clientData.challenge : null;
  } catch {
    return null;
  }
}
