// lib/email-service.ts
// Email Notification Service for Reminders

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendScheduleReminderEmail(
  memberId: string,
  scheduledDate: Date,
  duty: string
) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || !member.email) {
      console.log(`⚠️  Member ${memberId} has no email`);
      return false;
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    const formattedDate = scheduledDate.toLocaleDateString('en-PH', dateOptions);

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Altar Server Duty Reminder</h2>
            
            <p>Hi <strong>${member.givenName}</strong>,</p>
            
            <p>This is a reminder that you have an altar server duty scheduled:</p>
            
            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 10px 0;">
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Duty:</strong> ${duty}
              </p>
            </div>
            
            <p>Please be on time. Thank you for your service!</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #7f8c8d;">
              Ministry of Altar Servers<br>
              This is an automated email. Please do not reply.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: member.email,
      subject: `Altar Server Duty Reminder - ${formattedDate}`,
      html: htmlContent,
    });

    console.log(`✅ Schedule reminder email sent to ${member.givenName} (${member.email})`);
    
    return true;
  } catch (error) {
    console.error('Error sending schedule reminder email:', error);
    return false;
  }
}

export async function sendBirthdayEmail(
  memberId: string,
  memberName: string,
  email: string
) {
  try {
    if (!email) {
      console.log(`⚠️  Member ${memberId} has no email`);
      return false;
    }

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
            <h1 style="color: #e74c3c; font-size: 48px;">🎂 Happy Birthday! 🎉</h1>
            
            <p style="font-size: 24px; margin: 20px 0;">
              <strong>${memberName}</strong>
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 18px; margin: 0;">
                Wishing you a blessed and joyful day!<br>
                May your year be filled with God's grace and blessings.
              </p>
            </div>
            
            <p style="margin-top: 30px;">With love and prayers,</p>
            <p><strong>Ministry of Altar Servers</strong></p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #7f8c8d;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎂 Happy Birthday ${memberName}!`,
      html: htmlContent,
    });

    console.log(`✅ Birthday email sent to ${memberName}`);
    
    return true;
  } catch (error) {
    console.error('Error sending birthday email:', error);
    return false;
  }
}

export async function sendDuesReminderEmail(
  memberId: string,
  memberEmail: string,
  duesAmount: number,
  dueDate: Date
) {
  try {
    if (!memberEmail) {
      console.log(`⚠️  Member ${memberId} has no email`);
      return false;
    }

    const formattedDate = dueDate.toLocaleDateString('en-PH');

    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Monthly Dues Reminder</h2>
            
            <p>Dear Member,</p>
            
            <p>This is a friendly reminder that your monthly dues payment is due:</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 10px 0;">
                <strong>Amount Due:</strong> ₱${duesAmount}<br>
                <strong>Due Date:</strong> ${formattedDate}
              </p>
            </div>
            
            <p>Please arrange your payment at your earliest convenience. Thank you for your continued support of the Ministry of Altar Servers!</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #7f8c8d;">
              Ministry of Altar Servers<br>
              This is an automated email. Please do not reply.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: memberEmail,
      subject: `Monthly Dues Reminder - ₱${duesAmount}`,
      html: htmlContent,
    });

    console.log(`✅ Dues reminder email sent`);
    
    return true;
  } catch (error) {
    console.error('Error sending dues reminder email:', error);
    return false;
  }
}

export async function checkAndSendScheduleReminders() {
  try {
    console.log('📧 Checking for schedule reminders to send...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    const eventsScheduled = await prisma.event.findMany({
      where: {
        date: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
      },
      include: {
        participants: {
          include: {
            member: true,
          },
        },
      },
    });

    console.log(`Found ${eventsScheduled.length} events scheduled for tomorrow`);

    let remindersSent = 0;

    for (const event of eventsScheduled) {
      for (const participant of event.participants) {
        if (participant.member && participant.member.email) {
          await sendScheduleReminderEmail(
            participant.memberId,
            event.date,
            event.title
          );
          remindersSent++;
        }
      }
    }

    return remindersSent;
  } catch (error) {
    console.error('Error checking schedule reminders:', error);
    return 0;
  }
}

export async function checkAndSendBirthdayReminders() {
  try {
    console.log('📧 Checking for birthday reminders to send...');

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const allMembers = await prisma.member.findMany();

    let remindersSent = 0;

    for (const member of allMembers) {
      if (member.birthdate && member.email) {
        const birthDate = new Date(member.birthdate);
        if (birthDate.getMonth() + 1 === month && birthDate.getDate() === day) {
          await sendBirthdayEmail(
            member.id,
            `${member.givenName} ${member.surname}`,
            member.email
          );
          remindersSent++;
        }
      }
    }

    console.log(`📧 Birthday reminders checked - ${remindersSent} sent today`);
    return remindersSent;
  } catch (error) {
    console.error('Error checking birthday reminders:', error);
    return 0;
  }
}

export async function checkAndSendDuesReminders() {
  try {
    console.log('📧 Checking for dues reminders to send...');

    const allMembers = await prisma.member.findMany({
      where: {
        memberStatus: 'ACTIVE',
      },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    let remindersSent = 0;

    for (const member of allMembers) {
      if (member.email) {
        const settings = await prisma.ministrySettings.findFirst();
        const duesAmount = settings?.monthlyDuesAmount || 500;

        await sendDuesReminderEmail(
          member.id,
          member.email,
          duesAmount,
          dueDate
        );
        remindersSent++;
      }
    }

    console.log(`📧 Dues reminders sent to ${remindersSent} members`);
    return remindersSent;
  } catch (error) {
    console.error('Error checking dues reminders:', error);
    return 0;
  }
}