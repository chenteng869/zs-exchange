/**
 * Web3 钱包模块定义
 *
 * 整合 Web3 钱包相关的所有组件
 * 包括 DTO、Service、Controller、Guard、Interceptor 等
 */

import { Module, Global, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { WalletService } from './services/wallet.service';
import { KeyService } from './services/key.service';
import { TransactionService } from './services/transaction.service';
import { ChainService } from './services/chain.service';
import { MPCService } from './services/mpc.service';
import { RiskService } from './services/risk.service';
import { AuditService } from './services/audit.service';
import { AddressBookService } from './services/address.service';
import { NotificationService } from './services/notification.service';
import { DAppService } from './services/dapp.service';

import { WalletController } from './controllers/wallet.controller';
import { KeyController } from './controllers/key.controller';
import { TransactionController } from './controllers/transaction.controller';
import { ChainController } from './controllers/chain.controller';
import { MPCController } from './controllers/mpc.controller';
import { RiskController } from './controllers/risk.controller';
import { AuditController } from './controllers/audit.controller';
import { AddressBookController } from './controllers/address.controller';
import { DAppController } from './controllers/dapp.controller';

import { WalletAuthGuard } from './guards/wallet-auth.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Global()
@Module({
  imports: [],
  controllers: [
    WalletController,
    KeyController,
    TransactionController,
    ChainController,
    MPCController,
    RiskController,
    AuditController,
    AddressBookController,
    DAppController,
  ],
  providers: [
    WalletService,
    KeyService,
    TransactionService,
    ChainService,
    MPCService,
    RiskService,
    AuditService,
    AddressBookService,
    NotificationService,
    DAppService,
    {
      provide: APP_GUARD,
      useClass: WalletAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [
    WalletService,
    KeyService,
    TransactionService,
    ChainService,
    MPCService,
    RiskService,
    AuditService,
    AddressBookService,
    NotificationService,
    DAppService,
  ],
})
export class Web3WalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  }
}

export * from './dto/wallet.dto';
export * from './dto/transaction.dto';
export * from './dto/key.dto';
export * from './dto/mpc.dto';
export * from './dto/risk.dto';
export * from './dto/audit.dto';

export * from './services/wallet.service';
export * from './services/key.service';
export * from './services/transaction.service';
export * from './services/chain.service';
export * from './services/mpc.service';
export * from './services/risk.service';
export * from './services/audit.service';
export * from './services/address.service';
export * from './services/notification.service';
export * from './services/dapp.service';

export * from './guards/wallet-auth.guard';
export * from './interceptors/audit.interceptor';
