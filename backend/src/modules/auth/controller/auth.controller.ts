import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { GENERIC_FORGOT_PASSWORD_MESSAGE } from '../../../common/constants/app.constants';

/**
 * Controller layer: HTTP/DTO/response only - all business logic lives in
 * AuthService (per AGENTS.md Backend Rules).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return ResponseHelper.success({ data: result, message: 'Login successful.' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserPayload) {
    return ResponseHelper.success({ data: user, message: 'Current user retrieved successfully.' });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout() {
    // Stateless JWT - no server-side session to invalidate (WORK-000 decision #4).
    // Exists for API-contract symmetry only.
    return ResponseHelper.success({ data: null, message: 'Logged out successfully.' });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(@CurrentUser() user: CurrentUserPayload, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto);
    return ResponseHelper.success({ data: null, message: 'Password changed successfully.' });
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return ResponseHelper.success({ data: null, message: GENERIC_FORGOT_PASSWORD_MESSAGE });
  }
}
