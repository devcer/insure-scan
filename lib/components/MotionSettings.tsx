"use client";

/**
 * MotionSettings Component
 * Provides user controls for animation preferences and reduced motion support
 */

import React, { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { reducedMotion } from '../utils/accessibility';
import { PremiumCard } from './PremiumCard';
import { PremiumButton } from './PremiumButton';

interface MotionSettingsProps {
  className?: string;
}

type MotionPreference = 'system' | 'reduced' | 'full';

/**
 * MotionSettings component for managing animation preferences
 */
export const MotionSettings: React.FC<MotionSettingsProps> = ({ className }) => {
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(false);
  const prefersReducedMotion = reducedMotion.useReducedMotion();

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('motion-preference') as MotionPreference;
    if (saved && ['system', 'reduced', 'full'].includes(saved)) {
      setMotionPreference(saved);
    }

    // Detect system preference
    setSystemPrefersReduced(reducedMotion.prefersReducedMotion());
  }, []);

  // Apply motion preference
  useEffect(() => {
    const shouldReduceMotion =
      motionPreference === 'reduced' ||
      (motionPreference === 'system' && prefersReducedMotion);

    if (shouldReduceMotion) {
      document.documentElement.setAttribute('data-motion-preference', 'reduced');
      document.documentElement.style.setProperty('--animation-duration-multiplier', '0.01');
    } else {
      document.documentElement.setAttribute('data-motion-preference', 'full');
      document.documentElement.style.setProperty('--animation-duration-multiplier', '1');
    }
  }, [motionPreference, prefersReducedMotion]);

  const handlePreferenceChange = (preference: MotionPreference) => {
    setMotionPreference(preference);
    localStorage.setItem('motion-preference', preference);
  };

  const getEffectivePreference = (): 'reduced' | 'full' => {
    if (motionPreference === 'system') {
      return prefersReducedMotion ? 'reduced' : 'full';
    }
    return motionPreference === 'reduced' ? 'reduced' : 'full';
  };

  return (
    <PremiumCard className={cn('space-y-6', className)} variant="glass">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Animation Preferences
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control how animations and transitions behave throughout the interface.
        </p>
      </div>

      {/* Current Status */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Current Setting:
          </span>
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            getEffectivePreference() === 'reduced'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          )}>
            {getEffectivePreference() === 'reduced' ? 'Reduced Motion' : 'Full Animations'}
          </span>
        </div>

        {motionPreference === 'system' && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Following system preference: {systemPrefersReduced ? 'Reduced' : 'Full'}
          </p>
        )}
      </div>

      {/* Motion Preference Options */}
      <div className="space-y-3">
        <label className="block">
          <input
            type="radio"
            name="motion-preference"
            value="system"
            checked={motionPreference === 'system'}
            onChange={() => handlePreferenceChange('system')}
            className="sr-only"
          />
          <div className={cn(
            'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
            'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            motionPreference === 'system'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
                motionPreference === 'system'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}>
                {motionPreference === 'system' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Follow System Preference
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically adapt to your operating system's accessibility settings
                </div>
              </div>
            </div>
          </div>
        </label>

        <label className="block">
          <input
            type="radio"
            name="motion-preference"
            value="full"
            checked={motionPreference === 'full'}
            onChange={() => handlePreferenceChange('full')}
            className="sr-only"
          />
          <div className={cn(
            'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
            'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            motionPreference === 'full'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
                motionPreference === 'full'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}>
                {motionPreference === 'full' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Full Animations
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Enable all animations and transitions for the full premium experience
                </div>
              </div>
            </div>
          </div>
        </label>

        <label className="block">
          <input
            type="radio"
            name="motion-preference"
            value="reduced"
            checked={motionPreference === 'reduced'}
            onChange={() => handlePreferenceChange('reduced')}
            className="sr-only"
          />
          <div className={cn(
            'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
            'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            motionPreference === 'reduced'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : 'border-gray-200 dark:border-gray-700'
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0',
                motionPreference === 'reduced'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}>
                {motionPreference === 'reduced' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Reduced Motion
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Minimize animations and transitions for better accessibility
                </div>
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* Animation Preview */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Preview
        </h4>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-8 h-8 bg-blue-500 rounded-lg',
              getEffectivePreference() === 'full'
                ? 'animate-pulse'
                : 'opacity-75'
            )} />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getEffectivePreference() === 'full'
                ? 'Animations are enabled'
                : 'Animations are reduced'}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem('motion-preference');
            setMotionPreference('system');
          }}
        >
          Reset to System Default
        </PremiumButton>
      </div>
    </PremiumCard>
  );
};

/**
 * MotionWrapper Component
 * Conditionally applies animations based on user preference
 */
interface MotionWrapperProps {
  children: React.ReactNode;
  animation: string;
  fallback?: string;
  className?: string;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  animation,
  fallback = '',
  className = ''
}) => {
  const prefersReduced = reducedMotion.useReducedMotion();
  const [motionPreference, setMotionPreference] = useState<MotionPreference>('system');

  useEffect(() => {
    const saved = localStorage.getItem('motion-preference') as MotionPreference;
    if (saved && ['system', 'reduced', 'full'].includes(saved)) {
      setMotionPreference(saved);
    }
  }, []);

  const shouldReduceMotion =
    motionPreference === 'reduced' ||
    (motionPreference === 'system' && prefersReduced);

  const appliedClass = shouldReduceMotion ? fallback : animation;

  return (
    <div className={cn(appliedClass, className)}>
      {children}
    </div>
  );
};

export default MotionSettings;
