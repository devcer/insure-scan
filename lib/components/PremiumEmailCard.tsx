/**
 * PremiumEmailCard Component
 * A premium email card component with glassmorphism effects, sender avatars, and smooth animations
 */

import React from 'react';
import { cn } from '../utils/cn';
import { PremiumCard } from './PremiumCard';
import { PremiumEmailSwipe, SwipeAction } from './PremiumEmailInteractions';

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet?: string;
  isRead?: boolean;
  isSelected?: boolean;
  hasAttachment?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface PremiumEmailCardProps {
  /** Email message data */
  email: EmailMessage;
  /** Card variant */
  variant?: 'default' | 'glass' | 'compact';
  /** Selection state */
  selected?: boolean;
  /** Click handler */
  onClick?: (email: EmailMessage) => void;
  /** Selection handler */
  onSelect?: (email: EmailMessage, selected: boolean) => void;
  /** Animation delay for staggered loading */
  animationDelay?: number;
  /** Enable swipe gestures */
  enableSwipe?: boolean;
  /** Left swipe actions */
  leftSwipeActions?: SwipeAction[];
  /** Right swipe actions */
  rightSwipeActions?: SwipeAction[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generate avatar from sender name or email
 */
const getAvatarText = (from: string): string => {
  const name = from.split('<')[0].trim();
  if (name) {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Fallback to email
  const email = from.includes('<') ? from.split('<')[1].replace('>', '') : from;
  return email.substring(0, 2).toUpperCase();
};

/**
 * Generate avatar color based on sender
 */
const getAvatarColor = (from: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  let hash = 0;
  for (let i = 0; i < from.length; i++) {
    hash = from.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return dateString;
  }
};

/**
 * Priority indicator component
 */
const PriorityIndicator: React.FC<{ priority?: 'high' | 'normal' | 'low' }> = ({ priority }) => {
  if (!priority || priority === 'normal') return null;

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        {
          'bg-red-500': priority === 'high',
          'bg-yellow-500': priority === 'low',
        }
      )}
    />
  );
};

/**
 * Attachment indicator component
 */
const AttachmentIcon: React.FC = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

/**
 * PremiumEmailCard component with glassmorphism effects and smooth animations
 */
export const PremiumEmailCard: React.FC<PremiumEmailCardProps> = ({
  email,
  variant = 'default',
  selected = false,
  onClick,
  onSelect,
  animationDelay = 0,
  enableSwipe = false,
  leftSwipeActions = [],
  rightSwipeActions = [],
  className,
}) => {
  const avatarText = getAvatarText(email.from);
  const avatarColor = getAvatarColor(email.from);
  const formattedDate = formatDate(email.date);

  const handleClick = () => {
    onClick?.(email);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(email, e.target.checked);
  };

  const cardVariant = variant === 'glass' ? 'glass' : 'default';

  const cardContent = (
    <PremiumCard
      variant={cardVariant}
      hover={true}
      className={cn(
        'transition-all duration-300 ease-smooth',
        'animate-in slide-in-from-left-4 fade-in',
        selected && 'ring-2 ring-primary-500 ring-opacity-50',
        !email.isRead && 'border-l-4 border-l-primary-500',
        variant === 'compact' ? 'p-3' : 'p-4',
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'both',
      }}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {onSelect && (
          <div className="flex items-center pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
              className={cn(
                'w-4 h-4 rounded border-2 border-gray-300',
                'text-primary-600 focus:ring-primary-500 focus:ring-2',
                'transition-colors duration-200',
                'dark:border-gray-600 dark:bg-gray-800'
              )}
            />
          </div>
        )}

        {/* Sender avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full',
            'flex items-center justify-center',
            'text-white text-sm font-semibold',
            'shadow-sm',
            avatarColor
          )}
        >
          {avatarText}
        </div>

        {/* Email content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {/* Sender name and subject */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    'text-sm font-medium truncate',
                    email.isRead
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                  )}
                >
                  {email.from.split('<')[0].trim() || email.from}
                </h3>
                <PriorityIndicator priority={email.priority} />
                {email.hasAttachment && <AttachmentIcon />}
              </div>

              <p
                className={cn(
                  'text-sm truncate',
                  email.isRead
                    ? 'text-gray-500 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-300 font-medium'
                )}
              >
                {email.subject || '(No Subject)'}
              </p>
            </div>

            {/* Date and status indicators */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                {formattedDate}
              </p>
              {!email.isRead && (
                <div className="w-2 h-2 bg-primary-500 rounded-full ml-auto" />
              )}
            </div>
          </div>

          {/* Email snippet */}
          {email.snippet && variant !== 'compact' && (
            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mt-2">
              {email.snippet}
            </p>
          )}
        </div>
      </div>
    </PremiumCard>
  );

  // Wrap with swipe functionality if enabled
  if (enableSwipe && (leftSwipeActions.length > 0 || rightSwipeActions.length > 0)) {
    return (
      <PremiumEmailSwipe
        email={email}
        leftActions={leftSwipeActions}
        rightActions={rightSwipeActions}
        className={className}
      >
        {cardContent}
      </PremiumEmailSwipe>
    );
  }

  return cardContent;
};

/**
 * PremiumEmailList component with staggered animations
 */
export interface PremiumEmailListProps {
  /** List of emails */
  emails: EmailMessage[];
  /** Selected email IDs */
  selectedEmails?: Set<string>;
  /** Email click handler */
  onEmailClick?: (email: EmailMessage) => void;
  /** Email selection handler */
  onEmailSelect?: (email: EmailMessage, selected: boolean) => void;
  /** List variant */
  variant?: 'default' | 'glass' | 'compact';
  /** Enable swipe gestures */
  enableSwipe?: boolean;
  /** Left swipe actions */
  leftSwipeActions?: SwipeAction[];
  /** Right swipe actions */
  rightSwipeActions?: SwipeAction[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

export const PremiumEmailList: React.FC<PremiumEmailListProps> = ({
  emails,
  selectedEmails = new Set(),
  onEmailClick,
  onEmailSelect,
  variant = 'default',
  enableSwipe = false,
  leftSwipeActions = [],
  rightSwipeActions = [],
  loading = false,
  emptyMessage = 'No emails found',
  className,
}) => {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-20 rounded-xl',
              'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
              'dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
              'animate-pulse bg-[length:200%_100%]'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No emails found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {emails.map((email, index) => (
        <PremiumEmailCard
          key={email.id}
          email={email}
          variant={variant}
          selected={selectedEmails.has(email.id)}
          onClick={onEmailClick}
          onSelect={onEmailSelect}
          enableSwipe={enableSwipe}
          leftSwipeActions={leftSwipeActions}
          rightSwipeActions={rightSwipeActions}
          animationDelay={index * 50}
        />
      ))}
    </div>
  );
};

export default PremiumEmailCard;
