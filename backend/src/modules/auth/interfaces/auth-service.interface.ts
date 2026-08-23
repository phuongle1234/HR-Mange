import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginResponseDto, UserResponseDto } from '../dto/auth-response.dto';

export interface IAuthService {
  login(dto: LoginDto): Promise<LoginResponseDto>;
  getCurrentUser(userId: string): Promise<UserResponseDto>;
  changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
  forgotPassword(dto: ForgotPasswordDto): Promise<void>;
}
