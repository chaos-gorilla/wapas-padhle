'use client';

import React, { useState, useMemo } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import { getItemStatus } from '@/lib/sm2';
import {
  Search,
  ExternalLink,
  CalendarRange,
  Trash2,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Hash,
  Eye,
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';

interface QueueListProps {
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  selectedItemId?: string | null;
  onSelectItem: (item: ConceptItem) => void;
  onRateItem: (itemId: string, confidence: RecallConfidence) => void;
  onDeleteItem: (itemId: string) => void;
  onRescheduleBacklog: () => void;
}

type TabType = 'all' | 'due' | 'backlog' | 'upcoming';
type SortType = 'due_asc' | 'interval_desc' | 'title_asc' | 'created_desc';

export function QueueList({
  items,
  reviews,
  selectedItemId,
  onSelectItem,
  onRateItem,
  onDeleteItem,
  onRescheduleBacklog,
}: QueueListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('due');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('due_asc');

  const dueItems = useMemo(
    () => items.filter((item) => getItemStatus(reviews[item.id]) === 'DUE_TODAY'),
    [items, reviews]
  );

  const backlogItems = useMemo(
    () => items.filter((item) => getItemStatus(reviews[item.id]) === 'OVERDUE'),
    [items, reviews]
  );

  const upcomingItems = useMemo(
    () => items.filter((item) => getItemStatus(reviews[item.id]) === 'UPCOMING'),
    [items, reviews]
  );

  const filteredList = useMemo(() => {
    let list: ConceptItem[] = [];
    if (activeTab === 'due') {
      list = dueItems;
    } else if (activeTab === 'backlog') {
      list = backlogItems;
    } else if (activeTab === 'upcoming') {
      list = upcomingItems;
    } else {
      list = items;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort items
    return [...list].sort((a, b) => {
      const revA = reviews[a.id];
      const revB = reviews[b.id];

      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'interval_desc') {
        return (revB?.interval ?? 0) - (revA?.interval ?? 0);
      }
      if (sortBy === 'created_desc') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      // Default: due_asc (overdue and soonest first)
      const dateA = revA?.nextReviewDate || '9999-99-99';
      const dateB = revB?.nextReviewDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    });
  }, [items, reviews, activeTab, search, sortBy, dueItems, backlogItems, upcomingItems]);

  function targetQ(q: string) {
    return q;
  }

  const handleCardClick = (item: ConceptItem) => {
    playClickSound();
    onSelectItem(item);
  };

  const handleRate = (e: React.MouseEvent, itemId: string, confidence: RecallConfidence) => {
    e.stopPropagation();
    if (confidence === 'mastered') {
      playMasteredChime();
    } else {
      playClickSound();
    }
    onRateItem(itemId, confidence);
  };

  const handleDelete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    playClickSound();
    onDeleteItem(itemId);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar with Retro HTML Box Styling */}
      <div className="retro-box bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-xl space-y-3.5 w-full">
        {/* Full-width Search Box */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts, tags, invariant notes..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:bg-yellow-50/50 dark:focus:bg-zinc-900 transition-colors"
          />
        </div>

        {/* Dropdowns Row: Status Filter + Sorting (Fits in one box, zero overflow!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => {
                playClickSound();
                setActiveTab(e.target.value as TabType);
              }}
              className="retro-btn w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="due">⏰ Due Today ({dueItems.length})</option>
              <option value="backlog">🚨 Backlog ({backlogItems.length})</option>
              <option value="upcoming">✓ Upcoming ({upcomingItems.length})</option>
              <option value="all">📚 All Cards ({items.length})</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                playClickSound();
                setSortBy(e.target.value as SortType);
              }}
              className="retro-btn w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="due_asc">Sort: Due Date (Earliest)</option>
              <option value="interval_desc">Sort: Spacing (High to Low)</option>
              <option value="title_asc">Sort: Title (A-Z)</option>
              <option value="created_desc">Sort: Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backlog recovery alert */}
      {activeTab === 'backlog' && backlogItems.length > 0 && (
        <div className="retro-box p-4 rounded-xl bg-rose-100 dark:bg-rose-950/40 border-2 border-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="text-rose-950 dark:text-rose-200 font-bold">
              {backlogItems.length} overdue cards detected. Avoid cognitive overload by spreading them across 3 days.
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onRescheduleBacklog();
            }}
            className="retro-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-900 border-2 border-rose-900 cursor-pointer shrink-0"
          >
            <CalendarRange className="w-3.5 h-3.5 text-rose-700" />
            <span>Redistribute Over 3 Days</span>
          </button>
        </div>
      )}

      {/* Stacked Scrollable List Container (Only this section scrolls!) */}
      {filteredList.length === 0 ? (
        <div className="retro-box py-16 px-6 text-center rounded-xl bg-white dark:bg-zinc-900 w-full space-y-3">
          <Layers className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
            [No cards matched your current filter]
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('all');
                setSearch('');
              }}
              className="retro-btn px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
            >
              View All Cards ({items.length}) ➔
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[460px] pr-2 custom-scrollbar w-full">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`retro-box rounded-xl p-5 text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-[4px_4px_0px_0px_#059669]'
                    : 'bg-white dark:bg-zinc-900 hover:bg-yellow-50/30 dark:hover:bg-zinc-800/60'
                }`}
              >
                {/* Header with Category, Tags & Status Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Tags & Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.category && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700">
                            {item.category}
                          </span>
                        )}

                        {item.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-zinc-900 dark:text-amber-200 border border-zinc-900 dark:border-zinc-700 flex items-center space-x-0.5"
                          >
                            <Hash className="w-2.5 h-2.5 text-zinc-700 dark:text-amber-400" />
                            <span>{tag}</span>
                          </span>
                        ))}

                        {status === 'OVERDUE' && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border-2 border-rose-900">
                            [OVERDUE]
                          </span>
                        )}

                        {status === 'DUE_TODAY' && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-900">
                            [DUE TODAY]
                          </span>
                        )}

                        {isSelected ? (
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500 text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span>★ IN FOCUS REVISER</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>Click to review</span>
                          </span>
                        )}
                      </div>

                      {/* Card Title */}
                      <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white line-clamp-2 pt-1 hover:text-blue-700 dark:hover:text-blue-400">
                        {item.title}
                      </h4>
                    </div>

                    {/* External Link */}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="retro-btn p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0"
                        title="Open external documentation"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed pt-0.5 font-normal">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer metadata & quick actions */}
                <div className="pt-3 border-t-2 border-zinc-900 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700">
                      {rev?.interval ? `${rev.interval}d interval` : 'New card'}
                    </span>
                    {rev?.nextReviewDate && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700">
                        Next: {rev.nextReviewDate}
                      </span>
                    )}
                  </div>

                  {/* Quick Action buttons with Retro Tactile Styling */}
                  <div
                    className="flex items-center space-x-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => handleRate(e, item.id, 'struggled')}
                      className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 border-2 border-rose-900 cursor-pointer"
                      title="Mark struggled (review tomorrow)"
                    >
                      ❌ Hard
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'comfortable')}
                      className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                      title="Mark comfortable"
                    >
                      ✓ Good
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'mastered')}
                      className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 cursor-pointer"
                      title="Mark mastered (longer spacing)"
                    >
                      ⭐ Easy
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="retro-btn p-1 rounded text-zinc-500 hover:text-rose-600 bg-white dark:bg-zinc-800 cursor-pointer ml-1"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
