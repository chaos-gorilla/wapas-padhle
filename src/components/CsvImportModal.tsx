'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Download,
  AlertTriangle,
  Trash2,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { ConceptItem, ReviewRecord } from '@/types';
import {
  parseCsvFileContent,
  downloadSampleCsv,
  MAX_CSV_UPLOAD_LIMIT,
  MAX_USER_TASK_LIMIT,
} from '@/lib/csv';
import { saveBatchItems, InitialScheduleMode } from '@/lib/storage';
import { playClickSound, playMasteredChime } from '@/lib/sound';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems: ConceptItem[];
  onImportSuccess: (createdItems: ConceptItem[], newReviews: Record<string, ReviewRecord>) => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  existingItems,
  onImportSuccess,
}: CsvImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState('System Design');
  const [defaultTagsInput, setDefaultTagsInput] = useState('');
  const [scheduleMode, setScheduleMode] = useState<InitialScheduleMode>('spread');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [deselectedRowIndices, setDeselectedRowIndices] = useState<Set<number>>(new Set());
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    setFileName('');
    setRawCsvText('');
    setErrorMsg(null);
    setDeselectedRowIndices(new Set());
    setExcludedRowIndices(new Set());
    onClose();
  };

  const parsedTags = useMemo(() => {
    return defaultTagsInput
      .split(/[,;#]/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
  }, [defaultTagsInput]);

  // Parse result computed from raw text + default overrides
  const parseResult = useMemo(() => {
    if (!rawCsvText) return null;
    return parseCsvFileContent(rawCsvText, existingItems, {
      defaultCategory,
      defaultTags: parsedTags.length > 0 ? parsedTags : undefined,
    });
  }, [rawCsvText, existingItems, defaultCategory, parsedTags]);

  if (!isOpen) return null;

  const currentTotalTasks = existingItems.length;
  const remainingTotalSlots = Math.max(0, MAX_USER_TASK_LIMIT - currentTotalTasks);

  // Active candidates within the 50 rows cap
  const candidateRows = parseResult
    ? parseResult.rows
        .slice(0, MAX_CSV_UPLOAD_LIMIT)
        .filter(
          (r) =>
            r.isValid &&
            !excludedRowIndices.has(r.index) &&
            (!skipDuplicates || !r.isDuplicate)
        )
    : [];

  // Rows that are currently selected for import
  const rowsToImport = candidateRows.filter((r) => !deselectedRowIndices.has(r.index));

  const wouldExceedTotalCap = currentTotalTasks + rowsToImport.length > MAX_USER_TASK_LIMIT;

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'text/plain') {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || !text.trim()) {
        setErrorMsg('The selected CSV file is empty.');
        return;
      }
      setRawCsvText(text);
      playClickSound();
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleToggleRow = (index: number) => {
    playClickSound();
    setDeselectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    playClickSound();
    setExcludedRowIndices((prev) => new Set(prev).add(index));
  };

  const handleToggleSelectAll = () => {
    playClickSound();
    if (rowsToImport.length === candidateRows.length) {
      setDeselectedRowIndices(new Set(candidateRows.map((r) => r.index)));
    } else {
      setDeselectedRowIndices(new Set());
    }
  };

  const handleSubmitImport = () => {
    if (rowsToImport.length === 0) {
      setErrorMsg('No valid tasks selected for import.');
      return;
    }

    if (rowsToImport.length > MAX_CSV_UPLOAD_LIMIT) {
      setErrorMsg(`Cannot import more than ${MAX_CSV_UPLOAD_LIMIT} tasks per upload.`);
      return;
    }

    if (wouldExceedTotalCap) {
      setErrorMsg(
        `Importing ${rowsToImport.length} tasks exceeds your limit of ${MAX_USER_TASK_LIMIT} total tasks (${currentTotalTasks} current, ${remainingTotalSlots} remaining slots).`
      );
      return;
    }

    const payload = rowsToImport.map((r) => ({
      title: r.title,
      category: r.category || defaultCategory || 'System Design',
      tags: r.tags && r.tags.length > 0 ? r.tags : parsedTags.length > 0 ? parsedTags : undefined,
      url: r.url || undefined,
      notes: r.notes || undefined,
    }));

    const result = saveBatchItems(payload, scheduleMode);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to save tasks.');
      return;
    }

    playMasteredChime();
    onImportSuccess(result.items, result.reviews);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="retro-box relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl bg-[#fffefc] dark:bg-zinc-950 p-4 sm:p-6 text-left flex flex-col space-y-4">
        {/* Retro Window Title Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 dark:border-zinc-700 pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-zinc-900" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-zinc-900" />
            <span className="ml-2 font-mono font-bold text-xs uppercase text-zinc-900 dark:text-zinc-200">
              CSV_BATCH_INGESTION_TOOLING.EXE
            </span>
          </div>

          <button
            onClick={handleClose}
            className="retro-btn p-1 rounded bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header & Limits Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center space-x-2">
              <span>Drop CSV to Create Tasks</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-300 dark:bg-amber-400 text-zinc-950 font-mono font-bold border border-zinc-900">
                BATCH IMPORT
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Bulk-upload up to 50 cards at once from any spreadsheet or exported study list.
            </p>
          </div>

          {/* User Limits Counter Badge */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-900 dark:border-zinc-700 text-xs font-mono">
              <span className="text-zinc-500 dark:text-zinc-400">Total Cards: </span>
              <strong className="text-zinc-900 dark:text-white">
                {currentTotalTasks} / {MAX_USER_TASK_LIMIT}
              </strong>
              <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                ({remainingTotalSlots} free)
              </span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="retro-box p-3 rounded-lg bg-rose-100 dark:bg-rose-950/50 border-2 border-rose-900 text-rose-950 dark:text-rose-200 text-xs sm:text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 dark:text-rose-400" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* Dropzone & File Input Section */}
        {!rawCsvText ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-3 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.01]'
                : 'border-zinc-900 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-yellow-50/40 dark:hover:bg-zinc-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <UploadCloud className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono">
              Drag &amp; drop your CSV file here, or click to browse
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Supports standard column names: <code className="font-bold">Title</code>,{' '}
              <code className="font-bold">Category</code>, <code className="font-bold">Tags</code>,{' '}
              <code className="font-bold">URL</code>, and <code className="font-bold">Notes</code>
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs font-mono px-2 py-1 bg-zinc-200 dark:bg-zinc-800 rounded border border-zinc-900 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                Max 50 tasks per upload
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  downloadSampleCsv();
                }}
                className="retro-btn inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          </div>
        ) : (
          /* File Loaded & Configuration Section */
          <div className="space-y-4">
            {/* File info bar */}
            <div className="retro-box p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {fileName}
                </span>
                {parseResult && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-bold shrink-0">
                    {parseResult.validRows.length} task{parseResult.validRows.length !== 1 ? 's' : ''} parsed
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    downloadSampleCsv();
                  }}
                  className="retro-btn px-2.5 py-1 text-xs font-mono font-bold rounded bg-white dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center space-x-1"
                >
                  <Download className="w-3 h-3 text-amber-500" />
                  <span>Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setRawCsvText('');
                    setFileName('');
                  }}
                  className="retro-btn px-2.5 py-1 text-xs font-mono font-bold rounded bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-900 flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Change File</span>
                </button>
              </div>
            </div>

            {/* Over 50 Rows Cap Warning Banner */}
            {parseResult && parseResult.exceedsUploadLimit && (
              <div className="retro-box p-3 rounded-lg bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-900 text-amber-950 dark:text-amber-200 text-xs sm:text-sm flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
                <div>
                  <strong className="font-bold">Upload Cap Active: </strong>
                  Your file contains {parseResult.validRows.length} tasks. To maintain fast recall, each upload is capped at {MAX_CSV_UPLOAD_LIMIT} tasks. The first {MAX_CSV_UPLOAD_LIMIT} tasks have been pre-selected below.
                </div>
              </div>
            )}

            {/* Default Task Details Fallbacks & Schedule Settings */}
            <div className="retro-box p-4 rounded-xl bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-700 space-y-3.5">
              <div className="flex items-center space-x-2 pb-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white uppercase tracking-wider">
                  Default Task Details &amp; Spacing Rules
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Default Category */}
                <div>
                  <label className="block font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    DEFAULT CATEGORY:
                  </label>
                  <select
                    value={defaultCategory}
                    onChange={(e) => setDefaultCategory(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="System Design">System Design</option>
                    <option value="Architecture & Systems">Architecture & Systems</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mental Models">Mental Models</option>
                    <option value="Learning Science">Learning Science</option>
                    <option value="Database Internals">Database Internals</option>
                    <option value="Distributed Systems">Distributed Systems</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Applies when row category is empty.
                  </span>
                </div>

                {/* Default Tags */}
                <div>
                  <label className="block font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    DEFAULT TAGS (COMMA-SEPARATED):
                  </label>
                  <input
                    type="text"
                    value={defaultTagsInput}
                    onChange={(e) => setDefaultTagsInput(e.target.value)}
                    placeholder="e.g. sprint-1, core-review"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Applies when row tags are empty.
                  </span>
                </div>

                {/* Initial Schedule Strategy */}
                <div>
                  <label className="block font-mono font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    INITIAL RECALL SCHEDULE:
                  </label>
                  <select
                    value={scheduleMode}
                    onChange={(e) => setScheduleMode(e.target.value as InitialScheduleMode)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white focus:outline-none font-bold"
                  >
                    <option value="spread">📅 Spread Over 3-5 Days (Smooth)</option>
                    <option value="today">⏰ All Due Today (Immediate)</option>
                    <option value="new">📚 Unscheduled / New Cards</option>
                  </select>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {scheduleMode === 'spread'
                      ? 'Spreads reviews to prevent daily burnout.'
                      : scheduleMode === 'today'
                      ? 'All items become due immediately.'
                      : 'Saved in library without review schedule.'}
                  </span>
                </div>
              </div>

              {/* Duplicate Handling Toggle */}
              {parseResult && parseResult.duplicateCount > 0 && (
                <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>
                      Found <strong className="text-amber-600 dark:text-amber-400">{parseResult.duplicateCount}</strong> duplicate task{parseResult.duplicateCount !== 1 ? 's' : ''} already in your collection.
                    </span>
                  </div>
                  <label className="flex items-center space-x-1.5 text-xs font-mono font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => {
                        playClickSound();
                        setSkipDuplicates(e.target.checked);
                      }}
                      className="rounded border-zinc-900"
                    />
                    <span>Skip duplicates</span>
                  </label>
                </div>
              )}
            </div>

            {/* Live Table Preview */}
            {parseResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-bold text-zinc-900 dark:text-white">
                      PREVIEW &amp; SELECTION ({rowsToImport.length} of{' '}
                      {Math.min(parseResult.validRows.length, MAX_CSV_UPLOAD_LIMIT)} selected)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {rowsToImport.length === candidateRows.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="retro-box overflow-hidden rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 border-b-2 border-zinc-900 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 z-10">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center">#</th>
                          <th className="py-2 px-3">Title / Task</th>
                          <th className="py-2 px-3 w-32">Category</th>
                          <th className="py-2 px-3 w-32">Tags</th>
                          <th className="py-2 px-3 w-40">Notes / Invariant</th>
                          <th className="py-2 px-2 w-10 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {parseResult.rows
                          .slice(0, MAX_CSV_UPLOAD_LIMIT)
                          .map((row) => {
                            const isExcluded = excludedRowIndices.has(row.index);
                            if (isExcluded) return null;

                            const isSelected = !deselectedRowIndices.has(row.index);
                            const isDuplicateSkipped = skipDuplicates && row.isDuplicate;

                            return (
                              <tr
                                key={row.index}
                                className={`transition-colors ${
                                  !row.isValid
                                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-900'
                                    : isDuplicateSkipped
                                    ? 'opacity-40 bg-zinc-50 dark:bg-zinc-950'
                                    : isSelected
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                }`}
                              >
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={!row.isValid || isDuplicateSkipped}
                                    checked={isSelected && !isDuplicateSkipped}
                                    onChange={() => handleToggleRow(row.index)}
                                    className="cursor-pointer"
                                  />
                                </td>

                                <td className="py-2 px-3">
                                  <div className="font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                                    <span>{row.title || <em className="text-rose-500 font-normal">Empty Title (Invalid)</em>}</span>
                                    {row.isDuplicate && (
                                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 border border-zinc-900">
                                        Duplicate
                                      </span>
                                    )}
                                  </div>
                                  {row.url && (
                                    <a
                                      href={row.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-0.5 truncate max-w-xs"
                                    >
                                      <span className="truncate">{row.url}</span>
                                      <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                                    </a>
                                  )}
                                </td>

                                <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px]">
                                    {row.category}
                                  </span>
                                </td>

                                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                                  {row.tags?.map((t) => (
                                    <span
                                      key={t}
                                      className="inline-block text-[10px] px-1 rounded bg-zinc-100 dark:bg-zinc-800 mr-1 mb-0.5 border border-zinc-300 dark:border-zinc-700"
                                    >
                                      #{t}
                                    </span>
                                  )) || '-'}
                                </td>

                                <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 text-[11px] truncate max-w-[160px]">
                                  {row.notes || '-'}
                                </td>

                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(row.index)}
                                    title="Exclude from import"
                                    className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t-2 border-zinc-900 dark:border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {rowsToImport.length > 0 ? (
              <span>
                Ready to create{' '}
                <strong className="text-zinc-900 dark:text-white">{rowsToImport.length}</strong>{' '}
                task{rowsToImport.length !== 1 ? 's' : ''} in your queue.
              </span>
            ) : (
              <span>Select or drop a CSV file with up to 50 tasks to begin.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className="retro-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>

            {rawCsvText && (
              <button
                type="button"
                disabled={rowsToImport.length === 0 || wouldExceedTotalCap}
                onClick={handleSubmitImport}
                className={`retro-btn px-5 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold cursor-pointer transition-all ${
                  rowsToImport.length > 0 && !wouldExceedTotalCap
                    ? 'bg-amber-300 hover:bg-amber-400 text-zinc-950 dark:bg-amber-400 shadow-[2px_2px_0px_0px_#18181b]'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border-zinc-400'
                }`}
              >
                + Create {rowsToImport.length} Task{rowsToImport.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
