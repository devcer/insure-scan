/**
 * PremiumFilters Component
 * Advanced filtering system with animated transitions and smooth interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { PremiumButton } from './PremiumButton';
import { FilterChips, FilterChip } from './FilterChips';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'single' | 'multiple';
  options: FilterOption[];
}

export interface PremiumFiltersProps {
  /** Filter groups */
  filterGroups: FilterGroup[];
  /** Active filters */
  activeFilters: Record<string, string[]>;
  /** Filter change handler */
  onFiltersChange: (filters: Record<string, string[]>) => void;
  /** Show filter button */
  showFilterButton?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode */
  compact?: boolean;
}

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * PremiumFilters component with advanced filtering capabilities
 */
export const PremiumFilters: React.FC<PremiumFiltersProps> = ({
  filterGroups,
  activeFilters,
  onFiltersChange,
  showFilterButton = true,
  className,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize expanded groups
  useEffect(() => {
    if (filterGroups.length > 0) {
      setExpandedGroups(new Set(filterGroups.slice(0, 2).map(g => g.id)));
    }
  }, [filterGroups]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Get active filter count
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0
  );

  // Convert active filters to chips
  const activeChips: FilterChip[] = [];
  Object.entries(activeFilters).forEach(([groupId, values]) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (!group) return;

    values.forEach(value => {
      const option = group.options.find(o => o.value === value);
      if (option) {
        activeChips.push({
          id: `${groupId}-${value}`,
          label: option.label,
          value,
          type: groupId as FilterChip['type'],
          removable: true,
        });
      }
    });
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleFilterChange = (groupId: string, value: string, checked: boolean) => {
    const group = filterGroups.find(g => g.id === groupId);
    if (!group) return;

    const newFilters = { ...activeFilters };

    if (group.type === 'single') {
      // Single selection - replace existing values
      if (checked) {
        newFilters[groupId] = [value];
      } else {
        delete newFilters[groupId];
      }
    } else {
      // Multiple selection - add/remove from array
      if (!newFilters[groupId]) {
        newFilters[groupId] = [];
      }

      if (checked) {
        if (!newFilters[groupId].includes(value)) {
          newFilters[groupId] = [...newFilters[groupId], value];
        }
      } else {
        newFilters[groupId] = newFilters[groupId].filter(v => v !== value);
        if (newFilters[groupId].length === 0) {
          delete newFilters[groupId];
        }
      }
    }

    onFiltersChange(newFilters);
  };

  const handleRemoveChip = (chipId: string) => {
    const [groupId, ...valueParts] = chipId.split('-');
    const value = valueParts.join('-');
    handleFilterChange(groupId, value, false);
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  if (compact) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Active Filter Chips */}
        <FilterChips
          chips={activeChips}
          onRemove={handleRemoveChip}
          onClearAll={handleClearAll}
        />

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {filterGroups.slice(0, 1).map(group => (
            <div key={group.id} className="flex gap-2">
              {group.options.slice(0, 4).map(option => {
                const isActive = activeFilters[group.id]?.includes(option.value) || false;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(group.id, option.value, !isActive)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                      'border hover:scale-105',
                      isActive && [
                        'bg-blue-100 dark:bg-blue-900/30',
                        'text-blue-800 dark:text-blue-200',
                        'border-blue-200 dark:border-blue-700',
                      ],
                      !isActive && [
                        'bg-white dark:bg-gray-800',
                        'text-gray-700 dark:text-gray-300',
                        'border-gray-300 dark:border-gray-600',
                        'hover:bg-gray-50 dark:hover:bg-gray-700',
                      ]
                    )}
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-1 opacity-75">({option.count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Filter Button */}
      {showFilterButton && (
        <PremiumButton
          ref={buttonRef}
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          icon={FilterIcon}
          className={cn(
            'relative',
            activeFilterCount > 0 && 'ring-2 ring-blue-500/20'
          )}
        >
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse-glow">
              {activeFilterCount}
            </span>
          )}
        </PremiumButton>
      )}

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="mt-4">
          <FilterChips
            chips={activeChips}
            onRemove={handleRemoveChip}
            onClearAll={handleClearAll}
          />
        </div>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            'absolute top-full left-0 mt-2 w-80 z-50',
            'glass border border-glass-border rounded-2xl shadow-2xl',
            'animate-slide-in-down origin-top'
          )}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filterGroups.map((group, groupIndex) => {
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <div
                    key={group.id}
                    className="animate-slide-in-up"
                    style={{
                      animationDelay: `${groupIndex * 100}ms`,
                    }}
                  >
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition-colors"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {group.label}
                      </span>
                      <ChevronDownIcon
                        className={cn(
                          'w-4 h-4 text-gray-500 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Group Options */}
                    {isExpanded && (
                      <div className="mt-2 space-y-2 animate-slide-in-down">
                        {group.options.map((option, optionIndex) => {
                          const isActive = activeFilters[group.id]?.includes(option.value) || false;

                          return (
                            <label
                              key={option.value}
                              className={cn(
                                'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200',
                                'hover:bg-gray-50 dark:hover:bg-gray-800',
                                'animate-slide-in-right'
                              )}
                              style={{
                                animationDelay: `${optionIndex * 50}ms`,
                              }}
                            >
                              <input
                                type={group.type === 'single' ? 'radio' : 'checkbox'}
                                name={group.type === 'single' ? group.id : undefined}
                                checked={isActive}
                                onChange={(e) => handleFilterChange(group.id, option.value, e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                {option.label}
                              </span>
                              {option.count !== undefined && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {option.count}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumFilters;
