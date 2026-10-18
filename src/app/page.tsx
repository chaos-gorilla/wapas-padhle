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
  redistributeTasks,
  resetEvaluationToToday,
  saveNewItem,
  saveTelegramSettings,
  RedistributeOptions,
} from '@/lib/storage';
import { getItemStatus, isGradedToday } from '@/lib/sm2';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { QueueList, TabType } from '@/components/QueueList';
import { FilterSidebar, SortType, ViewMode } from '@/components/FilterSidebar';
import { ActiveRecallModal } from '@/components/ActiveRecallModal';
import { AddConceptModal } from '@/components/AddConceptModal';
import { CsvImportModal } from '@/components/CsvImportModal';
import { TelegramModal } from '@/components/TelegramModal';
import { RedistributeModal } from '@/components/RedistributeModal';
import { SettingsModal } from '@/components/SettingsModal';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '@/lib/sound';
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
  CalendarRange,
  CheckCircle2,
  Flame,
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

  // Candidates must NOT have been graded today!
  const eligible = pool.filter((i) => !isGradedToday(currentReviews[i.id]));
  if (eligible.length === 0) return null;

  const due = eligible.filter(
    (i) =>
      getItemStatus(currentReviews[i.id]) === 'DUE_TODAY' ||
      getItemStatus(currentReviews[i.id]) === 'NEW'
  );
  if (due.length > 0) return due[0];

  const overdue = eligible.filter((i) => getItemStatus(currentReviews[i.id]) === 'OVERDUE');
  if (overdue.length > 0) return overdue[0];

  if (isRandom && eligible.length > 1) {
    return eligible[Math.floor(Math.random() * eligible.length)];
  }
  return eligible[0];
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
  const [isRedistributeModalOpen, setIsRedistributeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [sessionReviewsCount, setSessionReviewsCount] = useState(0);
  const [queueTab, setQueueTab] = useState<TabType>('due_overdue');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // E-Commerce style Filter & View States
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('due_asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('wapas_view_mode') as ViewMode | null;
      if (savedMode === 'detailed' || savedMode === 'condensed') {
        return savedMode;
      }
    }
    return 'condensed';
  });
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('wapas_view_mode', mode);
  };

  const hasActiveFilters = Boolean(search || selectedCategory || queueTab !== 'due_overdue');

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setQueueTab('due_overdue');
  };

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

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  // Quick stats
  const gradedTodayItems = useMemo(
    () => items.filter((i) => isGradedToday(reviews[i.id])),
    [items, reviews]
  );
  const dueItems = useMemo(
    () =>
      items.filter(
        (i) =>
          (getItemStatus(reviews[i.id]) === 'DUE_TODAY' ||
            getItemStatus(reviews[i.id]) === 'NEW') &&
          !isGradedToday(reviews[i.id])
      ),
    [items, reviews]
  );
  const overdueItems = useMemo(
    () =>
      items.filter(
        (i) => getItemStatus(reviews[i.id]) === 'OVERDUE' && !isGradedToday(reviews[i.id])
      ),
    [items, reviews]
  );
  const dueCount = dueItems.length;
  const backlogCount = overdueItems.length;
  const dueOverdueCount = dueCount + backlogCount;
  const gradedTodayCount = gradedTodayItems.length;

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
    } else if (items.length > 0) {
      // If all due items are completed, open with null to celebrate or first item
      setModalItem(null);
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

    // Pick next card recommendation that hasn't been graded today
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

  // Explicitly reset an item's evaluation to today so it can be re-evaluated
  const handleResetEvaluation = (itemId: string) => {
    playClickSound();
    const updated = resetEvaluationToToday(itemId);
    setReviews({ ...updated });
    if (modalItem?.id === itemId) {
      setModalItem((prev) => (prev ? { ...prev } : null));
    }
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

  const handleRedistributeConfirm = (options: RedistributeOptions) => {
    const updated = redistributeTasks(options);
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
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        telegramSettings={telegramSettings}
        dueCount={dueOverdueCount}
      />

      {/* Main Content Workspace: E-Commerce Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 relative z-10 min-w-0">
        {/* COMPACT MISSION STATUS & WORKSPACE CONTROLS BAR */}
        <section className="retro-box w-full min-w-0 bg-white dark:bg-zinc-900 rounded-xl p-3 sm:p-4 border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Top on mobile / Left on desktop: Horizontal Scrollable Status Ribbon */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 sm:py-0 w-full sm:w-auto shrink min-w-0">
              {/* Date pill */}
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono text-xs font-bold border border-zinc-900 dark:border-zinc-700 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{todayFormattedShort}</span>
              </div>

              {/* Due & Overdue pill (Primary active queue) */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQueueTab('due_overdue');
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold border shrink-0 cursor-pointer ${
                  dueOverdueCount > 0
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border-amber-900 hover:bg-amber-200'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-900 dark:border-zinc-700'
                }`}
                title="Filter queue to all due and overdue cards"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{dueOverdueCount > 0 ? `${dueOverdueCount} Due & Overdue` : 'Queue Clear ✓'}</span>
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

              {/* Re-distribute workload CTA button */}
              {(backlogCount > 0 || dueOverdueCount > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setIsRedistributeModalOpen(true);
                  }}
                  className="retro-btn flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-bold border border-zinc-900 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#18181b]"
                  title="Spread tasks across X days"
                >
                  <CalendarRange className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>Re-distribute</span>
                </button>
              )}

              {/* Graded Today Counter / Filter Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setQueueTab('graded_today');
                }}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg font-mono text-xs font-bold border shrink-0 cursor-pointer ${
                  gradedTodayCount > 0
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-emerald-900 hover:bg-emerald-200'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-900 dark:border-zinc-700'
                }`}
                title="Filter queue to concepts graded today"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span>{gradedTodayCount} Graded Today</span>
              </button>
            </div>

            {/* Bottom on mobile / Right on desktop: Primary Study Action & Tools */}
            <div className="flex items-center justify-between sm:justify-end space-x-1.5 sm:space-x-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-dashed border-zinc-200 dark:border-zinc-800">
              {/* Start Recall Session CTA */}
              <button
                type="button"
                onClick={handleStartStudySession}
                className="retro-btn flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 sm:py-1 rounded-lg text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-500 text-zinc-950 border border-zinc-900 cursor-pointer shadow-[2px_2px_0px_0px_#18181b]"
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
                className="retro-btn flex items-center space-x-1 px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900 dark:border-zinc-700 hover:bg-zinc-200 cursor-pointer shrink-0"
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
                className="retro-btn inline-flex items-center space-x-1 px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer shrink-0"
                title="View full SM-2 analytics and deck breakdown"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="inline">Stats</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Actionable Study Tip Banner */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-1.5 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <div className="flex items-start sm:items-center space-x-1.5 flex-1 min-w-0">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-snug break-words">
                {backlogCount > 0 ? (
                  <>
                    <strong className="text-zinc-900 dark:text-white">Tip:</strong> You have {backlogCount} overdue card{backlogCount !== 1 ? 's' : ''}. Use &quot;Re-distribute&quot; to spread them across multiple days without stress!
                  </>
                ) : dueOverdueCount > 0 ? (
                  <>
                    <strong className="text-zinc-900 dark:text-white">Active Queue:</strong> Showing {dueOverdueCount} due &amp; overdue card{dueOverdueCount !== 1 ? 's' : ''}. Once graded, cards won&apos;t reappear until scheduled.
                  </>
                ) : (
                  <>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">All caught up!</strong> No due or overdue tasks left for today. Graded concepts can be viewed from the menu.
                  </>
                )}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 hidden xl:inline shrink-0 pl-2">
              [Click card to open modal • Space: flip • 1-4: rate]
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
                    <span>RATE RECALL (1-4)</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-xs leading-snug">
                    Once graded for today, the card won&apos;t prompt you again unless explicitly reset from the menu.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2-COLUMN E-COMMERCE WORKSPACE: SIDEBAR ON LEFT, CARDS FEED ON RIGHT */}
        <div className="flex flex-col lg:flex-row items-start gap-4 sm:gap-6 w-full">
          {/* DESKTOP FILTER SIDEBAR (Left column, sticky) */}
          <div className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-20">
            <FilterSidebar
              items={items}
              reviews={reviews}
              search={search}
              onSearchChange={setSearch}
              activeTab={queueTab}
              onTabChange={setQueueTab}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              onOpenRedistributeModal={() => setIsRedistributeModalOpen(true)}
            />
          </div>

          {/* MAIN CONTENT FEED (Right column) */}
          <section className="flex-1 min-w-0 w-full space-y-3.5">
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

            {/* QueueList (Responsive Mobile & Desktop) */}
            <QueueList
              items={items}
              reviews={reviews}
              selectedItemId={modalItem?.id}
              activeTab={queueTab}
              onTabChange={setQueueTab}
              search={search}
              onSearchChange={setSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onSelectItem={handleSelectItem}
              onRateItem={handleRateItem}
              onDeleteItem={handleDeleteItem}
              onRescheduleBacklog={handleRescheduleBacklog}
              onOpenMobileFilter={() => setIsMobileFilterDrawerOpen(true)}
              onResetEvaluation={handleResetEvaluation}
              onOpenRedistributeModal={() => setIsRedistributeModalOpen(true)}
            />
          </section>
        </div>
      </main>

      {/* MOBILE FILTER DRAWER OVERLAY */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterDrawerOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-[#fbfbfd] dark:bg-[#121214] p-4 shadow-2xl overflow-y-auto flex flex-col z-10 border-l-2 border-zinc-900 dark:border-zinc-700">
            <FilterSidebar
              items={items}
              reviews={reviews}
              search={search}
              onSearchChange={setSearch}
              activeTab={queueTab}
              onTabChange={setQueueTab}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              onCloseMobileDrawer={() => setIsMobileFilterDrawerOpen(false)}
              onOpenRedistributeModal={() => setIsRedistributeModalOpen(true)}
            />
          </div>
        </div>
      )}

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
        onResetEvaluation={handleResetEvaluation}
      />

      {/* Redistribute Backlog Modal */}
      <RedistributeModal
        isOpen={isRedistributeModalOpen}
        onClose={() => setIsRedistributeModalOpen(false)}
        overdueCount={backlogCount}
        dueTodayCount={dueCount}
        onConfirm={handleRedistributeConfirm}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
    </div>
  );
}
