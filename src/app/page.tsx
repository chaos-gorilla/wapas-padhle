'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord, TelegramSettings } from '@/types';
import {
  deleteItem,
  loadItems,
  loadReviews,
  loadTelegramSettings,
  recordReview,
  redistributeBacklog,
  saveNewItem,
  saveTelegramSettings,
} from '@/lib/storage';
import { getItemStatus } from '@/lib/sm2';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TodayCard } from '@/components/TodayCard';
import { QueueList } from '@/components/QueueList';
import { AddConceptModal } from '@/components/AddConceptModal';
import { TelegramModal } from '@/components/TelegramModal';

const emptySubscribe = () => () => {};

const subscribeToTheme = (callback: () => void) => {
  const observer = new MutationObserver(() => callback());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

const getThemeSnapshot = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

function getRecommendedItem(
  currentItems: ConceptItem[],
  currentReviews: Record<string, ReviewRecord>,
  excludeId?: string,
  isRandom = false
): ConceptItem | null {
  if (currentItems.length === 0) return null;

  const candidates = excludeId
    ? currentItems.filter((i) => i.id !== excludeId)
    : currentItems;
  const pool = candidates.length > 0 ? candidates : currentItems;

  const due = pool.filter((i) => getItemStatus(currentReviews[i.id]) === 'DUE_TODAY');
  if (due.length > 0) return due[0];

  const overdue = pool.filter((i) => getItemStatus(currentReviews[i.id]) === 'OVERDUE');
  if (overdue.length > 0) return overdue[0];

  if (isRandom && pool.length > 1) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return pool[0];
}

export default function Home() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const [items, setItems] = useState<ConceptItem[]>(() => loadItems());
  const [reviews, setReviews] = useState<Record<string, ReviewRecord>>(() => loadReviews());
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(() =>
    loadTelegramSettings()
  );
  const [todayItem, setTodayItem] = useState<ConceptItem | null>(() =>
    getRecommendedItem(loadItems(), loadReviews())
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Sync theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('wapas_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wapas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wapas_theme', 'light');
    }
  };

  const handleShuffle = () => {
    setTodayItem(getRecommendedItem(items, reviews, todayItem?.id, true));
  };

  const handleRateToday = (confidence: RecallConfidence) => {
    if (!todayItem) return;
    const updatedRecord = recordReview(todayItem.id, confidence);
    const newReviews = { ...reviews, [todayItem.id]: updatedRecord };
    setReviews(newReviews);
    // Move to next card
    setTodayItem(getRecommendedItem(items, newReviews, todayItem.id));
  };

  const handleRateItem = (itemId: string, confidence: RecallConfidence) => {
    const updatedRecord = recordReview(itemId, confidence);
    const newReviews = { ...reviews, [itemId]: updatedRecord };
    setReviews(newReviews);
  };

  const handleAddItem = (data: Omit<ConceptItem, 'id' | 'createdAt'>) => {
    const created = saveNewItem(data);
    const updated = [created, ...items];
    setItems(updated);
    if (!todayItem) {
      setTodayItem(created);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = deleteItem(id);
    setItems(updated);
    if (todayItem?.id === id) {
      setTodayItem(getRecommendedItem(updated, reviews));
    }
  };

  const handleRescheduleBacklog = () => {
    const updated = redistributeBacklog();
    setReviews({ ...updated });
  };

  const handleSaveTelegram = (updated: TelegramSettings) => {
    saveTelegramSettings(updated);
    setTelegramSettings(updated);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        telegramSettings={telegramSettings}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Today's Card */}
        <section aria-label="Today's Revisit">
          <TodayCard
            item={todayItem}
            reviewRecord={todayItem ? reviews[todayItem.id] : null}
            onRate={handleRateToday}
            onShuffle={handleShuffle}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        </section>

        {/* Spaced Repetition Queue */}
        <section aria-label="Spaced Repetition Queue">
          <QueueList
            items={items}
            reviews={reviews}
            onRateItem={handleRateItem}
            onDeleteItem={handleDeleteItem}
            onRescheduleBacklog={handleRescheduleBacklog}
          />
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Add Concept Modal */}
      <AddConceptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
      />

      {/* Telegram Modal */}
      <TelegramModal
        settings={telegramSettings}
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        onSaveSettings={handleSaveTelegram}
      />
    </div>
  );
}
