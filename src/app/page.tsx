'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
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
import { QueueList, TabType } from '@/components/QueueList';
import { AddConceptModal } from '@/components/AddConceptModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { TelegramModal } from '@/components/TelegramModal';
import { playClickSound } from '@/lib/sound';
import {
  Sparkles,
  Layers,
  Compass,
  Calendar,
  Columns2,
  Maximize2,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Keyboard,
  ArrowRight,
  Lightbulb,
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
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [sessionReviewsCount, setSessionReviewsCount] = useState(0);
  const [mobileTab, setMobileTab] = useState<'reviser' | 'queue'>('reviser');
  const [queueTab, setQueueTab] = useState<TabType>('due');
  const [focusMode, setFocusMode] = useState(false); // Clean distraction-free card review
  const [isGuideOpen, setIsGuideOpen] = useState(false); // Collapsed by default for zero distraction

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

  const handleBatchImportSuccess = (
    updatedItems: ConceptItem[],
    updatedReviews: Record<string, ReviewRecord>
  ) => {
    setItems(updatedItems);
    setReviews(updatedReviews);
    if (!todayItem && updatedItems.length > 0) {
      setTodayItem(getRecommendedItem(updatedItems, updatedReviews));
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
  const dueItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'DUE_TODAY');
  const overdueItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'OVERDUE');
  const dueCount = dueItems.length;
  const backlogCount = overdueItems.length;

  const todayFormattedShort = isMounted
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(new Date())
    : 'Oct 18';

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20 crt-grid-bg overflow-x-hidden">
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
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        telegramSettings={telegramSettings}
        dueCount={dueCount}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4 relative z-10 min-w-0">
        {/* COMPACT MISSION STATUS & WORKSPACE CONTROLS BAR */}
        <section className="retro-box w-full min-w-0 bg-white dark:bg-zinc-900 rounded-xl p-2.5 sm:p-3.5 border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Quick Date & Status Indicators */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Date pill */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs font-bold border border-zinc-900 dark:border-zinc-700 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{todayFormattedShort}</span>
              </div>

              {/* Due Today pill (Clicking filters queue and selects due card!) */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQueueTab('due');
                  if (dueItems.length > 0) setTodayItem(dueItems[0]);
                  setMobileTab('reviser');
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border shrink-0 cursor-pointer ${
                  dueCount > 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-emerald-900 hover:bg-emerald-200'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-900 dark:border-zinc-700'
                }`}
                title="Filter queue to cards due today"
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{dueCount > 0 ? `${dueCount} Due Today` : 'Queue Clear ✓'}</span>
              </button>

              {/* Overdue Backlog pill (Clicking filters to backlog right on this page!) */}
              {backlogCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setQueueTab('backlog');
                    if (overdueItems.length > 0) setTodayItem(overdueItems[0]);
                    setMobileTab('reviser');
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 font-mono text-xs font-bold border border-rose-900 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors shrink-0 cursor-pointer"
                  title="Click to view & study overdue cards directly"
                >
                  <span>⚠️ {backlogCount} Overdue</span>
                </button>
              )}

              {/* Reviewed Counter */}
              <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 font-mono text-xs font-bold border border-amber-900 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                <span>{sessionReviewsCount} Reviewed</span>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Focus Mode Toggle */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setFocusMode((prev) => !prev);
                }}
                className={`retro-btn hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  focusMode
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900 dark:border-zinc-700'
                }`}
                title={focusMode ? 'Switch to 2-Column Split View' : 'Focus solely on Active Flashcard'}
              >
                {focusMode ? (
                  <>
                    <Columns2 className="w-3.5 h-3.5" />
                    <span>Split View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Focus Card</span>
                  </>
                )}
              </button>

              {/* Quick Guide Toggle */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsGuideOpen((prev) => !prev);
                }}
                className="retro-btn flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900 dark:border-zinc-700 hover:bg-zinc-200 cursor-pointer"
                title="Toggle 3-Step Active Recall Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Guide</span>
                {isGuideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {/* Link to Full Analytics */}
              <Link
                href="/analytics"
                onClick={() => playClickSound()}
                className="retro-btn inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer"
                title="View full SM-2 analytics and deck breakdown"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analytics</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Helpful, Actionable Study Tip Banner */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center space-x-1.5 truncate">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {backlogCount > 0 ? (
                  <>
                    <strong className="text-zinc-900 dark:text-white">Tip:</strong> You have {backlogCount} overdue card{backlogCount !== 1 ? 's' : ''}. Don&apos;t stress about perfection—tackle them one by one!
                  </>
                ) : dueCount > 0 ? (
                  <>
                    <strong className="text-zinc-900 dark:text-white">Active Recall:</strong> Explain the invariant in your own words before pressing Space to reveal notes.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-600 dark:text-emerald-400">All caught up!</strong> Daily spaced review strengthens neural pathways and prevents forgetting.
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 hidden md:inline shrink-0 ml-2">
              [Space: flip • 1/2/3: rate • S: shuffle]
            </span>
          </div>

          {/* Collapsible 3-Step Guide (Only opens on request!) */}
          {isGuideOpen && (
            <div className="mt-3 pt-3 border-t-2 border-dashed border-zinc-900 dark:border-zinc-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs sm:text-sm">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 border border-zinc-900 text-xs">01</span>
                    <span>PICK FROM QUEUE</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Click any card. Due cards are highlighted at the top of your queue.
                  </p>
                </div>

                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-sky-900 dark:text-sky-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-sky-200 dark:bg-sky-900 border border-zinc-900 text-xs">02</span>
                    <span>TEST MEMORY (SPACE)</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Articulate the core invariant out loud, then press Space to reveal notes.
                  </p>
                </div>

                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 border border-zinc-900 text-xs">03</span>
                    <span>RATE RECALL (1 / 2 / 3)</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Rate 1 (Hard), 2 (Good), or 3 (Easy). SM-2 calculates your optimal next test.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Mobile View Tabs Switcher */}
        <div className="lg:hidden sticky top-14 sm:top-16 z-20 flex items-center p-1 rounded-xl bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-md border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] w-full">
          <button
            onClick={() => {
              playClickSound();
              setMobileTab('reviser');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-mono font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'reviser'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            🎯 Today&apos;s Reviser
          </button>
          <button
            onClick={() => {
              playClickSound();
              setMobileTab('queue');
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-mono font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'queue'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            📚 Cards Queue ({items.length})
          </button>
        </div>

        {/* MAIN DUAL-PANE WORKSPACE: CONCEPT QUEUE & ACTIVE RECALL REVISER AT THE TOP */}
        {focusMode ? (
          /* Focus Mode: Centered Focus Flashcard */
          <div className="max-w-3xl mx-auto space-y-4">
            <TodayCard
              item={todayItem}
              reviewRecord={todayItem ? reviews[todayItem.id] : null}
              onRate={handleRateToday}
              onShuffle={handleShuffle}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          /* Split 2-Column Mode: Queue on Left, Sticky Focus Card on Right */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start w-full min-w-0">
            {/* Left Column: Concept Queue & Cards */}
            <div
              className={`w-full min-w-0 lg:col-span-6 space-y-3 ${
                mobileTab === 'queue' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Concept Queue &amp; Cards
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
                activeTab={queueTab}
                onTabChange={setQueueTab}
                onSelectItem={handleSelectItem}
                onRateItem={handleRateItem}
                onDeleteItem={handleDeleteItem}
                onRescheduleBacklog={handleRescheduleBacklog}
              />
            </div>

            {/* Right Column: Sticky Active Recall Reviser */}
            <div
              className={`w-full min-w-0 lg:col-span-6 lg:sticky lg:top-20 space-y-3 ${
                mobileTab === 'reviser' ? 'block' : 'hidden lg:block'
              }`}
            >
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Active Recall Reviser
                  </h2>
                </div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  {todayItem ? 'Ready to recall' : 'Queue clear'}
                </span>
              </div>

              {/* Active Today Card */}
              <TodayCard
                item={todayItem}
                reviewRecord={todayItem ? reviews[todayItem.id] : null}
                onRate={handleRateToday}
                onShuffle={handleShuffle}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />

              {/* Keyboard Shortcuts Quick Bar */}
              <div className="retro-box-sm hidden sm:flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-700 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center space-x-1">
                  <Keyboard className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-200">SHORTCUTS:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span><kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border">Space</kbd> Flip</span>
                  <span>•</span>
                  <span><kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border">1</kbd> Hard</span>
                  <span>•</span>
                  <span><kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border">2</kbd> Good</span>
                  <span>•</span>
                  <span><kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border">3</kbd> Easy</span>
                  <span>•</span>
                  <span><kbd className="px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border">S</kbd> Shuffle</span>
                </div>
              </div>
            </div>
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

      {/* CSV Batch Ingestion Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingItems={items}
        onImportSuccess={handleBatchImportSuccess}
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
