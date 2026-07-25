import type { EditorInsight } from '../types';
import { Lightbulb, TrendingUp, Trophy } from 'lucide-react';
import './InsightStrip.css';

interface InsightStripProps {
  insights: EditorInsight[];
}

const icons = {
  channel: TrendingUp,
  format: Lightbulb,
  highlight: Trophy,
};

export function InsightStrip({ insights }: InsightStripProps) {
  if (insights.length === 0) return null;

  return (
    <section className="insight-strip" aria-label="Key insights">
      {insights.map((insight) => {
        const Icon = icons[insight.id as keyof typeof icons] ?? Lightbulb;
        return (
          <article key={insight.id} className={`insight-card tone-${insight.tone}`}>
            <div className="insight-icon">
              <Icon size={18} />
            </div>
            <div>
              <h2>{insight.title}</h2>
              <p>{insight.detail}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
