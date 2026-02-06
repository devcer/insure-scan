"use client";

/**
 * PremiumNavigation Component
 * A premium sidebar navigation with glassmorphism effects and smooth animations
 */

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../utils/cn';
import { keyboard, screenReader } from '../utils/accessibility';

// Navigation icons (using simple SVG icons for now)
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const PoliciesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EmailsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface PremiumNavigationProps {
  /** Navigation items */
  items?: NavigationItem[];
  /** Logout handler */
  onLogout?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const defaultNavigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: DashboardIcon,
  },
  {
    label: 'Policies',
    href: '/policies',
    icon: PoliciesIcon,
  },
  {
    label: 'Emails',
    href: '/emails',
    icon: EmailsIcon,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

/**
 * PremiumNavigation - Glassmorphism sidebar navigation with smooth animations
 */
export const PremiumNavigation: React.FC<PremiumNavigationProps> = ({
  items = defaultNavigationItems,
  onLogout,
  className,
}) => {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navId = useId();
  const { announce } = screenReader.useLiveRegion();

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
      announce('Navigation menu closed');
    }
  }, [pathname, isMobileOpen, announce]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === keyboard.keys.ESCAPE && isMobileOpen) {
        setIsMobileOpen(false);
        announce('Navigation menu closed');
      }
    };

    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileOpen, announce]);

  const handleMobileToggle = () => {
    const newState = !isMobileOpen;
    setIsMobileOpen(newState);
    announce(newState ? 'Navigation menu opened' : 'Navigation menu closed');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={handleMobileToggle}
        className={cn(
          'fixed top-4 left-4 z-50 lg:hidden',
          'w-12 h-12 rounded-xl',
          'glass hover:glass-strong',
          'flex items-center justify-center',
          'text-gray-700 dark:text-gray-300',
          'hover:text-blue-600 dark:hover:text-blue-400',
          'transition-all duration-300 ease-smooth',
          'hover:scale-105 hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]'
        )}
        aria-label={isMobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileOpen}
        aria-controls={navId}
        type="button"
      >
        <MenuIcon className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => {
            setIsMobileOpen(false);
            announce('Navigation menu closed');
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        id={navId}
        className={cn(
          // Base positioning and sizing
          'fixed left-0 top-0 h-full w-64 z-50',

          // Glassmorphism styling
          'glass border-r border-glass-border',

          // Mobile responsive behavior
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',

          // Smooth transitions
          'transition-transform duration-300 ease-smooth',

          // Animation on mobile
          'lg:animate-none',
          isMobileOpen && 'animate-slide-in-left',

          className
        )}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Header Section */}
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <DashboardIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                InsureScan
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                announce('Navigation menu closed');
              }}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]"
              aria-label="Close navigation menu"
              type="button"
            >
              <CloseIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-6">
          <ul className="space-y-2" role="list">
            {items.map((item, index) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href} role="listitem">
                  <Link
                    href={item.href}
                    className={cn(
                      // Base styling
                      'flex items-center gap-3 px-4 py-3 rounded-xl',
                      'font-medium text-sm',
                      'transition-all duration-300 ease-smooth',
                      'group relative overflow-hidden',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]',

                      // Active state
                      isActive && [
                        'bg-blue-600 text-white shadow-lg',
                        'scale-[1.02]',
                        'shadow-blue-500/30',
                      ],

                      // Inactive state
                      !isActive && [
                        'text-gray-600 dark:text-gray-300',
                        'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400',
                        'hover:scale-[1.01] hover:shadow-sm',
                      ]
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Background animation on hover */}
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-xl',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                      isActive && 'opacity-0'
                    )} aria-hidden="true" />

                    {/* Icon */}
                    <Icon className="w-5 h-5 relative z-10" aria-hidden="true" />

                    {/* Label */}
                    <span className="relative z-10">{item.label}</span>

                    {/* Badge */}
                    {item.badge && (
                      <span
                        className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full relative z-10 animate-pulse-glow"
                        aria-label={`${item.badge} notifications`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer Section */}
        {onLogout && (
          <div className="p-6 border-t border-glass-border">
            <button
              onClick={onLogout}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl w-full',
                'font-medium text-sm',
                'text-gray-600 dark:text-gray-300',
                'hover:bg-red-50 dark:hover:bg-red-900/20',
                'hover:text-red-600 dark:hover:text-red-400',
                'transition-all duration-300 ease-smooth',
                'hover:scale-[1.01] hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]'
              )}
              type="button"
              aria-label="Sign out of your account"
            >
              <LogoutIcon className="w-5 h-5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default PremiumNavigation;
