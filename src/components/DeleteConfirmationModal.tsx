'use client';

import React, { useEffect } from 'react';
import { ConceptItem } from '@/types';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { playClickSound } from '@/lib/sound';

interface DeleteConfirmationModalProps {
  item: ConceptItem | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  item,
  isOpen,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        playClickSound();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => {
        playClickSound();
        onCancel();
      }}
    >
      <div
        className="retro-box relative w-full max-w-md rounded-xl bg-[#fffefc] dark:bg-zinc-950 p-4 sm:p-6 text-left border-2 border-zinc-900 dark:border-zinc-700 shadow-[6px_6px_0px_0px_#18181b] dark:shadow-[6px_6px_0px_0px_#000000]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        {/* Retro Window Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            <span className="ml-2 font-mono font-bold text-xs uppercase text-zinc-900 dark:text-zinc-200">
              CONFIRM_DELETE.EXE
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            className="retro-btn p-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer border border-zinc-900 dark:border-zinc-700"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Icon & Heading */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-900 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="delete-dialog-title"
              className="text-base sm:text-lg font-black text-zinc-900 dark:text-white leading-tight"
            >
              Delete Task from Queue?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Are you sure you want to delete this task from the queue? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Target Item Details Snippet */}
        <div className="p-3 my-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.category && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-zinc-900 dark:text-amber-200 border border-zinc-900 dark:border-zinc-700">
                {item.category}
              </span>
            )}
            {item.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-400 dark:border-zinc-600"
              >
                #{tag}
              </span>
            ))}
          </div>
          <p className="font-bold text-sm text-zinc-900 dark:text-white break-words line-clamp-2">
            {item.title}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onCancel();
            }}
            className="retro-btn px-4 py-2 rounded-lg text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onConfirm();
            }}
            className="retro-btn px-4 py-2 rounded-lg text-xs font-mono font-bold bg-rose-500 hover:bg-rose-600 text-white border-2 border-zinc-900 cursor-pointer flex items-center space-x-1.5 shadow-[2px_2px_0px_0px_#18181b]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
