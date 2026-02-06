/**
 * Insurance Type Icons
 * Premium icon components for different insurance types with consistent styling
 */

import React from 'react';

export interface IconProps {
  className?: string;
}

/**
 * Health Insurance Icon
 */
export const HealthInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

/**
 * Vehicle/Auto Insurance Icon
 */
export const VehicleInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    <circle cx="9" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <circle cx="15" cy="17" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

/**
 * Home/Property Insurance Icon
 */
export const HomeInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

/**
 * Life Insurance Icon
 */
export const LifeInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

/**
 * Travel Insurance Icon
 */
export const TravelInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/**
 * Business/Commercial Insurance Icon
 */
export const BusinessInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

/**
 * General/Default Insurance Icon (Shield)
 */
export const GeneralInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

/**
 * Disability Insurance Icon
 */
export const DisabilityInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

/**
 * Pet Insurance Icon
 */
export const PetInsuranceIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
  </svg>
);

/**
 * Get insurance icon based on type
 */
export const getInsuranceIcon = (type: string): React.ComponentType<IconProps> => {
  const lowerType = type.toLowerCase();

  if (lowerType.includes('health') || lowerType.includes('medical') || lowerType.includes('care')) {
    return HealthInsuranceIcon;
  }

  if (lowerType.includes('car') || lowerType.includes('auto') || lowerType.includes('vehicle') || lowerType.includes('motor')) {
    return VehicleInsuranceIcon;
  }

  if (lowerType.includes('home') || lowerType.includes('property') || lowerType.includes('house')) {
    return HomeInsuranceIcon;
  }

  if (lowerType.includes('life') || lowerType.includes('term') || lowerType.includes('lic')) {
    return LifeInsuranceIcon;
  }

  if (lowerType.includes('travel') || lowerType.includes('trip')) {
    return TravelInsuranceIcon;
  }

  if (lowerType.includes('business') || lowerType.includes('commercial') || lowerType.includes('professional')) {
    return BusinessInsuranceIcon;
  }

  if (lowerType.includes('disability') || lowerType.includes('income')) {
    return DisabilityInsuranceIcon;
  }

  if (lowerType.includes('pet') || lowerType.includes('animal')) {
    return PetInsuranceIcon;
  }

  // Default to general insurance icon
  return GeneralInsuranceIcon;
};

/**
 * Get insurance type color theme
 */
export const getInsuranceTypeColor = (type: string): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} => {
  const lowerType = type.toLowerCase();

  if (lowerType.includes('health') || lowerType.includes('medical')) {
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400',
    };
  }

  if (lowerType.includes('car') || lowerType.includes('vehicle')) {
    return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-600 dark:text-blue-400',
    };
  }

  if (lowerType.includes('home') || lowerType.includes('property')) {
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400',
    };
  }

  if (lowerType.includes('life')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'text-purple-600 dark:text-purple-400',
    };
  }

  if (lowerType.includes('travel')) {
    return {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-800',
      icon: 'text-cyan-600 dark:text-cyan-400',
    };
  }

  // Default color scheme
  return {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'text-gray-600 dark:text-gray-400',
  };
};

export default {
  HealthInsuranceIcon,
  VehicleInsuranceIcon,
  HomeInsuranceIcon,
  LifeInsuranceIcon,
  TravelInsuranceIcon,
  BusinessInsuranceIcon,
  GeneralInsuranceIcon,
  DisabilityInsuranceIcon,
  PetInsuranceIcon,
  getInsuranceIcon,
  getInsuranceTypeColor,
};
