/**
 * Background Effects Component
 * Provides subtle particle effects and background animations
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useThemeContext } from '../theme/ThemeProvider';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface BackgroundEffectsProps {
  variant?: 'particles' | 'gradient' | 'minimal';
  particleCount?: number;
  enableParallax?: boolean;
  className?: string;
}

export type { BackgroundEffectsProps };

export function BackgroundEffects({
  variant = 'minimal',
  particleCount = 50,
  enableParallax = true,
  className = '',
}: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const { effectiveTheme } = useThemeContext();
  const [isVisible, setIsVisible] = useState(true);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionPreference = document.documentElement.getAttribute('data-motion-preference');

    setIsVisible(!mediaQuery.matches && motionPreference !== 'reduced');

    const handleChange = () => {
      setIsVisible(!mediaQuery.matches && motionPreference !== 'reduced');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize particles
  useEffect(() => {
    if (!isVisible || variant === 'minimal') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    const createParticles = () => {
      particlesRef.current = [];
      const colors = effectiveTheme === 'dark'
        ? ['rgba(59, 130, 246, 0.1)', 'rgba(147, 197, 253, 0.05)', 'rgba(219, 234, 254, 0.03)']
        : ['rgba(59, 130, 246, 0.05)', 'rgba(147, 197, 253, 0.03)', 'rgba(219, 234, 254, 0.02)'];

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          id: i,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    createParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // Draw connections between nearby particles
        particlesRef.current.forEach((otherParticle) => {
          if (particle.id !== otherParticle.id) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, variant, particleCount, effectiveTheme]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {variant === 'particles' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: effectiveTheme === 'dark' ? 'screen' : 'multiply' }}
        />
      )}

      {variant === 'gradient' && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-accent-500/10 animate-pulse-glow" />
          <div className="absolute inset-0 bg-gradient-to-tl from-secondary-500/5 via-transparent to-primary-500/5 animate-float" />
        </div>
      )}

      {variant === 'minimal' && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl animate-pulse-glow" />
        </div>
      )}
    </div>
  );
}

/**
 * Parallax Container Component
 * Provides parallax scrolling effects for child elements
 */
interface ParallaxContainerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  disabled?: boolean;
}

export type { ParallaxContainerProps };

export function ParallaxContainer({
  children,
  speed = 0.5,
  className = '',
  disabled = false,
}: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionPreference = document.documentElement.getAttribute('data-motion-preference');

    setIsVisible(!mediaQuery.matches && motionPreference !== 'reduced' && !disabled);

    const handleChange = () => {
      setIsVisible(!mediaQuery.matches && motionPreference !== 'reduced' && !disabled);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [disabled]);

  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const container = containerRef.current;

      if (container) {
        const rect = container.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;

        // Only apply parallax when element is in viewport
        if (scrolled + windowHeight > elementTop && scrolled < elementTop + elementHeight) {
          const yPos = -(scrolled - elementTop) * speed;
          setOffset(yPos);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, isVisible]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: isVisible ? `translateY(${offset}px)` : undefined,
        transition: isVisible ? undefined : 'none',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Theme Transition Overlay
 * Provides smooth visual transitions when switching themes
 */
export function ThemeTransitionOverlay() {
  const { theme, effectiveTheme } = useThemeContext();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTheme, setPreviousTheme] = useState(effectiveTheme);

  useEffect(() => {
    if (effectiveTheme !== previousTheme) {
      setIsTransitioning(true);
      setPreviousTheme(effectiveTheme);

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [effectiveTheme, previousTheme]);

  if (!isTransitioning) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-smooth"
        style={{
          background: effectiveTheme === 'dark'
            ? 'radial-gradient(circle at center, rgba(0, 0, 0, 0.8) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
          opacity: isTransitioning ? 1 : 0,
        }}
      />
    </div>
  );
}

/**
 * Subtle Lighting Effects
 * Adds depth and realism through subtle shadows and lighting
 */
interface LightingEffectsProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

export type { LightingEffectsProps };

export function LightingEffects({
  children,
  intensity = 'subtle',
  className = '',
}: LightingEffectsProps) {
  const { effectiveTheme } = useThemeContext();

  const intensityClasses = {
    subtle: effectiveTheme === 'dark'
      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
      : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]',
    medium: effectiveTheme === 'dark'
      ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.1)]'
      : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05)]',
    strong: effectiveTheme === 'dark'
      ? 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.2)]'
      : 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.1)]',
  };

  return (
    <div className={`${intensityClasses[intensity]} ${className}`}>
      {children}
    </div>
  );
}
