'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Brain,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';

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

export default function AuthorPage() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next = !isDark;
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wapas_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wapas_theme', 'light');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wapas Padhle</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Profile Hero Card */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                  Creator & Engineer
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  Scale with Rai
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Abhishek Rai
              </h1>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Software Engineer @ Handshake AI | ex-Atlassian • Technical Mentor • Builder
              </p>
            </div>

            {/* Quick Link Buttons */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <a
                href="https://topmate.io/arai_19999"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book 1:1 on TopMate</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <a
                href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <LinkedInIcon className="w-3.5 h-3.5 text-[#0077b5]" />
                <span>Connect on LinkedIn</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-3">
            <p>
              Hi! I&apos;m Abhishek. I built <strong>Wapas Padhle</strong> to solve one of the most common
              challenges engineers face during interview preparation: <em>comprehension without retention</em>.
            </p>
            <p>
              We often solve dozens of problems or read complex distributed systems patterns, only to
              blank out on edge cases 3 weeks later. Wapas Padhle uses the <strong>SuperMemo SM-2 spaced repetition scheduler</strong> to
              automate your revision cycle so you recall core invariants instinctively.
            </p>
          </div>
        </section>

        {/* Mentorship & TopMate Section */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>1:1 Mentorship & Sessions</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  DSA & System Design Guidance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  1:1 Call
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Personalized roadmap to crack top tech company interviews, structuring active recall,
                and mastering high-frequency patterns.
              </p>
              <a
                href="https://topmate.io/arai_19999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
              >
                <span>Book on TopMate</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Resume & Career Strategy
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Review
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Actionable feedback on resume tailoring, impactful project positioning, and navigating
                engineering interview loops.
              </p>
              <a
                href="https://topmate.io/arai_19999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
              >
                <span>Book on TopMate</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* Philosophy of Scale with Rai */}
        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-900 dark:text-white">
            <Brain className="w-4 h-4 text-emerald-500" />
            <span>The &quot;Scale with Rai&quot; Philosophy</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Engineering excellence comes from deliberate practice, strong conceptual clarity, and
            structured recall. We avoid superficial cramming and bloated hype, focusing exclusively on
            what makes software engineers consistently succeed.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium">
            <a
              href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <LinkedInIcon className="w-3.5 h-3.5" />
              <span>LinkedIn Profile</span>
            </a>
            <a
              href="https://topmate.io/arai_19999"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>TopMate (arai_19999)</span>
            </a>
            <a
              href="https://x.com/scale_with_rai"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Twitter / X (@scale_with_rai)</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 mt-auto py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-3">
          <p>A free developer utility built by Abhishek Rai • Scale with Rai.</p>
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            Return to Wapas Padhle →
          </Link>
        </div>
      </footer>
    </div>
  );
}
