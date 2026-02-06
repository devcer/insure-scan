/**
 * Celebration and Milestone Animations
 * Provides delightful animations for user achievements and milestones
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCounterAnimation } from '../theme/animations';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface CelebrationAnimationProps {
  trigger: boolean;
  type?: 'confetti' | 'fireworks' | 'sparkles' | 'success';
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
  onComplete?: () => void;
}

export type { CelebrationAnimationProps };

export function CelebrationAnimation({
  trigger,
  type = 'confetti',
  duration = 3000,
  intensity = 'medium',
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  onComplete,
}: CelebrationAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
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
    if (!trigger || isReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setIsAnimating(true);

    // Create particles based on type and intensity
    const particleCount = {
      low: 30,
      medium: 60,
      high: 100,
    }[intensity];

    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        id: i,
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed > duration) {
        setIsAnimating(false);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update physics
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // gravity
        particle.rotation += particle.rotationSpeed;

        // Draw particle based on type
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);

        if (type === 'confetti') {
          // Rectangle confetti
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        } else if (type === 'sparkles') {
          // Star sparkles
          drawStar(ctx, 0, 0, particle.size, particle.color);
        } else if (type === 'fireworks') {
          // Circle fireworks
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.fill();
        } else if (type === 'success') {
          // Success checkmarks
          drawCheckmark(ctx, 0, 0, particle.size, particle.color);
        }

        ctx.restore();
      });

      // Remove particles that are off screen
      particlesRef.current = particlesRef.current.filter(
        (particle) => particle.y < canvas.height + 50
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, type, duration, intensity, colors, onComplete, isReducedMotion]);

  if (isReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${isAnimating ? 'block' : 'hidden'}`}
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}

// Helper function to draw a star
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.beginPath();
  ctx.fillStyle = color;

  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }

  ctx.closePath();
  ctx.fill();
}

// Helper function to draw a checkmark
function drawCheckmark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x - size / 6, y + size / 3);
  ctx.lineTo(x + size / 2, y - size / 3);
  ctx.stroke();
}

/**
 * Success Animation Component
 * Shows a success animation with optional message
 */
interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export type { SuccessAnimationProps };

export function SuccessAnimation({
  show,
  message = 'Success!',
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium p-8 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-success-500 rounded-full flex items-center justify-center animate-bounce-in">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{message}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Milestone Achievement Component
 * Shows milestone achievements with progress animation
 */
interface MilestoneAchievementProps {
  show: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  progress?: number;
  onComplete?: () => void;
}

export type { MilestoneAchievementProps };

export function MilestoneAchievement({
  show,
  title,
  description,
  icon,
  progress = 100,
  onComplete,
}: MilestoneAchievementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { value: animatedProgress } = useCounterAnimation({
    end: progress,
    duration: 1500,
  });

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      <CelebrationAnimation
        trigger={show}
        type="sparkles"
        intensity="medium"
        colors={['#10b981', '#3b82f6', '#f59e0b']}
      />

      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium p-8 max-w-md animate-scale-in">
          <div className="text-center">
            {icon && (
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center animate-bounce-in">
                {icon}
              </div>
            )}

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>

            {description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {description}
              </p>
            )}

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {animatedProgress}% Complete
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Loading Success Animation
 * Shows a loading animation that transitions to success
 */
interface LoadingSuccessProps {
  isLoading: boolean;
  isSuccess: boolean;
  loadingMessage?: string;
  successMessage?: string;
  onComplete?: () => void;
}

export type { LoadingSuccessProps };

export function LoadingSuccess({
  isLoading,
  isSuccess,
  loadingMessage = 'Processing...',
  successMessage = 'Complete!',
  onComplete,
}: LoadingSuccessProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess && !showSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, showSuccess, onComplete]);

  if (!isLoading && !showSuccess) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-premium p-8">
        {isLoading && !showSuccess && (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <span className="text-gray-900 dark:text-white font-medium">
              {loadingMessage}
            </span>
          </div>
        )}

        {showSuccess && (
          <>
            <CelebrationAnimation
              trigger={showSuccess}
              type="success"
              intensity="medium"
              colors={['#10b981']}
            />
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center animate-bounce-in">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-900 dark:text-white font-medium">
                {successMessage}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
