import type { Post, PostStat } from '../types';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv<T>(text: string, mapper: (row: Record<string, string>) => T): T[] {
  const lines = text.trim().split('\n');
  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return mapper(row);
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
    video_length: Number(row.video_length),
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
    stat_date: row.stat_date,
    likes: Number(row.likes),
    comments: Number(row.comments),
    shares: Number(row.shares),
    views: Number(row.views),
    estimated_minutes_watched: Number(row.estimated_minutes_watched),
  }));
}
