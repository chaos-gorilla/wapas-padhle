'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ConceptItem } from '@/types';

interface AddConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ConceptItem, 'id' | 'createdAt'>) => void;
}

export function AddConceptModal({ isOpen, onClose, onAdd }: AddConceptModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('System Design');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onAdd({
      title: title.trim(),
      url: url.trim() || undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });

    setTitle('');
    setUrl('');
    setNotes('');
    setTagsInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="retro-box relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-[#fffefc] dark:bg-zinc-950 p-4 sm:p-7 text-left">
        {/* Retro Window Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            <span className="ml-2 font-mono font-bold text-xs uppercase text-zinc-900 dark:text-zinc-200">
              NEW_CONCEPT_CARD.HTM
            </span>
          </div>

          <button
            onClick={onClose}
            className="retro-btn p-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1">
          Add Concept to Queue
        </h3>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Add any topic, invariant, algorithm, system pattern, or mental model to revisit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              CONCEPT TITLE / NAME:
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Consistent Hashing or CAP Theorem"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:bg-yellow-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                CATEGORY:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="System Design">System Design</option>
                <option value="Architecture & Systems">Architecture & Systems</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mental Models">Mental Models</option>
                <option value="Learning Science">Learning Science</option>
                <option value="Database Internals">Database Internals</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                TAGS (COMMA-SEPARATED):
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="system-design, cache, ring"
                className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:bg-yellow-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              LINK / REFERENCE URL (OPTIONAL):
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/..."
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:bg-yellow-50/50"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              KEY INVARIANT / NOTES (OPTIONAL):
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="1-2 sentences on what to recall before flipping the card..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#fefce8] dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="retro-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="retro-btn px-5 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold bg-amber-300 hover:bg-amber-400 text-zinc-950 cursor-pointer"
            >
              + Save to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
