"use client";

/**
 * Accessibility utilities for the premium design system
 * Provides ARIA helpers, keyboard navigation, screen reader support, and color contrast utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * ARIA attribute helpers
 */
export const aria = {
  /**
   * Generate ARIA attributes for buttons
   */
  button: (props: {
    label?: string;
    pressed?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    describedBy?: string;
    controls?: string;
  }) => ({
    'aria-label': props.label,
    'aria-pressed': props.pressed,
    'aria-expanded': props.expanded,
    'aria-disabled': props.disabled,
    'aria-describedby': props.describedBy,
    'aria-controls': props.controls,
    role: 'button',
    tabIndex: props.disabled ? -1 : 0,
  }),

  /**
   * Generate ARIA attributes for form inputs
   */
  input: (props: {
    label?: string;
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
    errorId?: string;
  }) => ({
    'aria-label': props.label,
    'aria-required': props.required,
    'aria-invalid': props.invalid,
    'aria-describedby': [props.describedBy, props.invalid ? props.errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined,
  }),

  /**
   * Generate ARIA attributes for navigation
   */
  navigation: (props: {
    label?: string;
    current?: boolean;
  }) => ({
    'aria-label': props.label,
    'aria-current': props.current ? 'page' : undefined,
    role: 'navigation',
  }),

  /**
   * Generate ARIA attributes for modals
   */
  modal: (props: {
    labelledBy?: string;
    describedBy?: string;
  }) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': props.labelledBy,
    'aria-describedby': props.describedBy,
    tabIndex: -1,
  }),

  /**
   * Generate ARIA attributes for live regions
   */
  liveRegion: (props: {
    polite?: boolean;
    atomic?: boolean;
  }) => ({
    'aria-live': props.polite ? 'polite' : 'assertive',
    'aria-atomic': props.atomic,
    role: 'status',
  }),

  /**
   * Generate ARIA attributes for lists
   */
  list: (props: {
    label?: string;
    itemCount?: number;
  }) => ({
    'aria-label': props.label,
    'aria-setsize': props.itemCount,
    role: 'list',
  }),

  /**
   * Generate ARIA attributes for list items
   */
  listItem: (props: {
    position?: number;
    setSize?: number;
    selected?: boolean;
  }) => ({
    'aria-posinset': props.position,
    'aria-setsize': props.setSize,
    'aria-selected': props.selected,
    role: 'listitem',
  }),
};

/**
 * Keyboard navigation utilities
 */
export const keyboard = {
  /**
   * Standard key codes
   */
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },

  /**
   * Check if key is an activation key (Enter or Space)
   */
  isActivationKey: (key: string): boolean => {
    return key === keyboard.keys.ENTER || key === keyboard.keys.SPACE;
  },

  /**
   * Check if key is an arrow key
   */
  isArrowKey: (key: string): boolean => {
    return [
      keyboard.keys.ARROW_UP,
      keyboard.keys.ARROW_DOWN,
      keyboard.keys.ARROW_LEFT,
      keyboard.keys.ARROW_RIGHT,
    ].includes(key);
  },

  /**
   * Handle keyboard activation (Enter/Space)
   */
  handleActivation: (event: React.KeyboardEvent, callback: () => void) => {
    if (keyboard.isActivationKey(event.key)) {
      event.preventDefault();
      callback();
    }
  },

  /**
   * Handle arrow key navigation
   */
  handleArrowNavigation: (
    event: React.KeyboardEvent,
    options: {
      onUp?: () => void;
      onDown?: () => void;
      onLeft?: () => void;
      onRight?: () => void;
      preventDefault?: boolean;
    }
  ) => {
    const { onUp, onDown, onLeft, onRight, preventDefault = true } = options;

    switch (event.key) {
      case keyboard.keys.ARROW_UP:
        if (preventDefault) event.preventDefault();
        onUp?.();
        break;
      case keyboard.keys.ARROW_DOWN:
        if (preventDefault) event.preventDefault();
        onDown?.();
        break;
      case keyboard.keys.ARROW_LEFT:
        if (preventDefault) event.preventDefault();
        onLeft?.();
        break;
      case keyboard.keys.ARROW_RIGHT:
        if (preventDefault) event.preventDefault();
        onRight?.();
        break;
    }
  },
};

/**
 * Focus management utilities
 */
export const focus = {
  /**
   * Focus trap for modals and dropdowns
   */
  useFocusTrap: (isActive: boolean) => {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      };

      // Focus first element
      firstElement?.focus();

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }, [isActive]);

    return containerRef;
  },

  /**
   * Restore focus to previous element
   */
  useRestoreFocus: () => {
    const previousActiveElement = useRef<HTMLElement | null>(null);

    const saveFocus = useCallback(() => {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }, []);

    const restoreFocus = useCallback(() => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    }, []);

    return { saveFocus, restoreFocus };
  },

  /**
   * Manage focus for roving tabindex
   */
  useRovingTabIndex: (items: HTMLElement[], activeIndex: number) => {
    useEffect(() => {
      items.forEach((item, index) => {
        if (index === activeIndex) {
          item.setAttribute('tabindex', '0');
          item.focus();
        } else {
          item.setAttribute('tabindex', '-1');
        }
      });
    }, [items, activeIndex]);
  },
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Hook for managing live region announcements
   */
  useLiveRegion: () => {
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

    const announce = useCallback((text: string, level: 'polite' | 'assertive' = 'polite') => {
      setMessage(text);
      setPriority(level);
      
      // Clear message after announcement
      setTimeout(() => setMessage(''), 100);
    }, []);

    return { announce, message, priority };
  },

  /**
   * Screen reader only text utility
   */
  createScreenReaderText: (text: string) => ({
    className: 'sr-only',
    children: text,
  }),
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (hex: string): number => {
    const rgb = colorContrast.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Convert hex color to RGB
   */
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = colorContrast.getLuminance(color1);
    const lum2 = colorContrast.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG AA standards
   */
  meetsWCAG_AA: (foreground: string, background: string): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return ratio >= 4.5;
  },

  /**
   * Check if color combination meets WCAG AAA standards
   */
  meetsWCAG_AAA: (foreground: string, background: string): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    return ratio >= 7;
  },

  /**
   * Get accessible text color for background
   */
  getAccessibleTextColor: (backgroundColor: string): string => {
    const whiteRatio = colorContrast.getContrastRatio('#ffffff', backgroundColor);
    const blackRatio = colorContrast.getContrastRatio('#000000', backgroundColor);
    return whiteRatio > blackRatio ? '#ffffff' : '#000000';
  },
};

/**
 * Touch target utilities
 */
export const touchTarget = {
  /**
   * Minimum touch target size (44px x 44px per WCAG)
   */
  MIN_SIZE: 44,

  /**
   * Check if element meets minimum touch target size
   */
  meetsMinimumSize: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= touchTarget.MIN_SIZE && rect.height >= touchTarget.MIN_SIZE;
  },

  /**
   * CSS classes for minimum touch targets
   */
  classes: {
    minSize: 'min-w-[44px] min-h-[44px]',
    touchFriendly: 'min-w-[44px] min-h-[44px] flex items-center justify-center',
  },
};

/**
 * Reduced motion utilities
 */
export const reducedMotion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Hook to detect reduced motion preference
   */
  useReducedMotion: (): boolean => {
    const [prefersReduced, setPrefersReduced] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReduced(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersReduced;
  },

  /**
   * Conditional animation classes based on motion preference
   */
  conditionalAnimation: (animationClass: string, fallbackClass: string = ''): string => {
    return reducedMotion.prefersReducedMotion() ? fallbackClass : animationClass;
  },
};

/**
 * High contrast utilities
 */
export const highContrast = {
  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  /**
   * Hook to detect high contrast preference
   */
  useHighContrast: (): boolean => {
    const [prefersHigh, setPrefersHigh] = useState(false);

    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-contrast: high)');
      setPrefersHigh(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersHigh(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return prefersHigh;
  },
};

/**
 * Accessibility testing utilities
 */
export const a11yTest = {
  /**
   * Check if element has accessible name
   */
  hasAccessibleName: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim() ||
      element.getAttribute('title')
    );
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
      element.tagName.toLowerCase()
    );
    const hasTabIndex = tabIndex !== null && tabIndex !== '-1';
    
    return isInteractive || hasTabIndex;
  },

  /**
   * Validate ARIA attributes
   */
  validateAria: (element: HTMLElement): string[] => {
    const errors: string[] = [];
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');

    // Check for required accessible name
    if (role === 'button' && !ariaLabel && !ariaLabelledBy && !element.textContent?.trim()) {
      errors.push('Button elements must have an accessible name');
    }

    // Check for valid ARIA attributes
    const ariaAttributes = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('aria-'))
      .map(attr => attr.name);

    // Add more ARIA validation rules as needed
    
    return errors;
  },
};

export default {
  aria,
  keyboard,
  focus,
  screenReader,
  colorContrast,
  touchTarget,
  reducedMotion,
  highContrast,
  a11yTest,
};
