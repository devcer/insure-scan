/**
 * Parallax scrolling hook
 * Provides smooth parallax effects with performance optimization
 */

import { useEffect, useState, useRef, useCallback } from 'react';

interface ParallaxOptions {
  speed?: number;
  offset?: number;
  disabled?: boolean;
  rootMargin?: string;
}

interface ParallaxReturn {
  ref: React.RefObject<HTMLElement | null>;
  transform: string;
  isInView: boolean;
}

export type { ParallaxReturn };

/**
 * Hook for creating parallax scrolling effects
 */
export function useParallax({
  speed = 0.5,
  offset = 0,
  disabled = false,
  rootMargin = '0px',
}: ParallaxOptions = {}): ParallaxReturn {
  const elementRef = useRef<HTMLElement>(null);
  const [transform, setTransform] = useState('translateY(0px)');
  const [isInView, setIsInView] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionPreference = document.documentElement.getAttribute('data-motion-preference');
    
    setIsReducedMotion(mediaQuery.matches || motionPreference === 'reduced');

    const handleChange = () => {
      setIsReducedMotion(mediaQuery.matches || motionPreference === 'reduced');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Throttled scroll handler for performance
  const handleScroll = useCallback(() => {
    if (!elementRef.current || disabled || isReducedMotion) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    const scrolled = window.pageYOffset;
    const windowHeight = window.innerHeight;
    
    // Check if element is in viewport
    const inView = rect.top < windowHeight && rect.bottom > 0;
    setIsInView(inView);

    if (inView) {
      // Calculate parallax offset
      const elementTop = rect.top + scrolled;
      const elementCenter = elementTop + rect.height / 2;
      const windowCenter = scrolled + windowHeight / 2;
      const distance = windowCenter - elementCenter;
      const parallaxOffset = distance * speed + offset;
      
      setTransform(`translateY(${parallaxOffset}px)`);
    }
  }, [speed, offset, disabled, isReducedMotion]);

  // Use Intersection Observer for performance
  useEffect(() => {
    if (!elementRef.current || disabled || isReducedMotion) {
      setTransform('translateY(0px)');
      return;
    }

    const element = elementRef.current;
    
    // Intersection Observer for visibility detection
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);

    // Scroll listener with throttling
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    handleScroll(); // Initial call

    return () => {
      observer.unobserve(element);
      window.removeEventListener('scroll', scrollListener);
    };
  }, [handleScroll, disabled, isReducedMotion, rootMargin]);

  return {
    ref: elementRef,
    transform: isReducedMotion || disabled ? 'translateY(0px)' : transform,
    isInView,
  };
}

/**
 * Hook for mouse-based parallax effects
 */
interface MouseParallaxOptions {
  strength?: number;
  disabled?: boolean;
}

interface MouseParallaxReturn {
  ref: React.RefObject<HTMLElement | null>;
  transform: string;
}

export type { MouseParallaxReturn };

export function useMouseParallax({
  strength = 0.1,
  disabled = false,
}: MouseParallaxOptions = {}): MouseParallaxReturn {
  const elementRef = useRef<HTMLElement>(null);
  const [transform, setTransform] = useState('translate(0px, 0px)');
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionPreference = document.documentElement.getAttribute('data-motion-preference');
    
    setIsReducedMotion(mediaQuery.matches || motionPreference === 'reduced');

    const handleChange = () => {
      setIsReducedMotion(mediaQuery.matches || motionPreference === 'reduced');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!elementRef.current || disabled || isReducedMotion) {
      setTransform('translate(0px, 0px)');
      return;
    }

    const element = elementRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      setTransform(`translate(${deltaX}px, ${deltaY}px)`);
    };

    const handleMouseLeave = () => {
      setTransform('translate(0px, 0px)');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength, disabled, isReducedMotion]);

  return {
    ref: elementRef,
    transform: isReducedMotion || disabled ? 'translate(0px, 0px)' : transform,
  };
}

/**
 * Hook for scroll-triggered animations
 */
interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface ScrollAnimationReturn {
  ref: React.RefObject<HTMLElement | null>;
  isVisible: boolean;
  hasBeenVisible: boolean;
}

export type { ScrollAnimationReturn };

export function useScrollAnimation({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: ScrollAnimationOptions = {}): ScrollAnimationReturn {
  const elementRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
        
        // If triggerOnce is false, reset hasBeenVisible when element leaves viewport
        if (!visible && !triggerOnce) {
          setHasBeenVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

  return {
    ref: elementRef,
    isVisible,
    hasBeenVisible,
  };
}
