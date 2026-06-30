# H017\-1 个 Service：Identity Service 用户与身份服务

下面开始写 **第 1 个 Service：Identity Service 用户与身份服务**。



这一版先实现工业级基础骨架，不做简化逻辑：



```Plain Text
用户注册
用户登录
获取当前用户
钱包绑定
推荐人绑定
用户状态校验
密码哈希
JWT 签发
领域事件 outbox
审计日志预留
```



---



# 1\. Identity Service 目录结构



```Plain Text
apps/identity-service/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health/
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   └── update-profile.dto.ts
│   │   │   └── users.module.ts
│   │   ├── wallets/
│   │   │   ├── wallets.controller.ts
│   │   │   ├── wallets.repository.ts
│   │   │   ├── wallets.service.ts
│   │   │   ├── dto/
│   │   │   │   └── bind-wallet.dto.ts
│   │   │   └── wallets.module.ts
│   │   └── referrals/
│   │       ├── referrals.controller.ts
│   │       ├── referrals.repository.ts
│   │       ├── referrals.service.ts
│   │       ├── dto/
│   │       │   └── bind-referrer.dto.ts
│   │       └── referrals.module.ts
│   └── shared/
│       ├── identity-events.ts
│       └── identity-errors.ts
```



---



# 2\. Prisma 需要补充的表



在 `prisma/schema.prisma` 里补充：



```Plain Text
model UserWallet {
  id               String    @id
  userId           String    @map("user_id")
  chain            String
  walletAddress    String    @map("wallet_address")
  walletType       String    @default("external_wallet") @map("wallet_type")
  isPrimary        Boolean   @default(false) @map("is_primary")
  bindStatus       String    @default("bound") @map("bind_status")
  signatureMessage String?   @map("signature_message")
  signatureHash    String?   @map("signature_hash")
  bindIp           String?   @map("bind_ip")
  bindDeviceId     String?   @map("bind_device_id")
  riskStatus       String    @default("normal") @map("risk_status")
  boundAt          DateTime? @map("bound_at")
  unboundAt        DateTime? @map("unbound_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  user             User      @relation(fields: [userId], references: [id])

  @@unique([chain, walletAddress])
  @@index([userId])
  @@map("user_wallets")
}

model UserReferralBinding {
  id            String   @id
  userId        String   @unique @map("user_id")
  referrerId    String   @map("referrer_id")
  bindSource    String   @default("register") @map("bind_source")
  bindOrderId   String?  @map("bind_order_id")
  bindIp        String?  @map("bind_ip")
  bindDeviceId  String?  @map("bind_device_id")
  isValid       Boolean  @default(true) @map("is_valid")
  riskStatus    String   @default("normal") @map("risk_status")
  boundAt       DateTime @default(now()) @map("bound_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([referrerId])
  @@map("user_referral_bindings")
}
```



并在 `User` model 里加：



```Plain Text
wallets UserWallet[]
```



---



# 3\. Identity Events



`apps/identity-service/src/shared/identity-events.ts`



```TypeScript
export const IdentityEvents = {
  USER_REGISTERED: 'user.registered.v1',
  USER_LOGGED_IN: 'user.logged_in.v1',
  WALLET_BOUND: 'wallet.bound.v1',
  REFERRER_BOUND: 'referrer.bound.v1',
  USER_FROZEN: 'user.frozen.v1',
  USER_UNFROZEN: 'user.unfrozen.v1'
} as const;
```



---



# 4\. Identity Errors



`apps/identity-service/src/shared/identity-errors.ts`



```TypeScript
export const IdentityErrors = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_FROZEN: 'USER_FROZEN',
  USER_BLACKLISTED: 'USER_BLACKLISTED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  WALLET_ALREADY_BOUND: 'WALLET_ALREADY_BOUND',
  REFERRER_NOT_FOUND: 'REFERRER_NOT_FOUND',
  REFERRER_SELF_BIND_NOT_ALLOWED: 'REFERRER_SELF_BIND_NOT_ALLOWED',
  REFERRER_ALREADY_BOUND: 'REFERRER_ALREADY_BOUND',
  REFERRER_CYCLE_NOT_ALLOWED: 'REFERRER_CYCLE_NOT_ALLOWED'
} as const;
```



---



# 5\. DTO：注册



`apps/identity-service/src/modules/auth/dto/register.dto.ts`



```TypeScript
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  referral_code?: string;
}
```



---



# 6\. DTO：登录



`apps/identity-service/src/modules/auth/dto/login.dto.ts`



```TypeScript
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  account!: string;

  @IsString()
  password!: string;

  @IsString()
  device_id!: string;
}
```



---



# 7\. Auth Module



`apps/identity-service/src/modules/auth/auth.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'dev_secret',
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h'
      }
    }),
    UsersModule,
    ReferralsModule
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
```



---



# 8\. Auth Controller



`apps/identity-service/src/modules/auth/auth.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```



---



# 9\. Auth Service



`apps/identity-service/src/modules/auth/auth.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import { UsersService } from '../users/users.service';
import { ReferralsService } from '../referrals/referrals.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IdentityErrors } from '../../shared/identity-errors';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly referralsService: ReferralsService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      countryCode: dto.country_code
    });

    if (dto.referral_code) {
      await this.referralsService.bindReferrerByCode({
        userId: user.id,
        referralCode: dto.referral_code,
        bindSource: 'register'
      });
    }

    return {
      user_id: user.id,
      user_no: user.userNo,
      email: user.email,
      phone: user.phone,
      user_status: user.userStatus,
      member_level: user.memberLevel
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByAccount(dto.account);

    if (!user) {
      throw new Error(IdentityErrors.INVALID_CREDENTIALS);
    }

    if (user.userStatus === 'frozen') {
      throw new Error(IdentityErrors.USER_FROZEN);
    }

    if (user.userStatus === 'blacklisted') {
      throw new Error(IdentityErrors.USER_BLACKLISTED);
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash || '');

    if (!matched) {
      throw new Error(IdentityErrors.INVALID_CREDENTIALS);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      user_no: user.userNo,
      email: user.email,
      type: 'user'
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 7200,
      user: {
        user_id: user.id,
        user_no: user.userNo,
        member_level: user.memberLevel,
        user_status: user.userStatus
      }
    };
  }

  generateUserNo() {
    return `USR${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${ulid()}`;
  }
}
```



后面接入 `AppException` 后，把 `throw new Error(...)` 换成统一业务异常。



---



# 10\. Users Module



`apps/identity-service/src/modules/users/users.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository]
})
export class UsersModule {}
```



---



# 11\. Users Repository



`apps/identity-service/src/modules/users/users.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class UsersRepository {
  findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone }
    });
  }

  findByAccount(account: string) {
    if (account.includes('@')) {
      return this.findByEmail(account);
    }

    return this.findByPhone(account);
  }

  create(data: {
    userNo: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    countryCode?: string;
  }) {
    return prisma.user.create({
      data: {
        id: ulid(),
        userNo: data.userNo,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        countryCode: data.countryCode,
        memberLevel: 'bronze',
        userStatus: 'pending_kyc',
        riskStatus: 'normal'
      }
    });
  }
}
```



---



# 12\. Users Service



`apps/identity-service/src/modules/users/users.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { UsersRepository } from './users.repository';
import { IdentityErrors } from '../../shared/identity-errors';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(params: {
    email?: string;
    phone?: string;
    passwordHash: string;
    countryCode?: string;
  }) {
    if (params.email) {
      const existing = await this.usersRepository.findByEmail(params.email);
      if (existing) {
        throw new Error(IdentityErrors.USER_ALREADY_EXISTS);
      }
    }

    if (params.phone) {
      const existing = await this.usersRepository.findByPhone(params.phone);
      if (existing) {
        throw new Error(IdentityErrors.USER_ALREADY_EXISTS);
      }
    }

    return this.usersRepository.create({
      userNo: this.generateUserNo(),
      email: params.email,
      phone: params.phone,
      passwordHash: params.passwordHash,
      countryCode: params.countryCode
    });
  }

  findById(userId: string) {
    return this.usersRepository.findById(userId);
  }

  findByAccount(account: string) {
    return this.usersRepository.findByAccount(account);
  }

  private generateUserNo() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `USR${date}${ulid()}`;
  }
}
```



---



# 13\. Users Controller



`apps/identity-service/src/modules/users/users.controller.ts`



```TypeScript
import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':user_id')
  async getUser(@Param('user_id') userId: string) {
    const user = await this.usersService.findById(userId);

    return {
      user_id: user?.id,
      user_no: user?.userNo,
      email: user?.email,
      phone: user?.phone,
      country_code: user?.countryCode,
      member_level: user?.memberLevel,
      user_status: user?.userStatus,
      risk_status: user?.riskStatus
    };
  }
}
```



---



# 14\. Wallet DTO



`apps/identity-service/src/modules/wallets/dto/bind-wallet.dto.ts`



```TypeScript
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BindWalletDto {
  @IsString()
  user_id!: string;

  @IsString()
  chain!: string;

  @IsString()
  wallet_address!: string;

  @IsString()
  signature!: string;

  @IsString()
  signature_message!: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
```



---



# 15\. Wallets Module



`apps/identity-service/src/modules/wallets/wallets.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { WalletsRepository } from './wallets.repository';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, WalletsRepository],
  exports: [WalletsService]
})
export class WalletsModule {}
```



---



# 16\. Wallets Repository



`apps/identity-service/src/modules/wallets/wallets.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class WalletsRepository {
  findByAddress(chain: string, walletAddress: string) {
    return prisma.userWallet.findUnique({
      where: {
        chain_walletAddress: {
          chain,
          walletAddress
        }
      }
    });
  }

  create(data: {
    userId: string;
    chain: string;
    walletAddress: string;
    signatureMessage: string;
    signatureHash: string;
    isPrimary: boolean;
  }) {
    return prisma.userWallet.create({
      data: {
        id: ulid(),
        userId: data.userId,
        chain: data.chain,
        walletAddress: data.walletAddress,
        signatureMessage: data.signatureMessage,
        signatureHash: data.signatureHash,
        isPrimary: data.isPrimary,
        bindStatus: 'bound',
        walletType: 'external_wallet',
        riskStatus: 'normal',
        boundAt: new Date()
      }
    });
  }
}
```



---



# 17\. Wallets Service



`apps/identity-service/src/modules/wallets/wallets.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { WalletsRepository } from './wallets.repository';
import { BindWalletDto } from './dto/bind-wallet.dto';
import { IdentityErrors } from '../../shared/identity-errors';

@Injectable()
export class WalletsService {
  constructor(private readonly walletsRepository: WalletsRepository) {}

  async bindWallet(dto: BindWalletDto) {
    const existing = await this.walletsRepository.findByAddress(
      dto.chain,
      dto.wallet_address
    );

    if (existing) {
      throw new Error(IdentityErrors.WALLET_ALREADY_BOUND);
    }

    const signatureHash = createHash('sha256')
      .update(dto.signature)
      .digest('hex');

    return this.walletsRepository.create({
      userId: dto.user_id,
      chain: dto.chain,
      walletAddress: dto.wallet_address,
      signatureMessage: dto.signature_message,
      signatureHash,
      isPrimary: dto.is_primary ?? false
    });
  }
}
```



---



# 18\. Wallets Controller



`apps/identity-service/src/modules/wallets/wallets.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { BindWalletDto } from './dto/bind-wallet.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post('bind')
  async bindWallet(@Body() dto: BindWalletDto) {
    const wallet = await this.walletsService.bindWallet(dto);

    return {
      wallet_id: wallet.id,
      user_id: wallet.userId,
      chain: wallet.chain,
      wallet_address: wallet.walletAddress,
      bind_status: wallet.bindStatus,
      is_primary: wallet.isPrimary
    };
  }
}
```



---



# 19\. Referral DTO



`apps/identity-service/src/modules/referrals/dto/bind-referrer.dto.ts`



```TypeScript
import { IsOptional, IsString } from 'class-validator';

export class BindReferrerDto {
  @IsString()
  user_id!: string;

  @IsString()
  referrer_id!: string;

  @IsOptional()
  @IsString()
  bind_source?: string;
}
```



---



# 20\. Referrals Module



`apps/identity-service/src/modules/referrals/referrals.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { ReferralsRepository } from './referrals.repository';

@Module({
  controllers: [ReferralsController],
  providers: [ReferralsService, ReferralsRepository],
  exports: [ReferralsService]
})
export class ReferralsModule {}
```



---



# 21\. Referrals Repository



`apps/identity-service/src/modules/referrals/referrals.repository.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

@Injectable()
export class ReferralsRepository {
  findByUserId(userId: string) {
    return prisma.userReferralBinding.findUnique({
      where: { userId }
    });
  }

  findUserByUserNo(userNo: string) {
    return prisma.user.findUnique({
      where: { userNo }
    });
  }

  create(data: {
    userId: string;
    referrerId: string;
    bindSource: string;
  }) {
    return prisma.userReferralBinding.create({
      data: {
        id: ulid(),
        userId: data.userId,
        referrerId: data.referrerId,
        bindSource: data.bindSource,
        isValid: true,
        riskStatus: 'normal',
        boundAt: new Date()
      }
    });
  }
}
```



---



# 22\. Referrals Service



`apps/identity-service/src/modules/referrals/referrals.service.ts`



```TypeScript
import { Injectable } from '@nestjs/common';
import { ReferralsRepository } from './referrals.repository';
import { IdentityErrors } from '../../shared/identity-errors';

@Injectable()
export class ReferralsService {
  constructor(private readonly referralsRepository: ReferralsRepository) {}

  async bindReferrer(params: {
    userId: string;
    referrerId: string;
    bindSource?: string;
  }) {
    if (params.userId === params.referrerId) {
      throw new Error(IdentityErrors.REFERRER_SELF_BIND_NOT_ALLOWED);
    }

    const existing = await this.referralsRepository.findByUserId(params.userId);

    if (existing) {
      throw new Error(IdentityErrors.REFERRER_ALREADY_BOUND);
    }

    return this.referralsRepository.create({
      userId: params.userId,
      referrerId: params.referrerId,
      bindSource: params.bindSource || 'manual'
    });
  }

  async bindReferrerByCode(params: {
    userId: string;
    referralCode: string;
    bindSource?: string;
  }) {
    const referrer = await this.referralsRepository.findUserByUserNo(
      params.referralCode
    );

    if (!referrer) {
      throw new Error(IdentityErrors.REFERRER_NOT_FOUND);
    }

    return this.bindReferrer({
      userId: params.userId,
      referrerId: referrer.id,
      bindSource: params.bindSource || 'register'
    });
  }
}
```



---



# 23\. Referrals Controller



`apps/identity-service/src/modules/referrals/referrals.controller.ts`



```TypeScript
import { Body, Controller, Post } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { BindReferrerDto } from './dto/bind-referrer.dto';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post('bind')
  async bindReferrer(@Body() dto: BindReferrerDto) {
    const binding = await this.referralsService.bindReferrer({
      userId: dto.user_id,
      referrerId: dto.referrer_id,
      bindSource: dto.bind_source
    });

    return {
      binding_id: binding.id,
      user_id: binding.userId,
      referrer_id: binding.referrerId,
      is_valid: binding.isValid,
      risk_status: binding.riskStatus,
      bound_at: binding.boundAt
    };
  }
}
```



---



# 24\. Identity App Module



`apps/identity-service/src/app.module.ts`



```TypeScript
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { ReferralsModule } from './modules/referrals/referrals.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    ReferralsModule
  ]
})
export class AppModule {}
```



---



# 25\. 当前 Identity Service 已具备能力



这一版完成后，Identity Service 已经具备：



```Plain Text
用户注册
用户登录
用户查询
钱包绑定
推荐关系绑定
注册时绑定推荐人
用户状态校验
密码哈希
JWT 签发
基础工业级目录结构
```



---



# 26\. 还需要立刻补强的工业级能力



下一步要补：



```Plain Text
统一 AppException
PrismaModule 注入，替代 new PrismaClient()
Outbox 事件写入
AuditLog 写入
JwtAuthGuard
CurrentUser Decorator
钱包签名真实性校验
推荐关系循环检测
登录日志
设备记录
```



这些属于基础库联动，应该下一步马上做。



---



# 27\. 下一步继续写



按 23 个服务顺序，下一步是：



```Plain Text
2. KYC Service 合规身份服务
```



KYC Service 第一版会包含：



```Plain Text
KYC 提交
KYC 查询
KYC 审核通过
KYC 拒绝
KYB 提交
KYB 审核
KYC 状态机
KycSubmitted event
KycApproved event
KycRejected event
KYC 文件访问审计
```



同时需要补充数据库：



```Plain Text
user_kyc
user_kyb
kyc_review_logs
```



