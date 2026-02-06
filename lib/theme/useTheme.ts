/**
 * React hook for theme management
 */

'use client';

import { useState, useEffect } from 'react';
import { Theme, ThemeManager } from './index';

export interface UseThemeReturn {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

/**
 * Hook for managing theme state and preferences
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const themeManager = ThemeManager.getInstance();
    
    // Initialize theme state
    setThemeState(themeManager.getTheme());
    setEffectiveTheme(themeManager.getEffectiveTheme());
    setIsLoading(false);

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setThemeState(newTheme);
      setEffectiveTheme(themeManager.getEffectiveTheme());
    });

    return unsubscribe;
  }, []);

  const setTheme = (newTheme: Theme) => {
    ThemeManager.getInstance().setTheme(newTheme);
  };

  const toggleTheme = () => {
    const currentEffective = ThemeManager.getInstance().getEffectiveTheme();
    const newTheme = currentEffective === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isLoading,
  };
}

/**
 * Hook for accessing design tokens
 */
export function useDesignTokens() {
  const { effectiveTheme } = useTheme();
  
  return {
    theme: effectiveTheme,
    // Add token getters that are reactive to theme changes
    getColor: (color: string, shade: string = '500') => {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${color}-${shade}`)
        .trim();
    },
    getSpacing: (scale: string) => {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--space-${scale}`)
        .trim();
    },
    getShadow: (shadow: string) => {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--shadow-${shadow}`)
        .trim();
    },
  };
}

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<string>('sm');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isSmUp: ['sm', 'md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isMdUp: ['md', 'lg', 'xl', '2xl'].includes(breakpoint),
    isLgUp: ['lg', 'xl', '2xl'].includes(breakpoint),
    isXlUp: ['xl', '2xl'].includes(breakpoint),
  };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
