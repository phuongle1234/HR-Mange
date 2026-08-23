import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../repository/user.repository';
import {
  CurrentPasswordInvalidException,
  InvalidCredentialsException,
  PasswordPolicyFailedException,
  UserDisabledException,
  ValidationException,
} from '../../../../common/exceptions/app.exception';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const activeUser = {
    id: 'user-1',
    email: 'admin@employeeos.local',
    passwordHash: '',
    fullName: 'Placeholder Admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    activeUser.passwordHash = await bcrypt.hash('ChangeMe123', 10);

    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updatePasswordHash: jest.fn(),
      updateLastLoginAt: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    jwtService = {
      sign: jest.fn().mockReturnValue('signed-jwt-token'),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(userRepository, jwtService);
  });

  describe('login', () => {
    it('returns an access token and user on valid credentials (success path)', async () => {
      userRepository.findByEmail.mockResolvedValue(activeUser);
      userRepository.updateLastLoginAt.mockResolvedValue(activeUser);

      const result = await service.login({ email: activeUser.email, password: 'ChangeMe123' });

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user).toEqual({
        id: activeUser.id,
        email: activeUser.email,
        fullName: activeUser.fullName,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: activeUser.id, email: activeUser.email });
    });

    it('throws InvalidCredentialsException when the user does not exist (failure path)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'missing@example.com', password: 'whatever1' }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('throws InvalidCredentialsException when the password does not match', async () => {
      userRepository.findByEmail.mockResolvedValue(activeUser);

      await expect(
        service.login({ email: activeUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(InvalidCredentialsException);
    });

    it('throws UserDisabledException when the user is inactive', async () => {
      userRepository.findByEmail.mockResolvedValue({ ...activeUser, isActive: false });

      await expect(
        service.login({ email: activeUser.email, password: 'ChangeMe123' }),
      ).rejects.toThrow(UserDisabledException);
    });
  });

  describe('changePassword', () => {
    it('updates the password hash on valid input (success path)', async () => {
      userRepository.findById.mockResolvedValue(activeUser);
      userRepository.updatePasswordHash.mockResolvedValue(activeUser);

      await service.changePassword(activeUser.id, {
        currentPassword: 'ChangeMe123',
        newPassword: 'NewPass456',
        confirmNewPassword: 'NewPass456',
      });

      expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(
        activeUser.id,
        expect.any(String),
      );
    });

    it('throws CurrentPasswordInvalidException when currentPassword is wrong (failure path)', async () => {
      userRepository.findById.mockResolvedValue(activeUser);

      await expect(
        service.changePassword(activeUser.id, {
          currentPassword: 'totally-wrong',
          newPassword: 'NewPass456',
          confirmNewPassword: 'NewPass456',
        }),
      ).rejects.toThrow(CurrentPasswordInvalidException);
    });

    it('throws PasswordPolicyFailedException when newPassword fails the policy', async () => {
      userRepository.findById.mockResolvedValue(activeUser);

      await expect(
        service.changePassword(activeUser.id, {
          currentPassword: 'ChangeMe123',
          newPassword: 'short',
          confirmNewPassword: 'short',
        }),
      ).rejects.toThrow(PasswordPolicyFailedException);
    });

    it('throws ValidationException when confirmNewPassword does not match newPassword', async () => {
      await expect(
        service.changePassword(activeUser.id, {
          currentPassword: 'ChangeMe123',
          newPassword: 'NewPass456',
          confirmNewPassword: 'Mismatch789',
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('forgotPassword', () => {
    it('resolves without throwing for an unregistered email (safe generic response)', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.forgotPassword({ email: 'nobody@example.com' })).resolves.toBeUndefined();
    });

    it('resolves without throwing for a registered email', async () => {
      userRepository.findByEmail.mockResolvedValue(activeUser);

      await expect(service.forgotPassword({ email: activeUser.email })).resolves.toBeUndefined();
    });
  });
});
