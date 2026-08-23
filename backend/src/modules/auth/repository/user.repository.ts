import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { IUserRepository } from '../interfaces/user-repository.interface';

/**
 * Repository layer for User: Prisma calls only, no business logic
 * (per AGENTS.md Backend Rules).
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  updateLastLoginAt(id: string, lastLoginAt: Date): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt } });
  }
}
