/**
 * Component Demo
 * Demonstrates the premium components in action
 */

import React from 'react';
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '../PremiumCard';
import { PremiumButton } from '../PremiumButton';

// Simple icon components for demo
const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const ComponentDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Premium Component Library Demo
        </h1>

        {/* Card Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            PremiumCard Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Card */}
            <PremiumCard variant="default">
              <PremiumCardHeader>
                <PremiumCardTitle>Default Card</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  A standard card with clean borders and subtle shadows.
                </p>
              </PremiumCardContent>
            </PremiumCard>

            {/* Glass Card */}
            <PremiumCard variant="glass" glow>
              <PremiumCardHeader>
                <PremiumCardTitle>Glass Card</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  A glassmorphism card with backdrop blur and glow effects.
                </p>
              </PremiumCardContent>
            </PremiumCard>

            {/* Elevated Card */}
            <PremiumCard variant="elevated">
              <PremiumCardHeader>
                <PremiumCardTitle>Elevated Card</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  An elevated card with premium shadows and depth.
                </p>
              </PremiumCardContent>
            </PremiumCard>
          </div>
        </section>

        {/* Button Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            PremiumButton Variants
          </h2>
          <div className="space-y-6">
            {/* Primary Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Primary Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <PremiumButton variant="primary" size="sm">
                  Small
                </PremiumButton>
                <PremiumButton variant="primary" size="md" icon={HeartIcon}>
                  Medium with Icon
                </PremiumButton>
                <PremiumButton variant="primary" size="lg" glow>
                  Large with Glow
                </PremiumButton>
                <PremiumButton variant="primary" size="xl" icon={StarIcon} iconPosition="right">
                  Extra Large
                </PremiumButton>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Secondary Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <PremiumButton variant="secondary" size="md">
                  Secondary
                </PremiumButton>
                <PremiumButton variant="secondary" size="md" loading>
                  Loading
                </PremiumButton>
                <PremiumButton variant="secondary" size="md" disabled>
                  Disabled
                </PremiumButton>
              </div>
            </div>

            {/* Ghost Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Ghost Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <PremiumButton variant="ghost" size="md">
                  Ghost
                </PremiumButton>
                <PremiumButton variant="ghost" size="md" icon={HeartIcon}>
                  Ghost with Icon
                </PremiumButton>
              </div>
            </div>

            {/* Glass Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Glass Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <PremiumButton variant="glass" size="md">
                  Glass
                </PremiumButton>
                <PremiumButton variant="glass" size="md" icon={StarIcon} glow>
                  Glass with Glow
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Examples */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Interactive Examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumCard variant="glass" onClick={() => alert('Card clicked!')} className="cursor-pointer">
              <PremiumCardHeader>
                <PremiumCardTitle>Clickable Glass Card</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This card is clickable and shows hover effects.
                </p>
                <PremiumButton variant="primary" size="sm" icon={HeartIcon}>
                  Action Button
                </PremiumButton>
              </PremiumCardContent>
            </PremiumCard>

            <PremiumCard variant="elevated" size="lg">
              <PremiumCardHeader>
                <PremiumCardTitle>Premium Features</PremiumCardTitle>
              </PremiumCardHeader>
              <PremiumCardContent>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400 mb-4">
                  <li>✨ Glassmorphism effects</li>
                  <li>🎨 Multiple variants</li>
                  <li>📱 Responsive design</li>
                  <li>♿ Accessibility support</li>
                </ul>
                <div className="flex gap-2">
                  <PremiumButton variant="primary" size="sm">
                    Get Started
                  </PremiumButton>
                  <PremiumButton variant="ghost" size="sm">
                    Learn More
                  </PremiumButton>
                </div>
              </PremiumCardContent>
            </PremiumCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentDemo;
