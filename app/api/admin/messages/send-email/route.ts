// app/api/admin/messages/send-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

// Function to send email
async function sendEmailToMember(
  email: string,
  givenName: string,
  surname: string,
  subject: string,
  message: string
) {
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Dear ${givenName} ${surname},</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap;">
            ${message}
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #999;">
            Ministry of Altar Servers<br>
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: htmlContent,
  });
}

// Schedule email for later
async function scheduleEmail(
  memberIds: string[],
  subject: string,
  message: string,
  scheduledDateTime: string
) {
  try {
    // Store scheduled email in database
    const scheduledEmail = await prisma.scheduledEmail.create({
      data: {
        subject,
        message,
        scheduledFor: new Date(scheduledDateTime),
        memberIds,
        status: 'PENDING',
      },
    });

    return { id: scheduledEmail.id, scheduledFor: scheduledEmail.scheduledFor };
  } catch (error) {
    console.error("Error creating scheduled email:", error);
    throw new Error("Failed to schedule email");
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("Email configuration missing");
      return NextResponse.json(
        { error: "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { memberIds, subject, message, sendImmediately, scheduledDateTime } = body;

    if (!subject || subject.trim() === '') {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: "At least one member ID is required" },
        { status: 400 }
      );
    }

    // Fetch members
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        memberStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        givenName: true,
        surname: true,
      },
    });

    if (members.length === 0) {
      return NextResponse.json({ error: "No valid members found" }, { status: 404 });
    }

    const validMembers = members.filter((m): m is typeof m & { email: string } => m.email !== null && m.email !== '');

    if (validMembers.length === 0) {
      return NextResponse.json(
        { error: "Selected members have no email addresses" },
        { status: 404 }
      );
    }

    // Handle scheduled emails
    if (!sendImmediately) {
      if (!scheduledDateTime) {
        return NextResponse.json(
          { error: "Scheduled date and time are required" },
          { status: 400 }
        );
      }

      const scheduledDate = new Date(scheduledDateTime);
      if (scheduledDate < new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }

      try {
        const scheduled = await scheduleEmail(memberIds, subject, message, scheduledDateTime);
        return NextResponse.json({
          success: true,
          message: `Email scheduled for ${validMembers.length} recipient${validMembers.length !== 1 ? 's' : ''} on ${new Date(scheduledDateTime).toLocaleString()}`,
          scheduledId: scheduled.id,
          scheduledFor: scheduled.scheduledFor,
        });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to schedule email" },
          { status: 500 }
        );
      }
    }

    // Send emails immediately
    let successCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (const recipient of validMembers) {
      try {
        await sendEmailToMember(
          recipient.email,
          recipient.givenName,
          recipient.surname,
          subject,
          message
        );
        successCount++;
        console.log(`✓ Email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error(`✗ Failed to send email to ${recipient.email}:`, emailError);
        failedCount++;
        failedEmails.push(recipient.email);
      }
    }

    let responseMessage = '';
    if (successCount === 1) {
      responseMessage = `Email sent successfully to ${validMembers[0].givenName} ${validMembers[0].surname}`;
    } else if (successCount > 0) {
      responseMessage = `Emails sent successfully to ${successCount} member${successCount !== 1 ? 's' : ''}`;
    }

    if (failedCount > 0) {
      responseMessage += ` (${failedCount} failed)`;
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      sent: successCount,
      failed: failedCount,
      failedEmails: failedEmails,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/messages/send-email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to send email: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}