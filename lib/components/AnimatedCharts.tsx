/**
 * Animated Charts and Data Visualization
 * Provides smooth animations for charts and graphs
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useCounterAnimation } from '../theme/animations';
import { useIntersectionAnimation } from '../theme/animations';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export type { ChartDataPoint };

interface AnimatedBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  showValues?: boolean;
  animationDelay?: number;
  className?: string;
}

export type { AnimatedBarChartProps };

export function AnimatedBarChart({
  data,
  height = 200,
  showValues = true,
  animationDelay = 100,
  className = '',
}: AnimatedBarChartProps) {
  const { ref, hasBeenVisible } = useIntersectionAnimation(0.3);
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

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`w-full ${className}`}>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((item, index) => (
          <AnimatedBar
            key={item.label}
            data={item}
            maxValue={maxValue}
            height={height}
            showValue={showValues}
            delay={hasBeenVisible && !isReducedMotion ? index * animationDelay : 0}
            animate={hasBeenVisible}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
        {data.map((item) => (
          <span key={item.label} className="text-center flex-1 truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

interface AnimatedBarProps {
  data: ChartDataPoint;
  maxValue: number;
  height: number;
  showValue: boolean;
  delay: number;
  animate: boolean;
}

function AnimatedBar({ data, maxValue, height, showValue, delay, animate }: AnimatedBarProps) {
  const [currentHeight, setCurrentHeight] = useState(0);
  const { value: animatedValue } = useCounterAnimation({
    end: data.value,
    duration: 1000,
  });

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        const targetHeight = (data.value / maxValue) * (height - 40);
        setCurrentHeight(targetHeight);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [animate, data.value, maxValue, height, delay]);

  const barColor = data.color || 'var(--color-primary-500)';

  return (
    <div className="flex-1 flex flex-col items-center">
      {showValue && (
        <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
          {animate ? animatedValue : data.value}
        </div>
      )}

      <div
        className="w-full bg-gradient-to-t rounded-t-lg transition-all duration-1000 ease-out min-h-[4px]"
        style={{
          height: `${currentHeight}px`,
          backgroundImage: `linear-gradient(to top, ${barColor}, ${barColor}dd)`,
        }}
      />

      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg" />
    </div>
  );
}

/**
 * Animated Donut Chart
 */
interface AnimatedDonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  centerContent?: React.ReactNode;
  className?: string;
}

export type { AnimatedDonutChartProps };

export function AnimatedDonutChart({
  data,
  size = 200,
  strokeWidth = 20,
  showLabels = true,
  centerContent,
  className = '',
}: AnimatedDonutChartProps) {
  const { ref, hasBeenVisible } = useIntersectionAnimation(0.3);
  const [animatedData, setAnimatedData] = useState(data.map(d => ({ ...d, value: 0 })));
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
    if (hasBeenVisible && !isReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedData(data);
      }, 200);

      return () => clearTimeout(timer);
    } else if (isReducedMotion) {
      setAnimatedData(data);
    }
  }, [hasBeenVisible, data, isReducedMotion]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`flex items-center gap-6 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-gray-200)"
            strokeWidth={strokeWidth}
            className="dark:stroke-gray-700"
          />

          {/* Data segments */}
          {animatedData.map((item, index) => {
            const percentage = item.value / total;
            const strokeDasharray = `${percentage * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * circumference;

            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color || `hsl(${index * 60}, 70%, 50%)`}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              />
            );
          })}
        </svg>

        {/* Center content */}
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLabels && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Animated Line Chart
 */
interface LineChartDataPoint {
  x: number;
  y: number;
  label?: string;
}

export type { LineChartDataPoint };

interface AnimatedLineChartProps {
  data: LineChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  className?: string;
}

export type { AnimatedLineChartProps };

export function AnimatedLineChart({
  data,
  width = 400,
  height = 200,
  color = 'var(--color-primary-500)',
  showDots = true,
  showGrid = true,
  className = '',
}: AnimatedLineChartProps) {
  const { ref, hasBeenVisible } = useIntersectionAnimation(0.3);
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);
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
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [data]);

  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));

  const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * chartWidth + padding;
  const scaleY = (y: number) => chartHeight - ((y - minY) / (maxY - minY)) * chartHeight + padding;

  const pathData = data
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        {showGrid && (
          <g className="opacity-20">
            {/* Horizontal grid lines */}
            {Array.from({ length: 5 }, (_, i) => {
              const y = padding + (i * chartHeight) / 4;
              return (
                <line
                  key={`h-${i}`}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth={1}
                />
              );
            })}

            {/* Vertical grid lines */}
            {Array.from({ length: 5 }, (_, i) => {
              const x = padding + (i * chartWidth) / 4;
              return (
                <line
                  key={`v-${i}`}
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={height - padding}
                  stroke="currentColor"
                  strokeWidth={1}
                />
              );
            })}
          </g>
        )}

        {/* Line path */}
        <path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: isReducedMotion ? 'none' : pathLength,
            strokeDashoffset: hasBeenVisible || isReducedMotion ? 0 : pathLength,
            transition: isReducedMotion ? 'none' : 'stroke-dashoffset 2s ease-out',
          }}
        />

        {/* Data points */}
        {showDots && data.map((point, index) => (
          <circle
            key={index}
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r={4}
            fill={color}
            className={`${hasBeenVisible || isReducedMotion ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            style={{
              transitionDelay: isReducedMotion ? '0ms' : `${index * 100 + 1000}ms`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Animated Progress Ring
 */
interface AnimatedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  duration?: number;
  className?: string;
}

export type { AnimatedProgressRingProps };

export function AnimatedProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--color-primary-500)',
  backgroundColor = 'var(--color-gray-200)',
  showPercentage = true,
  duration = 1500,
  className = '',
}: AnimatedProgressRingProps) {
  const { ref, hasBeenVisible } = useIntersectionAnimation(0.3);
  const { value: animatedProgress } = useCounterAnimation({
    end: progress,
    duration,
  });
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

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={hasBeenVisible || isReducedMotion ? strokeDashoffset : circumference}
          className={isReducedMotion ? '' : 'transition-all duration-1000 ease-out'}
        />
      </svg>

      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {hasBeenVisible || isReducedMotion ? animatedProgress : 0}%
          </span>
        </div>
      )}
    </div>
  );
}
