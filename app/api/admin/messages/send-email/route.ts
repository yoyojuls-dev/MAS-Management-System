// app/api/admin/messages/send-email/route.ts
// Fixed: Responsive email template with visible button and proper styling

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prismadb";

// Create email template HTML - FULLY RESPONSIVE
const createEmailHTML = (
  recipientName: string,
  subject: string,
  message: string
): string => {
  const baseUrl = "https://sndbs-mas-management-system.vercel.app";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
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
        
        /* Header Section */
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
        
        /* Main Content */
        .email-body {
            padding: 40px 30px;
            color: #333333;
        }
        
        .email-body h2 {
            color: #4169E1;
            font-size: 22px;
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
        
        .email-body ul {
            margin: 20px 0 20px 20px;
            list-style-type: none;
            padding: 0;
        }
        
        .email-body li {
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 12px;
            color: #555555;
            padding-left: 24px;
            position: relative;
        }
        
        .email-body li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #4169E1;
            font-weight: bold;
            font-size: 18px;
        }
        
        .highlight-box {
            background-color: #f0f4ff;
            border-left: 4px solid #4169E1;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
            text-align: center;
        }
        
        .highlight-box p {
            margin: 0;
            color: #333333;
            font-weight: 500;
            font-style: italic;
            font-size: 15px;
            line-height: 1.6;
        }
        
        /* CTA Button - FIXED */
        .button-wrapper {
            margin: 30px 0;
            text-align: center;
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
            transition: opacity 0.2s;
            mso-padding-alt: 16px 40px;
            mso-border-alt: none;
        }
        
        .cta-button:hover {
            opacity: 0.9;
        }
        
        .cta-button:visited {
            color: #ffffff !important;
        }
        
        .cta-button:active {
            color: #ffffff !important;
        }
        
        /* Divider */
        .divider {
            height: 2px;
            background-color: #e0e0e0;
            margin: 30px 0;
            border: none;
        }
        
        /* Footer Section */
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
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0 !important;
            }
            
            .email-header {
                padding: 30px 20px !important;
                text-align: center !important;
            }
            
            .header-logo img {
                width: 70px !important;
                height: 70px !important;
            }
            
            .header-content h1 {
                font-size: 22px !important;
                margin-bottom: 8px !important;
            }
            
            .header-content p {
                font-size: 13px !important;
                margin: 3px 0 !important;
            }
            
            .email-body {
                padding: 25px 20px !important;
            }
            
            .email-body h2 {
                font-size: 20px !important;
                margin-bottom: 16px !important;
            }
            
            .email-body p {
                font-size: 14px !important;
                margin-bottom: 14px !important;
            }
            
            .highlight-box {
                padding: 16px !important;
                margin: 16px 0 !important;
            }
            
            .highlight-box p {
                font-size: 14px !important;
            }
            
            .button-wrapper {
                margin: 24px 0 !important;
            }
            
            .cta-button {
                display: block !important;
                padding: 14px 30px !important;
                width: 100% !important;
                max-width: 300px !important;
                box-sizing: border-box !important;
                font-size: 15px !important;
            }
            
            .divider {
                margin: 24px 0 !important;
            }
            
            .email-footer {
                padding: 20px !important;
            }
            
            .footer-logo img {
                width: 50px !important;
                height: 50px !important;
                margin: 0 auto 10px !important;
            }
            
            .footer-link {
                font-size: 13px !important;
            }
            
            .footer-info {
                font-size: 11px !important;
            }
        }
        
        /* Outlook fixes */
        .outlook-group-fix {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <!-- Header -->
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

            <!-- Body Content -->
            <div class="email-body">
                <h2>${subject}</h2>
                
                <p>Dear ${recipientName},</p>
                
                <p>${message}</p>
                
                <div class="highlight-box">
                    <p>"I have come not to be served, but to serve." - Matthew 20:28</p>
                </div>
                
                <div class="button-wrapper">
                    <a href="${baseUrl}" class="cta-button">Visit Our Portal</a>
                </div>

                <hr class="divider">
            </div>

            <!-- Footer -->
            <div class="email-footer">
                <div class="footer-greeting">
                    Regards,<br>
                    <strong>MAS TEAM</strong>
                </div>
                
                <hr class="footer-divider">
                
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Email request body:", body);

    const {
      memberIds = [],
      applicantEmail,
      applicantName,
      subject,
      message,
      scheduledFor,
    } = body;

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        { error: "Email configuration is missing" },
        { status: 500 }
      );
    }

    // Collect all recipient emails
    const recipientEmails: Array<{ email: string; name: string }> = [];

    // Add applicant email if provided
    if (applicantEmail && applicantEmail.trim()) {
      recipientEmails.push({
        email: applicantEmail.trim(),
        name: applicantName || "Applicant",
      });
      console.log("Added applicant email:", applicantEmail);
    }

    // Add member emails if provided
    if (memberIds && memberIds.length > 0) {
      try {
        const members = await prisma.member.findMany({
          where: {
            id: { in: memberIds },
          },
          select: {
            id: true,
            email: true,
            givenName: true,
            surname: true,
          },
        });

        members.forEach((member) => {
          if (member.email && member.email.trim()) {
            recipientEmails.push({
              email: member.email.trim(),
              name: `${member.givenName} ${member.surname}`,
            });
          }
        });
        console.log(`Added ${members.length} member emails`);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    }

    // Validate we have at least one recipient
    if (recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "No valid recipient emails found" },
        { status: 400 }
      );
    }

    console.log(`Sending email to ${recipientEmails.length} recipients`);

    // If scheduled for later, save to database instead of sending
    if (scheduledFor) {
      console.log(`Scheduling email for ${scheduledFor}`);
      // TODO: Save to ScheduledEmail table in database
      return NextResponse.json({
        success: true,
        message: "Email scheduled successfully",
        scheduled: true,
        recipientCount: recipientEmails.length,
      });
    }

    // Send email immediately to each recipient
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    for (const recipient of recipientEmails) {
      try {
        const htmlContent = createEmailHTML(
          recipient.name,
          subject,
          message
        );

        const mailOptions = {
          from: emailUser,
          to: recipient.email,
          subject: subject,
          html: htmlContent,
          replyTo: emailUser,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient.email}:`, info.messageId);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedCount++;
        failedEmails.push(recipient.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email sent to ${sentCount} recipient${sentCount !== 1 ? "s" : ""}${
        failedCount > 0 ? `, ${failedCount} failed` : ""
      }`,
      sentCount,
      failedCount,
      failedEmails: failedCount > 0 ? failedEmails : [],
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Email API is working. Use POST to send emails.",
    endpoints: {
      POST: {
        description: "Send emails to members and/or applicants",
        body: {
          memberIds: ["member1", "member2"], // Optional: array of member IDs
          applicantEmail: "applicant@email.com", // Optional: single applicant email
          applicantName: "John Doe", // Optional: applicant name
          subject: "Email Subject",
          message: "Email message body",
          scheduledFor: "2026-02-28T09:00", // Optional: ISO format datetime for scheduling
        },
      },
    },
  });
}