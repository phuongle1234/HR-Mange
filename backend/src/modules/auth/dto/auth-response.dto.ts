export class UserResponseDto {
  id!: string;
  email!: string;
  fullName!: string;
}

export class LoginResponseDto {
  accessToken!: string;
  user!: UserResponseDto;
}
