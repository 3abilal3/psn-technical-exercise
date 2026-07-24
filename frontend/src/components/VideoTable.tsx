import type { VideoSummary } from '../types';
import { getYoutubeId } from '../utils/youtube';
import { Play, Video } from 'lucide-react';
import './shared.css';
import './VideoTable.css';

interface VideoTableProps {
  rows: VideoSummary[];
  selectedId?: string | null;
  onSelect?: (video: VideoSummary) => void;
  onPreview?: (video: VideoSummary) => void;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-GB');
}

export function VideoTable({ rows, selectedId, onSelect, onPreview }: VideoTableProps) {
  if (rows.length === 0) {
    return <p className="empty-state">No videos match your filters.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="video-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Channel</th>
            <th>Format</th>
            <th>Published</th>
            <th>Views</th>
            <th>Likes</th>
            <th>Watch</th>
            <th>Preview</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.video_id}
              className={selectedId === row.video_id ? 'selected' : ''}
              onClick={() => onSelect?.(row)}
            >
              <td>
                <span className="title-link">
                  <Play size={14} />
                  {row.title}
                </span>
              </td>
              <td><span className="channel-tag">{row.account_name}</span></td>
              <td>
                <span className={`pill ${row.video_type === 'Short Form' ? 'short' : 'long'}`}>
                  {row.video_type}
                </span>
              </td>
              <td className="mono">{row.published_at_date}</td>
              <td className="num highlight">{formatNumber(row.total_views)}</td>
              <td className="num">{formatNumber(row.total_likes)}</td>
              <td className="num">{formatNumber(Math.round(row.total_minutes_watched))}</td>
              <td>
                {getYoutubeId(row.video_url) && (
                  <button
                    type="button"
                    className="preview-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      (onPreview ?? onSelect)?.(row);
                    }}
                  >
                    <Video size={12} />
                    Preview
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
