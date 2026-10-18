'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { playClickSound, playMasteredChime } from '@/lib/sound';

interface RedistributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueCount: number;
  dueTodayCount: number;
  onConfirm: (options: {
    days: number;
    target: 'overdue' | 'due_and_overdue';
    startTomorrow: boolean;
  }) => void;
}

export function RedistributeModal({
  isOpen,
  onClose,
  overdueCount,
  dueTodayCount,
  onConfirm,
}: RedistributeModalProps) {
  // Default target: if overdue tasks exist, default to overdue, otherwise due_and_overdue
  const [target, setTarget] = useState<'overdue' | 'due_and_overdue'>(() =>
    overdueCount > 0 ? 'overdue' : 'due_and_overdue'
  );

  const totalCandidateCount = target === 'overdue' ? overdueCount : overdueCount + dueTodayCount;

  // Suggest optimal days based on number of tasks
  const defaultDays = useMemo(() => {
    if (totalCandidateCount <= 3) return 2;
    if (totalCandidateCount <= 8) return 3;
    if (totalCandidateCount <= 16) return 5;
    return 7;
  }, [totalCandidateCount]);

  const [days, setDays] = useState<number>(defaultDays);
  const [startTomorrow, setStartTomorrow] = useState<boolean>(false);

  // Sync default days if candidate count changes significantly and user hasn't touched it much
  const presetDays = useMemo(() => {
    const list = [2, 3, 5, 7];
    if (totalCandidateCount > 20 && !list.includes(10)) list.push(10);
    if (totalCandidateCount > 30 && !list.includes(14)) list.push(14);
    return list;
  }, [totalCandidateCount]);

  // Projected daily breakdown
  const dailyDistribution = useMemo(() => {
    if (totalCandidateCount === 0 || days <= 0) return [];
    const counts: number[] = Array.from({ length: days }, () => 0);
    for (let i = 0; i < totalCandidateCount; i++) {
      counts[i % days]++;
    }

    const today = new Date();
    return counts.map((count, index) => {
      const d = new Date(today);
      d.setDate(d.getDate() + index + (startTomorrow ? 1 : 0));
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(d);
      return {
        dayLabel: index === 0 && !startTomorrow ? 'Today' : index === 0 && startTomorrow ? 'Tomorrow' : formatted,
        dateFormatted: formatted,
        count,
      };
    });
  }, [totalCandidateCount, days, startTomorrow]);

  if (!isOpen) return null;

  const handleApply = () => {
    playMasteredChime();
    onConfirm({
      days: Math.max(1, days),
      target,
      startTomorrow,
    });
    onClose();
  };

  const handleQuickDaySelect = (d: number) => {
    playClickSound();
    setDays(d);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="retro-box relative w-full max-w-lg rounded-xl bg-[#fffefb] dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#27272a] my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Window Bar */}
        <div className="flex items-center justify-between p-3 sm:p-3.5 border-b-2 border-zinc-900 dark:border-zinc-700 bg-amber-200 dark:bg-amber-950/70">
          <div className="flex items-center space-x-2">
            <CalendarRange className="w-4 h-4 text-zinc-950 dark:text-amber-300" />
            <h3 className="font-mono font-bold text-xs sm:text-sm text-zinc-950 dark:text-amber-200 uppercase tracking-wider">
              REDISTRIBUTE_WORKLOAD.SYS
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1 rounded text-zinc-900 dark:text-zinc-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar font-mono">
          {/* Workload Overview Banner */}
          <div className="retro-box-sm p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-700 space-y-2">
            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Current Unfinished Backlog</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 text-xs font-bold border border-rose-900">
                🚨 {overdueCount} Overdue
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 text-xs font-bold border border-emerald-900">
                ⏰ {dueTodayCount} Due Today
              </span>
              <span className="text-xs text-zinc-500 ml-auto">
                Total: {overdueCount + dueTodayCount} tasks
              </span>
            </div>
          </div>

          {/* 1. Target Scope Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
              1. Select Which Tasks to Re-distribute:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setTarget('overdue');
                }}
                disabled={overdueCount === 0}
                className={`p-2.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  target === 'overdue'
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : overdueCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-300 dark:border-zinc-800'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="text-xs font-black">Overdue Tasks Only</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Spread {overdueCount} late card{overdueCount !== 1 ? 's' : ''}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setTarget('due_and_overdue');
                }}
                className={`p-2.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  target === 'due_and_overdue'
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="text-xs font-black">All Due &amp; Overdue</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Spread all {overdueCount + dueTodayCount} card{overdueCount + dueTodayCount !== 1 ? 's' : ''}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Choose Days Count (X Days) */}
          <div className="space-y-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                2. Re-distribute Across How Many Days?
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {presetDays.map((d) => {
                const isSelected = days === d;
                const approxPerDay = Math.ceil(totalCandidateCount / d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleQuickDaySelect(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    <span>{d} Days</span>
                    <span className="text-[10px] opacity-75 ml-1">
                      (~{approxPerDay}/day)
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Range Slider & Manual Stepper */}
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="range"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setDays((prev) => Math.max(1, prev - 1));
                  }}
                  className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs border border-zinc-900 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
                  title="Decrease days"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                  className="w-12 text-center text-xs font-bold py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setDays((prev) => Math.min(30, prev + 1));
                  }}
                  className="w-7 h-7 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs border border-zinc-900 dark:border-zinc-700 flex items-center justify-center cursor-pointer"
                  title="Increase days"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Schedule Option: Start tomorrow or today */}
          <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-mono select-none">
              <input
                type="checkbox"
                checked={startTomorrow}
                onChange={(e) => {
                  playClickSound();
                  setStartTomorrow(e.target.checked);
                }}
                className="w-4 h-4 rounded border-2 border-zinc-900 accent-emerald-500 cursor-pointer"
              />
              <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                Start distribution tomorrow (give me full breathing room today)
              </span>
            </label>
          </div>

          {/* 4. Live Schedule Projection */}
          <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Projected Daily Workload (~{Math.ceil(totalCandidateCount / days)} tasks/day):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {dailyDistribution.map((item, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                    {item.dayLabel}
                  </span>
                  <span className="font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-200 text-[11px] border border-zinc-900/40">
                    {item.count} {item.count === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 sm:p-4 border-t-2 border-zinc-900 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={totalCandidateCount === 0}
            className={`retro-btn px-4 py-2 rounded-lg text-xs font-mono font-bold border-2 border-zinc-900 cursor-pointer flex items-center space-x-1.5 ${
              totalCandidateCount === 0
                ? 'opacity-50 cursor-not-allowed bg-zinc-300 text-zinc-600'
                : 'bg-emerald-400 hover:bg-emerald-500 text-zinc-950 shadow-[2px_2px_0px_0px_#18181b]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              Re-distribute {totalCandidateCount} Task{totalCandidateCount !== 1 ? 's' : ''} Across {days} Days
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
