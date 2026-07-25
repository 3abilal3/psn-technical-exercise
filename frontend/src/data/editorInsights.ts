import type { ChannelBreakdown, EditorInsight, FilterState, KpiMetrics, TypeSplit, VideoSummary } from '../types';
import {
  buildChannelInsightCopy,
  buildFormatInsightCopy,
  getFormatShare,
  type InsightBaseline,
} from './insightContext';
import { formatCompact } from '../utils/format';

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function buildEditorInsights(
  filters: FilterState,
  kpis: KpiMetrics,
  channelData: ChannelBreakdown[],
  typeSplit: TypeSplit[],
  highlightVideo: VideoSummary | undefined,
  baseline: InsightBaseline,
  searchQuery: string,
  highlightViewsLabel: string,
): EditorInsight[] {
  const search = searchQuery.trim();

  if (search && kpis.videoCount > 0) {
    const insights: EditorInsight[] = [
      {
        id: 'channel',
        tone: 'blue',
        title: `${kpis.videoCount} search ${kpis.videoCount === 1 ? 'match' : 'matches'}`,
        detail: `${formatCompact(kpis.totalViews)} views in range · ${formatCompact(kpis.totalLikes)} likes`,
      },
    ];

    if (highlightVideo) {
      const avg = kpis.avgViewsPerVideo;
      const timesAvg = avg > 0 ? (highlightVideo.total_views / avg).toFixed(1) : null;
      insights.push({
        id: 'highlight',
        tone: 'red',
        title: truncate(highlightVideo.title, 42),
        detail: timesAvg
          ? `${formatCompact(highlightVideo.total_views)} ${highlightViewsLabel} — ${timesAvg}× the average in your search results`
          : `${formatCompact(highlightVideo.total_views)} ${highlightViewsLabel}`,
      });
    }

    if (kpis.videoCount > 1) {
      const formatCopy = buildFormatInsightCopy(filters, getFormatShare(typeSplit), baseline, true);
      insights.push({
        id: 'format',
        tone: formatCopy.tone,
        title: formatCopy.title,
        detail: formatCopy.detail,
      });
    }

    return insights.slice(0, 3);
  }

  const avg = kpis.avgViewsPerVideo;
  const topViews = highlightVideo?.total_views ?? 0;
  const timesAvg = avg > 0 ? (topViews / avg).toFixed(1) : null;

  const insights: EditorInsight[] = [];

  const channelCopy = buildChannelInsightCopy(filters, channelData, kpis, baseline);
  if (channelCopy && kpis.videoCount > 0) {
    insights.push({
      id: 'channel',
      tone: 'blue',
      title: channelCopy.title,
      detail: channelCopy.detail,
    });
  }

  const formatCopy = buildFormatInsightCopy(
    filters,
    getFormatShare(typeSplit),
    baseline,
    kpis.videoCount > 0,
  );
  insights.push({
    id: 'format',
    tone: formatCopy.tone,
    title: formatCopy.title,
    detail: formatCopy.detail,
  });

  if (highlightVideo && timesAvg && kpis.videoCount > 0) {
    insights.push({
      id: 'highlight',
      tone: 'red',
      title: truncate(highlightVideo.title, 42),
      detail: `${formatCompact(topViews)} ${highlightViewsLabel}${timesAvg ? ` — roughly ${timesAvg}× your average video` : ''}`,
    });
  }

  return insights;
}
