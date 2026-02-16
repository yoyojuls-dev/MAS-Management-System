// Fixed scripts/seed-ministry-esmodule.ts
// Properly typed with Prisma enums

import { 
  PrismaClient, 
  MemberStatus, 
  ServerLevel, 
  Role,
  EventType,
  EventStatus
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Sample member data - using proper enum types
const sampleMembers = [
  {
    surname: 'Dela Cruz',
    givenName: 'Juan Carlos',
    birthdate: new Date('2005-03-15'),
    email: 'juan.delacruz@email.com',
    contactNumber: '09123456789',
    address: '123 Main St, Quezon City',
    parentGuardian: 'Maria Dela Cruz',
    parentContact: '09123456788',
    memberStatus: MemberStatus.ACTIVE,
    serverLevel: ServerLevel.JUNIOR,
    school: 'Quezon City High School',
  },
  {
    surname: 'Santos',
    givenName: 'Maria Clara',
    birthdate: new Date('2004-07-22'),
    email: 'maria.santos@email.com',
    contactNumber: '09234567890',
    address: '456 Church St, Manila',
    parentGuardian: 'Jose Santos',
    parentContact: '09234567891',
    memberStatus: MemberStatus.ACTIVE,
    serverLevel: ServerLevel.SENIOR,
    school: 'Manila Catholic School',
  },
  {
    surname: 'Rodriguez',
    givenName: 'Miguel Angelo',
    birthdate: new Date('2006-01-10'),
    email: 'miguel.rodriguez@email.com',
    contactNumber: '09345678901',
    address: '789 Chapel Ave, Makati',
    parentGuardian: 'Carmen Rodriguez',
    parentContact: '09345678902',
    memberStatus: MemberStatus.ACTIVE,
    serverLevel: ServerLevel.JUNIOR,
    school: 'Makati Catholic Academy',
  }
];

async function seedMembers() {
  console.log('Seeding members...');
  
  for (const memberData of sampleMembers) {
    // Check if member already exists using email (which is unique)
    const existingMember = await prisma.member.findFirst({
      where: {
        email: memberData.email
      }
    });

    if (existingMember) {
      console.log(`Member with email ${memberData.email} already exists, skipping...`);
      continue;
    }

    // Create the member - you need to provide createdByUserId
    // First, let's find an admin user to use as the creator
    const adminUser = await prisma.adminUser.findFirst({
      where: { role: Role.ADMIN }
    });

    if (!adminUser) {
      console.log('No admin user found. Creating a default admin first...');
      const defaultAdmin = await createDefaultAdmin();
      
      await prisma.member.create({
        data: {
          ...memberData,
          createdByUserId: defaultAdmin.id,
        }
      });
    } else {
      await prisma.member.create({
        data: {
          ...memberData,
          createdByUserId: adminUser.id,
        }
      });
    }

    console.log(`Created member: ${memberData.givenName} ${memberData.surname}`);
  }
}

async function createDefaultAdmin() {
  const adminData = {
    name: 'System Administrator',
    email: 'admin@ministry.local',
    hashedPassword: await hash('admin123', 12),
    adminId: 'ADMIN001',
    position: 'Ministry Leader',
    contactNumber: '09123456789',
    role: Role.ADMIN,
    permissions: ['ALL'],
    isActive: true,
  };

  const admin = await prisma.adminUser.create({
    data: adminData
  });

  console.log('Created default admin user');
  return admin;
}

async function seedMinistrySettings() {
  console.log('Seeding ministry settings...');
  
  const existingSettings = await prisma.ministrySettings.findFirst();
  
  if (!existingSettings) {
    await prisma.ministrySettings.create({
      data: {
        ministryName: 'Ministry of Altar Servers',
        parishName: 'Sample Parish Church',
        contactEmail: 'ministry@parish.church',
        contactNumber: '02-123-4567',
        monthlyDuesAmount: 20.00,
        duesDescription: 'Monthly membership dues',
        attendanceGracePeriod: 15,
        birthdayReminders: true,
        eventReminders: true,
        duesReminders: true,
      }
    });
    console.log('Created ministry settings');
  } else {
    console.log('Ministry settings already exist');
  }
}

async function seedSampleEvents() {
  console.log('Seeding sample events...');
  
  // Find an admin to create events
  const admin = await prisma.adminUser.findFirst({
    where: { role: Role.ADMIN }
  });

  if (!admin) {
    console.log('No admin found for creating events');
    return;
  }

  const sampleEvents = [
    {
      title: 'Sunday Mass Service',
      description: 'Regular Sunday morning mass service',
      eventType: EventType.SUNDAY_MASS,
      date: new Date('2026-02-16'),
      startTime: '08:00',
      endTime: '09:30',
      location: 'Main Church',
      requiresAttendance: true,
      status: EventStatus.SCHEDULED,
      createdByUserId: admin.id,
    },
    {
      title: 'Monthly Ministry Meeting',
      description: 'Regular monthly meeting for all altar servers',
      eventType: EventType.MEETING,
      date: new Date('2026-03-01'),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Parish Hall',
      requiresAttendance: true,
      minServerLevel: ServerLevel.JUNIOR,
      status: EventStatus.SCHEDULED,
      createdByUserId: admin.id,
    },
    {
      title: 'Altar Server Training',
      description: 'Basic training for new altar servers',
      eventType: EventType.TRAINING,
      date: new Date('2026-02-22'),
      startTime: '10:00',
      endTime: '15:00',
      location: 'Parish Center',
      requiresAttendance: true,
      minServerLevel: ServerLevel.JUNIOR,
      status: EventStatus.SCHEDULED,
      createdByUserId: admin.id,
    }
  ];

  for (const eventData of sampleEvents) {
    const existingEvent = await prisma.event.findFirst({
      where: {
        title: eventData.title,
        date: eventData.date
      }
    });

    if (!existingEvent) {
      await prisma.event.create({
        data: eventData
      });
      console.log(`Created event: ${eventData.title}`);
    } else {
      console.log(`Event ${eventData.title} already exists`);
    }
  }
}

async function main() {
  try {
    console.log('Starting database seeding...');
    
    // Create default admin first if needed
    const existingAdmin = await prisma.adminUser.findFirst();
    if (!existingAdmin) {
      await createDefaultAdmin();
    }

    // Seed other data
    await seedMinistrySettings();
    await seedMembers();
    await seedSampleEvents();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });