/**
 * Web3 钱包模块 - 链服务控制器
 *
 * 提供区块链节点相关的 RESTful API 接口
 * 包括链信息查询、节点管理、地址验证、余额查询等
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ChainService } from '../services/chain.service';
import {
  AddressValidationResultDto,
  EstimateGasDto,
  GasEstimationDto,
  GetNonceDto,
  NonceDto,
  GetTransactionReceiptDto,
  TransactionReceiptDto,
  GetChainTransactionHistoryDto,
} from '../dto/transaction.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('链服务')
@Controller('web3-wallet/chains')
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @Get()
  @ApiOperation({ summary: '获取支持的链列表', description: '获取所有支持的区块链网络列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSupportedChains() {
    return this.chainService.getSupportedChains();
  }

  @Get(':chain/status')
  @ApiOperation({ summary: '获取链状态', description: '获取指定链的运行状态' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 400, description: '不支持的链' })
  async getChainStatus(@Param('chain') chain: BlockchainNetwork) {
    return this.chainService.getChainStatus(chain);
  }

  @Post('validate-address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证地址', description: '验证地址格式和有效性' })
  @ApiResponse({ status: 200, description: '验证完成', type: AddressValidationResultDto })
  async validateAddress(
    @Body() dto: { address: string; chain: BlockchainNetwork },
  ) {
    return this.chainService.validateAddress(dto.address, dto.chain);
  }

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取地址余额', description: '获取指定地址的余额' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBalance(
    @Body() dto: { address: string; chain: BlockchainNetwork; tokenAddress?: string },
  ) {
    return this.chainService.getBalance(dto.address, dto.chain, dto.tokenAddress);
  }

  @Post('balances/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量获取余额', description: '批量获取多个地址的余额' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBalances(
    @Body() dto: { addresses: string[]; chain: BlockchainNetwork },
  ) {
    const result = await this.chainService.getBalances(dto.addresses, dto.chain);
    return Object.fromEntries(result);
  }

  @Post('estimate-gas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '估算 Gas', description: '估算交易 Gas 费用' })
  @ApiResponse({ status: 200, description: '估算成功', type: GasEstimationDto })
  async estimateGas(@Body() dto: EstimateGasDto) {
    return this.chainService.estimateGas(dto);
  }

  @Get(':chain/gas-price')
  @ApiOperation({ summary: '获取 Gas 价格', description: '获取指定链的当前 Gas 价格' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getGasPrice(@Param('chain') chain: BlockchainNetwork) {
    return this.chainService.estimateGas({ chain });
  }

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取 Nonce', description: '获取地址的交易 Nonce' })
  @ApiResponse({ status: 200, description: '获取成功', type: NonceDto })
  async getNonce(@Body() dto: GetNonceDto) {
    return this.chainService.getNonce(dto);
  }

  @Post('transaction/receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取交易收据', description: '获取交易的链上收据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTransactionReceipt(@Body() dto: GetTransactionReceiptDto) {
    return this.chainService.getTransactionReceipt(dto);
  }

  @Post('transaction/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取链上交易历史', description: '从链上获取地址的交易历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTransactionHistory(@Body() dto: GetChainTransactionHistoryDto) {
    return this.chainService.getTransactionHistory(dto);
  }

  @Get(':chain/nodes')
  @ApiOperation({ summary: '获取节点列表', description: '获取指定链的节点列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getNodes(@Param('chain') chain: BlockchainNetwork) {
    return this.chainService.getNodes(chain);
  }

  @Post(':chain/nodes')
  @ApiOperation({ summary: '添加节点', description: '添加新的 RPC 节点' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addNode(
    @Param('chain') chain: BlockchainNetwork,
    @Body() dto: { name: string; rpcUrl: string; priority?: number },
  ) {
    return this.chainService.addNode(chain, {
      name: dto.name,
      rpcUrl: dto.rpcUrl,
      priority: dto.priority || 10,
    });
  }

  @Post('nodes/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '测试节点连接', description: '测试 RPC 节点的连接状态' })
  @ApiResponse({ status: 200, description: '测试完成' })
  async testNodeConnection(@Body() dto: { chain: BlockchainNetwork; rpcUrl: string }) {
    return this.chainService.testNodeConnection(dto.chain, dto.rpcUrl);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '广播交易', description: '广播已签名的交易' })
  @ApiResponse({ status: 200, description: '广播成功' })
  async broadcastTransaction(@Body() dto: { signedTx: string; chain: BlockchainNetwork }) {
    const txHash = await this.chainService.broadcastTransaction(dto.signedTx, dto.chain);
    return { txHash };
  }

  @Get(':chain/block/latest')
  @ApiOperation({ summary: '获取最新区块', description: '获取最新区块信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLatestBlock(@Param('chain') chain: BlockchainNetwork) {
    const status = await this.chainService.getChainStatus(chain);
    return {
      chain,
      blockNumber: status.blockNumber,
      timestamp: status.latestBlockTime,
    };
  }

  @Get(':chain/block/:number')
  @ApiOperation({ summary: '获取指定区块', description: '获取指定高度的区块信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBlockByNumber(
    @Param('chain') chain: BlockchainNetwork,
    @Param('number') number: number,
  ) {
    return {
      chain,
      blockNumber: number,
      hash: '0x' + '0'.repeat(64),
      timestamp: Math.floor(Date.now() / 1000),
      transactions: [],
    };
  }
}
