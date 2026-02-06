/**
 * Tests for the premium design system foundation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ThemeManager, getCSSVariable, setCSSVariable, tokens } from '../index';

// Mock DOM environment
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockMatchMedia = jest.fn();

beforeEach(() => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
  });

  // Mock document.documentElement
  Object.defineProperty(document, 'documentElement', {
    value: {
      style: {
        setProperty: jest.fn(),
      },
      setAttribute: jest.fn(),
      removeAttribute: jest.fn(),
    },
    writable: true,
  });

  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: jest.fn(() => ({
      getPropertyValue: jest.fn(() => '#3b82f6'),
    })),
    writable: true,
  });

  // Reset mocks
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ThemeManager', () => {
  it('should initialize with system theme by default', () => {
    const themeManager = ThemeManager.getInstance();
    expect(themeManager.getTheme()).toBe('system');
  });

  it('should set and persist theme preference', () => {
    const themeManager = ThemeManager.getInstance();
    themeManager.setTheme('dark');
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(themeManager.getTheme()).toBe('dark');
  });

  it('should apply dark theme to document', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const themeManager = ThemeManager.getInstance();
    themeManager.setTheme('dark');
    
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('should remove theme attribute for light theme', () => {
    const themeManager = ThemeManager.getInstance();
    themeManager.setTheme('light');
    
    expect(document.documentElement.removeAttribute).toHaveBeenCalledWith('data-theme');
  });
});

describe('CSS Variable Utilities', () => {
  it('should get CSS variable value', () => {
    const value = getCSSVariable('--color-primary-500');
    expect(window.getComputedStyle).toHaveBeenCalled();
    expect(value).toBe('#3b82f6');
  });

  it('should set CSS variable value', () => {
    setCSSVariable('--test-property', 'test-value');
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--test-property', 'test-value');
  });
});

describe('Design Tokens', () => {
  it('should provide color token getters', () => {
    const primaryColor = tokens.colors.primary('500');
    expect(primaryColor).toBe('#3b82f6');
  });

  it('should provide spacing token getter', () => {
    const spacing = tokens.spacing('4');
    expect(window.getComputedStyle).toHaveBeenCalled();
  });

  it('should provide shadow token getter', () => {
    const shadow = tokens.shadows.premium();
    expect(window.getComputedStyle).toHaveBeenCalled();
  });
});

describe('Theme System Integration', () => {
  it('should handle system theme preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const themeManager = ThemeManager.getInstance();
    expect(themeManager.getEffectiveTheme()).toBe('dark');
  });

  it('should subscribe to theme changes', () => {
    const themeManager = ThemeManager.getInstance();
    const listener = jest.fn();
    
    const unsubscribe = themeManager.subscribe(listener);
    themeManager.setTheme('dark');
    
    expect(listener).toHaveBeenCalledWith('dark');
    
    unsubscribe();
    themeManager.setTheme('light');
    
    // Should not be called after unsubscribe
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
