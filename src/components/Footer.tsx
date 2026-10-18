import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t-2 border-zinc-900 dark:border-zinc-700 bg-[#fffefc] dark:bg-[#161619] mt-auto py-6 sm:py-8 transition-colors">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs font-mono text-zinc-600 dark:text-zinc-400 gap-3 sm:gap-4">
        <p className="break-words">
          Built with ❤️ and love, by{' '}
          <Link
            href="/author"
            className="retro-link font-bold text-zinc-900 dark:text-white inline-block"
          >
            Scale with Rai
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 font-bold">
          <Link
            href="/"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            Study
          </Link>
          <Link
            href="/analytics"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            Analytics
          </Link>
          <Link
            href="/author"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            Author Profile
          </Link>
          <a
            href="https://topmate.io/arai_19999"
            target="_blank"
            rel="noreferrer"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            TopMate (1:1)
          </a>
          <a
            href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
            target="_blank"
            rel="noreferrer"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            LinkedIn
          </a>
          <a
            href="https://t.me/WapasPadhleBot"
            target="_blank"
            rel="noreferrer"
            className="retro-link text-zinc-800 dark:text-zinc-200"
          >
            @WapasPadhleBot
          </a>
        </div>
      </div>
    </footer>
  );
}
