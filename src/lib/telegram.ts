import { ConceptItem } from '@/types';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not configured.');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

export function formatWelcomeMessage(): string {
  return (
    `🚀 <b>Welcome to Wapas Padhle Application by Scale with Rai!</b>\n\n` +
    `Your account is connected. We will ping you daily at 8:00 AM with the patterns you need to revisit today.\n\n` +
    `- Scale with Rai`
  );
}

export function formatDailyDigest(dueItems: ConceptItem[], overdueCount = 0): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  let message = `🧠 <b>Wapas Padhle: Daily Spaced Repetition Digest</b>\n`;
  message += `📅 <i>${dateStr}</i>\n\n`;

  if (dueItems.length === 0 && overdueCount === 0) {
    message += `🎉 You are completely caught up! No cards due for revision today.\n\n`;
  } else {
    message += `Concepts due for revision today:\n\n`;

    dueItems.forEach((item, index) => {
      message += `<b>${index + 1}. ${item.title}</b> [${item.category || 'General'}]\n`;
      if (item.notes) {
        message += `• Note: <i>${item.notes}</i>\n`;
      }
      if (item.url) {
        message += `• Link: <a href="${item.url}">Open Resource</a>\n`;
      }
      message += `\n`;
    });

    if (overdueCount > 0) {
      message += `⚠️ <b>Backlog:</b> You have ${overdueCount} card(s) from previous days awaiting revision.\n\n`;
    }
  }

  message += `- Scale with Rai`;
  return message;
}
