import type { FilterState, Post, PostStat, VideoSummary } from '../types';
import { applyFilters, buildVideoSummaries } from '../data/processData';

export interface FilterHint {
  tone: 'info' | 'warn';
  title: string;
  detail: string;
}

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

export function matchesSearch(row: VideoSummary, query: string): boolean {
  const q = normalise(query);
  if (!q) return true;

  const haystack = `${row.title} ${row.account_name}`.toLowerCase();
  if (haystack.includes(q)) return true;

  const words = q.split(/\s+/).filter((word) => word.length >= 3);
  if (words.length === 0) return haystack.includes(q);

  return words.every((word) => haystack.includes(word));
}

export function filterBySearch(rows: VideoSummary[], query: string): VideoSummary[] {
  const q = query.trim();
  if (!q) return rows;
  return rows.filter((row) => matchesSearch(row, q));
}

function describeFilters(filters: FilterState): string {
  const parts: string[] = [];
  if (filters.account !== 'all') parts.push(filters.account);
  if (filters.videoType !== 'all') parts.push(filters.videoType);
  return parts.length > 0 ? parts.join(' · ') : 'your filters';
}

export function buildFilterHint(
  posts: Post[],
  poststats: PostStat[],
  filters: FilterState,
  searchQuery: string,
  filteredRows: VideoSummary[],
  searchRows: VideoSummary[],
): FilterHint | null {
  const search = searchQuery.trim();

  if (search && filteredRows.length > 0 && searchRows.length === 0) {
    return {
      tone: 'info',
      title: 'No search matches',
      detail: `Nothing matches "${search}" in ${filteredRows.length.toLocaleString('en-GB')} videos that match ${describeFilters(filters)}. Try fewer words or clear the search box.`,
    };
  }

  if (search && searchRows.length > 0 && searchRows.length < filteredRows.length) {
    return {
      tone: 'info',
      title: 'Search active',
      detail: `${searchRows.length.toLocaleString('en-GB')} video${searchRows.length === 1 ? '' : 's'} match your search — KPIs and insights below reflect those results only.`,
    };
  }

  if (filteredRows.length > 0) return null;

  const dateScoped = applyFilters(posts, poststats, {
    account: 'all',
    videoType: 'all',
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
  const dateSummaries = buildVideoSummaries(dateScoped.posts, dateScoped.poststats);

  if (search) {
    const searchMatches = filterBySearch(dateSummaries, search);
    if (searchMatches.length === 0) {
      return {
        tone: 'warn',
        title: 'No videos found',
        detail: `No titles in this date range match "${search}". Check spelling or reset filters.`,
      };
    }

    const match = searchMatches[0];
    const conflicts: string[] = [];

    if (filters.videoType !== 'all' && match.video_type !== filters.videoType) {
      conflicts.push(`change video type to "${match.video_type}"`);
    }
    if (filters.account !== 'all' && match.account_name !== filters.account) {
      conflicts.push(`switch channel to "${match.account_name}"`);
    }

    if (conflicts.length > 0) {
      return {
        tone: 'warn',
        title: 'Filters are hiding your search result',
        detail: `"${match.title}" is ${match.video_type} on ${match.account_name}. ${conflicts.map((item) => item.charAt(0).toUpperCase() + item.slice(1)).join(' and ')}.`,
      };
    }
  }

  if (filters.videoType !== 'all' || filters.account !== 'all') {
    return {
      tone: 'warn',
      title: 'Nothing in view',
      detail: `No videos match ${describeFilters(filters)} in this date range. Try Reset or widen the dates.`,
    };
  }

  return {
    tone: 'warn',
    title: 'Nothing in view',
    detail: 'No videos match your current date range. Try Reset or widen the dates.',
  };
}

export function kpisFromSummaries(rows: VideoSummary[]) {
  const totalViews = rows.reduce((sum, row) => sum + row.total_views, 0);
  return {
    totalViews,
    totalLikes: rows.reduce((sum, row) => sum + row.total_likes, 0),
    totalWatchMinutes: Math.round(rows.reduce((sum, row) => sum + row.total_minutes_watched, 0)),
    videoCount: rows.length,
    channelCount: new Set(rows.map((row) => row.account_name)).size,
    avgViewsPerVideo: rows.length ? Math.round(totalViews / rows.length) : 0,
  };
}

export function breakdownFromSummaries(rows: VideoSummary[]) {
  const channelMap = new Map<string, number>();
  let longForm = 0;
  let shorts = 0;

  for (const row of rows) {
    channelMap.set(row.account_name, (channelMap.get(row.account_name) ?? 0) + row.total_views);
    if (row.video_type === 'Long Form') longForm += row.total_views;
    else shorts += row.total_views;
  }

  return {
    channelData: [...channelMap.entries()]
      .map(([account_name, views]) => ({ account_name, views }))
      .sort((a, b) => b.views - a.views),
    typeSplit: [
      { name: 'Long Form', value: longForm, fill: '#e8a317' },
      { name: 'Shorts', value: shorts, fill: '#2b7cd3' },
    ],
  };
}
