import { ConceptItem, RecallConfidence, ReviewRecord, TelegramSettings } from '@/types';
import { STARTER_ITEMS } from '@/data/concepts';
import { calculateNextReview, formatDate } from './sm2';

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

export function saveNewItem(item: Omit<ConceptItem, 'id' | 'createdAt'>): ConceptItem {
  const items = loadItems();
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
    return JSON.parse(raw);
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

export function redistributeBacklog(): Record<string, ReviewRecord> {
  const allReviews = loadReviews();
  const todayStr = formatDate(new Date());

  const overdue = Object.values(allReviews).filter(
    (item) => item.nextReviewDate < todayStr
  );

  const today = new Date();
  overdue.forEach((record, index) => {
    const dayOffset = index % 3; // spread evenly over next 3 days
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
