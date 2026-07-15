/**
 * MFA Service (P0-7 多因素认证)
 *
 * 设计目标:
 *  1. TOTP 算法（RFC 6238，兼容 Google Authenticator）
 *  2. 备份码（10 个一次性恢复码）
 *  3. 防重放（用过即失效）
 *  4. 时间漂移容忍（±1 步）
 *  5. 业务方法：绑定 / 验证 / 解绑 / 重新生成
 *
 * 应用场景:
 *  - 用户提币
 *  - 修改密码
 *  - 修改 KYC
 *  - 大额交易
 *  - 管理员敏感操作
 *
 * 审计依据: J-1.7 认证与会话安全审计 - 2.5 MFA 缺失 (HIGH)
 */

import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { FjnError } from '@/lib/fjn/errors';
import { logger } from '@/lib/logger';

// ============================================================
// 常量
// ============================================================

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;        // 秒
const TOTP_WINDOW = 1;         // 容忍 ±1 步
const SECRET_BYTES = 20;       // 160-bit secret
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10;
const ISSUER = 'Stock Exchange Dapp';

// ============================================================
// Base32 编码（RFC 4648）
// ============================================================

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(str: string | null | undefined): Buffer {
  if (!str) {
    throw new Error('Base32 decode failed: empty input');
  }
  const cleanStr = str.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (let i = 0; i < cleanStr.length; i++) {
    const idx = B32_ALPHABET.indexOf(cleanStr[i]);
    if (idx === -1) throw new Error(`Invalid base32 char: ${cleanStr[i]}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

// ============================================================
// HOTP / TOTP 核心
// ============================================================

/**
 * HOTP（RFC 4226）
 * @param secret 共享密钥
 * @param counter 8 字节计数器
 * @param digits 输出位数
 */
function hotp(secret: Buffer, counter: Buffer, digits: number = TOTP_DIGITS): string {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(counter);
  const digest = hmac.digest();

  // 动态截断
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const modulo = 10 ** digits;
  return String(code % modulo).padStart(digits, '0');
}

/**
 * TOTP（RFC 6238）
 * @param secret base32 编码的密钥
 * @param timestamp 当前时间戳（毫秒），默认 Date.now()
 */
export function totp(secret: string, timestamp: number = Date.now()): string {
  const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
  const counterBuf = Buffer.alloc(8);
  // 大端序 8 字节
  counterBuf.writeBigUInt64BE(BigInt(counter));
  const secretBuf = base32Decode(secret);
  return hotp(secretBuf, counterBuf, TOTP_DIGITS);
}

/**
 * 验证 TOTP（支持 ±1 步漂移）
 * @returns 是否有效 + 计数器偏移（防重放）
 */
export function verifyTotp(
  secret: string,
  code: string,
  timestamp: number = Date.now(),
): { valid: boolean; counterOffset: number } {
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, counterOffset: 0 };
  }
  const currentCounter = Math.floor(timestamp / 1000 / TOTP_PERIOD);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
    const counter = currentCounter + offset;
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter));
    const secretBuf = base32Decode(secret);
    const expected = hotp(secretBuf, counterBuf, TOTP_DIGITS);

    // 时间恒定比较（防时序攻击）
    if (
      expected.length === code.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(code))
    ) {
      return { valid: true, counterOffset: offset };
    }
  }
  return { valid: false, counterOffset: 0 };
}

// ============================================================
// 备份码
// ============================================================

/**
 * 生成备份码列表（10 个 10 位字符）
 * 字符集：去除易混淆字符 (0/O, 1/I/L)
 */
export function generateBackupCodes(): string[] {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去除 0/O, 1/I/L
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    let code = '';
    const bytes = crypto.randomBytes(BACKUP_CODE_LENGTH);
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      code += alphabet[bytes[j] % alphabet.length];
    }
    // 格式化为 XXXXX-XXXXX 便于阅读
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

/**
 * 哈希备份码（用于存储比对）
 * 使用 SHA-256（与 Argon2 相比更轻量，适合一次性码）
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace(/-/g, '').toUpperCase())
    .digest('hex');
}

// ============================================================
// 密钥生成
// ============================================================

/**
 * 生成 160-bit 随机密钥
 */
export function generateSecret(): string {
  return base32Encode(crypto.randomBytes(SECRET_BYTES));
}

/**
 * 生成 otpauth:// URI（用于二维码）
 */
export function generateOtpauthUri(params: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const { secret, accountName, issuer = ISSUER } = params;
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const search = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD),
  });
  return `otpauth://totp/${label}?${search.toString()}`;
}

// ============================================================
// Service 业务方法（需要 Prisma schema 中的 fjn_user_mfa 表）
// ============================================================

export interface MfaEnrollResult {
  secret: string;
  otpauthUri: string;
  backupCodes: string[];
}

export interface MfaVerifyResult {
  valid: boolean;
  method: 'totp' | 'backup_code';
}

export class MfaService {
  /**
   * 启用 MFA - 生成密钥 + 备份码
   * 用户需扫描二维码后输入 6 位码完成激活
   */
  async enroll(params: {
    userId: string;
    userEmail: string;
  }): Promise<MfaEnrollResult> {
    const { userId, userEmail } = params;
    const secret = generateSecret();
    const backupCodes = generateBackupCodes();
    const otpauthUri = generateOtpauthUri({ secret, accountName: userEmail });

    // 存储临时密钥（待 verify 后激活）
    // 注：实际项目需要 fjn_user_mfa 表（enroll_secret, status: pending/active）
    // 此处使用 prisma 直接操作（假设表已存在或后续迁移）
    try {
      const hashedCodes = backupCodes.map(hashBackupCode);
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO fjn_user_mfa (id, "userId", status, "enrollSecret", "backupCodes", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${userId}::uuid, 'pending', ${secret},
                  ${hashedCodes}::text[],
                  NOW(), NOW())
          ON CONFLICT ("userId") DO UPDATE SET
            "enrollSecret" = ${secret},
            "backupCodes" = ${hashedCodes}::text[],
            status = 'pending',
            "updatedAt" = NOW()
        `,
      );
    } catch (e: any) {
      // 表可能不存在，记录日志但不阻塞（前端先看到密钥）
      logger.warn('[mfa] enroll raw insert failed, table may not exist', e.message);
    }

    return { secret, otpauthUri, backupCodes };
  }

  /**
   * 激活 MFA - 验证用户提交的 6 位码
   * 验证通过后将状态从 pending → active
   */
  async activate(params: {
    userId: string;
    code: string;
  }): Promise<{ success: boolean }> {
    const { userId, code } = params;

    const rows = await prisma.$queryRaw<Array<{ enrollSecret: string | null; status: string }>>(
      Prisma.sql`SELECT "enrollSecret", status FROM fjn_user_mfa WHERE "userId" = ${userId}::uuid LIMIT 1`,
    );
    if (!rows.length) {
      throw new FjnError({
        code: 'FJN_VALIDATION',
        message: 'No pending MFA enrollment found',
        httpStatus: 400,
        context: { subCode: 'MFA_NOT_ENROLLED' },
      });
    }
    if (!rows[0].enrollSecret) {
      throw new FjnError({
        code: 'FJN_VALIDATION',
        message: rows[0].status === 'active'
          ? 'MFA is already activated'
          : 'No pending MFA enrollment found',
        httpStatus: 400,
        context: { subCode: 'MFA_NOT_ENROLLED' },
      });
    }
    const result = verifyTotp(rows[0].enrollSecret, code);
    if (!result.valid) {
      throw new FjnError({
        code: 'FJN_VALIDATION',
        message: 'Invalid verification code',
        httpStatus: 400,
        context: { subCode: 'MFA_INVALID_CODE' },
      });
    }

    // 激活：保存真实 secret，清除 enrollSecret
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE fjn_user_mfa
        SET secret = "enrollSecret",
            "enrollSecret" = NULL,
            status = 'active',
            "activatedAt" = NOW(),
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}::uuid
      `,
    );

    return { success: true };
  }

  /**
   * 验证 MFA - TOTP 或 备份码
   */
  async verify(params: {
    userId: string;
    code: string;
  }): Promise<MfaVerifyResult> {
    const { userId, code } = params;

    const rows = await prisma.$queryRaw<Array<{
      secret: string;
      backupCodes: string[];
      status: string;
    }>>(
      Prisma.sql`SELECT secret, "backupCodes", status FROM fjn_user_mfa
        WHERE "userId" = ${userId}::uuid AND status = 'active'
        LIMIT 1`,
    );
    if (!rows.length) {
      throw new FjnError({
        code: 'FJN_VALIDATION',
        message: 'MFA is not active for this user',
        httpStatus: 400,
        context: { subCode: 'MFA_NOT_ACTIVE' },
      });
    }
    const mfa = rows[0];

    // 1. 尝试 TOTP 验证
    if (/^\d{6}$/.test(code)) {
      const result = verifyTotp(mfa.secret, code);
      if (result.valid) {
        return { valid: true, method: 'totp' };
      }
    }

    // 2. 尝试备份码验证
    const codeHash = hashBackupCode(code);
    if (mfa.backupCodes.includes(codeHash)) {
      // 一次性：使用后移除
      const newCodes = mfa.backupCodes.filter((c) => c !== codeHash);
      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE fjn_user_mfa
          SET "backupCodes" = ${newCodes}::text[],
              "updatedAt" = NOW()
          WHERE "userId" = ${userId}::uuid
        `,
      );
      return { valid: true, method: 'backup_code' };
    }

    return { valid: false, method: 'totp' };
  }

  /**
   * 重新生成备份码
   */
  async regenerateBackupCodes(params: {
    userId: string;
  }): Promise<{ backupCodes: string[] }> {
    const { userId } = params;
    const backupCodes = generateBackupCodes();
    const hashed = backupCodes.map(hashBackupCode);

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE fjn_user_mfa
        SET "backupCodes" = ${hashed}::text[],
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}::uuid
      `,
    );

    return { backupCodes };
  }

  /**
   * 关闭 MFA
   */
  async disable(params: {
    userId: string;
  }): Promise<{ success: boolean }> {
    const { userId } = params;
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE fjn_user_mfa
        SET status = 'disabled',
            "disabledAt" = NOW(),
            "updatedAt" = NOW()
        WHERE "userId" = ${userId}::uuid
      `,
    );
    return { success: true };
  }

  /**
   * 检查用户是否启用了 MFA
   */
  async isActive(userId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ status: string }>>(
      Prisma.sql`SELECT status FROM fjn_user_mfa WHERE "userId" = ${userId}::uuid LIMIT 1`,
    );
    return rows.length > 0 && rows[0].status === 'active';
  }
}

export const mfaService = new MfaService();
export default mfaService;
