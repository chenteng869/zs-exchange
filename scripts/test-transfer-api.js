// Direct test of transfer-api.ts
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is required')
}

// Use tsx to load TypeScript directly
require('tsx/cjs/api').register();

(async () => {
  try {
    const { getTransfersForOwner } = require('./src/lib/alchemy/transfer-api.ts');
    const r = await getTransfersForOwner('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'eth', { maxCount: 3 });
    console.log('OK:', r.transfers.length, 'transfers');
    if (r.transfers.length > 0) {
      console.log('  first:', r.transfers[0].asset, r.transfers[0].value);
    }
  } catch (e) {
    console.log('FAIL:', e.message);
  }
  process.exit(0);
})();
