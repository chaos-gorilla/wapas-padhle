'use client';

import React, { useState, useMemo } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import { getItemStatus, isGradedToday } from '@/lib/sm2';
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
  SlidersHorizontal,
  X,
  Tag,
  CheckCircle2,
  RotateCcw,
  Flame,
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export type TabType = 'due_overdue' | 'due' | 'backlog' | 'graded_today' | 'upcoming' | 'all';
export type SortType = 'due_asc' | 'interval_desc' | 'title_asc' | 'created_desc';
export type ViewMode = 'detailed' | 'condensed';

interface QueueListProps {
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  selectedItemId?: string | null;
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
  search?: string;
  onSearchChange?: (s: string) => void;
  selectedCategory?: string | null;
  onCategoryChange?: (c: string | null) => void;
  sortBy?: SortType;
  onSortChange?: (s: SortType) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (m: ViewMode) => void;
  onSelectItem: (item: ConceptItem) => void;
  onRateItem: (itemId: string, confidence: RecallConfidence) => void;
  onDeleteItem: (itemId: string) => void;
  onRescheduleBacklog: () => void;
  onOpenMobileFilter?: () => void;
  onResetEvaluation?: (itemId: string) => void;
  onOpenRedistributeModal?: () => void;
}

export function QueueList({
  items,
  reviews,
  selectedItemId,
  activeTab: controlledTab,
  onTabChange,
  search: controlledSearch,
  onSearchChange,
  selectedCategory: controlledCategory,
  onCategoryChange,
  sortBy: controlledSort,
  viewMode: controlledViewMode,
  onViewModeChange,
  onSelectItem,
  onRateItem,
  onDeleteItem,
  onRescheduleBacklog,
  onOpenMobileFilter,
  onResetEvaluation,
  onOpenRedistributeModal,
}: QueueListProps) {
  // Tab state (controlled vs internal) - defaults to 'due_overdue'
  const [internalTab, setInternalTab] = useState<TabType>('due_overdue');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: TabType) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  // Search state (controlled vs internal)
  const [internalSearch, setInternalSearch] = useState('');
  const search = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearch = (s: string) => {
    if (onSearchChange) onSearchChange(s);
    setInternalSearch(s);
  };

  // Category state (controlled vs internal)
  const [internalCategory, setInternalCategory] = useState<string | null>(null);
  const selectedCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;
  const setSelectedCategory = (c: string | null) => {
    if (onCategoryChange) onCategoryChange(c);
    setInternalCategory(c);
  };

  // Sort state (controlled vs internal)
  const [internalSort] = useState<SortType>('due_asc');
  const sortBy = controlledSort !== undefined ? controlledSort : internalSort;

  // View mode state (controlled vs internal)
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('wapas_view_mode') as ViewMode | null;
      if (savedMode === 'detailed' || savedMode === 'condensed') {
        return savedMode;
      }
    }
    return 'condensed';
  });
  const viewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const setViewMode = (m: ViewMode) => {
    if (onViewModeChange) onViewModeChange(m);
    setInternalViewMode(m);
  };

  const handleToggleViewMode = (mode: ViewMode) => {
    playClickSound();
    setViewMode(mode);
    localStorage.setItem('wapas_view_mode', mode);
  };

  const gradedTodayItems = useMemo(
    () => items.filter((item) => isGradedToday(reviews[item.id])),
    [items, reviews]
  );

  const dueItems = useMemo(
    () =>
      items.filter(
        (item) =>
          (getItemStatus(reviews[item.id]) === 'DUE_TODAY' ||
            getItemStatus(reviews[item.id]) === 'NEW') &&
          !isGradedToday(reviews[item.id])
      ),
    [items, reviews]
  );

  const backlogItems = useMemo(
    () =>
      items.filter(
        (item) =>
          getItemStatus(reviews[item.id]) === 'OVERDUE' &&
          !isGradedToday(reviews[item.id])
      ),
    [items, reviews]
  );

  const dueOverdueItems = useMemo(
    () => [...backlogItems, ...dueItems],
    [backlogItems, dueItems]
  );

  const upcomingItems = useMemo(
    () =>
      items.filter(
        (item) =>
          getItemStatus(reviews[item.id]) === 'UPCOMING' &&
          !isGradedToday(reviews[item.id])
      ),
    [items, reviews]
  );

  // Filtered and sorted cards list
  const filteredList = useMemo(() => {
    let list: ConceptItem[] = [];
    if (activeTab === 'due_overdue') {
      list = dueOverdueItems;
    } else if (activeTab === 'due') {
      list = dueItems;
    } else if (activeTab === 'backlog') {
      list = backlogItems;
    } else if (activeTab === 'graded_today') {
      list = gradedTodayItems;
    } else if (activeTab === 'upcoming') {
      list = upcomingItems;
    } else {
      list = items;
    }

    // Category filter
    if (selectedCategory) {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Search query filter
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
  }, [items, reviews, activeTab, selectedCategory, search, sortBy, dueOverdueItems, dueItems, backlogItems, gradedTodayItems, upcomingItems]);

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

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<ConceptItem | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, item: ConceptItem) => {
    e.stopPropagation();
    playClickSound();
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
  };

  // Active filters count for mobile indicator
  const activeFiltersCount = (selectedCategory ? 1 : 0) + (search ? 1 : 0) + (activeTab !== 'due_overdue' ? 1 : 0);

  return (
    <div className="space-y-3.5 w-full">
      {/* MOBILE FILTER HEADER (visible on screens < lg where desktop left sidebar is hidden) */}
      <div className="block lg:hidden retro-box bg-white dark:bg-zinc-900 p-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Box on Mobile */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search concepts, tags..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Drawer Trigger Button */}
          {onOpenMobileFilter && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenMobileFilter();
              }}
              className="retro-btn flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-300 dark:bg-amber-400 text-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_#18181b]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-zinc-950 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile View Switcher */}
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-900 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleViewMode('condensed')}
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'condensed'
                  ? 'bg-amber-300 text-zinc-950 font-bold border border-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
              title="Condensed"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('detailed')}
              className={`p-1.5 rounded text-xs transition-all ${
                viewMode === 'detailed'
                  ? 'bg-amber-300 text-zinc-950 font-bold border border-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
              title="Detailed"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Horizontal Scrollable Status Chips on Mobile */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('due_overdue')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors flex items-center space-x-1 ${
              activeTab === 'due_overdue'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            <span>🔥 Due &amp; Overdue ({dueOverdueItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('due')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'due'
                ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            ⏰ Due ({dueItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'backlog'
                ? 'bg-rose-300 dark:bg-rose-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            🚨 Overdue ({backlogItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('graded_today')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'graded_today'
                ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            ✓ Graded Today ({gradedTodayItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-sky-300 dark:bg-sky-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            Upcoming ({upcomingItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.5 rounded-lg border whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'all'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            All ({items.length})
          </button>
        </div>
      </div>

      {/* ACTIVE FILTER TAG CHIPS (BREADCRUMBS) - Desktop & Mobile */}
      {(selectedCategory || search || activeTab !== 'due_overdue') && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-zinc-500 text-[11px]">Active:</span>

          {activeTab !== 'due_overdue' && (
            <button
              type="button"
              onClick={() => setActiveTab('due_overdue')}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-900/30 text-[11px] font-bold"
            >
              <span>Status: {activeTab.replace('_', ' ').toUpperCase()}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {selectedCategory && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 border border-zinc-900/40 text-[11px] font-bold"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>{selectedCategory}</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-900/30 text-[11px] font-bold"
            >
              <span>Search: &quot;{search}&quot;</span>
              <X className="w-3 h-3 ml-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('due_overdue');
              setSelectedCategory(null);
              setSearch('');
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer ml-1"
          >
            Reset to Due &amp; Overdue
          </button>
        </div>
      )}

      {/* Backlog recovery & Re-distribution alert banner */}
      {backlogItems.length > 0 && (activeTab === 'backlog' || activeTab === 'due_overdue') && (
        <div className="retro-box p-3.5 sm:p-4 rounded-xl bg-rose-100 dark:bg-rose-950/40 border-2 border-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <span className="text-rose-950 dark:text-rose-200 font-bold">
              {backlogItems.length} overdue task{backlogItems.length !== 1 ? 's' : ''} detected. Re-distribute across X days to stay on top of your schedule!
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              if (onOpenRedistributeModal) {
                onOpenRedistributeModal();
              } else {
                onRescheduleBacklog();
              }
            }}
            className="retro-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-rose-900 dark:text-rose-200 border-2 border-rose-900 cursor-pointer shrink-0 shadow-[2px_2px_0px_0px_#881337]"
          >
            <CalendarRange className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
            <span>Re-distribute Across Days ➔</span>
          </button>
        </div>
      )}

      {/* List / Feed Container */}
      {filteredList.length === 0 ? (
        <div className="retro-box py-14 px-6 text-center rounded-xl bg-white dark:bg-zinc-900 w-full space-y-3 border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]">
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
                setSelectedCategory(null);
                setSearch('');
              }}
              className="retro-btn px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer border border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]"
            >
              Reset Filters &amp; View All ({items.length}) ➔
            </button>
          </div>
        </div>
      ) : viewMode === 'detailed' ? (
        /* ========================================================
           DETAILED VIEW (OPTIMIZED FOR BOTH MOBILE & DESKTOP)
           ======================================================== */
        <div className="space-y-3.5 w-full">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const cardGradedToday = isGradedToday(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`retro-box w-full rounded-xl p-3.5 sm:p-5 text-left cursor-pointer transition-all border-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-[4px_4px_0px_0px_#059669]'
                    : 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-zinc-700 hover:bg-amber-50/20 dark:hover:bg-zinc-800/50 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a]'
                }`}
              >
                {/* Header: Category, Tags & Status Badges */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2.5">
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
                            className="font-mono text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-zinc-900 dark:text-amber-200 border border-zinc-900 dark:border-zinc-700 flex items-center space-x-0.5 shrink-0"
                          >
                            <Hash className="w-2.5 h-2.5 text-zinc-700 dark:text-amber-400" />
                            <span>{tag}</span>
                          </span>
                        ))}

                        {cardGradedToday ? (
                          <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-900 shrink-0">
                            [GRADED TODAY ✓]
                          </span>
                        ) : status === 'OVERDUE' ? (
                          <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border-2 border-rose-900 shrink-0">
                            [OVERDUE]
                          </span>
                        ) : status === 'DUE_TODAY' ? (
                          <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-900 shrink-0">
                            [DUE TODAY]
                          </span>
                        ) : null}

                        <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline-flex items-center space-x-1 shrink-0 ml-auto">
                          <Eye className="w-3 h-3" />
                          <span>Click to open recall modal</span>
                        </span>
                      </div>

                      {/* Card Title */}
                      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-zinc-900 dark:text-white leading-snug pt-0.5 hover:text-blue-600 dark:hover:text-blue-400 break-words transition-colors">
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
                        className="retro-btn p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 hover:bg-zinc-100 border border-zinc-900/30"
                        title="Open external documentation"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pt-0.5 font-normal break-words font-mono bg-zinc-50/70 dark:bg-zinc-950/40 p-2 sm:p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer metadata & quick actions (Stacked for mobile, row for desktop) */}
                <div className="pt-2.5 sm:pt-3 mt-2.5 sm:mt-3 border-t-2 border-zinc-900 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-[11px] sm:text-xs flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{rev?.interval ? `${rev.interval}d interval` : 'New card'}</span>
                    </span>
                    {rev?.nextReviewDate && (
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-[11px] sm:text-xs flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>Due: {rev.nextReviewDate}</span>
                      </span>
                    )}
                  </div>

                  {/* Quick Action buttons */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 pt-1 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {cardGradedToday ? (
                      <div className="flex items-center justify-between sm:justify-start flex-wrap gap-1.5 w-full sm:w-auto">
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[11px] sm:text-xs font-mono font-bold border border-emerald-800">
                          ✓ Graded (Next: {rev?.nextReviewDate})
                        </span>
                        {onResetEvaluation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playClickSound();
                              onResetEvaluation(item.id);
                            }}
                            className="retro-btn px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 border border-zinc-900 flex items-center space-x-1 cursor-pointer shadow-[1px_1px_0px_0px_#18181b]"
                            title="Reset evaluation so this card is due today and can be re-evaluated"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* 3-Button Recall Rating — matches ActiveRecallModal labels */
                      <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:space-x-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={(e) => handleRate(e, item.id, 'mastered')}
                          className="retro-btn py-1.5 px-2 sm:px-2.5 rounded text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 cursor-pointer text-center"
                          title="Mastered — bonus interval spacing"
                        >
                          🚀 Mastered
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRate(e, item.id, 'comfortable')}
                          className="retro-btn py-1.5 px-2 sm:px-2.5 rounded text-xs font-mono font-bold bg-sky-100 dark:bg-sky-950 text-sky-950 dark:text-sky-200 border-2 border-sky-900 cursor-pointer text-center"
                          title="Comfortable — standard SM-2 interval"
                        >
                          🧘 Comfortable
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRate(e, item.id, 'struggled')}
                          className="retro-btn py-1.5 px-2 sm:px-2.5 rounded text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 border-2 border-amber-900 cursor-pointer text-center"
                          title="Struggled — resets interval to 1 day"
                        >
                          🧗 Struggled
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-1.5 pt-0.5 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleCardClick(item)}
                        className="retro-btn px-3 py-1.5 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center justify-center space-x-1 flex-1 sm:flex-initial shadow-[1.5px_1.5px_0px_0px_#18181b]"
                        title="Open full Active Recall focus modal"
                      >
                        <span>Study</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, item)}
                        className="retro-btn p-1.5 rounded text-zinc-500 hover:text-rose-600 bg-white dark:bg-zinc-800 border border-zinc-900/30 cursor-pointer"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================
           CONDENSED VIEW (CUSTOM MOBILE OPTIMIZATION + REDDIT DESKTOP)
           ======================================================== */
        <div className="retro-box rounded-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 divide-y-2 divide-zinc-200 dark:divide-zinc-800 overflow-hidden shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a] w-full">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const cardGradedToday = isGradedToday(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`p-3 sm:p-3 text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40'
                    : 'hover:bg-amber-50/30 dark:hover:bg-zinc-800/60'
                }`}
              >
                {/* 1. MOBILE OPTIMIZED LAYOUT (< sm screens) */}
                <div className="flex flex-col sm:hidden space-y-2">
                  {/* Top metadata row: status + category + interval */}
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {cardGradedToday ? (
                        <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-900 text-[10px]">
                          GRADED
                        </span>
                      ) : status === 'OVERDUE' ? (
                        <span className="px-1.5 py-0.2 rounded font-bold bg-rose-200 dark:bg-rose-900 text-rose-950 dark:text-rose-100 border border-rose-900">
                          LATE
                        </span>
                      ) : status === 'DUE_TODAY' ? (
                        <span className="px-1.5 py-0.2 rounded font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-900">
                          DUE
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}

                      {item.category && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-zinc-900 dark:text-amber-200 font-bold border border-zinc-900 dark:border-zinc-700 text-[10px]">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      {rev?.interval ? `${rev.interval}d interval` : 'New card'}
                    </span>
                  </div>

                  {/* Middle: Title & Notes preview */}
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug break-words">
                      {item.title}
                    </h4>
                    {item.notes && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 font-mono leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-1.5 rounded border border-zinc-200 dark:border-zinc-800">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Row */}
                  <div
                    className="flex items-center justify-between pt-1 border-t border-dashed border-zinc-200 dark:border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      {rev?.nextReviewDate ? `Due: ${rev.nextReviewDate}` : 'Unscheduled'}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {cardGradedToday && onResetEvaluation && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playClickSound();
                            onResetEvaluation(item.id);
                          }}
                          className="retro-btn px-2 py-1 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1"
                          title="Reset evaluation so this card is due today"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600"
                          title="Source documentation"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCardClick(item)}
                        className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1 shadow-[1px_1px_0px_0px_#18181b]"
                      >
                        <span>Recall</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, item)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 cursor-pointer"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. DESKTOP OPTIMIZED LAYOUT (>= sm screens, high-density row) */}
                <div className="hidden sm:flex sm:items-center justify-between gap-3">
                  {/* Left: Status Dot/Badge + Title + Tags */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* Status indicator badge */}
                    {cardGradedToday ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-900 shrink-0">
                        GRADED
                      </span>
                    ) : status === 'OVERDUE' ? (
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
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-semibold border border-zinc-300 dark:border-zinc-700 shrink-0">
                          {item.category}
                        </span>
                      )}

                      {item.notes && (
                        <span className="hidden xl:inline-block text-xs text-zinc-400 truncate max-w-[240px] font-mono">
                          — {item.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Spacing + Next Date + Actions */}
                  <div
                    className="flex items-center justify-end space-x-2 shrink-0 font-mono text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {rev?.interval ? `${rev.interval}d` : 'new'}
                    </span>

                    {rev?.nextReviewDate && (
                      <span className="hidden md:inline-block text-[11px] text-zinc-500 dark:text-zinc-400">
                        • {rev.nextReviewDate}
                      </span>
                    )}

                    {cardGradedToday && onResetEvaluation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playClickSound();
                          onResetEvaluation(item.id);
                        }}
                        className="retro-btn px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1 shadow-[1px_1px_0px_0px_#18181b]"
                        title="Reset evaluation so this card is due today"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
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
                      className="retro-btn px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer flex items-center space-x-1 shadow-[1px_1px_0px_0px_#18181b]"
                    >
                      <span>Recall</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, item)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        item={itemToDelete}
        isOpen={Boolean(itemToDelete)}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
