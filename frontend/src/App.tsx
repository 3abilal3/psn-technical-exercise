import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DynamicQueryChart } from './components/DynamicQueryChart';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { KpiStrip } from './components/KpiStrip';
import { QuerySelector } from './components/QuerySelector';
import { SecondaryCharts } from './components/SecondaryCharts';
import { TopVideos } from './components/TopVideos';
import { VideoSpotlight } from './components/VideoSpotlight';
import { VideoTable } from './components/VideoTable';
import { loadPosts, loadPoststats } from './data/csvLoader';
import {
  applyFilters,
  buildChannelBreakdown,
  buildEngagementOverTime,
  buildKpis,
  buildTypeSplit,
  buildVideoSummaries,
  getAccounts,
  getDateBounds,
  getVideoTypes,
  queryTop5Last28Days,
  queryTotalViewsPerVideo,
  queryViewsByTypeOverTime,
} from './data/processData';
import type {
  FilterState,
  Post,
  PostStat,
  QueryId,
  SortDirection,
  SortField,
  VideoSummary,
} from './types';
import { QUERIES } from './types';
import { formatDateRange } from './utils/format';
import './components/shared.css';
import './App.css';

function sortRows(
  rows: VideoSummary[],
  sortField: SortField,
  sortDirection: SortDirection,
): VideoSummary[] {
  return [...rows].sort((a, b) => {
    const left = a[sortField];
    const right = b[sortField];

    if (typeof left === 'number' && typeof right === 'number') {
      return sortDirection === 'asc' ? left - right : right - left;
    }

    return sortDirection === 'asc'
      ? String(left).localeCompare(String(right))
      : String(right).localeCompare(String(left));
  });
}

const DEFAULT_FILTERS = (min: string, max: string): FilterState => ({
  account: 'all',
  videoType: 'all',
  dateFrom: min,
  dateTo: max,
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [poststats, setPoststats] = useState<PostStat[]>([]);
  const [dateMin, setDateMin] = useState('');
  const [dateMax, setDateMax] = useState('');

  const [activeQuery, setActiveQuery] = useState<QueryId>('q2');
  const [filters, setFilters] = useState<FilterState>({
    account: 'all',
    videoType: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [sortField, setSortField] = useState<SortField>('total_views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoSummary | null>(null);
  const [playToken, setPlayToken] = useState(0);
  const didInitSelection = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [loadedPosts, loadedStats] = await Promise.all([loadPosts(), loadPoststats()]);
        const bounds = getDateBounds(loadedStats);

        setPosts(loadedPosts);
        setPoststats(loadedStats);
        setDateMin(bounds.min);
        setDateMax(bounds.max);
        setFilters(DEFAULT_FILTERS(bounds.min, bounds.max));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filtered = useMemo(
    () => applyFilters(posts, poststats, filters),
    [posts, poststats, filters],
  );

  const liveData = useMemo(() => {
    const { posts: fp, poststats: fps } = filtered;
    const summaries = buildVideoSummaries(fp, fps);

    return {
      summaries,
      q1: queryTotalViewsPerVideo(fp, fps),
      q2: queryViewsByTypeOverTime(fp, fps),
      q3: queryTop5Last28Days(fps, summaries),
      kpis: buildKpis(fp, fps),
      typeSplit: buildTypeSplit(fp, fps),
      channelData: buildChannelBreakdown(fp, fps),
      engagementData: buildEngagementOverTime(fp, fps),
    };
  }, [filtered]);

  const tableRows = useMemo(
    () => sortRows(liveData.summaries, sortField, sortDirection),
    [liveData.summaries, sortField, sortDirection],
  );

  const visibleTableRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tableRows;
    return tableRows.filter((row) => row.title.toLowerCase().includes(query));
  }, [tableRows, searchQuery]);

  const spotlightVideos = useMemo(() => {
    const base = tableRows.slice(0, 6);
    if (!selectedVideo) return base;

    const alreadyListed = base.some((video) => video.video_id === selectedVideo.video_id);
    if (alreadyListed) return base;

    return [selectedVideo, ...base.slice(0, 5)];
  }, [tableRows, selectedVideo]);

  const selectVideo = useCallback((video: VideoSummary, scrollToPlayer = false) => {
    setSelectedVideo(video);
    setPlayToken((token) => token + 1);

    if (scrollToPlayer) {
      requestAnimationFrame(() => {
        document.getElementById('video-spotlight')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  }, []);

  useEffect(() => {
    if (didInitSelection.current || tableRows.length === 0) return;
    setSelectedVideo(tableRows[0]);
    didInitSelection.current = true;
  }, [tableRows]);

  useEffect(() => {
    if (tableRows.length === 0) {
      setSelectedVideo(null);
      return;
    }

    if (!selectedVideo) return;

    const stillVisible = tableRows.some((video) => video.video_id === selectedVideo.video_id);
    if (!stillVisible) {
      setSelectedVideo(tableRows[0]);
      setPlayToken((token) => token + 1);
    }
  }, [tableRows, selectedVideo]);

  const activeMeta = QUERIES.find((q) => q.id === activeQuery)!;

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS(dateMin, dateMax));
    setSearchQuery('');
    setSortField('total_views');
    setSortDirection('desc');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-brand">PSN Content Performance</div>
        <div className="loader-wheel" />
        <p>Reading posts and daily stats…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <p style={{ color: '#ff5252' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header
        dateRange={formatDateRange(filters.dateFrom, filters.dateTo)}
        filteredCount={liveData.summaries.length}
        datasetTotal={posts.length}
      />

      <div className="dashboard-grid">
        <FilterBar
          accounts={getAccounts(posts)}
          videoTypes={getVideoTypes(posts)}
          filters={filters}
          searchQuery={searchQuery}
          sortField={sortField}
          sortDirection={sortDirection}
          dateMin={dateMin}
          dateMax={dateMax}
          onFiltersChange={setFilters}
          onSearchChange={setSearchQuery}
          onSortFieldChange={setSortField}
          onSortDirectionChange={setSortDirection}
          onReset={handleReset}
        />

        <KpiStrip metrics={liveData.kpis} datasetVideoCount={posts.length} />

        <VideoSpotlight
          selected={selectedVideo}
          featured={spotlightVideos}
          playToken={playToken}
          onSelect={(video) => selectVideo(video)}
          onClear={() => setSelectedVideo(null)}
        />

        <div className="main-section">
          <QuerySelector
            queries={QUERIES}
            activeQuery={activeQuery}
            onChange={setActiveQuery}
          />

          <div className="main-charts">
            <DynamicQueryChart
              activeQuery={activeQuery}
              queryMeta={activeMeta}
              q1Data={liveData.q1}
              q2Data={liveData.q2}
              q3Data={liveData.q3}
            />
            <TopVideos videos={liveData.q3} compact onSelect={(video) => selectVideo(video)} />
          </div>
        </div>

        <SecondaryCharts
          typeSplit={liveData.typeSplit}
          channelData={liveData.channelData}
          engagementData={liveData.engagementData}
        />

        <section className="panel table-section">
          <div className="panel-header">
            <span className="panel-tag">{posts.length.toLocaleString('en-GB')} in dataset</span>
            <h2>All videos</h2>
            <p>25 rows per page — use search and filters to narrow the list.</p>
          </div>
          <VideoTable
            rows={visibleTableRows}
            datasetTotal={posts.length}
            selectedId={selectedVideo?.video_id}
            onSelect={(video) => selectVideo(video)}
            onPreview={(video) => selectVideo(video, true)}
          />
        </section>
      </div>
    </div>
  );
}
