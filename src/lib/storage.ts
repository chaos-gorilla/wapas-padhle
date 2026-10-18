import type { ConceptItem, RecallConfidence, ReviewRecord, TelegramSettings } from '@/types';
import { STARTER_ITEMS } from '@/data/concepts';
import { calculateNextReview, formatDate, getTodayDateString } from './sm2';

const ITEMS_KEY = 'wapas_concepts_v2';
const REVIEWS_KEY = 'wapas_reviews_v2';
const TELEGRAM_KEY = 'wapas_telegram_v2';

function getInitialReviews(): Record<string, ReviewRecord> {
  const today = new Date();

  // Seed 1 overdue item (missed yesterday)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Seed 1 due today item
  const todayDate = new Date(today);

  return {
    'forgetting-curve': {
      itemId: 'forgetting-curve',
      repetition: 1,
      interval: 1,
      easeFactor: 2.5,
      lastReviewedAt: yesterday.toISOString(),
      nextReviewDate: formatDate(yesterday),
    },
    'consistent-hashing': {
      itemId: 'consistent-hashing',
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      lastReviewedAt: todayDate.toISOString(),
      nextReviewDate: formatDate(todayDate),
    },
  };
}

export function loadItems(): ConceptItem[] {
  if (typeof window === 'undefined') return STARTER_ITEMS;
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(STARTER_ITEMS));
      return STARTER_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return STARTER_ITEMS;
  }
}

export const USER_MAX_ITEMS = 1000;
export const MAX_CSV_BATCH_SIZE = 50;

export type InitialScheduleMode = 'spread' | 'today' | 'new';

export interface BatchSaveResult {
  success: boolean;
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  addedCount: number;
  error?: string;
}

export function saveNewItem(item: Omit<ConceptItem, 'id' | 'createdAt'>): ConceptItem {
  const items = loadItems();
  if (items.length >= USER_MAX_ITEMS) {
    throw new Error(`Maximum limit of ${USER_MAX_ITEMS} tasks reached.`);
  }
  const newItem: ConceptItem = {
    ...item,
    id: 'c_' + Date.now().toString(36),
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...items];
  if (typeof window !== 'undefined') {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  }
  return newItem;
}

export function saveBatchItems(
  newItemsData: Array<Omit<ConceptItem, 'id' | 'createdAt'>>,
  scheduleMode: InitialScheduleMode = 'spread'
): BatchSaveResult {
  const currentItems = loadItems();
  const currentReviews = loadReviews();

  if (newItemsData.length === 0) {
    return {
      success: true,
      items: currentItems,
      reviews: currentReviews,
      addedCount: 0,
    };
  }

  if (newItemsData.length > MAX_CSV_BATCH_SIZE) {
    return {
      success: false,
      items: currentItems,
      reviews: currentReviews,
      addedCount: 0,
      error: `Upload exceeds maximum allowed limit of ${MAX_CSV_BATCH_SIZE} tasks per CSV upload.`,
    };
  }

  if (currentItems.length + newItemsData.length > USER_MAX_ITEMS) {
    const remainingSlots = Math.max(0, USER_MAX_ITEMS - currentItems.length);
    return {
      success: false,
      items: currentItems,
      reviews: currentReviews,
      addedCount: 0,
      error: `Importing ${newItemsData.length} tasks would exceed your account limit of ${USER_MAX_ITEMS} total tasks. You currently have ${currentItems.length} tasks (${remainingSlots} slots remaining).`,
    };
  }

  const baseTimestamp = Date.now();
  const today = new Date();
  const newCreatedItems: ConceptItem[] = [];
  const updatedReviews: Record<string, ReviewRecord> = { ...currentReviews };

  newItemsData.forEach((data, index) => {
    const id = `c_${baseTimestamp.toString(36)}_${index}_${Math.random().toString(36).slice(2, 6)}`;
    const item: ConceptItem = {
      ...data,
      id,
      createdAt: new Date(baseTimestamp + index).toISOString(),
    };
    newCreatedItems.push(item);

    if (scheduleMode === 'today') {
      updatedReviews[id] = {
        itemId: id,
        repetition: 0,
        interval: 1,
        easeFactor: 2.5,
        lastReviewedAt: today.toISOString(),
        nextReviewDate: formatDate(today),
      };
    } else if (scheduleMode === 'spread') {
      // Distribute evenly across 3-5 days
      const spreadDays = Math.min(5, Math.max(2, Math.ceil(newItemsData.length / 5)));
      const dayOffset = index % spreadDays;
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      updatedReviews[id] = {
        itemId: id,
        repetition: 0,
        interval: Math.max(1, dayOffset),
        easeFactor: 2.5,
        lastReviewedAt: today.toISOString(),
        nextReviewDate: formatDate(scheduledDate),
      };
    }
  });

  const updatedItems = [...newCreatedItems, ...currentItems];

  if (typeof window !== 'undefined') {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(updatedItems));
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updatedReviews));
  }

  return {
    success: true,
    items: updatedItems,
    reviews: updatedReviews,
    addedCount: newCreatedItems.length,
  };
}

export function deleteItem(id: string): ConceptItem[] {
  const items = loadItems().filter((i) => i.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }
  return items;
}

export function loadReviews(): Record<string, ReviewRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      const seeded = getInitialReviews();
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: Record<string, ReviewRecord> = JSON.parse(raw);
    let changed = false;
    for (const id in parsed) {
      const r = parsed[id];
      if (
        !r.nextReviewDate ||
        r.nextReviewDate.includes('NaN') ||
        typeof r.interval !== 'number' ||
        isNaN(r.interval) ||
        r.interval > 365
      ) {
        r.nextReviewDate = formatDate(new Date());
        r.interval = Math.min(Math.max(1, r.interval || 1), 365);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return {};
  }
}

export function recordReview(
  itemId: string,
  confidence: RecallConfidence
): ReviewRecord {
  const allReviews = loadReviews();
  const current = allReviews[itemId];

  const result = calculateNextReview(current, confidence);
  const now = new Date().toISOString();

  const record: ReviewRecord = {
    itemId,
    repetition: result.repetition,
    interval: result.interval,
    easeFactor: result.easeFactor,
    lastReviewedAt: now,
    nextReviewDate: result.nextReviewDate,
  };

  allReviews[itemId] = record;
  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  return record;
}

/**
 * Resets a task's evaluation back to today so it can be re-evaluated.
 * Sets nextReviewDate to today and clears lastReviewedAt.
 */
export function resetEvaluationToToday(itemId: string): Record<string, ReviewRecord> {
  const allReviews = loadReviews();
  const current = allReviews[itemId];
  const todayStr = getTodayDateString();

  if (current) {
    allReviews[itemId] = {
      ...current,
      nextReviewDate: todayStr,
      lastReviewedAt: '',
    };
  } else {
    allReviews[itemId] = {
      itemId,
      repetition: 0,
      interval: 1,
      easeFactor: 2.5,
      lastReviewedAt: '',
      nextReviewDate: todayStr,
    };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  return allReviews;
}

export interface RedistributeOptions {
  days: number;
  target?: 'overdue' | 'due_and_overdue';
  startTomorrow?: boolean;
}

/**
 * Re-distributes overdue or due tasks across X days depending on the user's workload preference.
 */
export function redistributeTasks(options: RedistributeOptions): Record<string, ReviewRecord> {
  const { days = 3, target = 'overdue', startTomorrow = false } = options;
  const allReviews = loadReviews();
  const todayStr = getTodayDateString();
  const today = new Date();

  // Find target items
  const recordsToRedistribute = Object.values(allReviews).filter((item) => {
    if (target === 'overdue') {
      return item.nextReviewDate < todayStr;
    }
    // 'due_and_overdue': both overdue and due today
    return item.nextReviewDate <= todayStr;
  });

  // Sort oldest overdue first
  recordsToRedistribute.sort((a, b) => (a.nextReviewDate || '').localeCompare(b.nextReviewDate || ''));

  const safeDays = Math.max(1, days);
  recordsToRedistribute.forEach((record, index) => {
    const dayOffset = (index % safeDays) + (startTomorrow ? 1 : 0);
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + dayOffset);
    if (allReviews[record.itemId]) {
      allReviews[record.itemId].nextReviewDate = formatDate(nextDate);
    }
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  return allReviews;
}

export function redistributeBacklog(): Record<string, ReviewRecord> {
  return redistributeTasks({ days: 3, target: 'overdue', startTomorrow: false });
}

export function loadTelegramSettings(): TelegramSettings {
  if (typeof window === 'undefined') {
    return { connected: false, chatId: '', dailyReminderEnabled: true };
  }
  try {
    const raw = localStorage.getItem(TELEGRAM_KEY);
    return raw
      ? JSON.parse(raw)
      : { connected: false, chatId: '', dailyReminderEnabled: true };
  } catch {
    return { connected: false, chatId: '', dailyReminderEnabled: true };
  }
}

export function saveTelegramSettings(settings: TelegramSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TELEGRAM_KEY, JSON.stringify(settings));
  }
}
