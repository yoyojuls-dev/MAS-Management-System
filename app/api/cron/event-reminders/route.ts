// app/api/cron/event-reminders/route.ts
// Automated email reminders for upcoming events

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prismadb";

// Email template for event reminders
const createEventReminderEmail = (
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  daysUntil: number,
  location?: string
): string => {
  const baseUrl = "https://sndbs-mas-management-system.vercel.app";
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  const formattedDate = eventDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = eventDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let reminderMessage = '';
  if (daysUntil === 7) {
    reminderMessage = '⏰ This is a reminder that the event is coming up in <strong>1 week</strong>';
  } else if (daysUntil === 3) {
    reminderMessage = '⏰ This is a reminder that the event is coming up in <strong>3 days</strong>';
  } else if (daysUntil === 1) {
    reminderMessage = '⏰ This is a reminder that the event is coming up <strong>tomorrow</strong>';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Reminder - ${eventTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f5f5f5;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-wrapper {
            width: 100%;
            background-color: #f5f5f5;
            padding: 20px 0;
            line-height: 1.4;
            color: #333333;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
        }
        
        .email-header {
            background: linear-gradient(135deg, #4169E1 0%, #000080 100%);
            padding: 40px 30px;
            display: block;
            text-align: center;
        }
        
        .header-logo {
            margin-bottom: 20px;
        }
        
        .header-logo img {
            width: 80px;
            height: 80px;
            display: block;
            margin: 0 auto;
            object-fit: contain;
        }
        
        .header-content {
            color: white;
            text-align: center;
        }
        
        .header-content h1 {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 10px;
            line-height: 1.3;
            margin: 0 0 10px 0;
        }
        
        .header-content p {
            font-size: 14px;
            opacity: 0.95;
            line-height: 1.5;
            margin: 4px 0;
        }
        
        .email-body {
            padding: 40px 30px;
            color: #333333;
        }
        
        .email-body h2 {
            color: #4169E1;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: 600;
            margin: 0 0 20px 0;
        }
        
        .email-body p {
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 16px;
            color: #555555;
            margin: 0 0 16px 0;
        }
        
        .reminder-badge {
            display: inline-block;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 16px 20px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: 600;
            color: #856404;
            font-size: 15px;
        }
        
        .event-details {
            background-color: #f0f4ff;
            border-left: 4px solid #4169E1;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .event-details h3 {
            color: #4169E1;
            font-size: 18px;
            margin-bottom: 12px;
            margin: 0 0 12px 0;
        }
        
        .event-detail-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 14px;
            color: #555555;
        }
        
        .event-detail-label {
            font-weight: 600;
            color: #4169E1;
            width: 100px;
            margin-right: 16px;
        }
        
        .event-detail-value {
            flex: 1;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4169E1 0%, #000080 100%);
            color: #ffffff !important;
            padding: 16px 40px;
            text-decoration: none !important;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            border: none;
            cursor: pointer;
            text-align: center;
            line-height: 1.4;
            margin: 20px 0;
            mso-padding-alt: 16px 40px;
            mso-border-alt: none;
        }
        
        .cta-button:visited {
            color: #ffffff !important;
        }
        
        .divider {
            height: 2px;
            background-color: #e0e0e0;
            margin: 30px 0;
            border: none;
        }
        
        .email-footer {
            background-color: #f9f9f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer-greeting {
            font-size: 15px;
            color: #555555;
            margin-bottom: 8px;
            line-height: 1.6;
            margin: 0 0 8px 0;
        }
        
        .footer-greeting strong {
            color: #4169E1;
            font-weight: 600;
        }
        
        .footer-divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 20px 0;
            border: none;
        }
        
        .footer-logo {
            margin: 20px 0;
        }
        
        .footer-logo img {
            width: 60px;
            height: 60px;
            display: block;
            margin: 0 auto 12px;
            object-fit: contain;
        }
        
        .footer-link {
            display: inline-block;
            font-size: 14px;
            color: #4169E1 !important;
            text-decoration: none !important;
            font-weight: 600;
            margin: 12px 0;
        }
        
        .footer-link:visited {
            color: #4169E1 !important;
        }
        
        .footer-info {
            font-size: 12px;
            color: #999999;
            margin-top: 16px;
            line-height: 1.6;
        }
        
        .footer-info p {
            margin: 4px 0;
        }
        
        .footer-copyright {
            margin-top: 12px;
            color: #bbb;
            font-size: 12px;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0 !important;
            }
            
            .email-header {
                padding: 30px 20px !important;
            }
            
            .header-logo img {
                width: 70px !important;
                height: 70px !important;
            }
            
            .header-content h1 {
                font-size: 22px !important;
            }
            
            .email-body {
                padding: 25px 20px !important;
            }
            
            .email-body h2 {
                font-size: 20px !important;
            }
            
            .event-detail-row {
                flex-direction: column;
            }
            
            .event-detail-label {
                width: 100%;
                margin-bottom: 4px;
            }
            
            .email-footer {
                padding: 20px !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <div class="header-logo">
                    <img src="${baseUrl}/images/LOGOs.png" alt="SNDBS Logo" width="80" height="80">
                </div>
                <div class="header-content">
                    <h1>SNDBS - Ministry of Altar Servers</h1>
                    <p>Vicariate of Sto. Nino</p>
                    <p>Phase 1 Bagong Silang, Caloocan City</p>
                </div>
            </div>

            <div class="email-body">
                <h2>Event Reminder</h2>
                
                <p>Dear ${recipientName},</p>
                
                <div class="reminder-badge">
                    ${reminderMessage}
                </div>
                
                <p>We wanted to remind you about the upcoming event below:</p>
                
                <div class="event-details">
                    <h3>${eventTitle}</h3>
                    <div class="event-detail-row">
                        <div class="event-detail-label">📅 Date:</div>
                        <div class="event-detail-value">${formattedDate}</div>
                    </div>
                    <div class="event-detail-row">
                        <div class="event-detail-label">⏰ Time:</div>
                        <div class="event-detail-value">${formattedTime}</div>
                    </div>
                    ${location ? `
                    <div class="event-detail-row">
                        <div class="event-detail-label">📍 Location:</div>
                        <div class="event-detail-value">${location}</div>
                    </div>
                    ` : ''}
                </div>
                
                <p>Please mark your calendar and prepare for this important ministry event. Your presence and participation are highly valued.</p>
                
                <a href="${baseUrl}/member/dashboard" class="cta-button">View All Events</a>

                <div class="divider"></div>
            </div>

            <div class="email-footer">
                <div class="footer-greeting">
                    Regards,<br>
                    <strong>MAS TEAM</strong>
                </div>
                
                <div class="footer-divider"></div>
                
                <div class="footer-logo">
                    <img src="${baseUrl}/images/MAS%20LOGO.png" alt="MAS Logo" width="60" height="60">
                </div>
                
                <a href="${baseUrl}" class="footer-link">${baseUrl}/</a>
                
                <div class="footer-info">
                    <p>Ministry of Altar Servers Management System</p>
                    <p>SNDBS - Vicariate of Sto. Nino</p>
                    <p>Phase 1 Bagong Silang, Caloocan City</p>
                    <p class="footer-copyright">© 2026 Ministry of Altar Servers. All rights reserved.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

export async function GET(request: NextRequest) {
  // Verify this is a cron job request (add authorization if needed)
  const authHeader = request.headers.get('authorization');
  
  // Optional: Add a cron secret for extra security
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting event reminder cron job...");

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        { error: "Email configuration is missing" },
        { status: 500 }
      );
    }

    // Get all events from the database
    const events = await prisma.event.findMany({
      where: {
        // Get events that are in the future
        date: {
          gte: new Date(),
        },
      },
    });

    console.log(`Found ${events.length} upcoming events`);

    let remindersSent = 0;
    let remindersFailed = 0;
    const results: any[] = [];

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Process each event
    for (const event of events) {
      const eventDate = new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate days until event
      const timeDiff = eventDate.getTime() - today.getTime();
      const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Check if this is a reminder day (1 week, 3 days, or 1 day before)
      const reminderDays = [7, 3, 1];
      
      if (!reminderDays.includes(daysUntil)) {
        continue; // Skip if not a reminder day
      }

      console.log(`Event "${event.title}" is ${daysUntil} days away - sending reminders`);

      // Get all members to send reminders to
      try {
        const members = await prisma.member.findMany({
          where: {
            memberStatus: "ACTIVE",
          },
          select: {
            id: true,
            email: true,
            givenName: true,
            surname: true,
          },
        });

        console.log(`Sending reminders to ${members.length} members for event "${event.title}"`);

        // Send email to each member
        for (const member of members) {
          try {
            if (!member.email || !member.email.trim()) {
              console.warn(`Skipping member ${member.id} - no email`);
              continue;
            }

            const htmlContent = createEventReminderEmail(
              `${member.givenName} ${member.surname}`,
              event.title,
              event.date,
              event.time || "09:00",
              daysUntil,
              event.location
            );

            const mailOptions = {
              from: emailUser,
              to: member.email.trim(),
              subject: `Reminder: ${event.title} is coming up in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
              html: htmlContent,
              replyTo: emailUser,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✓ Reminder sent to ${member.email} for event "${event.title}" (${daysUntil} days away)`);
            remindersSent++;
          } catch (error) {
            console.error(`✗ Failed to send reminder to ${member.email}:`, error);
            remindersFailed++;
          }
        }

        results.push({
          eventId: event.id,
          eventTitle: event.title,
          daysUntil,
          memberCount: members.length,
          sentCount: remindersSent,
          failedCount: remindersFailed,
        });
      } catch (error) {
        console.error(`Error processing event "${event.title}":`, error);
        remindersFailed++;
      }
    }

    console.log(`Cron job completed: ${remindersSent} reminders sent, ${remindersFailed} failed`);

    return NextResponse.json({
      success: true,
      message: `Event reminder cron job completed`,
      remindersSent,
      remindersFailed,
      results,
    });
  } catch (error) {
    console.error("Error in event reminder cron job:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process event reminders",
      },
      { status: 500 }
    );
  }
}