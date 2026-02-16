// scripts/createAdmin.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@example.com';
  const password = 'admin123';
  const name = 'Admin User';
  const adminId = 'ADMIN001';
  const position = 'System Administrator';
  const contactNumber = '09123456789';

  // Check if admin already exists - using adminUser table instead of user
  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  // Hash the password
  const hashedPassword = await hash(password, 12);

  // Create admin user
  const admin = await prisma.adminUser.create({
    data: {
      name,
      email,
      hashedPassword, // Using hashedPassword field
      adminId,
      position,
      contactNumber,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Admin user created successfully:');
  console.log({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    adminId: admin.adminId,
    role: admin.role,
  });
}

createAdmin()
  .catch((error) => {
    console.error('Error creating admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });