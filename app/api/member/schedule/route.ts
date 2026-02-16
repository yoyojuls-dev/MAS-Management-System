// app/api/member/schedule/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authConfig';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    // Ensure the user can only access their own schedule
    if (memberId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentDate = new Date();

    // Get events where the member is participating
    const memberEvents = await prisma.eventParticipant.findMany({
      where: {
        memberId: memberId
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            eventType: true,
            date: true,
            startTime: true,
            endTime: true,
            location: true,
            status: true
          }
        }
      },
      orderBy: {
        event: {
          date: 'asc'
        }
      }
    });

    // Get attendance records (past duties)
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        memberId: memberId
      },
      orderBy: {
        eventDate: 'desc'
      },
      take: 10, // Get recent 10 records
      select: {
        id: true,
        eventType: true,
        eventDate: true,
        serviceTime: true,
        status: true,
        notes: true
      }
    });

    // Get ministry events (general ministry activities)
    const ministryEvents = await prisma.ministryEvent.findMany({
      where: {
        date: {
          gte: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days and future
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        location: true,
        conductor: true,
        purpose: true,
        status: true
      }
    });

    // Transform data to match frontend interface
    const scheduleItems = [
      // Transform member events
      ...memberEvents.map(participant => ({
        id: `event-${participant.event.id}`,
        title: participant.event.title,
        date: participant.event.date.toISOString().split('T')[0],
        time: participant.event.startTime,
        location: participant.event.location || 'TBD',
        type: getScheduleType(participant.event.eventType),
        status: getScheduleStatus(participant.event.status, participant.event.date)
      })),

      // Transform attendance records (past duties)
      ...attendanceRecords.map(attendance => ({
        id: `attendance-${attendance.id}`,
        title: `${formatEventType(attendance.eventType)} - ${attendance.status}`,
        date: attendance.eventDate.toISOString().split('T')[0],
        time: attendance.serviceTime || '00:00',
        location: getLocationFromEventType(attendance.eventType),
        type: 'duty' as const,
        status: attendance.eventDate < currentDate ? 'completed' as const : 'upcoming' as const
      })),

      // Transform ministry events
      ...ministryEvents.map(ministryEvent => ({
        id: `ministry-${ministryEvent.id}`,
        title: ministryEvent.title,
        date: ministryEvent.date.toISOString().split('T')[0],
        time: ministryEvent.time,
        location: ministryEvent.location || 'Parish',
        type: 'event' as const,
        status: getScheduleStatus(ministryEvent.status, ministryEvent.date)
      }))
    ];

    // Sort by date and remove duplicates
    const sortedSchedule = scheduleItems
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20); // Limit to 20 most relevant items

    return NextResponse.json(sortedSchedule);

  } catch (error) {
    console.error('Error fetching member schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function getScheduleType(eventType: string): 'duty' | 'meeting' | 'event' {
  switch (eventType) {
    case 'SUNDAY_MASS':
    case 'DAILY_MASS':
    case 'SPECIAL_MASS':
    case 'HOLY_DAY':
      return 'duty';
    case 'MEETING':
      return 'meeting';
    case 'RETREAT':
    case 'TRAINING':
    case 'SOCIAL_EVENT':
    case 'COMMUNITY_SERVICE':
    default:
      return 'event';
  }
}

function getScheduleStatus(status: string, date: Date): 'upcoming' | 'completed' | 'cancelled' {
  const currentDate = new Date();
  
  if (status === 'CANCELLED') {
    return 'cancelled';
  }
  
  if (status === 'COMPLETED' || date < currentDate) {
    return 'completed';
  }
  
  return 'upcoming';
}

function formatEventType(eventType: string): string {
  switch (eventType) {
    case 'SUNDAY_MASS':
      return 'Sunday Mass';
    case 'DAILY_MASS':
      return 'Daily Mass';
    case 'MONTHLY_MEETING':
      return 'Monthly Meeting';
    case 'SPECIAL_EVENT':
      return 'Special Event';
    case 'TRAINING':
      return 'Training';
    case 'RETREAT':
      return 'Retreat';
    default:
      return eventType.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
  }
}

function getLocationFromEventType(eventType: string): string {
  switch (eventType) {
    case 'SUNDAY_MASS':
    case 'DAILY_MASS':
      return 'Main Altar';
    case 'MONTHLY_MEETING':
      return 'Parish Hall';
    case 'TRAINING':
      return 'Training Room';
    case 'RETREAT':
      return 'Retreat Center';
    default:
      return 'Parish';
  }
}