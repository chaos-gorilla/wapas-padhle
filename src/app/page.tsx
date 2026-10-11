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
import { playClickSound } from '@/lib/sound';
import {
  Sparkles,
  Layers,
  Compass,
  TrendingUp,
  BrainCircuit,
  Columns2,
  Rows3,
} from 'lucide-react';

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
  const [sessionReviewsCount, setSessionReviewsCount] = useState(0);
  const [mobileTab, setMobileTab] = useState<'reviser' | 'queue'>('reviser');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');

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
    setSessionReviewsCount((prev) => prev + 1);

    // Pick next card recommendation
    const nextRecommended = getRecommendedItem(items, newReviews, todayItem.id);
    setTodayItem(nextRecommended);
  };

  const handleRateItem = (itemId: string, confidence: RecallConfidence) => {
    const updatedRecord = recordReview(itemId, confidence);
    const newReviews = { ...reviews, [itemId]: updatedRecord };
    setReviews(newReviews);
    setSessionReviewsCount((prev) => prev + 1);
  };

  const handleSelectItem = (item: ConceptItem) => {
    setTodayItem(item);
    setMobileTab('reviser');

    // On mobile or small screens, scroll smoothly to the focus card
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // Quick stats
  const dueCount = items.filter((i) => getItemStatus(reviews[i.id]) === 'DUE_TODAY').length;
  const backlogCount = items.filter((i) => getItemStatus(reviews[i.id]) === 'OVERDUE').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20">
      {/* Calm ambient background glowing aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] rounded-full blur-[130px] animate-calm-pulse" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-teal-500/[0.02] dark:bg-teal-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        telegramSettings={telegramSettings}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 relative z-10">
        {/* Productivity Status Banner */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-sm shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <BrainCircuit className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Spaced Repetition Workspace
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                  SM-2 Active Recall
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click any card in the queue to render it directly into your active focus station.
              </p>
            </div>
          </div>

          {/* Quick Metrics & View Toggle */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 text-xs font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Session: {sessionReviewsCount} reviewed</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 text-xs font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Due: {dueCount}</span>
              {backlogCount > 0 && (
                <span className="text-rose-500 font-semibold">• Overdue: {backlogCount}</span>
              )}
            </div>

            {/* Desktop Layout Switcher */}
            <div className="hidden lg:flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 bg-zinc-50 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setLayoutMode('split');
                }}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  layoutMode === 'split'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Sidebar Split View"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Sidebar View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setLayoutMode('stacked');
                }}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all cursor-pointer ${
                  layoutMode === 'stacked'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Stacked Layout"
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span className="text-[11px]">Stacked</span>
              </button>
            </div>
          </div>
        </section>

        {/* Mobile View Tabs Switcher */}
        <div className="lg:hidden flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              playClickSound();
              setMobileTab('reviser');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'reviser'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Today&apos;s Reviser
          </button>
          <button
            onClick={() => {
              playClickSound();
              setMobileTab('queue');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Cards Queue ({items.length})
          </button>
        </div>

        {/* Main Workspace Layout */}
        {layoutMode === 'split' ? (
          /* Modern 2-Column Sidebar Layout on Desktop */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column / Sidebar: Card Queue & Filtering */}
            <div className={`lg:col-span-6 space-y-4 ${mobileTab === 'queue' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                    Concept Queue & Cards
                  </h2>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {items.length} card{items.length !== 1 ? 's' : ''} total
                </span>
              </div>

              <QueueList
                items={items}
                reviews={reviews}
                selectedItemId={todayItem?.id}
                onSelectItem={handleSelectItem}
                onRateItem={handleRateItem}
                onDeleteItem={handleDeleteItem}
                onRescheduleBacklog={handleRescheduleBacklog}
              />
            </div>

            {/* Right Column: Sticky Active Focus Reviser */}
            <div className={`lg:col-span-6 lg:sticky lg:top-20 space-y-4 ${mobileTab === 'reviser' ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                    Active Recall Reviser
                  </h2>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {todayItem ? 'Ready to recall' : 'Queue clear'}
                </span>
              </div>

              {/* Today's Card */}
              <TodayCard
                item={todayItem}
                reviewRecord={todayItem ? reviews[todayItem.id] : null}
                onRate={handleRateToday}
                onShuffle={handleShuffle}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />

              {/* Calm Productivity Guide */}
              <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs space-y-2 text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>The 20-second active recall habit</span>
                </div>
                <p className="leading-relaxed">
                  Before reading notes, articulate the core idea out loud or in your head:
                  <em> What problem does it solve? What are the edge cases?</em> Testing memory before review deepens neural consolidation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Stacked Layout */
          <div className="max-w-4xl mx-auto space-y-8">
            <section aria-label="Active Recall Reviser">
              <TodayCard
                item={todayItem}
                reviewRecord={todayItem ? reviews[todayItem.id] : null}
                onRate={handleRateToday}
                onShuffle={handleShuffle}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />
            </section>

            <section aria-label="Spaced Repetition Queue">
              <QueueList
                items={items}
                reviews={reviews}
                selectedItemId={todayItem?.id}
                onSelectItem={handleSelectItem}
                onRateItem={handleRateItem}
                onDeleteItem={handleDeleteItem}
                onRescheduleBacklog={handleRescheduleBacklog}
              />
            </section>
          </div>
        )}
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
