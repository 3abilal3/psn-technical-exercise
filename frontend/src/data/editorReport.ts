import type {
  AssistantContext,
  EditorRecommendation,
  EditorReport,
  MomentumInsight,
  WatchListItem,
} from '../types';
import {
  buildFormatSummaryLine,
  buildHeadline,
  canCompareChannels,
  canCompareFormats,
  channelShare,
  getFormatShare,
} from './insightContext';
import { formatCompact, formatDateRange } from '../utils/format';

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function sumViewsForDays(
  trend: AssistantContext['viewsTrend'],
  fromIndex: number,
  toIndex: number,
): number {
  let total = 0;
  for (let index = fromIndex; index <= toIndex; index += 1) {
    const row = trend[index];
    if (!row) continue;
    total += row['Long Form'] + row.Shorts;
  }
  return total;
}

function buildMomentum(trend: AssistantContext['viewsTrend']): MomentumInsight | null {
  if (trend.length < 14) return null;

  const recent = sumViewsForDays(trend, trend.length - 7, trend.length - 1);
  const prior = sumViewsForDays(trend, trend.length - 14, trend.length - 8);
  if (prior === 0) return null;

  const change = Math.round(((recent - prior) / prior) * 100);
  if (Math.abs(change) < 3) {
    return { direction: 'flat', percent: 0, label: 'Viewership held steady week on week' };
  }

  if (change > 0) {
    return {
      direction: 'up',
      percent: change,
      label: `Views up ${change}% in the last 7 days vs the week before`,
    };
  }

  return {
    direction: 'down',
    percent: Math.abs(change),
    label: `Views down ${Math.abs(change)}% in the last 7 days vs the week before`,
  };
}

function buildWatchList(ctx: AssistantContext): WatchListItem[] {
  const avg = ctx.kpis.avgViewsPerVideo;

  return ctx.top28.slice(0, 3).map((video, index) => {
    const timesAvg = avg > 0 ? video.total_views / avg : 0;
    let reason = 'Strong recent pickup in the 28-day window';

    if (timesAvg >= 3) {
      reason = `${timesAvg.toFixed(1)}× above your average — study the hook and thumbnail`;
    } else if (video.video_type === 'Shorts') {
      reason = 'Short-form momentum — worth reposting or cutting a follow-up clip';
    } else if (index === 0) {
      reason = 'Clear #1 in the last 28 days — analyse pacing and title pattern';
    }

    return {
      rank: index + 1,
      title: truncate(video.title, 52),
      channel: video.account_name,
      views: video.total_views,
      reason,
    };
  });
}

function buildRecommendations(ctx: AssistantContext): EditorRecommendation[] {
  const { kpis, channelData, typeSplit, top28, filters, baseline } = ctx;
  const recs: EditorRecommendation[] = [];
  const inView = getFormatShare(typeSplit);
  const topChannel = channelData[0];
  const secondChannel = channelData[1];
  const hotVideo = top28[0];

  if (canCompareFormats(filters) && topChannel) {
    if (inView.shortsPct >= inView.longPct) {
      recs.push({
        id: 'shorts-focus',
        priority: 'high',
        title: 'Prioritise Shorts on your strongest channel',
        detail: `Shorts are ${inView.shortsPct}% of views in this window. Schedule 2–3 Shorts on ${topChannel.account_name} this week — they are outperforming long form right now.`,
      });
    } else {
      recs.push({
        id: 'longform-focus',
        priority: 'high',
        title: 'Lead with long-form depth',
        detail: `Long form is ${inView.longPct}% of views. Plan one flagship piece on ${topChannel.account_name} — deep dives are beating quick clips in your filters.`,
      });
    }
  } else if (filters.videoType !== 'all' && topChannel) {
    const label = filters.videoType === 'Shorts' ? 'Shorts' : 'long-form pieces';
    if (!canCompareChannels(filters, kpis.channelCount) && filters.account !== 'all') {
      recs.push({
        id: 'scoped-format',
        priority: 'high',
        title: `Plan the next ${filters.videoType} on ${filters.account}`,
        detail: `You're viewing ${filters.account} ${label} only. Use the watch list below — replicate hooks from your top 28-day performers.`,
      });
    } else {
      recs.push({
        id: 'scoped-format',
        priority: 'high',
        title: `Double down on ${filters.videoType} at ${topChannel.account_name}`,
        detail: `You're viewing ${label} only. ${topChannel.account_name} has the most ${filters.videoType.toLowerCase()} views in this filter — model your next upload on what's working there.`,
      });
    }
  } else if (topChannel && kpis.avgViewsPerVideo > 0) {
    recs.push({
      id: 'top-channel',
      priority: 'high',
      title: `Lead with ${topChannel.account_name}`,
      detail: `${topChannel.account_name} has ${formatCompact(topChannel.views)} views in your current selection — prioritise that channel in your next publishing slot.`,
    });
  }

  if (
    canCompareChannels(filters, kpis.channelCount) &&
    topChannel &&
    secondChannel
  ) {
    const share = channelShare(topChannel.views, kpis.totalViews);
    if (share >= 35) {
      recs.push({
        id: 'cross-promote',
        priority: 'medium',
        title: 'Spread reach across channels',
        detail: `${topChannel.account_name} holds ${share}% of views. Cross-promote ${secondChannel.account_name} in end screens or community posts to balance the portfolio.`,
      });
    }
  } else if (filters.account !== 'all' && canCompareFormats(filters)) {
    const baselineShare = getFormatShare(baseline.typeSplit);
    const winner = baselineShare.shortsPct >= baselineShare.longPct ? 'Shorts' : 'long form';
    recs.push({
      id: 'channel-format-mix',
      priority: 'medium',
      title: `Mix formats on ${filters.account}`,
      detail: `Across all channels in this period, ${winner} lead (${Math.max(baselineShare.shortsPct, baselineShare.longPct)}% of views). Try balancing ${filters.account}'s next uploads across both formats.`,
    });
  }

  if (hotVideo) {
    recs.push({
      id: 'replicate-winner',
      priority: 'high',
      title: 'Replicate what is working',
      detail: `"${truncate(hotVideo.title, 48)}" is your top 28-day video. Break down its title length, opening 30 seconds, and format (${hotVideo.video_type}) for the next upload brief.`,
    });
  }

  const weakest = channelData[channelData.length - 1];
  if (weakest && channelData.length >= 3 && canCompareChannels(filters, kpis.channelCount)) {
    const weakestShare = channelShare(weakest.views, kpis.totalViews);
    if (weakestShare <= 8) {
      recs.push({
        id: 'lift-underperformer',
        priority: 'medium',
        title: `Review ${weakest.account_name} packaging`,
        detail: `${weakest.account_name} is only ${weakestShare}% of views in range. Audit thumbnails and publish times before adding volume.`,
      });
    }
  }

  if (recs.length < 3 && kpis.avgViewsPerVideo > 0) {
    recs.push({
      id: 'benchmark',
      priority: 'medium',
      title: 'Use your average as a bar',
      detail: `Videos above ${formatCompact(kpis.avgViewsPerVideo)} views are beating the mean — tag them in your CMS and compare hooks side by side.`,
    });
  }

  return recs.slice(0, 3);
}

export function generateEditorReport(ctx: AssistantContext): EditorReport {
  const { kpis, channelData, typeSplit, top28, filters, baseline, filterHint } = ctx;
  const range = formatDateRange(filters.dateFrom, filters.dateTo);
  const topChannel = channelData[0];
  const inView = getFormatShare(typeSplit);
  const hotVideo = top28[0];
  const rising = top28[1];
  const momentum = buildMomentum(ctx.viewsTrend);

  if (kpis.videoCount === 0) {
    return {
      headline: 'No videos match your current filters',
      summary: [
        `Between ${range}, nothing in your selection matches the active filters${ctx.searchQuery.trim() ? ' or search' : ''}.`,
        filterHint ?? 'Try Reset, change video type or channel, or use fewer search words.',
      ],
      recommendations: [
        {
          id: 'clear-filters',
          priority: 'high',
          title: 'Clear conflicting filters',
          detail: 'If you searched for a long-form title, set video type to All types or Long Form. Shorts-only filters hide long-form videos entirely.',
        },
      ],
      watchList: [],
      momentum: null,
    };
  }

  const search = ctx.searchQuery.trim();
  const headline = search
    ? search.length > 0 && kpis.videoCount === 1
      ? `1 search match · ${formatCompact(kpis.totalViews)} views`
      : `${kpis.videoCount.toLocaleString('en-GB')} search matches · ${formatCompact(kpis.totalViews)} views`
    : buildHeadline(filters, inView, topChannel, kpis, baseline);

  const summary: string[] = search
    ? [
        `Your search "${search.length > 48 ? `${search.slice(0, 48)}…` : search}" matches ${kpis.videoCount.toLocaleString('en-GB')} video${kpis.videoCount === 1 ? '' : 's'} with ${formatCompact(kpis.totalViews)} views in ${range}.`,
      ]
    : [
        `Between ${range}, your selection covers ${kpis.videoCount.toLocaleString('en-GB')} videos and ${formatCompact(kpis.totalViews)} total views across ${kpis.channelCount} channels.`,
      ];

  if (!search && momentum) {
    summary.push(`${momentum.label}.`);
  }

  if (topChannel) {
    if (canCompareChannels(filters, kpis.channelCount)) {
      summary.push(
        `${topChannel.account_name} is the strongest channel with ${formatCompact(topChannel.views)} views — roughly ${channelShare(topChannel.views, kpis.totalViews)}% of the total in view.`,
      );
    } else if (filters.account !== 'all') {
      const networkTotal = baseline.channelData.reduce((sum, row) => sum + row.views, 0);
      const networkShare = channelShare(topChannel.views, networkTotal);
      summary.push(
        `${filters.account} has ${formatCompact(topChannel.views)} views in your filter — ${networkShare}% of all channel views in this date range.`,
      );
    } else {
      summary.push(
        `${topChannel.account_name} has ${formatCompact(topChannel.views)} views in your current filters.`,
      );
    }
  }

  const formatLine = buildFormatSummaryLine(filters, inView, baseline);
  if (formatLine) {
    summary.push(formatLine);
  }

  if (hotVideo) {
    const followUp = rising
      ? ` Also watch "${truncate(rising.title, 40)}" — #2 in the last 28 days with ${formatCompact(rising.total_views)} views.`
      : '';
    summary.push(
      `"${truncate(hotVideo.title, 48)}" is the standout: ${formatCompact(hotVideo.total_views)} views in the last 28 days on ${hotVideo.account_name}.${followUp}`,
    );
  }

  return {
    headline,
    summary,
    recommendations: buildRecommendations(ctx),
    watchList: buildWatchList(ctx),
    momentum,
  };
}

export function formatReportForClipboard(report: EditorReport, ctx: AssistantContext): string {
  const range = formatDateRange(ctx.filters.dateFrom, ctx.filters.dateTo);
  const lines = [
    `PSN Editorial Brief · ${range}`,
    '',
    report.headline,
    '',
    ...report.summary,
    '',
    'Recommendations',
    ...report.recommendations.map(
      (item, index) => `${index + 1}. [${item.priority.toUpperCase()}] ${item.title} — ${item.detail}`,
    ),
  ];

  if (report.watchList.length > 0) {
    lines.push('', 'Watch list');
    for (const item of report.watchList) {
      lines.push(
        `${item.rank}. ${item.title} (${item.channel}) — ${formatCompact(item.views)} views. ${item.reason}`,
      );
    }
  }

  return lines.join('\n');
}
