import type { FilterState, SortDirection, SortField } from '../types';
import { Filter, RotateCcw, Search } from 'lucide-react';
import './FilterBar.css';

interface FilterBarProps {
  accounts: string[];
  videoTypes: string[];
  filters: FilterState;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  dateMin: string;
  dateMax: string;
  onFiltersChange: (filters: FilterState) => void;
  onSearchChange: (value: string) => void;
  onSortFieldChange: (value: SortField) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}

export function FilterBar({
  accounts,
  videoTypes,
  filters,
  searchQuery,
  sortField,
  sortDirection,
  dateMin,
  dateMax,
  onFiltersChange,
  onSearchChange,
  onSortFieldChange,
  onSortDirectionChange,
  onReset,
}: FilterBarProps) {
  const update = (partial: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <div className="filter-bar panel">
      <div className="filter-bar-title">
        <Filter size={16} />
        <span>Refine</span>
        <button type="button" className="reset-btn" onClick={onReset}>
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
      <label className="search-field">
        <Search size={16} />
        <input
          type="search"
          placeholder="Search titles…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </label>
      <div className="filter-grid">
        <label>
          Channel
          <select value={filters.account} onChange={(e) => update({ account: e.target.value })}>
            <option value="all">All channels</option>
            {accounts.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <label>
          Video type
          <select value={filters.videoType} onChange={(e) => update({ videoType: e.target.value })}>
            <option value="all">All types</option>
            {videoTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          From
          <input
            type="date"
            value={filters.dateFrom}
            min={dateMin}
            max={filters.dateTo}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom}
            max={dateMax}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </label>

        <label>
          Sort by
          <select value={sortField} onChange={(e) => onSortFieldChange(e.target.value as SortField)}>
            <option value="total_views">Views</option>
            <option value="total_likes">Likes</option>
            <option value="title">Title</option>
            <option value="published_at_date">Publish date</option>
          </select>
        </label>

        <label>
          Order
          <select value={sortDirection} onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)}>
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
        </label>
      </div>
    </div>
  );
}
