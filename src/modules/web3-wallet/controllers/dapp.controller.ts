/**
 * Web3 钱包模块 - DApp 控制器
 *
 * 提供 DApp 相关的 RESTful API 接口
 * 包括 DApp 发现、连接管理、权限控制、会话管理等
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DAppService } from '../services/dapp.service';
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('DApp 管理')
@Controller('web3-wallet/dapps')
export class DAppController {
  constructor(private readonly dappService: DAppService) {}

  @Get()
  @ApiOperation({ summary: '获取 DApp 列表', description: '分页获取 DApp 列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'category', description: '分类', required: false })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiQuery({ name: 'search', description: '搜索关键词', required: false })
  @ApiQuery({ name: 'featured', description: '是否精选', required: false })
  @ApiQuery({ name: 'verified', description: '是否已验证', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getDAppList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('category') category?: string,
    @Query('chain') chain?: BlockchainNetwork,
    @Query('search') search?: string,
    @Query('featured') featured?: boolean,
    @Query('verified') verified?: boolean,
  ) {
    return this.dappService.getDAppList(
      category,
      chain,
      search,
      featured,
      verified,
      page,
      pageSize,
    );
  }

  @Get('featured')
  @ApiOperation({ summary: '获取精选 DApp', description: '获取精选推荐的 DApp' })
  @ApiQuery({ name: 'limit', description: '数量限制', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFeaturedDApps(@Query('limit') limit: number = 10) {
    return this.dappService.getFeaturedDApps(limit);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取 DApp 分类', description: '获取所有 DApp 分类' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getCategories() {
    return this.dappService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取 DApp 详情', description: '根据ID获取 DApp 详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: 'DApp 不存在' })
  async getDAppById(@Param('id') id: string) {
    return this.dappService.getDAppById(id);
  }

  @Get('search/query')
  @ApiOperation({ summary: '搜索 DApp', description: '搜索 DApp' })
  @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchDApps(
    @Query('q') q: string,
    @Query('chain') chain?: BlockchainNetwork,
  ) {
    return this.dappService.searchDApps(q, chain);
  }

  @Post('connect')
  @ApiOperation({ summary: '连接 DApp', description: '连接钱包到 DApp' })
  @ApiResponse({ status: 201, description: '连接成功' })
  async connectDApp(
    @Body() dto: {
      walletId: string;
      dappId: string;
      chain: BlockchainNetwork;
      permissions: string[];
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.connectDApp(
      userId,
      dto.walletId,
      dto.dappId,
      dto.chain,
      dto.permissions,
    );
  }

  @Post('disconnect/:connectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '断开 DApp 连接', description: '断开与 DApp 的连接' })
  @ApiResponse({ status: 200, description: '断开成功' })
  async disconnectDApp(
    @Param('connectionId') connectionId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    await this.dappService.disconnectDApp(userId, connectionId);
    return { success: true, message: '已断开连接' };
  }

  @Get('connections/list')
  @ApiOperation({ summary: '获取连接列表', description: '获取用户的 DApp 连接列表' })
  @ApiQuery({ name: 'isActive', description: '是否活跃', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getConnections(
    @Query('isActive') isActive?: boolean,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.getConnections(userId, isActive);
  }

  @Get('connections/:connectionId')
  @ApiOperation({ summary: '获取连接详情', description: '获取 DApp 连接详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '连接不存在' })
  async getConnectionById(
    @Param('connectionId') connectionId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.getConnectionById(userId, connectionId);
  }

  @Put('connections/:connectionId/permissions')
  @ApiOperation({ summary: '更新权限', description: '更新 DApp 连接权限' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updatePermissions(
    @Param('connectionId') connectionId: string,
    @Body() dto: { permissions: string[] },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.updatePermissions(userId, connectionId, dto.permissions);
  }

  @Post('sessions/create')
  @ApiOperation({ summary: '创建会话', description: '创建 DApp 会话' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createSession(
    @Body() dto: {
      connectionId: string;
      chain: BlockchainNetwork;
      methods: string[];
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.createSession(
      userId,
      dto.connectionId,
      dto.chain,
      dto.methods,
    );
  }

  @Get('sessions/list')
  @ApiOperation({ summary: '获取会话列表', description: '获取用户的 DApp 会话列表' })
  @ApiQuery({ name: 'isActive', description: '是否活跃', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSessions(
    @Query('isActive') isActive?: boolean,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.getSessions(userId, isActive);
  }

  @Post('verify/permission')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证权限', description: '验证 DApp 连接是否具有指定权限' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async verifyPermission(
    @Body() dto: {
      connectionId: string;
      method: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    const hasPermission = await this.dappService.verifyPermission(
      userId,
      dto.connectionId,
      dto.method,
    );
    return { hasPermission };
  }

  @Post('approve/transaction')
  @ApiOperation({ summary: '请求交易授权', description: '请求 DApp 交易授权' })
  @ApiResponse({ status: 201, description: '请求已创建' })
  async requestTransactionApproval(
    @Body() dto: {
      connectionId: string;
      transaction: Record<string, any>;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.requestTransactionApproval(
      userId,
      dto.connectionId,
      dto.transaction,
    );
  }

  @Get('stats/info')
  @ApiOperation({ summary: '获取 DApp 统计', description: '获取 DApp 相关统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.dappService.getStats(userId);
  }

  @Get('recommended/list')
  @ApiOperation({ summary: '获取推荐 DApp', description: '获取推荐的 DApp 列表' })
  @ApiQuery({ name: 'limit', description: '数量限制', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRecommendedDApps(@Query('limit') limit: number = 10) {
    return this.dappService.getFeaturedDApps(limit);
  }

  @Get('hot/trending')
  @ApiOperation({ summary: '获取热门 DApp', description: '获取热门趋势 DApp' })
  @ApiQuery({ name: 'limit', description: '数量限制', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getHotDApps(@Query('limit') limit: number = 10) {
    return this.dappService.getFeaturedDApps(limit);
  }

  @Get('new/latest')
  @ApiOperation({ summary: '获取最新 DApp', description: '获取最新添加的 DApp' })
  @ApiQuery({ name: 'limit', description: '数量限制', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getNewDApps(@Query('limit') limit: number = 10) {
    return this.dappService.getFeaturedDApps(limit);
  }
}
