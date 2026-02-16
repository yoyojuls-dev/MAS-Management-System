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

    // Fetch attendance records for this member
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        memberId: account.member.id
      },
      orderBy: { eventDate: 'desc' }
    });

    // Format attendance data
    const formattedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      type: record.eventType || 'SUNDAY_MASS',
      date: record.eventDate,
      status: record.status || 'ABSENT',
      serviceTime: record.serviceTime,
      arrivalTime: record.arrivalTime,
      notes: record.notes
    }));

    return NextResponse.json(formattedAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}