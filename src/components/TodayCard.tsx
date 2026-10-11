'use client';

import React, { useState } from 'react';
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
  const [showNotes, setShowNotes] = useState(true);

  if (!item) {
    return (
      <div className="retro-box rounded-xl p-8 sm:p-10 text-center bg-white dark:bg-zinc-900">
        <div className="w-14 h-14 rounded-lg bg-amber-300 dark:bg-amber-400 border-2 border-zinc-900 flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_#18181b]">
          <span className="font-mono text-xl font-black text-zinc-950">✓</span>
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono">
          [QUEUE CAUGHT UP]
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
          Select any card from your queue on the left to study it now, or add a newly learned concept to start your spaced repetition cycle.
        </p>
        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="retro-btn mt-5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
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
      className="retro-box rounded-xl bg-[#fffefb] dark:bg-zinc-900 p-5 sm:p-7 space-y-5"
    >
      {/* Top Nostalgic Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b-2 border-zinc-900 dark:border-zinc-700 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Window dots */}
          <div className="flex items-center space-x-1.5 mr-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
          </div>

          <span className="px-2.5 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-mono font-bold text-xs border border-zinc-900">
            FOCUS_STATION.HTM
          </span>

          {item.category && (
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold border border-zinc-900 dark:border-zinc-700">
              {item.category}
            </span>
          )}

          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 text-xs font-mono font-bold border border-emerald-900 dark:border-emerald-700 flex items-center space-x-0.5"
            >
              <Hash className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              playClickSound();
              onShuffle();
            }}
            className="retro-btn flex items-center space-x-1.5 text-zinc-800 dark:text-zinc-200 cursor-pointer py-1 px-2.5 rounded bg-white dark:bg-zinc-800 text-xs font-mono font-bold"
            title="Pick another random concept from your queue"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      {/* Title & Concept Header */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-snug">
            {item.title}
          </h2>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="retro-link text-xs sm:text-sm font-mono shrink-0 flex items-center space-x-1"
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
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>INVARIANT RECALL & NOTES:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowNotes(!showNotes);
                }}
                className="retro-btn px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center space-x-1 cursor-pointer"
              >
                {showNotes ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Notes</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Reveal Notes</span>
                  </>
                )}
              </button>
            </div>

            {showNotes ? (
              <div className="text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-relaxed bg-[#fefce8] dark:bg-zinc-950 p-4 sm:p-5 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] whitespace-pre-wrap font-mono">
                {item.notes}
              </div>
            ) : (
              <div
                onClick={() => {
                  playClickSound();
                  setShowNotes(true);
                }}
                className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 italic bg-amber-50/70 dark:bg-zinc-950/60 p-4 sm:p-5 rounded-lg border-2 border-dashed border-zinc-900 dark:border-zinc-700 text-center cursor-pointer hover:bg-amber-100/70 dark:hover:bg-zinc-900 transition-colors font-mono"
              >
                💡 Test your memory first! Can you explain the core invariant before peeking?
                <br />
                <span className="font-bold underline text-zinc-900 dark:text-zinc-200 mt-1 inline-block">
                  [Click to Reveal Notes]
                </span>
              </div>
            )}
          </div>
        ) : null}

        {/* Spaced repetition metadata pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs font-bold">
          <div className="retro-box-sm px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>Repetition: {currentReps}</span>
          </div>

          <div className="retro-box-sm px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Interval: {currentInterval} day{currentInterval !== 1 ? 's' : ''}</span>
          </div>

          {reviewRecord?.nextReviewDate && (
            <div className="retro-box-sm px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              <span>Next Review: {reviewRecord.nextReviewDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Recall Comfort Check */}
      <div className="pt-4 border-t-2 border-zinc-900 dark:border-zinc-700 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5 font-mono">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>STEP 3: HOW WELL DID YOU RECALL THIS?</span>
          </p>
          <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400">
            [SM-2 RATING]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleRate('struggled')}
            className="retro-btn p-3.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 border-2 border-rose-900 text-center cursor-pointer"
          >
            <div className="font-mono font-black text-sm sm:text-base flex items-center justify-center space-x-1">
              <span>❌ Hard</span>
            </div>
            <span className="text-xs font-mono block mt-1 opacity-90">
              Revisit tomorrow (+1d)
            </span>
          </button>

          <button
            onClick={() => handleRate('comfortable')}
            className="retro-btn p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 text-center cursor-pointer"
          >
            <div className="font-mono font-black text-sm sm:text-base flex items-center justify-center space-x-1">
              <span>✓ Good</span>
            </div>
            <span className="text-xs font-mono block mt-1 opacity-90">
              Standard interval (+{currentInterval}d)
            </span>
          </button>

          <button
            onClick={() => handleRate('mastered')}
            className="retro-btn p-3.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border-2 border-emerald-900 text-center cursor-pointer"
          >
            <div className="font-mono font-black text-sm sm:text-base flex items-center justify-center space-x-1">
              <span>⭐ Mastered</span>
            </div>
            <span className="text-xs font-mono block mt-1 opacity-90">
              Longer interval
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
