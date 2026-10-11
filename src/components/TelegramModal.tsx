'use client';

import React, { useState } from 'react';
import { TelegramSettings } from '@/types';
import { X, Send, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface TelegramModalProps {
  settings: TelegramSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: TelegramSettings) => void;
}

export function TelegramModal({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
}: TelegramModalProps) {
  const [chatId, setChatId] = useState(settings.chatId || '');
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(
    settings.dailyReminderEnabled ?? true
  );
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      chatId: chatId.trim(),
      connected: Boolean(chatId.trim()),
      dailyReminderEnabled,
    });
    onClose();
  };

  const handleTestPing = async () => {
    if (!chatId.trim()) {
      setTestStatus('Please enter your Telegram Chat ID first.');
      return;
    }

    setTesting(true);
    setTestStatus(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('✓ Test message sent to your Telegram!');
      } else {
        setTestStatus(data.message || 'Failed to send test ping.');
      }
    } catch {
      setTestStatus('Network error while sending test ping.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="retro-box relative w-full max-w-lg rounded-xl bg-[#fffefc] dark:bg-zinc-950 p-6 sm:p-7 text-left">
        {/* Retro Window Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            <span className="ml-2 font-mono font-bold text-xs uppercase text-zinc-900 dark:text-zinc-200">
              TELEGRAM_SYNC.HTM
            </span>
          </div>

          <button
            onClick={onClose}
            className="retro-btn p-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="space-y-1 mb-4">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">
            Connect @WapasPadhleBot
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Receive morning digests with the concept cards due for revision today.
          </p>
        </div>

        {/* How to Connect Box */}
        <div className="rounded-lg bg-sky-50 dark:bg-sky-950/40 border-2 border-zinc-900 dark:border-zinc-700 p-3.5 space-y-2 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a]">
          <p className="font-bold text-sky-900 dark:text-sky-300 flex items-center space-x-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>HOW TO CONNECT (2 STEPS):</span>
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 font-mono text-xs leading-relaxed">
            <li>
              Open{' '}
              <a
                href="https://t.me/WapasPadhleBot"
                target="_blank"
                rel="noreferrer"
                className="retro-link"
              >
                @WapasPadhleBot
              </a>{' '}
              in Telegram and tap <strong>/start</strong>.
            </li>
            <li>
              The bot replies with your numeric <strong>Chat ID</strong>. Paste it below:
            </li>
          </ol>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              TELEGRAM CHAT ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 123456789"
                className="flex-1 px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:bg-yellow-50/50"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testing || !chatId.trim()}
                className={`retro-btn px-3.5 py-2 rounded-lg text-xs font-mono font-bold shrink-0 cursor-pointer ${
                  chatId.trim()
                    ? 'bg-amber-300 text-zinc-950 border-2 border-zinc-900'
                    : 'bg-zinc-200 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
              >
                {testing ? 'Pinging...' : 'Test Ping'}
              </button>
            </div>
            {testStatus && (
              <p
                className={`text-xs font-mono font-bold mt-1.5 ${
                  testStatus.startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {testStatus}
              </p>
            )}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700">
            <div>
              <p className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-white">Daily 8:00 AM Digest</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                Morning notifications signed with - Scale with Rai
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminderEnabled}
              onChange={(e) => setDailyReminderEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3.5 border-t-2 border-zinc-900 dark:border-zinc-700 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="retro-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="retro-btn flex items-center space-x-1.5 px-5 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
          >
            <span>Save Settings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
