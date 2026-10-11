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
    <header className="border-b-2 border-zinc-900 dark:border-zinc-700 bg-[#fffefc] dark:bg-[#161619] sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-white flex items-center space-x-2"
          >
            <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold border border-zinc-900">
              ⚡ WP
            </span>
            <span>Wapas Padhle</span>
          </Link>

          <Link
            href="/author"
            onClick={() => playClickSound()}
            className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900 dark:border-zinc-700 hover:bg-yellow-200 dark:hover:bg-zinc-700 transition-colors hidden md:inline-flex items-center space-x-1"
            title="View Author Profile (Abhishek Rai)"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>by Scale with Rai</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Explicit "Connect Telegram" Button */}
          <button
            onClick={() => {
              playClickSound();
              onOpenTelegramModal();
            }}
            className={`retro-btn flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
              isConnected
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200'
                : 'bg-sky-100 dark:bg-sky-950 text-sky-950 dark:text-sky-200'
            }`}
            title="Set up daily spaced repetition reminders in Telegram"
          >
            <Send className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-sky-700 dark:text-sky-400'}`} />
            <span className="hidden sm:inline">
              {isConnected ? 'Telegram Active' : 'Connect Telegram'}
            </span>
            <span className="sm:hidden">
              {isConnected ? 'Alerts On' : 'Telegram'}
            </span>
            {isConnected ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900" />
            ) : (
              <span className="text-[10px] px-1 py-0.2 rounded bg-sky-300 dark:bg-sky-800 text-zinc-900 dark:text-zinc-100 hidden lg:inline font-mono font-bold">
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
            className="retro-btn flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Card</span>
          </button>

          {/* Sound click toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Click sounds enabled' : 'Click sounds muted'}
            aria-label="Toggle click sound"
            className="retro-btn p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
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
            className="retro-btn p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
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
            className="retro-btn p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
