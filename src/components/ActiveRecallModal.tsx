'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';

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
  const [prevItemId, setPrevItemId] = useState(item?.id);
  const [showNotes, setShowNotes] = useState(false);

  // When card changes, reset notes visibility
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setShowNotes(false);
  }

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
      } else if (e.key === '1' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        playClickSound();
        onRate('struggled');
      } else if (e.key === '2' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        playClickSound();
        onRate('comfortable');
      } else if (e.key === '3' || e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        playMasteredChime();
        onRate('mastered');
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
  }, [isOpen, item, onRate, onShuffle, onPrev, onNext, hasPrev, hasNext, onClose]);

  if (!isOpen) return null;

  const handleRate = (confidence: RecallConfidence) => {
    if (confidence === 'mastered') {
      playMasteredChime();
    } else {
      playClickSound();
    }
    onRate(confidence);
  };

  const currentInterval = reviewRecord?.interval ?? 1;
  const currentReps = reviewRecord?.repetition ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="retro-box relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl bg-[#fffefb] dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#27272a] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Nostalgic Window Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 sm:p-4 border-b-2 border-zinc-900 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 rounded-t-xl shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Window dots */}
            <div className="flex items-center space-x-1.5 mr-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            </div>

            <span className="px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-mono font-bold text-[11px] sm:text-xs border border-zinc-900 shrink-0">
              FOCUS_STATION.HTM
            </span>

            {item?.category && (
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs font-mono font-bold border border-zinc-900 dark:border-zinc-700 shrink-0">
                {item.category}
              </span>
            )}

            {item?.tags?.map((tag) => (
              <span
                key={tag}
                className="hidden sm:inline-flex px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 text-[11px] sm:text-xs font-mono font-bold border border-emerald-900 dark:border-emerald-700 items-center space-x-0.5 shrink-0"
              >
                <Hash className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </span>
            ))}
          </div>

          {/* Right Controls: Navigation + Shuffle + Close */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {totalCount !== undefined && totalCount > 1 && (
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 mr-1 hidden sm:inline">
                {currentIndex !== undefined ? currentIndex + 1 : 1}/{totalCount}
              </span>
            )}

            {hasPrev && onPrev && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onPrev();
                }}
                className="retro-btn p-1 sm:p-1.5 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                title="Previous card [Shortcut: ←]"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {hasNext && onNext && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onNext();
                }}
                className="retro-btn p-1 sm:p-1.5 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                title="Next card [Shortcut: →]"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {onShuffle && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  onShuffle();
                }}
                className="retro-btn flex items-center space-x-1 sm:space-x-1.5 text-zinc-800 dark:text-zinc-200 cursor-pointer py-1 px-2 rounded bg-white dark:bg-zinc-800 text-xs font-mono font-bold"
                title="Pick another random card [Shortcut: S]"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                <span className="hidden sm:inline">Shuffle</span>
                <kbd className="hidden md:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                  S
                </kbd>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="retro-btn p-1 sm:p-1.5 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer ml-1"
              title="Close modal [Shortcut: Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-5 custom-scrollbar">
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
            <>
              {/* Title & Concept Header */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug break-words min-w-0">
                    {item.title}
                  </h2>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="retro-link text-xs sm:text-sm font-mono shrink-0 self-start inline-flex items-center space-x-1 pt-0.5"
                    >
                      <span>[Reference Link ↗]</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Mobile tags wrap */}
                {item.tags && item.tags.length > 0 && (
                  <div className="sm:hidden flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 text-[10px] font-mono font-bold border border-emerald-900 flex items-center space-x-0.5"
                      >
                        <Hash className="w-2.5 h-2.5" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Recall: Invariant Recall & Notes */}
              {item.notes ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 pt-1">
                    <span className="flex items-center space-x-1.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="truncate">INVARIANT RECALL &amp; NOTES:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setShowNotes(!showNotes);
                      }}
                      className="retro-btn px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5 cursor-pointer shrink-0 ml-2"
                      title="Toggle Notes [Shortcut: Space]"
                    >
                      {showNotes ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide<span className="hidden sm:inline"> Notes</span></span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Reveal<span className="hidden sm:inline"> Notes</span></span>
                        </>
                      )}
                      <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                        Space
                      </kbd>
                    </button>
                  </div>

                  {showNotes ? (
                    <div className="text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed bg-[#fefce8] dark:bg-zinc-900 p-3.5 sm:p-5 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] whitespace-pre-wrap font-mono break-words">
                      {item.notes}
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        playClickSound();
                        setShowNotes(true);
                      }}
                      className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 italic bg-amber-50/70 dark:bg-zinc-950/60 p-4 sm:p-6 rounded-lg border-2 border-dashed border-zinc-900 dark:border-zinc-700 text-center cursor-pointer hover:bg-amber-100/70 dark:hover:bg-zinc-900 transition-colors font-mono space-y-1"
                    >
                      <div>💡 Test your memory first! Can you articulate the core invariants?</div>
                      <div className="font-bold underline text-zinc-900 dark:text-zinc-200">
                        [Click or press Space to Reveal Notes]
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Spaced repetition metadata pills */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 font-mono text-[11px] sm:text-xs font-bold">
                <div className="retro-box-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-500" />
                  <span>Repetition: {currentReps}</span>
                </div>

                <div className="retro-box-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                  <span>Interval: {currentInterval}d</span>
                </div>

                {reviewRecord?.nextReviewDate && (
                  <div className="retro-box-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    <span>Next: {reviewRecord.nextReviewDate}</span>
                  </div>
                )}
              </div>

              {/* SM-2 Recall Feedback */}
              <div className="pt-3.5 sm:pt-4 border-t-2 border-zinc-900 dark:border-zinc-700 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-mono">
                  <p className="text-zinc-900 dark:text-white flex items-center space-x-1.5 truncate">
                    <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                    <span className="truncate">HOW WELL DID YOU RECALL THIS?</span>
                  </p>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0 ml-1">
                    [SM-2]
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleRate('struggled')}
                    className="retro-btn p-2 sm:p-3 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 border-2 border-rose-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[52px] sm:min-h-[64px] relative"
                    title="Recall blanked or struggled [Shortcut: 1]"
                  >
                    <div className="font-mono font-black text-xs sm:text-base flex items-center justify-center space-x-1">
                      <span>❌ Hard</span>
                      <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-rose-200 dark:bg-rose-900 border border-rose-900 text-rose-950 dark:text-rose-200">
                        1
                      </kbd>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono block mt-0.5 opacity-90 truncate max-w-full">
                      +1d<span className="hidden sm:inline"> (revisit)</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('comfortable')}
                    className="retro-btn p-2 sm:p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 text-center cursor-pointer flex flex-col items-center justify-center min-h-[52px] sm:min-h-[64px] relative"
                    title="Recalled after brief thought [Shortcut: 2]"
                  >
                    <div className="font-mono font-black text-xs sm:text-base flex items-center justify-center space-x-1">
                      <span>✓ Good</span>
                      <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 border border-zinc-600 text-zinc-900 dark:text-zinc-100">
                        2
                      </kbd>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono block mt-0.5 opacity-90 truncate max-w-full">
                      +{currentInterval}d<span className="hidden sm:inline"> (standard)</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRate('mastered')}
                    className="retro-btn p-2 sm:p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[52px] sm:min-h-[64px] relative"
                    title="Instant fluid recall [Shortcut: 3]"
                  >
                    <div className="font-mono font-black text-xs sm:text-base flex items-center justify-center space-x-1">
                      <span>⭐ Easy</span>
                      <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 border border-emerald-900 text-emerald-950 dark:text-emerald-200">
                        3
                      </kbd>
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono block mt-0.5 opacity-90 truncate max-w-full">
                      +2x<span className="hidden sm:inline"> (longer)</span>
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts Legend */}
        <div className="border-t-2 border-zinc-900 dark:border-zinc-700 p-2.5 sm:p-3 bg-zinc-100 dark:bg-zinc-900/80 rounded-b-xl flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-zinc-900 dark:text-zinc-200">SHORTCUTS:</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Space</kbd> Flip</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">1/2/3</kbd> Rate</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">S</kbd> Shuffle</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.2 rounded bg-white dark:bg-zinc-800 border">Esc</kbd> Close</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="retro-btn px-2.5 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold font-mono cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
