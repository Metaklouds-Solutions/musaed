import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Delete,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: AuthenticatedRequest) {
    const raw = req.user as unknown as Record<string, unknown> & {
      toObject?: () => Record<string, unknown>;
    };
    const user =
      typeof raw.toObject === 'function' ? raw.toObject() : { ...raw };
    delete user.passwordHash;
    const tenantId =
      typeof req.user?.tenantId === 'string'
        ? req.user.tenantId
        : typeof req.tenantId === 'string'
          ? req.tenantId
          : undefined;
    const tenantRole =
      typeof req.user?.tenantRole === 'string' ? req.user.tenantRole : undefined;
    if (tenantId) user.tenantId = tenantId;
    if (tenantRole) user.tenantRole = tenantRole;
    return user;
  }

  @Get('verify-token')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyToken(@Query('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @Post('setup-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async setupPassword(@Body() dto: SetupPasswordDto) {
    return this.authService.setupPassword(dto.token, dto.password);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new BadRequestException('User ID not found');
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const userId = req.user?._id;
    if (!userId) throw new BadRequestException('User ID not found');
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  /**
   * Soft-delete the authenticated user's account and revoke all sessions.
   */
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@Request() req: AuthenticatedRequest) {
    const userId = req.user?._id;
    if (!userId) throw new BadRequestException('User ID not found');
    return this.authService.deleteAccount(userId);
  }
}
