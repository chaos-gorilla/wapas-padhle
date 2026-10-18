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
import { getTodayDateString, isGradedToday, calculateNextReview } from '@/lib/sm2';

interface ActiveRecallModalProps {
  isOpen: boolean;
  item: ConceptItem | null;
  reviewRecord?: ReviewRecord | null;
  currentIndex?: number;
  totalCount?: number;
  onClose: () => void;
  onRate: (confidence: RecallConfidence) => void;
  onResetEvaluation?: (itemId: string) => void;
  onShuffle?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export interface SliderStep {
  step: number;
  key: RecallConfidence;
  emoji: string;
  label: string;
  headline: string;
  description: string;
  badge: string;
  shortcut: string;
  colorScheme: {
    accent: string;
    bgBadge: string;
    bgCard: string;
    borderCard: string;
    activeBtn: string;
    confirmBtn: string;
  };
}

export const SLIDER_STEPS: SliderStep[] = [
  {
    step: 1,
    key: 'mastered',
    emoji: '🚀',
    label: 'Easy',
    headline: 'Piece of cake • Long interval',
    description:
      'Instant fluid recall with zero friction! Spacing this concept way down the road so you can conquer new territory.',
    badge: 'EASY',
    shortcut: '1',
    colorScheme: {
      accent: '#10b981',
      bgBadge: 'bg-emerald-100 text-emerald-950 border-emerald-500',
      bgCard: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/60 text-emerald-950 dark:text-emerald-100',
      borderCard: 'border-emerald-600 dark:border-emerald-500',
      activeBtn:
        'bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] ring-2 ring-emerald-400/40',
      confirmBtn: 'bg-emerald-400 hover:bg-emerald-500 text-zinc-950',
    },
  },
  {
    step: 2,
    key: 'comfortable',
    emoji: '🧘',
    label: 'Moderate',
    headline: 'Solid recall • Steady cadence',
    description:
      'Smooth and solid! You recalled the core invariants comfortably. Spacing out your next review so you do not over-practice.',
    badge: 'DEFAULT',
    shortcut: '2',
    colorScheme: {
      accent: '#0ea5e9',
      bgBadge: 'bg-sky-100 text-sky-950 border-sky-500',
      bgCard: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500/60 text-sky-950 dark:text-sky-100',
      borderCard: 'border-sky-600 dark:border-sky-500',
      activeBtn:
        'bg-sky-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] ring-2 ring-sky-400/40',
      confirmBtn: 'bg-sky-400 hover:bg-sky-500 text-zinc-950',
    },
  },
  {
    step: 3,
    key: 'struggled',
    emoji: '🧗',
    label: 'Hard',
    headline: 'Brain melted • Revisit tomorrow',
    description:
      'Sweating profusely, but you dragged it out of memory! That effortful retrieval cements learning. Re-testing tomorrow!',
    badge: 'HARD',
    shortcut: '3',
    colorScheme: {
      accent: '#f59e0b',
      bgBadge: 'bg-amber-100 text-amber-950 border-amber-500',
      bgCard: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500/60 text-amber-950 dark:text-amber-100',
      borderCard: 'border-amber-600 dark:border-amber-500',
      activeBtn:
        'bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] ring-2 ring-amber-400/40',
      confirmBtn: 'bg-amber-400 hover:bg-amber-500 text-zinc-950',
    },
  },
  {
    step: 4,
    key: 'forgot',
    emoji: '💀',
    label: 'Blank',
    headline: 'Total blackout • Day 1 reset',
    description:
      'Total amnesia? No worries at all — even staff engineers blank out! Resetting to Day 1 so your brain rebuilds from scratch tomorrow. 💪',
    badge: 'RESET',
    shortcut: '4',
    colorScheme: {
      accent: '#f43f5e',
      bgBadge: 'bg-rose-100 text-rose-950 border-rose-500',
      bgCard: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500/60 text-rose-950 dark:text-rose-100',
      borderCard: 'border-rose-600 dark:border-rose-500',
      activeBtn:
        'bg-rose-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b] ring-2 ring-rose-400/40',
      confirmBtn: 'bg-rose-400 hover:bg-rose-500 text-zinc-950',
    },
  },
];

export function ActiveRecallModal({
  isOpen,
  item,
  reviewRecord,
  currentIndex,
  totalCount,
  onClose,
  onRate,
  onResetEvaluation,
  onShuffle,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: ActiveRecallModalProps) {
  const isTaskGradedToday = isGradedToday(reviewRecord);
  const [showNotes, setShowNotes] = useState(false);
  // Default to Step 2 (Moderate) as requested
  const [selectedStep, setSelectedStep] = useState<number>(2);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [prevItemId, setPrevItemId] = useState(item?.id);

  // When card changes, reset render states during render (standard React pattern)
  // Moderate (Step 2) is the default as requested
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setShowNotes(false);
    setSelectedStep(2);
    setIsAnimatingOut(false);
    setIsAnimatingIn(true);
  }

  // Animation end effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimatingIn(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [item?.id]);

  // Commit rating and trigger transition animation
  const commitRating = useCallback(
    (confidence: RecallConfidence) => {
      setIsAnimatingOut(true);
      setTimeout(() => {
        onRate(confidence);
        setIsAnimatingOut(false);
      }, 220);
    },
    [onRate]
  );

  // Handle clicking a station on the slider
  const handleStepClick = useCallback(
    (stepNum: number) => {
      const stepItem = SLIDER_STEPS.find((s) => s.step === stepNum) || SLIDER_STEPS[1];
      if (selectedStep === stepNum) {
        // If clicking already selected step, commit immediately
        if (stepItem.key === 'mastered') {
          playMasteredChime();
        } else {
          playClickSound();
        }
        commitRating(stepItem.key);
      } else {
        playClickSound();
        setSelectedStep(stepNum);
      }
    },
    [selectedStep, commitRating]
  );

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
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        playClickSound();
        setShowNotes((prev) => !prev);
      } else if ((e.key === 'r' || e.key === 'R') && isTaskGradedToday && onResetEvaluation && item) {
        e.preventDefault();
        playClickSound();
        onResetEvaluation(item.id);
      } else if ((e.key === '1' || e.key === 'e' || e.key === 'E') && !isTaskGradedToday) {
        e.preventDefault();
        playClickSound();
        setSelectedStep(1);
      } else if ((e.key === '2' || e.key === 'm' || e.key === 'M') && !isTaskGradedToday) {
        e.preventDefault();
        playClickSound();
        setSelectedStep(2);
      } else if ((e.key === '3' || e.key === 'h' || e.key === 'H') && !isTaskGradedToday) {
        e.preventDefault();
        playClickSound();
        setSelectedStep(3);
      } else if ((e.key === '4' || e.key === 'b' || e.key === 'B') && !isTaskGradedToday) {
        e.preventDefault();
        playClickSound();
        setSelectedStep(4);
      } else if (e.key === 'Enter' && !isTaskGradedToday) {
        e.preventDefault();
        const activeStep = SLIDER_STEPS.find((s) => s.step === selectedStep) || SLIDER_STEPS[1];
        if (activeStep.key === 'mastered') {
          playMasteredChime();
        } else {
          playClickSound();
        }
        commitRating(activeStep.key);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (onShuffle) {
          playClickSound();
          onShuffle();
        }
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        playClickSound();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        playClickSound();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    item,
    isTaskGradedToday,
    onResetEvaluation,
    selectedStep,
    onShuffle,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    onClose,
    commitRating,
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

  const activeStepItem = SLIDER_STEPS.find((s) => s.step === selectedStep) || SLIDER_STEPS[1];
  const nextReviewPreview = item ? calculateNextReview(reviewRecord, activeStepItem.key) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={() => {
        onClose();
      }}
    >
      <div
        className={`retro-box relative w-full max-w-2xl max-h-[94vh] sm:max-h-[92vh] flex flex-col rounded-xl bg-[#fffefb] dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#27272a] my-auto transition-all ${
          isTaskGradedToday ? 'ring-2 ring-emerald-500/70' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Window Bar: Clean, mobile-responsive layout */}
        <div className="flex items-center justify-between p-2.5 sm:p-3.5 border-b-2 border-zinc-900 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 rounded-t-xl shrink-0 gap-1.5 sm:gap-2">
          {/* Left: Window dots & ID */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <div className="flex items-center space-x-1 mr-0.5 sm:mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            </div>
            <span className="px-1.5 sm:px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-mono font-bold text-[10px] sm:text-xs border border-zinc-900 shrink-0">
              <span className="hidden sm:inline">FOCUS_STATION.HTM</span>
              <span className="sm:hidden">FOCUS</span>
            </span>
            {isTaskGradedToday && (
              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-400 text-zinc-950 font-mono font-black text-[10px] sm:text-xs border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b] flex items-center space-x-0.5 sm:space-x-1 shrink-0">
                <span>✓</span>
                <span className="hidden sm:inline">GRADED</span>
              </span>
            )}
          </div>

          {/* Center: Navigation Arrows, Counter, and Shuffle */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 shrink-0 mx-auto">
            {hasPrev && onPrev && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
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
              <div className="retro-box-sm px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100 shrink-0">
                {currentIndex !== undefined ? currentIndex + 1 : 1}/{totalCount}
              </div>
            )}

            {hasNext && onNext && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
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
                  onShuffle();
                }}
                className="retro-btn p-1 sm:px-2 sm:py-1 rounded bg-amber-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer text-xs font-mono font-bold flex items-center space-x-1 ml-0.5"
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
                onClose();
              }}
              className="retro-btn p-1 sm:px-2.5 sm:py-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer flex items-center space-x-1 text-xs font-mono font-bold"
              title="Close modal [Shortcut: Esc]"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container with transition animations */}
        <div className="overflow-y-auto p-3 sm:p-6 custom-scrollbar">
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
                {/* Category & Tags Row */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {isTaskGradedToday && (
                    <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-emerald-400 text-zinc-950 border border-zinc-900 shadow-[1.5px_1.5px_0px_0px_#18181b] flex items-center space-x-1 shrink-0">
                      <span>✓</span>
                      <span>GRADED TODAY</span>
                    </span>
                  )}
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

                {/* Main Heading */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug break-words">
                  {item.title}
                </h2>

                {/* External Sources & References */}
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

              {/* Invariant Notes: Hidden by default */}
              {item.notes ? (
                <div className="space-y-2">
                  {!showNotes ? (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowNotes(true);
                      }}
                      className="retro-btn w-full p-3 rounded-lg bg-amber-50/70 dark:bg-zinc-900/80 hover:bg-amber-100/80 dark:hover:bg-zinc-800 border-2 border-dashed border-amber-800/60 dark:border-zinc-700 flex items-center justify-between transition-colors group cursor-pointer text-left"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-6 h-6 rounded bg-amber-300 dark:bg-amber-400 border border-zinc-900 flex items-center justify-center shrink-0">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-950" />
                        </div>
                        <span className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          Reveal Key Invariants &amp; Notes
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
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

              {/* Spaced Repetition Stats - Streamlined Single-Row Pills */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5 font-mono">
                <div className="retro-box-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>Streak</span>
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {currentReps}
                  </span>
                </div>

                <div className="retro-box-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Interval</span>
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100">
                    {currentInterval}d
                  </span>
                </div>

                <div className="retro-box-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-900 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <span>Next</span>
                  </span>
                  <span className="text-[11px] sm:text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                    {reviewRecord?.nextReviewDate || 'Today'}
                  </span>
                </div>
              </div>

              {/* SM-2 Recall Feedback / Graded Highlight Bar */}
              <div className="pt-2.5 sm:pt-3 border-t-2 border-zinc-900 dark:border-zinc-700">
                {isTaskGradedToday ? (
                  /* VISIBLE HIGHLIGHT TAG & MINIMAL RESET BAR */
                  <div className="retro-box-sm px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-lg bg-emerald-100/90 dark:bg-emerald-950/60 border-2 border-emerald-600 dark:border-emerald-500 shadow-[2px_2px_0px_0px_#059669] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="px-2 py-0.5 rounded font-mono font-black text-[11px] sm:text-xs bg-emerald-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b] shrink-0">
                        ✓ GRADED
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        Next: <span className="underline decoration-emerald-500 font-black">{reviewRecord?.nextReviewDate}</span>
                      </span>
                    </div>

                    {onResetEvaluation && (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onResetEvaluation(item.id);
                        }}
                        className="retro-btn px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 border border-zinc-900 flex items-center space-x-1 shrink-0 cursor-pointer shadow-[1px_1px_0px_0px_#18181b]"
                        title="Reset evaluation so this card is due today and ready to grade [Shortcut: R]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Evaluation</span>
                        <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-amber-200 border border-zinc-900">
                          R
                        </kbd>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Easy to Hard Recall Slider & Dynamic Feedback Card */
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-mono">
                      <p className="text-zinc-900 dark:text-white flex items-center space-x-1.5 truncate">
                        <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">HOW DO YOU FEEL ABOUT THIS TOPIC?</span>
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-mono font-bold shrink-0 ml-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">EASY</span>
                        <span className="text-zinc-400">➔</span>
                        <span className="text-rose-600 dark:text-rose-400 font-black">HARD</span>
                      </div>
                    </div>

                    {/* 4 Station Buttons along the spectrum (Sideways, perfectly contained) */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {SLIDER_STEPS.map((stepItem) => {
                        const isSelected = selectedStep === stepItem.step;
                        return (
                          <button
                            key={stepItem.step}
                            type="button"
                            onClick={() => handleStepClick(stepItem.step)}
                            className={`retro-btn px-1.5 sm:px-2.5 py-2 sm:py-2.5 rounded-lg border-2 text-center cursor-pointer flex flex-col items-center justify-center min-h-[52px] sm:min-h-[58px] relative transition-all min-w-0 overflow-hidden ${
                              isSelected
                                ? stepItem.colorScheme.activeBtn
                                : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                            }`}
                            title={`${stepItem.label}: ${stepItem.headline} [Shortcut: ${stepItem.shortcut} or click again to confirm]`}
                          >
                            <div className="flex items-center justify-center space-x-1 sm:space-x-1.5 min-w-0 w-full px-0.5">
                              <span className="text-sm sm:text-base shrink-0 leading-none">{stepItem.emoji}</span>
                              <span className="font-mono font-black text-[11px] sm:text-xs truncate">{stepItem.label}</span>
                              <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-white/80 dark:bg-zinc-900/80 border border-zinc-400 shrink-0">
                                {stepItem.shortcut}
                              </kbd>
                            </div>
                            {isSelected && (
                              <span className="hidden sm:inline-block text-[9px] font-mono font-bold mt-0.5 opacity-90 truncate">
                                {stepItem.step === 2 ? 'Default ★' : 'Selected'}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Draggable Range Slider Bar Track */}
                    <div className="space-y-1 px-0.5">
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={selectedStep}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          playClickSound();
                          setSelectedStep(val);
                        }}
                        className="w-full h-2 sm:h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer border border-zinc-900 dark:border-zinc-700 accent-zinc-950 dark:accent-amber-400 focus:outline-none"
                        aria-label="Recall difficulty slider from Easy to Hard"
                      />
                      <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 px-0.5">
                        <span className="text-emerald-700 dark:text-emerald-400">1. Easy</span>
                        <span className="text-sky-700 dark:text-sky-400 font-black">2. Moderate ★</span>
                        <span className="text-amber-700 dark:text-amber-400">3. Hard</span>
                        <span className="text-rose-700 dark:text-rose-400">4. Blank</span>
                      </div>
                    </div>

                    {/* Informative Feedback Message Card Below */}
                    {activeStepItem && (
                      <div
                        className={`p-2.5 sm:p-3 rounded-lg border-2 space-y-1.5 transition-all ${activeStepItem.colorScheme.bgCard} ${activeStepItem.colorScheme.borderCard}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-1.5 font-mono font-bold text-xs sm:text-sm min-w-0">
                            <span className="text-base sm:text-lg shrink-0 leading-none">{activeStepItem.emoji}</span>
                            <span className="font-black underline">{activeStepItem.label}:</span>
                            <span className="truncate">{activeStepItem.headline}</span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black border uppercase tracking-wider shrink-0 ${activeStepItem.colorScheme.bgBadge}`}
                          >
                            {activeStepItem.badge}
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs font-mono leading-relaxed opacity-95">
                          {activeStepItem.description}
                        </p>

                        {nextReviewPreview && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-zinc-300/60 dark:border-zinc-700/60 text-[10px] sm:text-[11px] font-mono">
                            <span className="font-bold opacity-80">SM-2 SCHEDULE:</span>
                            <span className="bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-400/80 font-bold text-zinc-950 dark:text-zinc-50">
                              📅 Next: {nextReviewPreview.nextReviewDate} ({nextReviewPreview.interval === 1 ? 'Tomorrow' : `+${nextReviewPreview.interval}d`})
                            </span>
                            <span className="opacity-75">
                              Streak: #{nextReviewPreview.repetition} • Ease: {nextReviewPreview.easeFactor.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer: Confirm Grade (left) + Shortcuts (center) + Close (right) */}
        <div className="border-t-2 border-zinc-900 dark:border-zinc-700 p-2 sm:p-3 bg-zinc-100 dark:bg-zinc-900/80 rounded-b-xl flex items-center justify-between gap-2 shrink-0">
          {/* Left: Confirm Grade button (only when not yet graded) */}
          {item && !isTaskGradedToday ? (
            <button
              type="button"
              onClick={() => {
                if (activeStepItem.key === 'mastered') {
                  playMasteredChime();
                } else {
                  playClickSound();
                }
                commitRating(activeStepItem.key);
              }}
              className={`retro-btn flex-1 sm:flex-initial py-1.5 sm:py-2 px-3 sm:px-5 rounded-lg font-mono font-black text-xs sm:text-sm border-2 border-zinc-950 flex items-center justify-center space-x-2 cursor-pointer shadow-[2px_2px_0px_0px_#18181b] transition-all ${activeStepItem.colorScheme.confirmBtn}`}
              title={`Confirm ${activeStepItem.label} grade and advance [Shortcut: Enter]`}
            >
              <span>{activeStepItem.emoji} Confirm: {activeStepItem.label}</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/90 dark:bg-zinc-900/90 border border-zinc-950 text-zinc-950 dark:text-zinc-50">
                Enter ↵
              </kbd>
            </button>
          ) : (
            /* Shortcuts legend on desktop when graded */
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-900 dark:text-zinc-200">SHORTCUTS:</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Space</kbd> Notes</span>
              {isTaskGradedToday && (
                <><span>•</span><span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">R</kbd> Reset</span></>
              )}
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">S</kbd> Shuffle</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Esc</kbd> Close</span>
            </div>
          )}

          {/* Center: Shortcuts legend (only when not graded, desktop) */}
          {item && !isTaskGradedToday && (
            <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-900 dark:text-zinc-200">SHORTCUTS:</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">1-4</kbd> Slider</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">S</kbd> Shuffle</span>
              <span>•</span>
              <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Esc</kbd> Close</span>
            </div>
          )}

          {/* Right: Close button */}
          <button
            type="button"
            onClick={onClose}
            className="retro-btn px-3 py-1.5 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold font-mono cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
