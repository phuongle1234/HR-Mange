import { User } from '@prisma/client';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<User>;
  updateLastLoginAt(id: string, lastLoginAt: Date): Promise<User>;
}
