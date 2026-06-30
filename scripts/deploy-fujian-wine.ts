// FujianWineProfitSharing 合约部署脚本
// 使用方式：npx tsx scripts/deploy-fujian-wine.ts

import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import fs from 'fs';
import path from 'path';

const CONTRACT_BYTECODE = fs.readFileSync(
  path.join(__dirname, '../contracts/FujianWineProfitSharing.bin'),
  'utf8'
);

const CONTRACT_ABI = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../contracts/FujianWineProfitSharing.abi.json'),
    'utf8'
  )
);

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const rpcUrl = process.env.RPC_URL || 'https://sepolia.base.org';

  if (!privateKey) {
    console.error('请设置 PRIVATE_KEY 环境变量');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  console.log('部署账户:', account.address);
  console.log('链: Base Sepolia');

  const walletAddresses = {
    productCostWallet: process.env.PRODUCT_COST_WALLET || account.address,
    aiopcCommissionWallet: process.env.AIOPC_COMMISSION_WALLET || account.address,
    zsVentureWallet: process.env.ZS_VENTURE_WALLET || account.address,
    overseasCryptoWallet: process.env.OVERSEAS_CRYPTO_WALLET || account.address,
    businessSchoolWallet: process.env.BUSINESS_SCHOOL_WALLET || account.address,
    techTeamWallet: process.env.TECH_TEAM_WALLET || account.address,
    operationsWallet: process.env.OPERATIONS_WALLET || account.address,
    affairsDeptWallet: process.env.AFFAIRS_DEPT_WALLET || account.address,
  };

  console.log('\n钱包地址配置:');
  console.table(walletAddresses);

  console.log('\n开始部署合约...');

  const hash = await client.deployContract({
    abi: CONTRACT_ABI,
    bytecode: CONTRACT_BYTECODE as `0x${string}`,
    args: [
      walletAddresses.productCostWallet,
      walletAddresses.aiopcCommissionWallet,
      walletAddresses.zsVentureWallet,
      walletAddresses.overseasCryptoWallet,
      walletAddresses.businessSchoolWallet,
      walletAddresses.techTeamWallet,
      walletAddresses.operationsWallet,
      walletAddresses.affairsDeptWallet,
    ],
  });

  console.log('交易哈希:', hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log('合约地址:', receipt.contractAddress);
  console.log('部署成功！');

  const output = {
    network: 'base-sepolia',
    contractAddress: receipt.contractAddress,
    deployer: account.address,
    txHash: hash,
    blockNumber: receipt.blockNumber.toString(),
    wallets: walletAddresses,
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, '../deployments/fujian-wine.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('部署信息已保存到:', outputPath);
}

main().catch((error) => {
  console.error('部署失败:', error);
  process.exit(1);
});
