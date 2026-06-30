import { NextRequest, NextResponse } from 'next/server';
import { success, badRequest } from '@/lib/api/response';
import { generateTokenPair } from '@/lib/auth/jwt';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return badRequest('请输入账号和密码');
    }

    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_ADMIN_LOGIN === 'true') {
      const tokens = await generateTokenPair({
        userId: 'dev-admin',
        username: String(username),
        userType: 'admin',
      });
      return success({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: tokens.expiresIn,
        user: {
          id: 'dev-admin',
          username: String(username),
          email: `${username}@admin.local`,
          userType: 'admin',
        },
      });
    }

    const user = await prisma.coreUser.findFirst({
      where: {
        OR: [{ username: String(username) }, { email: String(username) }],
        status: 'active',
        userType: 'admin',
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: '账号或密码错误' } },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: { message: '账号或密码错误' } },
        { status: 401 }
      );
    }

    const tokens = await generateTokenPair({
      userId: user.id,
      username: user.username,
      userType: user.userType,
    });

    return success({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { message: e.message || 'Login failed' } },
      { status: 500 }
    );
  }
}
