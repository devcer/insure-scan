/**
 * Responsive design utilities for the premium design system
 */

import { useState, useEffect } from 'react';

/**
 * Breakpoint definitions
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Generate responsive class names
 */
export function responsive<T extends string>(
  classes: Partial<Record<Breakpoint | 'base', T>>
): string {
  const classNames: string[] = [];
  
  // Add base classes (no prefix)
  if (classes.base) {
    classNames.push(classes.base);
  }
  
  // Add responsive classes with prefixes
  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (breakpoint !== 'base' && className) {
      classNames.push(`${breakpoint}:${className}`);
    }
  });
  
  return classNames.join(' ');
}

/**
 * Container utilities for responsive layouts
 */
export const containers = {
  // Max width containers
  sm: 'max-w-screen-sm mx-auto px-4',
  md: 'max-w-screen-md mx-auto px-6',
  lg: 'max-w-screen-lg mx-auto px-8',
  xl: 'max-w-screen-xl mx-auto px-8',
  '2xl': 'max-w-screen-2xl mx-auto px-8',
  
  // Fluid containers
  fluid: 'w-full px-4 sm:px-6 lg:px-8',
  
  // Custom max-width containers
  narrow: 'max-w-2xl mx-auto px-4',
  wide: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
};

/**
 * Grid system utilities
 */
export const grid = {
  // Basic grid layouts
  cols: (cols: number) => `grid grid-cols-${cols}`,
  
  // Responsive grid layouts
  responsive: (config: Partial<Record<Breakpoint | 'base', number>>) => {
    const classes: string[] = ['grid'];
    
    if (config.base) {
      classes.push(`grid-cols-${config.base}`);
    }
    
    Object.entries(config).forEach(([breakpoint, cols]) => {
      if (breakpoint !== 'base' && cols) {
        classes.push(`${breakpoint}:grid-cols-${cols}`);
      }
    });
    
    return classes.join(' ');
  },
  
  // Gap utilities
  gap: (size: string) => `gap-${size}`,
  gapX: (size: string) => `gap-x-${size}`,
  gapY: (size: string) => `gap-y-${size}`,
  
  // Auto-fit and auto-fill
  autoFit: (minWidth: string) => `grid grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))]`,
  autoFill: (minWidth: string) => `grid grid-cols-[repeat(auto-fill,minmax(${minWidth},1fr))]`,
};

/**
 * Flexbox utilities
 */
export const flex = {
  // Basic flex layouts
  row: 'flex flex-row',
  col: 'flex flex-col',
  wrap: 'flex flex-wrap',
  nowrap: 'flex flex-nowrap',
  
  // Responsive flex direction
  responsive: (config: Partial<Record<Breakpoint | 'base', 'row' | 'col'>>) => {
    const classes: string[] = ['flex'];
    
    if (config.base) {
      classes.push(`flex-${config.base}`);
    }
    
    Object.entries(config).forEach(([breakpoint, direction]) => {
      if (breakpoint !== 'base' && direction) {
        classes.push(`${breakpoint}:flex-${direction}`);
      }
    });
    
    return classes.join(' ');
  },
  
  // Alignment utilities
  center: 'flex items-center justify-center',
  centerX: 'flex justify-center',
  centerY: 'flex items-center',
  between: 'flex justify-between',
  around: 'flex justify-around',
  evenly: 'flex justify-evenly',
  start: 'flex justify-start items-start',
  end: 'flex justify-end items-end',
};

/**
 * Spacing utilities
 */
export const spacing = {
  // Padding utilities
  p: (size: string) => `p-${size}`,
  px: (size: string) => `px-${size}`,
  py: (size: string) => `py-${size}`,
  pt: (size: string) => `pt-${size}`,
  pr: (size: string) => `pr-${size}`,
  pb: (size: string) => `pb-${size}`,
  pl: (size: string) => `pl-${size}`,
  
  // Margin utilities
  m: (size: string) => `m-${size}`,
  mx: (size: string) => `mx-${size}`,
  my: (size: string) => `my-${size}`,
  mt: (size: string) => `mt-${size}`,
  mr: (size: string) => `mr-${size}`,
  mb: (size: string) => `mb-${size}`,
  ml: (size: string) => `ml-${size}`,
  
  // Responsive spacing
  responsive: (
    property: 'p' | 'px' | 'py' | 'pt' | 'pr' | 'pb' | 'pl' | 'm' | 'mx' | 'my' | 'mt' | 'mr' | 'mb' | 'ml',
    config: Partial<Record<Breakpoint | 'base', string>>
  ) => {
    const classes: string[] = [];
    
    if (config.base) {
      classes.push(`${property}-${config.base}`);
    }
    
    Object.entries(config).forEach(([breakpoint, size]) => {
      if (breakpoint !== 'base' && size) {
        classes.push(`${breakpoint}:${property}-${size}`);
      }
    });
    
    return classes.join(' ');
  },
};

/**
 * Typography utilities
 */
export const typography = {
  // Font sizes
  text: (size: string) => `text-${size}`,
  
  // Responsive text sizes
  responsive: (config: Partial<Record<Breakpoint | 'base', string>>) => {
    const classes: string[] = [];
    
    if (config.base) {
      classes.push(`text-${config.base}`);
    }
    
    Object.entries(config).forEach(([breakpoint, size]) => {
      if (breakpoint !== 'base' && size) {
        classes.push(`${breakpoint}:text-${size}`);
      }
    });
    
    return classes.join(' ');
  },
  
  // Font weights
  weight: (weight: string) => `font-${weight}`,
  
  // Line heights
  leading: (height: string) => `leading-${height}`,
  
  // Text alignment
  align: (alignment: 'left' | 'center' | 'right' | 'justify') => `text-${alignment}`,
  
  // Responsive text alignment
  alignResponsive: (config: Partial<Record<Breakpoint | 'base', 'left' | 'center' | 'right' | 'justify'>>) => {
    const classes: string[] = [];
    
    if (config.base) {
      classes.push(`text-${config.base}`);
    }
    
    Object.entries(config).forEach(([breakpoint, alignment]) => {
      if (breakpoint !== 'base' && alignment) {
        classes.push(`${breakpoint}:text-${alignment}`);
      }
    });
    
    return classes.join(' ');
  },
};

/**
 * Media query helpers for CSS-in-JS
 */
export const mediaQueries = {
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  xl: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `@media (min-width: ${BREAKPOINTS['2xl']}px)`,
  
  // Max-width queries
  maxSm: `@media (max-width: ${BREAKPOINTS.sm - 1}px)`,
  maxMd: `@media (max-width: ${BREAKPOINTS.md - 1}px)`,
  maxLg: `@media (max-width: ${BREAKPOINTS.lg - 1}px)`,
  maxXl: `@media (max-width: ${BREAKPOINTS.xl - 1}px)`,
  max2Xl: `@media (max-width: ${BREAKPOINTS['2xl'] - 1}px)`,
  
  // Range queries
  smToMd: `@media (min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`,
  mdToLg: `@media (min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  lgToXl: `@media (min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  xlTo2Xl: `@media (min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS['2xl'] - 1}px)`,
  
  // Special queries
  mobile: `@media (max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  
  // Orientation and device queries
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
  
  // Accessibility queries
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
  darkMode: '@media (prefers-color-scheme: dark)',
  lightMode: '@media (prefers-color-scheme: light)',
};

/**
 * Utility function to check if current viewport matches breakpoint
 */
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);
  
  return matches;
}
