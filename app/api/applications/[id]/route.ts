// app/api/applications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        reviewedAt: new Date(),
        reviewedBy: "admin", // You can change this to get the actual admin ID from session
      },
    });

    console.log(`Application ${id} updated to ${status}`);

    return NextResponse.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const application = await prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.application.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete application" },
      { status: 500 }
    );
  }
}