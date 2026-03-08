import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import {
  InviteToken,
  InviteTokenDocument,
} from './schemas/invite-token.schema';
import { EmailService } from '../email/email.service';

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
    @InjectModel(InviteToken.name) private inviteTokenModel: Model<InviteTokenDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'pending') {
      throw new ForbiddenException('Account not activated. Check your email for the setup link.');
    }
    if (user.status === 'disabled') {
      throw new ForbiddenException('Account is disabled. Contact your administrator.');
    }

    if (!user.passwordHash) {
      throw new ForbiddenException('Account not activated. Check your email for the setup link.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
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
    const user = await this.userModel.findOne({ _id: payload.sub, deletedAt: null });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async generateInviteToken(userId: string, type: 'invite' | 'password_reset'): Promise<string> {
    const userObjectId = new Types.ObjectId(userId);

    await this.inviteTokenModel.updateMany(
      { userId: userObjectId, type, usedAt: null },
      { $set: { usedAt: new Date() } },
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await this.inviteTokenModel.create({ userId: userObjectId, token, type, expiresAt });

    return token;
  }

  async verifyToken(token: string) {
    const record = await this.inviteTokenModel.findOne({ token }).populate('userId', 'email name');
    if (!record) {
      return { valid: false, reason: 'invalid' };
    }
    if (record.usedAt) {
      return { valid: false, reason: 'used' };
    }
    if (record.expiresAt < new Date()) {
      return { valid: false, reason: 'expired' };
    }

    const user = record.userId as any;
    return {
      valid: true,
      email: user.email,
      name: user.name,
      type: record.type,
    };
  }

  async setupPassword(token: string, password: string) {
    const record = await this.inviteTokenModel.findOneAndUpdate(
      { token, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    );

    if (!record) {
      const existing = await this.inviteTokenModel.findOne({ token });
      if (!existing) throw new BadRequestException('Invalid token');
      if (existing.usedAt) throw new BadRequestException('This link has already been used. Please log in or request a new link.');
      throw new BadRequestException('This link has expired. Please request a new invitation.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.findByIdAndUpdate(
      record.userId,
      { $set: { passwordHash, status: 'active' } },
      { new: true },
    );

    if (!user) throw new BadRequestException('User not found');

    await this.tenantStaffModel.updateMany(
      { userId: record.userId, status: 'invited' },
      { $set: { status: 'active', joinedAt: new Date() } },
    );

    return this.issueTokens(user);
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
      status: 'active',
    });

    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const token = await this.generateInviteToken(user._id.toString(), 'password_reset');
    await this.emailService.sendPasswordResetEmail(user.email, user.name, token);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.inviteTokenModel.findOneAndUpdate(
      { token, type: 'password_reset', usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    );

    if (!record) {
      const existing = await this.inviteTokenModel.findOne({ token });
      if (!existing) throw new BadRequestException('Invalid token');
      if (existing.usedAt) throw new BadRequestException('This link has already been used. Please request a new reset link.');
      throw new BadRequestException('This link has expired. Please request a new password reset.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.findByIdAndUpdate(
      record.userId,
      { $set: { passwordHash } },
      { new: true },
    );

    if (!user) throw new BadRequestException('User not found');

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  private async issueTokens(user: UserDocument) {
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
}
