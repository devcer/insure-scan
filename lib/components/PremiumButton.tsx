"use client";

/**
 * PremiumButton Component
 * A premium button component with multiple variants, loading states, and smooth animations
 */

import React from 'react';
import { cn } from '../utils/cn';
import { aria, keyboard } from '../utils/accessibility';

export interface PremiumButtonProps {
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Enable glow effect */
  glow?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** ID of element that describes this button */
  'aria-describedby'?: string;
  /** ID of element controlled by this button */
  'aria-controls'?: string;
  /** Whether button controls an expanded element */
  'aria-expanded'?: boolean;
  /** Whether button is pressed (for toggle buttons) */
  'aria-pressed'?: boolean;
}

/**
 * LoadingSpinner component for button loading states
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * PremiumButton component with variants, loading states, and tactile feedback
 */
export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  glow = false,
  type = 'button',
  className,
  children,
  onClick,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-controls': ariaControls,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed,
}, ref) => {
  const isDisabled = disabled || loading;

  // Handle keyboard activation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (keyboard.isActivationKey(event.key) && onClick && !isDisabled) {
      event.preventDefault();
      onClick(event as any);
    }
  };

  // Base classes for all button variants
  const baseClasses = cn(
    // Layout and structure
    'relative inline-flex items-center justify-center',
    'font-medium text-center',
    'transition-all duration-200 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'active:scale-95',

    // Accessibility
    'min-w-[44px] min-h-[44px]',

    // Border radius based on size
    {
      'rounded-lg': size === 'sm',
      'rounded-xl': size === 'md' || size === 'lg',
      'rounded-2xl': size === 'xl',
    },

    // Padding and sizing based on size
    {
      'px-3 py-1.5 text-sm min-h-[36px]': size === 'sm',
      'px-4 py-2 text-base min-h-[44px]': size === 'md',
      'px-6 py-3 text-lg min-h-[48px]': size === 'lg',
      'px-8 py-4 text-xl min-h-[52px]': size === 'xl',
    },

    // Gap for icon spacing
    {
      'gap-1.5': size === 'sm',
      'gap-2': size === 'md',
      'gap-2.5': size === 'lg',
      'gap-3': size === 'xl',
    },

    // Disabled state
    isDisabled && [
      'opacity-50',
      'cursor-not-allowed',
      'pointer-events-none',
    ],

    // Glow effect
    glow && !isDisabled && 'hover:shadow-glow',

    // Loading state
    loading && 'cursor-wait'
  );

  // Variant-specific classes
  const variantClasses = {
    primary: cn(
      'bg-primary-600 hover:bg-primary-700',
      'text-white',
      'border border-primary-600 hover:border-primary-700',
      'shadow-sm hover:shadow-md',
      'focus:ring-blue-500'
    ),
    secondary: cn(
      'bg-gray-100 hover:bg-gray-200',
      'text-gray-900',
      'border border-gray-300 hover:border-gray-400',
      'shadow-sm hover:shadow-md',
      'focus:ring-gray-500',
      'dark:bg-gray-800 dark:hover:bg-gray-700',
      'dark:text-gray-100',
      'dark:border-gray-600 dark:hover:border-gray-500'
    ),
    ghost: cn(
      'bg-transparent hover:bg-gray-100',
      'text-gray-700 hover:text-gray-900',
      'border border-transparent',
      'focus:ring-gray-500',
      'dark:hover:bg-gray-800',
      'dark:text-gray-300 dark:hover:text-gray-100'
    ),
    glass: cn(
      'glass',
      'text-gray-900 dark:text-gray-100',
      'border-glass-border hover:border-glass-border-strong',
      'hover:bg-glass-bg-strong',
      'focus:ring-blue-500'
    ),
  };

  // Icon size based on button size
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={isDisabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-disabled={isDisabled}
    >
      {/* Left icon or loading spinner */}
      {iconPosition === 'left' && (
        <>
          {loading ? (
            <>
              <LoadingSpinner className={iconSize[size]} />
              <span className="sr-only">Loading...</span>
            </>
          ) : (
            Icon && <Icon className={iconSize[size]} aria-hidden="true" />
          )}
        </>
      )}

      {/* Button content */}
      <span className={cn(loading && 'opacity-70')}>
        {children}
      </span>

      {/* Right icon */}
      {iconPosition === 'right' && !loading && Icon && (
        <Icon className={iconSize[size]} aria-hidden="true" />
      )}
    </button>
  );
});

PremiumButton.displayName = 'PremiumButton';

/**
 * PremiumButtonGroup - Group multiple buttons together
 */
export interface PremiumButtonGroupProps {
  className?: string;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
}

export const PremiumButtonGroup: React.FC<PremiumButtonGroupProps> = ({
  className,
  children,
  orientation = 'horizontal',
}) => (
  <div
    className={cn(
      'inline-flex',
      {
        'flex-row': orientation === 'horizontal',
        'flex-col': orientation === 'vertical',
      },
      '[&>button]:rounded-none',
      '[&>button:first-child]:rounded-l-xl',
      '[&>button:last-child]:rounded-r-xl',
      orientation === 'vertical' && [
        '[&>button:first-child]:rounded-t-xl [&>button:first-child]:rounded-b-none',
        '[&>button:last-child]:rounded-b-xl [&>button:last-child]:rounded-t-none',
      ],
      '[&>button:not(:first-child)]:border-l-0',
      orientation === 'vertical' && '[&>button:not(:first-child)]:border-t-0',
      className
    )}
  >
    {children}
  </div>
);

export default PremiumButton;
