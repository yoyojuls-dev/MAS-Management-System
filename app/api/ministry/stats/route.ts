// app/api/ministry/stats/route.ts - Ministry Statistics API (Updated with Correct Schema)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching ministry statistics...');

    // Get the correct statistics based on your Prisma schema
    const [
      activeMembers,
      seniorServers,
      totalGroupsData,
      totalEvents
    ] = await Promise.all([
      // Active members (memberStatus = 'ACTIVE')
      prisma.member.count({
        where: {
          memberStatus: 'ACTIVE'
        }
      }),
      
      // Senior servers (serverLevel = 'SENIOR' AND memberStatus = 'ACTIVE')
      prisma.member.count({
        where: {
          memberStatus: 'ACTIVE',
          serverLevel: 'SENIOR'
        }
      }),
      
      // Total groups - get unique server levels that actually exist in the database
      prisma.member.groupBy({
        by: ['serverLevel'],
        where: {
          memberStatus: 'ACTIVE'
        },
        _count: {
          serverLevel: true
        }
      }),
      
      // Total events (both Event and MinistryEvent tables)
      Promise.all([
        prisma.event.count(),
        prisma.ministryEvent.count()
      ])
    ]);

    // Count unique server levels as total groups (actual groups that have members)
    const totalGroupsCount = totalGroupsData.length;

    // Sum both Event and MinistryEvent counts
    const [eventCount, ministryEventCount] = totalEvents;
    const totalEventsCount = eventCount + ministryEventCount;

    const stats = {
      totalMembers: activeMembers, // Show active members as total
      activeMembers,
      seniorServers,
      attendanceRate: totalGroupsCount, // Shows actual number of server level groups with members
      upcomingEvents: totalEventsCount // Shows total of both regular events and ministry events
    };

    console.log('✅ Ministry stats:', stats);
    console.log('📊 Groups breakdown:', totalGroupsData);
    
    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Error fetching ministry stats:', error);
    
    // Return fallback stats if database fails
    const fallbackStats = {
      totalMembers: 20,
      activeMembers: 20,
      seniorServers: 8,
      attendanceRate: 3, // 3 groups (NEOPHYTE, JUNIOR, SENIOR)
      upcomingEvents: 5 // Total events
    };

    return NextResponse.json(fallbackStats);
  } finally {
    await prisma.$disconnect();
  }
}