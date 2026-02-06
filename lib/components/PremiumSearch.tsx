/**
 * PremiumSearch Component
 * Advanced search bar with smooth focus animations and suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'company' | 'policy' | 'type' | 'status';
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PremiumSearchProps {
  /** Search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search suggestions */
  suggestions?: SearchSuggestion[];
  /** Suggestion select handler */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Auto focus */
  autoFocus?: boolean;
}

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ClearIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * PremiumSearch component with smooth animations and suggestions
 */
export const PremiumSearch: React.FC<PremiumSearchProps> = ({
  value,
  onChange,
  placeholder = "Search policies, companies, or types...",
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  className,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Show suggestions when focused and has value
  useEffect(() => {
    setShowSuggestions(isFocused && (value.length > 0 || suggestions.length > 0));
    setSelectedIndex(-1);
  }, [isFocused, value, suggestions.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onChange(suggestion.text);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const getSuggestionTypeColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'company':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'policy':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'type':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'status':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <SearchIcon className={cn(
            'w-5 h-5 transition-colors duration-200',
            isFocused
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          )} />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            // Base styling
            'w-full pl-12 pr-12 py-4 rounded-2xl border transition-all duration-300',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white text-lg',
            'placeholder-gray-400 dark:placeholder-gray-500',

            // Focus states
            isFocused && [
              'border-blue-500 dark:border-blue-400',
              'ring-2 ring-blue-500/20 dark:ring-blue-400/20',
              'shadow-xl shadow-blue-500/10',
              'scale-[1.02]',
            ],

            // Default states
            !isFocused && [
              'border-gray-300 dark:border-gray-600',
              'hover:border-gray-400 dark:hover:border-gray-500',
              'shadow-lg hover:shadow-xl',
            ]
          )}
        />

        {/* Clear Button */}
        {value && (
          <button
            onClick={handleClear}
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 z-10',
              'w-6 h-6 rounded-full flex items-center justify-center',
              'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              'transition-all duration-200 hover:scale-110'
            )}
            aria-label="Clear search"
          >
            <ClearIcon className="w-4 h-4" />
          </button>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'glass border border-glass-border rounded-2xl shadow-2xl',
            'animate-slide-in-down origin-top',
            'max-h-80 overflow-y-auto'
          )}
        >
          <div className="p-2">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left',
                    'transition-all duration-200',
                    isSelected && [
                      'bg-blue-50 dark:bg-blue-900/20',
                      'border border-blue-200 dark:border-blue-800',
                      'scale-[1.02]',
                    ],
                    !isSelected && [
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      'hover:scale-[1.01]',
                    ]
                  )}
                >
                  {/* Icon */}
                  {Icon && (
                    <div className={cn(
                      'p-2 rounded-lg',
                      getSuggestionTypeColor(suggestion.type)
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.text}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {suggestion.type}
                    </p>
                  </div>

                  {/* Type Badge */}
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getSuggestionTypeColor(suggestion.type)
                  )}>
                    {suggestion.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumSearch;
