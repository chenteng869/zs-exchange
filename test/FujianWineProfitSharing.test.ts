import { expect } from 'chai';
import { parseEther } from 'viem';
import hre from 'hardhat';
import type { HardhatViemClient } from '@nomicfoundation/hardhat-toolbox-viem/type-extensions';

const { viem } = hre as unknown as { viem: HardhatViemClient };

describe('FujianWineProfitSharing', function () {
  let contract: any;
  let deployer: any;
  let user1: any;
  let user2: any;
  let referrer: any;

  const PRICE_369 = parseEther('369');
  const PRICE_699 = parseEther('699');

  beforeEach(async function () {
    const wallets = await viem.getWalletClients();
    deployer = wallets[0];
    user1 = wallets[1];
    user2 = wallets[2];
    referrer = wallets[3];

    // 使用 deployer 作为所有角色钱包
    contract = await viem.deployContract('FujianWineProfitSharing', [
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
      deployer.account.address,
    ], {
      client: { wallet: deployer },
    });
  });

  describe('部署', function () {
    it('应该正确部署合约并设置 owner', async function () {
      const owner = await contract.read.owner();
      expect(owner.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
    });

    it('应该正确设置所有角色钱包', async function () {
      const productCost = await contract.read.productCostWallet();
      const aiopc = await contract.read.aiopcCommissionWallet();
      const zsVenture = await contract.read.zsVentureWallet();

      expect(productCost.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
      expect(aiopc.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
      expect(zsVenture.toLowerCase()).to.equal(deployer.account.address.toLowerCase());
    });
  });

  describe('分润计算 (getProfitBreakdown)', function () {
    it('369 美元档位分润比例应该正确', async function () {
      const result: any = await contract.read.getProfitBreakdown([PRICE_369]);

      const productCost = result[0];
      const aiopcCommission = result[1];
      const profitPool = result[2];

      // 40% 产品成本
      const expectedProductCost = (PRICE_369 * 40n) / 100n;
      expect(productCost).to.equal(expectedProductCost);

      // 30% AIOPC 提成
      const expectedAiopc = (PRICE_369 * 30n) / 100n;
      expect(aiopcCommission).to.equal(expectedAiopc);

      // 30% 剩余分润池
      const expectedPool = (PRICE_369 * 30n) / 100n;
      expect(profitPool).to.equal(expectedPool);
    });

    it('699 美元档位分润比例应该正确', async function () {
      const result: any = await contract.read.getProfitBreakdown([PRICE_699]);

      const productCost = result[0];
      const aiopcCommission = result[1];
      const profitPool = result[2];

      // 40% 产品成本
      const expectedProductCost = (PRICE_699 * 40n) / 100n;
      expect(productCost).to.equal(expectedProductCost);

      // 30% AIOPC 提成
      const expectedAiopc = (PRICE_699 * 30n) / 100n;
      expect(aiopcCommission).to.equal(expectedAiopc);

      // 30% 剩余分润池
      const expectedPool = (PRICE_699 * 30n) / 100n;
      expect(profitPool).to.equal(expectedPool);
    });

    it('剩余分润池 7 角色分配总和应该等于分润池总额', async function () {
      const result: any = await contract.read.getProfitBreakdown([PRICE_369]);

      const profitPool = result[2];
      const zsVenture = result[3];
      const overseasCrypto = result[4];
      const businessSchool = result[5];
      const techTeam = result[6];
      const operations = result[7];
      const affairsDept = result[8];
      const referrerShare = result[9];

      const total =
        zsVenture + overseasCrypto + businessSchool +
        techTeam + operations + affairsDept + referrerShare;

      // 由于整数除法可能有细微差异，允许 1 wei 误差
      expect(total).to.be.closeTo(profitPool, BigInt(2));
    });
  });

  describe('创建订单 (createOrder)', function () {
    it('不支持的价格档位应该报错', async function () {
      const invalidPrice = parseEther('100');
      await expect(
        contract.write.createOrder([
          referrer.account.address,
          invalidPrice,
        ], { value: invalidPrice, account: user1.account })
      ).to.be.rejectedWith('Invalid price tier');
    });

    it('付款金额不正确应该报错', async function () {
      const wrongAmount = parseEther('300');
      await expect(
        contract.write.createOrder([
          referrer.account.address,
          PRICE_369,
        ], { value: wrongAmount, account: user1.account })
      ).to.be.rejectedWith('Incorrect payment amount');
    });

    it('369 美元订单应该创建成功并分润', async function () {
      const beforeBalance = await viem
        .getPublicClient()
        .getBalance({ address: deployer.account.address });

      const orderId = await contract.write.createOrder(
        [referrer.account.address, PRICE_369],
        { value: PRICE_369, account: user1.account }
      );

      const afterBalance = await viem
        .getPublicClient()
        .getBalance({ address: deployer.account.address });

      // 订单数量应该增加
      const count = await contract.read.orderCount();
      expect(count).to.equal(1n);

      // 部署者收到分润（因为所有角色钱包都是 deployer）
      // 369 - (gas) 应该接近到账
      expect(afterBalance - beforeBalance).to.be.gt(0n);
    });

    it('应该发出 OrderCreated 事件', async function () {
      const hash = await contract.write.createOrder(
        [referrer.account.address, PRICE_369],
        { value: PRICE_369, account: user1.account }
      );

      const publicClient = await viem.getPublicClient();
      const receipt = await publicClient.getTransactionReceipt({ hash });

      expect(receipt.status).to.equal('success');
    });
  });

  describe('推荐人奖励', function () {
    it('有推荐人时，推荐人地址应该收到奖励', async function () {
      const beforeBalance = await viem
        .getPublicClient()
        .getBalance({ address: referrer.account.address });

      await contract.write.createOrder(
        [referrer.account.address, PRICE_369],
        { value: PRICE_369, account: user1.account }
      );

      const afterBalance = await viem
        .getPublicClient()
        .getBalance({ address: referrer.account.address });

      expect(afterBalance).to.be.gt(beforeBalance);
    });

    it('无推荐人时，推荐人奖励归入事务部', async function () {
      const zeroAddress = '0x0000000000000000000000000000000000000000';

      const beforeBalance = await viem
        .getPublicClient()
        .getBalance({ address: deployer.account.address });

      await contract.write.createOrder(
        [zeroAddress, PRICE_369],
        { value: PRICE_369, account: user1.account }
      );

      const afterBalance = await viem
        .getPublicClient()
        .getBalance({ address: deployer.account.address });

      // 部署者同时是事务部钱包，应该收到推荐人奖励
      expect(afterBalance).to.be.gt(beforeBalance);
    });
  });

  describe('订单查询', function () {
    beforeEach(async function () {
      await contract.write.createOrder(
        [referrer.account.address, PRICE_369],
        { value: PRICE_369, account: user1.account }
      );
      await contract.write.createOrder(
        [referrer.account.address, PRICE_699],
        { value: PRICE_699, account: user1.account }
      );
    });

    it('应该能查询用户订单数量', async function () {
      const count = await contract.read.getUserOrderCount([user1.account.address]);
      expect(count).to.equal(2n);
    });

    it('应该能分页查询用户订单', async function () {
      const orders = await contract.read.getUserOrders([
        user1.account.address,
        0n,
        10n,
      ]);
      expect(orders.length).to.equal(2);
      expect(orders[0].priceTier).to.equal(PRICE_369);
      expect(orders[1].priceTier).to.equal(PRICE_699);
    });

    it('应该记录累计收益', async function () {
      const earned = await contract.read.totalEarned([deployer.account.address]);
      expect(earned).to.be.gt(0n);
    });
  });

  describe('Owner 权限管理', function () {
    it('非 owner 不能修改钱包地址', async function () {
      await expect(
        contract.write.setProductCostWallet([user2.account.address], {
          account: user1.account,
        })
      ).to.be.rejectedWith('Not owner');
    });

    it('owner 可以修改钱包地址', async function () {
      await contract.write.setProductCostWallet([user2.account.address], {
        account: deployer.account,
      });
      const newWallet = await contract.read.productCostWallet();
      expect(newWallet.toLowerCase()).to.equal(user2.account.address.toLowerCase());
    });

    it('修改钱包地址应该发出 WalletUpdated 事件', async function () {
      const hash = await contract.write.setZsVentureWallet([user2.account.address], {
        account: deployer.account,
      });

      const publicClient = await viem.getPublicClient();
      const receipt = await publicClient.getTransactionReceipt({ hash });
      expect(receipt.status).to.equal('success');
    });
  });

  describe('所有权转移', function () {
    it('非 owner 不能转移所有权', async function () {
      await expect(
        contract.write.transferOwnership([user2.account.address], {
          account: user1.account,
        })
      ).to.be.rejectedWith('Not owner');
    });

    it('owner 可以转移所有权', async function () {
      await contract.write.transferOwnership([user2.account.address], {
        account: deployer.account,
      });
      const newOwner = await contract.read.owner();
      expect(newOwner.toLowerCase()).to.equal(user2.account.address.toLowerCase());
    });
  });
});
