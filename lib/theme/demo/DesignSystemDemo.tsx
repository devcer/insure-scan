/**
 * Design System Demo Component
 * Showcases the premium design system foundation
 */

'use client';

import React from 'react';
import { useTheme } from '../useTheme';
import { animations } from '../index';

export function DesignSystemDemo() {
  const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            Premium Design System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Award-worthy interface foundation with glassmorphism and smooth animations
          </p>

          {/* Theme Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="text-sm text-gray-500">Current theme: {effectiveTheme}</span>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors duration-200"
            >
              Toggle Theme
            </button>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${theme === t
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Color System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Primary', colors: ['primary-50', 'primary-100', 'primary-500', 'primary-600', 'primary-900'] },
              { name: 'Success', colors: ['success-50', 'success-100', 'success-500', 'success-600', 'success-900'] },
              { name: 'Warning', colors: ['warning-50', 'warning-100', 'warning-500', 'warning-600', 'warning-900'] },
              { name: 'Error', colors: ['error-50', 'error-100', 'error-500', 'error-600', 'error-900'] },
            ].map((palette) => (
              <div key={palette.name} className="space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{palette.name}</h3>
                <div className="space-y-2">
                  {palette.colors.map((color) => (
                    <div
                      key={color}
                      className={`h-12 rounded-lg bg-${color} flex items-center justify-center text-sm font-medium shadow-sm`}
                      style={{ backgroundColor: `var(--color-${color})` }}
                    >
                      <span className="text-white mix-blend-difference">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Glassmorphism Cards */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Glassmorphism Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className={`${animations.glass} p-6 rounded-2xl ${animations.scaleHover} cursor-pointer`}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Glass Card</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Basic glassmorphism effect with backdrop blur and translucent background.
              </p>
            </div>

            <div className={`${animations.glassStrong} p-6 rounded-2xl ${animations.scaleHover} cursor-pointer`}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Strong Glass</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enhanced glassmorphism with stronger blur and opacity effects.
              </p>
            </div>

            <div className={`${animations.glass} ${animations.glowHover} p-6 rounded-2xl cursor-pointer`}>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Glow Effect</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Glass card with premium glow effect on hover.
              </p>
            </div>
          </div>
        </section>

        {/* Animation Showcase */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Animation System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Slide In Up', class: animations.slideInUp },
              { name: 'Slide In Right', class: animations.slideInRight },
              { name: 'Fade In', class: animations.fadeIn },
              { name: 'Scale In', class: animations.scaleIn },
            ].map((animation, index) => (
              <div
                key={animation.name}
                className={`${animation.class} bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{animation.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Smooth entrance animation with premium timing.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Typography System</h2>
          <div className="space-y-4">
            <div className="text-6xl font-bold text-gray-900 dark:text-gray-100">Display Large</div>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">Heading 1</div>
            <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Heading 2</div>
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Heading 3</div>
            <div className="text-xl font-medium text-gray-900 dark:text-gray-100">Heading 4</div>
            <div className="text-lg text-gray-700 dark:text-gray-300">Body Large</div>
            <div className="text-base text-gray-600 dark:text-gray-400">Body Regular</div>
            <div className="text-sm text-gray-500 dark:text-gray-500">Body Small</div>
            <div className="text-xs text-gray-400 dark:text-gray-600">Caption</div>
          </div>
        </section>

        {/* Spacing Scale */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Spacing System</h2>
          <div className="space-y-4">
            {[
              { name: 'Space 1 (4px)', size: 'w-1 h-1' },
              { name: 'Space 2 (8px)', size: 'w-2 h-2' },
              { name: 'Space 4 (16px)', size: 'w-4 h-4' },
              { name: 'Space 8 (32px)', size: 'w-8 h-8' },
              { name: 'Space 16 (64px)', size: 'w-16 h-16' },
            ].map((space) => (
              <div key={space.name} className="flex items-center gap-4">
                <div className={`${space.size} bg-primary-500 rounded`}></div>
                <span className="text-gray-700 dark:text-gray-300">{space.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Shadow System */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Shadow System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Small', class: 'shadow-sm' },
              { name: 'Medium', class: 'shadow-md' },
              { name: 'Large', class: 'shadow-lg' },
              { name: 'Extra Large', class: 'shadow-xl' },
              { name: 'Premium', class: 'shadow-premium' },
              { name: 'Glow', class: 'shadow-glow' },
            ].map((shadow) => (
              <div
                key={shadow.name}
                className={`${shadow.class} bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{shadow.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {shadow.class} shadow effect
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
