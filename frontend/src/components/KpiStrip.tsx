import type { KpiMetrics } from '../types';
import { formatCompact } from '../utils/format';
import { Eye, Heart, Film, Radio, TrendingUp } from 'lucide-react';
import './KpiStrip.css';

interface KpiStripProps {
  metrics: KpiMetrics;
  datasetVideoCount: number;
}

const cards = [
  {
    key: 'videos',
    label: 'Total videos',
    icon: Film,
    format: (_: KpiMetrics, datasetVideoCount: number) => datasetVideoCount.toLocaleString('en-GB'),
  },
  {
    key: 'totalViews',
    label: 'Total views',
    icon: Eye,
    format: (m: KpiMetrics) => formatCompact(m.totalViews),
  },
  {
    key: 'totalLikes',
    label: 'Total likes',
    icon: Heart,
    format: (m: KpiMetrics) => formatCompact(m.totalLikes),
  },
  {
    key: 'channels',
    label: 'Channels',
    icon: Radio,
    format: (m: KpiMetrics) => String(m.channelCount),
  },
  {
    key: 'avg',
    label: 'Avg views',
    icon: TrendingUp,
    format: (m: KpiMetrics) => formatCompact(m.avgViewsPerVideo),
  },
] as const;

export function KpiStrip({ metrics, datasetVideoCount }: KpiStripProps) {
  return (
    <div className="kpi-row">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="kpi-card">
          <div className="kpi-icon">
            <Icon size={18} />
          </div>
          <div>
            <span className="kpi-label">{label}</span>
            <strong className="kpi-value">{format(metrics, datasetVideoCount)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
