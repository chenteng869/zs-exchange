/**
 * Web3 钱包模块 - MPC 控制器
 *
 * 提供多方计算钱包相关的 RESTful API 接口
 * 包括 MPC 钱包管理、密钥生成、签名会话、密钥恢复等
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MPCService } from '../services/mpc.service';
import {
  CreateMPCWalletDto,
  MPCWalletResponseDto,
  MPCWalletDetailDto,
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
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('MPC 钱包')
@Controller('web3-wallet/mpc')
export class MPCController {
  constructor(private readonly mpcService: MPCService) {}

  @Post('wallets')
  @ApiOperation({ summary: '创建 MPC 钱包', description: '创建新的多方计算钱包' })
  @ApiResponse({ status: 201, description: '创建成功', type: MPCWalletResponseDto })
  async createMPCWallet(@Body() dto: CreateMPCWalletDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.createMPCWallet(dto, userId);
  }

  @Get('wallets')
  @ApiOperation({ summary: '获取 MPC 钱包列表', description: '获取用户的 MPC 钱包列表' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功', type: [MPCWalletResponseDto] })
  async getMPCWallets(
    @Query('chain') chain?: BlockchainNetwork,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.getMPCWallets(userId, chain);
  }

  @Get('wallets/:id')
  @ApiOperation({ summary: '获取 MPC 钱包详情', description: '根据ID获取 MPC 钱包详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: MPCWalletDetailDto })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async getMPCWalletById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.getMPCWalletById(id, userId);
  }

  @Put('wallets/:id')
  @ApiOperation({ summary: '更新 MPC 钱包', description: '更新 MPC 钱包信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: MPCWalletResponseDto })
  async updateMPCWallet(
    @Param('id') id: string,
    @Body() dto: { name?: string; metadata?: Record<string, any> },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.updateMPCWallet(id, dto, userId);
  }

  @Post('wallets/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '激活 MPC 钱包', description: '激活已创建的 MPC 钱包' })
  @ApiResponse({ status: 200, description: '激活成功', type: MPCWalletResponseDto })
  async activateMPCWallet(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.activateMPCWallet(id, userId);
  }

  @Post('keygen/sessions')
  @ApiOperation({ summary: '创建密钥生成会话', description: '创建 MPC 密钥生成会话' })
  @ApiResponse({ status: 201, description: '创建成功', type: KeyGenSessionDto })
  async createKeyGenSession(@Body() dto: CreateKeyGenSessionDto) {
    return this.mpcService.createKeyGenSession(dto);
  }

  @Get('keygen/sessions/:sessionId')
  @ApiOperation({ summary: '获取密钥生成会话', description: '获取密钥生成会话状态' })
  @ApiResponse({ status: 200, description: '获取成功', type: KeyGenSessionDto })
  async getKeyGenSession(@Param('sessionId') sessionId: string) {
    return this.mpcService.getKeyGenSession(sessionId);
  }

  @Post('keygen/sessions/:sessionId/round')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交密钥生成轮次数据', description: '提交密钥生成的轮次数据' })
  @ApiResponse({ status: 200, description: '提交成功', type: KeyGenSessionDto })
  async submitKeyGenRound(
    @Param('sessionId') sessionId: string,
    @Body() dto: KeyGenRoundDto,
  ) {
    return this.mpcService.submitKeyGenRound(sessionId, dto);
  }

  @Post('signing/sessions')
  @ApiOperation({ summary: '创建签名会话', description: '创建 MPC 签名会话' })
  @ApiResponse({ status: 201, description: '创建成功', type: SigningSessionDto })
  async createSigningSession(@Body() dto: CreateSigningSessionDto) {
    return this.mpcService.createSigningSession(dto);
  }

  @Get('signing/sessions/:sessionId')
  @ApiOperation({ summary: '获取签名会话', description: '获取签名会话状态' })
  @ApiResponse({ status: 200, description: '获取成功', type: SigningSessionDto })
  async getSigningSession(@Param('sessionId') sessionId: string) {
    return this.mpcService.getSigningSession(sessionId);
  }

  @Post('signing/sessions/:sessionId/round')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交签名轮次数据', description: '提交签名的轮次数据' })
  @ApiResponse({ status: 200, description: '提交成功', type: SigningSessionDto })
  async submitSigningRound(
    @Param('sessionId') sessionId: string,
    @Body() dto: SigningRoundDto,
  ) {
    return this.mpcService.submitSigningRound(sessionId, dto);
  }

  @Post('signing/sessions/:sessionId/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交签名份额', description: '提交 MPC 签名份额' })
  @ApiResponse({ status: 200, description: '提交成功', type: SigningSessionDto })
  async submitSignatureShare(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitMPCSignatureShareDto,
  ) {
    return this.mpcService.submitSignatureShare(sessionId, dto);
  }

  @Post('signing/sessions/:sessionId/combine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '组合签名', description: '组合所有签名份额生成最终签名' })
  @ApiResponse({ status: 200, description: '组合成功' })
  async combineSignatures(
    @Param('sessionId') sessionId: string,
    @Body() dto?: CombineMPCSignatureDto,
  ) {
    return this.mpcService.combineSignatures(sessionId, dto);
  }

  @Post('recovery/requests')
  @ApiOperation({ summary: '创建恢复请求', description: '创建密钥恢复请求' })
  @ApiResponse({ status: 201, description: '创建成功', type: RecoveryResponseDto })
  async createRecoveryRequest(@Body() dto: RecoveryRequestDto) {
    return this.mpcService.createRecoveryRequest(dto);
  }

  @Get('recovery/requests/:requestId')
  @ApiOperation({ summary: '获取恢复请求', description: '获取密钥恢复请求状态' })
  @ApiResponse({ status: 200, description: '获取成功', type: RecoveryResponseDto })
  async getRecoveryRequest(@Param('requestId') requestId: string) {
    return this.mpcService.getRecoveryRequest(requestId);
  }

  @Post('recovery/requests/:requestId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批准恢复请求', description: '批准密钥恢复请求' })
  @ApiResponse({ status: 200, description: '批准成功', type: RecoveryResponseDto })
  async approveRecoveryRequest(
    @Param('requestId') requestId: string,
    @Body('participantId') participantId: string,
  ) {
    return this.mpcService.approveRecoveryRequest(requestId, participantId);
  }

  @Post('recovery/requests/:requestId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行恢复', description: '执行密钥恢复操作' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  async executeRecovery(@Param('requestId') requestId: string) {
    return this.mpcService.executeRecovery(requestId);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取 MPC 统计', description: '获取 MPC 相关统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMPCStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.mpcService.getMPCStats(userId);
  }

  @Get('wallets/:walletId/shards')
  @ApiOperation({ summary: '获取密钥分片信息', description: '获取 MPC 钱包的密钥分片信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWalletShards(@Param('walletId') walletId: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    const wallet = await this.mpcService.getMPCWalletById(walletId, userId);
    return {
      shards: wallet.shards || [],
      total: wallet.shards?.length || 0,
    };
  }
}
