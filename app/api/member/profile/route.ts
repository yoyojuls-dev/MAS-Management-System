// app/api/member/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the member by email
    const member = await prisma.member.findFirst({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        surname: true,
        givenName: true,
        email: true,
        contactNumber: true,
        birthdate: true,
        memberStatus: true,
        serverLevel: true,
        dateJoined: true,
        image: true,
        address: true,
        parentGuardian: true,
        emergencyContact: true,
        emergencyNumber: true,
        school: true,
        occupation: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Format the full name
    const fullName = `${member.givenName} ${member.surname}`;

    return NextResponse.json({
      id: member.id,
      fullName,
      surname: member.surname,
      givenName: member.givenName,
      email: member.email,
      phone: member.contactNumber,
      birthdate: member.birthdate,
      memberStatus: member.memberStatus,
      serverLevel: member.serverLevel,
      dateJoined: member.dateJoined,
      image: member.image,
      address: member.address,
      parentGuardian: member.parentGuardian,
      emergencyContact: member.emergencyContact,
      emergencyNumber: member.emergencyNumber,
      school: member.school,
      occupation: member.occupation,
    });
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // If password change is requested
    if (currentPassword || newPassword || confirmPassword) {
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
        select: {
          id: true,
          surname: true,
          givenName: true,
          email: true,
          contactNumber: true,
          birthdate: true,
          memberStatus: true,
          serverLevel: true,
          dateJoined: true,
          image: true,
          address: true,
          parentGuardian: true,
          emergencyContact: true,
          emergencyNumber: true,
          school: true,
          occupation: true,
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
          phone: updatedMember.contactNumber,
          birthdate: updatedMember.birthdate,
          memberStatus: updatedMember.memberStatus,
          serverLevel: updatedMember.serverLevel,
          dateJoined: updatedMember.dateJoined,
          image: updatedMember.image,
          address: updatedMember.address,
          parentGuardian: updatedMember.parentGuardian,
          emergencyContact: updatedMember.emergencyContact,
          emergencyNumber: updatedMember.emergencyNumber,
          school: updatedMember.school,
          occupation: updatedMember.occupation,
        },
      });
    }

    // Update only profile info (no password change)
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
      select: {
        id: true,
        surname: true,
        givenName: true,
        email: true,
        contactNumber: true,
        birthdate: true,
        memberStatus: true,
        serverLevel: true,
        dateJoined: true,
        image: true,
        address: true,
        parentGuardian: true,
        emergencyContact: true,
        emergencyNumber: true,
        school: true,
        occupation: true,
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
        phone: updatedMember.contactNumber,
        birthdate: updatedMember.birthdate,
        memberStatus: updatedMember.memberStatus,
        serverLevel: updatedMember.serverLevel,
        dateJoined: updatedMember.dateJoined,
        image: updatedMember.image,
        address: updatedMember.address,
        parentGuardian: updatedMember.parentGuardian,
        emergencyContact: updatedMember.emergencyContact,
        emergencyNumber: updatedMember.emergencyNumber,
        school: updatedMember.school,
        occupation: updatedMember.occupation,
      },
    });
  } catch (error) {
    console.error('Error updating member profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}