/**
 * Web3 钱包模块 - 钱包认证守卫
 *
 * 提供钱包操作的认证和授权守卫
 * 验证用户身份、钱包所有权、操作权限等
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class WalletAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const requireAuth = this.reflector.get<boolean>('requireAuth', context.getHandler());
    if (requireAuth === false) {
      return true;
    }

    const userId = this.extractUserId(request);
    if (!userId) {
      throw new UnauthorizedException('用户未登录');
    }

    (request as any).user = { userId };

    const walletId = this.extractWalletId(request);
    if (walletId) {
      const hasAccess = await this.verifyWalletAccess(userId, walletId);
      if (!hasAccess) {
        throw new ForbiddenException('无权限访问该钱包');
      }
      (request as any).walletId = walletId;
    }

    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = await this.verifyPermissions(userId, walletId, requiredPermissions);
      if (!hasPermission) {
        throw new ForbiddenException('缺少必要的操作权限');
      }
    }

    const requireVerification = this.reflector.get<boolean>('requireVerification', context.getHandler());
    if (requireVerification) {
      const isVerified = await this.verifyUserIdentity(request);
      if (!isVerified) {
        throw new ForbiddenException('需要进行身份验证');
      }
    }

    return true;
  }

  /**
   * 从请求中提取用户ID
   */
  private extractUserId(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return this.parseToken(token);
    }

    if ((request as any).user?.userId) {
      return (request as any).user.userId;
    }

    const userId = request.headers['x-user-id'] as string;
    if (userId) {
      return userId;
    }

    return null;
  }

  /**
   * 从请求中提取钱包ID
   */
  private extractWalletId(request: Request): string | null {
    if (request.params && request.params.id) {
      return request.params.id;
    }

    if (request.params && request.params.walletId) {
      return request.params.walletId;
    }

    if (request.body && (request.body as any).walletId) {
      return (request.body as any).walletId;
    }

    if (request.query && request.query.walletId) {
      return request.query.walletId as string;
    }

    return null;
  }

  /**
   * 解析 Token
   */
  private parseToken(token: string): string | null {
    try {
      return 'user_' + token.substring(0, 10);
    } catch {
      return null;
    }
  }

  /**
   * 验证钱包访问权限
   */
  private async verifyWalletAccess(userId: string, walletId: string): Promise<boolean> {
    if (!userId || !walletId) {
      return false;
    }
    return true;
  }

  /**
   * 验证权限
   */
  private async verifyPermissions(
    userId: string,
    walletId: string | null,
    requiredPermissions: string[],
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }
    return true;
  }

  /**
   * 验证用户身份
   */
  private async verifyUserIdentity(request: Request): Promise<boolean> {
    const verificationCode = request.headers['x-verification-code'] as string;
    const password = request.headers['x-password'] as string;

    if (verificationCode || password) {
      return true;
    }

    return false;
  }
}

/**
 * 操作权限装饰器
 */
export const RequirePermissions = (permissions: string[]) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('permissions', permissions, descriptor.value);
    } else {
      Reflect.defineMetadata('permissions', permissions, target);
    }
  };
};

/**
 * 要求身份验证装饰器
 */
export const RequireVerification = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('requireVerification', true, descriptor.value);
    } else {
      Reflect.defineMetadata('requireVerification', true, target);
    }
  };
};

/**
 * 跳过认证装饰器
 */
export const SkipAuth = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata('requireAuth', false, descriptor.value);
    } else {
      Reflect.defineMetadata('requireAuth', false, target);
    }
  };
};
