'use client';

import React, { useState } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import { getItemStatus } from '@/lib/sm2';
import { Search, ExternalLink, CalendarRange, Trash2 } from 'lucide-react';

interface QueueListProps {
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  onRateItem: (itemId: string, confidence: RecallConfidence) => void;
  onDeleteItem: (itemId: string) => void;
  onRescheduleBacklog: () => void;
}

type TabType = 'due' | 'backlog' | 'all';

export function QueueList({
  items,
  reviews,
  onRateItem,
  onDeleteItem,
  onRescheduleBacklog,
}: QueueListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('due');
  const [search, setSearch] = useState('');

  const dueItems = items.filter((item) => {
    const rev = reviews[item.id];
    return getItemStatus(rev) === 'DUE_TODAY';
  });

  const backlogItems = items.filter((item) => {
    const rev = reviews[item.id];
    return getItemStatus(rev) === 'OVERDUE';
  });

  const getFilteredList = () => {
    let list: ConceptItem[] = [];
    if (activeTab === 'due') {
      list = dueItems;
    } else if (activeTab === 'backlog') {
      list = backlogItems;
    } else {
      list = items;
    }

    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
    );
  };

  const displayList = getFilteredList();

  return (
    <div className="space-y-4">
      {/* Tab bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'due'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>Due Today</span>
            <span className="text-[10px] opacity-80">({dueItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backlog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'backlog'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>Backlog</span>
            {backlogItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {backlogItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>All Cards</span>
            <span className="text-[10px] opacity-80">({items.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts..."
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Backlog recovery action if viewing backlog */}
      {activeTab === 'backlog' && backlogItems.length > 0 && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Have {backlogItems.length} overdue cards? Spread them to keep your queue manageable.
          </span>
          <button
            onClick={onRescheduleBacklog}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:opacity-90 shadow-2xs"
          >
            <CalendarRange className="w-3.5 h-3.5 text-emerald-500" />
            <span>Spread Across 3 Days</span>
          </button>
        </div>
      )}

      {/* Cards List */}
      {displayList.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-400">
          No cards found in this view.
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);

            return (
              <div
                key={item.id}
                className="group p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.title}
                    </h4>
                    {item.category && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.category}
                      </span>
                    )}
                    {status === 'OVERDUE' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-300 font-mono">
                        Overdue ({rev?.nextReviewDate})
                      </span>
                    )}
                    {status === 'UPCOMING' && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Next: {rev?.nextReviewDate}
                      </span>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-xl">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                      title="Open Resource"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Inline quick rating buttons */}
                  <div className="flex items-center space-x-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                    <button
                      onClick={() => onRateItem(item.id, 'struggled')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Struggled (review tomorrow)"
                    >
                      Struggled
                    </button>
                    <button
                      onClick={() => onRateItem(item.id, 'comfortable')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Comfortable (next interval)"
                    >
                      Comfortable
                    </button>
                    <button
                      onClick={() => onRateItem(item.id, 'mastered')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="Mastered (longer interval)"
                    >
                      Mastered
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
