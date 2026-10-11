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
  Sun,
  Moon,
  Copy,
  Check,
  Compass,
  Video,
  Briefcase,
  MessageSquare,
  Gift,
} from 'lucide-react';
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

export default function AuthorPage() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);
  const [copied, setCopied] = useState(false);

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
      tagColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
      icon: Compass,
      description:
        'A quick sync to discuss your career goals, identify preparation bottlenecks, and map out the right mentorship strategy.',
      cta: 'Book Discovery Call',
    },
    {
      title: 'Video Call with Abhishek',
      url: 'https://topmate.io/arai_19999/2346816',
      tag: '1:1 Deep Dive Session',
      tagColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60',
      icon: Video,
      description:
        'Comprehensive 1:1 mentoring covering Distributed Systems, DSA problem solving, resume revamp, or mock interview simulation.',
      cta: 'Book Video Call',
    },
    {
      title: 'Succeed at Your Job',
      url: 'https://topmate.io/arai_19999/2350247',
      tag: 'Engineering Growth & Promotion',
      tagColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/60',
      icon: Briefcase,
      description:
        'Actionable playbook for navigating tech company dynamics, driving high-impact technical initiatives, and leveling up to Senior/Staff roles.',
      cta: 'Book Career Strategy Call',
    },
    {
      title: 'Ask Me Anything over DM',
      url: 'https://topmate.io/arai_19999/2346802/',
      tag: 'Async Direct Query',
      tagColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
      icon: MessageSquare,
      description:
        'Async direct messaging on Topmate. Ask about offer negotiation, architectural reviews, quick code feedback, or career direction.',
      cta: 'Send Direct Question',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20 relative overflow-hidden">
      {/* Calm ambient background breathing aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 right-1/4 w-[600px] h-[350px] bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] rounded-full blur-[140px] animate-calm-pulse" />
        <div className="absolute bottom-20 left-10 w-[500px] h-[350px] bg-indigo-500/[0.03] dark:bg-indigo-500/[0.04] rounded-full blur-[130px]" />
      </div>

      {/* Top Navbar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Wapas Padhle</span>
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 relative z-10">
        {/* Captivating Discount Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-300/80 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/15 dark:from-emerald-950/40 dark:via-zinc-900/60 dark:to-emerald-950/30 p-6 sm:p-7 shadow-sm transition-all">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/60 dark:border-emerald-700/60">
                <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Special Learner Discount • 20% OFF</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                Unlock 20% Off on All Topmate Offerings
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
                Use code <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">WAPASPADHLE20</span> at checkout on any mentorship session, system design deep dive, or 1:1 call.
              </p>
            </div>

            {/* Code Box & 1-Click Copy */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              <div className="flex items-center space-x-2 bg-white dark:bg-zinc-950 px-4 py-2.5 rounded-2xl border border-emerald-300 dark:border-emerald-800/80 shadow-xs">
                <span className="font-mono font-bold text-sm sm:text-base text-zinc-900 dark:text-white tracking-wider">
                  WAPASPADHLE20
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Hero Card */}
        <section className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Prominent Author Photo */}
            <div className="relative shrink-0 group">
              <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-3xl overflow-hidden border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-md ring-4 ring-emerald-500/10 dark:ring-emerald-500/20 bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/abhishek-rai.jpg"
                  alt="Abhishek Rai speaking at India Eng Fest"
                  width={350}
                  height={350}
                  priority
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-zinc-900/90 dark:bg-zinc-950/90 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full border border-zinc-700/60 shadow-xs flex items-center space-x-1.5 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>That&apos;s me!</span>
              </div>
            </div>

            {/* Author Details & Actions */}
            <div className="flex-1 space-y-3.5 text-center md:text-left">
              <div className="space-y-2">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                    Creator & Mentor
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    Scale with Rai
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Abhishek Rai
                </h1>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg">
                  Software Engineer @ Handshake AI | ex-Atlassian • Distributed Systems & DSA Mentor • Creator of Wapas Padhle
                </p>
              </div>

              {/* Quick Link Buttons */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-1">
                <a
                  href="https://topmate.io/arai_19999"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playClickSound()}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Topmate Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>

                <a
                  href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playClickSound()}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
                >
                  <LinkedInIcon className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed space-y-3">
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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Mentorship & Topmate Offerings</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">
              Use code WAPASPADHLE20
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offerings.map((offering) => {
              const Icon = offering.icon;
              return (
                <div
                  key={offering.title}
                  className="group relative p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-emerald-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-150 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${offering.tagColor}`}>
                        {offering.tag}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {offering.title}
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {offering.description}
                    </p>
                  </div>

                  <a
                    href={offering.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => playClickSound()}
                    className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 active:scale-[0.98] transition-all shadow-2xs group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 dark:group-hover:text-white"
                  >
                    <span>{offering.cta}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Philosophy of Scale with Rai */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/30 p-6 sm:p-7 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-zinc-900 dark:text-white">
            <Brain className="w-4 h-4 text-emerald-500" />
            <span>The &quot;Scale with Rai&quot; Philosophy</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Engineering mastery comes from deliberate practice, rigorous invariant checking, and
            structured active recall. We discard superficial cramming and trendy hype, focusing exclusively on
            the mental models and engineering systems fundamentals that make engineers truly thrive.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-medium">
            <a
              href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <LinkedInIcon className="w-3.5 h-3.5" />
              <span>LinkedIn Profile</span>
            </a>
            <a
              href="https://topmate.io/arai_19999"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>TopMate (arai_19999)</span>
            </a>
            <a
              href="https://x.com/scale_with_rai"
              target="_blank"
              rel="noreferrer"
              onClick={() => playClickSound()}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>Twitter / X (@scale_with_rai)</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 mt-auto py-6 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-3">
          <p>Built with ❤️ by Abhishek Rai • Scale with Rai.</p>
          <Link
            href="/"
            onClick={() => playClickSound()}
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Return to Wapas Padhle →
          </Link>
        </div>
      </footer>
    </div>
  );
}
