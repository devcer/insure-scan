/**
 * PremiumEmailInteractions Component
 * Advanced email interaction features including swipe gestures and multi-select
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../utils/cn';
import { PremiumButton } from './PremiumButton';
import { EmailMessage } from './PremiumEmailCard';

export interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'error';
  action: (email: EmailMessage) => void;
}

export interface PremiumEmailSwipeProps {
  /** Email message */
  email: EmailMessage;
  /** Available swipe actions */
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  /** Children content */
  children: React.ReactNode;
  /** Swipe threshold in pixels */
  threshold?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Archive icon
 */
const ArchiveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
  </svg>
);

/**
 * Delete icon
 */
const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

/**
 * Mark as read icon
 */
const ReadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * Mark as unread icon
 */
const UnreadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

/**
 * Get action color classes
 */
const getActionColorClasses = (color: SwipeAction['color']) => {
  switch (color) {
    case 'primary':
      return 'bg-primary-500 text-white';
    case 'success':
      return 'bg-green-500 text-white';
    case 'warning':
      return 'bg-yellow-500 text-white';
    case 'error':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

/**
 * PremiumEmailSwipe component with touch gestures
 */
export const PremiumEmailSwipe: React.FC<PremiumEmailSwipeProps> = ({
  email,
  leftActions = [],
  rightActions = [],
  children,
  threshold = 80,
  className,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    setIsDragging(true);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;

    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));

    setSwipeOffset(limitedDelta);

    // Show actions when threshold is reached
    if (Math.abs(limitedDelta) > threshold) {
      setShowActions(limitedDelta > 0 ? 'left' : 'right');
    } else {
      setShowActions(null);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsDragging(false);

    const deltaX = currentX.current - startX.current;
    const absOffset = Math.abs(deltaX);

    if (absOffset > threshold) {
      // Execute action
      const actions = deltaX > 0 ? leftActions : rightActions;
      if (actions.length > 0) {
        actions[0].action(email);
      }
    }

    // Reset position
    setSwipeOffset(0);
    setShowActions(null);
  };

  // Handle mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    currentX.current = startX.current;
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      currentX.current = e.clientX;
      const deltaX = currentX.current - startX.current;

      const maxSwipe = 120;
      const limitedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));

      setSwipeOffset(limitedDelta);

      if (Math.abs(limitedDelta) > threshold) {
        setShowActions(limitedDelta > 0 ? 'left' : 'right');
      } else {
        setShowActions(null);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      const deltaX = currentX.current - startX.current;
      const absOffset = Math.abs(deltaX);

      if (absOffset > threshold) {
        const actions = deltaX > 0 ? leftActions : rightActions;
        if (actions.length > 0) {
          actions[0].action(email);
        }
      }

      setSwipeOffset(0);
      setShowActions(null);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div
          className={cn(
            'absolute left-0 top-0 h-full flex items-center justify-start pl-4',
            'transition-opacity duration-200',
            showActions === 'left' ? 'opacity-100' : 'opacity-0'
          )}
        >
          {leftActions.map((action) => (
            <div
              key={action.id}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full',
                'shadow-lg',
                getActionColorClasses(action.color)
              )}
            >
              <action.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div
          className={cn(
            'absolute right-0 top-0 h-full flex items-center justify-end pr-4',
            'transition-opacity duration-200',
            showActions === 'right' ? 'opacity-100' : 'opacity-0'
          )}
        >
          {rightActions.map((action) => (
            <div
              key={action.id}
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full',
                'shadow-lg',
                getActionColorClasses(action.color)
              )}
            >
              <action.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'transition-transform duration-200 ease-out',
          isDragging && 'transition-none'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Bulk actions toolbar
 */
export interface BulkActionsToolbarProps {
  /** Selected email count */
  selectedCount: number;
  /** Select all handler */
  onSelectAll?: () => void;
  /** Clear selection handler */
  onClearSelection?: () => void;
  /** Bulk action handlers */
  onMarkAsRead?: () => void;
  onMarkAsUnread?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkImportant?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onMarkImportant,
  className,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 transform -translate-x-1/2',
        'glass border-glass-border',
        'px-6 py-3 rounded-2xl shadow-premium',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        'z-50 max-w-screen-sm w-full mx-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedCount} selected
          </span>

          {onSelectAll && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="text-xs"
            >
              Select All
            </PremiumButton>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onMarkAsRead && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onMarkAsRead}
              icon={ReadIcon}
              className="text-xs"
            >
              Read
            </PremiumButton>
          )}

          {onMarkAsUnread && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onMarkAsUnread}
              icon={UnreadIcon}
              className="text-xs"
            >
              Unread
            </PremiumButton>
          )}

          {onMarkImportant && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onMarkImportant}
              className="text-xs"
            >
              ⭐
            </PremiumButton>
          )}

          {onArchive && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onArchive}
              icon={ArchiveIcon}
              className="text-xs"
            >
              Archive
            </PremiumButton>
          )}

          {onDelete && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onDelete}
              icon={DeleteIcon}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </PremiumButton>
          )}

          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

          {onClearSelection && (
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-xs"
            >
              Clear
            </PremiumButton>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Default swipe actions
 */
export const defaultLeftActions: SwipeAction[] = [
  {
    id: 'markRead',
    label: 'Mark as Read',
    icon: ReadIcon,
    color: 'success',
    action: (email) => console.log('Mark as read:', email.id),
  },
];

export const defaultRightActions: SwipeAction[] = [
  {
    id: 'archive',
    label: 'Archive',
    icon: ArchiveIcon,
    color: 'primary',
    action: (email) => console.log('Archive:', email.id),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: DeleteIcon,
    color: 'error',
    action: (email) => console.log('Delete:', email.id),
  },
];

export default PremiumEmailSwipe;
