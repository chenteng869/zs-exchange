// 部署福建老酒分润合约到 Base Sepolia 测试网
// 使用方式：npx hardhat run scripts/deploy-fujian-wine-hardhat.ts --network baseSepolia

import hre from 'hardhat';

async function main() {
  const { viem } = hre as any;
  const [deployer] = await viem.getWalletClients();

  console.log('部署账户:', deployer.account.address);

  const publicClient = await viem.getPublicClient();
  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log('账户余额:', hre.ethers.formatEther(balance), 'ETH');

  // 钱包地址配置（部署时从环境变量读取，默认使用部署者地址）
  const wallets = {
    productCostWallet: process.env.PRODUCT_COST_WALLET || deployer.account.address,
    aiopcCommissionWallet: process.env.AIOPC_COMMISSION_WALLET || deployer.account.address,
    zsVentureWallet: process.env.ZS_VENTURE_WALLET || deployer.account.address,
    overseasCryptoWallet: process.env.OVERSEAS_CRYPTO_WALLET || deployer.account.address,
    businessSchoolWallet: process.env.BUSINESS_SCHOOL_WALLET || deployer.account.address,
    techTeamWallet: process.env.TECH_TEAM_WALLET || deployer.account.address,
    operationsWallet: process.env.OPERATIONS_WALLET || deployer.account.address,
    affairsDeptWallet: process.env.AFFAIRS_DEPT_WALLET || deployer.account.address,
  };

  console.log('\n钱包地址配置:');
  console.log('  产品成本钱包:    ', wallets.productCostWallet);
  console.log('  AIOPC 提成钱包:  ', wallets.aiopcCommissionWallet);
  console.log('  中萨合资公司:    ', wallets.zsVentureWallet);
  console.log('  海外加密公司:    ', wallets.overseasCryptoWallet);
  console.log('  商学院事业部:    ', wallets.businessSchoolWallet);
  console.log('  技术团队:       ', wallets.techTeamWallet);
  console.log('  运营事业部:      ', wallets.operationsWallet);
  console.log('  事务部:         ', wallets.affairsDeptWallet);

  console.log('\n开始部署合约...');

  const contract = await viem.deployContract('FujianWineProfitSharing', [
    wallets.productCostWallet,
    wallets.aiopcCommissionWallet,
    wallets.zsVentureWallet,
    wallets.overseasCryptoWallet,
    wallets.businessSchoolWallet,
    wallets.techTeamWallet,
    wallets.operationsWallet,
    wallets.affairsDeptWallet,
  ]);

  console.log('\n✅ 合约部署成功！');
  console.log('合约地址:', contract.address);

  const receipt = await publicClient.getTransactionReceipt({
    hash: contract.deployTransaction.hash,
  });
  console.log('交易哈希:', contract.deployTransaction.hash);
  console.log('区块号:', receipt.blockNumber.toString());
  console.log('Gas Used:', receipt.gasUsed.toString());

  // 保存部署信息
  const fs = require('fs');
  const path = require('path');
  const deployInfo = {
    network: hre.network.name,
    contractAddress: contract.address,
    deployer: deployer.account.address,
    txHash: contract.deployTransaction.hash,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    wallets,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `fujian-wine-${hre.network.name}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));
  console.log('\n部署信息已保存到:', outputPath);

  // 验证合约（如果是测试网）
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('\n等待区块确认后验证合约...');
    console.log('请运行: npx hardhat verify --network', hre.network.name, contract.address);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('部署失败:', error);
    process.exit(1);
  });
