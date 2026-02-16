import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, adminId, position, contactNumber } = body;

    if (!name || !email || !adminId || !position || !contactNumber) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if any admin already exists - using adminUser table instead of user
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        error: 'Admin registration is closed. An admin already exists.' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 400 });
    }

    // Check if adminId already exists
    const existingAdminId = await prisma.adminUser.findUnique({
      where: { adminId }
    });

    if (existingAdminId) {
      return NextResponse.json({ 
        error: 'This admin ID is already taken' 
      }, { status: 400 });
    }

    // Create admin user (only with fields that exist in your schema)
    const admin = await prisma.adminUser.create({
      data: {
        name,
        email,
        adminId,
        position,
        contactNumber,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({
      message: 'Admin registered successfully',
      admin: admin
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}