import crypto from 'crypto';

const HASH_ALGORITHM = 'sha256';
const DEFAULT_ITERATIONS = 100000;
const COMMON_WEAK_PASSWORDS = new Set(['123456', 'password', 'qwerty', 'admin', '111111']);

export async function hashPassword(password: string, _salt?: string, iterations: number = DEFAULT_ITERATIONS): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, iterations, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`pbkdf2$${iterations}$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const legacyParts = hashedPassword.split('$');
    const colonParts = hashedPassword.split(':');
    const isLegacyFormat = legacyParts.length === 4 && legacyParts[0] === 'pbkdf2';
    const iterations = isLegacyFormat ? Number(legacyParts[1]) || DEFAULT_ITERATIONS : DEFAULT_ITERATIONS;
    const salt = isLegacyFormat ? legacyParts[2] : colonParts[0];
    const hash = isLegacyFormat ? legacyParts[3] : colonParts[1];
    if (!salt || !hash) {
      resolve(false);
      return;
    }

    crypto.pbkdf2(password, salt, iterations, 64, HASH_ALGORITHM, (err, derivedKey) => {
      if (err) reject(err);
      const newHash = derivedKey.toString('hex');
      resolve(newHash === hash);
    });
  });
}

export function checkPasswordStrength(password: string): { valid: boolean; score: number } {
  if (!password || COMMON_WEAK_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, score: 0 };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return {
    valid: score >= 3,
    score,
  };
}

export function needsRehash(hashedPassword: string, targetIterations: number = DEFAULT_ITERATIONS): boolean {
  const parts = hashedPassword.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
    return true;
  }
  return (Number(parts[1]) || 0) < targetIterations;
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
  checkPasswordStrength,
  needsRehash,
  generateApiKey,
  generateSecret,
  generateReferralCode,
  md5,
  sha256,
};