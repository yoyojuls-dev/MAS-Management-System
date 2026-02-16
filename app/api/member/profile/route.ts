export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authConfig';
import prisma from '@/lib/prismadb';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find member by user ID (from Account model)
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        userType: 'MEMBER'
      },
      include: {
        member: true
      }
    });

    if (!account?.member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const member = account.member;

    return NextResponse.json({
      id: member.id,
      fullName: `${member.givenName} ${member.surname}`,
      givenName: member.givenName,
      surname: member.surname,
      email: member.email || '',
      phone: member.contactNumber || '',
      address: member.address || '',
      memberStatus: member.memberStatus,
      serverLevel: member.serverLevel,
      birthdate: member.birthdate,
      dateJoined: member.dateJoined,
      parentGuardian: member.parentGuardian || '',
      emergencyContact: member.emergencyContact || '',
      emergencyNumber: member.emergencyNumber || '',
      school: member.school || '',
      occupation: member.occupation || ''
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, email, phone, address, parentGuardian, emergencyContact, emergencyNumber, school, occupation } = body;

    // Find member by user ID
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        userType: 'MEMBER'
      },
      include: {
        member: true
      }
    });

    if (!account?.member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Split fullName into givenName and surname
    const nameParts = fullName?.split(' ') || [];
    const givenName = nameParts[0] || account.member.givenName;
    const surname = nameParts.slice(1).join(' ') || account.member.surname;

    const updated = await prisma.member.update({
      where: { id: account.member.id },
      data: {
        givenName,
        surname,
        email: email || account.member.email,
        contactNumber: phone || null,
        address: address || null,
        parentGuardian: parentGuardian || null,
        emergencyContact: emergencyContact || null,
        emergencyNumber: emergencyNumber || null,
        school: school || null,
        occupation: occupation || null
      }
    });

    return NextResponse.json({
      id: updated.id,
      fullName: `${updated.givenName} ${updated.surname}`,
      givenName: updated.givenName,
      surname: updated.surname,
      email: updated.email || '',
      phone: updated.contactNumber || '',
      address: updated.address || '',
      memberStatus: updated.memberStatus,
      serverLevel: updated.serverLevel,
      birthdate: updated.birthdate,
      dateJoined: updated.dateJoined,
      parentGuardian: updated.parentGuardian || '',
      emergencyContact: updated.emergencyContact || '',
      emergencyNumber: updated.emergencyNumber || '',
      school: updated.school || '',
      occupation: updated.occupation || ''
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}