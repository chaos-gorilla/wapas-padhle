'use client';

import React from 'react';
import { ConceptItem, RecallConfidence, ReviewRecord } from '@/types';
import { ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

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
  if (!item) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 text-center bg-white dark:bg-zinc-900/40">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          No concepts currently due
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
          Add what you learned today (a technical concept, system design pattern, or article) to
          start your spaced repetition schedule.
        </p>
        <button
          onClick={onOpenAddModal}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
        >
          Add Your First Card
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-7 shadow-sm transition-colors space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] font-mono">
            Today&apos;s Revisit
          </span>
          {item.category && (
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px]">
              {item.category}
            </span>
          )}
        </div>

        <button
          onClick={onShuffle}
          className="flex items-center space-x-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="Pick another concept from your queue"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Title & Notes */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            {item.title}
          </h2>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 shrink-0"
            >
              <span>Open Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {item.notes && (
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
            {item.notes}
          </p>
        )}

        {/* Small metadata */}
        {reviewRecord && (
          <p className="text-[11px] text-zinc-400 font-mono">
            Review count: {reviewRecord.repetition} • Current interval: {reviewRecord.interval} day(s)
          </p>
        )}
      </div>

      {/* Active Recall Comfort Check */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          How comfortable did you feel recalling this?
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onRate('struggled')}
            className="px-3 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold text-center transition-colors"
          >
            <div>Struggled</div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">Revisit tomorrow</span>
          </button>

          <button
            onClick={() => onRate('comfortable')}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-center transition-colors"
          >
            <div>Comfortable</div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">Spaced interval</span>
          </button>

          <button
            onClick={() => onRate('mastered')}
            className="px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-xs font-semibold text-center transition-colors"
          >
            <div>Mastered</div>
            <span className="text-[10px] opacity-75 font-normal block mt-0.5">Longer spacing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
