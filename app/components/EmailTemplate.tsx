// app/components/EmailTemplate.tsx
// Use this component to generate email HTML with custom content

interface EmailTemplateProps {
  recipientName?: string;
  subject?: string;
  message?: string;
  title?: string;
  showQuote?: boolean;
}

export const EmailTemplate = ({
  recipientName = "Applicant",
  subject = "Welcome to the Ministry of Altar Servers!",
  message = "Thank you for your interest in joining the Ministry of Altar Servers. We are excited to have you as part of our community dedicated to serving at the altar of the Lord.",
  title = "Welcome to the Ministry of Altar Servers!",
  showQuote = true,
}: EmailTemplateProps) => {
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
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Header Section */
        .email-header {
            background: linear-gradient(135deg, #4169E1 0%, #000080 100%);
            padding: 40px 30px;
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .header-logo {
            flex-shrink: 0;
        }
        
        .header-logo img {
            width: 80px;
            height: 80px;
            object-fit: contain;
        }
        
        .header-content {
            color: white;
            flex: 1;
        }
        
        .header-content h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            line-height: 1.2;
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
        }
        
        .email-body p {
            font-size: 15px;
            line-height: 1.8;
            margin-bottom: 16px;
            color: #555555;
        }
        
        .email-body ul {
            margin: 20px 0 20px 20px;
            list-style-type: none;
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
        }
        
        .highlight-box p {
            margin: 0;
            color: #333333;
            font-weight: 500;
            font-style: italic;
        }
        
        /* CTA Button */
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4169E1 0%, #000080 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 20px 0;
        }
        
        /* Divider */
        .divider {
            height: 2px;
            background-color: #e0e0e0;
            margin: 30px 0;
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
        }
        
        .footer-greeting strong {
            color: #4169E1;
            font-weight: 600;
        }
        
        .footer-divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 20px 0;
        }
        
        .footer-logo {
            margin: 20px 0;
        }
        
        .footer-logo img {
            width: 60px;
            height: 60px;
            object-fit: contain;
            margin-bottom: 12px;
        }
        
        .footer-link {
            display: inline-block;
            font-size: 14px;
            color: #4169E1;
            text-decoration: none;
            font-weight: 600;
            margin: 12px 0;
        }
        
        .footer-info {
            font-size: 12px;
            color: #999999;
            margin-top: 16px;
            line-height: 1.6;
        }
        
        /* Responsive Design */
        @media (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }
            
            .email-header {
                flex-direction: column;
                text-align: center;
                padding: 30px 20px;
            }
            
            .header-logo img {
                width: 70px;
                height: 70px;
            }
            
            .header-content h1 {
                font-size: 20px;
            }
            
            .email-body {
                padding: 30px 20px;
            }
            
            .email-body h2 {
                font-size: 20px;
            }
            
            .email-footer {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="header-logo">
                <img src="${baseUrl}/images/LOGOs.png" alt="SNDBS Logo">
            </div>
            <div class="header-content">
                <h1>SNDBS - Ministry of Altar Servers</h1>
                <p>Vicariate of Sto. Nino</p>
                <p>Phase 1 Bagong Silang, Caloocan City</p>
            </div>
        </div>

        <!-- Body Content -->
        <div class="email-body">
            <h2>${title}</h2>
            
            <p>Dear ${recipientName},</p>
            
            <p>${message}</p>
            
            ${showQuote ? `
            <div class="highlight-box">
                <p>"I have come not to be served, but to serve." - Matthew 20:28</p>
            </div>
            ` : ''}
            
            <a href="${baseUrl}" class="cta-button">Visit Our Portal</a>

            <div class="divider"></div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <div class="footer-greeting">
                Regards,<br>
                <strong>MAS TEAM</strong>
            </div>
            
            <div class="footer-divider"></div>
            
            <div class="footer-logo">
                <img src="${baseUrl}/images/MAS%20LOGO.png" alt="MAS Logo">
            </div>
            
            <a href="${baseUrl}" class="footer-link">
                ${baseUrl}/
            </a>
            
            <div class="footer-info">
                <p>Ministry of Altar Servers Management System</p>
                <p>SNDBS - Vicariate of Sto. Nino</p>
                <p>Phase 1 Bagong Silang, Caloocan City</p>
                <p style="margin-top: 12px; color: #bbb;">© 2026 Ministry of Altar Servers. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

// Helper function to use in your email sending API
export const getEmailTemplate = (
  recipientName: string,
  customMessage: string,
  customSubject: string = "Ministry of Altar Servers"
): string => {
  return EmailTemplate({
    recipientName,
    message: customMessage,
    subject: customSubject,
    title: customSubject,
  });
};