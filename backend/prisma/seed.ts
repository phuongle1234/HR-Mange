import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Development-only seed data. Not a real credential - rotate before any
// shared/staging use.
const SEED_ADMIN_EMAIL = 'admin@employeeos.local';
const SEED_ADMIN_PASSWORD = 'abc@12345678';
const BCRYPT_SALT_ROUNDS = 10;

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: SEED_ADMIN_EMAIL },
    update: {},
    create: {
      email: SEED_ADMIN_EMAIL,
      passwordHash,
      fullName: 'Placeholder Admin',
      isActive: true,
    },
  });

  console.log(`Seeded placeholder admin user: ${admin.email} (id=${admin.id})`);
}

main()
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
