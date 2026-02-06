/**
 * Animation utilities and helpers for the premium design system
 */

import { useEffect, useState, useRef } from 'react';

/**
 * Animation configuration types
 */
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  iterationCount?: number | 'infinite';
}

export interface CounterAnimationConfig extends AnimationConfig {
  start?: number;
  end: number;
  formatter?: (value: number) => string;
}

export interface StaggerConfig {
  delay: number;
  duration?: number;
  easing?: string;
}

/**
 * Counter animation hook
 * Animates a number from start to end value
 */
export function useCounterAnimation(
  config: CounterAnimationConfig
): { value: number; formattedValue: string; isAnimating: boolean } {
  const { start = 0, end, duration = 2000, formatter, easing = 'ease-out' } = config;
  const [value, setValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (start === end) return;

    setIsAnimating(true);
    const startTime = performance.now();
    const difference = end - start;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      let easedProgress = progress;
      if (easing === 'ease-out') {
        easedProgress = 1 - Math.pow(1 - progress, 3);
      } else if (easing === 'ease-in') {
        easedProgress = Math.pow(progress, 3);
      } else if (easing === 'ease-in-out') {
        easedProgress = progress < 0.5 
          ? 4 * Math.pow(progress, 3) 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      }

      const currentValue = start + (difference * easedProgress);
      setValue(Math.round(currentValue));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [start, end, duration, easing]);

  const formattedValue = formatter ? formatter(value) : value.toString();

  return { value, formattedValue, isAnimating };
}

/**
 * Stagger animation hook
 * Provides staggered delays for animating lists of items
 */
export function useStaggerAnimation(
  itemCount: number,
  config: StaggerConfig
): { getDelay: (index: number) => string; isComplete: boolean } {
  const { delay, duration = 300, easing = 'ease-out' } = config;
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const totalDuration = (itemCount - 1) * delay + duration;
    const timer = setTimeout(() => setIsComplete(true), totalDuration);
    return () => clearTimeout(timer);
  }, [itemCount, delay, duration]);

  const getDelay = (index: number): string => `${index * delay}ms`;

  return { getDelay, isComplete };
}

/**
 * Intersection observer hook for scroll animations
 */
export function useIntersectionAnimation(
  threshold: number = 0.1,
  rootMargin: string = '0px'
): {
  ref: React.RefObject<HTMLElement | null>;
  isVisible: boolean;
  hasBeenVisible: boolean;
} {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin, hasBeenVisible]);

  return { ref, isVisible, hasBeenVisible };
}

/**
 * Animation class generators
 */
export const animationClasses = {
  // Hover effects
  hover: {
    scale: (amount: 'sm' | 'md' | 'lg' = 'md') => {
      const scales = { sm: '1.02', md: '1.05', lg: '1.1' };
      return `transition-transform duration-150 ease-out hover:scale-[${scales[amount]}]`;
    },
    glow: (color: string = 'primary') => 
      `transition-shadow duration-300 ease-out hover:shadow-[0_0_20px_var(--color-${color}-500)]`,
    lift: () => 
      'transition-all duration-300 ease-out hover:shadow-premium hover:-translate-y-1',
  },

  // Loading states
  loading: {
    shimmer: () => 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
    pulse: () => 'animate-pulse',
    spin: () => 'animate-spin',
    bounce: () => 'animate-bounce',
  },

  // Entrance animations
  entrance: {
    fadeIn: (delay: number = 0) => 
      `animate-fade-in ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    slideInUp: (delay: number = 0) => 
      `animate-slide-in-up ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    slideInDown: (delay: number = 0) => 
      `animate-slide-in-down ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    slideInLeft: (delay: number = 0) => 
      `animate-slide-in-left ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    slideInRight: (delay: number = 0) => 
      `animate-slide-in-right ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    scaleIn: (delay: number = 0) => 
      `animate-scale-in ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
    bounceIn: (delay: number = 0) => 
      `animate-bounce-in ${delay > 0 ? `animation-delay-[${delay}ms]` : ''}`,
  },

  // Glassmorphism
  glass: {
    default: () => 'glass',
    strong: () => 'glass-strong',
    card: () => 'glass rounded-2xl border border-glass-border',
    button: () => 'glass rounded-xl border border-glass-border hover:border-glass-border-strong',
  },

  // Transitions
  transition: {
    all: (duration: 'fast' | 'normal' | 'slow' = 'normal') => {
      const durations = { fast: '150ms', normal: '250ms', slow: '350ms' };
      return `transition-all duration-[${durations[duration]}] ease-smooth`;
    },
    colors: () => 'transition-colors duration-200 ease-smooth',
    transform: () => 'transition-transform duration-200 ease-smooth',
    shadow: () => 'transition-shadow duration-300 ease-smooth',
  },
};

/**
 * Performance-optimized animation utilities
 */
export const performanceAnimations = {
  /**
   * Use transform and opacity for better performance
   */
  optimizedHover: (scale: number = 1.05) => ({
    transition: 'transform 150ms ease-out, opacity 150ms ease-out',
    willChange: 'transform, opacity',
    ':hover': {
      transform: `scale(${scale})`,
    },
  }),

  /**
   * Use will-change for animations that are about to start
   */
  prepareAnimation: (properties: string[] = ['transform']) => ({
    willChange: properties.join(', '),
  }),

  /**
   * Remove will-change after animation completes
   */
  cleanupAnimation: () => ({
    willChange: 'auto',
  }),
};

/**
 * Animation duration constants
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  COUNTER: 2000,
  PAGE_TRANSITION: 300,
} as const;

/**
 * Easing functions
 */
export const EASING_FUNCTIONS = {
  SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
  EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
