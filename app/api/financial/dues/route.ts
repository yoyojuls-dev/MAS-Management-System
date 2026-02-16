export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authConfig';
import prisma from '@/lib/prismadb';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

    // Fetch financial records (dues) for this member
    const dues = await prisma.financialRecord.findMany({
      where: {
        memberId: account.member.id,
        type: 'DUES'
      },
      orderBy: [{ transactionDate: 'desc' }]
    });

    // Format dues data
    const formattedDues = dues.map(due => {
      // Extract month and year from transactionDate
      const date = new Date(due.transactionDate);
      const month = date.getMonth(); // 0-11
      const year = date.getFullYear();

      return {
        id: due.id,
        month: MONTHS[month] || `Month ${month + 1}`,
        year: year,
        amount: due.amount || 0,
        status: due.status === 'PAID' ? 'PAID' : 'UNPAID',
        dueDate: due.dueDate,
        paidDate: due.status === 'PAID' ? due.transactionDate : null,
        description: due.description
      };
    });

    return NextResponse.json(formattedDues);
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}