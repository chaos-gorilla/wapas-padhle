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
  Calendar,
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
  const [isGuideOpen, setIsGuideOpen] = useState(true);

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

  const todayFormatted = isMounted
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date())
    : 'MONDAY, OCTOBER 12, 2026';

  const todayISODate = isMounted
    ? new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    : '2026-10-12';

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20 crt-grid-bg">
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
        {/* 1. BIG 1980s RETRO DATE & DAILY MISSION SUMMARY BANNER */}
        <section className="retro-box bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 border-2 border-zinc-900 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#27272a] relative overflow-hidden">
          {/* Terminal Bar */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-zinc-900 dark:border-zinc-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block border border-zinc-900" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-200 tracking-wider ml-1">
                SYS_STATUS // DAILY_MISSION_DISPATCH
              </span>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs text-emerald-700 dark:text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="animate-retro-blink uppercase">● DISPATCH ONLINE</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* BIG DATE DISPLAY */}
            <div>
              <div className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>TODAY&apos;S SCHEDULE // ACTIVE RECALL STATION</span>
                <span className="text-zinc-400 font-normal">[{todayISODate}]</span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-zinc-950 dark:text-white uppercase mt-1 leading-tight">
                {todayFormatted}
              </h1>
            </div>

            {/* Daily Mission Summary Details */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-mono text-sm sm:text-base font-bold text-zinc-950 dark:text-white flex items-center space-x-2">
                  <span className="text-amber-500 text-lg">⚡</span>
                  <span>
                    {dueCount + backlogCount > 0 ? (
                      <>
                        DAILY MISSION:{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          {dueCount + backlogCount} card{dueCount + backlogCount !== 1 ? 's' : ''}
                        </span>{' '}
                        ready for active recall today ({dueCount} due now, {backlogCount} overdue backlog).
                      </>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        DAILY MISSION ACCOMPLISHED! All review queues are clear for today.
                      </span>
                    )}
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {dueCount + backlogCount > 0
                    ? 'Test memory before flipping answers to trigger permanent SM-2 neural consolidation.'
                    : 'You can explore upcoming cards, shuffle the deck, or add fresh concepts anytime.'}
                </p>
              </div>

              {/* Metric Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <div className="retro-box-sm px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-mono text-xs sm:text-sm font-bold border border-emerald-900 flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Due: {dueCount}</span>
                </div>
                {backlogCount > 0 && (
                  <div className="retro-box-sm px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 font-mono text-xs sm:text-sm font-bold border border-rose-900">
                    Overdue: {backlogCount}
                  </div>
                )}
                <div className="retro-box-sm px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-mono text-xs sm:text-sm font-bold border border-amber-900 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Reviewed: {sessionReviewsCount}</span>
                </div>
                <div className="retro-box-sm px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 font-mono text-xs sm:text-sm font-bold border border-zinc-900">
                  Total: {items.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Super Intuitive 3-Step Guide (Collapsible!) */}
        <section className="retro-box bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between font-mono text-[11px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
              <span className="ml-1 text-zinc-900 dark:text-white uppercase font-bold tracking-wider">
                QUICK_START.HTM — 3-Step Spaced Repetition Workflow
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-[10px]">
                ACTIVE RECALL
              </span>
              <button
                onClick={() => {
                  playClickSound();
                  setIsGuideOpen((prev) => !prev);
                }}
                className="retro-btn px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-mono text-[11px] font-bold cursor-pointer flex items-center space-x-1"
                title={isGuideOpen ? 'Collapse instructions to save screen space' : 'Expand instructions'}
              >
                <span>{isGuideOpen ? '[-] COLLAPSE' : '[+] EXPAND GUIDE'}</span>
              </button>
            </div>
          </div>

          {isGuideOpen && (
            <div className="mt-3.5 pt-3 border-t-2 border-dashed border-zinc-900 dark:border-zinc-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs sm:text-sm">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a]">
                  <div className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 border border-zinc-900 text-xs">01</span>
                    <span>PICK FROM QUEUE</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
                    Click any card on the left. Due Today cards are highlighted and ready.
                  </p>
                </div>

                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a]">
                  <div className="font-mono font-bold text-sky-900 dark:text-sky-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-sky-200 dark:bg-sky-900 border border-zinc-900 text-xs">02</span>
                    <span>TEST YOUR MEMORY</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
                    Explain the core concept out loud first, then click &quot;Reveal Notes&quot; to check.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-zinc-900 dark:border-zinc-700 rounded-lg shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a]">
                  <div className="font-mono font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 border border-zinc-900 text-xs">03</span>
                    <span>RATE YOUR RECALL</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-snug">
                    Click Struggled, Good, or Mastered. The SM-2 algorithm schedules your next test.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Concept Queue & Cards
                  </h2>
                </div>
                <span className="text-xs sm:text-sm text-zinc-400 font-mono">
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
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Active Recall Reviser
                  </h2>
                </div>
                <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
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
              <div className="retro-box bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 text-xs sm:text-sm space-y-2 text-zinc-700 dark:text-zinc-300">
                <div className="flex items-center space-x-2 text-zinc-900 dark:text-white font-mono font-bold text-xs sm:text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  <span>THE 20-SECOND ACTIVE RECALL HABIT</span>
                </div>
                <p className="leading-relaxed font-mono text-xs">
                  Before reading notes, articulate the core idea out loud or in your head:
                  <em> What problem does it solve? What are the invariants?</em> Testing memory before review deepens neural consolidation.
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
