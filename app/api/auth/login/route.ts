/* app/api/auth/login/route.ts */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prismadb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check adminUser table first
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (adminUser && adminUser.email) {
      // Check if admin has hashedPassword and verify it
      if (adminUser.hashedPassword && await compare(password, adminUser.hashedPassword)) {
        return NextResponse.json({
          success: true,
          user: {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            userType: 'ADMIN',
            role: 'ADMIN',
          }
        });
      }
    }

    // Check member table if not found in adminUser
    const member = await prisma.member.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (member && member.email) {
      // Check if member has hashedPassword and verify it
      if (member.hashedPassword && await compare(password, member.hashedPassword)) {
        return NextResponse.json({
          success: true,
          user: {
            id: member.id,
            name: `${member.givenName} ${member.surname}`,
            email: member.email,
            userType: 'MEMBER',
            role: 'MEMBER',
          }
        });
      }
    }

    // Invalid credentials
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}