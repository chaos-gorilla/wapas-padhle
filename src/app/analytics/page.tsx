'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ConceptItem, ReviewRecord, TelegramSettings } from '@/types';
import {
  loadItems,
  loadReviews,
  loadTelegramSettings,
  redistributeBacklog,
  saveNewItem,
  saveTelegramSettings,
} from '@/lib/storage';
import { getItemStatus } from '@/lib/sm2';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AddConceptModal } from '@/components/AddConceptModal';
import { TelegramModal } from '@/components/TelegramModal';
import { playClickSound, playMasteredChime } from '@/lib/sound';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Compass,
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

export default function AnalyticsPage() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const [items, setItems] = useState<ConceptItem[]>(() => loadItems());
  const [reviews, setReviews] = useState<Record<string, ReviewRecord>>(() => loadReviews());
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(() =>
    loadTelegramSettings()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [backlogMessage, setBacklogMessage] = useState<string | null>(null);

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

  const handleAddItem = (data: Omit<ConceptItem, 'id' | 'createdAt'>) => {
    const created = saveNewItem(data);
    setItems((prev) => [created, ...prev]);
  };

  const handleSaveTelegram = (updated: TelegramSettings) => {
    saveTelegramSettings(updated);
    setTelegramSettings(updated);
  };

  const handleRescheduleBacklog = () => {
    playMasteredChime();
    const updated = redistributeBacklog();
    setReviews({ ...updated });
    setBacklogMessage('Overdue cards redistributed smoothly across the next 3 days.');
    setTimeout(() => setBacklogMessage(null), 4000);
  };

  if (!isMounted) return null;

  // Calculate Metrics
  const totalCards = items.length;
  const dueItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'DUE_TODAY');
  const overdueItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'OVERDUE');
  const upcomingItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'UPCOMING');
  const newItems = items.filter((i) => getItemStatus(reviews[i.id]) === 'NEW');

  const learningItems = items.filter((i) => {
    const r = reviews[i.id];
    return r && r.repetition > 0 && r.interval < 6;
  });
  const reviewingItems = items.filter((i) => {
    const r = reviews[i.id];
    return r && r.interval >= 6 && r.interval < 21;
  });
  const masteredItems = items.filter((i) => {
    const r = reviews[i.id];
    return r && r.interval >= 21;
  });

  // Average Interval
  const reviewedRecords = Object.values(reviews).filter(
    (r) => typeof r.interval === 'number' && !isNaN(r.interval)
  );
  const avgInterval =
    reviewedRecords.length > 0
      ? (
          reviewedRecords.reduce((acc, r) => acc + r.interval, 0) /
          reviewedRecords.length
        ).toFixed(1)
      : '1.0';

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.category?.trim() || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  const masteredRate = totalCards > 0 ? Math.round((masteredItems.length / totalCards) * 100) : 0;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20 crt-grid-bg overflow-x-hidden">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        telegramSettings={telegramSettings}
        dueCount={dueItems.length}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 relative z-10 min-w-0">
        {/* Navigation & Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-900 dark:border-zinc-700 pb-3">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="retro-btn inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-900 dark:border-zinc-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&lt; Back to Study</span>
          </Link>

          <div className="font-mono text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>DECK ANALYTICS</span>
            <span className="text-zinc-400 font-normal text-xs">[{totalCards} Total Cards]</span>
          </div>
        </div>

        {/* Useful Contextual Status Message */}
        <div className="retro-box p-3.5 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 text-xs sm:text-sm font-mono flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-2">
            {overdueItems.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : dueItems.length > 0 ? (
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            )}
            <p className="text-zinc-800 dark:text-zinc-200">
              {overdueItems.length > 0 ? (
                <>
                  You have <strong className="text-rose-600 dark:text-rose-400">{overdueItems.length} overdue</strong> card{overdueItems.length !== 1 ? 's' : ''}. Review them today, or redistribute them below to prevent study fatigue.
                </>
              ) : dueItems.length > 0 ? (
                <>
                  You have <strong className="text-emerald-600 dark:text-emerald-400">{dueItems.length} card{dueItems.length !== 1 ? 's' : ''}</strong> due today. Completing these locks them into long-term memory.
                </>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  All caught up for today! Your recall queue is completely clear.
                </span>
              )}
            </p>
          </div>

          <Link
            href="/"
            onClick={() => playClickSound()}
            className="retro-btn shrink-0 px-2.5 py-1 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
          >
            Study Now ➔
          </Link>
        </div>

        {/* Feedback message for redistribution if triggered */}
        {backlogMessage && (
          <div className="retro-box p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-900 text-emerald-950 dark:text-emerald-200 font-mono text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{backlogMessage}</span>
          </div>
        )}

        {/* KEY NUMBERS GRID (Clean, minimal, high-signal) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 uppercase">
              Total Cards
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white">
              {totalCards}
            </div>
          </div>

          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Due Today
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {dueItems.length}
            </div>
          </div>

          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase">
              Overdue
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {overdueItems.length}
            </div>
          </div>

          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 uppercase">
              Upcoming
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-800 dark:text-zinc-200">
              {upcomingItems.length}
            </div>
          </div>

          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
              Mastered
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              {masteredRate}%
            </div>
          </div>

          <div className="retro-box p-3 rounded-xl bg-white dark:bg-zinc-900 text-center space-y-1">
            <div className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 uppercase">
              Avg Interval
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-zinc-900 dark:text-white">
              {avgInterval}d
            </div>
          </div>
        </section>

        {/* STAGES BREAKDOWN & BACKLOG ACTION (Minimal numbers table) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Numbers Table: SM-2 Retention Stages */}
          <div className="retro-box p-4 rounded-xl bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2">
              <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900 dark:text-white uppercase">
                Retention Stage Breakdown
              </span>
              <span className="text-xs font-mono text-zinc-500">SM-2 Math</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400">Stage 01: Unreviewed New</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {newItems.length} cards ({totalCards > 0 ? Math.round((newItems.length / totalCards) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-amber-600 dark:text-amber-400">Stage 02: Learning (&lt; 6d)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {learningItems.length} cards ({totalCards > 0 ? Math.round((learningItems.length / totalCards) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-sky-600 dark:text-sky-400">Stage 03: Reviewing (6 - 20d)</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {reviewingItems.length} cards ({totalCards > 0 ? Math.round((reviewingItems.length / totalCards) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-emerald-600 dark:text-emerald-400">Stage 04: Mastered (&ge; 21d)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {masteredItems.length} cards ({masteredRate}%)
                </span>
              </div>
            </div>
          </div>

          {/* Overdue Backlog Action */}
          <div className="retro-box p-4 rounded-xl bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2">
              <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900 dark:text-white uppercase">
                Backlog Management
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                {overdueItems.length} Overdue
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If life got busy and reviews backed up, redistribute them evenly across 3 days rather than abandoning your deck.
            </p>

            <div className="pt-1">
              {overdueItems.length > 0 ? (
                <button
                  type="button"
                  onClick={handleRescheduleBacklog}
                  className="retro-btn w-full px-3 py-2 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Redistribute {overdueItems.length} Overdue Cards (3-Day Spread)</span>
                </button>
              ) : (
                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>No overdue cards! Your review schedule is on track.</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DECK CATEGORIES LIST (Pure numbers) */}
        <section className="retro-box p-4 rounded-xl bg-white dark:bg-zinc-900 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2 font-mono text-xs sm:text-sm font-bold">
            <span className="text-zinc-900 dark:text-white uppercase">Categories</span>
            <span className="text-zinc-500">{categories.length} Total</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs">
            {categories.map(([category, count]) => {
              const pct = Math.round((count / (totalCards || 1)) * 100);
              return (
                <div
                  key={category}
                  className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate mr-2">
                    {category}
                  </span>
                  <span className="text-zinc-500 shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
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
