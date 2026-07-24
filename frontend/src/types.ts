export type QueryId = 'q1' | 'q2' | 'q3';

export interface QueryDefinition {
  id: QueryId;
  title: string;
  subtitle: string;
  sqlLabel: string;
}

export const QUERIES: QueryDefinition[] = [
  {
    id: 'q1',
    title: 'Views by video',
    subtitle: 'Lifetime totals from daily stats',
    sqlLabel: 'GROUP BY video',
  },
  {
    id: 'q2',
    title: 'Views by format',
    subtitle: 'Long Form and Shorts, day by day',
    sqlLabel: 'GROUP BY date, type',
  },
  {
    id: 'q3',
    title: 'Top 5 · last 28 days',
    subtitle: 'Highest view counts in the window',
    sqlLabel: 'WHERE date >= -28d',
  },
];

export interface FilterState {
  account: string;
  videoType: string;
  dateFrom: string;
  dateTo: string;
}

export interface Post {
  post_id: string;
  video_id: string;
  account_name: string;
  published_at_date: string;
  video_url: string;
  video_type: 'Long Form' | 'Shorts';
  title: string;
  text: string;
  video_length: number;
  thumbnail_url: string;
}

export interface PostStat {
  video_id: string;
  stat_date: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  estimated_minutes_watched: number;
}

export interface VideoSummary {
  video_id: string;
  title: string;
  account_name: string;
  video_type: string;
  video_url: string;
  published_at_date: string;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_minutes_watched: number;
}

export interface ViewsByTypeOverTime {
  stat_date: string;
  'Long Form': number;
  Shorts: number;
}

export interface ViewsPerVideo {
  video_id: string;
  title: string;
  account_name: string;
  video_type: string;
  total_views: number;
}

export interface EngagementPoint {
  stat_date: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface ChannelBreakdown {
  account_name: string;
  views: number;
}

export interface TypeSplit {
  name: string;
  value: number;
  fill: string;
}

export interface KpiMetrics {
  totalViews: number;
  totalLikes: number;
  totalWatchMinutes: number;
  videoCount: number;
  channelCount: number;
  avgViewsPerVideo: number;
}

export type SortField = 'total_views' | 'total_likes' | 'title' | 'published_at_date';
export type SortDirection = 'asc' | 'desc';

export const REFERENCE_DATE = '2026-01-25';
