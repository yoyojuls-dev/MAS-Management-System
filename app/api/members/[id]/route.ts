export const dynamic = 'force-dynamic';
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
        surname: true,
        givenName: true,
        memberStatus: true,
        email: true,
        parentContact: true,
        birthdate: true,
        address: true,
        dateJoined: true,
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
    
    const {
      surname,
      givenName,
      memberStatus,
      email,
      parentContact,
      birthdate,
      address,
      dateJoined,
    } = body;

    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        ...(surname && { surname }),
        ...(givenName && { givenName }),
        ...(memberStatus && { memberStatus }),
        ...(email && { email }),
        ...(parentContact && { parentContact }),
        ...(birthdate && { birthdate: new Date(birthdate) }),
        ...(address && { address }),
        ...(dateJoined && { dateJoined: new Date(dateJoined) }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        surname: true,
        givenName: true,
        memberStatus: true,
        email: true,
        parentContact: true,
        birthdate: true,
        address: true,
        dateJoined: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Member updated successfully',
      member: updatedMember
    });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
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

    const member = await prisma.member.findUnique({
      where: { id }
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

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