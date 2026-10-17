'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Brain,
  ExternalLink,
  Copy,
  Check,
  Compass,
  Video,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AddConceptModal } from '@/components/AddConceptModal';
import { TelegramModal } from '@/components/TelegramModal';
import {
  loadItems,
  loadReviews,
  loadTelegramSettings,
  saveNewItem,
  saveTelegramSettings,
} from '@/lib/storage';
import { getItemStatus } from '@/lib/sm2';
import { ConceptItem, ReviewRecord, TelegramSettings } from '@/types';
import { playClickSound, playMasteredChime } from '@/lib/sound';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

const subscribeToTheme = (callback: () => void) => {
  const observer = new MutationObserver(() => callback());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};

const getThemeSnapshot = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

const emptySubscribe = () => () => {};

export default function AuthorPage() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);
  const [copied, setCopied] = useState(false);

  const [items, setItems] = useState<ConceptItem[]>(() => loadItems());
  const [reviews] = useState<Record<string, ReviewRecord>>(() => loadReviews());
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(() =>
    loadTelegramSettings()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  const dueCount = items.filter((i) => {
    const status = getItemStatus(reviews[i.id]);
    return status === 'DUE_TODAY' || status === 'OVERDUE';
  }).length;

  const handleAddItem = (data: Omit<ConceptItem, 'id' | 'createdAt'>) => {
    const created = saveNewItem(data);
    setItems((prev) => [created, ...prev]);
  };

  const handleSaveTelegram = (updated: TelegramSettings) => {
    saveTelegramSettings(updated);
    setTelegramSettings(updated);
  };

  const toggleTheme = () => {
    playClickSound();
    const next = !isDark;
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wapas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wapas_theme', 'light');
    }
  };

  const handleCopyCode = () => {
    playMasteredChime();
    navigator.clipboard.writeText('WAPASPADHLE20');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const offerings = [
    {
      title: 'Discovery Call',
      url: 'https://topmate.io/arai_19999/2350229',
      tag: '15 Min Alignment',
      tagColor: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-2 border-zinc-900',
      icon: Compass,
      description:
        'A quick sync to discuss your career goals, identify preparation bottlenecks, and map out the right mentorship strategy.',
      cta: 'Book Discovery Call ➔',
    },
    {
      title: 'Video Call with Abhishek',
      url: 'https://topmate.io/arai_19999/2346816',
      tag: '1:1 Deep Dive Session',
      tagColor: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-200 border-2 border-zinc-900',
      icon: Video,
      description:
        'Comprehensive 1:1 mentoring covering Distributed Systems, DSA problem solving, resume revamp, or mock interview simulation.',
      cta: 'Book Video Call ➔',
    },
    {
      title: 'Succeed at Your Job',
      url: 'https://topmate.io/arai_19999/2350247',
      tag: 'Engineering Growth & Promotion',
      tagColor: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-2 border-zinc-900',
      icon: Briefcase,
      description:
        'Actionable playbook for navigating tech company dynamics, driving high-impact technical initiatives, and leveling up to Senior/Staff roles.',
      cta: 'Book Career Strategy Call ➔',
    },
    {
      title: 'Ask Me Anything over DM',
      url: 'https://topmate.io/arai_19999/2346802/',
      tag: 'Async Direct Query',
      tagColor: 'bg-rose-100 text-rose-950 dark:bg-rose-950 dark:text-rose-200 border-2 border-zinc-900',
      icon: MessageSquare,
      description:
        'Async direct messaging on Topmate. Ask about offer negotiation, architectural reviews, quick code feedback, or career direction.',
      cta: 'Send Direct Question ➔',
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8f6f0] dark:bg-[#111113] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-yellow-200 relative overflow-x-hidden">
      {/* Top Retro Navbar */}
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        telegramSettings={telegramSettings}
        dueCount={isMounted ? dueCount : undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 relative z-10">
        {/* Navigation Breadcrumb / Return Pill */}
        <div className="flex items-center justify-between gap-3 border-b-2 border-zinc-900 dark:border-zinc-700 pb-3">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="retro-btn flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&lt; Return to Study Deck</span>
          </Link>
          <div className="font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Author Profile
          </div>
        </div>

        {/* Retro Discount Window */}
        <section className="retro-box rounded-xl bg-amber-100 dark:bg-amber-950/40 p-5 sm:p-7 space-y-4">
          {/* Window Bar */}
          <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2.5 font-mono text-xs font-bold">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
              <span className="ml-1 text-zinc-900 dark:text-white uppercase font-bold tracking-wider">
                COUPON_CODE.TXT • 20% DISCOUNT
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 border border-zinc-900">
              SPECIAL OFFER
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Unlock 20% Off on All Topmate Offerings
              </h2>
              <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 max-w-xl leading-relaxed">
                Use code <strong className="font-mono text-zinc-950 dark:text-white bg-amber-200 dark:bg-amber-900 px-1 py-0.5 rounded border border-zinc-900">WAPASPADHLE20</strong> at checkout on any mentorship session, system design deep dive, or 1:1 call.
              </p>
            </div>

            {/* Code Box & 1-Click Copy */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 px-3.5 py-2 rounded-lg border-2 border-zinc-900 shadow-[2px_2px_0px_0px_#18181b]">
                <span className="font-mono font-black text-sm sm:text-base text-zinc-900 dark:text-white tracking-wider">
                  WAPASPADHLE20
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="retro-btn flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Hero Window */}
        <section className="retro-box rounded-xl bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6">
          {/* Window bar */}
          <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2.5 font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-zinc-900" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
              <span className="ml-1 text-zinc-900 dark:text-white uppercase font-bold tracking-wider">
                AUTHOR_PROFILE.HTM
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-900">
              SCALE WITH RAI
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Author Photo with Retro Bevel */}
            <div className="relative shrink-0">
              <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-xl overflow-hidden border-2 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#3f3f46] bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/abhishek-rai.jpg"
                  alt="Abhishek Rai speaking at India Eng Fest"
                  width={350}
                  height={350}
                  priority
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="mt-2 text-center">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-amber-300 text-zinc-950 border border-zinc-900 inline-block shadow-[2px_2px_0px_0px_#18181b]">
                  Abhishek Rai
                </span>
              </div>
            </div>

            {/* Author Details & Actions */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 border border-zinc-900">
                    [CREATOR & MENTOR]
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold">
                    @scale_with_rai
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Abhishek Rai
                </h1>
                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-lg font-mono">
                  Software Engineer @ Handshake AI | ex-Atlassian • Distributed Systems & DSA Mentor • Creator of Wapas Padhle
                </p>
              </div>

              {/* Quick Link Buttons with Retro Tactile Styling */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
                <a
                  href="https://topmate.io/arai_19999"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playClickSound()}
                  className="retro-btn flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Topmate Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playClickSound()}
                  className="retro-btn flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                >
                  <LinkedInIcon className="w-4 h-4 text-[#0077b5]" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-zinc-900 dark:border-zinc-700 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-3 font-mono">
            <p>
              Hi! I&apos;m Abhishek. I built <strong>Wapas Padhle</strong> to solve one of the most common
              frustrations engineers encounter during technical interview prep: <em>comprehension without retention</em>.
            </p>
            <p>
              We spend months solving hard DSA problems and reading distributed systems papers, only to
              blank out on subtle edge cases three weeks later. By adopting the <strong>SuperMemo SM-2 spaced repetition algorithm</strong>,
              Wapas Padhle ensures you rehearse concepts precisely when your brain is about to forget them.
            </p>
          </div>
        </section>

        {/* 1:1 Offerings Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-2">
            <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center space-x-2 font-mono uppercase">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Mentorship & Topmate Offerings</span>
            </h2>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-mono font-bold bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded border border-zinc-900">
              USE: WAPASPADHLE20
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerings.map((offering) => {
              const Icon = offering.icon;
              return (
                <div
                  key={offering.title}
                  className="retro-box rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900 flex flex-col justify-between gap-4 text-left"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${offering.tagColor}`}>
                        {offering.tag}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                      {offering.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono">
                      {offering.description}
                    </p>
                  </div>

                  <a
                    href={offering.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => playClickSound()}
                    className="retro-btn flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
                  >
                    <span>{offering.cta}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Philosophy of Scale with Rai */}
        <section className="retro-box rounded-xl bg-[#fffefb] dark:bg-zinc-950 p-6 sm:p-7 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-black text-zinc-900 dark:text-white font-mono uppercase">
            <Brain className="w-4 h-4 text-amber-500" />
            <span>The &quot;Scale with Rai&quot; Philosophy</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-mono">
            Engineering mastery comes from deliberate practice, rigorous invariant checking, and
            structured active recall. We discard superficial cramming and trendy hype, focusing exclusively on
            the mental models and engineering systems fundamentals that make engineers truly thrive.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-mono font-bold">
            <a
              href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="retro-link flex items-center space-x-1"
            >
              <LinkedInIcon className="w-3.5 h-3.5" />
              <span>LinkedIn Profile</span>
            </a>
            <a
              href="https://topmate.io/arai_19999"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="retro-link flex items-center space-x-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>TopMate (arai_19999)</span>
            </a>
            <a
              href="https://x.com/scale_with_rai"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="retro-link flex items-center space-x-1"
            >
              <span>Twitter / X (@scale_with_rai)</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Add Concept Modal */}
      {isAddModalOpen && (
        <AddConceptModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddItem}
        />
      )}

      {/* Telegram Modal */}
      {isTelegramModalOpen && (
        <TelegramModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          settings={telegramSettings}
          onSaveSettings={handleSaveTelegram}
        />
      )}
    </div>
  );
}
