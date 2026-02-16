// app/api/financial/dues/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

    // Fetch financial records (dues) for this member
    // Using FinancialRecord model with DUES type
    const dues = await prisma.financialRecord.findMany({
      where: {
        memberId: member.id,
        type: 'DUES'
      },
      orderBy: [{ transactionDate: 'desc' }]
    });

    // Format dues data
    const formattedDues = dues.map(due => {
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
        description: due.description,
        paymentMethod: due.paymentMethod,
        referenceNumber: due.referenceNumber,
        notes: due.notes
      };
    });

    return NextResponse.json(formattedDues);
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dues' },
      { status: 500 }
    );
  }
}