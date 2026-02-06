/**
 * Theme Provider Component
 * Provides theme context and handles SSR hydration
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeManager } from './index';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  attribute = 'data-theme',
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const themeManager = ThemeManager.getInstance();

    // Initialize theme from storage or default
    const savedTheme = localStorage.getItem(storageKey) as Theme;
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
      ? savedTheme
      : defaultTheme;

    setThemeState(initialTheme);
    setEffectiveTheme(themeManager.getEffectiveTheme());
    themeManager.setTheme(initialTheme);
    setIsLoading(false);

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((newTheme) => {
      setThemeState(newTheme);
      setEffectiveTheme(themeManager.getEffectiveTheme());
    });

    return unsubscribe;
  }, [defaultTheme, storageKey]);

  const setTheme = (newTheme: Theme) => {
    if (!enableSystem && newTheme === 'system') {
      return;
    }
    ThemeManager.getInstance().setTheme(newTheme);
  };

  const toggleTheme = () => {
    const currentEffective = ThemeManager.getInstance().getEffectiveTheme();
    const newTheme = currentEffective === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Theme script for preventing flash of unstyled content (FOUC)
 * This should be included in the document head
 */
export function ThemeScript({
  storageKey = 'theme',
  attribute = 'data-theme',
  defaultTheme = 'system',
}: {
  storageKey?: string;
  attribute?: string;
  defaultTheme?: Theme;
}) {
  const script = `
    (function() {
      try {
        var theme = localStorage.getItem('${storageKey}') || '${defaultTheme}';
        var root = document.documentElement;
        
        if (theme === 'dark') {
          root.setAttribute('${attribute}', 'dark');
        } else if (theme === 'light') {
          root.removeAttribute('${attribute}');
        } else if (theme === 'system') {
          var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            root.setAttribute('${attribute}', 'dark');
          }
        }
      } catch (e) {
        console.warn('Theme script error:', e);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
