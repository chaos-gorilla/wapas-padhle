import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 mt-auto py-8 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-3">
        <p>
          A free developer utility built by{' '}
          <Link
            href="/author"
            className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-2 transition-colors"
          >
            Abhishek Rai • Scale with Rai
          </Link>
          .
        </p>
        <div className="flex items-center space-x-4">
          <Link
            href="/author"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Author & Mentorship
          </Link>
          <a
            href="https://topmate.io/arai_19999"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            TopMate (1:1)
          </a>
          <a
            href="https://www.linkedin.com/in/abhishek-rai-atlassian/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://t.me/WapasPadhleBot"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            @WapasPadhleBot
          </a>
        </div>
      </div>
    </footer>
  );
}
