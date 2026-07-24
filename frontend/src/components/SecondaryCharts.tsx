import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChannelBreakdown, EngagementPoint, TypeSplit } from '../types';
import './shared.css';
import './SecondaryCharts.css';

const TOOLTIP = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid rgba(26, 43, 60, 0.12)',
    borderRadius: '10px',
    fontSize: '12px',
    boxShadow: '0 4px 16px rgba(26, 43, 60, 0.1)',
  },
};

interface SecondaryChartsProps {
  typeSplit: TypeSplit[];
  channelData: ChannelBreakdown[];
  engagementData: EngagementPoint[];
}

const CHANNEL_COLORS = ['#2563a8', '#1f8f5f', '#e8344a', '#f4b942'];
const TICK = { fill: '#5a7189', fontSize: 10 };

export function SecondaryCharts({ typeSplit, channelData, engagementData }: SecondaryChartsProps) {
  const totalType = typeSplit.reduce((s, t) => s + t.value, 0);

  return (
    <div className="side-charts">
      <section className="panel mini-chart">
        <div className="panel-header">
          <h2>Long Form vs Shorts</h2>
          <p>View share across formats</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={typeSplit}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={3}
            >
              {typeSplit.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('en-GB')} (${totalType ? Math.round((value / totalType) * 100) : 0}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="legend-row">
          {typeSplit.map((t) => (
            <span key={t.name} className="legend-item">
              <i style={{ background: t.fill }} />
              {t.name}
            </span>
          ))}
        </div>
      </section>

      <section className="panel mini-chart">
        <div className="panel-header">
          <h2>Views by channel</h2>
          <p>Views by channel in the filtered range</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={channelData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26, 43, 60, 0.08)" />
            <XAxis dataKey="account_name" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip {...TOOLTIP} formatter={(v: number) => v.toLocaleString('en-GB')} />
            <Bar dataKey="views" radius={[6, 6, 0, 0]}>
              {channelData.map((_, i) => (
                <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section className="panel mini-chart span-2">
        <div className="panel-header">
          <h2>Engagement</h2>
          <p>Likes, comments and shares per day</p>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={engagementData.map((d) => ({ ...d, label: d.stat_date.slice(5) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 43, 60, 0.08)" />
            <XAxis dataKey="label" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip {...TOOLTIP} />
            <Line type="monotone" dataKey="likes" stroke="#e8a317" strokeWidth={2} dot={false} name="Likes" />
            <Line type="monotone" dataKey="comments" stroke="#2b7cd3" strokeWidth={2} dot={false} name="Comments" />
            <Line type="monotone" dataKey="shares" stroke="#2d9d6e" strokeWidth={2} dot={false} name="Shares" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
