import type { AssistantContext, VideoSummary } from '../types';
import { canCompareChannels, canCompareFormats, getFormatShare } from './insightContext';
import { formatCompact } from '../utils/format';

const SUGGESTIONS = [
  'Which channel performed best?',
  'What should we publish next?',
  'Top video in the last 28 days?',
  'Are Shorts beating long form?',
  'How is momentum this week?',
];

function topVideosForChannel(videos: VideoSummary[], channel: string, limit = 3): VideoSummary[] {
  return videos
    .filter((video) => video.account_name.toLowerCase() === channel.toLowerCase())
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, limit);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function getSuggestedQuestions(): string[] {
  return SUGGESTIONS;
}

export function answerQuestion(question: string, ctx: AssistantContext): string {
  const query = question.trim().toLowerCase();
  if (!query) {
    return 'Ask about channels, formats, momentum, or what to publish next — or tap a suggestion below.';
  }

  if (/what should|publish next|upload|content plan|recommend/.test(query)) {
    const topChannel = ctx.channelData[0];
    const hot = ctx.top28[0];

    if (!topChannel) {
      return 'No channel data in the current filters — widen the date range or reset filters.';
    }

    const winnerHint = hot
      ? ` Study "${truncate(hot.title, 42)}" (${formatCompact(hot.total_views)} views in 28 days) for title and hook patterns.`
      : '';

    if (!canCompareFormats(ctx.filters)) {
      const label = ctx.filters.videoType === 'Shorts' ? 'Shorts' : 'long-form';
      return `You're viewing ${label} only. Next up: a ${label} upload on ${topChannel.account_name} — your strongest channel in this filter.${winnerHint}`;
    }

    if (!canCompareChannels(ctx.filters, ctx.kpis.channelCount) && ctx.filters.account !== 'all') {
      const baselineShare = getFormatShare(ctx.baseline.typeSplit);
      const winner = baselineShare.shortsPct >= baselineShare.longPct ? 'Shorts' : 'long form';
      return `You're viewing ${ctx.filters.account} only. Network-wide, ${winner} lead in this period (${Math.max(baselineShare.shortsPct, baselineShare.longPct)}%). Mix formats on ${ctx.filters.account} for the next slot.${winnerHint}`;
    }

    const inView = getFormatShare(ctx.typeSplit);
    const format = inView.shortsPct >= inView.longPct ? 'Shorts' : 'long-form';
    return `Based on your filters: lead with ${format} on ${topChannel.account_name} — it is your top channel and ${format === 'Shorts' ? 'Shorts' : 'long form'} is winning the format split.${winnerHint}`;
  }

  if (/momentum|week on week|this week|trending up|trending down/.test(query)) {
    if (ctx.viewsTrend.length < 14) {
      return 'Not enough daily data in view to compare weeks — try a wider date range.';
    }

    const recent = ctx.viewsTrend.slice(-7).reduce((sum, row) => sum + row['Long Form'] + row.Shorts, 0);
    const prior = ctx.viewsTrend.slice(-14, -7).reduce((sum, row) => sum + row['Long Form'] + row.Shorts, 0);
    if (prior === 0) return 'Prior week had no views in this filter — adjust dates and try again.';

    const change = Math.round(((recent - prior) / prior) * 100);
    if (Math.abs(change) < 3) {
      return `Momentum is flat — ${formatCompact(recent)} views in the last 7 days vs ${formatCompact(prior)} the week before.`;
    }

    const direction = change > 0 ? 'up' : 'down';
    return `Views are ${direction} ${Math.abs(change)}% week on week (${formatCompact(recent)} last 7 days vs ${formatCompact(prior)} prior 7 days).`;
  }

  if (/how many videos|video count|videos in/.test(query)) {
    return `You have ${ctx.kpis.videoCount.toLocaleString('en-GB')} videos in view (${formatCompact(ctx.kpis.totalViews)} views), from a dataset of ${ctx.datasetTotal.toLocaleString('en-GB')} posts.`;
  }

  if (/shorts|long form|format|long-form/.test(query)) {
    if (!canCompareFormats(ctx.filters)) {
      const baselineShare = getFormatShare(ctx.baseline.typeSplit);
      const inView = getFormatShare(ctx.typeSplit);
      const label = ctx.filters.videoType === 'Shorts' ? 'Shorts' : 'Long form';
      const networkPct = ctx.filters.videoType === 'Shorts' ? baselineShare.shortsPct : baselineShare.longPct;
      const otherLabel = ctx.filters.videoType === 'Shorts' ? 'Long form' : 'Shorts';
      const otherPct = ctx.filters.videoType === 'Shorts' ? baselineShare.longPct : baselineShare.shortsPct;
      return `You filtered to ${label} only (${formatCompact(inView.total)} views here). Network-wide in this period: ${label} ${networkPct}%, ${otherLabel} ${otherPct}%. Clear the video type filter to compare formats in your selection.`;
    }

    const inView = getFormatShare(ctx.typeSplit);
    const winner = inView.shortsPct >= inView.longPct ? 'Shorts' : 'Long form';
    const tip =
      winner === 'Shorts'
        ? ' Consider batching Shorts on your top channel this week.'
        : ' A flagship long-form piece may outperform more Shorts right now.';
    return `${winner} is ahead — Shorts ${inView.shortsPct}%, long form ${inView.longPct}% of views in your filters.${tip}`;
  }

  if (/28 days|last month|recent|this month|trending/.test(query)) {
    if (ctx.top28.length === 0) {
      return 'No videos have stats in the last 28 days for the current filters.';
    }
    const list = ctx.top28
      .slice(0, 3)
      .map((video, index) => `${index + 1}. ${truncate(video.title, 36)} (${formatCompact(video.total_views)} views)`)
      .join(' · ');
    return `Top performers in the last 28 days: ${list}`;
  }

  const channel = ctx.accounts.find((name) => query.includes(name.toLowerCase()));
  if (channel) {
    if (/top|best|perform|leading|winning/.test(query)) {
      const picks = topVideosForChannel(ctx.summaries, channel);
      if (picks.length === 0) {
        return `No ${channel} videos match your current filters.`;
      }
      return `${channel}'s best videos right now: ${picks
        .map((video) => `"${truncate(video.title, 32)}" (${formatCompact(video.total_views)} views)`)
        .join('; ')}.`;
    }
    const channelTotal = ctx.channelData.find((row) => row.account_name === channel);
    if (channelTotal) {
      return `${channel} has ${formatCompact(channelTotal.views)} views in the selected date range.`;
    }
  }

  if (/best channel|top channel|leading channel|which channel/.test(query)) {
    const top = ctx.channelData[0];
    if (!top) return 'No channel data for the current filters.';

    if (!canCompareChannels(ctx.filters, ctx.kpis.channelCount)) {
      if (ctx.filters.account !== 'all') {
        const networkTotal = ctx.baseline.channelData.reduce((sum, row) => sum + row.views, 0);
        const share = networkTotal ? Math.round((top.views / networkTotal) * 100) : 0;
        return `You're viewing ${ctx.filters.account} only — ${formatCompact(top.views)} views (${share}% of all channel views in this date range). Reset the channel filter to compare channels.`;
      }
      return `Only one channel in your current filters: ${top.account_name} with ${formatCompact(top.views)} views.`;
    }

    const second = ctx.channelData[1];
    const gap = second
      ? ` — ${formatCompact(top.views - second.views)} ahead of ${second.account_name}`
      : '';
    return `${top.account_name} leads with ${formatCompact(top.views)} views${gap}.`;
  }

  if (/average|avg views/.test(query)) {
    return `Average views per video: ${formatCompact(ctx.kpis.avgViewsPerVideo)}. Total: ${formatCompact(ctx.kpis.totalViews)} across ${ctx.kpis.videoCount.toLocaleString('en-GB')} videos.`;
  }

  if (/likes|engagement/.test(query)) {
    const rate =
      ctx.kpis.totalViews > 0
        ? ((ctx.kpis.totalLikes / ctx.kpis.totalViews) * 100).toFixed(2)
        : '0';
    return `${formatCompact(ctx.kpis.totalLikes)} likes in view (${rate}% like rate) across ${ctx.kpis.videoCount.toLocaleString('en-GB')} videos.`;
  }

  if (/watch list|standout|highlight/.test(query)) {
    if (ctx.top28.length === 0) return 'No standouts in the 28-day window for these filters.';
    const top = ctx.top28[0];
    return `Start with "${truncate(top.title, 44)}" on ${top.account_name} — ${formatCompact(top.total_views)} views in the last 28 days.`;
  }

  return `I can answer questions about channels, formats, momentum, and publishing priorities. Try: "${SUGGESTIONS[1]}"`;
}
