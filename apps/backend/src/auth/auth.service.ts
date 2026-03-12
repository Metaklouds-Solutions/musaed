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
  BCRYPT_SALT_ROUNDS,
  INVITE_TOKEN_EXPIRY_MS,
  REFRESH_TOKEN_EXPIRY_MS,
  REFRESH_TOKEN_EXPIRY,
} from '../common/constants';
import {
  TenantStaff,
  TenantStaffDocument,
} from '../tenants/schemas/tenant-staff.schema';
import { Tenant, TenantDocument } from '../tenants/schemas/tenant.schema';
import {
  InviteToken,
  InviteTokenDocument,
} from './schemas/invite-token.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { EmailService } from '../email/email.service';
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
} from '../common/constants/permissions';

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
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TenantStaff.name) private tenantStaffModel: Model<TenantStaffDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(InviteToken.name) private inviteTokenModel: Model<InviteTokenDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
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

    if (user.role !== 'ADMIN') {
      await this.ensureUserCanAccessTenant(user._id);
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
    const stored = await this.refreshTokenModel.findOne({
      token: refreshToken,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      await this.refreshTokenModel.updateOne(
        { token: refreshToken },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userModel.findOne({ _id: payload.sub, deletedAt: null });
    if (!user) {
      await this.refreshTokenModel.updateOne(
        { token: refreshToken },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== 'ADMIN') {
      try {
        await this.ensureUserCanAccessTenant(user._id, payload.tenantId);
      } catch {
        await this.refreshTokenModel.updateOne(
          { token: refreshToken },
          { $set: { revokedAt: new Date() } },
        );
        throw new ForbiddenException(
          'Your tenant access is disabled. Please contact your administrator.',
        );
      }
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
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { $set: { revokedAt: new Date() } },
    );
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
    if (user.role !== 'ADMIN') {
      await this.ensureUserCanAccessTenant(user._id, payload.tenantId);
    }
    return user;
  }

  /**
   * Returns permissions for a user. ADMIN gets all; tenant staff get role-based permissions.
   */
  getPermissionsForUser(
    role: string,
    tenantRole?: string | null,
  ): Permission[] {
    if (role === 'ADMIN') {
      return [...ALL_PERMISSIONS];
    }
    const slug = tenantRole ?? 'tenant_staff';
    return ROLE_PERMISSIONS[slug] ?? ROLE_PERMISSIONS.tenant_staff;
  }

  async generateInviteToken(userId: string, type: 'invite' | 'password_reset'): Promise<string> {
    const userObjectId = new Types.ObjectId(userId);

    await this.inviteTokenModel.updateMany(
      { userId: userObjectId, type, usedAt: null },
      { $set: { usedAt: new Date() } },
    );

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_MS);

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

    const populatedUser = record.userId as unknown as { email: string; name: string };
    return {
      valid: true,
      email: populatedUser.email,
      name: populatedUser.name,
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
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

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await this.userModel.findByIdAndUpdate(
      record.userId,
      { $set: { passwordHash } },
      { new: true },
    );

    if (!user) throw new BadRequestException('User not found');

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.passwordHash) {
      throw new ForbiddenException('Account not activated. Use the setup link from your email.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userModel.updateOne({ _id: userId }, { $set: { passwordHash } });

    return { message: 'Password updated' };
  }

  /**
   * Soft-delete a user account and revoke all refresh tokens.
   */
  async deleteAccount(userId: string) {
    const user = await this.userModel.findOne({ _id: userId, deletedAt: null });
    if (!user) throw new BadRequestException('User not found');

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { deletedAt: new Date(), status: 'disabled' } },
    );

    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );

    await this.tenantStaffModel.updateMany(
      { userId: new Types.ObjectId(userId), status: 'active' },
      { $set: { status: 'removed' } },
    );

    return { message: 'Account deleted' };
  }

  async updateProfile(userId: string, dto: { name?: string; avatarUrl?: string }) {
    const updateData: Partial<Pick<User, 'name' | 'avatarUrl'>> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );

    if (!user) throw new BadRequestException('User not found');

    return user.toJSON();
  }

  private async issueTokens(user: UserDocument) {
    let tenantId: string | undefined;
    let tenantRole: string | undefined;

    if (user.role !== 'ADMIN') {
      const tenantAccess = await this.ensureUserCanAccessTenant(user._id);
      tenantId = tenantAccess.tenantId;
      tenantRole = tenantAccess.tenantRole;
    }

    const baseClaims = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      ...(tenantId && { tenantId }),
      ...(tenantRole && { tenantRole }),
    };

    const accessToken = this.jwtService.sign({ ...baseClaims, type: 'access' });
    const refreshToken = this.jwtService.sign(
      { ...baseClaims, type: 'refresh' },
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    );

    await this.refreshTokenModel.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
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

  private async ensureUserCanAccessTenant(
    userId: Types.ObjectId | string,
    preferredTenantId?: string,
  ): Promise<{ tenantId: string; tenantRole: string }> {
    const userObjectId = new Types.ObjectId(userId);
    const membershipFilter: Record<string, unknown> = {
      userId: userObjectId,
      status: 'active',
    };
    if (preferredTenantId && Types.ObjectId.isValid(preferredTenantId)) {
      membershipFilter.tenantId = new Types.ObjectId(preferredTenantId);
    }

    const membership = await this.tenantStaffModel.findOne(membershipFilter);
    if (!membership || !membership.tenantId) {
      throw new ForbiddenException(
        'Your tenant access is disabled. Please contact your administrator.',
      );
    }

    const tenant = await this.tenantModel.findOne({
      _id: membership.tenantId,
      deletedAt: null,
    });
    if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'CHURNED') {
      throw new ForbiddenException(
        'Your tenant access is disabled. Please contact your administrator.',
      );
    }

    return {
      tenantId: membership.tenantId.toString(),
      tenantRole: membership.roleSlug ?? 'tenant_staff',
    };
  }
}
