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
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';

interface TodayCardProps {
  item: ConceptItem | null;
  reviewRecord?: ReviewRecord | null;
  onRate: (confidence: RecallConfidence) => void;
  onShuffle: () => void;
  onOpenAddModal: () => void;
}

export function TodayCard({
  item,
  reviewRecord,
  onRate,
  onShuffle,
  onOpenAddModal,
}: TodayCardProps) {
  // Start notes collapsed when moving to a new card to encourage recall first
  const [showNotes, setShowNotes] = useState(false);

  // When card changes, reset notes visibility
  useEffect(() => {
    setShowNotes(false);
  }, [item?.id]);

  // Global Keyboard Shortcuts for lightning-fast active recall
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if (e.code === 'Space') {
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
        playClickSound();
        onShuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onRate, onShuffle]);

  if (!item) {
    return (
      <div className="retro-box rounded-xl p-8 sm:p-10 text-center bg-white dark:bg-zinc-900">
        <div className="w-14 h-14 rounded-lg bg-amber-300 dark:bg-amber-400 border-2 border-zinc-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#18181b]">
          <span className="font-mono text-xl font-black text-zinc-950">✓</span>
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono">
          [QUEUE CAUGHT UP]
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed font-mono">
          Select any card from your queue on the left to study it now, or add a newly learned concept to start your spaced repetition cycle.
        </p>
        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="retro-btn mt-5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer font-mono"
        >
          + Add New Concept Card
        </button>
      </div>
    );
  }

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
      key={item.id}
      id="active-focus-card"
      className="retro-box w-full min-w-0 rounded-xl bg-[#fffefb] dark:bg-zinc-900 p-4 sm:p-7 space-y-4 sm:space-y-5"
    >
      {/* Top Nostalgic Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-900 dark:border-zinc-700 pb-2.5 sm:pb-3">
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

          {item.category && (
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[11px] sm:text-xs font-mono font-bold border border-zinc-900 dark:border-zinc-700 shrink-0">
              {item.category}
            </span>
          )}

          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="px-1.5 sm:px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 text-[11px] sm:text-xs font-mono font-bold border border-emerald-900 dark:border-emerald-700 flex items-center space-x-0.5 shrink-0"
            >
              <Hash className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              onShuffle();
            }}
            className="retro-btn flex items-center space-x-1 sm:space-x-1.5 text-zinc-800 dark:text-zinc-200 cursor-pointer py-1 px-2 sm:px-2.5 rounded bg-white dark:bg-zinc-800 text-xs font-mono font-bold"
            title="Pick another card [Shortcut: S]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Shuffle</span>
            <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
              S
            </kbd>
          </button>
        </div>
      </div>

      {/* Title & Concept Header */}
      <div className="space-y-3">
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

        {/* Active Recall Step 2: Prompt and Ruled Notes Index Card */}
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
              <div className="text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed bg-[#fefce8] dark:bg-zinc-950 p-3.5 sm:p-5 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] whitespace-pre-wrap font-mono break-words">
                {item.notes}
              </div>
            ) : (
              <div
                onClick={() => {
                  playClickSound();
                  setShowNotes(true);
                }}
                className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 italic bg-amber-50/70 dark:bg-zinc-950/60 p-3.5 sm:p-5 rounded-lg border-2 border-dashed border-zinc-900 dark:border-zinc-700 text-center cursor-pointer hover:bg-amber-100/70 dark:hover:bg-zinc-900 transition-colors font-mono space-y-1"
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
      </div>

      {/* Active Recall Comfort Check */}
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
    </div>
  );
}
