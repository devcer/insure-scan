"use client";

/**
 * PremiumInput Component
 * Premium form inputs with floating labels, smooth focus states, and validation
 */

import React, { useState, useRef, useEffect, useId } from 'react';
import { cn } from '../utils/cn';
import { aria } from '../utils/accessibility';

export interface PremiumInputProps {
  /** Input label */
  label: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'datetime-local';
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  help?: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Additional CSS classes */
  className?: string;
  /** Input name */
  name?: string;
  /** Auto complete */
  autoComplete?: string;
  /** Min value (for number inputs) */
  min?: number;
  /** Max value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number;
}

/**
 * PremiumInput component with floating labels and smooth animations
 */
export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  help,
  icon: Icon,
  iconPosition = 'left',
  className,
  name,
  autoComplete,
  min,
  max,
  step,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();
  const helpId = useId();

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  // Generate ARIA attributes
  const ariaProps = aria.input({
    required,
    invalid: !!error,
    describedBy: [help ? helpId : undefined, error ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined,
    errorId: error ? errorId : undefined,
  });

  return (
    <div className={cn('relative', className)}>
      {/* Input container */}
      <div className="relative">
        {/* Left icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
            <Icon className={cn(
              'w-5 h-5 transition-colors duration-200',
              isFocused
                ? 'text-blue-600 dark:text-blue-400'
                : error
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
            )} aria-hidden="true" />
          </div>
        )}

        {/* Input field */}
        <input
          ref={inputRef}
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          placeholder={isFloating ? placeholder : ''}
          className={cn(
            // Base styling
            'w-full px-4 py-3 rounded-xl border transition-all duration-300',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

            // Icon padding
            Icon && iconPosition === 'left' && 'pl-12',
            Icon && iconPosition === 'right' && 'pr-12',

            // Floating label padding
            'pt-6 pb-2',

            // Focus states
            isFocused && !error && [
              'border-blue-500 dark:border-blue-400',
            ],

            // Error states
            error && [
              'border-red-500 dark:border-red-400',
              'field-error',
            ],

            // Default states
            !isFocused && !error && [
              'border-gray-300 dark:border-gray-600',
              'hover:border-gray-400 dark:hover:border-gray-500',
            ],

            // Disabled states
            disabled && [
              'opacity-50 cursor-not-allowed',
              'bg-gray-50 dark:bg-gray-900',
            ]
          )}
          {...ariaProps}
        />

        {/* Floating label */}
        <label
          htmlFor={inputId}
          className={cn(
            'absolute left-4 transition-all duration-300 pointer-events-none',
            'text-sm font-medium',

            // Icon offset
            Icon && iconPosition === 'left' && 'left-12',

            // Floating position
            isFloating && [
              'top-2 text-xs',
              isFocused && !error && 'text-blue-600 dark:text-blue-400',
              error && 'text-red-500 dark:text-red-400',
              !isFocused && !error && 'text-gray-500 dark:text-gray-400',
            ],

            // Default position
            !isFloating && [
              'top-1/2 -translate-y-1/2',
              'text-gray-500 dark:text-gray-400',
            ]
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>

        {/* Right icon */}
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            <Icon className={cn(
              'w-5 h-5 transition-colors duration-200',
              isFocused
                ? 'text-blue-600 dark:text-blue-400'
                : error
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-400 dark:text-gray-500'
            )} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slide-in-down" role="alert">
          {error}
        </p>
      )}

      {/* Help text */}
      {help && !error && (
        <p id={helpId} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
};

/**
 * PremiumTextarea component with floating labels
 */
export interface PremiumTextareaProps {
  /** Textarea label */
  label: string;
  /** Textarea value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  help?: string;
  /** Number of rows */
  rows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Textarea name */
  name?: string;
}

export const PremiumTextarea: React.FC<PremiumTextareaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  help,
  rows = 3,
  className,
  name,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Textarea container */}
      <div className="relative">
        {/* Textarea field */}
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          rows={rows}
          placeholder={isFloating ? placeholder : ''}
          className={cn(
            // Base styling
            'w-full px-4 py-3 rounded-xl border transition-all duration-300 resize-none',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'placeholder-gray-400 dark:placeholder-gray-500',

            // Floating label padding
            'pt-6 pb-2',

            // Focus states
            isFocused && !error && [
              'border-blue-500 dark:border-blue-400',
              'ring-2 ring-blue-500/20 dark:ring-blue-400/20',
              'shadow-lg shadow-blue-500/10',
            ],

            // Error states
            error && [
              'border-red-500 dark:border-red-400',
              'ring-2 ring-red-500/20 dark:ring-red-400/20',
              'shadow-lg shadow-red-500/10',
            ],

            // Default states
            !isFocused && !error && [
              'border-gray-300 dark:border-gray-600',
              'hover:border-gray-400 dark:hover:border-gray-500',
            ],

            // Disabled states
            disabled && [
              'opacity-50 cursor-not-allowed',
              'bg-gray-50 dark:bg-gray-900',
            ]
          )}
        />

        {/* Floating label */}
        <label
          className={cn(
            'absolute left-4 transition-all duration-300 pointer-events-none',
            'text-sm font-medium',

            // Floating position
            isFloating && [
              'top-2 text-xs',
              isFocused && !error && 'text-blue-600 dark:text-blue-400',
              error && 'text-red-500 dark:text-red-400',
              !isFocused && !error && 'text-gray-500 dark:text-gray-400',
            ],

            // Default position
            !isFloating && [
              'top-4',
              'text-gray-500 dark:text-gray-400',
            ]
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slide-in-down">
          {error}
        </p>
      )}

      {/* Help text */}
      {help && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
};

/**
 * PremiumSelect component with floating labels
 */
export interface PremiumSelectProps {
  /** Select label */
  label: string;
  /** Select value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Select options */
  options: { value: string; label: string }[];
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  help?: string;
  /** Additional CSS classes */
  className?: string;
  /** Select name */
  name?: string;
}

export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  help,
  className,
  name,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Select container */}
      <div className="relative">
        {/* Select field */}
        <select
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={cn(
            // Base styling
            'w-full px-4 py-3 rounded-xl border transition-all duration-300 appearance-none',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',

            // Floating label padding
            'pt-6 pb-2',

            // Focus states
            isFocused && !error && [
              'border-blue-500 dark:border-blue-400',
              'ring-2 ring-blue-500/20 dark:ring-blue-400/20',
              'shadow-lg shadow-blue-500/10',
            ],

            // Error states
            error && [
              'border-red-500 dark:border-red-400',
              'ring-2 ring-red-500/20 dark:ring-red-400/20',
              'shadow-lg shadow-red-500/10',
            ],

            // Default states
            !isFocused && !error && [
              'border-gray-300 dark:border-gray-600',
              'hover:border-gray-400 dark:hover:border-gray-500',
            ],

            // Disabled states
            disabled && [
              'opacity-50 cursor-not-allowed',
              'bg-gray-50 dark:bg-gray-900',
            ]
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Floating label */}
        <label
          className={cn(
            'absolute left-4 transition-all duration-300 pointer-events-none',
            'text-sm font-medium',

            // Floating position
            isFloating && [
              'top-2 text-xs',
              isFocused && !error && 'text-blue-600 dark:text-blue-400',
              error && 'text-red-500 dark:text-red-400',
              !isFocused && !error && 'text-gray-500 dark:text-gray-400',
            ],

            // Default position
            !isFloating && [
              'top-1/2 -translate-y-1/2',
              'text-gray-500 dark:text-gray-400',
            ]
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 animate-slide-in-down">
          {error}
        </p>
      )}

      {/* Help text */}
      {help && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}
    </div>
  );
};

export default PremiumInput;
