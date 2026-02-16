// app/api/member/group/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
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
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // TODO: Implement Sunday Groups functionality
    // For now, returning a placeholder
    // Once Sunday Groups are implemented in the database, fetch from there
    // Example:
    // const groupAssignment = await prisma.sundayGroup.findFirst({
    //   where: {
    //     members: {
    //       has: member.id,
    //     },
    //   },
    // });

    return NextResponse.json({
      groupName: 'Not Assigned', // Default until groups are implemented
      // groupName: groupAssignment?.name || 'Not Assigned',
    });
  } catch (error) {
    console.error('Error fetching member group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    );
  }
}