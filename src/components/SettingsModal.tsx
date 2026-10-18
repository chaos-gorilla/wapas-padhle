'use client';

import React, { useEffect, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  List,
  LayoutGrid,
  Settings,
  Monitor,
} from 'lucide-react';
import { ViewMode } from '@/components/FilterSidebar';
import { playClickSound } from '@/lib/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
  soundOn,
  onToggleSound,
  viewMode,
  onViewModeChange,
}: SettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Keyboard: Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap: keep focus inside the modal
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { playClickSound(); onClose(); }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-sm bg-[#fffefc] dark:bg-[#161619] border-t-2 sm:border-2 border-zinc-900 dark:border-zinc-700 sm:rounded-xl shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#27272a] outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-zinc-900 dark:border-zinc-700">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-300 dark:bg-amber-400 border border-zinc-900">
              <Settings className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-zinc-900 dark:text-white tracking-tight">
                Preferences
              </h2>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Theme, layout & sound
              </p>
            </div>
          </div>
          <button
            onClick={() => { playClickSound(); onClose(); }}
            className="retro-btn p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-900 dark:border-zinc-700 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5">

          {/* — Theme — */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
              <Monitor className="w-3 h-3" />
              <span>Theme</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (isDark) onToggleTheme();
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-500'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (!isDark) onToggleTheme();
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 text-white border-zinc-500 shadow-[2px_2px_0px_0px_#27272a]'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-900'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* — Card Layout View — */}
          <div className="space-y-2 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
              <List className="w-3 h-3" />
              <span>Card Layout</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-zinc-900 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => { playClickSound(); onViewModeChange('condensed'); }}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'condensed'
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Compact list view"
              >
                <List className="w-3.5 h-3.5" />
                <span>Condensed</span>
              </button>
              <button
                type="button"
                onClick={() => { playClickSound(); onViewModeChange('detailed'); }}
                className={`flex items-center justify-center space-x-1.5 py-2 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'detailed'
                    ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Expanded card view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Detailed</span>
              </button>
            </div>
          </div>

          {/* — Sound — */}
          <div className="space-y-2 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5">
              <Volume2 className="w-3 h-3" />
              <span>Click Sounds</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { if (!soundOn) onToggleSound(); }}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                  soundOn
                    ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-500'
                }`}
              >
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>On</span>
              </button>
              <button
                type="button"
                onClick={() => { if (soundOn) onToggleSound(); }}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold border-2 transition-all cursor-pointer ${
                  !soundOn
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white border-zinc-900 dark:border-zinc-500 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-500'
                }`}
              >
                <VolumeX className="w-4 h-4 text-zinc-400" />
                <span>Off</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-5 pb-4">
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center">
            Preferences are saved locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
