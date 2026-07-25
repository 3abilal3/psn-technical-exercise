import type { ChannelBreakdown, FilterState, KpiMetrics, TypeSplit } from '../types';
import { formatCompact } from '../utils/format';

export interface FormatShare {
  shortsPct: number;
  longPct: number;
  shortsViews: number;
  longViews: number;
  total: number;
}

export interface InsightBaseline {
  typeSplit: TypeSplit[];
  channelData: ChannelBreakdown[];
}

export function getFormatShare(typeSplit: TypeSplit[]): FormatShare {
  const total = typeSplit.reduce((sum, item) => sum + item.value, 0);
  const shorts = typeSplit.find((item) => item.name === 'Shorts');
  const longForm = typeSplit.find((item) => item.name === 'Long Form');
  const shortsViews = shorts?.value ?? 0;
  const longViews = longForm?.value ?? 0;

  return {
    shortsPct: total ? Math.round((shortsViews / total) * 100) : 0,
    longPct: total ? Math.round((longViews / total) * 100) : 0,
    shortsViews,
    longViews,
    total,
  };
}

export function canCompareFormats(filters: FilterState): boolean {
  return filters.videoType === 'all';
}

export function canCompareChannels(filters: FilterState, channelCount: number): boolean {
  return filters.account === 'all' && channelCount > 1;
}

export function channelShare(views: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((views / total) * 100);
}

export function buildFormatInsightCopy(
  filters: FilterState,
  inView: FormatShare,
  baseline?: InsightBaseline,
  hasVideos = true,
): { title: string; detail: string; tone: 'yellow' | 'green' | 'blue' } {
  if (!hasVideos) {
    return {
      tone: 'blue',
      title: 'Nothing in view',
      detail: 'No videos match your current filters — adjust channel, format, dates, or search.',
    };
  }

  if (canCompareFormats(filters)) {
    const shortsWin = inView.shortsPct >= inView.longPct;
    return {
      tone: shortsWin ? 'yellow' : 'green',
      title: shortsWin ? 'Shorts are winning' : 'Long form is winning',
      detail: shortsWin
        ? `Shorts picked up ${inView.shortsPct}% of views · Long form ${inView.longPct}%`
        : `Long form picked up ${inView.longPct}% of views · Shorts ${inView.shortsPct}%`,
    };
  }

  const baselineShare = baseline ? getFormatShare(baseline.typeSplit) : null;
  const label = filters.videoType === 'Shorts' ? 'Shorts' : 'Long form';

  if (baselineShare && baselineShare.total > 0) {
    const networkPct = filters.videoType === 'Shorts' ? baselineShare.shortsPct : baselineShare.longPct;
    return {
      tone: 'blue',
      title: `Viewing ${label} only`,
      detail: `${label} are ${networkPct}% of views network-wide in this date range — ${inView.total ? formatCompact(inView.total) : '0'} views in your filter`,
    };
  }

  return {
    tone: 'blue',
    title: `Viewing ${label} only`,
    detail: `${formatCompact(inView.total)} views across your filtered selection`,
  };
}

export function buildChannelInsightCopy(
  filters: FilterState,
  channelData: ChannelBreakdown[],
  kpis: KpiMetrics,
  baseline?: InsightBaseline,
): { title: string; detail: string } | null {
  const top = channelData[0];
  if (!top) return null;

  if (canCompareChannels(filters, kpis.channelCount)) {
    return {
      title: `${top.account_name} leads this period`,
      detail: `${formatCompact(top.views)} views across your selected dates`,
    };
  }

  if (filters.account !== 'all') {
    const networkTotal = baseline?.channelData.reduce((sum, row) => sum + row.views, 0) ?? 0;
    const networkShare = channelShare(top.views, networkTotal);

    return {
      title: `${filters.account} selected`,
      detail:
        networkTotal > 0
          ? `${formatCompact(top.views)} views here · ${networkShare}% of all channel views in this date range`
          : `${formatCompact(top.views)} views · ${kpis.videoCount.toLocaleString('en-GB')} videos in view`,
    };
  }

  if (kpis.channelCount === 1) {
    return {
      title: top.account_name,
      detail: `${formatCompact(top.views)} views in your current filters`,
    };
  }

  return {
    title: `${top.account_name} leads this period`,
    detail: `${formatCompact(top.views)} views across your selected dates`,
  };
}

export function buildFormatSummaryLine(
  filters: FilterState,
  inView: FormatShare,
  baseline?: InsightBaseline,
): string | null {
  if (inView.total === 0 && !canCompareFormats(filters)) {
    return null;
  }

  if (canCompareFormats(filters)) {
    if (inView.shortsPct >= inView.longPct) {
      return `Shorts are carrying the audience (${inView.shortsPct}% vs ${inView.longPct}% long form). Quick, punchy clips are winning in this window.`;
    }
    return `Long-form videos still pull the majority (${inView.longPct}% vs ${inView.shortsPct}% Shorts). Deep-dive pieces are resonating more than quick clips.`;
  }

  const baselineShare = baseline ? getFormatShare(baseline.typeSplit) : null;
  const label = filters.videoType === 'Shorts' ? 'Shorts' : 'Long form';

  if (baselineShare && baselineShare.total > 0) {
    const networkPct = filters.videoType === 'Shorts' ? baselineShare.shortsPct : baselineShare.longPct;
    return `You filtered to ${label.toLowerCase()} only. Network-wide in this period, ${label.toLowerCase()} are ${networkPct}% of views (${formatCompact(inView.total)} in your selection).`;
  }

  return `You filtered to ${label.toLowerCase()} only — ${formatCompact(inView.total)} views in your selection.`;
}

export function buildHeadline(
  filters: FilterState,
  inView: FormatShare,
  topChannel: ChannelBreakdown | undefined,
  kpis: KpiMetrics,
  baseline?: InsightBaseline,
): string {
  if (kpis.videoCount === 0) {
    return 'No videos match your current filters';
  }

  if (!canCompareFormats(filters)) {
    const label = filters.videoType === 'Shorts' ? 'Shorts' : 'Long form';
    const channelPart =
      topChannel && canCompareChannels(filters, kpis.channelCount)
        ? ` · ${topChannel.account_name} tops the list`
        : '';
    return `${kpis.videoCount.toLocaleString('en-GB')} ${label.toLowerCase()} · ${formatCompact(kpis.totalViews)} views${channelPart}`;
  }

  if (!canCompareChannels(filters, kpis.channelCount) && filters.account !== 'all') {
    const baselineShare = baseline ? getFormatShare(baseline.typeSplit) : null;
    if (baselineShare && baselineShare.total > 0) {
      const formatWinner = baselineShare.shortsPct >= baselineShare.longPct ? 'Shorts' : 'Long form';
      const pct = Math.max(baselineShare.shortsPct, baselineShare.longPct);
      return `${filters.account} · ${formatCompact(kpis.totalViews)} views — ${formatWinner} are ${pct}% network-wide`;
    }
    return `${filters.account} · ${formatCompact(kpis.totalViews)} views in your selection`;
  }

  const formatWinner = inView.shortsPct >= inView.longPct ? 'Shorts' : 'Long form';
  const pct = Math.max(inView.shortsPct, inView.longPct);

  if (topChannel) {
    return `${formatWinner} drove ${pct}% of views — ${topChannel.account_name} leads`;
  }

  return `${formatCompact(kpis.totalViews)} views across ${kpis.videoCount.toLocaleString('en-GB')} videos in your selection`;
}
