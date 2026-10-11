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
  LayoutGrid,
  List,
  Check,
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
type ViewMode = 'cards' | 'list';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('due_asc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

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

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q)
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
  }, [items, reviews, activeTab, selectedCategory, search, sortBy, dueItems, backlogItems, upcomingItems]);

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
      {/* Top Filter Bar */}
      <div className="space-y-3 bg-white/70 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm shadow-xs">
        {/* Status Tabs and View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('due');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'due'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due Today</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'due' ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                {dueItems.length}
              </span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('backlog');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'backlog'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Backlog</span>
              {backlogItems.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'backlog' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                  {backlogItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('upcoming');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'upcoming'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Upcoming</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'upcoming' ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                {upcomingItems.length}
              </span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                activeTab === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>All Cards</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'all' ? 'bg-zinc-700 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}>
                {items.length}
              </span>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 self-end sm:self-auto bg-zinc-50 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setViewMode('cards');
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="Cards format"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                playClickSound();
                setViewMode('list');
              }}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
              title="List format"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search, Sort, and Category Filtering */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invariant, system name, notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => {
                playClickSound();
                setSortBy(e.target.value as SortType);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="due_asc">Sort: Due Date (Earliest)</option>
              <option value="interval_desc">Sort: Spacing Interval (High to Low)</option>
              <option value="title_asc">Sort: Title (A-Z)</option>
              <option value="created_desc">Sort: Recently Added</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1">
            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center space-x-1 mr-1">
              <Filter className="w-3 h-3" />
              <span>Tag:</span>
            </span>
            <button
              onClick={() => {
                playClickSound();
                setSelectedCategory('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playClickSound();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backlog recovery action if viewing backlog */}
      {activeTab === 'backlog' && backlogItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-rose-900 dark:text-rose-200 font-medium">
              You have {backlogItems.length} overdue card{backlogItems.length > 1 ? 's' : ''}. Spread them across 3 days to avoid cognitive overload.
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onRescheduleBacklog();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 dark:hover:bg-rose-950/60 shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <CalendarRange className="w-3.5 h-3.5 text-rose-500" />
            <span>Redistribute Over 3 Days</span>
          </button>
        </div>
      )}

      {/* Cards List / Grid */}
      {filteredList.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20 p-8">
          <Layers className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            No cards matched your active filters.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Rich Clickable Cards Grid Format */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[720px] overflow-y-auto pr-1">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group relative p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 text-left active:scale-[0.98] ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/25 shadow-md'
                    : 'border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60 hover:border-emerald-300 dark:hover:border-zinc-700 hover:shadow-sm'
                }`}
              >
                {/* Header with Title & Status */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.category && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50">
                            {item.category}
                          </span>
                        )}

                        {status === 'OVERDUE' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 font-mono">
                            Overdue
                          </span>
                        )}

                        {status === 'DUE_TODAY' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50 font-mono">
                            Due Today
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center space-x-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Active in Reviser</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 pt-0.5">
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
                        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors shrink-0"
                        title="Open external resource"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Notes snippet */}
                  {item.notes && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer metadata & quick actions */}
                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <div className="flex items-center space-x-2">
                    <span title="Spaced interval">
                      {rev?.interval ? `${rev.interval}d interval` : 'New card'}
                    </span>
                    {rev?.nextReviewDate && (
                      <span>• Next: {rev.nextReviewDate}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'struggled')}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Mark struggled (revisit tomorrow)"
                    >
                      Struggled
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'comfortable')}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Mark comfortable"
                    >
                      Good
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'mastered')}
                      className="px-2 py-1 rounded-md text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                      title="Mark mastered (longer interval)"
                    >
                      Mastered
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1 text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 transition-colors cursor-pointer ml-1"
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
        /* Compact List View */
        <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
          {filteredList.map((item) => {
            const rev = reviews[item.id];
            const status = getItemStatus(rev);
            const isSelected = selectedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`group p-3 sm:p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 active:scale-[0.99] ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/25 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono flex items-center space-x-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>Active</span>
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
                <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
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

                  <div className="flex items-center space-x-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                    <button
                      onClick={(e) => handleRate(e, item.id, 'struggled')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      Struggled
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'comfortable')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Good
                    </button>
                    <button
                      onClick={(e) => handleRate(e, item.id, 'mastered')}
                      className="px-2 py-1 rounded text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                    >
                      Mastered
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1.5 text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
