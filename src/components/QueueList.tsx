'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import { getItemStatus } from '@/lib/sm2';
import {
  Search,
  ExternalLink,
  CalendarRange,
  Trash2,
  Layers,
  AlertCircle,
  Hash,
  Eye,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';

export type TabType = 'all' | 'due' | 'backlog' | 'upcoming';
export type SortType = 'due_asc' | 'interval_desc' | 'title_asc' | 'created_desc';
export type ViewMode = 'detailed' | 'condensed';

interface QueueListProps {
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  selectedItemId?: string | null;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  onSelectItem: (item: ConceptItem) => void;
  onRateItem: (itemId: string, confidence: RecallConfidence) => void;
  onDeleteItem: (itemId: string) => void;
  onRescheduleBacklog: () => void;
}

export function QueueList({
  items,
  reviews,
  selectedItemId,
  activeTab: controlledTab,
  onTabChange,
  onSelectItem,
  onRateItem,
  onDeleteItem,
  onRescheduleBacklog,
}: QueueListProps) {
  const [internalTab, setInternalTab] = useState<TabType>('due');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: TabType) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('due_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('condensed');

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('wapas_view_mode') as ViewMode | null;
    if (savedMode === 'detailed' || savedMode === 'condensed') {
      setViewMode(savedMode);
    }
  }, []);

  const handleToggleViewMode = (mode: ViewMode) => {
    playClickSound();
    setViewMode(mode);
    localStorage.setItem('wapas_view_mode', mode);
  };

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
    <div className="space-y-4 w-full">
      {/* Top Filter and Controls Bar with Retro Box Styling */}
      <div className="retro-box bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl space-y-3 w-full border-2 border-zinc-900 dark:border-zinc-700">
        {/* Search bar + View Switcher row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts, tags, invariant notes..."
              className="w-full pl-10 pr-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:bg-yellow-50/50 dark:focus:bg-zinc-900 transition-colors"
            />
          </div>

          {/* View Mode Switcher: Condensed (List) vs Detailed (Cards) */}
          <div className="flex items-center space-x-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleViewMode('condensed')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'condensed'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Condensed List View (Reddit Compact style)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Condensed</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('detailed')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Detailed Card View (Reddit Card style)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Detailed</span>
            </button>
          </div>
        </div>

        {/* Filter Pills / Tabs + Sorting Dropdown Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('due');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'due'
                  ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-900/40 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
            >
              ⏰ Due Today ({dueItems.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('backlog');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'backlog'
                  ? 'bg-rose-300 dark:bg-rose-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-900/40 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
            >
              🚨 Overdue ({backlogItems.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('upcoming');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-sky-300 dark:bg-sky-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-900/40 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
            >
              ✓ Upcoming ({upcomingItems.length})
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('all');
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-900/40 dark:border-zinc-700 hover:bg-zinc-200'
              }`}
            >
              📚 All ({items.length})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="font-mono text-xs text-zinc-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                playClickSound();
                setSortBy(e.target.value as SortType);
              }}
              className="retro-btn px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="due_asc">Due Date (Earliest)</option>
              <option value="interval_desc">Interval (High to Low)</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="created_desc">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backlog recovery alert */}
      {activeTab === 'backlog' && backlogItems.length > 0 && (
        <div className="retro-box p-3.5 sm:p-4 rounded-xl bg-rose-100 dark:bg-rose-950/40 border-2 border-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="text-rose-950 dark:text-rose-200 font-bold">
              {backlogItems.length} overdue cards detected. Avoid cognitive overload by spreading them across 3 days.
            </span>
          </div>
          <button
            type="button"
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

      {/* List / Feed Container */}
      {filteredList.length === 0 ? (
        <div className="retro-box py-16 px-6 text-center rounded-xl bg-white dark:bg-zinc-900 w-full space-y-3 border-2 border-zinc-900 dark:border-zinc-700">
          <Layers className="w-10 h-10 text-zinc-400 mx-auto" />
          <p className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
            [No concepts matched your current filter]
          </p>
          <div className="pt-1">
            <button
              type="button"
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
      ) : viewMode === 'detailed' ? (
        /* ========================================================
           DETAILED VIEW (REDDIT CARD MODE)
           ======================================================== */
        <div className="space-y-3.5 w-full">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`retro-box w-full rounded-xl p-4 sm:p-5 text-left cursor-pointer transition-all border-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-[4px_4px_0px_0px_#059669]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-700 hover:bg-amber-50/20 dark:hover:bg-zinc-800/50 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]'
                }`}
              >
                {/* Header: Category, Tags & Status Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Tags & Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.category && (
                          <span className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700 shrink-0">
                            {item.category}
                          </span>
                        )}

                        {item.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-zinc-900 dark:text-amber-200 border border-zinc-900 dark:border-zinc-700 flex items-center space-x-0.5 shrink-0"
                          >
                            <Hash className="w-2.5 h-2.5 text-zinc-700 dark:text-amber-400" />
                            <span>{tag}</span>
                          </span>
                        ))}

                        {status === 'OVERDUE' && (
                          <span className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border-2 border-rose-900 shrink-0">
                            [OVERDUE]
                          </span>
                        )}

                        {status === 'DUE_TODAY' && (
                          <span className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-900 shrink-0">
                            [DUE TODAY]
                          </span>
                        )}

                        <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline-flex items-center space-x-1 shrink-0 ml-auto">
                          <Eye className="w-3 h-3" />
                          <span>Click card to open recall modal</span>
                        </span>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 dark:text-white line-clamp-2 pt-0.5 hover:text-blue-600 dark:hover:text-blue-400 break-words transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    {/* External Link */}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="retro-btn p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 hover:bg-zinc-100"
                        title="Open external documentation link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed pt-0.5 font-normal break-words font-mono bg-zinc-50/70 dark:bg-zinc-950/40 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer metadata & quick actions */}
                <div className="pt-3 mt-3 border-t-2 border-zinc-900 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-xs flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{rev?.interval ? `${rev.interval}d interval` : 'New card'}</span>
                    </span>
                    {rev?.nextReviewDate && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-xs flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Due: {rev.nextReviewDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Action buttons */}
                  <div
                    className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0 pt-0.5 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleRate(e, item.id, 'struggled')}
                        className="retro-btn px-2 sm:px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 border-2 border-rose-900 cursor-pointer"
                        title="Mark struggled (review tomorrow)"
                      >
                        ❌ Hard
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRate(e, item.id, 'comfortable')}
                        className="retro-btn px-2 sm:px-2.5 py-1 rounded text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                        title="Mark comfortable"
                      >
                        ✓ Good
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRate(e, item.id, 'mastered')}
                        className="retro-btn px-2 sm:px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 cursor-pointer"
                        title="Mark mastered (longer spacing)"
                      >
                        ⭐ Easy
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1 ml-1"
                      title="Open full Active Recall focus modal"
                    >
                      <span>Study</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="retro-btn p-1.5 rounded text-zinc-500 hover:text-rose-600 bg-white dark:bg-zinc-800 cursor-pointer ml-1"
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
      ) : (
        /* ========================================================
           CONDENSED VIEW (REDDIT COMPACT / DENSE LIST MODE)
           ======================================================== */
        <div className="retro-box rounded-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 divide-y-2 divide-zinc-200 dark:divide-zinc-800 overflow-hidden shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a] w-full">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`p-2.5 sm:p-3 text-left cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40'
                    : 'hover:bg-amber-50/30 dark:hover:bg-zinc-800/60'
                }`}
              >
                {/* Left: Status Dot/Badge + Title + Tags */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  {/* Status indicator badge */}
                  {status === 'OVERDUE' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-900 shrink-0">
                      LATE
                    </span>
                  ) : status === 'DUE_TODAY' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-900 shrink-0">
                      DUE
                    </span>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0 ml-1" />
                  )}

                  {/* Title & Category */}
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400">
                      {item.title}
                    </span>

                    {item.category && (
                      <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-semibold border border-zinc-300 dark:border-zinc-700 shrink-0">
                        {item.category}
                      </span>
                    )}

                    {item.notes && (
                      <span className="hidden lg:inline-block text-xs text-zinc-400 truncate max-w-[240px] font-mono">
                        — {item.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Spacing + Next Date + Actions */}
                <div
                  className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 font-mono text-xs pt-1 sm:pt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {rev?.interval ? `${rev.interval}d` : 'new'}
                  </span>

                  {rev?.nextReviewDate && (
                    <span className="hidden sm:inline-block text-[11px] text-zinc-500 dark:text-zinc-400">
                      • {rev.nextReviewDate}
                    </span>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-zinc-500 hover:text-blue-600 shrink-0"
                      title="External link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Study Button */}
                  <button
                    type="button"
                    onClick={() => handleCardClick(item)}
                    className="retro-btn px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1"
                  >
                    <span>Recall</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 cursor-pointer"
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
