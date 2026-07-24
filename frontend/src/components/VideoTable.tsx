import type { VideoSummary } from '../types';
import { getYoutubeId } from '../utils/youtube';
import { ChevronLeft, ChevronRight, Play, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './shared.css';
import './VideoTable.css';

const PAGE_SIZE = 25;

interface VideoTableProps {
  rows: VideoSummary[];
  datasetTotal: number;
  selectedId?: string | null;
  onSelect?: (video: VideoSummary) => void;
  onPreview?: (video: VideoSummary) => void;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-GB');
}

function getPageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: (number | 'ellipsis')[] = [1];

  if (current > 3) items.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (current < totalPages - 2) items.push('ellipsis');
  items.push(totalPages);

  return items;
}

export function VideoTable({
  rows,
  datasetTotal,
  selectedId,
  onSelect,
  onPreview,
}: VideoTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [rows.length, rows[0]?.video_id]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, currentPage]);

  if (rows.length === 0) {
    return <p className="empty-state">No videos match your filters.</p>;
  }

  const rangeStart = (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, rows.length);
  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className="table-shell">
      <div className="table-summary">
        <p>
          Showing <strong>{rangeStart.toLocaleString('en-GB')}</strong>
          {' – '}
          <strong>{rangeEnd.toLocaleString('en-GB')}</strong>
          {' of '}
          <strong>{rows.length.toLocaleString('en-GB')}</strong>
          {rows.length === datasetTotal ? ' videos' : ' matching videos'}
        </p>
        {rows.length !== datasetTotal && (
          <p className="table-summary-note">
            {datasetTotal.toLocaleString('en-GB')} videos in the full dataset
          </p>
        )}
      </div>

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
            {pageRows.map((row) => (
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
                  <span className={`pill ${row.video_type === 'Shorts' ? 'short' : 'long'}`}>
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

      {totalPages > 1 && (
        <nav className="table-pagination" aria-label="Video table pagination">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="page-numbers">
            {pageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="page-ellipsis">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`page-btn page-number ${currentPage === item ? 'active' : ''}`}
                  onClick={() => setCurrentPage(item)}
                  aria-current={currentPage === item ? 'page' : undefined}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
