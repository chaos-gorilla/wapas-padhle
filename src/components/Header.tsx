'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Plus,
  Send,
  User,
  Volume2,
  VolumeX,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react';
import { TelegramSettings } from '@/types';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '@/lib/sound';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddModal?: () => void;
  onOpenTelegramModal?: () => void;
  telegramSettings?: TelegramSettings;
  dueCount?: number;
}

export function Header({
  isDark,
  onToggleTheme,
  onOpenAddModal,
  onOpenTelegramModal,
  telegramSettings,
  dueCount,
}: HeaderProps) {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playClickSound();
  };

  const isConnected =
    Boolean(telegramSettings?.connected) && Boolean(telegramSettings?.chatId);

  return (
    <header className="w-full border-b-2 border-zinc-900 dark:border-zinc-700 bg-[#fffefc] dark:bg-[#161619] sticky top-0 z-30 transition-colors">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand + Primary Nav */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 shrink">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 dark:text-white flex items-center space-x-1.5 sm:space-x-2 min-w-0"
          >
            <span className="font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold border border-zinc-900 shrink-0">
              ⚡ WP
            </span>
            <span className="truncate text-sm sm:text-lg hidden xs:inline">Wapas Padhle</span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <Link
              href="/"
              onClick={() => playClickSound()}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                pathname === '/'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Study</span>
            </Link>

            <Link
              href="/analytics"
              onClick={() => playClickSound()}
              className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all relative ${
                pathname === '/analytics'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Analytics</span>
              {typeof dueCount === 'number' && dueCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse ml-0.5" />
              )}
            </Link>
          </nav>

          <Link
            href="/author"
            onClick={() => playClickSound()}
            className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900 dark:border-zinc-700 hover:bg-yellow-200 dark:hover:bg-zinc-700 transition-colors hidden xl:inline-flex items-center space-x-1 shrink-0"
            title="View Author Profile (Abhishek Rai)"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>by Scale with Rai</span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Telegram Button */}
          {onOpenTelegramModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenTelegramModal();
              }}
              className={`retro-btn flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${
                isConnected
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200'
                  : 'bg-sky-100 dark:bg-sky-950 text-sky-950 dark:text-sky-200'
              }`}
              title="Set up daily spaced repetition reminders in Telegram"
            >
              <Send
                className={`w-3.5 h-3.5 ${
                  isConnected
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-sky-700 dark:text-sky-400'
                }`}
              />
              <span className="hidden md:inline">
                {isConnected ? 'Telegram Active' : 'Connect Telegram'}
              </span>
              <span className="hidden sm:inline md:hidden">
                {isConnected ? 'Alerts On' : 'Telegram'}
              </span>
              {isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 border border-zinc-900" />
              )}
            </button>
          )}

          {/* Add Concept Button */}
          {onOpenAddModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenAddModal();
              }}
              className="retro-btn flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span>Add<span className="hidden sm:inline"> Card</span></span>
            </button>
          )}

          {/* Sound click toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Click sounds enabled' : 'Click sounds muted'}
            aria-label="Toggle click sound"
            className="retro-btn p-1.5 sm:p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0"
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            )}
          </button>

          {/* Author Page Link */}
          <Link
            href="/author"
            onClick={() => playClickSound()}
            title="Author: Abhishek Rai (Scale with Rai)"
            className={`retro-btn p-1.5 sm:p-2 rounded-lg cursor-pointer shrink-0 ${
              pathname === '/author'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={() => {
              playClickSound();
              onToggleTheme();
            }}
            aria-label="Toggle theme"
            className="retro-btn p-1.5 sm:p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
