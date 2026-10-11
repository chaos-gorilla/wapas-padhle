import { NextRequest, NextResponse } from 'next/server';
import { STARTER_ITEMS } from '@/data/concepts';
import { formatDailyDigest } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sampleDue = STARTER_ITEMS.slice(0, 2);
  const sampleDigest = formatDailyDigest(sampleDue, 1);

  return NextResponse.json({
    ok: true,
    message: 'Cron triggered successfully.',
    previewDigest: sampleDigest,
  });
}
