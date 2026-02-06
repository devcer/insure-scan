/**
 * PremiumLayout Component
 * A premium layout wrapper with glassmorphism navigation and breadcrumbs
 */

import React from 'react';
import { signOut } from 'next-auth/react';
import { cn } from '../utils/cn';
import { PremiumNavigation, NavigationItem } from './PremiumNavigation';
import { PremiumBreadcrumbAuto } from './PremiumBreadcrumb';

export interface PremiumLayoutProps {
  /** Layout content */
  children: React.ReactNode;
  /** Custom navigation items */
  navigationItems?: NavigationItem[];
  /** Show breadcrumb navigation */
  showBreadcrumb?: boolean;
  /** Custom breadcrumb path mapping */
  breadcrumbPathMap?: Record<string, string>;
  /** Additional CSS classes for main content */
  className?: string;
  /** Additional CSS classes for content container */
  contentClassName?: string;
}

/**
 * PremiumLayout - Premium layout with glassmorphism navigation
 */
export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  children,
  navigationItems,
  showBreadcrumb = true,
  breadcrumbPathMap,
  className,
  contentClassName,
}) => {
  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100',
      'dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
      'transition-colors duration-300 ease-smooth',
      className
    )}>
      {/* Premium Navigation */}
      <PremiumNavigation
        items={navigationItems}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className={cn(
        'lg:ml-64', // Add left margin to account for 256px (w-64) sidebar
        'min-h-screen',
        'transition-all duration-300 ease-smooth'
      )}>
        {/* Content Container */}
        <div className={cn(
          'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          'py-6 lg:py-8',
          contentClassName
        )}>
          {/* Breadcrumb Navigation */}
          {showBreadcrumb && (
            <div className="mb-6">
              <PremiumBreadcrumbAuto
                pathMap={breadcrumbPathMap}
                className="animate-slide-in-down"
              />
            </div>
          )}

          {/* Page Content */}
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PremiumLayout;
