import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';

async function main() {
  const solService = new DidSolService({ cluster: 'devnet' });

  console.log('=== Step 1: 创建 Solana DID ===');
  const createResult = await solService.create();
  console.log(`DID: ${createResult.did}`);
  console.log(`公钥: ${createResult.keyPair.publicKey}`);
  console.log(`私钥: ${createResult.keyPair.privateKey}`);
  console.log(`浏览器链接: ${solService.getExplorerUrl(createResult.keyPair.publicKey)}`);

  console.log('\n=== Step 2: 检查余额 ===');
  const balance = await solService.getBalance(createResult.keyPair.publicKey);
  console.log(`当前余额: ${balance} SOL`);

  if (balance < 0.001) {
    console.log('\n=== Step 3: 获取测试SOL ===');
    try {
      const faucetResponse = await fetch(`https://api.devnet.solana.com`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'requestAirdrop',
          params: [createResult.keyPair.publicKey, 1000000000]
        })
      });
      const faucetResult = await faucetResponse.json();
      if (faucetResult.result) {
        console.log('测试SOL获取成功！交易哈希:', faucetResult.result);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newBalance = await solService.getBalance(createResult.keyPair.publicKey);
        console.log(`更新后余额: ${newBalance} SOL`);
      } else {
        console.log('测试SOL获取失败:', faucetResult.error);
      }
    } catch (error) {
      console.log('获取测试SOL失败:', error);
    }
  }

  console.log('\n=== Step 4: DID上链锚定 ===');
  try {
    const anchorResult = await solService.anchorDid(
      createResult.did,
      createResult.document,
      createResult.keyPair.privateKey
    );

    if (anchorResult.success) {
      console.log('✅ DID上链成功！');
      console.log(`交易哈希: ${anchorResult.transactionHash}`);
      console.log(`区块号: ${anchorResult.blockNumber}`);
      console.log(`时间戳: ${new Date(anchorResult.blockTimestamp * 1000).toISOString()}`);
      console.log(`\n🚀 在浏览器中查看: ${solService.getTransactionExplorerUrl(anchorResult.transactionHash)}`);
      console.log(`📋 DID文档: ${JSON.stringify(createResult.document, null, 2)}`);
    } else {
      console.log('❌ DID上链失败:', anchorResult.transactionHash);
    }
  } catch (error: any) {
    console.log('❌ DID上链失败:', error.message);
  }
}

main().catch(console.error);