/**
 * 测试单个 endpoint（admin auth）
 */
import * as fs from 'fs';
import * as path from 'path';

// 手动加载 .env.local
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

import { encodeJWT } from '../src/lib/auth/jwt';

async function main() {
  const url = process.argv[2] || 'http://localhost:3200/api/v1/fjn/revenue/?action=list&page=1&pageSize=2';
  const userType = (process.argv[3] as 'admin' | 'user') || 'admin';

  const token = await encodeJWT({
    userId: 'dev-admin',
    username: 'http-e2e-test',
    userType,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountType: 'wine_cost_pool',
      businessType: 'income',
      direction: 'in',
      amount: '100.00',
      currency: 'CNY',
      sourceType: 'order',
      sourceId: '00000000-0000-0000-0000-000000000099',
    }),
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text.slice(0, 1000));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

