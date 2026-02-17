// app/api/member/profile/route.ts - SIMPLIFIED & DEBUGGED
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[PROFILE] GET request started');

    const session = await getServerSession();
    console.log('[PROFILE] Session:', session);
    
    if (!session?.user?.email) {
      console.log('[PROFILE] No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PROFILE] Fetching member for email:', session.user.email);

    // Find the member by email
    const member = await prisma.member.findFirst({
      where: {
        email: session.user.email,
      },
    });

    console.log('[PROFILE] Member found:', member?.id);

    if (!member) {
      console.log('[PROFILE] Member not found for email:', session.user.email);
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Format the full name
    const fullName = `${member.givenName} ${member.surname}`;

    const responseData = {
      id: member.id,
      fullName: fullName,
      surname: member.surname,
      givenName: member.givenName,
      email: member.email,
      phone: member.contactNumber || '',
      birthdate: member.birthdate,
      memberStatus: member.memberStatus,
      serverLevel: member.serverLevel,
      dateJoined: member.dateJoined,
      image: member.image || null,
      address: member.address || '',
      parentGuardian: member.parentGuardian || '',
      emergencyContact: member.emergencyContact || '',
      emergencyNumber: member.emergencyNumber || '',
      school: member.school || '',
      occupation: member.occupation || '',
    };

    console.log('[PROFILE] Returning profile data for:', fullName);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[PROFILE] Error in GET:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[PROFILE] PUT request started');

    const session = await getServerSession();
    console.log('[PROFILE] Session for PUT:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('[PROFILE] No session for PUT');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[PROFILE] Request body keys:', Object.keys(body));

    const { 
      surname, 
      givenName, 
      email, 
      phone,
      address,
      parentGuardian,
      emergencyContact,
      emergencyNumber,
      school,
      occupation,
      currentPassword, 
      newPassword,
      confirmPassword
    } = body;

    // Find the member by email
    const member = await prisma.member.findFirst({
      where: {
        email: session.user.email,
      },
    });

    if (!member) {
      console.log('[PROFILE] Member not found for PUT');
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // If password change is requested
    if (currentPassword || newPassword || confirmPassword) {
      console.log('[PROFILE] Password change requested');

      // Validate all password fields are provided
      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: 'All password fields are required' },
          { status: 400 }
        );
      }

      // Validate new passwords match
      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: 'New passwords do not match' },
          { status: 400 }
        );
      }

      // Validate password length
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        );
      }

      // Check if current password is correct
      if (!member.hashedPassword) {
        return NextResponse.json(
          { error: 'Account does not have a password set' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, member.hashedPassword);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update member with new password and other fields
      const updatedMember = await prisma.member.update({
        where: { id: member.id },
        data: {
          hashedPassword,
          surname: surname || member.surname,
          givenName: givenName || member.givenName,
          email: email || member.email,
          contactNumber: phone || member.contactNumber,
          address: address || member.address,
          parentGuardian: parentGuardian || member.parentGuardian,
          emergencyContact: emergencyContact || member.emergencyContact,
          emergencyNumber: emergencyNumber || member.emergencyNumber,
          school: school || member.school,
          occupation: occupation || member.occupation,
        },
      });

      const fullName = `${updatedMember.givenName} ${updatedMember.surname}`;

      return NextResponse.json({
        success: true,
        message: 'Profile and password updated successfully',
        data: {
          id: updatedMember.id,
          fullName,
          surname: updatedMember.surname,
          givenName: updatedMember.givenName,
          email: updatedMember.email,
          phone: updatedMember.contactNumber || '',
          birthdate: updatedMember.birthdate,
          memberStatus: updatedMember.memberStatus,
          serverLevel: updatedMember.serverLevel,
          dateJoined: updatedMember.dateJoined,
          image: updatedMember.image || null,
          address: updatedMember.address || '',
          parentGuardian: updatedMember.parentGuardian || '',
          emergencyContact: updatedMember.emergencyContact || '',
          emergencyNumber: updatedMember.emergencyNumber || '',
          school: updatedMember.school || '',
          occupation: updatedMember.occupation || '',
        },
      });
    }

    // Update only profile info (no password change)
    console.log('[PROFILE] Updating profile info without password');

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: {
        surname: surname || member.surname,
        givenName: givenName || member.givenName,
        email: email || member.email,
        contactNumber: phone || member.contactNumber,
        address: address || member.address,
        parentGuardian: parentGuardian || member.parentGuardian,
        emergencyContact: emergencyContact || member.emergencyContact,
        emergencyNumber: emergencyNumber || member.emergencyNumber,
        school: school || member.school,
        occupation: occupation || member.occupation,
      },
    });

    const fullName = `${updatedMember.givenName} ${updatedMember.surname}`;

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedMember.id,
        fullName,
        surname: updatedMember.surname,
        givenName: updatedMember.givenName,
        email: updatedMember.email,
        phone: updatedMember.contactNumber || '',
        birthdate: updatedMember.birthdate,
        memberStatus: updatedMember.memberStatus,
        serverLevel: updatedMember.serverLevel,
        dateJoined: updatedMember.dateJoined,
        image: updatedMember.image || null,
        address: updatedMember.address || '',
        parentGuardian: updatedMember.parentGuardian || '',
        emergencyContact: updatedMember.emergencyContact || '',
        emergencyNumber: updatedMember.emergencyNumber || '',
        school: updatedMember.school || '',
        occupation: updatedMember.occupation || '',
      },
    });
  } catch (error) {
    console.error('[PROFILE] Error in PUT:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update profile', details: errorMessage },
      { status: 500 }
    );
  }
}