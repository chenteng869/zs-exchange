import { generateAccessToken } from '@/lib/auth/jwt';

async function main() {
  const token = await generateAccessToken({
    userId: 'dev-admin',
    username: 'test-user',
    userType: 'admin',
  });

  console.log('Generated Token:', token);
  console.log('');
  
  const apiUrls = [
    { name: 'Health', url: 'http://localhost:3200/api/health' },
    { name: 'Gas Price', url: 'http://localhost:3200/api/v1/solana/gas-price?chain=devnet' },
    { name: 'Latest Block', url: 'http://localhost:3200/api/v1/solana/block/latest?chain=devnet' },
  ];

  for (const api of apiUrls) {
    console.log(`\n=== Testing ${api.name} ===`);
    console.log(`URL: ${api.url}`);
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!api.url.includes('/api/health')) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(api.url, { headers });
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('Error:', error);
    }
  }
}

main().catch(console.error);