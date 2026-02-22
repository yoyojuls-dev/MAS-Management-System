// app/api/cron/send-scheduled-emails/route.ts
// COMPLETE FILE - COPY AND PASTE ALL OF THIS
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prismadb";

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
            white-space: pre-wrap;
            word-wrap: break-word;
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
                <h2>${subject}</h2>
                <p>Dear Member,</p>
                <p>${message}</p>
                <hr class="divider">
            </div>

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting scheduled email cron job...");

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      return NextResponse.json(
        { error: "Email configuration is missing" },
        { status: 500 }
      );
    }

    // Get all pending scheduled emails that are due to be sent
    const now = new Date();
    const scheduledEmails = await prisma.scheduledEmail.findMany({
      where: {
        status: "PENDING",
        scheduledFor: {
          lte: now,
        },
      },
    });

    console.log(`Found ${scheduledEmails.length} scheduled emails to send`);

    if (scheduledEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scheduled emails to send at this time",
        sentCount: 0,
        failedCount: 0,
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const scheduledEmail of scheduledEmails) {
      try {
        // Send to each email in memberIds array
        for (const email of scheduledEmail.memberIds) {
          try {
            const htmlContent = createEmailHTML(
              "Member",
              scheduledEmail.subject,
              scheduledEmail.message
            );

            const mailOptions = {
              from: emailUser,
              to: email,
              subject: scheduledEmail.subject,
              html: htmlContent,
              replyTo: emailUser,
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`✓ Scheduled email sent to ${email}`);
            sentCount++;
          } catch (error) {
            console.error(
              `✗ Failed to send scheduled email to ${email}:`,
              error
            );
            failedCount++;
          }
        }

        // Mark entire scheduled message as sent
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: {
            status: "SENT",
          },
        });
      } catch (error) {
        console.error(`✗ Failed to process scheduled email:`, error);

        // Mark as failed
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: { status: "FAILED" },
        });

        failedCount++;
      }
    }

    console.log(
      `Scheduled email cron job completed: ${sentCount} sent, ${failedCount} failed`
    );

    return NextResponse.json({
      success: true,
      message: "Scheduled email cron job completed",
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("Error in scheduled email cron job:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process scheduled emails",
      },
      { status: 500 }
    );
  }
}