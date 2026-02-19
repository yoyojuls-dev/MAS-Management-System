// lib/email-cron-jobs.ts
// Automated Email Reminders using Cron Jobs

import cron from 'node-cron';
import {
  checkAndSendScheduleReminders,
  checkAndSendBirthdayReminders,
  checkAndSendDuesReminders,
} from './email-service';

export function initializeEmailCronJobs() {
  console.log('📧 Initializing email cron jobs...');

  // Schedule reminder emails - Every day at 5:00 PM
  // Sends reminders for events tomorrow
  cron.schedule('0 17 * * *', async () => {
    console.log('⏰ Running schedule reminder email job...');
    try {
      const count = await checkAndSendScheduleReminders();
      console.log(`✅ Schedule reminders sent to ${count} members`);
    } catch (error) {
      console.error('❌ Error in schedule reminder job:', error);
    }
  });

  // Birthday reminder emails - Every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running birthday reminder email job...');
    try {
      const count = await checkAndSendBirthdayReminders();
      console.log(`✅ Birthday reminders sent to ${count} members`);
    } catch (error) {
      console.error('❌ Error in birthday reminder job:', error);
    }
  });

  // Monthly dues reminder emails - 1st of month at 9:00 AM
  cron.schedule('0 9 1 * *', async () => {
    console.log('⏰ Running monthly dues reminder email job...');
    try {
      const count = await checkAndSendDuesReminders();
      console.log(`✅ Dues reminders sent to ${count} members`);
    } catch (error) {
      console.error('❌ Error in dues reminder job:', error);
    }
  });

  console.log('✅ Email cron jobs initialized:');
  console.log('   📧 Schedule Reminders: Daily at 5:00 PM');
  console.log('   🎂 Birthday Reminders: Daily at 8:00 AM');
  console.log('   💰 Dues Reminders: 1st of month at 9:00 AM');
}

export function stopEmailCronJobs() {
  console.log('⛔ Stopping all email cron jobs');
  cron.getTasks().forEach(task => task.stop());
}