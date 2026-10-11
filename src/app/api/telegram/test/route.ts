import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const { chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    const testMessage =
      `🧪 <b>Test Ping from Wapas Padhle</b>\n\n` +
      `Your Telegram connection is verified! You will receive daily 8:00 AM spaced repetition reminders here.\n\n` +
      `- Scale with Rai`;

    const success = await sendTelegramMessage(chatId, testMessage);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Could not deliver message. Ensure you have started the bot (@WapasPadhleBot) on Telegram and that TELEGRAM_BOT_TOKEN is configured in environment.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, message: 'Test message delivered!' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
