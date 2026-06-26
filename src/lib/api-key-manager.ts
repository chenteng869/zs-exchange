/**
 * API Key 管理服务
 * 
 * 功能? *   1. 加密存储敏感 API Key
 *   2. 按服务商分类管理密钥
 *   3. 密钥轮换和过期管? *   4. 权限控制和访问审? * 
 * 使用方法? *   import { apiKeyManager } from '@/lib/api-key-manager';
 *   const binanceKey = apiKeyManager.get('binance');
 */

import { prisma } from './prisma';
import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return crypto.createHash('sha256').update(key).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export interface ApiKeyConfig {
  id: string;
  provider: string;
  name: string;
  apiKey: string;
  secretKey?: string;
  passphrase?: string;
  description?: string;
  status: string;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyInput {
  provider: string;
  name: string;
  apiKey: string;
  secretKey?: string;
  passphrase?: string;
  description?: string;
  expiresAt?: Date;
}

export const apiKeyManager = {
  async create(input: ApiKeyInput): Promise<ApiKeyConfig> {
    const record = await prisma.exchangeApiKey.create({
      data: {
        provider: input.provider,
        name: input.name,
        apiKey: encrypt(input.apiKey),
        secretKey: input.secretKey ? encrypt(input.secretKey) : null,
        passphrase: input.passphrase ? encrypt(input.passphrase) : null,
        description: input.description,
        status: 'active',
        expiresAt: input.expiresAt,
      },
    });

    return {
      ...record,
      apiKey: input.apiKey,
      secretKey: input.secretKey,
      passphrase: input.passphrase,
    };
  },

  async getById(id: string): Promise<ApiKeyConfig | null> {
    const record = await prisma.exchangeApiKey.findUnique({ where: { id } });
    if (!record) return null;

    return {
      ...record,
      apiKey: decrypt(record.apiKey),
      secretKey: record.secretKey ? decrypt(record.secretKey) : undefined,
      passphrase: record.passphrase ? decrypt(record.passphrase) : undefined,
    };
  },

  async getByProvider(provider: string): Promise<ApiKeyConfig | null> {
    const record = await prisma.exchangeApiKey.findFirst({
      where: { provider, status: 'active' },
    });
    if (!record) return null;

    return {
      ...record,
      apiKey: decrypt(record.apiKey),
      secretKey: record.secretKey ? decrypt(record.secretKey) : undefined,
      passphrase: record.passphrase ? decrypt(record.passphrase) : undefined,
    };
  },

  async getAll(provider?: string): Promise<ApiKeyConfig[]> {
    const where = provider ? { provider } : {};
    const records = await prisma.exchangeApiKey.findMany({ where });

    return records.map((record) => ({
      ...record,
      apiKey: decrypt(record.apiKey),
      secretKey: record.secretKey ? decrypt(record.secretKey) : undefined,
      passphrase: record.passphrase ? decrypt(record.passphrase) : undefined,
    }));
  },

  async update(id: string, input: Partial<ApiKeyInput>): Promise<ApiKeyConfig | null> {
    const data: any = {};
    if (input.name) data.name = input.name;
    if (input.apiKey) data.apiKey = encrypt(input.apiKey);
    if (input.secretKey !== undefined) data.secretKey = input.secretKey ? encrypt(input.secretKey) : null;
    if (input.passphrase !== undefined) data.passphrase = input.passphrase ? encrypt(input.passphrase) : null;
    if (input.description) data.description = input.description;
    if (input.expiresAt) data.expiresAt = input.expiresAt;

    const record = await prisma.exchangeApiKey.update({ where: { id }, data });
    if (!record) return null;

    return {
      ...record,
      apiKey: input.apiKey || decrypt(record.apiKey),
      secretKey: input.secretKey || (record.secretKey ? decrypt(record.secretKey) : undefined),
      passphrase: input.passphrase || (record.passphrase ? decrypt(record.passphrase) : undefined),
    };
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.exchangeApiKey.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async rotate(id: string, newApiKey: string, newSecretKey?: string): Promise<ApiKeyConfig | null> {
    const record = await prisma.exchangeApiKey.findUnique({ where: { id } });
    if (!record) return null;

    await prisma.exchangeApiKey.update({
      where: { id },
      data: {
        status: 'rotating',
        apiKey: encrypt(newApiKey),
        secretKey: newSecretKey ? encrypt(newSecretKey) : record.secretKey,
      },
    });

    await prisma.exchangeApiKey.update({
      where: { id },
      data: { status: 'active' },
    });

    return this.getById(id);
  },

  async checkExpired(): Promise<string[]> {
    const now = new Date();
    const expired = await prisma.exchangeApiKey.findMany({
      where: { expiresAt: { lt: now }, status: 'active' },
    });

    const expiredIds = expired.map((r) => r.id);
    if (expiredIds.length > 0) {
      await prisma.exchangeApiKey.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: 'inactive' },
      });
    }

    return expiredIds;
  },

  async getFromEnv(provider: string): Promise<{ apiKey: string; secretKey?: string; passphrase?: string } | null> {
    const envKeyMap: Record<string, { key: string; secret?: string; passphrase?: string }> = {
      binance: { key: 'BINANCE_API_KEY', secret: 'BINANCE_API_SECRET' },
      coinbase: { key: 'COINBASE_API_KEY', secret: 'COINBASE_API_SECRET', passphrase: 'COINBASE_PASSPHRASE' },
      alchemy: { key: 'ALCHEMY_API_KEY' },
      coingecko: { key: 'COINGECKO_API_KEY' },
      kaiko: { key: 'KAIKO_API_KEY' },
      stripe: { key: 'STRIPE_API_KEY' },
      twilio: { key: 'TWILIO_ACCOUNT_SID', secret: 'TWILIO_AUTH_TOKEN' },
      sendgrid: { key: 'SENDGRID_API_KEY' },
      aliyun: { key: 'ALIYUN_OSS_ACCESS_KEY', secret: 'ALIYUN_OSS_SECRET_KEY' },
      moonpay: { key: 'MOONPAY_API_KEY' },
      chainlink: { key: 'CHAINLINK_API_KEY' },
    };

    const mapping = envKeyMap[provider.toLowerCase()];
    if (!mapping) return null;

    const apiKey = process.env[mapping.key];
    if (!apiKey) return null;

    return {
      apiKey,
      secretKey: mapping.secret ? process.env[mapping.secret] : undefined,
      passphrase: mapping.passphrase ? process.env[mapping.passphrase] : undefined,
    };
  },

  async get(provider: string): Promise<{ apiKey: string; secretKey?: string; passphrase?: string } | null> {
    const dbKey = await this.getByProvider(provider);
    if (dbKey) {
      return {
        apiKey: dbKey.apiKey,
        secretKey: dbKey.secretKey,
        passphrase: dbKey.passphrase,
      };
    }

    return this.getFromEnv(provider);
  },
};

export default apiKeyManager;