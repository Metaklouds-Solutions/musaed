import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';

import { Types } from 'mongoose';

const HASHED_PASSWORD = bcrypt.hashSync('ValidPass1!', 10);

const MOCK_USER_ID = new Types.ObjectId().toString();
const MOCK_TENANT_ID = new Types.ObjectId().toString();

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: MOCK_USER_ID,
    email: 'test@example.com',
    name: 'Test User',
    role: 'TENANT_OWNER',
    status: 'active',
    passwordHash: HASHED_PASSWORD,
    avatarUrl: null,
    deletedAt: null,
    toJSON: function () { return { ...this }; },
    ...overrides,
  };
}

function createMockModel(defaultDoc: unknown = null) {
  return {
    findOne: jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(defaultDoc),
    }),
    findById: jest.fn().mockResolvedValue(defaultDoc),
    findByIdAndUpdate: jest.fn().mockResolvedValue(defaultDoc),
    findOneAndUpdate: jest.fn().mockResolvedValue(defaultDoc),
    create: jest.fn().mockImplementation((data: unknown) => Promise.resolve({ ...data as object, _id: 'new-id' })),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let userModel: ReturnType<typeof createMockModel>;
  let tenantStaffModel: ReturnType<typeof createMockModel>;
  let tenantModel: ReturnType<typeof createMockModel>;
  let inviteTokenModel: ReturnType<typeof createMockModel>;
  let refreshTokenModel: ReturnType<typeof createMockModel>;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let emailService: { sendPasswordResetEmail: jest.Mock };

  beforeEach(async () => {
    userModel = createMockModel();
    tenantStaffModel = createMockModel();
    tenantModel = createMockModel();
    inviteTokenModel = createMockModel();
    refreshTokenModel = createMockModel();
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };
    emailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    tenantStaffModel.findOne.mockResolvedValue({
      tenantId: new Types.ObjectId(MOCK_TENANT_ID),
      roleSlug: 'clinic_admin',
      status: 'active',
    });
    tenantModel.findOne.mockResolvedValue({
      _id: new Types.ObjectId(MOCK_TENANT_ID),
      status: 'ACTIVE',
      deletedAt: null,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: userModel },
        { provide: getModelToken('TenantStaff'), useValue: tenantStaffModel },
        { provide: getModelToken('Tenant'), useValue: tenantModel },
        { provide: getModelToken('InviteToken'), useValue: inviteTokenModel },
        { provide: getModelToken('RefreshToken'), useValue: refreshTokenModel },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const user = mockUser();
      const membership = {
        tenantId: new Types.ObjectId(MOCK_TENANT_ID),
        userId: new Types.ObjectId(MOCK_USER_ID),
        roleSlug: 'clinic_admin',
        status: 'active',
      };
      userModel.findOne.mockResolvedValue(user);
      tenantStaffModel.findOne.mockResolvedValue(membership);
      tenantModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(MOCK_TENANT_ID),
        status: 'ACTIVE',
        deletedAt: null,
      });

      const result = await service.login('test@example.com', 'ValidPass1!');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'WrongPass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.login('none@example.com', 'Pass123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException for pending user', async () => {
      const user = mockUser({ status: 'pending' });
      userModel.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'ValidPass1!')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for disabled user', async () => {
      const user = mockUser({ status: 'disabled' });
      userModel.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'ValidPass1!')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for user with no password', async () => {
      const user = mockUser({ passwordHash: null });
      userModel.findOne.mockResolvedValue(user);

      await expect(service.login('test@example.com', 'SomePass1!')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new access token for valid refresh token', async () => {
      refreshTokenModel.findOne.mockResolvedValue({
        token: 'valid-refresh',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });
      jwtService.verify.mockReturnValue({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'TENANT_OWNER',
        type: 'refresh',
        tenantId: 'tenant-1',
        tenantRole: 'clinic_admin',
      });
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user);
      tenantStaffModel.findOne.mockResolvedValue({
        tenantId: new Types.ObjectId(MOCK_TENANT_ID),
        roleSlug: 'clinic_admin',
        status: 'active',
      });
      tenantModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(MOCK_TENANT_ID),
        status: 'ACTIVE',
        deletedAt: null,
      });

      const result = await service.refresh('valid-refresh');

      expect(result).toHaveProperty('accessToken');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      refreshTokenModel.findOne.mockResolvedValue(null);

      await expect(service.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid JWT', async () => {
      refreshTokenModel.findOne.mockResolvedValue({
        token: 'bad-jwt',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refresh('bad-jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should return success message for existing user', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user);
      inviteTokenModel.updateMany.mockResolvedValue({ modifiedCount: 0 });
      inviteTokenModel.create.mockResolvedValue({ token: 'reset-tok' });

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('password reset link');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.any(String),
      );
    });

    it('should return same message for non-existent user (no leak)', async () => {
      userModel.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword('none@example.com');

      expect(result.message).toContain('password reset link');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password for valid token', async () => {
      inviteTokenModel.findOneAndUpdate.mockResolvedValue({
        userId: MOCK_USER_ID,
        type: 'password_reset',
      });
      const updatedUser = mockUser();
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

      const result = await service.resetPassword('valid-tok', 'NewPass1!');

      expect(result.message).toContain('reset successfully');
    });

    it('should throw BadRequestException for invalid token', async () => {
      inviteTokenModel.findOneAndUpdate.mockResolvedValue(null);
      inviteTokenModel.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('bad-tok', 'NewPass1!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for already used token', async () => {
      inviteTokenModel.findOneAndUpdate.mockResolvedValue(null);
      inviteTokenModel.findOne.mockResolvedValue({ usedAt: new Date() });

      await expect(service.resetPassword('used-tok', 'NewPass1!')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for valid current password', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.changePassword('user-1', 'ValidPass1!', 'NewPass2!');

      expect(result.message).toBe('Password updated');
      expect(userModel.updateOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      const user = mockUser();
      userModel.findOne.mockResolvedValue(user);

      await expect(
        service.changePassword('user-1', 'WrongPass', 'NewPass2!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('missing', 'OldPass', 'NewPass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      const result = await service.logout('some-refresh-token');

      expect(result.message).toBe('Logged out');
      expect(refreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token: 'some-refresh-token' },
        { $set: { revokedAt: expect.any(Date) } },
      );
    });
  });
});
