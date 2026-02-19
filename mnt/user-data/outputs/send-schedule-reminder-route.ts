import { NextResponse } from 'next/server';
import { sendScheduleReminder } from '@/lib/sms-service';

export async function POST(request: Request) {
  try {
    console.log('📨 [SMS API] Request received');
    
    const body = await request.json();
    const { memberId, scheduledDate, duty } = body;

    console.log('📨 [SMS API] Body:', { memberId, duty });

    if (!memberId || !scheduledDate || !duty) {
      console.log('❌ [SMS API] Missing fields');
      return new NextResponse(
        JSON.stringify({ error: 'Missing: memberId, scheduledDate, duty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [SMS API] Sending SMS...');
    const sent = await sendScheduleReminder(
      memberId,
      new Date(scheduledDate),
      duty
    );

    console.log('✅ [SMS API] Result:', sent);

    return new NextResponse(
      JSON.stringify({
        success: sent,
        message: sent ? 'SMS sent successfully' : 'Failed to send SMS',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ [SMS API] Error:', error.message);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}