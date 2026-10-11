import { RecallConfidence, ReviewRecord } from '@/types';

export const MAX_INTERVAL_DAYS = 365;

export function formatDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    const fallback = new Date();
    const year = fallback.getFullYear();
    const month = String(fallback.getMonth() + 1).padStart(2, '0');
    const day = String(fallback.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatDate(new Date());
}

/**
 * SuperMemo SM-2 Scheduler adapted for intuitive confidence ratings:
 * - struggled: Blanked or struggled -> resets interval to 1 day
 * - comfortable: Solved or recalled comfortably -> standard SM-2 intervals (1d, 6d, interval * EF)
 * - mastered: Instant recall -> bonus interval multiplier & ease boost
 * 
 * Interval is safely capped at MAX_INTERVAL_DAYS (365 days) to avoid arithmetic explosion
 * and Date timestamp overflow.
 */
export function calculateNextReview(
  currentRecord: ReviewRecord | null | undefined,
  confidence: RecallConfidence
): { repetition: number; interval: number; easeFactor: number; nextReviewDate: string } {
  const currentEase = currentRecord?.easeFactor ?? 2.5;
  const currentRep = currentRecord?.repetition ?? 0;
  // If currentInterval was corrupted or oversized, clamp it
  const currentInterval = Math.min(
    Math.max(1, typeof currentRecord?.interval === 'number' && !isNaN(currentRecord.interval) ? currentRecord.interval : 1),
    MAX_INTERVAL_DAYS
  );

  let newEase = currentEase;
  let newRep = currentRep;
  let newInterval = 1;

  if (confidence === 'struggled') {
    newRep = 0;
    newInterval = 1;
    newEase = Math.max(1.3, Math.round((currentEase - 0.2) * 100) / 100);
  } else if (confidence === 'comfortable') {
    if (currentRep === 0) {
      newInterval = 1;
    } else if (currentRep === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.max(1, Math.round(currentInterval * currentEase));
    }
    newRep = currentRep + 1;
    newEase = Math.round(currentEase * 100) / 100;
  } else if (confidence === 'mastered') {
    if (currentRep === 0) {
      newInterval = 3;
    } else if (currentRep === 1) {
      newInterval = 8;
    } else {
      newInterval = Math.max(1, Math.round(currentInterval * currentEase * 1.3));
    }
    newRep = currentRep + 1;
    newEase = Math.min(3.0, Math.round((currentEase + 0.15) * 100) / 100);
  }

  // Upper cap interval to 365 days (1 year)
  newInterval = Math.min(newInterval, MAX_INTERVAL_DAYS);

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    repetition: newRep,
    interval: newInterval,
    easeFactor: newEase,
    nextReviewDate: formatDate(nextDate),
  };
}

export type ItemStatus = 'NEW' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

export function getItemStatus(record?: ReviewRecord | null): ItemStatus {
  if (!record || !record.nextReviewDate || record.nextReviewDate.includes('NaN')) return 'NEW';
  const todayStr = getTodayDateString();
  if (record.nextReviewDate < todayStr) return 'OVERDUE';
  if (record.nextReviewDate === todayStr) return 'DUE_TODAY';
  return 'UPCOMING';
}
