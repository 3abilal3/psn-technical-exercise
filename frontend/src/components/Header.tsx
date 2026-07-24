import { BarChart3 } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  dateRange: string;
  filteredCount: number;
  datasetTotal: number;
}

export function Header({ dateRange, filteredCount, datasetTotal }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-mark">
              <BarChart3 size={26} strokeWidth={2.2} />
            </div>
            <div>
              <p className="eyebrow">Play Sports Network</p>
              <h1>Content Performance</h1>
              <p className="subtitle">
                Daily YouTube stats across GCN, GMBN, GTN, EMBN and partner channels.
              </p>
            </div>
          </div>
          <div className="header-meta">
            <div className="meta-pill">
              <span>Reporting period</span>
              <strong>{dateRange}</strong>
            </div>
            <div className="meta-pill">
              <span>Videos shown</span>
              <strong>
                {filteredCount.toLocaleString('en-GB')}
                {filteredCount !== datasetTotal && ` / ${datasetTotal.toLocaleString('en-GB')}`}
              </strong>
            </div>
          </div>
        </div>
        <div className="header-visual">
          <img src="/hero-cycling.jpg" alt="" loading="eager" />
        </div>
      </div>
    </header>
  );
}
