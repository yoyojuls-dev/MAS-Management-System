// app/api/member/attendance/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

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
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Fetch attendance records for this member
    // Using Attendance model with eventType (SUNDAY_MASS, DAILY_MASS, MONTHLY_MEETING, etc.)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        memberId: member.id
      },
      orderBy: { eventDate: 'desc' }
    });

    // Format attendance data
    const formattedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      type: record.eventType, // SUNDAY_MASS, DAILY_MASS, MONTHLY_MEETING, SPECIAL_EVENT, TRAINING, RETREAT
      date: record.eventDate,
      status: record.status, // PRESENT, ABSENT, EXCUSED, LATE, EARLY_DEPARTURE
      serviceTime: record.serviceTime,
      arrivalTime: record.arrivalTime,
      notes: record.notes
    }));

    return NextResponse.json(formattedAttendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}