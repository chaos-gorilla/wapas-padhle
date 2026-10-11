'use client';

import React, { useState } from 'react';
import { X, Send, ArrowRight, ShieldCheck } from 'lucide-react';
import { TelegramSettings } from '@/types';

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
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

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
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-xl text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Send className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Telegram Reminders
            </span>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Connect @WapasPadhleBot
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Get pinged daily at 8:00 AM with the patterns you need to revisit today.
          </p>
        </div>

        {/* What happens guidance */}
        <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>What happens when you connect?</span>
          </p>
          <ul className="space-y-1 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-300 pl-1">
            <li>• <strong>Daily 8:00 AM Digest:</strong> Receive a morning summary of concepts and systems due today.</li>
            <li>• <strong>Instant Active Recall:</strong> Review invariants and mark your recall straight from Telegram.</li>
            <li>• <strong>No Spam Guarantee:</strong> Only your personal spaced repetition prompts — nothing else.</li>
          </ul>
        </div>

        {/* Steps */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
          <p className="font-semibold text-zinc-900 dark:text-white flex items-center space-x-1.5">
            <span>Connect in 2 Easy Steps:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-[11px]">
            <li>
              Open{' '}
              <a
                href="https://t.me/WapasPadhleBot"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-semibold underline"
              >
                @WapasPadhleBot
              </a>{' '}
              on Telegram and tap <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-900 dark:text-white">/start</code>.
            </li>
            <li>
              Paste your numeric Telegram Chat ID below:
            </li>
          </ol>
        </div>

        {/* Input */}
        <div className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Your Telegram Chat ID
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 123456789"
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testing || !chatId.trim()}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  chatId.trim()
                    ? 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed'
                }`}
              >
                {testing ? 'Testing...' : 'Test Ping'}
              </button>
            </div>
            {testStatus && (
              <p
                className={`text-[11px] mt-1 ${
                  testStatus.startsWith('✓') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {testStatus}
              </p>
            )}
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xs font-medium text-zinc-900 dark:text-white">Daily 8:00 AM Digest</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                End every reminder with - Scale with Rai
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminderEnabled}
              onChange={(e) => setDailyReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1 px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            <span>Save Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
