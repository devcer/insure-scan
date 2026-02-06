/**
 * PremiumEmailFilters Component
 * Premium email filtering and search with animated filter chips
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { PremiumButton } from './PremiumButton';
import { PremiumSearch } from './PremiumSearch';

export interface EmailFilter {
  id: string;
  label: string;
  count?: number;
  active: boolean;
}

export interface PremiumEmailFiltersProps {
  /** Search query */
  searchQuery?: string;
  /** Search change handler */
  onSearchChange?: (query: string) => void;
  /** Available filters */
  filters?: EmailFilter[];
  /** Filter change handler */
  onFilterChange?: (filterId: string, active: boolean) => void;
  /** Clear all filters handler */
  onClearFilters?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Filter chip component with smooth animations
 */
const FilterChip: React.FC<{
  filter: EmailFilter;
  onToggle: (id: string, active: boolean) => void;
}> = ({ filter, onToggle }) => {
  return (
    <button
      onClick={() => onToggle(filter.id, !filter.active)}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
        'transition-all duration-200 ease-smooth',
        'border border-transparent',
        'hover:scale-105 active:scale-95',
        filter.active
          ? [
            'bg-primary-100 text-primary-800 border-primary-200',
            'dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700',
            'shadow-sm hover:shadow-md',
          ]
          : [
            'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          ]
      )}
    >
      <span>{filter.label}</span>
      {filter.count !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs font-semibold',
            filter.active
              ? 'bg-primary-200 text-primary-800 dark:bg-primary-800 dark:text-primary-200'
              : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          )}
        >
          {filter.count}
        </span>
      )}

      {filter.active && (
        <svg
          className="w-4 h-4 ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </button>
  );
};

/**
 * Quick filter buttons for common actions
 */
const QuickFilters: React.FC<{
  onFilter: (type: string) => void;
}> = ({ onFilter }) => {
  const quickFilters = [
    { id: 'unread', label: 'Unread', icon: '📧' },
    { id: 'important', label: 'Important', icon: '⭐' },
    { id: 'attachments', label: 'Attachments', icon: '📎' },
    { id: 'today', label: 'Today', icon: '📅' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {quickFilters.map((filter) => (
        <PremiumButton
          key={filter.id}
          variant="ghost"
          size="sm"
          onClick={() => onFilter(filter.id)}
          className="text-xs"
        >
          <span className="mr-1">{filter.icon}</span>
          {filter.label}
        </PremiumButton>
      ))}
    </div>
  );
};

/**
 * PremiumEmailFilters component with search and animated filter chips
 */
export const PremiumEmailFilters: React.FC<PremiumEmailFiltersProps> = ({
  searchQuery = '',
  onSearchChange,
  filters = [],
  onFilterChange,
  onClearFilters,
  className,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = filters.filter(f => f.active).length;

  const handleQuickFilter = (type: string) => {
    // Handle quick filter logic
    switch (type) {
      case 'unread':
        onFilterChange?.('unread', true);
        break;
      case 'important':
        onFilterChange?.('important', true);
        break;
      case 'attachments':
        onFilterChange?.('attachments', true);
        break;
      case 'today':
        onFilterChange?.('today', true);
        break;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <PremiumSearch
            value={searchQuery}
            onChange={onSearchChange || (() => { })}
            placeholder="Search emails..."
            className="w-full"
          />
        </div>

        {/* Advanced filters toggle */}
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'transition-colors duration-200',
            showAdvanced && 'text-primary-600 dark:text-primary-400'
          )}
        >
          <svg
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              showAdvanced && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 rounded-full text-xs font-semibold">
              {activeFiltersCount}
            </span>
          )}
        </PremiumButton>
      </div>

      {/* Quick filters */}
      <QuickFilters onFilter={handleQuickFilter} />

      {/* Advanced filters */}
      {showAdvanced && (
        <div
          className={cn(
            'space-y-3 p-4 rounded-xl',
            'bg-gray-50 dark:bg-gray-800/50',
            'border border-gray-200 dark:border-gray-700',
            'animate-in slide-in-from-top-2 fade-in duration-200'
          )}
        >
          {/* Filter chips */}
          {filters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by:
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <FilterChip
                    key={filter.id}
                    filter={filter}
                    onToggle={onFilterChange || (() => { })}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Clear filters */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <PremiumButton
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Clear all filters
              </PremiumButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PremiumEmailFilters;
