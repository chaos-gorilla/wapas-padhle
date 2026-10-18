'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import {
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  BookOpen,
  Eye,
  EyeOff,
  Flame,
  Hash,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';
import { getTodayDateString } from '@/lib/sm2';

interface ActiveRecallModalProps {
  isOpen: boolean;
  item: ConceptItem | null;
  reviewRecord?: ReviewRecord | null;
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onRate: (confidence: RecallConfidence) => void;
  onShuffle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

interface RatingOption {
  key: RecallConfidence;
  emoji: string;
  label: string;
  subtitle: string;
  shortcut: string;
  colorClasses: string;
  activeClasses: string;
  suggestion: string;
}

const RATING_OPTIONS: RatingOption[] = [
  {
    key: 'forgot',
    emoji: '💀',
    label: 'Not Gonna Happen',
    subtitle: 'Total blackout • Day 1 reset',
    shortcut: '1',
    colorClasses:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-900/80 hover:bg-rose-100 dark:hover:bg-rose-900/60',
    activeClasses:
      'ring-4 ring-rose-500 bg-rose-200 dark:bg-rose-900 scale-[1.02] shadow-[3px_3px_0px_0px_#9f1239]',
    suggestion:
      'Total amnesia? No worries at all — even staff engineers blank out! Resetting to Day 1 so your brain can rebuild this synapse from scratch tomorrow. 💪',
  },
  {
    key: 'struggled',
    emoji: '🧗',
    label: 'Hard',
    subtitle: 'Brain melted • Revisit +1d',
    shortcut: '2',
    colorClasses:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-900/80 hover:bg-amber-100 dark:hover:bg-amber-900/60',
    activeClasses:
      'ring-4 ring-amber-500 bg-amber-200 dark:bg-amber-900 scale-[1.02] shadow-[3px_3px_0px_0px_#92400e]',
    suggestion:
      'Sweating profusely, but you dragged it out of memory! That effortful retrieval is where the deepest learning happens. Re-testing tomorrow! 🔥',
  },
  {
    key: 'comfortable',
    emoji: '🧘',
    label: 'Moderate',
    subtitle: 'Solid recall • Steady cadence',
    shortcut: '3',
    colorClasses:
      'bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 border-sky-900/80 hover:bg-sky-100 dark:hover:bg-sky-900/60',
    activeClasses:
      'ring-4 ring-sky-500 bg-sky-200 dark:bg-sky-900 scale-[1.02] shadow-[3px_3px_0px_0px_#075985]',
    suggestion:
      'Smooth and solid! You understand the invariants well. Spacing out your next review so you don\'t waste time over-practicing. 🎯',
  },
  {
    key: 'mastered',
    emoji: '🚀',
    label: 'Easy',
    subtitle: 'Piece of cake • Long interval',
    shortcut: '4',
    colorClasses:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-900/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
    activeClasses:
      'ring-4 ring-emerald-500 bg-emerald-200 dark:bg-emerald-900 scale-[1.02] shadow-[3px_3px_0px_0px_#065f46]',
    suggestion:
      'Chef\'s kiss! Instant fluid recall. Pushing this concept way down the road so you can conquer new territory! 🏆',
  },
];

const DECISION_WINDOW_MS = 5000;

export function ActiveRecallModal({
  isOpen,
  item,
  reviewRecord,
  currentIndex,
  totalCount,
  onClose,
  onRate,
  onShuffle,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ActiveRecallModalProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [pendingRating, setPendingRating] = useState<RecallConfidence | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number>(DECISION_WINDOW_MS);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all pending timers
  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, []);

  // Commit rating and trigger transition animation
  const commitRating = useCallback(
    (confidence: RecallConfidence) => {
      clearTimers();
      setIsAnimatingOut(true);
      setTimeout(() => {
        onRate(confidence);
        setPendingRating(null);
        setIsAnimatingOut(false);
      }, 240);
    },
    [clearTimers, onRate]
  );

  const [prevItemId, setPrevItemId] = useState(item?.id);

  // When card changes, reset render states during render (standard React pattern)
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setShowNotes(false);
    setPendingRating(null);
    setIsAnimatingOut(false);
    setIsAnimatingIn(true);
  }

  // Clear timers and schedule animation end in effect
  useEffect(() => {
    clearTimers();
    const timer = setTimeout(() => {
      setIsAnimatingIn(false);
    }, 300);
    return () => {
      clearTimeout(timer);
      clearTimers();
    };
  }, [item?.id, clearTimers]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Handle selecting a rating (initiates 5-second change-mind window)
  const handleSelectRating = useCallback(
    (confidence: RecallConfidence) => {
      if (confidence === 'mastered') {
        playMasteredChime();
      } else {
        playClickSound();
      }

      clearTimers();
      setPendingRating(confidence);
      setTimeRemainingMs(DECISION_WINDOW_MS);

      const startTime = Date.now();
      const duration = DECISION_WINDOW_MS;

      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setTimeRemainingMs(remaining);
        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 100);

      finishTimeoutRef.current = setTimeout(() => {
        commitRating(confidence);
      }, duration);
    },
    [clearTimers, commitRating]
  );

  // Cancel pending rating (Undo)
  const handleCancelRating = useCallback(() => {
    playClickSound();
    clearTimers();
    setPendingRating(null);
    setTimeRemainingMs(DECISION_WINDOW_MS);
  }, [clearTimers]);

  // Commit immediately without waiting for 5 seconds
  const handleCommitRatingImmediately = useCallback(() => {
    if (pendingRating) {
      playClickSound();
      commitRating(pendingRating);
    }
  }, [pendingRating, commitRating]);

  // Keyboard Shortcuts inside Modal
  useEffect(() => {
    if (!isOpen || !item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        playClickSound();
        clearTimers();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        playClickSound();
        setShowNotes((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleSelectRating('forgot');
      } else if (e.key === '2' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleSelectRating('struggled');
      } else if (e.key === '3' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        handleSelectRating('comfortable');
      } else if (e.key === '4' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleSelectRating('mastered');
      } else if ((e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') && pendingRating) {
        e.preventDefault();
        handleCancelRating();
      } else if (e.key === 'Enter' && pendingRating) {
        e.preventDefault();
        handleCommitRatingImmediately();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (onShuffle) {
          playClickSound();
          clearTimers();
          onShuffle();
        }
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        playClickSound();
        clearTimers();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        playClickSound();
        clearTimers();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    item,
    pendingRating,
    onShuffle,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    onClose,
    clearTimers,
    handleSelectRating,
    handleCancelRating,
    handleCommitRatingImmediately,
  ]);

  if (!isOpen) return null;

  const currentInterval = reviewRecord?.interval ?? 1;
  const currentReps = reviewRecord?.repetition ?? 0;

  // Gather external links (supporting both item.url and item.urls)
  const allUrls: string[] = [];
  if (item?.url) {
    // split if comma or space separated
    const splitUrls = item.url.split(/[,\s]+/).map((u) => u.trim()).filter((u) => u.startsWith('http'));
    if (splitUrls.length > 0) {
      allUrls.push(...splitUrls);
    } else {
      allUrls.push(item.url);
    }
  }
  if (item?.urls && Array.isArray(item.urls)) {
    item.urls.forEach((u) => {
      if (u && !allUrls.includes(u)) allUrls.push(u);
    });
  }

  const getMemoryStage = (reps: number) => {
    if (reps === 0) return 'Stage 0 • Initial Review';
    if (reps === 1) return 'Stage 1 • Formative';
    if (reps === 2) return 'Stage 2 • Consolidating';
    if (reps === 3) return 'Stage 3 • Established';
    if (reps === 4) return 'Stage 4 • Fluent';
    return 'Stage 5+ • Permanent';
  };

  const getDueStatusText = (nextDateStr?: string) => {
    if (!nextDateStr) return 'Brand new concept';
    const today = getTodayDateString();
    if (nextDateStr < today) return 'Overdue review!';
    if (nextDateStr === today) return 'Due today!';

    try {
      const todayMs = new Date(today).getTime();
      const nextMs = new Date(nextDateStr).getTime();
      const diffDays = Math.round((nextMs - todayMs) / (1000 * 60 * 60 * 24));
      return `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } catch {
      return nextDateStr;
    }
  };

  const timeRemainingSeconds = Math.ceil(timeRemainingMs / 1000);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={() => {
        clearTimers();
        onClose();
      }}
    >
      <div
        className="retro-box relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-[#fffefb] dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#27272a] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Window Bar: Clean, uncluttered layout with centered navigation */}
        <div className="flex items-center justify-between p-3 sm:p-3.5 border-b-2 border-zinc-900 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 rounded-t-xl shrink-0 gap-2">
          {/* Left: Window dots & ID */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-mono font-bold text-[10px] sm:text-xs border border-zinc-900 shrink-0">
              FOCUS_STATION.HTM
            </span>
          </div>

          {/* Center: Perfectly Centered Navigation Arrows, Counter, and Shuffle */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 shrink-0 mx-auto">
            {hasPrev && onPrev && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  clearTimers();
                  onPrev();
                }}
                className="retro-btn p-1 sm:px-2 sm:py-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center space-x-1 text-xs font-mono font-bold"
                title="Previous card [Shortcut: ←]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Prev</span>
              </button>
            )}

            {totalCount !== undefined && totalCount > 0 && (
              <div className="retro-box-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-xs font-black text-zinc-900 dark:text-zinc-100 shrink-0">
                {currentIndex !== undefined ? currentIndex + 1 : 1}/{totalCount}
              </div>
            )}

            {hasNext && onNext && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  clearTimers();
                  onNext();
                }}
                className="retro-btn p-1 sm:px-2 sm:py-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center space-x-1 text-xs font-mono font-bold"
                title="Next card [Shortcut: →]"
              >
                <span className="hidden md:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onShuffle && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  clearTimers();
                  onShuffle();
                }}
                className="retro-btn px-2 py-1 rounded bg-amber-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer text-xs font-mono font-bold flex items-center space-x-1 ml-0.5"
                title="Pick another random card [Shortcut: S]"
              >
                <RefreshCw className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
                <span className="hidden sm:inline">Shuffle</span>
                <kbd className="hidden lg:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-white dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                  S
                </kbd>
              </button>
            )}
          </div>

          {/* Right: Close button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                clearTimers();
                onClose();
              }}
              className="retro-btn px-2 py-1 sm:px-2.5 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center space-x-1 text-xs font-mono font-bold"
              title="Close modal [Shortcut: Esc]"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container with transition animations */}
        <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {!item ? (
            <div className="text-center py-10 space-y-3 font-mono">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                All Cards Caught Up!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                You have completed your scheduled reviews for this session.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="retro-btn px-4 py-2 rounded-lg text-xs font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
              >
                Return to Card List
              </button>
            </div>
          ) : (
            <div
              className={`space-y-4 sm:space-y-5 transition-transform ${
                isAnimatingOut
                  ? 'animate-card-slide-out'
                  : isAnimatingIn
                  ? 'animate-card-slide-in'
                  : ''
              }`}
            >
              {/* Concept Metadata & Heading Section */}
              <div className="space-y-2">
                {/* Category & Tags Row (Moved out of title bar to keep header clean) */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.category && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 text-xs font-mono font-bold border border-amber-900/60 dark:border-amber-700">
                      📁 {item.category}
                    </span>
                  )}
                  {item.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 text-xs font-mono font-bold border border-emerald-900/60 dark:border-emerald-700 flex items-center space-x-0.5"
                    >
                      <Hash className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>

                {/* Main Heading - Clean & Sized for readability without clutter */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug break-words">
                  {item.title}
                </h2>

                {/* External Sources & References - Industry-standard dedicated button pill */}
                {allUrls.length > 0 && (
                  <div className="pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center space-x-1">
                        <ExternalLink className="w-3 h-3 text-amber-500" />
                        <span>External Sources &amp; References:</span>
                      </span>
                      {allUrls.map((link, idx) => {
                        let domain = 'Study Material';
                        try {
                          const parsed = new URL(link);
                          domain = parsed.hostname.replace(/^www\./, '');
                        } catch {
                          domain = link;
                        }
                        return (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="retro-btn inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs font-mono font-bold transition-all"
                            title={`Open ${link}`}
                          >
                            <span>🔗 {domain}</span>
                            <ExternalLink className="w-3 h-3 opacity-75" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Invariant Notes: Hidden by default with an inviting, compact toggle card */}
              {item.notes ? (
                <div className="space-y-2">
                  {!showNotes ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowNotes(true);
                      }}
                      className="retro-btn w-full p-3.5 sm:p-4 rounded-lg bg-amber-50/70 dark:bg-zinc-900/80 hover:bg-amber-100/80 dark:hover:bg-zinc-800 border-2 border-dashed border-amber-800/60 dark:border-zinc-700 flex items-center justify-between transition-colors group cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-amber-300 dark:bg-amber-400 border border-zinc-900 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-zinc-950" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                            <span>Reveal Key Invariants &amp; Notes</span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                            💡 Test your active recall first before checking notes
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <Eye className="w-4 h-4 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform" />
                        <kbd className="hidden sm:inline-block font-mono text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                          Space
                        </kbd>
                      </div>
                    </button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 pt-1">
                        <span className="flex items-center space-x-1.5 truncate">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">INVARIANT RECALL &amp; NOTES:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setShowNotes(false);
                          }}
                          className="retro-btn px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5 cursor-pointer shrink-0 ml-2"
                          title="Hide Notes [Shortcut: Space]"
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Hide Notes</span>
                          <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                            Space
                          </kbd>
                        </button>
                      </div>

                      <div className="text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed bg-[#fefce8] dark:bg-zinc-900 p-3.5 sm:p-5 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] whitespace-pre-wrap font-mono break-words">
                        {item.notes}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Spaced Repetition Detailed Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-1">
                <div className="retro-box-sm p-2.5 sm:p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono font-bold uppercase">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>Memory Streak</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {currentReps} {currentReps === 1 ? 'Review' : 'Reviews'}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                    {getMemoryStage(currentReps)}
                  </div>
                </div>

                <div className="retro-box-sm p-2.5 sm:p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono font-bold uppercase">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Recall Gap</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                    {currentInterval} {currentInterval === 1 ? 'Day' : 'Days'}
                  </div>
                  <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                    SM-2 spacing factor
                  </div>
                </div>

                <div className="retro-box-sm p-2.5 sm:p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono font-bold uppercase">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <span>Next Review</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black font-mono text-zinc-900 dark:text-zinc-100 mt-1 truncate">
                    {reviewRecord?.nextReviewDate || 'Scheduled Today'}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    {getDueStatusText(reviewRecord?.nextReviewDate)}
                  </div>
                </div>
              </div>

              {/* SM-2 Recall Feedback & Categories */}
              <div className="pt-3.5 border-t-2 border-zinc-900 dark:border-zinc-700 space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-mono">
                  <p className="text-zinc-900 dark:text-white flex items-center space-x-1.5 truncate">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                    <span className="truncate">HOW DO YOU FEEL ABOUT THIS TOPIC NOW?</span>
                  </p>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0 ml-1">
                    [SM-2 RATING]
                  </span>
                </div>

                {/* 4 Engaging & Graphic Rating Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = pendingRating === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectRating(opt.key)}
                        className={`retro-btn p-2.5 sm:p-3 rounded-lg border-2 text-center cursor-pointer flex flex-col items-center justify-between min-h-[76px] sm:min-h-[86px] relative transition-all ${
                          opt.colorClasses
                        } ${isSelected ? opt.activeClasses : ''}`}
                        title={`${opt.label} [Shortcut: ${opt.shortcut}]`}
                      >
                        <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-center space-x-1">
                          <span className="text-base sm:text-lg">{opt.emoji}</span>
                          <span>{opt.label}</span>
                          <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border border-zinc-400">
                            {opt.shortcut}
                          </kbd>
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-mono block mt-1 opacity-90 leading-tight">
                          {opt.subtitle}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full text-[10px] font-mono flex items-center justify-center font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts Legend */}
        <div className="border-t-2 border-zinc-900 dark:border-zinc-700 p-2.5 sm:p-3 bg-zinc-100 dark:bg-zinc-900/80 rounded-b-xl flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-zinc-900 dark:text-zinc-200">SHORTCUTS:</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Space</kbd> Notes</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">1-4</kbd> Feel</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">U</kbd> Undo</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">S</kbd> Shuffle</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Esc</kbd> Close</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearTimers();
              onClose();
            }}
            className="retro-btn px-2.5 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold font-mono cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>

      {/* Floating Notification Pop-up Banner for 3-Second Confirmation / Change-Mind */}
      {pendingRating && (
        <div
          className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-lg pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="retro-box rounded-xl bg-[#fffefb] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#27272a] p-3.5 sm:p-4 space-y-2.5">
            {/* Header / Suggestion */}
            <div className="flex items-start space-x-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100">
              <span className="text-xl shrink-0">
                {RATING_OPTIONS.find((o) => o.key === pendingRating)?.emoji}
              </span>
              <div className="leading-relaxed">
                <span className="font-bold underline mr-1.5">
                  {RATING_OPTIONS.find((o) => o.key === pendingRating)?.label}:
                </span>
                {RATING_OPTIONS.find((o) => o.key === pendingRating)?.suggestion}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-300 dark:border-zinc-800">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Advancing in {timeRemainingSeconds}s...</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCancelRating}
                  className="retro-btn px-2.5 py-1 rounded bg-white dark:bg-zinc-800 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center space-x-1 cursor-pointer"
                  title="Change your mind and choose again [Shortcut: U or Z]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Change Mind (Undo)</span>
                  <kbd className="hidden sm:inline font-mono text-[9px] px-1 py-0.2 rounded border bg-zinc-100 dark:bg-zinc-700">
                    U
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={handleCommitRatingImmediately}
                  className="retro-btn px-2.5 py-1 rounded bg-amber-300 hover:bg-amber-400 dark:bg-amber-400 text-xs font-mono font-bold text-zinc-950 flex items-center space-x-1 cursor-pointer"
                  title="Advance immediately [Shortcut: Enter]"
                >
                  <span>Next Now</span>
                  <ChevronRight className="w-3 h-3" />
                  <kbd className="hidden sm:inline font-mono text-[9px] px-1 py-0.2 rounded border bg-amber-200">
                    ↵
                  </kbd>
                </button>
              </div>
            </div>

            {/* Visual 5-second draining progress bar */}
            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-400 dark:border-zinc-700">
              <div
                className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-100 ease-linear"
                style={{ width: `${(timeRemainingMs / DECISION_WINDOW_MS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
