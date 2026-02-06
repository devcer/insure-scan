"use client";

/**
 * Test page for premium components
 */

import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '../../lib/components/PremiumCard';
import { PremiumButton } from '../../lib/components/PremiumButton';

// Simple icon for testing
const TestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function TestComponentsPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Premium Components Test</h1>

      {/* Test Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PremiumCard variant="default">
            <PremiumCardHeader>
              <PremiumCardTitle>Default Card</PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <p>This is a default card variant.</p>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard variant="glass">
            <PremiumCardHeader>
              <PremiumCardTitle>Glass Card</PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <p>This is a glass card variant.</p>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard variant="elevated">
            <PremiumCardHeader>
              <PremiumCardTitle>Elevated Card</PremiumCardTitle>
            </PremiumCardHeader>
            <PremiumCardContent>
              <p>This is an elevated card variant.</p>
            </PremiumCardContent>
          </PremiumCard>
        </div>
      </section>

      {/* Test Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <PremiumButton variant="primary">Primary</PremiumButton>
          <PremiumButton variant="secondary">Secondary</PremiumButton>
          <PremiumButton variant="ghost">Ghost</PremiumButton>
          <PremiumButton variant="glass">Glass</PremiumButton>
          <PremiumButton variant="primary" icon={TestIcon}>With Icon</PremiumButton>
          <PremiumButton variant="primary" loading>Loading</PremiumButton>
          <PremiumButton variant="primary" disabled>Disabled</PremiumButton>
        </div>
      </section>
    </div>
  );
}
