/**
 * Web3 钱包模块 - 风控控制器
 *
 * 提供风控相关的 RESTful API 接口
 * 包括地址风险扫描、交易风险评估、风控规则管理、黑白名单等
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RiskService } from '../services/risk.service';
import {
  ScanAddressDto,
  AddressRiskResultDto,
  RiskScoreDto,
  EvaluateTransactionRiskDto,
  TransactionRiskResultDto,
  RiskRuleDto,
  CreateRiskRuleDto,
  UpdateRiskRuleDto,
  BlacklistItemDto,
  WhitelistItemDto,
  AddBlacklistItemDto,
  AddWhitelistItemDto,
  RiskLevel,
  RiskType,
} from '../dto/risk.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('风控管理')
@Controller('web3-wallet/risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('scan/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '扫描地址风险', description: '扫描指定地址的风险情况' })
  @ApiResponse({ status: 200, description: '扫描完成', type: AddressRiskResultDto })
  async scanAddress(@Body() dto: ScanAddressDto) {
    return this.riskService.scanAddress(dto);
  }

  @Post('scan/addresses/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量扫描地址', description: '批量扫描多个地址的风险情况' })
  @ApiResponse({ status: 200, description: '扫描完成' })
  async batchScanAddresses(@Body() dto: { addresses: string[]; chain: BlockchainNetwork }) {
    const result = await this.riskService.batchScanAddresses(dto.addresses, dto.chain);
    return Object.fromEntries(result);
  }

  @Post('evaluate/transaction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '评估交易风险', description: '评估交易的风险等级' })
  @ApiResponse({ status: 200, description: '评估完成', type: TransactionRiskResultDto })
  async evaluateTransactionRisk(@Body() dto: EvaluateTransactionRiskDto) {
    return this.riskService.evaluateTransactionRisk(dto);
  }

  @Get('score/:address')
  @ApiOperation({ summary: '获取风险评分', description: '获取地址的详细风险评分' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: true, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功', type: RiskScoreDto })
  async getRiskScore(
    @Param('address') address: string,
    @Query('chain') chain: BlockchainNetwork,
  ) {
    return this.riskService.getRiskScore(address, chain);
  }

  @Get('rules')
  @ApiOperation({ summary: '获取风控规则列表', description: '获取所有风控规则' })
  @ApiResponse({ status: 200, description: '获取成功', type: [RiskRuleDto] })
  async getRiskRules() {
    return this.riskService.getRiskRules();
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '获取风控规则详情', description: '根据ID获取风控规则详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: RiskRuleDto })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async getRiskRuleById(@Param('id') id: string) {
    return this.riskService.getRiskRuleById(id);
  }

  @Post('rules')
  @ApiOperation({ summary: '创建风控规则', description: '创建新的风控规则' })
  @ApiResponse({ status: 201, description: '创建成功', type: RiskRuleDto })
  async createRiskRule(@Body() dto: CreateRiskRuleDto) {
    return this.riskService.createRiskRule(dto);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: '更新风控规则', description: '更新风控规则' })
  @ApiResponse({ status: 200, description: '更新成功', type: RiskRuleDto })
  async updateRiskRule(@Param('id') id: string, @Body() dto: UpdateRiskRuleDto) {
    return this.riskService.updateRiskRule(id, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除风控规则', description: '删除指定风控规则' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteRiskRule(@Param('id') id: string) {
    await this.riskService.deleteRiskRule(id);
  }

  @Post('rules/:id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启用/禁用规则', description: '启用或禁用风控规则' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async toggleRiskRule(
    @Param('id') id: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.riskService.toggleRiskRule(id, enabled);
  }

  @Get('blacklist')
  @ApiOperation({ summary: '获取黑名单', description: '获取黑名单地址列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBlacklist(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.riskService.getBlacklist(page, pageSize);
  }

  @Post('blacklist')
  @ApiOperation({ summary: '添加黑名单', description: '添加地址到黑名单' })
  @ApiResponse({ status: 201, description: '添加成功', type: BlacklistItemDto })
  async addToBlacklist(@Body() dto: AddBlacklistItemDto) {
    return this.riskService.addToBlacklist(dto);
  }

  @Delete('blacklist/:address')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除黑名单', description: '从黑名单中移除地址' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: true, enum: BlockchainNetwork })
  @ApiResponse({ status: 204, description: '移除成功' })
  async removeFromBlacklist(
    @Param('address') address: string,
    @Query('chain') chain: BlockchainNetwork,
  ) {
    await this.riskService.removeFromBlacklist(address, chain);
  }

  @Get('whitelist')
  @ApiOperation({ summary: '获取白名单', description: '获取白名单地址列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getWhitelist(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.riskService.getWhitelist(page, pageSize);
  }

  @Post('whitelist')
  @ApiOperation({ summary: '添加白名单', description: '添加地址到白名单' })
  @ApiResponse({ status: 201, description: '添加成功', type: WhitelistItemDto })
  async addToWhitelist(@Body() dto: AddWhitelistItemDto) {
    return this.riskService.addToWhitelist(dto);
  }

  @Delete('whitelist/:address')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '移除白名单', description: '从白名单中移除地址' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: true, enum: BlockchainNetwork })
  @ApiResponse({ status: 204, description: '移除成功' })
  async removeFromWhitelist(
    @Param('address') address: string,
    @Query('chain') chain: BlockchainNetwork,
  ) {
    await this.riskService.removeFromWhitelist(address, chain);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取风控统计', description: '获取风控相关统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRiskStats() {
    return this.riskService.getRiskStats();
  }

  @Post('check/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '快速检查地址', description: '快速检查地址是否在黑名单中' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async quickCheckAddress(
    @Body() dto: { address: string; chain: BlockchainNetwork },
  ) {
    const result = await this.riskService.scanAddress({
      address: dto.address,
      chain: dto.chain,
    });
    return {
      address: dto.address,
      chain: dto.chain,
      isBlocked: result.isBlacklisted || result.riskLevel === RiskLevel.CRITICAL,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
    };
  }
}
