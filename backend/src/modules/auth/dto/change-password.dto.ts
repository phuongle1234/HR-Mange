import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../../common/constants/app.constants';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'currentPassword must not be empty.' })
  currentPassword!: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `newPassword must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
  })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'confirmNewPassword must not be empty.' })
  confirmNewPassword!: string;
}
