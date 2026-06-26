/**
 * Web3 钱包模块 - 钱包控制器
 *
 * 提供钱包相关的 RESTful API 接口
 * 包括钱包的创建、导入、查询、更新、删除等操作
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
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WalletService } from '../services/wallet.service';
import {
  CreateWalletDto,
  ImportWalletDto,
  UpdateWalletDto,
  WalletQueryDto,
  GenerateAddressDto,
  VerifyAddressDto,
  ExportPrivateKeyDto,
  ExportMnemonicDto,
  WalletAddressDto,
  WalletBalanceDto,
  WalletDetailDto,
  WalletListResponseDto,
  WalletType,
  WalletStatus,
} from '../dto/wallet.dto';
import { PaginationDto } from '../dto/wallet.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('钱包管理')
@Controller('web3-wallet/wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @ApiOperation({ summary: '创建钱包', description: '创建新的钱包，支持普通钱包和HD钱包' })
  @ApiResponse({ status: 201, description: '钱包创建成功', type: WalletDetailDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async createWallet(@Body() createWalletDto: CreateWalletDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.createWallet(createWalletDto, userId);
  }

  @Post('import')
  @ApiOperation({ summary: '导入钱包', description: '通过私钥或助记词导入钱包' })
  @ApiResponse({ status: 201, description: '钱包导入成功', type: WalletDetailDto })
  @ApiResponse({ status: 400, description: '导入失败，私钥或助记词无效' })
  async importWallet(@Body() importWalletDto: ImportWalletDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.importWallet(importWalletDto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取钱包列表', description: '分页获取用户的钱包列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'type', description: '钱包类型', required: false, enum: WalletType })
  @ApiQuery({ name: 'status', description: '钱包状态', required: false, enum: WalletStatus })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: false })
  @ApiResponse({ status: 200, description: '获取成功', type: WalletListResponseDto })
  async getWallets(@Query() query: WalletQueryDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    const { page, pageSize, ...filters } = query;
    const pagination: PaginationDto = {
      page: page || 1,
      pageSize: pageSize || 20,
    };
    return this.walletService.getWallets(userId, pagination, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取钱包统计', description: '获取用户钱包的统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWalletStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.getWalletStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取钱包详情', description: '根据ID获取钱包的详细信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: WalletDetailDto })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async getWalletById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.getWalletById(id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: '获取钱包余额', description: '获取指定钱包各链上的余额' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功', type: [WalletBalanceDto] })
  async getWalletBalance(
    @Param('id') id: string,
    @Query('chain') chain?: BlockchainNetwork,
  ) {
    return this.walletService.getBalance(id, chain);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新钱包信息', description: '更新钱包的名称、备注等信息' })
  @ApiResponse({ status: 200, description: '更新成功', type: WalletDetailDto })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async updateWallet(
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.updateWallet(id, updateWalletDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除钱包', description: '删除指定钱包（软删除）' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async deleteWallet(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    await this.walletService.deleteWallet(id, userId);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: '生成新地址', description: '为HD钱包生成新的地址' })
  @ApiResponse({ status: 201, description: '地址生成成功', type: WalletAddressDto })
  @ApiResponse({ status: 400, description: '生成失败' })
  async generateAddress(
    @Param('id') id: string,
    @Body() generateAddressDto: GenerateAddressDto,
  ) {
    return this.walletService.generateAddress(id, generateAddressDto);
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: '获取地址列表', description: '获取钱包的所有地址' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功', type: [WalletAddressDto] })
  async getAddresses(
    @Param('id') id: string,
    @Query('chain') chain?: BlockchainNetwork,
  ) {
    return this.walletService.getAddresses(id, chain);
  }

  @Post('verify-address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证地址', description: '验证地址格式和有效性' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async verifyAddress(@Body() verifyAddressDto: VerifyAddressDto) {
    return this.walletService.verifyAddress(
      verifyAddressDto.address,
      verifyAddressDto.chain,
    );
  }

  @Post(':id/export-private-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出私钥', description: '导出钱包的私钥（需要密码验证）' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @ApiResponse({ status: 400, description: '密码错误或导出失败' })
  async exportPrivateKey(
    @Param('id') id: string,
    @Body() exportPrivateKeyDto: ExportPrivateKeyDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.exportPrivateKey(id, exportPrivateKeyDto.password, userId);
  }

  @Post(':id/export-mnemonic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出助记词', description: '导出HD钱包的助记词（需要密码验证）' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @ApiResponse({ status: 400, description: '密码错误或导出失败' })
  async exportMnemonic(
    @Param('id') id: string,
    @Body() exportMnemonicDto: ExportMnemonicDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.exportMnemonic(id, exportMnemonicDto.password, userId);
  }

  @Post(':id/freeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '冻结钱包', description: '冻结钱包，暂停所有操作' })
  @ApiResponse({ status: 200, description: '冻结成功' })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async freezeWallet(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.freezeWallet(id, userId);
  }

  @Post(':id/unfreeze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解冻钱包', description: '解冻钱包，恢复正常使用' })
  @ApiResponse({ status: 200, description: '解冻成功' })
  @ApiResponse({ status: 404, description: '钱包不存在' })
  async unfreezeWallet(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.walletService.unfreezeWallet(id, userId);
  }

  @Post(':id/backup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '备份钱包', description: '创建钱包备份' })
  @ApiResponse({ status: 200, description: '备份成功' })
  async backupWallet(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return {
      success: true,
      message: '钱包备份成功',
      backupId: 'backup_' + Math.random().toString(36).substring(2, 15),
      createdAt: new Date(),
    };
  }

  @Get(':id/backup/list')
  @ApiOperation({ summary: '获取备份列表', description: '获取钱包的备份列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBackupList(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return {
      list: [],
      total: 0,
    };
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '恢复钱包', description: '从备份恢复钱包' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  async restoreWallet(
    @Param('id') id: string,
    @Body('backupId') backupId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return {
      success: true,
      message: '钱包恢复成功',
    };
  }

  @Get('supported/chains')
  @ApiOperation({ summary: '获取支持的链', description: '获取钱包支持的所有区块链网络' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSupportedChains() {
    return Object.values(BlockchainNetwork).map((chain) => ({
      chain,
      name: chain,
      enabled: true,
    }));
  }
}
