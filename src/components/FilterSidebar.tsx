'use client';

import React from 'react';
import { ConceptItem, ReviewRecord } from '@/types';
import { getItemStatus, isGradedToday } from '@/lib/sm2';
import {
  Search,
  X,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  Calendar,
  RotateCcw,
  Tag,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  List,
  LayoutGrid,
  CheckCircle2,
  CalendarRange,
  Flame,
} from 'lucide-react';
import { playClickSound } from '@/lib/sound';

export type TabType = 'due_overdue' | 'due' | 'backlog' | 'graded_today' | 'upcoming' | 'all';
export type SortType = 'due_asc' | 'interval_desc' | 'title_asc' | 'created_desc';
export type ViewMode = 'detailed' | 'condensed';

interface FilterSidebarProps {
  items: ConceptItem[];
  reviews: Record<string, ReviewRecord>;
  search: string;
  onSearchChange: (search: string) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
  onCloseMobileDrawer?: () => void;
  onOpenRedistributeModal?: () => void;
}

export function FilterSidebar({
  items,
  reviews,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  hasActiveFilters,
  className = '',
  onCloseMobileDrawer,
  onOpenRedistributeModal,
}: FilterSidebarProps) {
  // Counts by review status
  const gradedTodayCount = React.useMemo(
    () => items.filter((item) => isGradedToday(reviews[item.id])).length,
    [items, reviews]
  );

  const dueCount = React.useMemo(
    () =>
      items.filter(
        (item) =>
          (getItemStatus(reviews[item.id]) === 'DUE_TODAY' ||
            getItemStatus(reviews[item.id]) === 'NEW') &&
          !isGradedToday(reviews[item.id])
      ).length,
    [items, reviews]
  );

  const backlogCount = React.useMemo(
    () =>
      items.filter(
        (item) =>
          getItemStatus(reviews[item.id]) === 'OVERDUE' &&
          !isGradedToday(reviews[item.id])
      ).length,
    [items, reviews]
  );

  const dueOverdueCount = dueCount + backlogCount;

  const upcomingCount = React.useMemo(
    () =>
      items.filter(
        (item) =>
          getItemStatus(reviews[item.id]) === 'UPCOMING' &&
          !isGradedToday(reviews[item.id])
      ).length,
    [items, reviews]
  );

  // Extract distinct categories with counts
  const categoryCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((item) => {
      const cat = item.category?.trim();
      if (cat) {
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const handleStatusClick = (tab: TabType) => {
    playClickSound();
    onTabChange(tab);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const handleCategoryClick = (cat: string | null) => {
    playClickSound();
    onCategoryChange(cat);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  return (
    <aside
      className={`space-y-4 font-sans ${className}`}
      aria-label="Concepts Filter Sidebar"
    >
      <div className="retro-box bg-white dark:bg-zinc-900 rounded-xl p-4 border-2 border-zinc-900 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#18181b] dark:shadow-[3px_3px_0px_0px_#27272a] space-y-4">
        {/* Sidebar Header with Reset Button */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-900 dark:border-zinc-700">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <h3 className="font-mono font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
              Filters
            </h3>
          </div>

          <div className="flex items-center space-x-1.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onResetFilters();
                }}
                className="retro-btn flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 border border-zinc-900 dark:border-zinc-700 cursor-pointer"
                title="Reset all search & filters"
              >
                <RotateCcw className="w-3 h-3 text-zinc-500" />
                <span>Reset</span>
              </button>
            )}

            {onCloseMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white lg:hidden"
                aria-label="Close filters drawer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 1. Search Box Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Search
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Concepts, tags, notes..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:bg-yellow-50/40 dark:focus:bg-zinc-900 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onSearchChange('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Review Status Facet (E-Commerce style status grouping) */}
        <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Review Queue</span>
            <span className="text-[10px] text-zinc-400">{items.length} cards</span>
          </label>
          <div className="space-y-1">
            {/* Primary: Due & Overdue (Active Focus Queue) */}
            <button
              type="button"
              onClick={() => handleStatusClick('due_overdue')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'due_overdue'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                <span>Due &amp; Overdue</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.2 rounded border ${
                dueOverdueCount > 0
                  ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border-amber-700 font-bold'
                  : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-900/30'
              }`}>
                {dueOverdueCount}
              </span>
            </button>

            {/* Due Today */}
            <button
              type="button"
              onClick={() => handleStatusClick('due')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'due'
                  ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Due Today</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.2 rounded border ${
                dueCount > 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border-emerald-700 font-bold'
                  : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-900/30'
              }`}>
                {dueCount}
              </span>
            </button>

            {/* Overdue */}
            <button
              type="button"
              onClick={() => handleStatusClick('backlog')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'backlog'
                  ? 'bg-rose-300 dark:bg-rose-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Overdue Backlog</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.2 rounded border ${
                backlogCount > 0
                  ? 'bg-rose-200 dark:bg-rose-900/80 text-rose-950 dark:text-rose-200 border-rose-800 font-bold'
                  : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-900/30'
              }`}>
                {backlogCount}
              </span>
            </button>

            {/* Quick Redistribute button if overdue exists */}
            {backlogCount > 0 && onOpenRedistributeModal && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onOpenRedistributeModal();
                  if (onCloseMobileDrawer) onCloseMobileDrawer();
                }}
                className="w-full flex items-center justify-center space-x-1.5 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-dashed border-rose-700 text-[11px] font-mono font-bold hover:bg-rose-100 cursor-pointer"
              >
                <CalendarRange className="w-3 h-3 text-rose-600" />
                <span>Re-distribute Across Days ➔</span>
              </button>
            )}

            {/* Graded Today (Explicit menu selection for already reviewed cards) */}
            <button
              type="button"
              onClick={() => handleStatusClick('graded_today')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'graded_today'
                  ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Concepts evaluated today. Click to view or reset evaluation."
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Graded Today</span>
              </div>
              <span className={`text-[11px] px-1.5 py-0.2 rounded border ${
                gradedTodayCount > 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border-emerald-700 font-bold'
                  : 'bg-white/70 dark:bg-zinc-900/60 border-zinc-900/30'
              }`}>
                {gradedTodayCount}
              </span>
            </button>

            {/* Upcoming */}
            <button
              type="button"
              onClick={() => handleStatusClick('upcoming')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'upcoming'
                  ? 'bg-sky-300 dark:bg-sky-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Upcoming</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-white/70 dark:bg-zinc-900/60 border border-zinc-900/30">
                {upcomingCount}
              </span>
            </button>

            {/* All Cards */}
            <button
              type="button"
              onClick={() => handleStatusClick('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                activeTab === 'all'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>All Concepts</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-white/70 dark:bg-zinc-900/60 border border-zinc-900/30">
                {items.length}
              </span>
            </button>
          </div>
        </div>

        {/* 3. Category / Topics Facet (Typical E-Commerce Department Filter) */}
        {categoryCounts.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>Categories</span>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleCategoryClick(null)}
                  className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </label>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-all text-left cursor-pointer ${
                  selectedCategory === null
                    ? 'font-bold text-zinc-950 dark:text-white bg-zinc-200 dark:bg-zinc-800'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span>All Topics</span>
                <span className="text-[10px] text-zinc-400">({items.length})</span>
              </button>

              {/* Individual Categories */}
              {categoryCounts.map(([cat, count]) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(isSelected ? null : cat)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'font-bold bg-amber-100 dark:bg-amber-950/60 text-zinc-950 dark:text-amber-200 border border-amber-500/50'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate mr-2">
                      <Tag className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`} />
                      <span className="truncate">{cat}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Sorting Selection */}
        <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-1">
            <ArrowUpDown className="w-3 h-3 text-zinc-400" />
            <span>Sort Cards By</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => {
              playClickSound();
              onSortChange(e.target.value as SortType);
            }}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="due_asc">Due Date (Earliest)</option>
            <option value="interval_desc">Interval (High to Low)</option>
            <option value="title_asc">Title (A-Z)</option>
            <option value="created_desc">Recently Added</option>
          </select>
        </div>

        {/* 5. View Mode Switcher */}
        <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Card Layout View
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-900 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onViewModeChange('condensed');
              }}
              className={`flex items-center justify-center space-x-1.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'condensed'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Compact list view"
            >
              <List className="w-3.5 h-3.5" />
              <span>Condensed</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onViewModeChange('detailed');
              }}
              className={`flex items-center justify-center space-x-1.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Detailed card view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Detailed</span>
            </button>
          </div>
        </div>

        {/* 6. Spaced Repetition Mini Tip Widget */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-zinc-900 dark:border-zinc-700 space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-amber-900 dark:text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Spaced SM-2 Engine</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
            Each review recalculates review intervals based on recall effort to maximize retention with minimum reps.
          </p>
        </div>
      </div>
    </aside>
  );
}
