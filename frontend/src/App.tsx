import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorAssistant } from './components/EditorAssistant';
import { FilterStatus } from './components/FilterStatus';
import { InsightStrip } from './components/InsightStrip';
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
import { buildEditorInsights } from './data/editorInsights';
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
  AssistantContext,
  Post,
  PostStat,
  QueryId,
  SortDirection,
  SortField,
  VideoSummary,
} from './types';
import { QUERIES } from './types';
import { formatDateRange } from './utils/format';
import { buildFilterHint, breakdownFromSummaries, filterBySearch, kpisFromSummaries } from './utils/search';
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

  const baselineFiltered = useMemo(
    () =>
      applyFilters(posts, poststats, {
        account: 'all',
        videoType: 'all',
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    [posts, poststats, filters.dateFrom, filters.dateTo],
  );

  const baseline = useMemo(
    () => ({
      typeSplit: buildTypeSplit(baselineFiltered.posts, baselineFiltered.poststats),
      channelData: buildChannelBreakdown(baselineFiltered.posts, baselineFiltered.poststats),
    }),
    [baselineFiltered],
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

  const visibleTableRows = useMemo(
    () => filterBySearch(tableRows, searchQuery),
    [tableRows, searchQuery],
  );

  const filterHint = useMemo(
    () => buildFilterHint(posts, poststats, filters, searchQuery, tableRows, visibleTableRows),
    [posts, poststats, filters, searchQuery, tableRows, visibleTableRows],
  );

  const displayCount = visibleTableRows.length;

  const viewRows = useMemo(
    () => (searchQuery.trim() ? visibleTableRows : tableRows),
    [searchQuery, visibleTableRows, tableRows],
  );

  const displayKpis = useMemo(
    () => (searchQuery.trim() ? kpisFromSummaries(viewRows) : liveData.kpis),
    [searchQuery, viewRows, liveData.kpis],
  );

  const displayBreakdown = useMemo(
    () =>
      searchQuery.trim()
        ? breakdownFromSummaries(viewRows)
        : { channelData: liveData.channelData, typeSplit: liveData.typeSplit },
    [searchQuery, viewRows, liveData.channelData, liveData.typeSplit],
  );

  const highlightVideo = useMemo(() => {
    if (searchQuery.trim()) return viewRows[0];
    return liveData.q3[0] ?? tableRows[0];
  }, [searchQuery, viewRows, liveData.q3, tableRows]);

  const highlightViewsLabel = useMemo(() => {
    if (searchQuery.trim()) return 'views in selected date range';
    if (liveData.q3[0] && highlightVideo?.video_id === liveData.q3[0].video_id) {
      return 'views in the last 28 days';
    }
    return 'views in selected date range';
  }, [searchQuery, liveData.q3, highlightVideo]);

  const spotlightVideos = useMemo(() => {
    const source = searchQuery.trim() ? visibleTableRows : tableRows;
    const base = source.slice(0, 6);
    if (!selectedVideo) return base;

    const alreadyListed = base.some((video) => video.video_id === selectedVideo.video_id);
    if (alreadyListed) return base;

    return [selectedVideo, ...base.slice(0, 5)];
  }, [tableRows, visibleTableRows, searchQuery, selectedVideo]);

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

    const pool = searchQuery.trim() ? visibleTableRows : tableRows;
    const stillVisible = pool.some((video) => video.video_id === selectedVideo.video_id);
    if (!stillVisible) {
      setSelectedVideo(pool[0] ?? tableRows[0] ?? null);
      setPlayToken((token) => token + 1);
    }
  }, [tableRows, visibleTableRows, searchQuery, selectedVideo]);

  const editorInsights = useMemo(
    () =>
      buildEditorInsights(
        filters,
        displayKpis,
        displayBreakdown.channelData,
        displayBreakdown.typeSplit,
        highlightVideo,
        baseline,
        searchQuery,
        highlightViewsLabel,
      ),
    [filters, displayKpis, displayBreakdown, highlightVideo, baseline, searchQuery, highlightViewsLabel],
  );

  const assistantContext = useMemo<AssistantContext>(
    () => ({
      filters,
      searchQuery,
      filterHint: filterHint?.detail ?? null,
      kpis: displayKpis,
      channelData: displayBreakdown.channelData,
      typeSplit: displayBreakdown.typeSplit,
      top28: searchQuery.trim() ? viewRows.slice(0, 5) : liveData.q3,
      summaries: viewRows,
      accounts: getAccounts(posts),
      datasetTotal: posts.length,
      viewsTrend: liveData.q2,
      baseline,
    }),
    [filters, searchQuery, filterHint, displayKpis, displayBreakdown, viewRows, liveData, posts, baseline],
  );

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
        filteredCount={displayCount}
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

        {filterHint && <FilterStatus hint={filterHint} />}

        <InsightStrip insights={editorInsights} />

        <KpiStrip metrics={displayKpis} />

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
            filterCount={tableRows.length}
            emptyMessage={filterHint?.detail}
            selectedId={selectedVideo?.video_id}
            onSelect={(video) => selectVideo(video)}
            onPreview={(video) => selectVideo(video, true)}
          />
        </section>

        <EditorAssistant context={assistantContext} />
      </div>
    </div>
  );
}
