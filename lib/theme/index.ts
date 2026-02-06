/**
 * Premium Design System Theme Utilities
 * Provides theme switching, design token access, and TypeScript support
 */

export type Theme = 'light' | 'dark' | 'system';

export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    info: ColorScale;
    gray: ColorScale;
  };
  glass: {
    bg: string;
    bgStrong: string;
    border: string;
    borderStrong: string;
    blur: string;
    blurStrong: string;
  };
  shadows: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    premium: string;
    glow: string;
    glowStrong: string;
  };
  typography: {
    fontFamily: {
      display: string;
      body: string;
      mono: string;
    };
    fontSize: Record<string, string>;
    fontWeight: Record<string, number>;
    lineHeight: Record<string, number>;
  };
  spacing: Record<string, string>;
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
  borderRadius: Record<string, string>;
  zIndex: Record<string, number>;
  breakpoints: Record<string, string>;
}

export interface ColorScale {
  '50': string;
  '100': string;
  '200': string;
  '300': string;
  '400': string;
  '500': string;
  '600': string;
  '700': string;
  '800': string;
  '900': string;
}

/**
 * Theme management utilities
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = 'system';
  private listeners: Set<(theme: Theme) => void> = new Set();

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Initialize theme system
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
    }

    // Apply initial theme
    this.applyTheme(this.currentTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  /**
   * Set theme and persist preference
   */
  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    this.notifyListeners(theme);
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get effective theme (resolves 'system' to actual theme)
   */
  getEffectiveTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Remove existing theme attributes
    root.removeAttribute('data-theme');
    
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.setAttribute('data-theme', 'dark');
      }
    }
  }

  /**
   * Notify theme change listeners
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => listener(theme));
  }
}

/**
 * Get CSS custom property value
 */
export function getCSSVariable(property: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

/**
 * Set CSS custom property value
 */
export function setCSSVariable(property: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(property, value);
}

/**
 * Design token getters
 */
export const tokens = {
  colors: {
    primary: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-primary-${shade}`),
    secondary: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-secondary-${shade}`),
    accent: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-accent-${shade}`),
    success: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-success-${shade}`),
    warning: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-warning-${shade}`),
    error: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-error-${shade}`),
    info: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-info-${shade}`),
    gray: (shade: keyof ColorScale = '500') => getCSSVariable(`--color-gray-${shade}`),
  },
  glass: {
    bg: () => getCSSVariable('--glass-bg'),
    bgStrong: () => getCSSVariable('--glass-bg-strong'),
    border: () => getCSSVariable('--glass-border'),
    borderStrong: () => getCSSVariable('--glass-border-strong'),
    blur: () => getCSSVariable('--glass-blur'),
    blurStrong: () => getCSSVariable('--glass-blur-strong'),
  },
  shadows: {
    xs: () => getCSSVariable('--shadow-xs'),
    sm: () => getCSSVariable('--shadow-sm'),
    md: () => getCSSVariable('--shadow-md'),
    lg: () => getCSSVariable('--shadow-lg'),
    xl: () => getCSSVariable('--shadow-xl'),
    '2xl': () => getCSSVariable('--shadow-2xl'),
    premium: () => getCSSVariable('--shadow-premium'),
    glow: () => getCSSVariable('--shadow-glow'),
    glowStrong: () => getCSSVariable('--shadow-glow-strong'),
  },
  spacing: (scale: string) => getCSSVariable(`--space-${scale}`),
  fontSize: (size: string) => getCSSVariable(`--font-size-${size}`),
  fontWeight: (weight: string) => getCSSVariable(`--font-weight-${weight}`),
  lineHeight: (height: string) => getCSSVariable(`--line-height-${height}`),
  borderRadius: (radius: string) => getCSSVariable(`--radius-${radius}`),
  duration: (duration: string) => getCSSVariable(`--duration-${duration}`),
  easing: (easing: string) => getCSSVariable(`--easing-${easing}`),
  zIndex: (index: string) => getCSSVariable(`--z-${index}`),
  breakpoint: (breakpoint: string) => getCSSVariable(`--breakpoint-${breakpoint}`),
};

/**
 * Animation utilities
 */
export const animations = {
  // Hover effects
  scaleHover: 'hover-scale',
  scaleHoverSm: 'hover-scale-sm',
  glowHover: 'hover-glow',
  
  // Loading states
  shimmer: 'animate-shimmer',
  pulseGlow: 'animate-pulse-glow',
  float: 'animate-float',
  
  // Page transitions
  slideInRight: 'animate-slide-in-right',
  slideInLeft: 'animate-slide-in-left',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
  bounceIn: 'animate-bounce-in',
  
  // Glassmorphism
  glass: 'glass',
  glassStrong: 'glass-strong',
};

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Media query helpers
 */
export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
};

/**
 * Initialize theme system on client side
 */
if (typeof window !== 'undefined') {
  ThemeManager.getInstance().init();
}

// Re-export utilities from other modules
export * from './useTheme';
export * from './ThemeProvider';
export * from './animations';
export * from './responsive';

export default ThemeManager.getInstance();
