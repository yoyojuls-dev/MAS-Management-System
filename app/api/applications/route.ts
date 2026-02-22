// app/api/applications/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const applications = await prisma.application.findMany({
      where: {
        status: status,
      },
      orderBy: {
        appliedAt: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, birthday, address, parentName, email, contactNumber, facebookName } = body;

    // Validate required fields
    if (!name || !birthday || !address || !parentName || !email || !contactNumber) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    // Check if email already exists in applications
    const existingApplication = await prisma.application.findFirst({
      where: {
        email: email,
        status: "PENDING",
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "An application with this email is already pending" },
        { status: 400 }
      );
    }

    // Save application to database
    const application = await prisma.application.create({
      data: {
        name,
        birthday: new Date(birthday),
        address,
        parentName,
        email,
        contactNumber,
        facebookName: facebookName || null,
        status: "PENDING",
      },
    });

    console.log("Application created successfully:", application.id);

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully! We will review it soon.",
      application,
    });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit application" },
      { status: 500 }
    );
  }
}