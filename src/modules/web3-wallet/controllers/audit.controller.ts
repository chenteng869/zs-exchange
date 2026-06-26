/**
 * Web3 钱包模块 - 审计控制器
 *
 * 提供审计相关的 RESTful API 接口
 * 包括审计日志查询、变更日志、审计报告生成等
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
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuditService } from '../services/audit.service';
import {
  CreateAuditLogDto,
  AuditLogDto,
  AuditLogQueryDto,
  AuditLogStatsDto,
  ChangeLogQueryDto,
  AuditReportRequestDto,
  AuditReportDto,
  AuditLogType,
  OperationStatus,
} from '../dto/audit.dto';

@ApiTags('审计管理')
@Controller('web3-wallet/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post('logs')
  @ApiOperation({ summary: '创建审计日志', description: '创建新的审计日志' })
  @ApiResponse({ status: 201, description: '创建成功', type: AuditLogDto })
  async createAuditLog(@Body() dto: CreateAuditLogDto) {
    return this.auditService.createAuditLog(dto);
  }

  @Post('logs/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量创建审计日志', description: '批量创建审计日志' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async batchCreateAuditLogs(@Body() logs: CreateAuditLogDto[]) {
    const count = await this.auditService.batchCreateAuditLogs(logs);
    return { success: true, count };
  }

  @Get('logs')
  @ApiOperation({ summary: '查询审计日志', description: '分页查询审计日志' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiQuery({ name: 'action', description: '操作', required: false })
  @ApiQuery({ name: 'logType', description: '日志类型', required: false, enum: AuditLogType })
  @ApiQuery({ name: 'status', description: '状态', required: false, enum: OperationStatus })
  @ApiQuery({ name: 'resourceType', description: '资源类型', required: false })
  @ApiQuery({ name: 'startTime', description: '开始时间', required: false })
  @ApiQuery({ name: 'endTime', description: '结束时间', required: false })
  @ApiQuery({ name: 'keyword', description: '关键词', required: false })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.auditService.queryAuditLogs(query);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: '获取审计日志详情', description: '根据ID获取审计日志详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: AuditLogDto })
  @ApiResponse({ status: 404, description: '日志不存在' })
  async getAuditLogById(@Param('id') id: string) {
    return this.auditService.getAuditLogById(id);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取审计统计', description: '获取审计日志统计信息' })
  @ApiQuery({ name: 'userId', description: '用户ID', required: false })
  @ApiQuery({ name: 'startTime', description: '开始时间', required: false })
  @ApiQuery({ name: 'endTime', description: '结束时间', required: false })
  @ApiResponse({ status: 200, description: '获取成功', type: AuditLogStatsDto })
  async getAuditStats(
    @Query('userId') userId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.auditService.getAuditStats(
      userId,
      startTime ? parseInt(startTime) : undefined,
      endTime ? parseInt(endTime) : undefined,
    );
  }

  @Get('change-logs')
  @ApiOperation({ summary: '查询变更日志', description: '分页查询变更日志' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiQuery({ name: 'entityType', description: '实体类型', required: false })
  @ApiQuery({ name: 'entityId', description: '实体ID', required: false })
  @ApiQuery({ name: 'field', description: '字段', required: false })
  @ApiQuery({ name: 'changedBy', description: '变更人', required: false })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryChangeLogs(@Query() query: ChangeLogQueryDto) {
    return this.auditService.queryChangeLogs(query);
  }

  @Get('change-logs/entity/:entityType/:entityId')
  @ApiOperation({ summary: '获取实体变更历史', description: '获取指定实体的变更历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getEntityChangeHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityChangeHistory(entityType, entityId);
  }

  @Post('reports')
  @ApiOperation({ summary: '生成审计报告', description: '生成审计报告' })
  @ApiResponse({ status: 201, description: '生成成功', type: AuditReportDto })
  async generateAuditReport(@Body() dto: AuditReportRequestDto) {
    return this.auditService.generateAuditReport(dto);
  }

  @Get('reports/:reportId')
  @ApiOperation({ summary: '获取审计报告', description: '获取审计报告详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: AuditReportDto })
  @ApiResponse({ status: 404, description: '报告不存在' })
  async getAuditReport(@Param('reportId') reportId: string) {
    return this.auditService.getAuditReport(reportId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导出审计日志', description: '导出审计日志为 CSV/JSON/Excel' })
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportAuditLogs(
    @Body() dto: { query: AuditLogQueryDto; format: 'csv' | 'json' | 'excel' },
  ) {
    return this.auditService.exportAuditLogs(dto.query, dto.format);
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '清理过期日志', description: '清理指定天数前的审计日志' })
  @ApiResponse({ status: 200, description: '清理成功' })
  async cleanOldLogs(@Body('days') days: number = 90) {
    const count = await this.auditService.cleanOldLogs(days);
    return { success: true, cleanedCount: count };
  }

  @Get('types')
  @ApiOperation({ summary: '获取审计日志类型', description: '获取所有审计日志类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAuditLogTypes() {
    return {
      types: Object.values(AuditLogType),
      statuses: Object.values(OperationStatus),
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户操作日志', description: '获取指定用户的操作日志' })
  @ApiQuery({ name: 'page', description: '页码', required: false })
  @ApiQuery({ name: 'pageSize', description: '每页数量', required: false })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserAuditLogs(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    const query: AuditLogQueryDto = {
      page,
      pageSize,
      userId,
    };
    return this.auditService.queryAuditLogs(query);
  }
}
