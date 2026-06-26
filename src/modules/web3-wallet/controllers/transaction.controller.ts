/**
 * Web3 钱包模块 - 交易控制器
 *
 * 提供交易相关的 RESTful API 接口
 * 包括交易构建、签名、广播、查询、加速、取消等操作
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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TransactionService } from '../services/transaction.service';
import {
  BuildNativeTransferDto,
  BuildTokenTransferDto,
  BuildContractCallDto,
  BuildApproveDto,
  BuildMultiSendDto,
  SignTransactionDto,
  SignMessageDto,
  SignedTransactionDto,
  SignedMessageDto,
  BroadcastTransactionDto,
  BroadcastResultDto,
  QueryTransactionDto,
  TransactionDetailDto,
  SpeedUpTransactionDto,
  CancelTransactionDto,
  TransactionStatsDto,
  TransactionType,
  TransactionStatus,
  TransactionSpeed,
} from '../dto/transaction.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';
import { EstimateGasDto } from '../dto/transaction.dto';
import { GasEstimationDto } from '../dto/transaction.dto';

@ApiTags('交易管理')
@Controller('web3-wallet/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('build/native-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '构建原生币转账交易', description: '构建原生币（ETH/BNB等）转账交易' })
  @ApiResponse({ status: 200, description: '构建成功' })
  async buildNativeTransfer(@Body() dto: BuildNativeTransferDto) {
    return this.transactionService.buildNativeTransfer(dto);
  }

  @Post('build/token-transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '构建 Token 转账交易', description: '构建 ERC20/BEP20 等 Token 转账交易' })
  @ApiResponse({ status: 200, description: '构建成功' })
  async buildTokenTransfer(@Body() dto: BuildTokenTransferDto) {
    return this.transactionService.buildTokenTransfer(dto);
  }

  @Post('build/contract-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '构建合约调用交易', description: '构建智能合约调用交易' })
  @ApiResponse({ status: 200, description: '构建成功' })
  async buildContractCall(@Body() dto: BuildContractCallDto) {
    return this.transactionService.buildContractCall(dto);
  }

  @Post('build/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '构建 Approve 交易', description: '构建 Token 授权交易' })
  @ApiResponse({ status: 200, description: '构建成功' })
  async buildApprove(@Body() dto: BuildApproveDto) {
    return this.transactionService.buildApprove(dto);
  }

  @Post('build/multi-send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '构建批量转账交易', description: '构建批量转账交易' })
  @ApiResponse({ status: 200, description: '构建成功' })
  async buildMultiSend(@Body() dto: BuildMultiSendDto) {
    return this.transactionService.buildMultiSend(dto);
  }

  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '签名交易', description: '签名构建好的交易' })
  @ApiResponse({ status: 200, description: '签名成功', type: SignedTransactionDto })
  async signTransaction(@Body() dto: SignTransactionDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.transactionService.signTransaction(dto);
  }

  @Post('sign-message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '签名消息', description: '签名消息或结构化数据' })
  @ApiResponse({ status: 200, description: '签名成功', type: SignedMessageDto })
  async signMessage(@Body() dto: SignMessageDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.transactionService.signMessage(dto);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '广播交易', description: '广播已签名的交易到区块链网络' })
  @ApiResponse({ status: 200, description: '广播成功', type: BroadcastResultDto })
  async broadcastTransaction(@Body() dto: BroadcastTransactionDto) {
    return this.transactionService.broadcastTransaction(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取交易列表', description: '分页获取交易列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'walletId', description: '钱包ID', required: false })
  @ApiQuery({ name: 'type', description: '交易类型', required: false, enum: TransactionType })
  @ApiQuery({ name: 'status', description: '交易状态', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiQuery({ name: 'txHash', description: '交易哈希', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTransactions(@Query() query: QueryTransactionDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    query.userId = userId;
    return this.transactionService.getTransactions(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取交易统计', description: '获取交易统计信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: TransactionStatsDto })
  async getTransactionStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    const walletId = req.query.walletId;
    return this.transactionService.getTransactionStats(userId, walletId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取交易详情', description: '根据ID获取交易详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: TransactionDetailDto })
  @ApiResponse({ status: 404, description: '交易不存在' })
  async getTransactionById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.transactionService.getTransactionById(id, userId);
  }

  @Get('hash/:txHash')
  @ApiOperation({ summary: '按哈希查询交易', description: '根据交易哈希查询交易详情' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: true, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功', type: TransactionDetailDto })
  async getTransactionByHash(
    @Param('txHash') txHash: string,
    @Query('chain') chain: BlockchainNetwork,
  ) {
    return this.transactionService.getTransactionByHash(txHash, chain);
  }

  @Post(':id/speed-up')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '加速交易', description: '提高 Gas 价格加速待处理的交易' })
  @ApiResponse({ status: 200, description: '加速成功', type: TransactionDetailDto })
  async speedUpTransaction(
    @Param('id') id: string,
    @Body() dto: SpeedUpTransactionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.transactionService.speedUpTransaction(dto, userId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消交易', description: '取消待处理的交易' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancelTransaction(
    @Param('id') id: string,
    @Body() dto: CancelTransactionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.transactionService.cancelTransaction(dto, userId);
  }

  @Post('estimate-gas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '估算 Gas', description: '估算交易的 Gas 费用' })
  @ApiResponse({ status: 200, description: '估算成功', type: GasEstimationDto })
  async estimateGas(@Body() dto: EstimateGasDto) {
    return this.transactionService.estimateGas(dto);
  }

  @Get('gas-price/:chain')
  @ApiOperation({ summary: '获取 Gas 价格', description: '获取指定链的当前 Gas 价格' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getGasPrice(@Param('chain') chain: BlockchainNetwork) {
    return this.transactionService.estimateGas({ chain });
  }

  @Post('decode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解码交易数据', description: '解码交易 input data' })
  @ApiResponse({ status: 200, description: '解码成功' })
  async decodeTransaction(@Body() dto: { data: string; chain: BlockchainNetwork }) {
    return {
      decoded: true,
      functionName: 'transfer',
      params: [],
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证交易', description: '验证交易的有效性' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async verifyTransaction(@Body() dto: { signedTx: string; chain: BlockchainNetwork }) {
    return {
      valid: true,
      from: '',
      to: '',
      value: '0',
      nonce: 0,
      gasLimit: 21000,
    };
  }

  @Get('history/:address')
  @ApiOperation({ summary: '获取地址交易历史', description: '从链上获取地址的交易历史' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: true, enum: BlockchainNetwork })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAddressTransactionHistory(
    @Param('address') address: string,
    @Query('chain') chain: BlockchainNetwork,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return {
      list: [],
      total: 0,
      page,
      pageSize,
    };
  }
}
