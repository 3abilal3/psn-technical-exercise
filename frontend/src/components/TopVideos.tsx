import type { VideoSummary } from '../types';
import { Trophy } from 'lucide-react';
import './shared.css';
import './TopVideos.css';

interface TopVideosProps {
  videos: VideoSummary[];
  compact?: boolean;
  onSelect?: (video: VideoSummary) => void;
}

const MEDAL = ['🥇', '🥈', '🥉', '4', '5'];

export function TopVideos({ videos, compact, onSelect }: TopVideosProps) {
  return (
    <section className={`panel top-videos ${compact ? 'compact' : ''}`}>
      <div className="panel-header">
        <span className="panel-tag">Query 3</span>
        <h2><Trophy size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />Top performers</h2>
        <p>Last 28 days</p>
      </div>
      <ol className="top-list">
        {videos.map((video, index) => (
          <li key={video.video_id} onClick={() => onSelect?.(video)}>
            <span className="rank">{MEDAL[index] ?? index + 1}</span>
            <div className="top-copy">
              <button type="button">{video.title}</button>
              <span>{video.account_name} · {video.video_type}</span>
            </div>
            <span className="top-views">{video.total_views.toLocaleString('en-GB')}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
