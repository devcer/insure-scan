/**
 * PolicyCard Component
 * Premium policy card with glassmorphism effects, insurance type icons, status badges, and drag-and-drop
 */

import React, { useState } from 'react';
import { PremiumCard } from './PremiumCard';
import { cn } from '../utils/cn';
import { PolicyIcon } from './icons/DashboardIcons';
import { getInsuranceIcon, getInsuranceTypeColor } from './icons/InsuranceIcons';

export interface PolicyData {
  id: string;
  insurerName: string;
  policyNumber?: string;
  amount: number;
  premium_frequency?: string;
  dueDate?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'UNKNOWN';
  type: string;
  receivedAt?: string;
  archived?: boolean;
}

export interface PolicyCardProps {
  /** Policy data */
  policy: PolicyData;
  /** Card variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Show animation delay */
  animationDelay?: number;
  /** Click handler */
  onClick?: (id: string) => void;
  /** Edit handler */
  onEdit?: (id: string) => void;
  /** Archive handler */
  onArchive?: (id: string) => void;
  /** Drag start handler */
  onDragStart?: (id: string) => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Drop handler */
  onDrop?: (draggedId: string, targetId: string) => void;
  /** Enable drag and drop */
  draggable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get status configuration with enhanced styling
 */
const getStatusConfig = (status: PolicyData['status']) => {
  switch (status) {
    case 'PAID':
      return {
        color: 'success',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        glow: 'shadow-emerald-500/20',
        label: 'PAID',
        icon: '✓',
      };
    case 'PENDING':
      return {
        color: 'warning',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        glow: 'shadow-amber-500/20',
        label: 'PENDING',
        icon: '⏳',
      };
    case 'OVERDUE':
      return {
        color: 'error',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        glow: 'shadow-red-500/20',
        label: 'OVERDUE',
        icon: '⚠️',
      };
    default:
      return {
        color: 'default',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
        glow: 'shadow-gray-500/20',
        label: 'UNKNOWN',
        icon: '?',
      };
  }
};

/**
 * Calculate days until due date with enhanced formatting
 */
const getDaysUntilDue = (dueDate: string): { days: number; label: string; urgent: boolean } => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      days: Math.abs(days),
      label: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`,
      urgent: true,
    };
  } else if (days === 0) {
    return {
      days: 0,
      label: 'Due today',
      urgent: true,
    };
  } else if (days <= 7) {
    return {
      days,
      label: `Due in ${days} day${days === 1 ? '' : 's'}`,
      urgent: true,
    };
  } else if (days <= 30) {
    return {
      days,
      label: `Due in ${days} days`,
      urgent: false,
    };
  } else {
    return {
      days,
      label: `Due in ${Math.ceil(days / 30)} month${Math.ceil(days / 30) === 1 ? '' : 's'}`,
      urgent: false,
    };
  }
};

/**
 * Format currency with proper Indian formatting
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * PolicyCard component with premium styling and drag-and-drop
 */
export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  variant = 'default',
  animationDelay = 0,
  onClick,
  onEdit,
  onArchive,
  onDragStart,
  onDragEnd,
  onDrop,
  draggable = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const statusConfig = getStatusConfig(policy.status);
  const InsuranceIcon = getInsuranceIcon(policy.type);
  const typeColors = getInsuranceTypeColor(policy.type);
  const dueInfo = policy.dueDate ? getDaysUntilDue(policy.dueDate) : null;

  const cardStyle = {
    animationDelay: `${animationDelay}ms`,
  } as React.CSSProperties;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable || !onDragStart) return;
    setIsDragging(true);
    onDragStart(policy.id);
    e.dataTransfer.setData('text/plain', policy.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!draggable || !onDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!draggable || !onDrop) return;
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId !== policy.id) {
      onDrop(draggedId, policy.id);
    }
  };

  if (variant === 'compact') {
    return (
      <PremiumCard
        variant="glass"
        hover={!isDragging}
        className={cn(
          'group transition-all duration-300 animate-slide-in-up',
          'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
          isDragging && 'opacity-50 scale-95 rotate-2',
          isDragOver && 'ring-2 ring-blue-400 ring-opacity-50',
          draggable && 'cursor-move',
          onClick && 'cursor-pointer',
          className
        )}
        style={cardStyle}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onClick && onClick(policy.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg border transition-colors duration-200',
              typeColors.bg,
              typeColors.border
            )}>
              <InsuranceIcon className={cn('w-4 h-4', typeColors.icon)} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {policy.insurerName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {policy.policyNumber || 'No policy number'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatCurrency(policy.amount)}
            </p>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium border inline-flex items-center gap-1',
              statusConfig.bg,
              statusConfig.text,
              statusConfig.border
            )}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard
      variant="glass"
      hover={!isDragging}
      className={cn(
        'group transition-all duration-300 animate-slide-in-up relative overflow-hidden',
        'hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]',
        'hover:scale-[1.02] hover:-translate-y-1',
        isDragging && 'opacity-50 scale-95 rotate-2 z-50',
        isDragOver && 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.01]',
        draggable && 'cursor-move',
        onClick && !draggable && 'cursor-pointer',
        policy.archived && 'opacity-75',
        className
      )}
      style={cardStyle}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        onClick={(e: React.MouseEvent) => {
          // Don't trigger onClick if clicking on action buttons
          if (onClick && !draggable && !(e.target as HTMLElement).closest('button')) {
            onClick(policy.id);
          }
        }}
      >
        {/* Drag indicator */}
        {draggable && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        )}

        {/* Header with enhanced visual hierarchy */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'p-3 rounded-xl border transition-all duration-200 group-hover:scale-110',
              typeColors.bg,
              typeColors.border,
              'shadow-sm'
            )}>
              <InsuranceIcon className={cn('w-6 h-6', typeColors.icon)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                {policy.insurerName}
              </h3>
              <p className={cn('text-sm font-medium', typeColors.text)}>
                {policy.type}
              </p>
              {policy.policyNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                  {policy.policyNumber}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium border inline-flex items-center gap-2',
              'shadow-sm transition-all duration-200',
              statusConfig.bg,
              statusConfig.text,
              statusConfig.border,
              'group-hover:shadow-md'
            )}>
              <span className="text-xs">{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
            {policy.archived && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-400 text-white">
                ARCHIVED
              </span>
            )}
          </div>
        </div>

        {/* Premium amount with enhanced styling */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(policy.amount)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {policy.premium_frequency || 'annual'} premium
            </span>
          </div>
        </div>

        {/* Policy details with improved layout */}
        <div className="space-y-4">
          {policy.dueDate && dueInfo && (
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-sm text-gray-600 dark:text-gray-400">Due Date</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(policy.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <p className={cn(
                  'text-xs font-medium mt-1',
                  dueInfo.urgent
                    ? dueInfo.days < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                    : 'text-blue-600 dark:text-blue-400'
                )}>
                  {dueInfo.label}
                </p>
              </div>
            </div>
          )}

          {policy.receivedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date(policy.receivedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Actions with enhanced styling */}
        {(onEdit || onArchive) && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(policy.id)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'text-blue-600 dark:text-blue-400',
                  'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  'hover:scale-[1.02] hover:shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
                )}
              >
                Edit Policy
              </button>
            )}
            {onArchive && (
              <button
                onClick={() => onArchive(policy.id)}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  policy.archived
                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  'hover:scale-[1.02] hover:shadow-sm',
                  'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50'
                )}
              >
                {policy.archived ? 'Restore' : 'Archive'}
              </button>
            )}
          </div>
        )}
      </div>
    </PremiumCard>
  );
};

/**
 * PolicyGrid component for responsive grid layout with drag-and-drop
 */
export interface PolicyGridProps {
  policies: PolicyData[];
  variant?: 'default' | 'compact' | 'detailed';
  loading?: boolean;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onReorder?: (policies: PolicyData[]) => void;
  draggable?: boolean;
  className?: string;
}

export const PolicyGrid: React.FC<PolicyGridProps> = ({
  policies,
  variant = 'default',
  loading = false,
  onClick,
  onEdit,
  onArchive,
  onReorder,
  draggable = false,
  className,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleDrop = (draggedId: string, targetId: string) => {
    if (!onReorder || draggedId === targetId) return;

    const draggedIndex = policies.findIndex(p => p.id === draggedId);
    const targetIndex = policies.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPolicies = [...policies];
    const [draggedPolicy] = newPolicies.splice(draggedIndex, 1);
    newPolicies.splice(targetIndex, 0, draggedPolicy);

    onReorder(newPolicies);
  };

  if (loading) {
    return (
      <div className={cn(
        'grid gap-6',
        variant === 'compact'
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        className
      )}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl flex items-center justify-center">
          <PolicyIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No policies found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Policies will appear here once scanned from your emails or added manually.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-6',
      variant === 'compact'
        ? 'grid-cols-1 gap-3'
        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {policies.map((policy, index) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          variant={variant}
          animationDelay={index * 100}
          onClick={onClick}
          onEdit={onEdit}
          onArchive={onArchive}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          draggable={draggable}
          className={draggedId === policy.id ? 'z-50' : ''}
        />
      ))}
    </div>
  );
};

export default PolicyCard;
