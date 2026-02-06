/**
 * Visual Effects Demo Component
 * Showcases the advanced visual effects and animations
 */

'use client';

import React, { useState } from 'react';
import {
  BackgroundEffects,
  ParallaxContainer,
  CelebrationAnimation,
  SuccessAnimation,
  MilestoneAchievement,
  LoadingSuccess,
  AnimatedBarChart,
  AnimatedDonutChart,
  AnimatedLineChart,
  AnimatedProgressRing,
  LightingEffects,
} from '../index';
import { PremiumButton, PremiumCard } from '../index';

export function VisualEffectsDemo() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [backgroundVariant, setBackgroundVariant] = useState<'particles' | 'gradient' | 'minimal'>('minimal');

  // Sample data for charts
  const barChartData = [
    { label: 'Health', value: 85, color: '#10b981' },
    { label: 'Auto', value: 92, color: '#3b82f6' },
    { label: 'Home', value: 78, color: '#f59e0b' },
    { label: 'Life', value: 95, color: '#8b5cf6' },
  ];

  const donutChartData = [
    { label: 'Paid', value: 65, color: '#10b981' },
    { label: 'Pending', value: 25, color: '#f59e0b' },
    { label: 'Overdue', value: 10, color: '#ef4444' },
  ];

  const lineChartData = [
    { x: 1, y: 20 },
    { x: 2, y: 35 },
    { x: 3, y: 25 },
    { x: 4, y: 45 },
    { x: 5, y: 55 },
    { x: 6, y: 40 },
    { x: 7, y: 65 },
  ];

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setIsSuccess(false);
    setShowLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        setShowLoading(false);
        setIsSuccess(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <BackgroundEffects variant={backgroundVariant} />

      <div className="relative z-10 p-8 space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Advanced Visual Effects Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Showcasing premium animations, background effects, and data visualizations
          </p>
        </div>

        {/* Background Controls */}
        <PremiumCard variant="glass" className="p-6">
          <h2 className="text-xl font-semibold mb-4">Background Effects</h2>
          <div className="flex gap-4">
            <PremiumButton
              variant={backgroundVariant === 'minimal' ? 'primary' : 'secondary'}
              onClick={() => setBackgroundVariant('minimal')}
            >
              Minimal
            </PremiumButton>
            <PremiumButton
              variant={backgroundVariant === 'gradient' ? 'primary' : 'secondary'}
              onClick={() => setBackgroundVariant('gradient')}
            >
              Gradient
            </PremiumButton>
            <PremiumButton
              variant={backgroundVariant === 'particles' ? 'primary' : 'secondary'}
              onClick={() => setBackgroundVariant('particles')}
            >
              Particles
            </PremiumButton>
          </div>
        </PremiumCard>

        {/* Celebration Animations */}
        <PremiumCard variant="glass" className="p-6">
          <h2 className="text-xl font-semibold mb-4">Celebration Animations</h2>
          <div className="flex flex-wrap gap-4">
            <PremiumButton
              onClick={() => {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 3000);
              }}
            >
              Confetti Celebration
            </PremiumButton>
            <PremiumButton
              onClick={() => setShowSuccess(true)}
            >
              Success Animation
            </PremiumButton>
            <PremiumButton
              onClick={() => setShowMilestone(true)}
            >
              Milestone Achievement
            </PremiumButton>
            <PremiumButton
              onClick={handleLoadingDemo}
            >
              Loading Success Demo
            </PremiumButton>
          </div>
        </PremiumCard>

        {/* Parallax Section */}
        <ParallaxContainer speed={0.3}>
          <LightingEffects intensity="medium">
            <PremiumCard variant="elevated" className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">Parallax Effect</h2>
              <p className="text-gray-600 dark:text-gray-300">
                This card moves with parallax scrolling and has subtle lighting effects.
                Scroll up and down to see the effect in action.
              </p>
            </PremiumCard>
          </LightingEffects>
        </ParallaxContainer>

        {/* Animated Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PremiumCard variant="glass" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Animated Bar Chart</h3>
            <AnimatedBarChart data={barChartData} height={200} />
          </PremiumCard>

          <PremiumCard variant="glass" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Animated Donut Chart</h3>
            <AnimatedDonutChart
              data={donutChartData}
              size={200}
              centerContent={
                <div className="text-center">
                  <div className="text-2xl font-bold">100</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
              }
            />
          </PremiumCard>

          <PremiumCard variant="glass" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Animated Line Chart</h3>
            <AnimatedLineChart data={lineChartData} width={350} height={200} />
          </PremiumCard>

          <PremiumCard variant="glass" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Ring</h3>
            <div className="flex justify-center">
              <AnimatedProgressRing progress={75} size={150} />
            </div>
          </PremiumCard>
        </div>

        {/* Lighting Effects Demo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LightingEffects intensity="subtle">
            <PremiumCard className="p-6 text-center">
              <h3 className="font-semibold mb-2">Subtle Lighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gentle depth effect
              </p>
            </PremiumCard>
          </LightingEffects>

          <LightingEffects intensity="medium">
            <PremiumCard className="p-6 text-center">
              <h3 className="font-semibold mb-2">Medium Lighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Balanced depth effect
              </p>
            </PremiumCard>
          </LightingEffects>

          <LightingEffects intensity="strong">
            <PremiumCard className="p-6 text-center">
              <h3 className="font-semibold mb-2">Strong Lighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pronounced depth effect
              </p>
            </PremiumCard>
          </LightingEffects>
        </div>
      </div>

      {/* Celebration Animations */}
      <CelebrationAnimation
        trigger={showCelebration}
        type="confetti"
        intensity="high"
        onComplete={() => setShowCelebration(false)}
      />

      <SuccessAnimation
        show={showSuccess}
        message="Great job!"
        onComplete={() => setShowSuccess(false)}
      />

      <MilestoneAchievement
        show={showMilestone}
        title="Achievement Unlocked!"
        description="You've discovered all the visual effects"
        icon={
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        }
        progress={100}
        onComplete={() => setShowMilestone(false)}
      />

      <LoadingSuccess
        isLoading={isLoading}
        isSuccess={isSuccess}
        loadingMessage="Processing your request..."
        successMessage="All done!"
        onComplete={() => setShowLoading(false)}
      />
    </div>
  );
}
