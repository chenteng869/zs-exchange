import crypto from 'crypto';

const SALT_ROUNDS = 10;
const HASH_ALGORITHM = 'sha256';

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = hashedPassword.split(':');
    if (!salt || !hash) {
      resolve(false);
      return;
    }

    crypto.pbkdf2(password, salt, 100000, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) reject(err);
      const newHash = derivedKey.toString('hex');
      resolve(newHash === hash);
    });
  });
}

export function generateApiKey(prefix: string = 'zs_'): string {
  const key = crypto.randomBytes(32).toString('hex');
  return `${prefix}${key}`;
}

export function generateSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export default {
  hashPassword,
  verifyPassword,
  generateApiKey,
  generateSecret,
  generateReferralCode,
  md5,
  sha256,
};