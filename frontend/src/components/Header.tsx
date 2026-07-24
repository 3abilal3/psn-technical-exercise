import { Bike, Mountain } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  dateRange: string;
  videoCount: number;
}

export function Header({ dateRange, videoCount }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-hero" aria-hidden="true" />
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-icon">
            <Bike size={28} strokeWidth={2.5} />
          </div>
          <div>
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              Play Sports Network
            </p>
            <h1>Cycling Content Explorer</h1>
            <p className="subtitle">
              Video performance for GCN, GCN Tech, and EMBN.
            </p>
          </div>
        </div>
        <div className="header-meta">
          <div className="meta-pill">
            <span>Date range</span>
            <strong>{dateRange}</strong>
          </div>
          <div className="meta-pill">
            <span><Mountain size={12} style={{ display: 'inline' }} /> Videos</span>
            <strong>{videoCount}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
