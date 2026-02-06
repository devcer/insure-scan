/**
 * DashboardStatsCard Component
 * Premium statistics card with glassmorphism effects, counter animations, and hover details
 */

import React, { useEffect, useState } from 'react';
import { PremiumCard } from './PremiumCard';
import { cn } from '../utils/cn';

export interface DashboardStatsCardProps {
  /** Card title */
  title: string;
  /** Main statistic value */
  value: number;
  /** Secondary information */
  subtitle?: string;
  /** Icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Status color variant */
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Additional details shown on hover */
  hoverDetails?: string;
  /** Loading state */
  loading?: boolean;
  /** Format value as currency */
  currency?: boolean;
  /** Format value as percentage */
  percentage?: boolean;
  /** Custom value formatter */
  formatter?: (value: number) => string;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Mouse enter handler */
  onMouseEnter?: () => void;
  /** Mouse leave handler */
  onMouseLeave?: () => void;
}

/**
 * Counter animation hook
 */
const useCounterAnimation = (end: number, duration: number = 2000, enabled: boolean = true) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(end);
      return;
    }

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Use easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, enabled]);

  return count;
};

/**
 * Default value formatter
 */
const defaultFormatter = (value: number, currency?: boolean, percentage?: boolean): string => {
  if (percentage) {
    return `${value}%`;
  }
  if (currency) {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return value.toLocaleString('en-IN');
};

/**
 * Status color mappings
 */
const statusColors = {
  default: {
    icon: 'text-primary-600 dark:text-primary-400',
    accent: 'bg-primary-100 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
  success: {
    icon: 'text-success-600 dark:text-success-400',
    accent: 'bg-success-100 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]',
  },
  warning: {
    icon: 'text-warning-600 dark:text-warning-400',
    accent: 'bg-warning-100 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-800',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
  error: {
    icon: 'text-error-600 dark:text-error-400',
    accent: 'bg-error-100 dark:bg-error-900/20',
    border: 'border-error-200 dark:border-error-800',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  },
  info: {
    icon: 'text-info-600 dark:text-info-400',
    accent: 'bg-info-100 dark:bg-info-900/20',
    border: 'border-info-200 dark:border-info-800',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
};

/**
 * DashboardStatsCard component with premium styling and animations
 */
export const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  status = 'default',
  hoverDetails,
  loading = false,
  currency = false,
  percentage = false,
  formatter,
  animationDuration = 2000,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const animatedValue = useCounterAnimation(value, animationDuration, !loading);
  const colors = statusColors[status];

  const formatValue = (val: number): string => {
    if (formatter) return formatter(val);
    return defaultFormatter(val, currency, percentage);
  };

  if (loading) {
    return (
      <PremiumCard variant="glass" className={cn('group relative', className)}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard
      variant="glass"
      hover={true}
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        colors.glow,
        className
      )}
      style={style}
      onMouseEnter={onMouseEnter || (() => setShowDetails(true))}
      onMouseLeave={onMouseLeave || (() => setShowDetails(false))}
    >
      {/* Background accent */}
      <div className={cn(
        'absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-8 translate-x-8 transition-all duration-500 group-hover:scale-150',
        colors.accent
      )} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-300">
          {title}
        </h3>
        {Icon && (
          <div className={cn(
            'p-2 rounded-xl transition-all duration-300 group-hover:scale-110',
            colors.accent,
            colors.border,
            'border'
          )}>
            <Icon className={cn('w-5 h-5 transition-colors duration-300', colors.icon)} />
          </div>
        )}
      </div>

      {/* Main Value */}
      <div className="relative z-10">
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-all duration-300 group-hover:scale-105">
          {formatValue(animatedValue)}
        </p>

        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
            {subtitle}
          </p>
        )}
      </div>

      {/* Hover Details */}
      {hoverDetails && (
        <div className={cn(
          'absolute inset-x-0 bottom-0 p-4 glass-strong transform transition-all duration-300 ease-smooth',
          showDetails ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        )}>
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            {hoverDetails}
          </p>
        </div>
      )}

      {/* Status Indicator */}
      <div className={cn(
        'absolute top-4 left-4 w-1 h-8 rounded-full transition-all duration-300 group-hover:h-12',
        colors.accent.replace('bg-', 'bg-').replace('/20', '')
      )} />
    </PremiumCard>
  );
};

export default DashboardStatsCard;
