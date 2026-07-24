import type { Post, PostStat } from '../types';

function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(current.trim());
      records.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    records.push(row);
  }

  return records;
}

function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseDataDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [day, month, year] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseCsv<T>(text: string, mapper: (row: Record<string, string>) => T): T[] {
  const records = parseCsvRecords(text.trim());
  const headers = records[0];

  return records.slice(1).flatMap((values) => {
    if (values.length === 1 && values[0] === '') return [];

    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return [mapper(row)];
  });
}

export async function loadPosts(): Promise<Post[]> {
  const response = await fetch('/posts.csv', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load posts.csv (${response.status})`);
  }
  const text = await response.text();
  return parseCsv(text, (row) => ({
    post_id: row.post_id,
    video_id: row.video_id,
    account_name: row.account_name,
    published_at_date: row.published_at_date,
    video_url: row.video_url,
    video_type: row.video_type as Post['video_type'],
    title: row.title,
    text: row.text,
    video_length: parseNumber(row.video_length),
    thumbnail_url: row.thumbnail_url,
  }));
}

export async function loadPoststats(): Promise<PostStat[]> {
  const response = await fetch('/poststats.csv', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load poststats.csv (${response.status})`);
  }
  const text = await response.text();
  return parseCsv(text, (row) => ({
    video_id: row.video_id,
    stat_date: parseDataDate(row.data_date),
    likes: parseNumber(row.likes),
    comments: parseNumber(row.comments),
    shares: parseNumber(row.shares),
    views: parseNumber(row.views),
    estimated_minutes_watched: parseNumber(row.watchtime),
  }));
}
