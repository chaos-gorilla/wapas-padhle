'use client';

import React, { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
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
import { QueueList, TabType } from '@/components/QueueList';
import { ActiveRecallModal } from '@/components/ActiveRecallModal';
import { AddConceptModal } from '@/components/AddConceptModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { TelegramModal } from '@/components/TelegramModal';
import { playClickSound } from '@/lib/sound';
import {
  Sparkles,
  Layers,
  Compass,
  Calendar,
  BarChart3,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lightbulb,
  Plus,
  Play,
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

  // Active Card for Recall Modal
  const [modalItem, setModalItem] = useState<ConceptItem | null>(null);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [sessionReviewsCount, setSessionReviewsCount] = useState(0);
  const [queueTab, setQueueTab] = useState<TabType>('due');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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

  // Quick stats
  const dueItems = useMemo(
    () => items.filter((i) => getItemStatus(reviews[i.id]) === 'DUE_TODAY'),
    [items, reviews]
  );
  const overdueItems = useMemo(
    () => items.filter((i) => getItemStatus(reviews[i.id]) === 'OVERDUE'),
    [items, reviews]
  );
  const dueCount = dueItems.length;
  const backlogCount = overdueItems.length;

  // Open modal on card select
  const handleSelectItem = (item: ConceptItem) => {
    setModalItem(item);
    setIsStudyModalOpen(true);
  };

  // Start study session with top recommended due card
  const handleStartStudySession = () => {
    playClickSound();
    const recommended = getRecommendedItem(items, reviews);
    if (recommended) {
      setModalItem(recommended);
      setIsStudyModalOpen(true);
    }
  };

  // Modal navigation & rating handlers
  const currentModalIndex = useMemo(() => {
    if (!modalItem) return -1;
    return items.findIndex((i) => i.id === modalItem.id);
  }, [items, modalItem]);

  const handleModalRate = (confidence: RecallConfidence) => {
    if (!modalItem) return;
    const updatedRecord = recordReview(modalItem.id, confidence);
    const newReviews = { ...reviews, [modalItem.id]: updatedRecord };
    setReviews(newReviews);
    setSessionReviewsCount((prev) => prev + 1);

    // Pick next card recommendation
    const nextRecommended = getRecommendedItem(items, newReviews, modalItem.id);
    setModalItem(nextRecommended);
  };

  const handleModalShuffle = () => {
    const shuffled = getRecommendedItem(items, reviews, modalItem?.id, true);
    setModalItem(shuffled);
  };

  const handleModalPrev = () => {
    if (currentModalIndex > 0) {
      setModalItem(items[currentModalIndex - 1]);
    }
  };

  const handleModalNext = () => {
    if (currentModalIndex >= 0 && currentModalIndex < items.length - 1) {
      setModalItem(items[currentModalIndex + 1]);
    }
  };

  // Rate directly from list
  const handleRateItem = (itemId: string, confidence: RecallConfidence) => {
    const updatedRecord = recordReview(itemId, confidence);
    const newReviews = { ...reviews, [itemId]: updatedRecord };
    setReviews(newReviews);
    setSessionReviewsCount((prev) => prev + 1);
  };

  const handleAddItem = (data: Omit<ConceptItem, 'id' | 'createdAt'>) => {
    const created = saveNewItem(data);
    const updated = [created, ...items];
    setItems(updated);
  };

  const handleBatchImportSuccess = (
    updatedItems: ConceptItem[],
    updatedReviews: Record<string, ReviewRecord>
  ) => {
    setItems(updatedItems);
    setReviews(updatedReviews);
  };

  const handleDeleteItem = (id: string) => {
    const updated = deleteItem(id);
    setItems(updated);
    if (modalItem?.id === id) {
      setModalItem(getRecommendedItem(updated, reviews));
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
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-5 relative z-10 min-w-0">
        {/* COMPACT MISSION STATUS & WORKSPACE CONTROLS BAR */}
        <section className="retro-box w-full min-w-0 bg-white dark:bg-zinc-900 rounded-xl p-3 sm:p-4 border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Quick Date & Status Indicators */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
              {/* Date pill */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs font-bold border border-zinc-900 dark:border-zinc-700 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{todayFormattedShort}</span>
              </div>

              {/* Due Today pill (Clicking filters queue to due cards!) */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQueueTab('due');
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

              {/* Overdue Backlog pill */}
              {backlogCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setQueueTab('backlog');
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 font-mono text-xs font-bold border border-rose-900 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors shrink-0 cursor-pointer"
                  title="Click to view overdue backlog cards"
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

            {/* Right: Primary Study Action & Tools */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Start Recall Session CTA */}
              <button
                type="button"
                onClick={handleStartStudySession}
                className="retro-btn inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-500 text-zinc-950 border border-zinc-900 cursor-pointer shadow-[2px_2px_0px_0px_#18181b]"
                title="Start active recall session in focused modal"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Study Cards</span>
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
                <span className="hidden sm:inline">Guide</span>
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

          {/* Actionable Study Tip Banner */}
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
                    <strong className="text-zinc-900 dark:text-white">Active Recall:</strong> Click any card below to open the recall station. Explain the invariant before revealing notes.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-600 dark:text-emerald-400">All caught up!</strong> Daily spaced review strengthens neural pathways and prevents forgetting.
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 hidden md:inline shrink-0 ml-2">
              [Click card to open modal • Space: flip • 1/2/3: rate]
            </span>
          </div>

          {/* Collapsible 3-Step Guide */}
          {isGuideOpen && (
            <div className="mt-3 pt-3 border-t-2 border-dashed border-zinc-900 dark:border-zinc-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs sm:text-sm">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 border border-zinc-900 text-xs">01</span>
                    <span>CLICK ANY CARD</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Browse the list in Detailed or Condensed view. Click any card to launch the Focus Recall Station modal.
                  </p>
                </div>

                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-sky-900 dark:text-sky-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-sky-200 dark:bg-sky-900 border border-zinc-900 text-xs">02</span>
                    <span>TEST MEMORY (SPACE)</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Articulate the core invariant out loud, then press Space to reveal notes and verify your recall.
                  </p>
                </div>

                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-zinc-900 dark:border-zinc-700 rounded-lg">
                  <div className="font-mono font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5 mb-1">
                    <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 border border-zinc-900 text-xs">03</span>
                    <span>RATE RECALL (1 / 2 / 3)</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Rate 1 (Hard), 2 (Good), or 3 (Easy). SM-2 automatically calculates your optimal next test interval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* FEED SECTION: CONCEPT QUEUE & CARDS (DETAILED OR CONDENSED) */}
        <section className="space-y-3.5 w-full">
          {/* Feed Title & Quick Add Bar */}
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Concept Queue &amp; Cards
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                ({items.length} total)
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setIsAddModalOpen(true);
              }}
              className="retro-btn flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer shadow-[2px_2px_0px_0px_#18181b]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Card</span>
            </button>
          </div>

          {/* Revamped QueueList with Condensed and Detailed Views */}
          <QueueList
            items={items}
            reviews={reviews}
            selectedItemId={modalItem?.id}
            activeTab={queueTab}
            onTabChange={setQueueTab}
            onSelectItem={handleSelectItem}
            onRateItem={handleRateItem}
            onDeleteItem={handleDeleteItem}
            onRescheduleBacklog={handleRescheduleBacklog}
          />
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Active Recall / Focus Station Popup Modal */}
      <ActiveRecallModal
        isOpen={isStudyModalOpen}
        item={modalItem}
        reviewRecord={modalItem ? reviews[modalItem.id] : null}
        currentIndex={currentModalIndex >= 0 ? currentModalIndex : undefined}
        totalCount={items.length}
        hasPrev={currentModalIndex > 0}
        hasNext={currentModalIndex >= 0 && currentModalIndex < items.length - 1}
        onPrev={handleModalPrev}
        onNext={handleModalNext}
        onShuffle={handleModalShuffle}
        onClose={() => setIsStudyModalOpen(false)}
        onRate={handleModalRate}
      />

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
