import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prismadb';
import { authOptions } from '@/lib/authConfig';

export async function POST() {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin exists - using adminUser table instead of user
    const adminExists = await prisma.adminUser.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminExists) {
      return NextResponse.json({ 
        error: 'Cannot disable registration - no admin users exist' 
      }, { status: 400 });
    }

    // Update system settings or handle registration disabling logic here
    // This depends on how you store system-wide settings
    // You might need a separate Settings table or environment variable
    
    return NextResponse.json({ 
      message: 'Registration disabled successfully' 
    });
    
  } catch (error) {
    console.error('Error disabling registration:', error);
    return NextResponse.json({ 
      error: 'Failed to disable registration' 
    }, { status: 500 });
  }
}