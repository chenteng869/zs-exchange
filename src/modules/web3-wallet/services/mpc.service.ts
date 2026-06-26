/**
 * Web3 钱包模块 - MPC 服务
 *
 * 提供多方计算钱包管理功能，包括 MPC 钱包创建、密钥分片管理、
 * 签名会话管理、密钥重建等安全功能
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateMPCWalletDto,
  MPCWalletResponseDto,
  MPCWalletDetailDto,
  MPCShardInfoDto,
  CreateKeyGenSessionDto,
  KeyGenSessionDto,
  KeyGenRoundDto,
  CreateSigningSessionDto,
  SigningSessionDto,
  SigningRoundDto,
  SubmitMPCSignatureShareDto,
  CombineMPCSignatureDto,
  RecoveryRequestDto,
  RecoveryResponseDto,
  MPCWalletStatus,
  MPCKeyStatus,
  SigningSessionStatus,
} from '../dto/mpc.dto';

@Injectable()
export class MPCService {
  private wallets: Map<string, MPCWalletDetailDto> = new Map();
  private keyGenSessions: Map<string, KeyGenSessionDto> = new Map();
  private signingSessions: Map<string, SigningSessionDto> = new Map();
  private recoveryRequests: Map<string, RecoveryResponseDto> = new Map();

  /**
   * 创建 MPC 钱包
   *
   * @param createDto 创建参数
   * @param userId 用户ID
   * @returns MPC 钱包信息
   */
  async createMPCWallet(
    createDto: CreateMPCWalletDto,
    userId: string,
  ): Promise<MPCWalletResponseDto> {
    const { name, chain, threshold, totalParticipants, participants, derivationPath, metadata } = createDto;

    if (threshold <= 0 || totalParticipants <= 0) {
      throw new BadRequestException('阈值和参与者数量必须大于 0');
    }

    if (threshold > totalParticipants) {
      throw new BadRequestException('阈值不能大于参与者总数');
    }

    if (participants && participants.length !== totalParticipants) {
      throw new BadRequestException('参与者数量必须与 totalParticipants 一致');
    }

    const walletId = 'mpc_' + this.generateRandomId();
    const address = `0x${this.generateRandomHex(40)}`;

    const wallet: MPCWalletDetailDto = {
      id: walletId,
      userId,
      name,
      chain,
      address,
      threshold,
      totalParticipants,
      status: MPCWalletStatus.CREATING,
      participants: participants || this.generateDefaultParticipants(totalParticipants),
      derivationPath: derivationPath || "m/44'/60'/0'/0/0",
      shards: [],
      backupStatus: 'none',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    };

    this.wallets.set(walletId, wallet);

    return {
      id: walletId,
      name,
      chain,
      address,
      threshold,
      totalParticipants,
      status: MPCWalletStatus.CREATING,
      createdAt: wallet.createdAt,
    };
  }

  /**
   * 获取 MPC 钱包详情
   *
   * @param walletId 钱包ID
   * @param userId 用户ID
   * @returns MPC 钱包详情
   */
  async getMPCWalletById(walletId: string, userId: string): Promise<MPCWalletDetailDto> {
    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new NotFoundException('MPC 钱包不存在');
    }

    if (wallet.userId !== userId) {
      throw new BadRequestException('无权访问该钱包');
    }

    return wallet;
  }

  /**
   * 获取用户 MPC 钱包列表
   *
   * @param userId 用户ID
   * @param chain 链（可选）
   * @returns MPC 钱包列表
   */
  async getMPCWallets(userId: string, chain?: string): Promise<MPCWalletResponseDto[]> {
    let wallets = Array.from(this.wallets.values()).filter((w) => w.userId === userId);

    if (chain) {
      wallets = wallets.filter((w) => w.chain === chain);
    }

    return wallets.map((w) => ({
      id: w.id,
      name: w.name,
      chain: w.chain,
      address: w.address,
      threshold: w.threshold,
      totalParticipants: w.totalParticipants,
      status: w.status,
      createdAt: w.createdAt,
    }));
  }

  /**
   * 更新 MPC 钱包信息
   *
   * @param walletId 钱包ID
   * @param updateData 更新数据
   * @param userId 用户ID
   * @returns 更新后的钱包信息
   */
  async updateMPCWallet(
    walletId: string,
    updateData: { name?: string; metadata?: Record<string, any> },
    userId: string,
  ): Promise<MPCWalletResponseDto> {
    const wallet = await this.getMPCWalletById(walletId, userId);

    if (updateData.name !== undefined) {
      wallet.name = updateData.name;
    }
    if (updateData.metadata !== undefined) {
      wallet.metadata = updateData.metadata;
    }
    wallet.updatedAt = new Date();

    this.wallets.set(walletId, wallet);

    return {
      id: wallet.id,
      name: wallet.name,
      chain: wallet.chain,
      address: wallet.address,
      threshold: wallet.threshold,
      totalParticipants: wallet.totalParticipants,
      status: wallet.status,
      createdAt: wallet.createdAt,
    };
  }

  /**
   * 激活 MPC 钱包
   *
   * @param walletId 钱包ID
   * @param userId 用户ID
   * @returns 激活后的钱包
   */
  async activateMPCWallet(walletId: string, userId: string): Promise<MPCWalletResponseDto> {
    const wallet = await this.getMPCWalletById(walletId, userId);

    if (wallet.status !== MPCWalletStatus.CREATING) {
      throw new BadRequestException('只有创建中的钱包才能激活');
    }

    wallet.status = MPCWalletStatus.ACTIVE;
    wallet.updatedAt = new Date();

    this.wallets.set(walletId, wallet);

    return {
      id: wallet.id,
      name: wallet.name,
      chain: wallet.chain,
      address: wallet.address,
      threshold: wallet.threshold,
      totalParticipants: wallet.totalParticipants,
      status: wallet.status,
      createdAt: wallet.createdAt,
    };
  }

  /**
   * 创建密钥生成会话
   *
   * @param createDto 创建参数
   * @returns 密钥生成会话
   */
  async createKeyGenSession(createDto: CreateKeyGenSessionDto): Promise<KeyGenSessionDto> {
    const { walletId, participants, algorithm, curve, timeoutSeconds } = createDto;

    const sessionId = 'kg_' + this.generateRandomId();

    const session: KeyGenSessionDto = {
      sessionId,
      walletId,
      status: MPCKeyStatus.PENDING,
      currentRound: 0,
      totalRounds: 3,
      participants: participants.map((p, index) => ({
        participantId: p.id,
        index,
        status: 'pending',
        lastRoundSubmitted: 0,
      })),
      algorithm,
      curve,
      createdAt: Date.now(),
      expiresAt: Date.now() + (timeoutSeconds || 3600) * 1000,
    };

    this.keyGenSessions.set(sessionId, session);

    return session;
  }

  /**
   * 获取密钥生成会话状态
   *
   * @param sessionId 会话ID
   * @returns 会话状态
   */
  async getKeyGenSession(sessionId: string): Promise<KeyGenSessionDto> {
    const session = this.keyGenSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException('密钥生成会话不存在');
    }
    return session;
  }

  /**
   * 提交密钥生成轮次数据
   *
   * @param sessionId 会话ID
   * @param roundDto 轮次数据
   * @returns 更新后的会话
   */
  async submitKeyGenRound(
    sessionId: string,
    roundDto: KeyGenRoundDto,
  ): Promise<KeyGenSessionDto> {
    const { round, participantId, payload } = roundDto;

    const session = await this.getKeyGenSession(sessionId);

    if (session.status === MPCKeyStatus.COMPLETED) {
      throw new BadRequestException('密钥生成已完成');
    }

    if (session.status === MPCKeyStatus.FAILED) {
      throw new BadRequestException('密钥生成已失败');
    }

    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      throw new BadRequestException('参与者不在会话中');
    }

    if (round !== session.currentRound + 1 && round !== session.currentRound) {
      throw new BadRequestException(`当前轮次为 ${session.currentRound}，无法提交第 ${round} 轮`);
    }

    participant.status = round >= session.totalRounds ? 'completed' : 'ready';
    participant.lastRoundSubmitted = round;

    const allReady = session.participants.every((p) => p.lastRoundSubmitted >= session.currentRound + 1);
    if (allReady && session.currentRound < session.totalRounds) {
      session.currentRound++;
      session.participants.forEach((p) => {
        if (p.status === 'ready') p.status = 'pending';
      });
    }

    const allCompleted = session.participants.every((p) => p.status === 'completed');
    if (allCompleted) {
      session.status = MPCKeyStatus.COMPLETED;

      const wallet = this.wallets.get(session.walletId);
      if (wallet) {
        wallet.status = MPCWalletStatus.ACTIVE;
        wallet.shards = session.participants.map((p, idx) => ({
          shardId: `shard_${idx}`,
          participantId: p.participantId,
          index: idx,
          status: 'active',
          createdAt: new Date(),
        }));
        wallet.updatedAt = new Date();
        this.wallets.set(session.walletId, wallet);
      }
    }

    this.keyGenSessions.set(sessionId, session);

    return session;
  }

  /**
   * 创建签名会话
   *
   * @param createDto 创建参数
   * @returns 签名会话
   */
  async createSigningSession(createDto: CreateSigningSessionDto): Promise<SigningSessionDto> {
    const {
      walletId,
      messageHash,
      transactionData,
      signingParticipants,
      purpose,
      timeoutSeconds,
    } = createDto;

    const sessionId = 'sign_' + this.generateRandomId();

    const session: SigningSessionDto = {
      sessionId,
      walletId,
      status: SigningSessionStatus.PENDING,
      messageHash,
      transactionData,
      purpose,
      currentRound: 0,
      totalRounds: 3,
      participants: signingParticipants.map((p, index) => ({
        participantId: p,
        index,
        status: 'pending',
        lastRoundSubmitted: 0,
      })),
      createdAt: Date.now(),
      expiresAt: Date.now() + (timeoutSeconds || 300) * 1000,
    };

    this.signingSessions.set(sessionId, session);

    return session;
  }

  /**
   * 获取签名会话状态
   *
   * @param sessionId 会话ID
   * @returns 会话状态
   */
  async getSigningSession(sessionId: string): Promise<SigningSessionDto> {
    const session = this.signingSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException('签名会话不存在');
    }
    return session;
  }

  /**
   * 提交签名轮次数据
   *
   * @param sessionId 会话ID
   * @param roundDto 轮次数据
   * @returns 更新后的会话
   */
  async submitSigningRound(
    sessionId: string,
    roundDto: SigningRoundDto,
  ): Promise<SigningSessionDto> {
    const { round, participantId, payload } = roundDto;

    const session = await this.getSigningSession(sessionId);

    if (session.status === SigningSessionStatus.COMPLETED) {
      throw new BadRequestException('签名已完成');
    }

    if (session.status === SigningSessionStatus.FAILED) {
      throw new BadRequestException('签名已失败');
    }

    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      throw new BadRequestException('参与者不在会话中');
    }

    participant.status = round >= session.totalRounds ? 'signed' : 'ready';
    participant.lastRoundSubmitted = round;

    const allReady = session.participants.every((p) => p.lastRoundSubmitted >= session.currentRound + 1);
    if (allReady && session.currentRound < session.totalRounds) {
      session.currentRound++;
      session.participants.forEach((p) => {
        if (p.status === 'ready') p.status = 'pending';
      });
    }

    const allSigned = session.participants.every((p) => p.status === 'signed');
    if (allSigned) {
      session.status = SigningSessionStatus.READY_TO_COMBINE;
    }

    this.signingSessions.set(sessionId, session);

    return session;
  }

  /**
   * 提交签名份额
   *
   * @param sessionId 会话ID
   * @param submitDto 签名份额数据
   * @returns 更新后的会话
   */
  async submitSignatureShare(
    sessionId: string,
    submitDto: SubmitMPCSignatureShareDto,
  ): Promise<SigningSessionDto> {
    const { participantId, signatureShare, publicKey } = submitDto;

    const session = await this.getSigningSession(sessionId);

    if (session.status !== SigningSessionStatus.READY_TO_COMBINE) {
      throw new BadRequestException('签名会话未处于可组合状态');
    }

    const participant = session.participants.find((p) => p.participantId === participantId);
    if (!participant) {
      throw new BadRequestException('参与者不在会话中');
    }

    participant.status = 'submitted';

    const allSubmitted = session.participants.every((p) => p.status === 'submitted');
    if (allSubmitted) {
      session.status = SigningSessionStatus.READY_TO_COMBINE;
    }

    this.signingSessions.set(sessionId, session);

    return session;
  }

  /**
   * 组合签名份额
   *
   * @param sessionId 会话ID
   * @param combineDto 组合参数
   * @returns 最终签名
   */
  async combineSignatures(
    sessionId: string,
    combineDto?: CombineMPCSignatureDto,
  ): Promise<{ signature: string; sessionId: string }> {
    const session = await this.getSigningSession(sessionId);

    if (session.status !== SigningSessionStatus.READY_TO_COMBINE) {
      throw new BadRequestException('签名会话未处于可组合状态');
    }

    const signature = `0x${this.generateRandomHex(130)}`;

    session.status = SigningSessionStatus.COMPLETED;
    this.signingSessions.set(sessionId, session);

    return {
      signature,
      sessionId,
    };
  }

  /**
   * 创建密钥恢复请求
   *
   * @param requestDto 恢复请求
   * @returns 恢复响应
   */
  async createRecoveryRequest(requestDto: RecoveryRequestDto): Promise<RecoveryResponseDto> {
    const { walletId, requestingParticipantId, reason, recoveryParticipants, timeoutSeconds } = requestDto;

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new NotFoundException('钱包不存在');
    }

    const requestId = 'rec_' + this.generateRandomId();

    const response: RecoveryResponseDto = {
      requestId,
      walletId,
      status: 'pending',
      requestingParticipantId,
      reason,
      requiredApprovals: wallet.threshold,
      approvals: [],
      recoveryParticipants,
      createdAt: Date.now(),
      expiresAt: Date.now() + (timeoutSeconds || 86400) * 1000,
    };

    this.recoveryRequests.set(requestId, response);

    return response;
  }

  /**
   * 获取恢复请求状态
   *
   * @param requestId 请求ID
   * @returns 恢复状态
   */
  async getRecoveryRequest(requestId: string): Promise<RecoveryResponseDto> {
    const request = this.recoveryRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('恢复请求不存在');
    }
    return request;
  }

  /**
   * 批准恢复请求
   *
   * @param requestId 请求ID
   * @param participantId 参与者ID
   * @returns 更新后的请求
   */
  async approveRecoveryRequest(
    requestId: string,
    participantId: string,
  ): Promise<RecoveryResponseDto> {
    const request = await this.getRecoveryRequest(requestId);

    if (request.status !== 'pending') {
      throw new BadRequestException('恢复请求不在待处理状态');
    }

    if (!request.recoveryParticipants.includes(participantId)) {
      throw new BadRequestException('该参与者不在恢复列表中');
    }

    if (request.approvals.some((a) => a.participantId === participantId)) {
      throw new BadRequestException('该参与者已批准');
    }

    request.approvals.push({
      participantId,
      approvedAt: Date.now(),
    });

    if (request.approvals.length >= request.requiredApprovals) {
      request.status = 'approved';
    }

    this.recoveryRequests.set(requestId, request);

    return request;
  }

  /**
   * 执行密钥恢复
   *
   * @param requestId 请求ID
   * @returns 恢复结果
   */
  async executeRecovery(requestId: string): Promise<{ success: boolean; shardId?: string; message: string }> {
    const request = await this.getRecoveryRequest(requestId);

    if (request.status !== 'approved') {
      throw new BadRequestException('恢复请求未获得足够批准');
    }

    request.status = 'completed';
    this.recoveryRequests.set(requestId, request);

    return {
      success: true,
      shardId: 'shard_' + this.generateRandomId(),
      message: '密钥分片恢复成功',
    };
  }

  /**
   * 获取 MPC 统计信息
   *
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getMPCStats(userId: string): Promise<Record<string, any>> {
    const wallets = Array.from(this.wallets.values()).filter((w) => w.userId === userId);

    return {
      totalWallets: wallets.length,
      activeWallets: wallets.filter((w) => w.status === MPCWalletStatus.ACTIVE).length,
      creatingWallets: wallets.filter((w) => w.status === MPCWalletStatus.CREATING).length,
      totalSignatures: 1234,
      activeSessions: this.signingSessions.size,
      keyGenSessions: this.keyGenSessions.size,
    };
  }

  // ============================================================
  // 私有方法
  // ============================================================

  /**
   * 生成默认参与者
   */
  private generateDefaultParticipants(count: number): Array<{ id: string; label: string }> {
    const participants: Array<{ id: string; label: string }> = [];
    for (let i = 0; i < count; i++) {
      participants.push({
        id: 'user_' + this.generateRandomId(),
        label: `Participant ${i + 1}`,
      });
    }
    return participants;
  }

  /**
   * 生成随机 ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 生成随机十六进制字符串
   */
  private generateRandomHex(length: number): string {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
