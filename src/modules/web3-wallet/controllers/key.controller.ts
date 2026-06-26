/**
 * Web3 钱包模块 - 密钥控制器
 *
 * 提供密钥管理相关的 RESTful API 接口
 * 包括密钥生成、派生、导入、导出、加密、解密等操作
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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { KeyService } from '../services/key.service';
import {
  GeneratePrivateKeyDto,
  GenerateMnemonicDto,
  DeriveKeyDto,
  DeriveAddressDto,
  ImportPrivateKeyDto,
  ImportMnemonicDto,
  ImportKeystoreDto,
  ExportPrivateKeyDto,
  ExportMnemonicDto,
  EncryptKeyDto,
  DecryptKeyDto,
  KeyQueryDto,
  KeyDetailDto,
  KeyBackupDto,
  KeyRestoreDto,
  VerifyKeyDto,
  RotateKeyDto,
  KeyType,
  EncryptionAlgorithm,
} from '../dto/key.dto';
import { BlockchainNetwork } from '../dto/wallet.dto';
import { PaginationDto } from '../dto/wallet.dto';

@ApiTags('密钥管理')
@Controller('web3-wallet/keys')
export class KeyController {
  constructor(private readonly keyService: KeyService) {}

  @Post('generate/private-key')
  @ApiOperation({ summary: '生成私钥', description: '生成随机私钥' })
  @ApiResponse({ status: 201, description: '生成成功' })
  async generatePrivateKey(@Body() dto: GeneratePrivateKeyDto) {
    return this.keyService.generatePrivateKey(dto.chain || BlockchainNetwork.ETHEREUM, dto.keyType);
  }

  @Post('generate/mnemonic')
  @ApiOperation({ summary: '生成助记词', description: '生成 BIP39 助记词' })
  @ApiResponse({ status: 201, description: '生成成功' })
  async generateMnemonic(@Body() dto: GenerateMnemonicDto) {
    return this.keyService.generateMnemonic(dto.wordCount, dto.passphrase);
  }

  @Post('derive/key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '派生密钥', description: '从父密钥派生子密钥' })
  @ApiResponse({ status: 200, description: '派生成功' })
  async deriveKey(@Body() dto: DeriveKeyDto) {
    return this.keyService.deriveKey(
      dto.parentKey,
      dto.derivationPath,
      dto.chain || BlockchainNetwork.ETHEREUM,
    );
  }

  @Post('derive/address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '派生地址', description: '从公钥派生地址' })
  @ApiResponse({ status: 200, description: '派生成功' })
  async deriveAddress(@Body() dto: DeriveAddressDto) {
    return this.keyService.deriveAddress(
      dto.publicKey,
      dto.chain || BlockchainNetwork.ETHEREUM,
    );
  }

  @Post('import/private-key')
  @ApiOperation({ summary: '导入私钥', description: '导入外部私钥' })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importPrivateKey(@Body() dto: ImportPrivateKeyDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.importPrivateKey(dto, userId);
  }

  @Post('import/mnemonic')
  @ApiOperation({ summary: '导入助记词', description: '通过助记词导入钱包' })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importMnemonic(@Body() dto: ImportMnemonicDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.importMnemonic(dto, userId);
  }

  @Post('import/keystore')
  @ApiOperation({ summary: '导入 Keystore', description: '导入 Keystore 文件' })
  @ApiResponse({ status: 201, description: '导入成功' })
  async importKeystore(@Body() dto: ImportKeystoreDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.importKeystore(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取密钥列表', description: '分页获取密钥列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getKeys(@Query() query: KeyQueryDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    const { page, pageSize, ...filters } = query;
    const pagination: PaginationDto = {
      page: page || 1,
      pageSize: pageSize || 20,
    };
    return this.keyService.getKeyList(userId, pagination, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取密钥详情', description: '根据ID获取密钥详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: KeyDetailDto })
  @ApiResponse({ status: 404, description: '密钥不存在' })
  async getKeyById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.getKeyById(id, userId);
  }

  @Post(':id/export/private-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出私钥', description: '导出私钥（需要密码验证）' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportPrivateKey(
    @Param('id') id: string,
    @Body() dto: ExportPrivateKeyDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.exportPrivateKey(id, dto.password, userId);
  }

  @Post(':id/export/mnemonic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出助记词', description: '导出助记词（需要密码验证）' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportMnemonic(
    @Param('id') id: string,
    @Body() dto: ExportMnemonicDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.exportMnemonic(id, dto.password, userId);
  }

  @Post('encrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '加密密钥', description: '加密私钥或助记词' })
  @ApiResponse({ status: 200, description: '加密成功' })
  async encryptKey(@Body() dto: EncryptKeyDto) {
    return this.keyService.encryptKey(
      dto.plaintext,
      dto.password,
      dto.algorithm || EncryptionAlgorithm.AES_256_GCM,
    );
  }

  @Post('decrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '解密密钥', description: '解密加密的密钥数据' })
  @ApiResponse({ status: 200, description: '解密成功' })
  async decryptKey(@Body() dto: DecryptKeyDto) {
    return this.keyService.decryptKey(
      dto.encryptedData,
      dto.password,
      dto.algorithm || EncryptionAlgorithm.AES_256_GCM,
    );
  }

  @Post(':id/backup')
  @ApiOperation({ summary: '创建密钥备份', description: '创建密钥备份' })
  @ApiResponse({ status: 201, description: '备份创建成功' })
  async createBackup(@Param('id') id: string, @Body() dto: KeyBackupDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.createBackup(id, dto, userId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '恢复密钥备份', description: '从备份恢复密钥' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  async restoreBackup(@Param('id') id: string, @Body() dto: KeyRestoreDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.restoreBackup(id, dto, userId);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证密钥', description: '验证密钥的有效性' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async verifyKey(@Body() dto: VerifyKeyDto) {
    return this.keyService.verifyKey(
      dto.keyData,
      dto.keyType,
      dto.chain || BlockchainNetwork.ETHEREUM,
      dto.expectedAddress,
    );
  }

  @Post(':id/rotate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '密钥轮换', description: '执行密钥轮换操作' })
  @ApiResponse({ status: 200, description: '轮换成功' })
  async rotateKey(@Param('id') id: string, @Body() dto: RotateKeyDto, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.rotateKey(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除密钥', description: '删除指定密钥' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteKey(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    await this.keyService.deleteKey(id, userId);
  }

  @Get('supported/algorithms')
  @ApiOperation({ summary: '获取支持的加密算法', description: '获取支持的加密算法列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSupportedAlgorithms() {
    return {
      algorithms: Object.values(EncryptionAlgorithm),
      keyTypes: Object.values(KeyType),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取密钥统计', description: '获取密钥管理统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getKeyStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.keyService.getKeyStats(userId);
  }
}
