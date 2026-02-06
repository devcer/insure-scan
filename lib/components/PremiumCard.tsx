"use client";

/**
 * PremiumCard Component
 * A premium card component with glassmorphism variants, hover effects, and responsive design
 */

import React from 'react';
import { cn } from '../utils/cn';
import { keyboard } from '../utils/accessibility';

export interface PremiumCardProps {
  /** Card variant style */
  variant?: 'default' | 'glass' | 'elevated';
  /** Card size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Enable hover effects */
  hover?: boolean;
  /** Enable glow effect on hover */
  glow?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Mouse enter handler */
  onMouseEnter?: () => void;
  /** Mouse leave handler */
  onMouseLeave?: () => void;
  /** Draggable state */
  draggable?: boolean;
  /** Drag start handler */
  onDragStart?: (e: React.DragEvent) => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Drag over handler */
  onDragOver?: (e: React.DragEvent) => void;
  /** Drag leave handler */
  onDragLeave?: () => void;
  /** Drop handler */
  onDrop?: (e: React.DragEvent) => void;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
  /** ID of element that describes this card */
  'aria-describedby'?: string;
  /** Role for screen readers */
  role?: string;
}

/**
 * PremiumCard component with glassmorphism effects and smooth animations
 */
export const PremiumCard: React.FC<PremiumCardProps> = ({
  variant = 'default',
  size = 'md',
  hover = true,
  glow = false,
  className,
  children,
  onClick,
  disabled = false,
  style,
  onMouseEnter,
  onMouseLeave,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  role,
}) => {
  // Handle keyboard activation for clickable cards
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (onClick && !disabled && keyboard.isActivationKey(event.key)) {
      event.preventDefault();
      onClick();
    }
  };

  // Base classes for all card variants
  const baseClasses = cn(
    // Layout and structure
    'relative overflow-hidden',
    'transition-all duration-300 ease-smooth',

    // Accessibility
    onClick && 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',

    // Border radius based on size
    {
      'rounded-lg': size === 'sm',
      'rounded-xl': size === 'md',
      'rounded-2xl': size === 'lg' || size === 'xl',
    },

    // Padding based on size
    {
      'p-3': size === 'sm',
      'p-4': size === 'md',
      'p-6': size === 'lg',
      'p-8': size === 'xl',
    },

    // Hover effects
    hover && !disabled && [
      'hover:scale-[1.02]',
      'hover:shadow-premium',
      'cursor-pointer',
    ],

    // Glow effect
    glow && !disabled && 'hover:shadow-glow',

    // Disabled state
    disabled && [
      'opacity-50',
      'cursor-not-allowed',
      'pointer-events-none',
    ],

    // Clickable styling
    onClick && !disabled && 'cursor-pointer'
  );

  // Variant-specific classes
  const variantClasses = {
    default: cn(
      'bg-white dark:bg-gray-800',
      'border border-gray-200 dark:border-gray-700',
      'shadow-sm hover:shadow-md'
    ),
    glass: cn(
      'glass',
      'border-glass-border',
      'hover:border-glass-border-strong'
    ),
    elevated: cn(
      'bg-white dark:bg-gray-800',
      'shadow-premium',
      'border border-transparent',
      'hover:shadow-xl'
    ),
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      role={role || (onClick ? 'button' : undefined)}
      tabIndex={onClick && !disabled ? 0 : undefined}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

/**
 * PremiumCardHeader - Header section for cards
 */
export interface PremiumCardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PremiumCardHeader: React.FC<PremiumCardHeaderProps> = ({
  className,
  children,
}) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
);

/**
 * PremiumCardTitle - Title component for cards
 */
export interface PremiumCardTitleProps {
  className?: string;
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const PremiumCardTitle: React.FC<PremiumCardTitleProps> = ({
  className,
  children,
  as: Component = 'h3',
}) => (
  <Component
    className={cn(
      'text-lg font-semibold text-gray-900 dark:text-gray-100',
      'leading-tight',
      className
    )}
  >
    {children}
  </Component>
);

/**
 * PremiumCardDescription - Description component for cards
 */
export interface PremiumCardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const PremiumCardDescription: React.FC<PremiumCardDescriptionProps> = ({
  className,
  children,
}) => (
  <p
    className={cn(
      'text-sm text-gray-600 dark:text-gray-400',
      'leading-relaxed',
      className
    )}
  >
    {children}
  </p>
);

/**
 * PremiumCardContent - Content section for cards
 */
export interface PremiumCardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const PremiumCardContent: React.FC<PremiumCardContentProps> = ({
  className,
  children,
}) => (
  <div className={cn('space-y-4', className)}>
    {children}
  </div>
);

/**
 * PremiumCardFooter - Footer section for cards
 */
export interface PremiumCardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const PremiumCardFooter: React.FC<PremiumCardFooterProps> = ({
  className,
  children,
}) => (
  <div className={cn('mt-6 pt-4 border-t border-gray-200 dark:border-gray-700', className)}>
    {children}
  </div>
);

export default PremiumCard;
