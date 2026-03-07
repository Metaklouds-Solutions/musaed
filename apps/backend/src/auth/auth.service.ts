import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  tenantId?: string;
  tenantRole?: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokens = new Map<string, { userId: string; expiresAt: Date }>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TenantStaff.name) private tenantStaffModel: Model<TenantStaffDocument>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let tenantId: string | undefined;
    let tenantRole: string | undefined;

    if (user.role !== 'ADMIN') {
      const membership = await this.tenantStaffModel.findOne({
        userId: user._id,
        status: 'active',
      });
      if (membership) {
        tenantId = membership.tenantId.toString();
        tenantRole = membership.roleSlug;
      }
    }

    const baseClaims = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      ...(tenantId && { tenantId }),
      ...(tenantRole && { tenantRole }),
    };

    const accessToken = this.jwtService.sign({ ...baseClaims, type: 'access' });
    const refreshToken = this.jwtService.sign({ ...baseClaims, type: 'refresh' }, { expiresIn: '7d' });

    this.refreshTokens.set(refreshToken, {
      userId: user._id.toString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await this.userModel.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        ...(tenantId && { tenantId }),
        ...(tenantRole && { tenantRole }),
      },
    };
  }

  async refresh(refreshToken: string) {
    const stored = this.refreshTokens.get(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userModel.findOne({ _id: payload.sub, deletedAt: null });
    if (!user) {
      this.refreshTokens.delete(refreshToken);
      throw new UnauthorizedException('User not found');
    }

    const newPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access' as const,
      ...(payload.tenantId && { tenantId: payload.tenantId }),
      ...(payload.tenantRole && { tenantRole: payload.tenantRole }),
    };

    const newAccessToken = this.jwtService.sign(newPayload);

    return { accessToken: newAccessToken };
  }

  async logout(refreshToken: string) {
    this.refreshTokens.delete(refreshToken);
    return { message: 'Logged out' };
  }

  async validateUser(payload: JwtPayload) {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used for authentication');
    }
    const user = await this.userModel
      .findOne({ _id: payload.sub, deletedAt: null });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
