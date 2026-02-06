"use client";

/**
 * AccessibilityProvider Component
 * Provides accessibility context and utilities throughout the application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { reducedMotion, highContrast, screenReader } from '../utils/accessibility';

interface AccessibilityContextType {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  skipToContent: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const prefersReducedMotion = reducedMotion.useReducedMotion();
  const prefersHighContrast = highContrast.useHighContrast();
  const { announce, message, priority } = screenReader.useLiveRegion();

  const skipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      announce('Skipped to main content');
    }
  };

  // Apply accessibility preferences to document
  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersHighContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  }, [prefersHighContrast]);

  const value: AccessibilityContextType = {
    prefersReducedMotion,
    prefersHighContrast,
    announce,
    skipToContent,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Skip Links */}
      <div className="a11y-focusable">
        <button
          onClick={skipToContent}
          className="skip-link"
          type="button"
        >
          Skip to main content
        </button>
      </div>

      {children}

      {/* Live Region for Announcements */}
      <div
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    </AccessibilityContext.Provider>
  );
};

/**
 * SkipLink Component
 * Provides keyboard navigation shortcuts
 */
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a href={href} className="skip-link">
    {children}
  </a>
);

/**
 * VisuallyHidden Component
 * Hides content visually but keeps it accessible to screen readers
 */
interface VisuallyHiddenProps {
  children: React.ReactNode;
  focusable?: boolean;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  focusable = false
}) => (
  <span className={focusable ? 'sr-only-focusable' : 'sr-only'}>
    {children}
  </span>
);

/**
 * FocusRing Component
 * Provides consistent focus indicators
 */
interface FocusRingProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  children,
  variant = 'primary',
  className = ''
}) => (
  <div className={`focus:outline-none focus:ring-2 focus:ring-${variant === 'primary' ? 'blue' : variant}-500 focus:ring-offset-2 ${className}`}>
    {children}
  </div>
);

/**
 * LiveRegion Component
 * Announces dynamic content changes to screen readers
 */
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  atomic = true
}) => (
  <div
    aria-live={priority}
    aria-atomic={atomic}
    className="sr-only"
  >
    {message}
  </div>
);

/**
 * AccessibilityStatus Component
 * Shows current accessibility preferences (for debugging)
 */
export const AccessibilityStatus: React.FC = () => {
  const { prefersReducedMotion, prefersHighContrast } = useAccessibility();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-2 bg-black text-white text-xs rounded z-50">
      <div>Reduced Motion: {prefersReducedMotion ? 'ON' : 'OFF'}</div>
      <div>High Contrast: {prefersHighContrast ? 'ON' : 'OFF'}</div>
    </div>
  );
};

export default AccessibilityProvider;
