// app/api/member/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get session
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Import prisma dynamically to avoid initialization issues
    const { PrismaClient } = await import('@prisma/client');
    
    // Use global prisma instance if available, otherwise create new one
    let prisma: any;
    
    if (globalThis.prisma) {
      prisma = globalThis.prisma;
    } else {
      prisma = new PrismaClient();
      globalThis.prisma = prisma;
    }

    // Query the database
    const member = await prisma.member.findFirst({
      where: { 
        email: session.user.email 
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Return member profile
    const profileData = {
      id: member.id,
      fullName: `${member.givenName || ''} ${member.surname || ''}`.trim(),
      givenName: member.givenName || '',
      surname: member.surname || '',
      email: member.email || '',
      phone: member.contactNumber || '',
      birthdate: member.birthdate,
      memberStatus: member.memberStatus || 'ACTIVE',
      serverLevel: member.serverLevel || '',
      dateJoined: member.dateJoined,
      image: member.image || null,
      address: member.address || '',
      parentGuardian: member.parentGuardian || '',
      emergencyContact: member.emergencyContact || '',
      emergencyNumber: member.emergencyNumber || '',
      school: member.school || '',
      occupation: member.occupation || '',
    };

    return NextResponse.json(profileData);

  } catch (error: any) {
    console.error('Profile API Error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Import prisma
    const { PrismaClient } = await import('@prisma/client');
    
    let prisma: any;
    if (globalThis.prisma) {
      prisma = globalThis.prisma;
    } else {
      prisma = new PrismaClient();
      globalThis.prisma = prisma;
    }

    // Find member
    const member = await prisma.member.findFirst({
      where: { email: session.user.email },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Update member
    const updated = await prisma.member.update({
      where: { id: member.id },
      data: {
        surname: body.surname || member.surname,
        givenName: body.givenName || member.givenName,
        email: body.email || member.email,
        contactNumber: body.phone || member.contactNumber,
        address: body.address || member.address,
        parentGuardian: body.parentGuardian || member.parentGuardian,
        emergencyContact: body.emergencyContact || member.emergencyContact,
        emergencyNumber: body.emergencyNumber || member.emergencyNumber,
        school: body.school || member.school,
        occupation: body.occupation || member.occupation,
      },
    });

    const profileData = {
      id: updated.id,
      fullName: `${updated.givenName || ''} ${updated.surname || ''}`.trim(),
      givenName: updated.givenName || '',
      surname: updated.surname || '',
      email: updated.email || '',
      phone: updated.contactNumber || '',
      birthdate: updated.birthdate,
      memberStatus: updated.memberStatus || 'ACTIVE',
      serverLevel: updated.serverLevel || '',
      dateJoined: updated.dateJoined,
      image: updated.image || null,
      address: updated.address || '',
      parentGuardian: updated.parentGuardian || '',
      emergencyContact: updated.emergencyContact || '',
      emergencyNumber: updated.emergencyNumber || '',
      school: updated.school || '',
      occupation: updated.occupation || '',
    };

    return NextResponse.json({
      ...profileData,
      message: 'Profile updated successfully',
    });

  } catch (error: any) {
    console.error('Profile Update Error:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        message: error.message 
      },
      { status: 500 }
    );
  }
}