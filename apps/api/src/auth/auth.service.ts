import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  // TODO: Implement registration
  // TODO: Implement login
  // TODO: Implement password reset
  // TODO: Implement email verification

  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Implement user validation
    return null;
  }

  async login(userId: string) {
    // TODO: Implement login logic
    return {
      accessToken: this.jwtService.sign({ sub: userId }),
      refreshToken: this.jwtService.sign({ sub: userId }, { expiresIn: '30d' }),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      return {
        accessToken: this.jwtService.sign({ sub: payload.sub }),
        refreshToken: this.jwtService.sign({ sub: payload.sub }, { expiresIn: '30d' }),
      };
    } catch {
      return null;
    }
  }

  async logout(userId: string) {
    // TODO: Implement logout (invalidate session/token)
    return { message: 'Logged out successfully' };
  }

  // Google OAuth Login
  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new Error('No user from Google');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user with Google OAuth
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36),
        parseInt(this.configService.get('BCRYPT_ROUNDS') || '10'),
      );

      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          passwordHash: randomPassword,
          emailVerifiedAt: new Date(),
          role: 'USER',
        },
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
