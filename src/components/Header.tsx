'use client';

import React, { useState, useEffect } from 'react';
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
  UploadCloud,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { TelegramSettings } from '@/types';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '@/lib/sound';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddModal?: () => void;
  onOpenCsvModal?: () => void;
  onOpenTelegramModal?: () => void;
  telegramSettings?: TelegramSettings;
  dueCount?: number;
}

export function Header({
  isDark,
  onToggleTheme,
  onOpenAddModal,
  onOpenCsvModal,
  onOpenTelegramModal,
  telegramSettings,
  dueCount,
}: HeaderProps) {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand + Primary Nav */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 shrink">
          <Link
            href="/"
            onClick={() => {
              playClickSound();
              setIsMobileMenuOpen(false);
            }}
            className="font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 dark:text-white flex items-center space-x-1.5 sm:space-x-2 min-w-0"
          >
            <span className="font-mono text-xs sm:text-sm px-1.5 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold border border-zinc-900 shrink-0">
              ⚡ WP
            </span>
            <span className="truncate text-sm sm:text-lg">Wapas Padhle</span>
          </Link>

          {/* Desktop Navigation Tabs (Hidden on mobile) */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5">
            <Link
              href="/"
              onClick={() => playClickSound()}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                pathname === '/'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Study</span>
            </Link>

            <Link
              href="/analytics"
              onClick={() => playClickSound()}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all relative ${
                pathname === '/analytics'
                  ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
              {typeof dueCount === 'number' && dueCount > 0 && (
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold ml-1">
                  {dueCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Desktop Author Pill */}
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

        {/* Desktop Actions (Hidden on mobile) */}
        <div className="hidden md:flex items-center space-x-1.5 shrink-0">
          {/* Telegram Button */}
          {onOpenTelegramModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenTelegramModal();
              }}
              className={`retro-btn flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer shrink-0 ${
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
              <span>{isConnected ? 'Telegram Active' : 'Connect Telegram'}</span>
              {isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 border border-zinc-900" />
              )}
            </button>
          )}

          {/* Import CSV Button */}
          {onOpenCsvModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenCsvModal();
              }}
              className="retro-btn flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer shrink-0 border border-zinc-900 dark:border-zinc-700"
              title="Bulk import tasks from a CSV file"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV</span>
            </button>
          )}

          {/* Add Concept Button */}
          {onOpenAddModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenAddModal();
              }}
              className="retro-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Card</span>
            </button>
          )}

          {/* Sound click toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Click sounds enabled' : 'Click sounds muted'}
            aria-label="Toggle click sound"
            className="retro-btn p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0"
          >
            {soundOn ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {/* Author Page Link */}
          <Link
            href="/author"
            onClick={() => playClickSound()}
            title="Author: Abhishek Rai (Scale with Rai)"
            className={`retro-btn p-1.5 rounded-lg cursor-pointer shrink-0 ${
              pathname === '/author'
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
          </Link>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={() => {
              playClickSound();
              onToggleTheme();
            }}
            aria-label="Toggle theme"
            className="retro-btn p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Mobile Header Controls (Visible only on < md) */}
        <div className="flex md:hidden items-center space-x-1.5 shrink-0">
          {/* Quick Add Button on Mobile */}
          {onOpenAddModal && (
            <button
              onClick={() => {
                playClickSound();
                onOpenAddModal();
              }}
              className="retro-btn flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950 cursor-pointer shrink-0"
              title="Add Card"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add</span>
            </button>
          )}

          {/* Quick Theme Toggle on Mobile */}
          <button
            onClick={() => {
              playClickSound();
              onToggleTheme();
            }}
            aria-label="Toggle theme"
            className="retro-btn p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer shrink-0"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Mobile Hamburger / Close Menu Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className={`retro-btn relative p-1.5 rounded-lg cursor-pointer transition-colors shrink-0 ${
              isMobileMenuOpen
                ? 'bg-amber-300 dark:bg-amber-400 text-zinc-950'
                : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
            {/* Notification dot on mobile menu button if due count exists */}
            {!isMobileMenuOpen && typeof dueCount === 'number' && dueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-zinc-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Dropdown Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-14 bg-black/50 backdrop-blur-xs z-30 md:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Menu Container */}
          <div
            className="relative z-40 md:hidden border-t-2 border-zinc-900 dark:border-zinc-700 bg-[#fffefc] dark:bg-[#161619] px-4 py-4 space-y-4 max-h-[calc(100vh-3.5rem)] overflow-y-auto shadow-2xl"
          >
            {/* Primary Navigation Section */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 px-1">
                Navigation
              </div>

              {/* Study Deck Link */}
              <Link
                href="/"
                onClick={() => {
                  playClickSound();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all ${
                  pathname === '/'
                    ? 'border-zinc-900 dark:border-zinc-700 bg-amber-300 dark:bg-amber-400 text-zinc-950 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-900/30 dark:border-zinc-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm leading-tight">Study Deck</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Spaced repetition queue & cards
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              {/* Analytics Link */}
              <Link
                href="/analytics"
                onClick={() => {
                  playClickSound();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all ${
                  pathname === '/analytics'
                    ? 'border-zinc-900 dark:border-zinc-700 bg-amber-300 dark:bg-amber-400 text-zinc-950 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-900/30 dark:border-zinc-700">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                      <span>Analytics & Mastery</span>
                      {typeof dueCount === 'number' && dueCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold">
                          {dueCount} due
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Retention stats, difficulty & heatmaps
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>

              {/* Author & Mentorship Link */}
              <Link
                href="/author"
                onClick={() => {
                  playClickSound();
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all ${
                  pathname === '/author'
                    ? 'border-zinc-900 dark:border-zinc-700 bg-amber-300 dark:bg-amber-400 text-zinc-950 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-zinc-900 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-900/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                      <span>Scale with Rai</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 text-[10px] font-mono font-bold border border-zinc-900">
                        20% OFF
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      By Abhishek Rai • Mentorship & System Design
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </Link>
            </div>

            {/* Quick Actions Section */}
            {(onOpenAddModal || onOpenCsvModal || onOpenTelegramModal) && (
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 px-1">
                  Actions
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Add Card Action */}
                  {onOpenAddModal && (
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsMobileMenuOpen(false);
                        onOpenAddModal();
                      }}
                      className="retro-btn w-full flex items-center justify-between p-2.5 rounded-lg bg-amber-300 dark:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add New Concept Card</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-500 border border-zinc-900">
                        + NEW
                      </span>
                    </button>
                  )}

                  {/* CSV Import Action */}
                  {onOpenCsvModal && (
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsMobileMenuOpen(false);
                        onOpenCsvModal();
                      }}
                      className="retro-btn w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Bulk Import Tasks (CSV)</span>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-900">
                        IMPORT
                      </span>
                    </button>
                  )}

                  {/* Telegram Setup Action */}
                  {onOpenTelegramModal && (
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsMobileMenuOpen(false);
                        onOpenTelegramModal();
                      }}
                      className={`retro-btn w-full flex items-center justify-between p-2.5 rounded-lg font-bold text-xs sm:text-sm cursor-pointer ${
                        isConnected
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200'
                          : 'bg-sky-100 dark:bg-sky-950 text-sky-950 dark:text-sky-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Send
                          className={`w-4 h-4 ${
                            isConnected
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-sky-700 dark:text-sky-400'
                          }`}
                        />
                        <span>
                          {isConnected ? 'Telegram Daily Alerts' : 'Connect Telegram Alerts'}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded border border-zinc-900 flex items-center gap-1 ${
                          isConnected
                            ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-white'
                            : 'bg-sky-200 dark:bg-sky-800 text-sky-950 dark:text-white'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            ACTIVE
                          </>
                        ) : (
                          'SETUP'
                        )}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Settings & Toggles Row */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 px-1 mb-2">
                Preferences
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Sound Click Toggle */}
                <button
                  onClick={toggleSound}
                  className="retro-btn flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold cursor-pointer"
                >
                  {soundOn ? (
                    <>
                      <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Sound: ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-zinc-400" />
                      <span>Sound: OFF</span>
                    </>
                  )}
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => {
                    playClickSound();
                    onToggleTheme();
                  }}
                  className="retro-btn flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs font-bold cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Mode: Dark</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4" />
                      <span>Mode: Light</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Retro Signature Footer */}
            <div className="pt-1 text-center font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
              ⚡ WP • Spaced Repetition Engine • Abhishek Rai
            </div>
          </div>
        </>
      )}
    </header>
  );
}
