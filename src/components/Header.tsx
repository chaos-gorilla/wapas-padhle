'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Moon, Plus, Send, User } from 'lucide-react';
import { TelegramSettings } from '@/types';

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
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <Link href="/" className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
            Wapas Padhle
          </Link>
          <Link
            href="/author"
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            title="View Author Profile (Abhishek Rai)"
          >
            by Scale with Rai
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Add Concept Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>

          {/* Telegram Quick Trigger */}
          <button
            onClick={onOpenTelegramModal}
            title={telegramSettings.connected ? 'Telegram connected' : 'Connect Telegram'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Author Page Link */}
          <Link
            href="/author"
            title="Author: Abhishek Rai"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <User className="w-4 h-4" />
          </Link>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
