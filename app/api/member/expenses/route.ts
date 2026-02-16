// app/api/member/expenses/route.ts - Fixed with proper authentication
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authConfig';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Use your auth options for session
    const session = await getServerSession(authOptions);
    
    console.log('Session in expenses API:', session);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    console.log('Requested memberId:', memberId, 'Session user ID:', session.user.id);

    // Ensure the user can only access their own expenses
    if (memberId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get financial records for the member - only real data from database
    const expenses = await prisma.financialRecord.findMany({
      where: {
        memberId: memberId,
        type: {
          in: ['EXPENSE', 'DUES'] // Include both expenses and dues
        }
      },
      orderBy: {
        transactionDate: 'desc'
      },
      take: 20, // Get recent 20 expenses
      select: {
        id: true,
        description: true,
        amount: true,
        transactionDate: true,
        category: true,
        status: true,
        type: true,
        recordedBy: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`Found ${expenses.length} expenses for member ${memberId}`);

    // Transform the data to match frontend interface
    const transformedExpenses = expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: expense.transactionDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      category: expense.category || expense.type,
      approvedBy: expense.recordedBy?.name,
      status: mapPaymentStatusToFrontend(expense.status)
    }));

    return NextResponse.json(transformedExpenses);

  } catch (error) {
    console.error('Error fetching member expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to map database PaymentStatus to frontend status
function mapPaymentStatusToFrontend(status: string): 'pending' | 'approved' | 'rejected' {
  switch (status) {
    case 'PAID':
      return 'approved';
    case 'PENDING':
      return 'pending';
    case 'CANCELLED':
    case 'OVERDUE':
      return 'rejected';
    default:
      return 'pending';
  }
}

// POST method to create new expense request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, category } = body;

    if (!description || !amount) {
      return NextResponse.json({ 
        error: 'Description and amount are required' 
      }, { status: 400 });
    }

    // Find an admin to record the expense
    const admin = await prisma.adminUser.findFirst({
      where: { role: 'ADMIN', isActive: true }
    });

    if (!admin) {
      return NextResponse.json({ 
        error: 'No admin available to process expense' 
      }, { status: 500 });
    }

    const newExpense = await prisma.financialRecord.create({
      data: {
        type: 'EXPENSE',
        amount: parseFloat(amount),
        description,
        category: category || 'General',
        memberId: session.user.id,
        transactionDate: new Date(),
        status: 'PENDING',
        recordedByUserId: admin.id
      },
      include: {
        recordedBy: {
          select: {
            name: true
          }
        }
      }
    });

    // Transform for frontend
    const transformedExpense = {
      id: newExpense.id,
      description: newExpense.description,
      amount: newExpense.amount,
      date: newExpense.transactionDate.toISOString().split('T')[0],
      category: newExpense.category || newExpense.type,
      approvedBy: newExpense.recordedBy?.name,
      status: mapPaymentStatusToFrontend(newExpense.status)
    };

    return NextResponse.json(transformedExpense, { status: 201 });

  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}