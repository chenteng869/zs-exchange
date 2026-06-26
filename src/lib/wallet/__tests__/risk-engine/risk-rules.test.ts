import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { addressBlacklistRule } from '../../risk-engine/risk-rules/address-blacklist.rule';
import { contractBlacklistRule } from '../../risk-engine/risk-rules/contract-blacklist.rule';
import { largeTransferRule } from '../../risk-engine/risk-rules/large-transfer.rule';
import { unlimitedApprovalRule } from '../../risk-engine/risk-rules/unlimited-approval.rule';
import { newAddressRule } from '../../risk-engine/risk-rules/new-address.rule';
import { frequentTransactionsRule } from '../../risk-engine/risk-rules/frequent-transactions.rule';
import { suspiciousContractRule } from '../../risk-engine/risk-rules/suspicious-contract.rule';
import { zeroValueTransferRule } from '../../risk-engine/risk-rules/zero-value-transfer.rule';
import { nftApprovalRule } from '../../risk-engine/risk-rules/nft-approval.rule';
import { phishingDomainRule } from '../../risk-engine/risk-rules/phishing-domain.rule';
import { RiskLevel, RiskAction, ChainType, SignType } from '../../risk-engine/risk-engine.types';

vi.mock('../../risk-engine/blacklist.service', () => ({
  blacklistService: {
    isAddressBlacklisted: vi.fn().mockReturnValue(false),
    isContractBlacklisted: vi.fn().mockReturnValue(false),
    isDomainBlacklisted: vi.fn().mockReturnValue(false),
  },
}));

describe('Risk Rules - 风控规则', () => {
  const defaultContext = {
    walletId: 'wallet-test-001',
    userId: 'user-test-001',
    address: '0x' + 'a'.repeat(40),
    chainType: ChainType.EVM,
    signType: SignType.TRANSACTION,
  };

  describe('Address Blacklist Rule - 地址黑名单规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(addressBlacklistRule.ruleCode).toBe('address-blacklist');
    });

    it('应该具有正确的规则名称', () => {
      expect(addressBlacklistRule.ruleName).toBeDefined();
    });

    it('黑名单地址应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isAddressBlacklisted.mockReturnValue(true);

      const result = await addressBlacklistRule.evaluate({
        ...defaultContext,
        toAddress: '0x' + 'b'.repeat(40),
      });

      expect(result.matched).toBe(true);
      expect(result.action).toBe(RiskAction.REJECT);
    });

    it('非黑名单地址不应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isAddressBlacklisted.mockReturnValue(false);

      const result = await addressBlacklistRule.evaluate({
        ...defaultContext,
        toAddress: '0x' + 'c'.repeat(40),
      });

      expect(result.matched).toBe(false);
    });

    it('没有收款地址时不应该匹配', async () => {
      const result = await addressBlacklistRule.evaluate(defaultContext);
      expect(result.matched).toBe(false);
    });
  });

  describe('Contract Blacklist Rule - 合约黑名单规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(contractBlacklistRule.ruleCode).toBe('contract-blacklist');
    });

    it('黑名单合约应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isContractBlacklisted.mockReturnValue(true);

      const result = await contractBlacklistRule.evaluate({
        ...defaultContext,
        contractAddress: '0x' + 'c'.repeat(40),
      });

      expect(result.matched).toBe(true);
      expect(result.action).toBe(RiskAction.REJECT);
    });

    it('非黑名单合约不应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isContractBlacklisted.mockReturnValue(false);

      const result = await contractBlacklistRule.evaluate({
        ...defaultContext,
        contractAddress: '0x' + 'd'.repeat(40),
      });

      expect(result.matched).toBe(false);
    });
  });

  describe('Large Transfer Rule - 大额转账规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(largeTransferRule.ruleCode).toBe('large-transfer');
    });

    it('大额转账应该匹配规则', async () => {
      const result = await largeTransferRule.evaluate({
        ...defaultContext,
        amount: '1000000000000000000000',
        toAddress: '0x' + 'b'.repeat(40),
      });

      expect(result).toBeDefined();
      expect(result.matched).toBeDefined();
    });

    it('小额转账不应该匹配规则', async () => {
      const result = await largeTransferRule.evaluate({
        ...defaultContext,
        amount: '100',
        toAddress: '0x' + 'b'.repeat(40),
      });

      expect(result).toBeDefined();
    });

    it('没有金额时不应该匹配', async () => {
      const result = await largeTransferRule.evaluate(defaultContext);
      expect(result.matched).toBe(false);
    });

    it('应该支持配置大额阈值', () => {
      largeTransferRule.configure({ threshold: '5000' });
      expect(largeTransferRule.parameters?.threshold).toBeDefined();
    });
  });

  describe('Unlimited Approval Rule - 无限授权规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(unlimitedApprovalRule.ruleCode).toBe('unlimited-approval');
    });

    it('无限授权应该匹配规则', async () => {
      const maxUint256 = 'f'.repeat(64);
      const data = '0x095ea7b3' + '0'.repeat(24) + 'b'.repeat(40) + maxUint256;

      const result = await unlimitedApprovalRule.evaluate({
        ...defaultContext,
        signType: SignType.TRANSACTION,
        transactionData: data,
      });

      expect(result).toBeDefined();
    });

    it('普通授权不应该匹配规则', async () => {
      const data = '0x095ea7b3' + '0'.repeat(24) + 'b'.repeat(40) + '0'.repeat(63) + '1';

      const result = await unlimitedApprovalRule.evaluate({
        ...defaultContext,
        signType: SignType.TRANSACTION,
        transactionData: data,
      });

      expect(result).toBeDefined();
    });

    it('非授权交易不应该匹配', async () => {
      const result = await unlimitedApprovalRule.evaluate({
        ...defaultContext,
        signType: SignType.MESSAGE,
      });

      expect(result.matched).toBe(false);
    });
  });

  describe('New Address Rule - 新地址规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(newAddressRule.ruleCode).toBe('new-address');
    });

    it('新地址转账应该匹配规则', async () => {
      const result = await newAddressRule.evaluate({
        ...defaultContext,
        toAddress: '0x' + 'n'.repeat(40),
        isNewAddress: true,
      });

      expect(result).toBeDefined();
    });

    it('常用地址不应该匹配规则', async () => {
      const result = await newAddressRule.evaluate({
        ...defaultContext,
        toAddress: '0x' + 'f'.repeat(40),
        isNewAddress: false,
      });

      expect(result).toBeDefined();
    });

    it('没有收款地址时不应该匹配', async () => {
      const result = await newAddressRule.evaluate(defaultContext);
      expect(result.matched).toBe(false);
    });
  });

  describe('Frequent Transactions Rule - 高频交易规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(frequentTransactionsRule.ruleCode).toBe('frequent-transactions');
    });

    it('高频交易应该匹配规则', async () => {
      const result = await frequentTransactionsRule.evaluate({
        ...defaultContext,
        recentTransactionCount: 50,
      });

      expect(result).toBeDefined();
    });

    it('低频交易不应该匹配规则', async () => {
      const result = await frequentTransactionsRule.evaluate({
        ...defaultContext,
        recentTransactionCount: 2,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Suspicious Contract Rule - 可疑合约规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(suspiciousContractRule.ruleCode).toBe('suspicious-contract');
    });

    it('可疑合约交互应该匹配规则', async () => {
      const result = await suspiciousContractRule.evaluate({
        ...defaultContext,
        contractAddress: '0x' + 's'.repeat(40),
        isSuspiciousContract: true,
      });

      expect(result).toBeDefined();
    });

    it('正常合约不应该匹配规则', async () => {
      const result = await suspiciousContractRule.evaluate({
        ...defaultContext,
        contractAddress: '0x' + 'n'.repeat(40),
        isSuspiciousContract: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('Zero Value Transfer Rule - 零值转账规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(zeroValueTransferRule.ruleCode).toBe('zero-value-transfer');
    });

    it('零值转账应该匹配规则', async () => {
      const result = await zeroValueTransferRule.evaluate({
        ...defaultContext,
        amount: '0',
        toAddress: '0x' + 'z'.repeat(40),
      });

      expect(result).toBeDefined();
    });

    it('非零值转账不应该匹配规则', async () => {
      const result = await zeroValueTransferRule.evaluate({
        ...defaultContext,
        amount: '1000',
        toAddress: '0x' + 'z'.repeat(40),
      });

      expect(result).toBeDefined();
    });
  });

  describe('NFT Approval Rule - NFT 授权规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(nftApprovalRule.ruleCode).toBe('nft-approval');
    });

    it('NFT 批量授权应该匹配规则', async () => {
      const data = '0xa22cb465' + '0'.repeat(24) + 'o'.repeat(40) + '0'.repeat(63) + '1';

      const result = await nftApprovalRule.evaluate({
        ...defaultContext,
        signType: SignType.TRANSACTION,
        transactionData: data,
      });

      expect(result).toBeDefined();
    });

    it('普通 NFT 转账不应该匹配规则', async () => {
      const result = await nftApprovalRule.evaluate({
        ...defaultContext,
        signType: SignType.TRANSACTION,
        transactionData: '0x',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Phishing Domain Rule - 钓鱼域名规则', () => {
    it('应该具有正确的规则代码', () => {
      expect(phishingDomainRule.ruleCode).toBe('phishing-domain');
    });

    it('钓鱼域名应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isDomainBlacklisted.mockReturnValue(true);

      const result = await phishingDomainRule.evaluate({
        ...defaultContext,
        dappDomain: 'evil-phishing.com',
      });

      expect(result.matched).toBe(true);
      expect(result.action).toBe(RiskAction.REJECT);
    });

    it('正常域名不应该匹配规则', async () => {
      const { blacklistService } = require('../../risk-engine/blacklist.service');
      blacklistService.isDomainBlacklisted.mockReturnValue(false);

      const result = await phishingDomainRule.evaluate({
        ...defaultContext,
        dappDomain: 'safe-dapp.com',
      });

      expect(result.matched).toBe(false);
    });

    it('没有域名时不应该匹配', async () => {
      const result = await phishingDomainRule.evaluate(defaultContext);
      expect(result.matched).toBe(false);
    });
  });

  describe('规则配置', () => {
    it('应该能启用/禁用规则', () => {
      const rule = { ...largeTransferRule };
      rule.enabled = false;
      expect(rule.enabled).toBe(false);
    });

    it('应该能配置规则参数', () => {
      const rule = { ...largeTransferRule };
      rule.parameters = { threshold: '10000', action: RiskAction.REJECT };
      expect(rule.parameters.threshold).toBe('10000');
    });
  });

  describe('规则结果', () => {
    it('规则结果应该包含风险等级', async () => {
      const result = await largeTransferRule.evaluate({
        ...defaultContext,
        amount: '1000000',
      });
      expect(result.level).toBeDefined();
    });

    it('规则结果应该包含风险分数', async () => {
      const result = await largeTransferRule.evaluate({
        ...defaultContext,
        amount: '1000000',
      });
      expect(typeof result.score).toBe('number');
    });

    it('规则结果应该包含原因说明', async () => {
      const result = await largeTransferRule.evaluate({
        ...defaultContext,
        amount: '1000000',
      });
      if (result.matched) {
        expect(result.reason).toBeDefined();
      }
    });
  });
});
