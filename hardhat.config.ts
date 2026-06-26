import { task } from 'hardhat/config';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';

// ============================================================
// 自定义任务：输出账户列表
// ============================================================
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.viem.getWalletClients();
  console.log('\nAvailable accounts:');
  console.log('===================');
  for (let i = 0; i < accounts.length; i++) {
    const balance = await hre.viem
      .getPublicClient()
      .getBalance({ address: accounts[i].account.address });
    console.log(`${i}: ${accounts[i].account.address} (${hre.viem.formatEther(balance)} ETH)`);
  }
  console.log('');
});

// ============================================================
// 自定义任务：部署福建老酒分润合约
// ============================================================
task('deploy-fujian-wine', 'Deploys FujianWineProfitSharing contract')
  .addOptionalParam('product', 'Product cost wallet address')
  .addOptionalParam('aiopc', 'AIOPC commission wallet address')
  .addOptionalParam('zs', 'ZS venture wallet address')
  .addOptionalParam('overseas', 'Overseas crypto wallet address')
  .addOptionalParam('school', 'Business school wallet address')
  .addOptionalParam('tech', 'Tech team wallet address')
  .addOptionalParam('ops', 'Operations wallet address')
  .addOptionalParam('affairs', 'Affairs dept wallet address')
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.viem.getWalletClients();
    const deployerAddress = deployer.account.address;

    const product = taskArgs.product || deployerAddress;
    const aiopc = taskArgs.aiopc || deployerAddress;
    const zs = taskArgs.zs || deployerAddress;
    const overseas = taskArgs.overseas || deployerAddress;
    const school = taskArgs.school || deployerAddress;
    const tech = taskArgs.tech || deployerAddress;
    const ops = taskArgs.ops || deployerAddress;
    const affairs = taskArgs.affairs || deployerAddress;

    console.log('\nDeploying FujianWineProfitSharing...');
    console.log('Deployer:', deployerAddress);
    console.log('\nWallet addresses:');
    console.log('  Product Cost:    ', product);
    console.log('  AIOPC Commission:', aiopc);
    console.log('  ZS Venture:      ', zs);
    console.log('  Overseas Crypto: ', overseas);
    console.log('  Business School: ', school);
    console.log('  Tech Team:       ', tech);
    console.log('  Operations:      ', ops);
    console.log('  Affairs Dept:    ', affairs);

    const contract = await hre.viem.deployContract('FujianWineProfitSharing', [
      product,
      aiopc,
      zs,
      overseas,
      school,
      tech,
      ops,
      affairs,
    ]);

    console.log('\n✅ Contract deployed successfully!');
    console.log('Contract address:', contract.address);

    const publicClient = await hre.viem.getPublicClient();
    const hash = contract.deployTransaction.hash;
    const receipt = await publicClient.getTransactionReceipt({ hash });
    console.log('Block number:', receipt.blockNumber.toString());
    console.log('Transaction hash:', hash);

    return {
      address: contract.address,
      deployer: deployerAddress,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    };
  });

// ============================================================
// 配置
// ============================================================
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
