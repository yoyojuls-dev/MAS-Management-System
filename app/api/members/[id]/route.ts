import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

// GET specific member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        // Only using fields that actually exist in your member table
        surname: true,
        givenName: true,
        memberStatus: true,
        email: true,
        contactNumber: true,
        birthdate: true,  // Changed from birthday to birthdate
        address: true,
      }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Extract only the fields that exist in your member table
    const {
      surname,
      givenName,
      memberStatus,
      email,
      contactNumber,
      birthdate,  // Changed from birthday to birthdate
      address,
    } = body;

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        ...(surname && { surname }),
        ...(givenName && { givenName }),
        ...(memberStatus && { memberStatus }),
        ...(email && { email }),
        ...(contactNumber && { contactNumber }),
        ...(birthdate && { birthdate: new Date(birthdate) }),
        ...(address && { address }),
      },
      select: {
        id: true,
        surname: true,
        givenName: true,
        memberStatus: true,
        email: true,
        contactNumber: true,
        birthdate: true,  // Changed from birthday to birthdate
        address: true,
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Instead of deleting, you might want to update status to INACTIVE
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        memberStatus: 'INACTIVE'
      }
    });

    return NextResponse.json({
      message: 'Member deactivated successfully',
      member: updatedMember
    });
  } catch (error) {
    console.error('Error deactivating member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}