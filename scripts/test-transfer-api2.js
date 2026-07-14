// Direct test of transfer-api.ts
if (!process.env.ALCHEMY_API_KEY) {
  throw new Error('ALCHEMY_API_KEY is required')
}

const tsx = require('child_process');
const out = tsx.execSync('node -e "const {getTransfersForOwner} = require(\'./src/lib/alchemy/transfer-api.ts\'); (async()=>{try{const r=await getTransfersForOwner(\'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\',\'eth\',{maxCount:3}); console.log(\'OK:\',r.transfers.length)}catch(e){console.log(\'FAIL:\',e.message)}})"', { stdio: 'pipe', shell: true });
console.log(out.toString());
