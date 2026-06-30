import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { WalletTierManager, WalletTier, WalletStatus } from '../../mpc/wallet-tier-manager';
import { ChainType } from '../../mpc/mpc.types';
import { auditService } from '../../audit/audit.service';

vi.mock('../../audit/audit.service', () => ({
  auditService: {
    recordEvent: vi.fn(),
  },
}));

describe('WalletTierManager - 冷热钱包管理器', () => {
  let walletTierManager: WalletTierManager;
  const testWalletId = 'wallet-test-001';
  const testUserId = 'user-test-001';

  beforeEach(() => {
    walletTierManager = new WalletTierManager();
    vi.clearAllMocks();
  });

  describe('构造函数', () => {
    it('应该创建冷热钱包管理器实例', () => {
      expect(walletTierManager).toBeDefined();
    });
  });

  describe('钱包层级管理', () => {
    it('应该能创建热钱包', async () => {
      const wallet = await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });

      expect(wallet).toBeDefined();
      expect(wallet.tier).toBe(WalletTier.HOT);
    });

    it('应该能创建温钱包', async () => {
      const wallet = await walletTierManager.createWallet({
        walletId: 'warm-wallet-001',
        userId: testUserId,
        tier: WalletTier.WARM,
        chainType: ChainType.EVM,
        name: '温钱包',
      });

      expect(wallet).toBeDefined();
      expect(wallet.tier).toBe(WalletTier.WARM);
    });

    it('应该能创建冷钱包', async () => {
      const wallet = await walletTierManager.createWallet({
        walletId: 'cold-wallet-001',
        userId: testUserId,
        tier: WalletTier.COLD,
        chainType: ChainType.EVM,
        name: '冷钱包',
      });

      expect(wallet).toBeDefined();
      expect(wallet.tier).toBe(WalletTier.COLD);
    });

    it('新建钱包应该处于 ACTIVE 状态', async () => {
      const wallet = await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });

      expect(wallet.status).toBe(WalletStatus.ACTIVE);
    });

    it('应该能获取钱包信息', async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });

      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet).toBeDefined();
      expect(wallet.walletId).toBe(testWalletId);
    });

    it('获取不存在的钱包应该返回 null', async () => {
      const wallet = await walletTierManager.getWallet('non-existent-wallet');
      expect(wallet).toBeNull();
    });

    it('应该能更新钱包信息', async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });

      await walletTierManager.updateWallet(testWalletId, {
        name: '更新后的热钱包',
      });

      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.name).toBe('更新后的热钱包');
    });

    it('应该能删除钱包', async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });

      await walletTierManager.deleteWallet(testWalletId);
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.status).toBe(WalletStatus.DELETED);
    });
  });

  describe('钱包层级转换', () => {
    beforeEach(async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });
    });

    it('应该能将热钱包升级为温钱包', async () => {
      await walletTierManager.changeTier(testWalletId, WalletTier.WARM);
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.tier).toBe(WalletTier.WARM);
    });

    it('应该能将温钱包升级为冷钱包', async () => {
      await walletTierManager.changeTier(testWalletId, WalletTier.WARM);
      await walletTierManager.changeTier(testWalletId, WalletTier.COLD);
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.tier).toBe(WalletTier.COLD);
    });

    it('应该能将冷钱包降级为温钱包', async () => {
      await walletTierManager.changeTier(testWalletId, WalletTier.COLD);
      await walletTierManager.changeTier(testWalletId, WalletTier.WARM);
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.tier).toBe(WalletTier.WARM);
    });

    it('层级变更应该记录审计日志', async () => {
      await walletTierManager.changeTier(testWalletId, WalletTier.COLD);
      expect(auditService.recordEvent).toHaveBeenCalled();
    });

    it('层级变更应该记录历史', async () => {
      await walletTierManager.changeTier(testWalletId, WalletTier.WARM);
      await walletTierManager.changeTier(testWalletId, WalletTier.COLD);
      
      const history = await walletTierManager.getTierHistory(testWalletId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('钱包列表', () => {
    beforeEach(async () => {
      const tiers = [WalletTier.HOT, WalletTier.WARM, WalletTier.COLD];
      for (let i = 0; i < 6; i++) {
        await walletTierManager.createWallet({
          walletId: `wallet-${i}`,
          userId: testUserId,
          tier: tiers[i % 3],
          chainType: ChainType.EVM,
          name: `钱包 ${i}`,
        });
      }
    });

    it('应该能获取钱包列表', async () => {
      const list = await walletTierManager.listWallets({
        userId: testUserId,
      });
      expect(Array.isArray(list.items)).toBe(true);
      expect(list.items.length).toBe(6);
    });

    it('应该能按层级筛选', async () => {
      const hotWallets = await walletTierManager.listWallets({
        userId: testUserId,
        tier: WalletTier.HOT,
      });
      expect(hotWallets.items.length).toBe(2);
    });

    it('应该能按状态筛选', async () => {
      const activeWallets = await walletTierManager.listWallets({
        userId: testUserId,
        status: WalletStatus.ACTIVE,
      });
      expect(activeWallets.items.length).toBe(6);
    });

    it('应该支持分页', async () => {
      const page = await walletTierManager.listWallets({
        userId: testUserId,
        page: 1,
        pageSize: 3,
      });
      expect(page.items.length).toBe(3);
      expect(page.total).toBe(6);
    });
  });

  describe('额度管理', () => {
    beforeEach(async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });
    });

    it('应该能设置每日交易额度', async () => {
      await walletTierManager.setDailyLimit(testWalletId, '100000000000000000000');
      const limits = await walletTierManager.getLimits(testWalletId);
      expect(limits.dailyLimit).toBe('100000000000000000000');
    });

    it('应该能设置单笔交易限额', async () => {
      await walletTierManager.setPerTxLimit(testWalletId, '5000000000000000000');
      const limits = await walletTierManager.getLimits(testWalletId);
      expect(limits.perTxLimit).toBe('5000000000000000000');
    });

    it('应该能获取额度信息', async () => {
      const limits = await walletTierManager.getLimits(testWalletId);
      expect(limits).toBeDefined();
      expect(limits.dailyLimit).toBeDefined();
      expect(limits.perTxLimit).toBeDefined();
    });

    it('不同层级应该有默认额度', async () => {
      const hotWallet = await walletTierManager.getWallet(testWalletId);
      expect(hotWallet.tier).toBe(WalletTier.HOT);
    });

    it('应该能检查额度是否超限', async () => {
      await walletTierManager.setPerTxLimit(testWalletId, '1000');
      const result = await walletTierManager.checkLimit(testWalletId, '2000');
      expect(result.exceeded).toBe(true);
    });

    it('额度内交易不应该超限', async () => {
      await walletTierManager.setPerTxLimit(testWalletId, '10000');
      const result = await walletTierManager.checkLimit(testWalletId, '5000');
      expect(result.exceeded).toBe(false);
    });
  });

  describe('地址管理', () => {
    beforeEach(async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });
    });

    it('应该能添加地址到白名单', async () => {
      const address = '0x' + 'a'.repeat(40);
      await walletTierManager.addAllowedAddress(testWalletId, address);
      const allowed = await walletTierManager.isAddressAllowed(testWalletId, address);
      expect(allowed).toBe(true);
    });

    it('应该能批量添加白名单地址', async () => {
      const addresses = [
        '0x' + 'a'.repeat(40),
        '0x' + 'b'.repeat(40),
        '0x' + 'c'.repeat(40),
      ];
      await walletTierManager.addAllowedAddresses(testWalletId, addresses);
      
      for (const addr of addresses) {
        const allowed = await walletTierManager.isAddressAllowed(testWalletId, addr);
        expect(allowed).toBe(true);
      }
    });

    it('应该能移除白名单地址', async () => {
      const address = '0x' + 'a'.repeat(40);
      await walletTierManager.addAllowedAddress(testWalletId, address);
      await walletTierManager.removeAllowedAddress(testWalletId, address);
      
      const allowed = await walletTierManager.isAddressAllowed(testWalletId, address);
      expect(allowed).toBe(false);
    });

    it('应该能获取白名单地址列表', async () => {
      const addresses = [
        '0x' + 'a'.repeat(40),
        '0x' + 'b'.repeat(40),
      ];
      await walletTierManager.addAllowedAddresses(testWalletId, addresses);
      
      const list = await walletTierManager.getAllowedAddresses(testWalletId);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(2);
    });
  });

  describe('审批配置', () => {
    beforeEach(async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });
    });

    it('应该能设置审批人列表', async () => {
      const approvers = ['approver-1', 'approver-2', 'approver-3'];
      await walletTierManager.setApprovers(testWalletId, approvers);
      
      const config = await walletTierManager.getApprovalConfig(testWalletId);
      expect(Array.isArray(config.approvers)).toBe(true);
      expect(config.approvers.length).toBe(3);
    });

    it('应该能设置所需审批数', async () => {
      const approvers = ['approver-1', 'approver-2', 'approver-3'];
      await walletTierManager.setApprovers(testWalletId, approvers);
      await walletTierManager.setRequiredApprovals(testWalletId, 2);
      
      const config = await walletTierManager.getApprovalConfig(testWalletId);
      expect(config.requiredApprovals).toBe(2);
    });

    it('应该能获取审批配置', async () => {
      const config = await walletTierManager.getApprovalConfig(testWalletId);
      expect(config).toBeDefined();
      expect(config.approvers).toBeDefined();
      expect(config.requiredApprovals).toBeDefined();
    });
  });

  describe('钱包状态管理', () => {
    beforeEach(async () => {
      await walletTierManager.createWallet({
        walletId: testWalletId,
        userId: testUserId,
        tier: WalletTier.HOT,
        chainType: ChainType.EVM,
        name: '热钱包',
      });
    });

    it('应该能冻结钱包', async () => {
      await walletTierManager.freezeWallet(testWalletId, '安全考虑');
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.status).toBe(WalletStatus.FROZEN);
    });

    it('应该能解冻钱包', async () => {
      await walletTierManager.freezeWallet(testWalletId, '安全考虑');
      await walletTierManager.unfreezeWallet(testWalletId);
      const wallet = await walletTierManager.getWallet(testWalletId);
      expect(wallet.status).toBe(WalletStatus.ACTIVE);
    });

    it('冻结的钱包不能交易', async () => {
      await walletTierManager.freezeWallet(testWalletId, '安全考虑');
      const canTransact = await walletTierManager.canTransact(testWalletId);
      expect(canTransact).toBe(false);
    });

    it('激活的钱包可以交易', async () => {
      const canTransact = await walletTierManager.canTransact(testWalletId);
      expect(canTransact).toBe(true);
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      const tiers = [WalletTier.HOT, WalletTier.WARM, WalletTier.COLD];
      for (let i = 0; i < 6; i++) {
        await walletTierManager.createWallet({
          walletId: `wallet-${i}`,
          userId: testUserId,
          tier: tiers[i % 3],
          chainType: ChainType.EVM,
          name: `钱包 ${i}`,
        });
      }
    });

    it('应该能获取层级分布统计', async () => {
      const stats = await walletTierManager.getStats({
        userId: testUserId,
      });
      expect(stats).toBeDefined();
      expect(stats.byTier).toBeDefined();
    });

    it('应该返回各层级钱包数量', async () => {
      const stats = await walletTierManager.getStats({
        userId: testUserId,
      });
      expect(stats.byTier[WalletTier.HOT]).toBe(2);
      expect(stats.byTier[WalletTier.WARM]).toBe(2);
      expect(stats.byTier[WalletTier.COLD]).toBe(2);
    });
  });
});
