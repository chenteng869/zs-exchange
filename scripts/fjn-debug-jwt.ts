/**
 * 调试：检查 JWT 签发和验证的 secret
 */
import { encodeJWT, verifyToken } from '../src/lib/auth/jwt';

async function main() {
  console.log('--- 环境变量 ---');
  console.log('process.env.JWT_SECRET:', process.env.JWT_SECRET?.slice(0, 20) + '...');

  const token = await encodeJWT({
    userId: 'dev-admin',
    username: 'test',
    userType: 'admin',
  });
  console.log('\n--- 签发的 token ---');
  console.log(token);

  const verified = await verifyToken(token);
  console.log('\n--- 验证结果 ---');
  console.log(verified);
}

main();
