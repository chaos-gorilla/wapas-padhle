import { NextRequest, NextResponse } from 'next/server';
import { formatWelcomeMessage, sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.message) {
      return NextResponse.json({ ok: true, info: 'No message payload' });
    }

    const { chat, text } = body.message;
    const chatId = chat?.id;

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    const trimmedText = (text || '').trim();

    if (trimmedText.startsWith('/start')) {
      await sendTelegramMessage(chatId, formatWelcomeMessage());
      return NextResponse.json({ ok: true, action: 'welcome_sent' });
    }

    if (trimmedText.startsWith('/help')) {
      const helpMsg =
        `<b>Wapas Padhle Bot</b> by Scale with Rai\n\n` +
        `Commands:\n` +
        `/start - Connect account & view welcome message\n` +
        `/status - Check your notification status\n` +
        `/ping - Test connection\n\n` +
        `- Scale with Rai`;
      await sendTelegramMessage(chatId, helpMsg);
      return NextResponse.json({ ok: true });
    }

    if (trimmedText.startsWith('/ping') || trimmedText.startsWith('/status')) {
      const statusMsg =
        `✅ <b>Connection Active!</b>\n\n` +
        `Chat ID: <code>${chatId}</code>\n` +
        `Daily 8:00 AM notification is enabled for your spaced repetition queue.\n\n` +
        `- Scale with Rai`;
      await sendTelegramMessage(chatId, statusMsg);
      return NextResponse.json({ ok: true });
    }

    // Default response
    await sendTelegramMessage(
      chatId,
      `👋 Hi! Visit the Wapas Padhle web app to manage your spaced repetition queue and notes.\n\n- Scale with Rai`
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Telegram webhook error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
