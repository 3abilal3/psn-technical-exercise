import type {
  ChannelBreakdown,
  EngagementPoint,
  FilterState,
  KpiMetrics,
  Post,
  PostStat,
  TypeSplit,
  VideoSummary,
  ViewsByTypeOverTime,
  ViewsPerVideo,
} from '../types';
import { REFERENCE_DATE } from '../types';

export function applyFilters(
  posts: Post[],
  poststats: PostStat[],
  filters: FilterState,
): { posts: Post[]; poststats: PostStat[] } {
  const filteredPosts = posts.filter((post) => {
    if (filters.account !== 'all' && post.account_name !== filters.account) return false;
    if (filters.videoType !== 'all' && post.video_type !== filters.videoType) return false;
    return true;
  });

  const videoIds = new Set(filteredPosts.map((p) => p.video_id));

  const filteredPoststats = poststats.filter((stat) => {
    if (!videoIds.has(stat.video_id)) return false;
    if (stat.stat_date < filters.dateFrom || stat.stat_date > filters.dateTo) return false;
    return true;
  });

  return { posts: filteredPosts, poststats: filteredPoststats };
}

export function buildVideoSummaries(posts: Post[], poststats: PostStat[]): VideoSummary[] {
  const statsByVideo = new Map<string, PostStat[]>();

  for (const stat of poststats) {
    const existing = statsByVideo.get(stat.video_id) ?? [];
    existing.push(stat);
    statsByVideo.set(stat.video_id, existing);
  }

  return posts.map((post) => {
    const stats = statsByVideo.get(post.video_id) ?? [];
    return {
      video_id: post.video_id,
      title: post.title,
      account_name: post.account_name,
      video_type: post.video_type,
      video_url: post.video_url,
      published_at_date: post.published_at_date,
      total_views: stats.reduce((sum, s) => sum + s.views, 0),
      total_likes: stats.reduce((sum, s) => sum + s.likes, 0),
      total_comments: stats.reduce((sum, s) => sum + s.comments, 0),
      total_shares: stats.reduce((sum, s) => sum + s.shares, 0),
      total_minutes_watched: stats.reduce((sum, s) => sum + s.estimated_minutes_watched, 0),
    };
  });
}

export function queryTotalViewsPerVideo(posts: Post[], poststats: PostStat[]): ViewsPerVideo[] {
  const summaries = buildVideoSummaries(posts, poststats);
  return summaries
    .map((s) => ({
      video_id: s.video_id,
      title: s.title,
      account_name: s.account_name,
      video_type: s.video_type,
      total_views: s.total_views,
    }))
    .sort((a, b) => b.total_views - a.total_views);
}

export function queryViewsByTypeOverTime(posts: Post[], poststats: PostStat[]): ViewsByTypeOverTime[] {
  const postTypeMap = new Map(posts.map((p) => [p.video_id, p.video_type]));
  const byDate = new Map<string, ViewsByTypeOverTime>();

  for (const stat of poststats) {
    const videoType = postTypeMap.get(stat.video_id);
    if (!videoType) continue;

    const row = byDate.get(stat.stat_date) ?? {
      stat_date: stat.stat_date,
      'Long Form': 0,
      'Short Form': 0,
    };

    if (videoType === 'Long Form') row['Long Form'] += stat.views;
    else row['Short Form'] += stat.views;

    byDate.set(stat.stat_date, row);
  }

  return [...byDate.values()].sort((a, b) => a.stat_date.localeCompare(b.stat_date));
}

export function queryTop5Last28Days(
  poststats: PostStat[],
  summaries: VideoSummary[],
): VideoSummary[] {
  const cutoff = subtractDays(REFERENCE_DATE, 28);
  const totals = new Map<string, number>();

  for (const stat of poststats) {
    if (stat.stat_date >= cutoff) {
      totals.set(stat.video_id, (totals.get(stat.video_id) ?? 0) + stat.views);
    }
  }

  const summaryMap = new Map(summaries.map((s) => [s.video_id, s]));

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([videoId, views]) => ({
      ...summaryMap.get(videoId)!,
      total_views: views,
    }));
}

export function buildEngagementOverTime(posts: Post[], poststats: PostStat[]): EngagementPoint[] {
  const videoIds = new Set(posts.map((p) => p.video_id));
  const byDate = new Map<string, EngagementPoint>();

  for (const stat of poststats) {
    if (!videoIds.has(stat.video_id)) continue;
    const row = byDate.get(stat.stat_date) ?? {
      stat_date: stat.stat_date,
      likes: 0,
      comments: 0,
      shares: 0,
    };
    row.likes += stat.likes;
    row.comments += stat.comments;
    row.shares += stat.shares;
    byDate.set(stat.stat_date, row);
  }

  return [...byDate.values()].sort((a, b) => a.stat_date.localeCompare(b.stat_date));
}

export function buildChannelBreakdown(posts: Post[], poststats: PostStat[]): ChannelBreakdown[] {
  const summaries = buildVideoSummaries(posts, poststats);
  const byChannel = new Map<string, number>();

  for (const s of summaries) {
    byChannel.set(s.account_name, (byChannel.get(s.account_name) ?? 0) + s.total_views);
  }

  return [...byChannel.entries()]
    .map(([account_name, views]) => ({ account_name, views }))
    .sort((a, b) => b.views - a.views);
}

export function buildTypeSplit(posts: Post[], poststats: PostStat[]): TypeSplit[] {
  const summaries = buildVideoSummaries(posts, poststats);
  let longForm = 0;
  let shortForm = 0;

  for (const s of summaries) {
    if (s.video_type === 'Long Form') longForm += s.total_views;
    else shortForm += s.total_views;
  }

  return [
    { name: 'Long Form', value: longForm, fill: '#e8a317' },
    { name: 'Short Form', value: shortForm, fill: '#2b7cd3' },
  ];
}

export function buildKpis(posts: Post[], poststats: PostStat[]): KpiMetrics {
  const summaries = buildVideoSummaries(posts, poststats);
  const totalViews = summaries.reduce((sum, s) => sum + s.total_views, 0);

  return {
    totalViews,
    totalLikes: summaries.reduce((sum, s) => sum + s.total_likes, 0),
    totalWatchMinutes: Math.round(summaries.reduce((sum, s) => sum + s.total_minutes_watched, 0)),
    videoCount: summaries.length,
    avgViewsPerVideo: summaries.length ? Math.round(totalViews / summaries.length) : 0,
  };
}

export function getAccounts(posts: Post[]): string[] {
  return [...new Set(posts.map((p) => p.account_name))].sort();
}

export function getVideoTypes(posts: Post[]): string[] {
  return [...new Set(posts.map((p) => p.video_type))].sort();
}

export function getDateBounds(poststats: PostStat[]): { min: string; max: string } {
  if (poststats.length === 0) return { min: REFERENCE_DATE, max: REFERENCE_DATE };
  const dates = poststats.map((s) => s.stat_date).sort();
  return { min: dates[0], max: dates[dates.length - 1] };
}

function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
