import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { IAuthService } from '../interfaces/auth-service.interface';
import { UserRepository } from '../repository/user.repository';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginResponseDto, UserResponseDto } from '../dto/auth-response.dto';
import {
  CurrentPasswordInvalidException,
  InvalidCredentialsException,
  PasswordPolicyFailedException,
  UserDisabledException,
  ValidationException,
} from '../../../common/exceptions/app.exception';
import { satisfiesPasswordPolicy } from '../../../common/utils/password-policy.util';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Business logic for authentication. Stateless bearer JWT only - no refresh
 * token, no server-side session store (WORK-000 decision #4). Auth-event
 * auditing (login/password-change) is explicitly out of scope for this
 * phase (WORK-000 decision #9) - do not add it here.
 */
@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    if (!user.isActive) {
      throw new UserDisabledException();
    }

    await this.safelyUpdateLastLogin(user.id);

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: this.toUserResponse(user.id, user.email, user.fullName),
    };
  }

  async getCurrentUser(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    return this.toUserResponse(user.id, user.email, user.fullName);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new ValidationException({
        confirmNewPassword: ['confirmNewPassword must match newPassword.'],
      });
    }

    if (!satisfiesPasswordPolicy(dto.newPassword)) {
      throw new PasswordPolicyFailedException();
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const currentPasswordMatches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!currentPasswordMatches) {
      throw new CurrentPasswordInvalidException();
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.updatePasswordHash(userId, newPasswordHash);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    // Always resolves without revealing whether the email is registered.
    // No email/SMS delivery integration in this phase (per WORK-006).
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      return;
    }
    this.logger.log(`Password reset requested for a registered account.`, 'AuthService');
  }

  private async safelyUpdateLastLogin(userId: string): Promise<void> {
    try {
      await this.userRepository.updateLastLoginAt(userId, new Date());
    } catch (error) {
      // Non-critical side effect: never fail the login flow because of it,
      // but do not swallow the error silently either.
      this.logger.error(
        `Failed to update lastLoginAt for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private toUserResponse(id: string, email: string, fullName: string): UserResponseDto {
    return { id, email, fullName };
  }
}
