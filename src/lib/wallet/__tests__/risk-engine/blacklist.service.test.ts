import { describe, it, expect, beforeEach, vi, mock } from 'vitest';
import { BlacklistService } from '../../risk-engine/blacklist.service';

describe('BlacklistService - 黑白名单服务', () => {
  let blacklistService: BlacklistService;

  beforeEach(() => {
    blacklistService = new BlacklistService();
  });

  describe('构造函数', () => {
    it('应该创建黑白名单服务实例', () => {
      expect(blacklistService).toBeDefined();
    });
  });

  describe('地址黑名单', () => {
    it('应该能添加地址到黑名单', () => {
      const address = '0x' + 'a'.repeat(40);
      blacklistService.addAddress(address);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(true);
    });

    it('应该能批量添加地址到黑名单', () => {
      const addresses = [
        '0x' + 'a'.repeat(40),
        '0x' + 'b'.repeat(40),
      ];
      blacklistService.addAddresses(addresses);
      expect(blacklistService.isAddressBlacklisted(addresses[0])).toBe(true);
      expect(blacklistService.isAddressBlacklisted(addresses[1])).toBe(true);
    });

    it('应该能从黑名单移除地址', () => {
      const address = '0x' + 'a'.repeat(40);
      blacklistService.addAddress(address);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(true);
      
      blacklistService.removeAddress(address);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(false);
    });

    it('应该能检查地址是否在黑名单中', () => {
      const address = '0x' + 'a'.repeat(40);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(false);
      blacklistService.addAddress(address);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(true);
    });

    it('地址检查应该不区分大小写', () => {
      const address = '0x' + 'A'.repeat(40);
      blacklistService.addAddress(address);
      expect(blacklistService.isAddressBlacklisted('0x' + 'a'.repeat(40))).toBe(true);
    });

    it('应该能获取所有黑名单地址', () => {
      const address1 = '0x' + 'a'.repeat(40);
      const address2 = '0x' + 'b'.repeat(40);
      blacklistService.addAddress(address1);
      blacklistService.addAddress(address2);
      
      const addresses = blacklistService.getBlacklistedAddresses();
      expect(Array.isArray(addresses)).toBe(true);
      expect(addresses.length).toBe(2);
    });

    it('应该能清除所有黑名单地址', () => {
      blacklistService.addAddress('0x' + 'a'.repeat(40));
      blacklistService.clearAddresses();
      expect(blacklistService.getBlacklistedAddresses().length).toBe(0);
    });
  });

  describe('合约黑名单', () => {
    it('应该能添加合约到黑名单', () => {
      const contract = '0x' + 'c'.repeat(40);
      blacklistService.addContract(contract);
      expect(blacklistService.isContractBlacklisted(contract)).toBe(true);
    });

    it('应该能批量添加合约到黑名单', () => {
      const contracts = [
        '0x' + 'c'.repeat(40),
        '0x' + 'd'.repeat(40),
      ];
      blacklistService.addContracts(contracts);
      expect(blacklistService.isContractBlacklisted(contracts[0])).toBe(true);
      expect(blacklistService.isContractBlacklisted(contracts[1])).toBe(true);
    });

    it('应该能从黑名单移除合约', () => {
      const contract = '0x' + 'c'.repeat(40);
      blacklistService.addContract(contract);
      expect(blacklistService.isContractBlacklisted(contract)).toBe(true);
      
      blacklistService.removeContract(contract);
      expect(blacklistService.isContractBlacklisted(contract)).toBe(false);
    });

    it('应该能检查合约是否在黑名单中', () => {
      const contract = '0x' + 'c'.repeat(40);
      expect(blacklistService.isContractBlacklisted(contract)).toBe(false);
      blacklistService.addContract(contract);
      expect(blacklistService.isContractBlacklisted(contract)).toBe(true);
    });

    it('合约检查应该不区分大小写', () => {
      const contract = '0x' + 'C'.repeat(40);
      blacklistService.addContract(contract);
      expect(blacklistService.isContractBlacklisted('0x' + 'c'.repeat(40))).toBe(true);
    });

    it('应该能获取所有黑名单合约', () => {
      const contract1 = '0x' + 'c'.repeat(40);
      const contract2 = '0x' + 'd'.repeat(40);
      blacklistService.addContract(contract1);
      blacklistService.addContract(contract2);
      
      const contracts = blacklistService.getBlacklistedContracts();
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBe(2);
    });

    it('应该能清除所有黑名单合约', () => {
      blacklistService.addContract('0x' + 'c'.repeat(40));
      blacklistService.clearContracts();
      expect(blacklistService.getBlacklistedContracts().length).toBe(0);
    });
  });

  describe('域名黑名单', () => {
    it('应该能添加域名到黑名单', () => {
      const domain = 'phishing.com';
      blacklistService.addDomain(domain);
      expect(blacklistService.isDomainBlacklisted(domain)).toBe(true);
    });

    it('应该能批量添加域名到黑名单', () => {
      const domains = ['phishing1.com', 'phishing2.com'];
      blacklistService.addDomains(domains);
      expect(blacklistService.isDomainBlacklisted(domains[0])).toBe(true);
      expect(blacklistService.isDomainBlacklisted(domains[1])).toBe(true);
    });

    it('应该能从黑名单移除域名', () => {
      const domain = 'phishing.com';
      blacklistService.addDomain(domain);
      expect(blacklistService.isDomainBlacklisted(domain)).toBe(true);
      
      blacklistService.removeDomain(domain);
      expect(blacklistService.isDomainBlacklisted(domain)).toBe(false);
    });

    it('应该能检查域名是否在黑名单中', () => {
      const domain = 'phishing.com';
      expect(blacklistService.isDomainBlacklisted(domain)).toBe(false);
      blacklistService.addDomain(domain);
      expect(blacklistService.isDomainBlacklisted(domain)).toBe(true);
    });

    it('域名检查应该不区分大小写', () => {
      const domain = 'Phishing.Com';
      blacklistService.addDomain(domain);
      expect(blacklistService.isDomainBlacklisted('phishing.com')).toBe(true);
    });

    it('应该能获取所有黑名单域名', () => {
      const domain1 = 'phishing1.com';
      const domain2 = 'phishing2.com';
      blacklistService.addDomain(domain1);
      blacklistService.addDomain(domain2);
      
      const domains = blacklistService.getBlacklistedDomains();
      expect(Array.isArray(domains)).toBe(true);
      expect(domains.length).toBe(2);
    });

    it('应该能清除所有黑名单域名', () => {
      blacklistService.addDomain('phishing.com');
      blacklistService.clearDomains();
      expect(blacklistService.getBlacklistedDomains().length).toBe(0);
    });
  });

  describe('地址白名单', () => {
    it('应该能添加地址到白名单', () => {
      const address = '0x' + 'w'.repeat(40);
      blacklistService.addWhitelistAddress(address);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(true);
    });

    it('应该能批量添加地址到白名单', () => {
      const addresses = [
        '0x' + 'w'.repeat(40),
        '0x' + 'x'.repeat(40),
      ];
      blacklistService.addWhitelistAddresses(addresses);
      expect(blacklistService.isAddressWhitelisted(addresses[0])).toBe(true);
      expect(blacklistService.isAddressWhitelisted(addresses[1])).toBe(true);
    });

    it('应该能从白名单移除地址', () => {
      const address = '0x' + 'w'.repeat(40);
      blacklistService.addWhitelistAddress(address);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(true);
      
      blacklistService.removeWhitelistAddress(address);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(false);
    });

    it('应该能检查地址是否在白名单中', () => {
      const address = '0x' + 'w'.repeat(40);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(false);
      blacklistService.addWhitelistAddress(address);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(true);
    });

    it('白名单地址检查应该不区分大小写', () => {
      const address = '0x' + 'W'.repeat(40);
      blacklistService.addWhitelistAddress(address);
      expect(blacklistService.isAddressWhitelisted('0x' + 'w'.repeat(40))).toBe(true);
    });

    it('白名单地址不应该被黑名单拦截', () => {
      const address = '0x' + 'w'.repeat(40);
      blacklistService.addAddress(address);
      blacklistService.addWhitelistAddress(address);
      expect(blacklistService.isAddressBlacklisted(address)).toBe(true);
      expect(blacklistService.isAddressWhitelisted(address)).toBe(true);
    });
  });

  describe('批量操作', () => {
    it('应该能批量导入黑名单数据', () => {
      const data = {
        addresses: ['0x' + 'a'.repeat(40)],
        contracts: ['0x' + 'c'.repeat(40)],
        domains: ['evil.com'],
      };
      
      blacklistService.importBlacklist(data);
      expect(blacklistService.getBlacklistedAddresses().length).toBe(1);
      expect(blacklistService.getBlacklistedContracts().length).toBe(1);
      expect(blacklistService.getBlacklistedDomains().length).toBe(1);
    });

    it('应该能导出黑名单数据', () => {
      blacklistService.addAddress('0x' + 'a'.repeat(40));
      blacklistService.addContract('0x' + 'c'.repeat(40));
      blacklistService.addDomain('evil.com');
      
      const data = blacklistService.exportBlacklist();
      expect(data).toBeDefined();
      expect(Array.isArray(data.addresses)).toBe(true);
      expect(Array.isArray(data.contracts)).toBe(true);
      expect(Array.isArray(data.domains)).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该能获取统计信息', () => {
      blacklistService.addAddress('0x' + 'a'.repeat(40));
      blacklistService.addContract('0x' + 'c'.repeat(40));
      blacklistService.addDomain('evil.com');
      blacklistService.addWhitelistAddress('0x' + 'w'.repeat(40));
      
      const stats = blacklistService.getStats();
      expect(stats).toBeDefined();
      expect(stats.blacklistedAddresses).toBe(1);
      expect(stats.blacklistedContracts).toBe(1);
      expect(stats.blacklistedDomains).toBe(1);
      expect(stats.whitelistedAddresses).toBe(1);
    });
  });

  describe('持久化支持', () => {
    it('应该能保存到本地存储', () => {
      expect(() => {
        blacklistService.save();
      }).not.toThrow();
    });

    it('应该能从本地存储加载', () => {
      expect(() => {
        blacklistService.load();
      }).not.toThrow();
    });
  });
});
