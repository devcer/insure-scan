/**
 * FilterChips Component
 * Animated filter chips with smooth add/remove animations
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface FilterChip {
  id: string;
  label: string;
  value: string;
  type: 'status' | 'type' | 'company' | 'amount' | 'date' | 'custom';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  removable?: boolean;
}

export interface FilterChipsProps {
  /** Active filter chips */
  chips: FilterChip[];
  /** Remove chip handler */
  onRemove?: (chipId: string) => void;
  /** Clear all chips handler */
  onClearAll?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Show clear all button */
  showClearAll?: boolean;
}

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Get chip color classes based on type and color
 */
const getChipColors = (type: FilterChip['type'], color?: FilterChip['color']) => {
  // Use custom color if provided
  if (color) {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-200',
          border: 'border-blue-200 dark:border-blue-700',
          hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
          closeHover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
        };
      case 'green':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-200',
          border: 'border-green-200 dark:border-green-700',
          hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
          closeHover: 'hover:bg-green-200 dark:hover:bg-green-800',
        };
      case 'red':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-200',
          border: 'border-red-200 dark:border-red-700',
          hover: 'hover:bg-red-200 dark:hover:bg-red-900/50',
          closeHover: 'hover:bg-red-200 dark:hover:bg-red-800',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-200',
          border: 'border-yellow-200 dark:border-yellow-700',
          hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
          closeHover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
        };
      case 'purple':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-800 dark:text-purple-200',
          border: 'border-purple-200 dark:border-purple-700',
          hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
          closeHover: 'hover:bg-purple-200 dark:hover:bg-purple-800',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-800 dark:text-gray-200',
          border: 'border-gray-200 dark:border-gray-700',
          hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
          closeHover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
        };
    }
  }

  // Use type-based colors
  switch (type) {
    case 'status':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-700',
        hover: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
        closeHover: 'hover:bg-blue-200 dark:hover:bg-blue-800',
      };
    case 'type':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-800 dark:text-purple-200',
        border: 'border-purple-200 dark:border-purple-700',
        hover: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
        closeHover: 'hover:bg-purple-200 dark:hover:bg-purple-800',
      };
    case 'company':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        border: 'border-green-200 dark:border-green-700',
        hover: 'hover:bg-green-200 dark:hover:bg-green-900/50',
        closeHover: 'hover:bg-green-200 dark:hover:bg-green-800',
      };
    case 'amount':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        border: 'border-yellow-200 dark:border-yellow-700',
        hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
        closeHover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
      };
    case 'date':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-200 dark:border-red-700',
        hover: 'hover:bg-red-200 dark:hover:bg-red-900/50',
        closeHover: 'hover:bg-red-200 dark:hover:bg-red-800',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-200',
        border: 'border-gray-200 dark:border-gray-700',
        hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
        closeHover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
      };
  }
};

/**
 * FilterChips component with smooth animations
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  onRemove,
  onClearAll,
  className,
  showClearAll = true,
}) => {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Filter Chips */}
      {chips.map((chip, index) => {
        const colors = getChipColors(chip.type, chip.color);

        return (
          <div
            key={chip.id}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
              'text-sm font-medium transition-all duration-200',
              'animate-slide-in-right',
              colors.bg,
              colors.text,
              colors.border,
              colors.hover,
              'hover:scale-105 hover:shadow-sm'
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <span className="truncate max-w-[200px]">
              {chip.label}
            </span>

            {chip.removable !== false && onRemove && (
              <button
                onClick={() => onRemove(chip.id)}
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  'transition-all duration-200 hover:scale-110',
                  colors.closeHover
                )}
                aria-label={`Remove ${chip.label} filter`}
              >
                <CloseIcon className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* Clear All Button */}
      {showClearAll && chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-full',
            'text-sm font-medium transition-all duration-200',
            'text-gray-600 dark:text-gray-400',
            'hover:text-gray-800 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'hover:border-gray-400 dark:hover:border-gray-500',
            'hover:scale-105 hover:shadow-sm',
            'animate-slide-in-right'
          )}
          style={{
            animationDelay: `${chips.length * 50}ms`,
          }}
        >
          <CloseIcon className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
};

/**
 * FilterChipManager - Helper component for managing filter state
 */
export interface FilterChipManagerProps {
  /** Available filter options */
  availableFilters: {
    status: string[];
    type: string[];
    company: string[];
  };
  /** Active filters */
  activeFilters: Record<string, string[]>;
  /** Filter change handler */
  onFiltersChange: (filters: Record<string, string[]>) => void;
  /** Additional CSS classes */
  className?: string;
}

export const FilterChipManager: React.FC<FilterChipManagerProps> = ({
  availableFilters,
  activeFilters,
  onFiltersChange,
  className,
}) => {
  // Convert active filters to chips
  const chips: FilterChip[] = [];

  Object.entries(activeFilters).forEach(([filterType, values]) => {
    values.forEach(value => {
      chips.push({
        id: `${filterType}-${value}`,
        label: value,
        value,
        type: filterType as FilterChip['type'],
        removable: true,
      });
    });
  });

  const handleRemoveChip = (chipId: string) => {
    const [filterType, ...valueParts] = chipId.split('-');
    const value = valueParts.join('-');

    const newFilters = { ...activeFilters };
    if (newFilters[filterType]) {
      newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
      if (newFilters[filterType].length === 0) {
        delete newFilters[filterType];
      }
    }

    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  return (
    <FilterChips
      chips={chips}
      onRemove={handleRemoveChip}
      onClearAll={handleClearAll}
      className={className}
    />
  );
};

export default FilterChips;
