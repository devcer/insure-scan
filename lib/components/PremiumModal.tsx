"use client";

/**
 * PremiumModal Component
 * A premium modal dialog with backdrop blur effects and smooth animations
 */

import React, { useEffect, useRef, useId } from 'react';
import { cn } from '../utils/cn';
import { focus, keyboard } from '../utils/accessibility';

export interface PremiumModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional CSS classes */
  className?: string;
  /** Modal content */
  children: React.ReactNode;
  /** Prevent closing on backdrop click */
  preventBackdropClose?: boolean;
  /** Prevent closing on escape key */
  preventEscapeClose?: boolean;
}

/**
 * PremiumModal component with glassmorphism backdrop and smooth animations
 */
export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  className,
  children,
  preventBackdropClose = false,
  preventEscapeClose = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { saveFocus, restoreFocus } = focus.useRestoreFocus();
  const focusTrapRef = focus.useFocusTrap(isOpen);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || preventEscapeClose) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === keyboard.keys.ESCAPE) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventEscapeClose]);

  // Focus management and body scroll prevention
  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    saveFocus();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.setAttribute('aria-hidden', 'true');

    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('aria-hidden');
      // Restore focus when modal closes
      restoreFocus();
    };
  }, [isOpen, saveFocus, restoreFocus]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventBackdropClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with glassmorphism */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />

      {/* Modal */}
      <div
        ref={focusTrapRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'relative w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl',
          'animate-scale-in origin-center',
          'max-h-[90vh] overflow-hidden',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          className
        )}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2
            id={titleId}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'transition-all duration-200 hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]'
            )}
            aria-label="Close modal"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]" role="document">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
