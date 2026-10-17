import type { ConceptItem } from '@/types';

export interface ParsedCsvRow {
  index: number;
  raw: Record<string, string>;
  title: string;
  category?: string;
  tags?: string[];
  url?: string;
  notes?: string;
  isValid: boolean;
  isDuplicate?: boolean;
  error?: string;
}

export interface CsvParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  totalRows: number;
  validRows: ParsedCsvRow[];
  duplicateCount: number;
  exceedsUploadLimit: boolean;
  uploadLimit: number;
  columnMapping: {
    titleKey?: string;
    categoryKey?: string;
    tagsKey?: string;
    urlKey?: string;
    notesKey?: string;
  };
}

export const MAX_CSV_UPLOAD_LIMIT = 50;
export const MAX_USER_TASK_LIMIT = 1000;

/**
 * Standard column aliases for intelligent auto-mapping
 */
const ALIASES: Record<string, string[]> = {
  title: ['title', 'name', 'concept', 'task', 'topic', 'concept title', 'task name', 'card'],
  category: ['category', 'cat', 'type', 'subject', 'domain', 'topic area'],
  tags: ['tags', 'tag', 'labels', 'label', 'keywords'],
  url: ['url', 'link', 'href', 'reference', 'doc', 'documentation', 'source'],
  notes: ['notes', 'note', 'takeaway', 'invariant', 'description', 'summary', 'detail', 'details', 'memo'],
};

/**
 * Parses raw CSV/TSV text into an array of string arrays,
 * properly handling quotes, escaped quotes, and newlines inside quoted fields.
 */
export function parseRawCsvText(text: string): string[][] {
  // Strip UTF-8 BOM if present
  const cleanText = text.replace(/^\uFEFF/, '');
  if (!cleanText.trim()) return [];

  // Detect delimiter (comma vs semicolon vs tab) from first non-empty line
  const firstLine = cleanText.split(/\r\n|\n|\r/)[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < cleanText.length) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes && char === delimiter) {
      currentRow.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    }

    if (!insideQuotes && (char === '\r' || char === '\n')) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      currentField = '';
      // Only push non-empty rows
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push remaining field & row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Finds matching column header from alias list
 */
function findMatchingHeader(headers: string[], aliases: string[]): string | undefined {
  const normalized = headers.map((h) => h.toLowerCase().trim().replace(/[-_]/g, ' '));
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx !== -1) return headers[idx];
  }
  // Try partial match
  for (const alias of aliases) {
    const idx = normalized.findIndex((h) => h.includes(alias));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

/**
 * Parses tags string (comma, semicolon, or hash separated) into string[]
 */
export function parseTagsString(raw?: string): string[] | undefined {
  if (!raw) return undefined;
  const tags = raw
    .split(/[,;#]/)
    .map((t) => t.trim().replace(/^#/, ''))
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
}

/**
 * Parse CSV and validate against existing concepts
 */
export function parseCsvFileContent(
  csvContent: string,
  existingItems: ConceptItem[] = [],
  defaults?: { defaultCategory?: string; defaultTags?: string[] }
): CsvParseResult {
  const table = parseRawCsvText(csvContent);

  if (table.length === 0) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      validRows: [],
      duplicateCount: 0,
      exceedsUploadLimit: false,
      uploadLimit: MAX_CSV_UPLOAD_LIMIT,
      columnMapping: {},
    };
  }

  // Determine if first row is header or data
  const rawHeaders = table[0];
  const titleHeader = findMatchingHeader(rawHeaders, ALIASES.title);
  const categoryHeader = findMatchingHeader(rawHeaders, ALIASES.category);
  const tagsHeader = findMatchingHeader(rawHeaders, ALIASES.tags);
  const urlHeader = findMatchingHeader(rawHeaders, ALIASES.url);
  const notesHeader = findMatchingHeader(rawHeaders, ALIASES.notes);

  const hasHeaderRow = Boolean(titleHeader || categoryHeader || tagsHeader || urlHeader || notesHeader);

  let headers: string[] = [];
  let dataRows: string[][] = [];

  if (hasHeaderRow) {
    headers = rawHeaders;
    dataRows = table.slice(1);
  } else {
    // If no recognizable headers, assume positional:
    // [0] = title, [1] = category, [2] = tags, [3] = url, [4] = notes
    headers = ['title', 'category', 'tags', 'url', 'notes'];
    dataRows = table;
  }

  const columnMapping = {
    titleKey: titleHeader || headers[0],
    categoryKey: categoryHeader || headers[1],
    tagsKey: tagsHeader || headers[2],
    urlKey: urlHeader || headers[3],
    notesKey: notesHeader || headers[4],
  };

  const existingTitles = new Set(
    existingItems.map((item) => item.title.toLowerCase().trim())
  );

  const seenInBatch = new Set<string>();

  const rows: ParsedCsvRow[] = dataRows.map((rowValues, index) => {
    const raw: Record<string, string> = {};
    headers.forEach((h, colIdx) => {
      raw[h] = rowValues[colIdx] || '';
    });

    const title = (
      columnMapping.titleKey ? raw[columnMapping.titleKey] : rowValues[0]
    )?.trim() || '';

    const categoryRaw = (
      columnMapping.categoryKey ? raw[columnMapping.categoryKey] : rowValues[1]
    )?.trim();
    const category = categoryRaw || defaults?.defaultCategory || 'System Design';

    const tagsRaw = (
      columnMapping.tagsKey ? raw[columnMapping.tagsKey] : rowValues[2]
    )?.trim();
    const parsedRowTags = parseTagsString(tagsRaw);
    const tags = parsedRowTags || (defaults?.defaultTags && defaults.defaultTags.length > 0 ? defaults.defaultTags : undefined);

    const urlRaw = (
      columnMapping.urlKey ? raw[columnMapping.urlKey] : rowValues[3]
    )?.trim();
    const url = urlRaw && (urlRaw.startsWith('http://') || urlRaw.startsWith('https://'))
      ? urlRaw
      : urlRaw ? `https://${urlRaw}` : undefined;

    const notesRaw = (
      columnMapping.notesKey ? raw[columnMapping.notesKey] : rowValues[4]
    )?.trim();
    const notes = notesRaw || undefined;

    const isValid = Boolean(title.length > 0);
    let error: string | undefined;

    if (!isValid) {
      error = 'Missing task/concept title';
    }

    const lowerTitle = title.toLowerCase();
    const isDuplicate = existingTitles.has(lowerTitle) || seenInBatch.has(lowerTitle);
    if (isValid && !isDuplicate) {
      seenInBatch.add(lowerTitle);
    }

    return {
      index: index + 1,
      raw,
      title,
      category,
      tags,
      url,
      notes,
      isValid,
      isDuplicate,
      error,
    };
  });

  const validRows = rows.filter((r) => r.isValid);
  const duplicateCount = validRows.filter((r) => r.isDuplicate).length;
  const exceedsUploadLimit = validRows.length > MAX_CSV_UPLOAD_LIMIT;

  return {
    headers,
    rows,
    totalRows: rows.length,
    validRows,
    duplicateCount,
    exceedsUploadLimit,
    uploadLimit: MAX_CSV_UPLOAD_LIMIT,
    columnMapping,
  };
}

/**
 * Generates sample CSV string for instant user download
 */
export function generateSampleCsv(): string {
  return [
    'Title,Category,Tags,URL,Notes',
    '"Consistent Hashing","System Design","distributed-systems,cache,hash-ring","https://en.wikipedia.org/wiki/Consistent_hashing","Minimizes key remapping when nodes are added or removed using virtual nodes."',
    '"Raft Consensus Algorithm","Architecture & Systems","distributed-systems,consensus,raft","https://raft.github.io","Decomposes consensus into leader election, log replication, and commitment safety."',
    '"Bloom Filter Invariant","Computer Science","probabilistic,cache,algorithms","https://en.wikipedia.org/wiki/Bloom_filter","False positives are possible; false negatives are impossible. Elements cannot easily be removed without counting variant."',
    '"Two Generals Problem","Distributed Systems","consensus,fault-tolerance,theory","https://en.wikipedia.org/wiki/Two_Generals%27_Problem","Proves that two generals cannot reach guaranteed consensus over an unreliable communication channel."',
  ].join('\r\n');
}

/**
 * Initiates browser download of the sample CSV
 */
export function downloadSampleCsv(): void {
  if (typeof window === 'undefined') return;
  const csvContent = generateSampleCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'wapas_padhle_tasks_sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
