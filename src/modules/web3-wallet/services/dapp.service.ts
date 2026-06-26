/**
 * Web3 钱包模块 - DApp 服务
 *
 * 提供 DApp 集成相关功能，包括 DApp 发现、DApp 连接管理、
 * 权限控制、会话管理、交易授权等
 */

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BlockchainNetwork } from '../dto/wallet.dto';

@Injectable()
export class DAppService {
  private dapps: Map<string, DAppItem> = new Map();
  private connections: Map<string, DAppConnection[]> = new Map();
  private sessions: Map<string, DAppSession> = new Map();
  private permissions: Map<string, DAppPermission[]> = new Map();

  constructor() {
    this.initializeDefaultDApps();
  }

  /**
   * 初始化默认 DApp 列表
   */
  private initializeDefaultDApps(): void {
    const defaultDApps: DAppItem[] = [
      {
        id: 'dapp_001',
        name: 'Uniswap',
        description: '领先的去中心化交易所',
        url: 'https://app.uniswap.org',
        icon: 'https://example.com/uniswap.png',
        category: 'exchange',
        chains: [BlockchainNetwork.ETHEREUM, BlockchainNetwork.POLYGON, BlockchainNetwork.ARBITRUM, BlockchainNetwork.BASE],
        verified: true,
        featured: true,
        rating: 4.8,
        totalUsers: 5000000,
        tags: ['DEX', 'DeFi', 'Swap'],
        supportedMethods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'eth_signTypedData'],
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'dapp_002',
        name: 'OpenSea',
        description: '全球最大的 NFT 市场',
        url: 'https://opensea.io',
        icon: 'https://example.com/opensea.png',
        category: 'nft',
        chains: [BlockchainNetwork.ETHEREUM, BlockchainNetwork.POLYGON],
        verified: true,
        featured: true,
        rating: 4.6,
        totalUsers: 10000000,
        tags: ['NFT', 'Marketplace'],
        supportedMethods: ['eth_sendTransaction', 'eth_sign', 'eth_signTypedData'],
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'dapp_003',
        name: 'Aave',
        description: '去中心化借贷协议',
        url: 'https://app.aave.com',
        icon: 'https://example.com/aave.png',
        category: 'defi',
        chains: [BlockchainNetwork.ETHEREUM, BlockchainNetwork.POLYGON, BlockchainNetwork.AVALANCHE],
        verified: true,
        featured: true,
        rating: 4.7,
        totalUsers: 2000000,
        tags: ['DeFi', 'Lending', 'Borrowing'],
        supportedMethods: ['eth_sendTransaction', 'eth_sign', 'eth_signTypedData'],
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'dapp_004',
        name: 'PancakeSwap',
        description: 'BSC 上最大的 DEX',
        url: 'https://pancakeswap.finance',
        icon: 'https://example.com/pancakeswap.png',
        category: 'exchange',
        chains: [BlockchainNetwork.BSC],
        verified: true,
        featured: false,
        rating: 4.5,
        totalUsers: 8000000,
        tags: ['DEX', 'DeFi', 'Yield Farming'],
        supportedMethods: ['eth_sendTransaction', 'eth_sign', 'personal_sign'],
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'dapp_005',
        name: 'Compound',
        description: '算法货币市场协议',
        url: 'https://app.compound.finance',
        icon: 'https://example.com/compound.png',
        category: 'defi',
        chains: [BlockchainNetwork.ETHEREUM],
        verified: true,
        featured: false,
        rating: 4.4,
        totalUsers: 1500000,
        tags: ['DeFi', 'Lending'],
        supportedMethods: ['eth_sendTransaction', 'eth_sign'],
        createdAt: new Date('2023-01-01'),
      },
    ];

    for (const dapp of defaultDApps) {
      this.dapps.set(dapp.id, dapp);
    }
  }

  /**
   * 获取 DApp 列表
   *
   * @param category 分类（可选）
   * @param chain 链（可选）
   * @param search 搜索关键词（可选）
   * @param featured 精选（可选）
   * @param verified 已验证（可选）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns DApp 列表和总数
   */
  async getDAppList(
    category?: string,
    chain?: BlockchainNetwork,
    search?: string,
    featured?: boolean,
    verified?: boolean,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: DAppItem[]; total: number }> {
    let dapps = Array.from(this.dapps.values());

    if (category) {
      dapps = dapps.filter((d) => d.category === category);
    }

    if (chain) {
      dapps = dapps.filter((d) => d.chains.includes(chain));
    }

    if (search) {
      const kw = search.toLowerCase();
      dapps = dapps.filter(
        (d) =>
          d.name.toLowerCase().includes(kw) ||
          d.description.toLowerCase().includes(kw) ||
          d.tags.some((t) => t.toLowerCase().includes(kw)),
      );
    }

    if (featured !== undefined) {
      dapps = dapps.filter((d) => d.featured === featured);
    }

    if (verified !== undefined) {
      dapps = dapps.filter((d) => d.verified === verified);
    }

    dapps.sort((a, b) => b.totalUsers - a.totalUsers);

    const total = dapps.length;
    const start = (page - 1) * pageSize;
    const list = dapps.slice(start, start + pageSize);

    return { list, total };
  }

  /**
   * 获取 DApp 详情
   *
   * @param dappId DApp ID
   * @returns DApp 详情
   */
  async getDAppById(dappId: string): Promise<DAppItem> {
    const dapp = this.dapps.get(dappId);
    if (!dapp) {
      throw new NotFoundException('DApp 不存在');
    }
    return dapp;
  }

  /**
   * 获取精选 DApp
   *
   * @param limit 数量限制
   * @returns 精选 DApp 列表
   */
  async getFeaturedDApps(limit: number = 10): Promise<DAppItem[]> {
    const dapps = Array.from(this.dapps.values())
      .filter((d) => d.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return dapps;
  }

  /**
   * 获取 DApp 分类列表
   *
   * @returns 分类列表
   */
  async getCategories(): Promise<Array<{ id: string; name: string; count: number; icon?: string }>> {
    const categoryMap = new Map<string, { name: string; count: number }>();

    for (const dapp of this.dapps.values()) {
      const current = categoryMap.get(dapp.category) || { name: dapp.category, count: 0 };
      current.count++;
      categoryMap.set(dapp.category, current);
    }

    return Array.from(categoryMap.entries()).map(([id, data]) => ({
      id,
      name: this.getCategoryName(id),
      count: data.count,
    }));
  }

  /**
   * 连接 DApp
   *
   * @param userId 用户ID
   * @param walletId 钱包ID
   * @param dappId DApp ID
   * @param chain 链
   * @param permissions 权限列表
   * @returns 连接信息
   */
  async connectDApp(
    userId: string,
    walletId: string,
    dappId: string,
    chain: BlockchainNetwork,
    permissions: string[],
  ): Promise<DAppConnection> {
    const dapp = await this.getDAppById(dappId);

    const userConnections = this.connections.get(userId) || [];

    const existing = userConnections.find(
      (c) => c.dappId === dappId && c.walletId === walletId && c.chain === chain && c.isActive,
    );

    if (existing) {
      return existing;
    }

    const connectionId = 'conn_' + this.generateRandomId();

    const connection: DAppConnection = {
      id: connectionId,
      userId,
      walletId,
      dappId,
      dappName: dapp.name,
      dappUrl: dapp.url,
      chain,
      permissions,
      isActive: true,
      connectedAt: new Date(),
      lastActiveAt: new Date(),
    };

    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    await this.createSession(userId, connectionId, chain, permissions);

    return connection;
  }

  /**
   * 断开 DApp 连接
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   */
  async disconnectDApp(userId: string, connectionId: string): Promise<void> {
    const userConnections = this.connections.get(userId) || [];
    const index = userConnections.findIndex((c) => c.id === connectionId);

    if (index === -1) {
      throw new NotFoundException('连接不存在');
    }

    userConnections[index].isActive = false;
    userConnections[index].disconnectedAt = new Date();

    this.connections.set(userId, userConnections);

    const userSessions = this.sessions.get(userId) || [];
    for (const session of userSessions) {
      if (session.connectionId === connectionId && session.isActive) {
        session.isActive = false;
        session.endedAt = new Date();
      }
    }
    this.sessions.set(userId, userSessions);
  }

  /**
   * 获取用户的 DApp 连接列表
   *
   * @param userId 用户ID
   * @param isActive 是否活跃（可选）
   * @returns 连接列表
   */
  async getConnections(userId: string, isActive?: boolean): Promise<DAppConnection[]> {
    let connections = this.connections.get(userId) || [];

    if (isActive !== undefined) {
      connections = connections.filter((c) => c.isActive === isActive);
    }

    return connections.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
  }

  /**
   * 获取连接详情
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   * @returns 连接详情
   */
  async getConnectionById(userId: string, connectionId: string): Promise<DAppConnection> {
    const userConnections = this.connections.get(userId) || [];
    const connection = userConnections.find((c) => c.id === connectionId);

    if (!connection) {
      throw new NotFoundException('连接不存在');
    }

    return connection;
  }

  /**
   * 创建会话
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   * @param chain 链
   * @param methods 支持的方法
   * @returns 会话信息
   */
  async createSession(
    userId: string,
    connectionId: string,
    chain: BlockchainNetwork,
    methods: string[],
  ): Promise<DAppSession> {
    const sessionId = 'sess_' + this.generateRandomId();

    const session: DAppSession = {
      id: sessionId,
      userId,
      connectionId,
      chain,
      methods,
      isActive: true,
      startedAt: new Date(),
      lastActivity: new Date(),
    };

    const userSessions = this.sessions.get(userId) || [];
    userSessions.push(session);
    this.sessions.set(userId, userSessions);

    return session;
  }

  /**
   * 获取会话列表
   *
   * @param userId 用户ID
   * @param isActive 是否活跃（可选）
   * @returns 会话列表
   */
  async getSessions(userId: string, isActive?: boolean): Promise<DAppSession[]> {
    let sessions = this.sessions.get(userId) || [];

    if (isActive !== undefined) {
      sessions = sessions.filter((s) => s.isActive === isActive);
    }

    return sessions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  /**
   * 验证权限
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   * @param method 方法名
   * @returns 是否有权限
   */
  async verifyPermission(userId: string, connectionId: string, method: string): Promise<boolean> {
    const connection = await this.getConnectionById(userId, connectionId);

    if (!connection.isActive) {
      return false;
    }

    return connection.permissions.includes(method) || connection.permissions.includes('*');
  }

  /**
   * 更新权限
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   * @param permissions 新的权限列表
   * @returns 更新后的连接
   */
  async updatePermissions(
    userId: string,
    connectionId: string,
    permissions: string[],
  ): Promise<DAppConnection> {
    const userConnections = this.connections.get(userId) || [];
    const index = userConnections.findIndex((c) => c.id === connectionId);

    if (index === -1) {
      throw new NotFoundException('连接不存在');
    }

    userConnections[index].permissions = permissions;
    userConnections[index].lastActiveAt = new Date();

    this.connections.set(userId, userConnections);

    return userConnections[index];
  }

  /**
   * 请求交易授权
   *
   * @param userId 用户ID
   * @param connectionId 连接ID
   * @param transaction 交易数据
   * @returns 授权请求信息
   */
  async requestTransactionApproval(
    userId: string,
    connectionId: string,
    transaction: Record<string, any>,
  ): Promise<{ approvalId: string; status: string; message: string }> {
    const hasPermission = await this.verifyPermission(userId, connectionId, 'eth_sendTransaction');
    if (!hasPermission) {
      throw new ForbiddenException('没有交易发送权限');
    }

    const approvalId = 'appr_' + this.generateRandomId();

    return {
      approvalId,
      status: 'pending',
      message: '等待用户确认',
    };
  }

  /**
   * 搜索 DApp
   *
   * @param query 搜索关键词
   * @param chain 链（可选）
   * @returns 搜索结果
   */
  async searchDApps(query: string, chain?: BlockchainNetwork): Promise<DAppItem[]> {
    const { list } = await this.getDAppList(undefined, chain, query, undefined, undefined, 1, 50);
    return list;
  }

  /**
   * 获取 DApp 统计信息
   *
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getStats(userId?: string): Promise<Record<string, any>> {
    const stats: Record<string, any> = {
      totalDApps: this.dapps.size,
      totalCategories: (await this.getCategories()).length,
      verifiedDApps: Array.from(this.dapps.values()).filter((d) => d.verified).length,
      featuredDApps: Array.from(this.dapps.values()).filter((d) => d.featured).length,
    };

    if (userId) {
      const userConnections = this.connections.get(userId) || [];
      stats.activeConnections = userConnections.filter((c) => c.isActive).length;
      stats.totalConnections = userConnections.length;
      stats.activeSessions = (this.sessions.get(userId) || []).filter((s) => s.isActive).length;
    }

    return stats;
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 获取分类名称
   */
  private getCategoryName(category: string): string {
    const names: Record<string, string> = {
      defi: 'DeFi',
      exchange: '交易所',
      nft: 'NFT',
      game: '游戏',
      social: '社交',
      tools: '工具',
      wallet: '钱包',
      marketplace: '市场',
    };
    return names[category] || category;
  }

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * DApp 项
 */
interface DAppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  chains: BlockchainNetwork[];
  verified: boolean;
  featured: boolean;
  rating: number;
  totalUsers: number;
  tags: string[];
  supportedMethods: string[];
  createdAt: Date;
}

/**
 * DApp 连接
 */
interface DAppConnection {
  id: string;
  userId: string;
  walletId: string;
  dappId: string;
  dappName: string;
  dappUrl: string;
  chain: BlockchainNetwork;
  permissions: string[];
  isActive: boolean;
  connectedAt: Date;
  disconnectedAt?: Date;
  lastActiveAt: Date;
}

/**
 * DApp 会话
 */
interface DAppSession {
  id: string;
  userId: string;
  connectionId: string;
  chain: BlockchainNetwork;
  methods: string[];
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  lastActivity: Date;
}

/**
 * DApp 权限
 */
interface DAppPermission {
  method: string;
  description: string;
  required: boolean;
  category: string;
}
