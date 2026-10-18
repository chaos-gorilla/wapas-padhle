export type RecallConfidence = 'forgot' | 'struggled' | 'comfortable' | 'mastered';

export interface ConceptItem {
  id: string;
  title: string;
  url?: string;            // Optional link to reference, article, doc, or video
  urls?: string[];         // Optional multiple resource links
  category?: string;       // e.g., 'System Design', 'Computer Science', 'Mental Models'
  notes?: string;          // Optional user notes or key takeaway
  tags?: string[];         // e.g., ['system-design', 'distributed-systems', 'cognition']
  createdAt: string;       // ISO string
}

export interface ReviewRecord {
  itemId: string;
  repetition: number;      // n (number of consecutive successful reviews)
  interval: number;        // interval in days until next review
  easeFactor: number;      // SuperMemo ease factor (default 2.5)
  lastReviewedAt: string;  // ISO string
  nextReviewDate: string;  // YYYY-MM-DD
}

export interface TelegramSettings {
  connected: boolean;
  chatId: string;
  dailyReminderEnabled: boolean;
}
