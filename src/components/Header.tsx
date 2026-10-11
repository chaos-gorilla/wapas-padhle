'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sun, Moon, Plus, Send, User, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { TelegramSettings } from '@/types';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '@/lib/sound';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenTelegramModal: () => void;
  telegramSettings: TelegramSettings;
}

export function Header({
  isDark,
  onToggleTheme,
  onOpenAddModal,
  onOpenTelegramModal,
  telegramSettings,
}: HeaderProps) {
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const isConnected = telegramSettings.connected && Boolean(telegramSettings.chatId);

  return (
    <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="font-bold text-base tracking-tight text-zinc-900 dark:text-white flex items-center space-x-1.5"
          >
            <span>Wapas Padhle</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Link>
          <Link
            href="/author"
            onClick={() => playClickSound()}
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors hidden md:inline-flex items-center space-x-1"
            title="View Author Profile (Abhishek Rai)"
          >
            <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
            <span>by Scale with Rai</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Explicit "Connect Telegram" Button */}
          <button
            onClick={() => {
              playClickSound();
              onOpenTelegramModal();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 ${
              isConnected
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60'
                : 'bg-sky-50/80 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80 hover:bg-sky-100/80 dark:hover:bg-sky-950/50 shadow-2xs'
            }`}
            title="Set up daily spaced repetition reminders in Telegram"
          >
            <Send className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500' : 'text-sky-500'}`} />
            <span className="hidden sm:inline">
              {isConnected ? 'Telegram Active' : 'Connect Telegram'}
            </span>
            <span className="sm:hidden">
              {isConnected ? 'Alerts On' : 'Telegram'}
            </span>
            {isConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="text-[10px] px-1 rounded bg-sky-200/70 dark:bg-sky-900 text-sky-800 dark:text-sky-200 hidden lg:inline">
                Daily Pings
              </span>
            )}
          </button>

          {/* Add Concept Button */}
          <button
            onClick={() => {
              playClickSound();
              onOpenAddModal();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>

          {/* Sound click toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Click sounds enabled' : 'Click sounds muted'}
            aria-label="Toggle click sound"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95"
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* Author Page Link */}
          <Link
            href="/author"
            onClick={() => playClickSound()}
            title="Author: Abhishek Rai (Scale with Rai)"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={() => {
              playClickSound();
              onToggleTheme();
            }}
            aria-label="Toggle theme"
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
