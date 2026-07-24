import { useEffect, useState } from 'react';
import type { VideoSummary } from '../types';
import { getYoutubeEmbedUrl, getYoutubeId, getYoutubeThumbnail } from '../utils/youtube';
import { ExternalLink, Play, X } from 'lucide-react';
import './VideoSpotlight.css';

interface VideoSpotlightProps {
  selected: VideoSummary | null;
  featured: VideoSummary[];
  playToken: number;
  onSelect: (video: VideoSummary) => void;
  onClear: () => void;
}

export function VideoSpotlight({
  selected,
  featured,
  playToken,
  onSelect,
  onClear,
}: VideoSpotlightProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeId = selected ? getYoutubeId(selected.video_url) : null;
  const embedUrl = selected ? getYoutubeEmbedUrl(selected.video_url, isPlaying) : null;
  const posterUrl = selected ? getYoutubeThumbnail(selected.video_url) : null;

  useEffect(() => {
    setIsPlaying(false);
  }, [selected?.video_id, playToken]);

  const handleSelect = (video: VideoSummary) => {
    onSelect(video);
  };

  return (
    <section id="video-spotlight" className="panel video-spotlight">
      <div className="panel-header">
        <span className="panel-tag">Preview</span>
        <h2>Video player</h2>
        <p>Top performers from the current sort order</p>
      </div>

      <div className="spotlight-layout">
        <div className="player-wrap">
          {selected && youtubeId ? (
            <>
              <div className="player-header">
                <div>
                  <strong>{selected.title}</strong>
                  <span>{selected.account_name} · {selected.video_type}</span>
                </div>
                <button type="button" className="close-btn" onClick={onClear} aria-label="Close video">
                  <X size={18} />
                </button>
              </div>

              <div className="player-stage">
                {isPlaying && embedUrl ? (
                  <div className="iframe-wrap">
                    <iframe
                      key={`${youtubeId}-${playToken}`}
                      src={embedUrl}
                      title={selected.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="player-poster"
                    onClick={() => setIsPlaying(true)}
                    aria-label={`Play ${selected.title}`}
                  >
                    {posterUrl && (
                      <img src={posterUrl} alt="" className="poster-image" loading="lazy" />
                    )}
                    <span className="poster-play">
                      <Play size={28} fill="currentColor" />
                    </span>
                    <span className="poster-label">Play</span>
                  </button>
                )}
              </div>

              <div className="player-actions">
                <a
                  href={selected.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="youtube-link"
                >
                  <ExternalLink size={14} />
                  Open on YouTube
                </a>
              </div>
            </>
          ) : (
            <div className="player-placeholder">
              <Play size={48} />
              <p>Choose a video from the row on the right</p>
            </div>
          )}
        </div>

        <div className="video-grid">
          {featured.map((video) => {
            const thumb = getYoutubeThumbnail(video.video_url, 'mqdefault');
            const isActive = selected?.video_id === video.video_id;
            return (
              <button
                key={video.video_id}
                type="button"
                className={`video-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(video)}
              >
                <div className="thumb-wrap">
                  {thumb && (
                    <img src={thumb} alt="" loading="lazy" />
                  )}
                  <span className="play-overlay"><Play size={20} /></span>
                </div>
                <div className="video-card-copy">
                  <strong>{video.title}</strong>
                  <span>{video.account_name}</span>
                  <em>{video.total_views.toLocaleString('en-GB')} views</em>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
