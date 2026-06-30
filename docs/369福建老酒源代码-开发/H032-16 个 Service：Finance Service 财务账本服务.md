# H032\-16 个 Service：Finance Service 财务账本服务

下面继续第 16 个 Service：Finance Service 财务账本服务。



# 第 16 个 Service：Finance Service 财务账本服务



本服务负责：



```Plain Text
财务账户
财务流水
收入确认
成本池 / 市场池 / 公司池
奖励计提
退款冲销
结算单
财务报表基础
FinanceLedgerCreated / RevenueRecognized / SettlementCreated 事件预留
```



---



# 1\. Finance Service 目录结构



```Plain Text
apps/finance-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── health/
│   ├── shared/
│   │   ├── finance-errors.ts
│   │   ├── finance-events.ts
│   │   ├── finance-status.ts
│   │   └── finance-types.ts
│   └── modules/
│       ├── accounts/
│       │   ├── accounts.module.ts
│       │   ├── accounts.controller.ts
│       │   ├── accounts.admin.controller.ts
│       │   ├── accounts.repository.ts
│       │   ├── accounts.service.ts
│       │   └── dto/
│       │       ├── create-finance-account.dto.ts
│       │       └── query-finance-accounts.dto.ts
│       ├── ledgers/
│       │   ├── ledgers.module.ts
│       │   ├── ledgers.controller.ts
│       │   ├── ledgers.admin.controller.ts
│       │   ├── ledgers.repository.ts
│       │   ├── ledgers.service.ts
│       │   └── dto/
│       │       ├── create-finance-ledger.dto.ts
│       │       ├── reverse-finance-ledger.dto.ts
│       │       └── query-finance-ledgers.dto.ts
│       ├── settlements/
│       │   ├── settlements.module.ts
│       │   ├── settlements.controller.ts
│       │   ├── settlements.admin.controller.ts
│       │   ├── settlements.repository.ts
│       │   ├── settlements.service.ts
│       │   └── dto/
│       │       ├── create-finance-settlement.dto.ts
│       │       └── approve-finance-settlement.dto.ts
│       └── reports/
│           ├── reports.module.ts
│           ├── reports.controller.ts
│           ├── reports.repository.ts
│           └── reports.service.ts
```



---



# 2\. Prisma 补充表



## 2\.1 FinanceAccount



```Plain Text
model FinanceAccount {
  id               String   @id
  accountNo        String   @unique @map("account_no")
  accountName      String   @map("account_name")
  accountType      String   @map("account_type")
  currency         String
  availableBalance Decimal  @default(0) @map("available_balance") @db.Decimal(36, 18)
  frozenBalance    Decimal  @default(0) @map("frozen_balance") @db.Decimal(36, 18)
  totalDebit       Decimal  @default(0) @map("total_debit") @db.Decimal(36, 18)
  totalCredit      Decimal  @default(0) @map("total_credit") @db.Decimal(36, 18)
  accountStatus    String   @default("active") @map("account_status")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  metadata         Json?

  @@unique([accountType, currency])
  @@index([accountType])
  @@map("finance_accounts")
}
```



## 2\.2 FinanceLedger



```Plain Text
model FinanceLedger {
  id              String   @id
  ledgerNo        String   @unique @map("ledger_no")
  accountId       String   @map("account_id")
  accountType     String   @map("account_type")
  entryType       String   @map("entry_type")
  direction       String
  amount          Decimal  @db.Decimal(36, 18)
  currency        String
  balanceBefore   Decimal  @map("balance_before") @db.Decimal(36, 18)
  balanceAfter    Decimal  @map("balance_after") @db.Decimal(36, 18)
  sourceType      String   @map("source_type")
  sourceId        String   @map("source_id")
  orderId         String?  @map("order_id")
  userId          String?  @map("user_id")
  counterpartyId  String?  @map("counterparty_id")
  ruleVersion     String?  @map("rule_version")
  ledgerStatus    String   @default("posted") @map("ledger_status")
  reversedLedgerId String? @map("reversed_ledger_id")
  createdAt       DateTime @default(now()) @map("created_at")
  metadata        Json?

  @@index([accountId])
  @@index([accountType])
  @@index([sourceType, sourceId])
  @@index([orderId])
  @@map("finance_ledgers")
}
```



## 2\.3 FinanceSettlement



```Plain Text
model FinanceSettlement {
  id               String    @id
  settlementNo     String    @unique @map("settlement_no")
  settlementType   String    @map("settlement_type")
  targetType       String    @map("target_type")
  targetId         String    @map("target_id")
  grossAmount      Decimal   @map("gross_amount") @db.Decimal(36, 18)
  feeAmount        Decimal   @default(0) @map("fee_amount") @db.Decimal(36, 18)
  taxAmount        Decimal   @default(0) @map("tax_amount") @db.Decimal(36, 18)
  netAmount        Decimal   @map("net_amount") @db.Decimal(36, 18)
  currency         String
  settlementStatus String    @default("pending") @map("settlement_status")
  approvedBy       String?   @map("approved_by")
  approvedAt       DateTime? @map("approved_at")
  paidAt           DateTime? @map("paid_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  metadata         Json?

  @@index([targetType, targetId])
  @@index([settlementStatus])
  @@map("finance_settlements")
}
```



## 2\.4 FinanceDailySummary



```Plain Text
model FinanceDailySummary {
  id              String   @id
  summaryDate     String   @map("summary_date")
  accountType     String   @map("account_type")
  currency        String
  openingBalance  Decimal  @map("opening_balance") @db.Decimal(36, 18)
  debitAmount     Decimal  @default(0) @map("debit_amount") @db.Decimal(36, 18)
  creditAmount    Decimal  @default(0) @map("credit_amount") @db.Decimal(36, 18)
  closingBalance  Decimal  @map("closing_balance") @db.Decimal(36, 18)
  createdAt       DateTime @default(now()) @map("created_at")

  @@unique([summaryDate, accountType, currency])
  @@map("finance_daily_summaries")
}
```



---



# 3\. Shared 常量



`apps/finance-service/src/shared/finance-events.ts`



```TypeScript
export const FinanceEvents = {
  FINANCE_ACCOUNT_CREATED: 'finance.account_created.v1',
  FINANCE_LEDGER_CREATED: 'finance.ledger_created.v1',
  FINANCE_LEDGER_REVERSED: 'finance.ledger_reversed.v1',
  REVENUE_RECOGNIZED: 'finance.revenue_recognized.v1',
  SETTLEMENT_CREATED: 'finance.settlement_created.v1',
  SETTLEMENT_APPROVED: 'finance.settlement_approved.v1',
  SETTLEMENT_PAID: 'finance.settlement_paid.v1'
} as const;
```



`apps/finance-service/src/shared/finance-errors.ts`



```TypeScript
export const FinanceErrors = {
  ACCOUNT_NOT_FOUND: 'FINANCE_ACCOUNT_NOT_FOUND',
  ACCOUNT_ALREADY_EXISTS: 'FINANCE_ACCOUNT_ALREADY_EXISTS',
  ACCOUNT_STATUS_INVALID: 'FINANCE_ACCOUNT_STATUS_INVALID',
  LEDGER_NOT_FOUND: 'FINANCE_LEDGER_NOT_FOUND',
  LEDGER_ALREADY_REVERSED: 'FINANCE_LEDGER_ALREADY_REVERSED',
  LEDGER_AMOUNT_INVALID: 'FINANCE_LEDGER_AMOUNT_INVALID',
  LEDGER_DIRECTION_INVALID: 'FINANCE_LEDGER_DIRECTION_INVALID',
  SETTLEMENT_NOT_FOUND: 'FINANCE_SETTLEMENT_NOT_FOUND',
  SETTLEMENT_STATUS_INVALID: 'FINANCE_SETTLEMENT_STATUS_INVALID',
  AMOUNT_INVALID: 'FINANCE_AMOUNT_INVALID'
} as const;
```



`apps/finance-service/src/shared/finance-status.ts`



```TypeScript
export const FinanceAccountStatus = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed'
} as const;

export const FinanceLedgerStatus = {
  POSTED: 'posted',
  REVERSED: 'reversed',
  VOID: 'void'
} as const;

export const FinanceSettlementStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;
```



`apps/finance-service/src/shared/finance-types.ts`



```TypeScript
export const FinanceAccountTypes = {
  WINE_COST_POOL: 'wine_cost_pool',
  MARKET_ECOSYSTEM_POOL: 'market_ecosystem_pool',
  COMPANY_POOL: 'company_pool',
  REFERRAL_REWARD_PAYABLE: 'referral_reward_payable',
  TEAM_REWARD_PAYABLE: 'team_reward_payable',
  NODE_REWARD_PAYABLE: 'node_reward_payable',
  TAX_PAYABLE: 'tax_payable',
  MERCHANT_PAYABLE: 'merchant_payable',
  PLATFORM_CASH: 'platform_cash',
  REFUND_RESERVE: 'refund_reserve'
} as const;

export const FinanceEntryTypes = {
  REVENUE_ALLOCATION: 'revenue_allocation',
  REWARD_ACCRUAL: 'reward_accrual',
  SETTLEMENT: 'settlement',
  REFUND_REVERSAL: 'refund_reversal',
  TAX_ACCRUAL: 'tax_accrual',
  MANUAL_ADJUSTMENT: 'manual_adjustment'
} as const;

export const FinanceDirections = {
  DEBIT: 'debit',
  CREDIT: 'credit'
} as const;
```



---



# 4\. Accounts DTO



`apps/finance-service/src/modules/accounts/dto/create-finance-account.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateFinanceAccountDto {
  @IsString()
  account_name!: string;

  @IsString()
  account_type!: string;

  @IsString()
  currency!: string;
}
```



`apps/finance-service/src/modules/accounts/dto/query-finance-accounts.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryFinanceAccountsDto {
  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  account_status?: string;
}
```



---



# 5\. Accounts Repository / Service



`apps/finance-service/src/modules/accounts/accounts.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class AccountsRepository {
  findById(accountId: string) {
    return prisma.financeAccount.findUnique({
      where: { id: accountId }
    });
  }

  findByTypeAndCurrency(accountType: string, currency: string) {
    return prisma.financeAccount.findUnique({
      where: {
        accountType_currency: {
          accountType,
          currency
        }
      }
    });
  }

  findMany(params: {
    accountType?: string;
    currency?: string;
    accountStatus?: string;
  }) {
    return prisma.financeAccount.findMany({
      where: {
        accountType: params.accountType,
        currency: params.currency,
        accountStatus: params.accountStatus
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  create(data: {
    accountNo: string;
    accountName: string;
    accountType: string;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.financeAccount.create({
        data: {
          id: ulid(),
          accountNo: data.accountNo,
          accountName: data.accountName,
          accountType: data.accountType,
          currency: data.currency,
          accountStatus: 'active'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'finance.account_created.v1',
          payload: {
            account_id: account.id,
            account_no: account.accountNo,
            account_type: account.accountType,
            currency: account.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return account;
    });
  }
}
```



`apps/finance-service/src/modules/accounts/accounts.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { AccountsRepository } from './accounts.repository';
import { CreateFinanceAccountDto } from './dto/create-finance-account.dto';
import { QueryFinanceAccountsDto } from './dto/query-finance-accounts.dto';
import { FinanceErrors } from '../../shared/finance-errors';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async create(dto: CreateFinanceAccountDto) {
    const existing = await this.accountsRepository.findByTypeAndCurrency(
      dto.account_type,
      dto.currency
    );

    if (existing) {
      throw new Error(FinanceErrors.ACCOUNT_ALREADY_EXISTS);
    }

    const account = await this.accountsRepository.create({
      accountNo: this.generateAccountNo(),
      accountName: dto.account_name,
      accountType: dto.account_type,
      currency: dto.currency
    });

    return this.formatAccount(account);
  }

  async detail(accountId: string) {
    const account = await this.accountsRepository.findById(accountId);
    if (!account) throw new Error(FinanceErrors.ACCOUNT_NOT_FOUND);
    return this.formatAccount(account);
  }

  async list(query: QueryFinanceAccountsDto) {
    const items = await this.accountsRepository.findMany({
      accountType: query.account_type,
      currency: query.currency,
      accountStatus: query.account_status
    });

    return {
      items: items.map((item) => this.formatAccount(item))
    };
  }

  private formatAccount(account: any) {
    return {
      account_id: account.id,
      account_no: account.accountNo,
      account_name: account.accountName,
      account_type: account.accountType,
      currency: account.currency,
      available_balance: account.availableBalance.toString(),
      frozen_balance: account.frozenBalance.toString(),
      total_debit: account.totalDebit.toString(),
      total_credit: account.totalCredit.toString(),
      account_status: account.accountStatus
    };
  }

  private generateAccountNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FAC${date}${ulid()}`;
  }
}
```



---



# 6\. Accounts Controllers / Module



`apps/finance-service/src/modules/accounts/accounts.controller.ts`



```TypeScript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { QueryFinanceAccountsDto } from './dto/query-finance-accounts.dto';

@Controller('finance/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@Query() query: QueryFinanceAccountsDto) {
    return this.accountsService.list(query);
  }

  @Get(':account_id')
  detail(@Param('account_id') accountId: string) {
    return this.accountsService.detail(accountId);
  }
}
```



`apps/finance-service/src/modules/accounts/accounts.admin.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateFinanceAccountDto } from './dto/create-finance-account.dto';

@Controller('admin/finance/accounts')
export class AccountsAdminController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() dto: CreateFinanceAccountDto) {
    return this.accountsService.create(dto);
  }
}
```



`apps/finance-service/src/modules/accounts/accounts.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsAdminController } from './accounts.admin.controller';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';

@Module({
  controllers: [AccountsController, AccountsAdminController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService, AccountsRepository]
})
export class AccountsModule {}
```



---



# 7\. Ledgers DTO



`apps/finance-service/src/modules/ledgers/dto/create-finance-ledger.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class CreateFinanceLedgerDto {
  @IsString()
  account_type!: string;

  @IsString()
  entry_type!: string;

  @IsString()
  direction!: 'debit' | 'credit';

  @IsString()
  amount!: string;

  @IsString()
  currency!: string;

  @IsString()
  source_type!: string;

  @IsString()
  source_id!: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  counterparty_id?: string;

  @IsOptional()
  @IsString()
  rule_version?: string;
}
```



`apps/finance-service/src/modules/ledgers/dto/reverse-finance-ledger.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class ReverseFinanceLedgerDto {
  @IsString()
  reason!: string;

  @IsString()
  approval_id!: string;
}
```



`apps/finance-service/src/modules/ledgers/dto/query-finance-ledgers.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class QueryFinanceLedgersDto {
  @IsOptional()
  @IsString()
  account_type?: string;

  @IsOptional()
  @IsString()
  entry_type?: string;

  @IsOptional()
  @IsString()
  source_type?: string;

  @IsOptional()
  @IsString()
  source_id?: string;

  @IsOptional()
  @IsString()
  order_id?: string;

  @IsOptional()
  @IsString()
  ledger_status?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;
}
```



---



# 8\. Ledgers Repository



`apps/finance-service/src/modules/ledgers/ledgers.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class LedgersRepository {
  findAccount(accountType: string, currency: string) {
    return prisma.financeAccount.findUnique({
      where: {
        accountType_currency: {
          accountType,
          currency
        }
      }
    });
  }

  findById(ledgerId: string) {
    return prisma.financeLedger.findUnique({
      where: { id: ledgerId }
    });
  }

  findMany(params: {
    accountType?: string;
    entryType?: string;
    sourceType?: string;
    sourceId?: string;
    orderId?: string;
    ledgerStatus?: string;
    page: number;
    pageSize: number;
  }) {
    return prisma.financeLedger.findMany({
      where: {
        accountType: params.accountType,
        entryType: params.entryType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        orderId: params.orderId,
        ledgerStatus: params.ledgerStatus
      },
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize
    });
  }

  count(params: {
    accountType?: string;
    entryType?: string;
    sourceType?: string;
    sourceId?: string;
    orderId?: string;
    ledgerStatus?: string;
  }) {
    return prisma.financeLedger.count({
      where: {
        accountType: params.accountType,
        entryType: params.entryType,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        orderId: params.orderId,
        ledgerStatus: params.ledgerStatus
      }
    });
  }

  create(data: {
    ledgerNo: string;
    accountId: string;
    accountType: string;
    entryType: string;
    direction: string;
    amount: string;
    currency: string;
    sourceType: string;
    sourceId: string;
    orderId?: string;
    userId?: string;
    counterpartyId?: string;
    ruleVersion?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const account = await tx.financeAccount.findUniqueOrThrow({
        where: { id: data.accountId }
      });

      const amount = new Prisma.Decimal(data.amount);
      const balanceBefore = account.availableBalance;
      const balanceAfter =
        data.direction === 'debit'
          ? balanceBefore.sub(amount)
          : balanceBefore.add(amount);

      const ledger = await tx.financeLedger.create({
        data: {
          id: ulid(),
          ledgerNo: data.ledgerNo,
          accountId: data.accountId,
          accountType: data.accountType,
          entryType: data.entryType,
          direction: data.direction,
          amount,
          currency: data.currency,
          balanceBefore,
          balanceAfter,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          orderId: data.orderId,
          userId: data.userId,
          counterpartyId: data.counterpartyId,
          ruleVersion: data.ruleVersion,
          ledgerStatus: 'posted'
        }
      });

      await tx.financeAccount.update({
        where: { id: data.accountId },
        data: {
          availableBalance: balanceAfter,
          totalDebit:
            data.direction === 'debit'
              ? account.totalDebit.add(amount)
              : account.totalDebit,
          totalCredit:
            data.direction === 'credit'
              ? account.totalCredit.add(amount)
              : account.totalCredit
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'finance.ledger_created.v1',
          payload: {
            ledger_id: ledger.id,
            ledger_no: ledger.ledgerNo,
            account_type: ledger.accountType,
            entry_type: ledger.entryType,
            direction: ledger.direction,
            amount: ledger.amount.toString(),
            currency: ledger.currency,
            source_type: ledger.sourceType,
            source_id: ledger.sourceId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return ledger;
    });
  }

  reverse(data: {
    originalLedgerId: string;
    reverseLedgerNo: string;
    reason: string;
    approvalId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const original = await tx.financeLedger.findUniqueOrThrow({
        where: { id: data.originalLedgerId }
      });

      const account = await tx.financeAccount.findUniqueOrThrow({
        where: { id: original.accountId }
      });

      const reverseDirection =
        original.direction === 'debit' ? 'credit' : 'debit';

      const balanceBefore = account.availableBalance;
      const balanceAfter =
        reverseDirection === 'debit'
          ? balanceBefore.sub(original.amount)
          : balanceBefore.add(original.amount);

      const reverseLedger = await tx.financeLedger.create({
        data: {
          id: ulid(),
          ledgerNo: data.reverseLedgerNo,
          accountId: original.accountId,
          accountType: original.accountType,
          entryType: 'refund_reversal',
          direction: reverseDirection,
          amount: original.amount,
          currency: original.currency,
          balanceBefore,
          balanceAfter,
          sourceType: 'finance_ledger_reversal',
          sourceId: original.id,
          orderId: original.orderId,
          userId: original.userId,
          counterpartyId: original.counterpartyId,
          ruleVersion: original.ruleVersion,
          ledgerStatus: 'posted',
          reversedLedgerId: original.id,
          metadata: {
            reason: data.reason,
            approval_id: data.approvalId
          }
        }
      });

      await tx.financeLedger.update({
        where: { id: original.id },
        data: { ledgerStatus: 'reversed' }
      });

      await tx.financeAccount.update({
        where: { id: original.accountId },
        data: { availableBalance: balanceAfter }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'finance.ledger_reversed.v1',
          payload: {
            original_ledger_id: original.id,
            reverse_ledger_id: reverseLedger.id,
            reverse_ledger_no: reverseLedger.ledgerNo,
            amount: reverseLedger.amount.toString(),
            currency: reverseLedger.currency,
            approval_id: data.approvalId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return reverseLedger;
    });
  }
}
```



---



# 9\. Ledgers Service



`apps/finance-service/src/modules/ledgers/ledgers.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { LedgersRepository } from './ledgers.repository';
import { CreateFinanceLedgerDto } from './dto/create-finance-ledger.dto';
import { ReverseFinanceLedgerDto } from './dto/reverse-finance-ledger.dto';
import { QueryFinanceLedgersDto } from './dto/query-finance-ledgers.dto';
import { FinanceErrors } from '../../shared/finance-errors';
import { FinanceDirections, FinanceEntryTypes } from '../../shared/finance-types';
import { FinanceLedgerStatus } from '../../shared/finance-status';

@Injectable()
export class LedgersService {
  constructor(private readonly ledgersRepository: LedgersRepository) {}

  async create(dto: CreateFinanceLedgerDto) {
    if (new Decimal(dto.amount).lte(0)) {
      throw new Error(FinanceErrors.LEDGER_AMOUNT_INVALID);
    }

    if (![FinanceDirections.DEBIT, FinanceDirections.CREDIT].includes(dto.direction as any)) {
      throw new Error(FinanceErrors.LEDGER_DIRECTION_INVALID);
    }

    const account = await this.ledgersRepository.findAccount(
      dto.account_type,
      dto.currency
    );

    if (!account) {
      throw new Error(FinanceErrors.ACCOUNT_NOT_FOUND);
    }

    const ledger = await this.ledgersRepository.create({
      ledgerNo: this.generateLedgerNo(),
      accountId: account.id,
      accountType: dto.account_type,
      entryType: dto.entry_type,
      direction: dto.direction,
      amount: new Decimal(dto.amount).toFixed(18),
      currency: dto.currency,
      sourceType: dto.source_type,
      sourceId: dto.source_id,
      orderId: dto.order_id,
      userId: dto.user_id,
      counterpartyId: dto.counterparty_id,
      ruleVersion: dto.rule_version
    });

    return this.formatLedger(ledger);
  }

  async reverse(ledgerId: string, dto: ReverseFinanceLedgerDto) {
    const ledger = await this.ledgersRepository.findById(ledgerId);

    if (!ledger) {
      throw new Error(FinanceErrors.LEDGER_NOT_FOUND);
    }

    if (ledger.ledgerStatus === FinanceLedgerStatus.REVERSED) {
      throw new Error(FinanceErrors.LEDGER_ALREADY_REVERSED);
    }

    const reversed = await this.ledgersRepository.reverse({
      originalLedgerId: ledgerId,
      reverseLedgerNo: this.generateLedgerNo(),
      reason: dto.reason,
      approvalId: dto.approval_id
    });

    return this.formatLedger(reversed);
  }

  async list(query: QueryFinanceLedgersDto) {
    const page = Number(query.page || 1);
    const pageSize = Math.min(Number(query.page_size || 20), 100);

    const [items, total] = await Promise.all([
      this.ledgersRepository.findMany({
        accountType: query.account_type,
        entryType: query.entry_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        orderId: query.order_id,
        ledgerStatus: query.ledger_status,
        page,
        pageSize
      }),
      this.ledgersRepository.count({
        accountType: query.account_type,
        entryType: query.entry_type,
        sourceType: query.source_type,
        sourceId: query.source_id,
        orderId: query.order_id,
        ledgerStatus: query.ledger_status
      })
    ]);

    return {
      items: items.map((item) => this.formatLedger(item)),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize)
      }
    };
  }

  async recognizeWine369Revenue(params: {
    order_id: string;
    user_id: string;
    currency: string;
    cost_pool_amount: string;
    market_pool_amount: string;
    company_pool_amount: string;
    source_id: string;
    rule_version: string;
  }) {
    const ledgers = [];

    ledgers.push(
      await this.create({
        account_type: 'wine_cost_pool',
        entry_type: FinanceEntryTypes.REVENUE_ALLOCATION,
        direction: 'credit',
        amount: params.cost_pool_amount,
        currency: params.currency,
        source_type: 'revenue_allocation',
        source_id: params.source_id,
        order_id: params.order_id,
        user_id: params.user_id,
        rule_version: params.rule_version
      })
    );

    ledgers.push(
      await this.create({
        account_type: 'market_ecosystem_pool',
        entry_type: FinanceEntryTypes.REVENUE_ALLOCATION,
        direction: 'credit',
        amount: params.market_pool_amount,
        currency: params.currency,
        source_type: 'revenue_allocation',
        source_id: params.source_id,
        order_id: params.order_id,
        user_id: params.user_id,
        rule_version: params.rule_version
      })
    );

    ledgers.push(
      await this.create({
        account_type: 'company_pool',
        entry_type: FinanceEntryTypes.REVENUE_ALLOCATION,
        direction: 'credit',
        amount: params.company_pool_amount,
        currency: params.currency,
        source_type: 'revenue_allocation',
        source_id: params.source_id,
        order_id: params.order_id,
        user_id: params.user_id,
        rule_version: params.rule_version
      })
    );

    return {
      order_id: params.order_id,
      source_id: params.source_id,
      ledgers
    };
  }

  private formatLedger(ledger: any) {
    return {
      ledger_id: ledger.id,
      ledger_no: ledger.ledgerNo,
      account_id: ledger.accountId,
      account_type: ledger.accountType,
      entry_type: ledger.entryType,
      direction: ledger.direction,
      amount: ledger.amount.toString(),
      currency: ledger.currency,
      balance_before: ledger.balanceBefore.toString(),
      balance_after: ledger.balanceAfter.toString(),
      source_type: ledger.sourceType,
      source_id: ledger.sourceId,
      order_id: ledger.orderId,
      user_id: ledger.userId,
      ledger_status: ledger.ledgerStatus,
      reversed_ledger_id: ledger.reversedLedgerId,
      created_at: ledger.createdAt
    };
  }

  private generateLedgerNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FLD${date}${ulid()}`;
  }
}
```



---



# 10\. Ledgers Controllers / Module



`apps/finance-service/src/modules/ledgers/ledgers.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { LedgersService } from './ledgers.service';
import { QueryFinanceLedgersDto } from './dto/query-finance-ledgers.dto';

@Controller('finance/ledgers')
export class LedgersController {
  constructor(private readonly ledgersService: LedgersService) {}

  @Get()
  list(@Query() query: QueryFinanceLedgersDto) {
    return this.ledgersService.list(query);
  }
}
```



`apps/finance-service/src/modules/ledgers/ledgers.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { LedgersService } from './ledgers.service';
import { CreateFinanceLedgerDto } from './dto/create-finance-ledger.dto';
import { ReverseFinanceLedgerDto } from './dto/reverse-finance-ledger.dto';

@Controller('admin/finance/ledgers')
export class LedgersAdminController {
  constructor(private readonly ledgersService: LedgersService) {}

  @Post()
  create(@Body() dto: CreateFinanceLedgerDto) {
    return this.ledgersService.create(dto);
  }

  @Post(':ledger_id/reverse')
  reverse(
    @Param('ledger_id') ledgerId: string,
    @Body() dto: ReverseFinanceLedgerDto
  ) {
    return this.ledgersService.reverse(ledgerId, dto);
  }

  @Post('recognize-wine-369-revenue')
  recognizeWine369Revenue(@Body() dto: {
    order_id: string;
    user_id: string;
    currency: string;
    cost_pool_amount: string;
    market_pool_amount: string;
    company_pool_amount: string;
    source_id: string;
    rule_version: string;
  }) {
    return this.ledgersService.recognizeWine369Revenue(dto);
  }
}
```



`apps/finance-service/src/modules/ledgers/ledgers.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { LedgersController } from './ledgers.controller';
import { LedgersAdminController } from './ledgers.admin.controller';
import { LedgersService } from './ledgers.service';
import { LedgersRepository } from './ledgers.repository';

@Module({
  controllers: [LedgersController, LedgersAdminController],
  providers: [LedgersService, LedgersRepository],
  exports: [LedgersService]
})
export class LedgersModule {}
```



---



# 11\. Settlements DTO



`apps/finance-service/src/modules/settlements/dto/create-finance-settlement.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class CreateFinanceSettlementDto {
  @IsString()
  settlement_type!: string;

  @IsString()
  target_type!: string;

  @IsString()
  target_id!: string;

  @IsString()
  gross_amount!: string;

  @IsString()
  fee_amount!: string;

  @IsString()
  tax_amount!: string;

  @IsString()
  currency!: string;
}
```



`apps/finance-service/src/modules/settlements/dto/approve-finance-settlement.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class ApproveFinanceSettlementDto {
  @IsString()
  reviewer_id!: string;

  @IsOptional()
  @IsString()
  review_note?: string;
}
```



---



# 12\. Settlements Repository / Service



`apps/finance-service/src/modules/settlements/settlements.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class SettlementsRepository {
  findById(settlementId: string) {
    return prisma.financeSettlement.findUnique({
      where: { id: settlementId }
    });
  }

  create(data: {
    settlementNo: string;
    settlementType: string;
    targetType: string;
    targetId: string;
    grossAmount: string;
    feeAmount: string;
    taxAmount: string;
    netAmount: string;
    currency: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const settlement = await tx.financeSettlement.create({
        data: {
          id: ulid(),
          settlementNo: data.settlementNo,
          settlementType: data.settlementType,
          targetType: data.targetType,
          targetId: data.targetId,
          grossAmount: new Prisma.Decimal(data.grossAmount),
          feeAmount: new Prisma.Decimal(data.feeAmount),
          taxAmount: new Prisma.Decimal(data.taxAmount),
          netAmount: new Prisma.Decimal(data.netAmount),
          currency: data.currency,
          settlementStatus: 'pending'
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'finance.settlement_created.v1',
          payload: {
            settlement_id: settlement.id,
            settlement_no: settlement.settlementNo,
            settlement_type: settlement.settlementType,
            target_type: settlement.targetType,
            target_id: settlement.targetId,
            net_amount: settlement.netAmount.toString(),
            currency: settlement.currency
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return settlement;
    });
  }

  approve(settlementId: string, reviewerId: string, reviewNote?: string) {
    return prisma.$transaction(async (tx) => {
      const settlement = await tx.financeSettlement.update({
        where: { id: settlementId },
        data: {
          settlementStatus: 'approved',
          approvedBy: reviewerId,
          approvedAt: new Date(),
          metadata: reviewNote ? { review_note: reviewNote } : undefined
        }
      });

      await tx.outboxEvent.create({
        data: {
          id: ulid(),
          eventType: 'finance.settlement_approved.v1',
          payload: {
            settlement_id: settlement.id,
            settlement_no: settlement.settlementNo,
            reviewer_id: reviewerId
          },
          status: 'pending',
          retryCount: 0
        }
      });

      return settlement;
    });
  }
}
```



`apps/finance-service/src/modules/settlements/settlements.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ulid } from 'ulid';
import { SettlementsRepository } from './settlements.repository';
import { CreateFinanceSettlementDto } from './dto/create-finance-settlement.dto';
import { ApproveFinanceSettlementDto } from './dto/approve-finance-settlement.dto';
import { FinanceErrors } from '../../shared/finance-errors';
import { FinanceSettlementStatus } from '../../shared/finance-status';

@Injectable()
export class SettlementsService {
  constructor(private readonly settlementsRepository: SettlementsRepository) {}

  async create(dto: CreateFinanceSettlementDto) {
    const gross = new Decimal(dto.gross_amount);
    const fee = new Decimal(dto.fee_amount);
    const tax = new Decimal(dto.tax_amount);

    if (gross.lte(0) || fee.lt(0) || tax.lt(0)) {
      throw new Error(FinanceErrors.AMOUNT_INVALID);
    }

    const net = gross.sub(fee).sub(tax);
    if (net.lt(0)) {
      throw new Error(FinanceErrors.AMOUNT_INVALID);
    }

    const settlement = await this.settlementsRepository.create({
      settlementNo: this.generateSettlementNo(),
      settlementType: dto.settlement_type,
      targetType: dto.target_type,
      targetId: dto.target_id,
      grossAmount: gross.toFixed(18),
      feeAmount: fee.toFixed(18),
      taxAmount: tax.toFixed(18),
      netAmount: net.toFixed(18),
      currency: dto.currency
    });

    return this.formatSettlement(settlement);
  }

  async approve(settlementId: string, dto: ApproveFinanceSettlementDto) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) throw new Error(FinanceErrors.SETTLEMENT_NOT_FOUND);

    if (settlement.settlementStatus !== FinanceSettlementStatus.PENDING) {
      throw new Error(FinanceErrors.SETTLEMENT_STATUS_INVALID);
    }

    const updated = await this.settlementsRepository.approve(
      settlementId,
      dto.reviewer_id,
      dto.review_note
    );

    return this.formatSettlement(updated);
  }

  async detail(settlementId: string) {
    const settlement = await this.settlementsRepository.findById(settlementId);
    if (!settlement) throw new Error(FinanceErrors.SETTLEMENT_NOT_FOUND);
    return this.formatSettlement(settlement);
  }

  private formatSettlement(settlement: any) {
    return {
      settlement_id: settlement.id,
      settlement_no: settlement.settlementNo,
      settlement_type: settlement.settlementType,
      target_type: settlement.targetType,
      target_id: settlement.targetId,
      gross_amount: settlement.grossAmount.toString(),
      fee_amount: settlement.feeAmount.toString(),
      tax_amount: settlement.taxAmount.toString(),
      net_amount: settlement.netAmount.toString(),
      currency: settlement.currency,
      settlement_status: settlement.settlementStatus,
      approved_by: settlement.approvedBy,
      approved_at: settlement.approvedAt,
      paid_at: settlement.paidAt
    };
  }

  private generateSettlementNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `FST${date}${ulid()}`;
  }
}
```



---



# 13\. Settlements Controllers / Module



`apps/finance-service/src/modules/settlements/settlements.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { SettlementsService } from './settlements.service';

@Controller('finance/settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get(':settlement_id')
  detail(@Param('settlement_id') settlementId: string) {
    return this.settlementsService.detail(settlementId);
  }
}
```



`apps/finance-service/src/modules/settlements/settlements.admin.controller.ts`



```TypeScript
import { Body, Controller, Param, Post } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateFinanceSettlementDto } from './dto/create-finance-settlement.dto';
import { ApproveFinanceSettlementDto } from './dto/approve-finance-settlement.dto';

@Controller('admin/finance/settlements')
export class SettlementsAdminController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  create(@Body() dto: CreateFinanceSettlementDto) {
    return this.settlementsService.create(dto);
  }

  @Post(':settlement_id/approve')
  approve(
    @Param('settlement_id') settlementId: string,
    @Body() dto: ApproveFinanceSettlementDto
  ) {
    return this.settlementsService.approve(settlementId, dto);
  }
}
```



`apps/finance-service/src/modules/settlements/settlements.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { SettlementsController } from './settlements.controller';
import { SettlementsAdminController } from './settlements.admin.controller';
import { SettlementsService } from './settlements.service';
import { SettlementsRepository } from './settlements.repository';

@Module({
  controllers: [SettlementsController, SettlementsAdminController],
  providers: [SettlementsService, SettlementsRepository],
  exports: [SettlementsService]
})
export class SettlementsModule {}
```



---



# 14\. Reports Repository / Service



`apps/finance-service/src/modules/reports/reports.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ReportsRepository {
  async accountSummary(params: {
    currency?: string;
    accountType?: string;
  }) {
    return prisma.financeAccount.findMany({
      where: {
        currency: params.currency,
        accountType: params.accountType
      },
      orderBy: { accountType: 'asc' }
    });
  }

  async ledgerSummary(params: {
    currency?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    return prisma.financeLedger.groupBy({
      by: ['accountType', 'entryType', 'direction', 'currency'],
      where: {
        currency: params.currency,
        createdAt: {
          gte: params.startTime,
          lte: params.endTime
        }
      },
      _sum: {
        amount: true
      }
    });
  }
}
```



`apps/finance-service/src/modules/reports/reports.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async accountSummary(query: { currency?: string; account_type?: string }) {
    const items = await this.reportsRepository.accountSummary({
      currency: query.currency,
      accountType: query.account_type
    });

    return {
      items: items.map((item) => ({
        account_type: item.accountType,
        account_name: item.accountName,
        currency: item.currency,
        available_balance: item.availableBalance.toString(),
        frozen_balance: item.frozenBalance.toString(),
        total_debit: item.totalDebit.toString(),
        total_credit: item.totalCredit.toString()
      }))
    };
  }

  async ledgerSummary(query: {
    currency?: string;
    start_time?: string;
    end_time?: string;
  }) {
    const items = await this.reportsRepository.ledgerSummary({
      currency: query.currency,
      startTime: query.start_time ? new Date(query.start_time) : undefined,
      endTime: query.end_time ? new Date(query.end_time) : undefined
    });

    return {
      items: items.map((item) => ({
        account_type: item.accountType,
        entry_type: item.entryType,
        direction: item.direction,
        currency: item.currency,
        amount: item._sum.amount?.toString() || '0.000000000000000000'
      }))
    };
  }
}
```



`apps/finance-service/src/modules/reports/reports.controller.ts`



```TypeScript
import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('finance/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('accounts-summary')
  accountSummary(@Query() query: { currency?: string; account_type?: string }) {
    return this.reportsService.accountSummary(query);
  }

  @Get('ledgers-summary')
  ledgerSummary(
    @Query()
    query: {
      currency?: string;
      start_time?: string;
      end_time?: string;
    }
  ) {
    return this.reportsService.ledgerSummary(query);
  }
}
```



`apps/finance-service/src/modules/reports/reports.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService]
})
export class ReportsModule {}
```



---



# 15\. Finance App Module



`apps/finance-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { LedgersModule } from './modules/ledgers/ledgers.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    HealthModule,
    AccountsModule,
    LedgersModule,
    SettlementsModule,
    ReportsModule
  ]
})
export class AppModule {}
```



---



# 16\. Finance Service 当前 API



## 用户端 / 查询端



```HTTP
GET /api/v1/finance/accounts
GET /api/v1/finance/accounts/:account_id
GET /api/v1/finance/ledgers
GET /api/v1/finance/settlements/:settlement_id
GET /api/v1/finance/reports/accounts-summary
GET /api/v1/finance/reports/ledgers-summary
```



## 后台端



```HTTP
POST /api/v1/admin/finance/accounts
POST /api/v1/admin/finance/ledgers
POST /api/v1/admin/finance/ledgers/:ledger_id/reverse
POST /api/v1/admin/finance/ledgers/recognize-wine-369-revenue
POST /api/v1/admin/finance/settlements
POST /api/v1/admin/finance/settlements/:settlement_id/approve
```



---



# 17\. 369 分账入账验证



Revenue Service 分出：



```Plain Text
wine_cost_pool = 147.6
market_ecosystem_pool = 110.7
company_pool = 110.7
```



Finance Service 入账后：



```JSON
{
  "ledgers": [
    {
      "account_type": "wine_cost_pool",
      "direction": "credit",
      "amount": "147.600000000000000000"
    },
    {
      "account_type": "market_ecosystem_pool",
      "direction": "credit",
      "amount": "110.700000000000000000"
    },
    {
      "account_type": "company_pool",
      "direction": "credit",
      "amount": "110.700000000000000000"
    }
  ]
}
```



---



# 18\. Finance Service 已具备能力



这一版完成后，Finance Service 支持：



```Plain Text
财务账户创建
财务账户查询
财务流水创建
财务流水查询
财务流水冲销
369 分账收入确认
结算单创建
结算单审核
账户汇总报表
流水汇总报表
Finance outbox 事件
```



---



# 19\. 后续必须补强



```Plain Text
统一 AppException
PrismaModule 注入
复式记账严格借贷平衡
会计科目表
结算付款状态联动
真实 Tax Service 联动
真实 Approval Service 联动
真实 Audit Log
Admin 权限 Guard
日报 / 月报批处理
财务关账
```



---



# 20\. 下一步继续



按 23 个 Service 顺序，下一步写：



```Plain Text
17. Tax Service 税务服务
```



下一步会覆盖：



```Plain Text
税务规则
订单税
佣金税
VAT / GST / 销售税
税务记录
税务报表
税务支付状态
```



