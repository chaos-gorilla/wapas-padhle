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
  const [prevItemId, setPrevItemId] = useState(item?.id);
  const [showNotes, setShowNotes] = useState(false);

  // When card changes, reset notes visibility during render (React recommended pattern)
  if (item?.id !== prevItemId) {
    setPrevItemId(item?.id);
    setShowNotes(false);
  }

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
      } else if (e.key === '1') {
        e.preventDefault();
        playClickSound();
        onRate('forgot');
      } else if (e.key === '2' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        playClickSound();
        onRate('struggled');
      } else if (e.key === '3' || e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        playClickSound();
        onRate('comfortable');
      } else if (e.key === '4' || e.key === 'm' || e.key === 'M') {
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
      <div className="space-y-2.5">
        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug break-words">
          {item.title}
        </h2>

        {item.url && (
          <div className="pt-0.5">
            <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider inline-flex items-center space-x-1 mr-2">
              <ExternalLink className="w-3 h-3 text-amber-500" />
              <span>External Sources &amp; References:</span>
            </span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="retro-btn inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs font-mono font-bold transition-all"
            >
              <span>🔗 {(() => {
                try {
                  return new URL(item.url).hostname.replace(/^www\./, '');
                } catch {
                  return 'Reference Link';
                }
              })()}</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>
          </div>
        )}

        {/* Invariant Notes: Hidden by default */}
        {item.notes ? (
          <div className="space-y-2 pt-1">
            {!showNotes ? (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowNotes(true);
                }}
                className="retro-btn w-full p-3 sm:p-3.5 rounded-lg bg-amber-50/70 dark:bg-zinc-900/80 hover:bg-amber-100/80 dark:hover:bg-zinc-800 border-2 border-dashed border-amber-800/60 dark:border-zinc-700 flex items-center justify-between transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-amber-300 dark:bg-amber-400 border border-zinc-900 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-950" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      Reveal Key Invariants &amp; Notes
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      💡 Test your active recall first before checking notes
                    </div>
                  </div>
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
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Notes</span>
                    <kbd className="hidden sm:inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-400 text-zinc-600 dark:text-zinc-300">
                      Space
                    </kbd>
                  </button>
                </div>

                <div className="text-xs sm:text-sm md:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed bg-[#fefce8] dark:bg-zinc-950 p-3.5 sm:p-5 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] whitespace-pre-wrap font-mono break-words">
                  {item.notes}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Detailed Spaced Repetition Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
          <div className="retro-box-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <div className="flex items-center space-x-1 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
              <Layers className="w-3 h-3 text-indigo-500" />
              <span>Streak</span>
            </div>
            <div className="font-bold text-xs mt-0.5">{currentReps} reviews</div>
          </div>

          <div className="retro-box-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <div className="flex items-center space-x-1 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Interval</span>
            </div>
            <div className="font-bold text-xs mt-0.5">{currentInterval}d cadence</div>
          </div>

          <div className="retro-box-sm p-2 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            <div className="flex items-center space-x-1 text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400">
              <span>Next</span>
            </div>
            <div className="font-bold text-xs mt-0.5 truncate">{reviewRecord?.nextReviewDate || 'Today'}</div>
          </div>
        </div>
      </div>

      {/* Active Recall Comfort Check */}
      <div className="pt-3.5 sm:pt-4 border-t-2 border-zinc-900 dark:border-zinc-700 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold font-mono">
          <p className="text-zinc-900 dark:text-white flex items-center space-x-1.5 truncate">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="truncate">HOW DO YOU FEEL ABOUT THIS TOPIC NOW?</span>
          </p>
          <span className="text-[10px] sm:text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 shrink-0 ml-1">
            [SM-2]
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleRate('forgot')}
            className="retro-btn p-2 sm:p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-2 border-rose-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[58px]"
            title="Not gonna happen / blanked [Shortcut: 1]"
          >
            <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-center space-x-1">
              <span>💀 Blank</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1 rounded bg-white dark:bg-zinc-800 border">1</kbd>
            </div>
            <span className="text-[10px] font-mono mt-0.5 opacity-90">Day 1</span>
          </button>

          <button
            onClick={() => handleRate('struggled')}
            className="retro-btn p-2 sm:p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-2 border-amber-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[58px]"
            title="Hard recall [Shortcut: 2]"
          >
            <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-center space-x-1">
              <span>🧗 Hard</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1 rounded bg-white dark:bg-zinc-800 border">2</kbd>
            </div>
            <span className="text-[10px] font-mono mt-0.5 opacity-90">+1d</span>
          </button>

          <button
            onClick={() => handleRate('comfortable')}
            className="retro-btn p-2 sm:p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-sky-200 border-2 border-sky-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[58px]"
            title="Moderate recall [Shortcut: 3]"
          >
            <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-center space-x-1">
              <span>🧘 Moderate</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1 rounded bg-white dark:bg-zinc-800 border">3</kbd>
            </div>
            <span className="text-[10px] font-mono mt-0.5 opacity-90">+{currentInterval}d</span>
          </button>

          <button
            onClick={() => handleRate('mastered')}
            className="retro-btn p-2 sm:p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 text-center cursor-pointer flex flex-col items-center justify-center min-h-[58px]"
            title="Easy instant recall [Shortcut: 4]"
          >
            <div className="font-mono font-black text-xs sm:text-sm flex items-center justify-center space-x-1">
              <span>🚀 Easy</span>
              <kbd className="hidden sm:inline font-mono text-[9px] px-1 rounded bg-white dark:bg-zinc-800 border">4</kbd>
            </div>
            <span className="text-[10px] font-mono mt-0.5 opacity-90">Longer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
