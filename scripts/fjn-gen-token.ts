/**
 * 生成 FJN 测试用 JWT token
 *
 * 用法：npx tsx scripts/fjn-gen-token.ts [userId] [userType]
 * 默认：admin / dev-admin (跳过 DB 查询)
 */
import * as fs from 'fs';
import * as path from 'path';

// 模拟 next 的 env 加载：手动读 .env.local
const envFile = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

import('../src/lib/auth/jwt').then(async ({ encodeJWT }) => {
  const userId = process.argv[2] ?? 'dev-admin';
  const userType = (process.argv[3] as 'admin' | 'user') ?? 'admin';
  const token = await encodeJWT({
    userId,
    username: 'http-e2e-test',
    userType,
  });
  console.log(token);
});
