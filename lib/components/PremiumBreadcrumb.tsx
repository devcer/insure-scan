/**
 * PremiumBreadcrumb Component
 * A premium breadcrumb navigation with smooth transitions and responsive behavior
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../utils/cn';

// Chevron right icon
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Home icon
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Navigation href */
  href?: string;
  /** Whether this item is the current page */
  current?: boolean;
  /** Custom icon component */
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PremiumBreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Separator between items */
  separator?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Maximum items to show before collapsing */
  maxItems?: number;
}

/**
 * Generate breadcrumb items from current pathname
 */
export const useBreadcrumbFromPath = (
  pathMap?: Record<string, string>
): BreadcrumbItem[] => {
  const pathname = usePathname();

  const defaultPathMap = {
    '/dashboard': 'Dashboard',
    '/policies': 'Policies',
    '/emails': 'Emails',
    '/settings': 'Settings',
  };

  const combinedPathMap: Record<string, string> = { ...defaultPathMap, ...pathMap };

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  // Add home/root item
  items.push({
    label: 'Home',
    href: '/dashboard',
    icon: HomeIcon,
  });

  // Build breadcrumb items from path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    items.push({
      label: combinedPathMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
      current: isLast,
    });
  });

  return items;
};

/**
 * PremiumBreadcrumb - Premium breadcrumb navigation with smooth transitions
 */
export const PremiumBreadcrumb: React.FC<PremiumBreadcrumbProps> = ({
  items,
  showHomeIcon = true,
  separator,
  className,
  maxItems = 5,
}) => {
  // Handle item collapsing if there are too many items
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Keep first item, last 2 items, and add ellipsis
    const firstItem = items[0];
    const lastItems = items.slice(-2);
    const ellipsisItem: BreadcrumbItem = {
      label: '...',
      current: false,
    };

    return [firstItem, ellipsisItem, ...lastItems];
  }, [items, maxItems]);

  const defaultSeparator = (
    <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-2" />
  );

  return (
    <nav
      className={cn(
        'flex items-center space-x-1 text-sm',
        'animate-fade-in',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';
          const Icon = item.icon;

          return (
            <li key={`${item.href}-${index}`} className="flex items-center">
              {/* Breadcrumb Item */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                  'transition-all duration-300 ease-smooth',

                  // Current page styling
                  item.current && [
                    'bg-primary-50 dark:bg-primary-900/20',
                    'text-primary-700 dark:text-primary-300',
                    'font-medium',
                  ],

                  // Clickable item styling
                  item.href && !item.current && [
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'hover:text-primary-600 dark:hover:text-primary-400',
                    'cursor-pointer',
                    'hover:scale-105',
                  ],

                  // Non-clickable item styling
                  !item.href && !item.current && [
                    'text-gray-500 dark:text-gray-400',
                  ],

                  // Ellipsis styling
                  isEllipsis && [
                    'text-gray-400 dark:text-gray-500',
                    'cursor-default',
                  ]
                )}
              >
                {/* Icon */}
                {Icon && showHomeIcon && index === 0 && (
                  <Icon className="w-4 h-4" />
                )}

                {/* Label */}
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    className="hover:underline transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </div>

              {/* Separator */}
              {!isLast && (
                <div className="flex items-center animate-fade-in">
                  {separator || defaultSeparator}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * PremiumBreadcrumbAuto - Auto-generated breadcrumb from current path
 */
export interface PremiumBreadcrumbAutoProps {
  /** Custom path to label mapping */
  pathMap?: Record<string, string>;
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum items to show before collapsing */
  maxItems?: number;
}

export const PremiumBreadcrumbAuto: React.FC<PremiumBreadcrumbAutoProps> = ({
  pathMap,
  showHomeIcon = true,
  className,
  maxItems = 5,
}) => {
  const items = useBreadcrumbFromPath(pathMap);

  return (
    <PremiumBreadcrumb
      items={items}
      showHomeIcon={showHomeIcon}
      className={className}
      maxItems={maxItems}
    />
  );
};

export default PremiumBreadcrumb;
