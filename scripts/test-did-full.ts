import { DidSolService } from '@/modules/did-identity/core/methods/did-sol.service';

async function main() {
  const solService = new DidSolService({ cluster: 'devnet' });

  console.log('==========================================');
  console.log('   OPCNAME - Solana DID 上链测试');
  console.log('==========================================\n');

  console.log('Step 1: 创建 Solana DID');
  console.log('------------------------');
  const createResult = await solService.create();
  console.log(`✅ DID已创建: ${createResult.did}`);
  console.log(`   公钥: ${createResult.keyPair.publicKey}`);
  console.log(`   私钥: ${createResult.keyPair.privateKey}`);
  console.log(`   浏览器查看: ${solService.getExplorerUrl(createResult.keyPair.publicKey)}\n`);

  console.log('Step 2: 检查余额');
  console.log('------------------------');
  const balance = await solService.getBalance(createResult.keyPair.publicKey);
  console.log(`💰 当前余额: ${balance} SOL\n`);

  if (balance < 0.001) {
    console.log('❌ 需要测试SOL才能上链');
    console.log('请访问以下链接获取测试SOL:');
    console.log(`   https://faucet.solana.com/`);
    console.log(`   输入地址: ${createResult.keyPair.publicKey}`);
    console.log('或者使用命令:');
    console.log(`   solana airdrop 2 ${createResult.keyPair.publicKey} --url https://api.devnet.solana.com\n`);
    
    console.log('等待3秒后再次检查余额...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newBalance = await solService.getBalance(createResult.keyPair.publicKey);
    console.log(`💰 更新后余额: ${newBalance} SOL\n`);

    if (newBalance < 0.001) {
      console.log('❌ 余额仍然不足，请手动获取测试SOL');
      console.log('获取SOL后，使用以下命令重新运行:');
      console.log(`   npx tsx scripts/test-did-anchor.ts --key ${createResult.keyPair.privateKey}\n`);
      console.log('DID文档:');
      console.log(JSON.stringify(createResult.document, null, 2));
      return;
    }
  }

  console.log('Step 3: DID上链锚定');
  console.log('------------------------');
  try {
    const anchorResult = await solService.anchorDid(
      createResult.did,
      createResult.document,
      createResult.keyPair.privateKey
    );

    if (anchorResult.success) {
      console.log('✅ DID上链成功！');
      console.log(`   交易哈希: ${anchorResult.transactionHash}`);
      console.log(`   区块号: ${anchorResult.blockNumber}`);
      console.log(`   时间戳: ${new Date(anchorResult.blockTimestamp * 1000).toISOString()}`);
      console.log(`\n🚀 在浏览器中查看交易:`);
      console.log(`   ${solService.getTransactionExplorerUrl(anchorResult.transactionHash)}`);
      console.log(`\n📋 DID文档:`);
      console.log(JSON.stringify(createResult.document, null, 2));
    } else {
      console.log('❌ DID上链失败');
      if (anchorResult.transactionHash) {
        console.log(`   查看失败交易: ${solService.getTransactionExplorerUrl(anchorResult.transactionHash)}`);
      }
    }
  } catch (error: any) {
    console.log('❌ DID上链失败:', error.message);
  }
}

main().catch(console.error);