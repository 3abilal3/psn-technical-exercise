import type { KpiMetrics } from '../types';
import { Eye, Heart, Clock, Film, TrendingUp } from 'lucide-react';
import './KpiStrip.css';

interface KpiStripProps {
  metrics: KpiMetrics;
}

const cards = [
  { key: 'totalViews', label: 'Total views', icon: Eye, format: (m: KpiMetrics) => m.totalViews.toLocaleString('en-GB') },
  { key: 'totalLikes', label: 'Total likes', icon: Heart, format: (m: KpiMetrics) => m.totalLikes.toLocaleString('en-GB') },
  { key: 'watchTime', label: 'Watch time (min)', icon: Clock, format: (m: KpiMetrics) => m.totalWatchMinutes.toLocaleString('en-GB') },
  { key: 'videos', label: 'Videos', icon: Film, format: (m: KpiMetrics) => String(m.videoCount) },
  { key: 'avg', label: 'Avg views / video', icon: TrendingUp, format: (m: KpiMetrics) => m.avgViewsPerVideo.toLocaleString('en-GB') },
] as const;

export function KpiStrip({ metrics }: KpiStripProps) {
  return (
    <div className="kpi-row">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <div key={key} className="kpi-card">
          <div className="kpi-icon">
            <Icon size={18} />
          </div>
          <div>
            <span className="kpi-label">{label}</span>
            <strong className="kpi-value">{format(metrics)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
