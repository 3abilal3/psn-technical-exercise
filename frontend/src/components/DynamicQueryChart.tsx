import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QueryDefinition, QueryId, VideoSummary, ViewsByTypeOverTime, ViewsPerVideo } from '../types';
import './shared.css';
import './DynamicQueryChart.css';

interface DynamicQueryChartProps {
  activeQuery: QueryId;
  queryMeta: QueryDefinition;
  q1Data: ViewsPerVideo[];
  q2Data: ViewsByTypeOverTime[];
  q3Data: VideoSummary[];
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid rgba(26, 43, 60, 0.12)',
    borderRadius: '10px',
    fontSize: '13px',
    boxShadow: '0 4px 16px rgba(26, 43, 60, 0.1)',
  },
};

const TICK = { fill: 'var(--chart-tick)', fontSize: 11 };

function truncate(title: string, max = 28): string {
  return title.length > max ? `${title.slice(0, max)}…` : title;
}

export function DynamicQueryChart({
  activeQuery,
  queryMeta,
  q1Data,
  q2Data,
  q3Data,
}: DynamicQueryChartProps) {
  return (
    <section className="panel dynamic-chart">
      <div className="panel-header">
        <span className="panel-tag">{queryMeta.sqlLabel}</span>
        <h2>{queryMeta.title}</h2>
        <p>{queryMeta.subtitle}</p>
      </div>

      <div className="chart-animate" key={activeQuery}>
        {activeQuery === 'q1' && (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={q1Data.slice(0, 10)}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" tick={TICK} />
              <YAxis
                type="category"
                dataKey="title"
                width={140}
                tick={TICK}
                tickFormatter={(v) => truncate(v, 22)}
              />
              <Tooltip
                {...CHART_TOOLTIP}
                formatter={(value: number) => [value.toLocaleString('en-GB'), 'Views']}
              />
              <Bar dataKey="total_views" name="Total views" radius={[0, 6, 6, 0]}>
                {q1Data.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#e8a317' : i < 3 ? '#2b7cd3' : '#2d9d6e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeQuery === 'q2' && (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={q2Data.map((d) => ({ ...d, label: d.stat_date.slice(5) }))}>
              <defs>
                <linearGradient id="longGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8a317" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#e8a317" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="shortGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b7cd3" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2b7cd3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => v.toLocaleString('en-GB')} />
              <Legend />
              <Area type="monotone" dataKey="Long Form" stroke="#e8a317" fill="url(#longGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Short Form" stroke="#2b7cd3" fill="url(#shortGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeQuery === 'q3' && (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={q3Data.map((d) => ({ ...d, shortTitle: truncate(d.title, 24) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="shortTitle" tick={TICK} interval={0} angle={-12} textAnchor="end" height={60} />
              <YAxis tick={TICK} />
              <Tooltip
                {...CHART_TOOLTIP}
                formatter={(value: number) => [value.toLocaleString('en-GB'), 'Views (28d)']}
              />
              <Bar dataKey="total_views" name="Views" radius={[8, 8, 0, 0]}>
                {q3Data.map((_, i) => (
                  <Cell key={i} fill={['#e8a317', '#94a3b8', '#cd7f32', '#2b7cd3', '#2d9d6e'][i] ?? '#2b7cd3'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
