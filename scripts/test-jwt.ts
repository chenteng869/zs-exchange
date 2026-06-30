import { generateAccessToken, verifyToken, decodeJWT } from '@/lib/auth/jwt';

async function main() {
  const payload = { userId: 'dev-admin', username: 'test-user', userType: 'admin' };
  
  console.log('Payload:', payload);
  
  const token = await generateAccessToken(payload);
  console.log('Generated Token:', token);
  
  const decoded = decodeJWT(token);
  console.log('Decoded Token:', JSON.stringify(decoded, null, 2));
  
  const verified = await verifyToken(token);
  console.log('Verified:', JSON.stringify(verified, null, 2));
}

main().catch(console.error);