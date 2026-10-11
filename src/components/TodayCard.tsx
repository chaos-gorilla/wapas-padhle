'use client';

import React, { useState } from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Layers,
  BookOpen,
  Eye,
  EyeOff,
  Flame,
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
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 sm:p-10 text-center bg-white/70 dark:bg-zinc-900/40 backdrop-blur-sm shadow-xs transition-all">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          All caught up for today!
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Select any card from your queue to study it now, or add a newly learned concept to start your spaced repetition cycle.
        </p>
        <button
          onClick={() => {
            playClickSound();
            onOpenAddModal();
          }}
          className="mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
        >
          Add New Concept
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
      className="animate-card-enter relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md p-6 sm:p-7 shadow-sm transition-all space-y-5 ring-1 ring-emerald-500/10 dark:ring-emerald-500/20"
    >
      {/* Calm ambient background aura */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-56 h-56 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl" />

      {/* Top Header */}
      <div className="flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[10px]">Active Focus Station</span>
          </span>

          {item.category && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium border border-zinc-200/50 dark:border-zinc-700/50">
              {item.category}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              playClickSound();
              onShuffle();
            }}
            className="flex items-center space-x-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60 active:scale-95"
            title="Pick another concept from your queue"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400 group-hover:rotate-180 transition-transform" />
            <span className="text-xs font-medium">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Title & Concept Header */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
            {item.title}
          </h2>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 shrink-0 hover:shadow-2xs active:scale-95 transition-all"
            >
              <span>Reference</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Active Recall Toggle & Content */}
        {item.notes ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3 text-emerald-500" />
                <span className="font-medium">Recall prompt & notes</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowNotes(!showNotes);
                }}
                className="flex items-center space-x-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {showNotes ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide notes</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show notes</span>
                  </>
                )}
              </button>
            </div>

            {showNotes ? (
              <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed bg-zinc-50/80 dark:bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 whitespace-pre-wrap">
                {item.notes}
              </div>
            ) : (
              <div
                onClick={() => {
                  playClickSound();
                  setShowNotes(true);
                }}
                className="text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/40 dark:bg-zinc-950/30 p-3.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                Recall the core invariants first! Click to reveal answer & notes...
              </div>
            )}
          </div>
        ) : null}

        {/* Small metadata status pill */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="inline-flex items-center space-x-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 px-2.5 py-0.5 rounded-md">
            <Layers className="w-3 h-3 text-zinc-400" />
            <span>Repetition: {currentReps}</span>
          </div>

          <div className="inline-flex items-center space-x-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 px-2.5 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Interval: {currentInterval} day{currentInterval !== 1 ? 's' : ''}</span>
          </div>

          {reviewRecord?.nextReviewDate && (
            <div className="inline-flex items-center space-x-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-800/50 px-2.5 py-0.5 rounded-md">
              <span>Next: {reviewRecord.nextReviewDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Recall Comfort Check */}
      <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800 relative z-10 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>How well did you recall this invariant?</span>
          </p>
          <span className="text-[10px] text-zinc-400">SM-2 Spaced Repetition</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => handleRate('struggled')}
            className="group px-3 py-3 rounded-xl border border-rose-200/90 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/60 hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold text-center transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <div className="font-bold">Struggled</div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">
              Revisit tomorrow (+1d)
            </span>
          </button>

          <button
            onClick={() => handleRate('comfortable')}
            className="group px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/80 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 text-xs font-semibold text-center transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <div className="font-bold">Comfortable</div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">
              Normal interval
            </span>
          </button>

          <button
            onClick={() => handleRate('mastered')}
            className="group px-3 py-3 rounded-xl border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-semibold text-center transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <div className="font-bold flex items-center justify-center space-x-1">
              <span>Mastered</span>
              <Sparkles className="w-3 h-3 text-emerald-500" />
            </div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">
              Longer spacing
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
