/**
 * Web3 钱包模块 - 地址簿控制器
 *
 * 提供地址簿相关的 RESTful API 接口
 * 包括地址的增删改查、分组管理、标签管理等
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
import { AddressBookService } from '../services/address.service';
import { BlockchainNetwork } from '../dto/wallet.dto';

@ApiTags('地址簿')
@Controller('web3-wallet/address-book')
export class AddressBookController {
  constructor(private readonly addressBookService: AddressBookService) {}

  @Get()
  @ApiOperation({ summary: '获取地址列表', description: '分页获取地址簿列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiQuery({ name: 'groupId', description: '分组ID', required: false })
  @ApiQuery({ name: 'keyword', description: '搜索关键词', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAddressList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Query('chain') chain?: BlockchainNetwork,
    @Query('groupId') groupId?: string,
    @Query('keyword') keyword?: string,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getAddressList(
      userId,
      chain,
      groupId,
      keyword,
      page,
      pageSize,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取地址详情', description: '根据ID获取地址详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '地址不存在' })
  async getAddressById(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getAddressById(userId, id);
  }

  @Post()
  @ApiOperation({ summary: '添加地址', description: '添加新地址到地址簿' })
  @ApiResponse({ status: 201, description: '添加成功' })
  async addAddress(
    @Body() dto: {
      address: string;
      chain: BlockchainNetwork;
      label: string;
      notes?: string;
      groupId?: string;
      tags?: string[];
      isFavorite?: boolean;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.addAddress(userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新地址', description: '更新地址信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAddress(
    @Param('id') id: string,
    @Body() dto: {
      label?: string;
      notes?: string;
      groupId?: string;
      tags?: string[];
      isFavorite?: boolean;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.updateAddress(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除地址', description: '从地址簿删除地址' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteAddress(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    await this.addressBookService.deleteAddress(userId, id);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '收藏地址', description: '将地址添加到收藏' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async addToFavorites(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.toggleFavorite(userId, id, true);
  }

  @Delete(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取消收藏', description: '取消收藏地址' })
  @ApiResponse({ status: 200, description: '操作成功' })
  async removeFromFavorites(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.toggleFavorite(userId, id, false);
  }

  @Get('favorites/list')
  @ApiOperation({ summary: '获取收藏列表', description: '获取收藏的地址列表' })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFavorites(
    @Query('chain') chain?: BlockchainNetwork,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getFavorites(userId, chain);
  }

  @Get('groups/list')
  @ApiOperation({ summary: '获取分组列表', description: '获取所有分组' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getGroups(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getGroups(userId);
  }

  @Post('groups')
  @ApiOperation({ summary: '创建分组', description: '创建新的地址分组' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createGroup(
    @Body() dto: { name: string; description?: string; color?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.createGroup(
      userId,
      dto.name,
      dto.description,
      dto.color,
    );
  }

  @Put('groups/:id')
  @ApiOperation({ summary: '更新分组', description: '更新分组信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; color?: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.updateGroup(userId, id, dto);
  }

  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除分组', description: '删除地址分组' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async deleteGroup(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    await this.addressBookService.deleteGroup(userId, id);
  }

  @Get('tags/all')
  @ApiOperation({ summary: '获取所有标签', description: '获取所有地址标签' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllTags(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    const tags = await this.addressBookService.getAllTags(userId);
    return { tags, total: tags.length };
  }

  @Get('tags/:tag')
  @ApiOperation({ summary: '按标签筛选地址', description: '获取指定标签的地址列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAddressesByTag(@Param('tag') tag: string, @Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getAddressesByTag(userId, tag);
  }

  @Get('search/query')
  @ApiOperation({ summary: '搜索地址', description: '搜索地址簿中的地址' })
  @ApiQuery({ name: 'q', description: '搜索关键词', required: true })
  @ApiQuery({ name: 'chain', description: '区块链网络', required: false, enum: BlockchainNetwork })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchAddresses(
    @Query('q') q: string,
    @Query('chain') chain?: BlockchainNetwork,
    @Req() req?: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.searchAddresses(userId, q, chain);
  }

  @Post('import/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量导入地址', description: '批量导入地址到地址簿' })
  @ApiResponse({ status: 200, description: '导入完成' })
  async batchImport(
    @Body() dto: {
      addresses: Array<{
        address: string;
        chain: BlockchainNetwork;
        label: string;
        notes?: string;
        groupId?: string;
        tags?: string[];
      }>;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.batchImport(userId, dto.addresses);
  }

  @Get('stats/info')
  @ApiOperation({ summary: '获取地址簿统计', description: '获取地址簿统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStats(@Req() req: any) {
    const userId = req.user?.userId || 'test_user';
    return this.addressBookService.getStats(userId);
  }
}
