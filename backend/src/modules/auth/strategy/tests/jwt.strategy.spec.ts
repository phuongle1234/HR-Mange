import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../jwt.strategy';
import { UserRepository } from '../../repository/user.repository';
import { AppConfig } from '../../../../config/configuration';

/**
 * This is the effective implementation behind JwtAuthGuard - the guard
 * itself is a one-line AuthGuard('jwt') subclass, so the real "valid,
 * non-expired JWT for an active user" logic (WORK-000 decision #2) lives
 * in JwtStrategy.validate() and is tested here.
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: jest.Mocked<UserRepository>;

  const baseUser = {
    id: 'user-1',
    email: 'admin@employeeos.local',
    passwordHash: 'hash',
    fullName: 'Placeholder Admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updatePasswordHash: jest.fn(),
      updateLastLoginAt: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService<AppConfig>;

    strategy = new JwtStrategy(configService, userRepository);
  });

  it('returns the current-user payload for an active user (success path)', async () => {
    userRepository.findById.mockResolvedValue(baseUser);

    const result = await strategy.validate({ sub: baseUser.id, email: baseUser.email });

    expect(result).toEqual({ id: baseUser.id, email: baseUser.email, fullName: baseUser.fullName });
  });

  it('throws UnauthorizedException when the user no longer exists (failure path)', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 'gone', email: 'gone@example.com' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the user has been disabled', async () => {
    userRepository.findById.mockResolvedValue({ ...baseUser, isActive: false });

    await expect(
      strategy.validate({ sub: baseUser.id, email: baseUser.email }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
