// app/api/financial/dues/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prismadb';
import { authOptions } from '@/lib/authConfig';
export const revalidate = 0;

// Define session type for better TypeScript support
interface CustomSession {
  user: {
    id: string;
    email: string;
    userType: string;
    role?: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // only admins should access
    const isAdmin = session.user.userType === 'ADMIN' || session.user.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);

    const records = await prisma.financialRecord.findMany({
      where: {
        type: 'DUES',
        transactionDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            surname: true,
            givenName: true,
          },
        },
      },
      orderBy: { transactionDate: 'asc' },
    });

    // Group by member
    const map = new Map<string, any>();
    for (const r of records) {
      const member = r.member;
      const memberId = member?.id || r.memberId || 'unknown';
      const name = member ? `${member.givenName} ${member.surname}` : 'Unknown';

      if (!map.has(memberId)) {
        map.set(memberId, { memberId, memberName: name, payments: [] as any[] });
      }

      map.get(memberId)!.payments.push({
        id: r.id,
        amount: r.amount,
        date: r.transactionDate,
      });
    }

    const result = Array.from(map.values());

    return NextResponse.json({ year, results: result });
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json({ error: 'Failed to fetch dues' }, { status: 500 });
  }
}