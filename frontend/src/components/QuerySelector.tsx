import type { QueryDefinition, QueryId } from '../types';
import { Database } from 'lucide-react';
import './QuerySelector.css';

interface QuerySelectorProps {
  queries: QueryDefinition[];
  activeQuery: QueryId;
  onChange: (id: QueryId) => void;
}

export function QuerySelector({ queries, activeQuery, onChange }: QuerySelectorProps) {
  return (
    <aside className="query-selector panel">
      <div className="query-selector-head">
        <Database size={18} className="query-icon" />
        <div>
          <h2>Queries</h2>
          <p>Switch chart by SQL question</p>
        </div>
      </div>
      <div className="query-list">
        {queries.map((q, i) => (
          <button
            key={q.id}
            type="button"
            className={`query-card ${activeQuery === q.id ? 'active' : ''}`}
            onClick={() => onChange(q.id)}
          >
            <span className="query-num">Q{i + 1}</span>
            <div className="query-copy">
              <strong>{q.title}</strong>
              <span>{q.subtitle}</span>
              <code>{q.sqlLabel}</code>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
