/**
 * PolicyDetailsPage Component
 * Comprehensive policy details view with edit, archive, and email viewing capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumCard } from './PremiumCard';
import { PremiumButton } from './PremiumButton';
import { PremiumBreadcrumb } from './PremiumBreadcrumb';
import { PremiumModal } from './PremiumModal';
import { PolicyForm } from './PolicyForm';
import { cn } from '../utils/cn';
import { getInsuranceIcon, getInsuranceTypeColor } from './icons/InsuranceIcons';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface PolicyDetails {
  id: string;
  insurer_name: string;
  policy_number: string | null;
  amount: number | null;
  premium_frequency: string | null;
  due_date: string | null;
  payment_status: string;
  policy_key: string;
  gmail_message_id: string;
  gmail_thread_id: string | null;
  from_email: string | null;
  email_subject: string | null;
  raw_preview_text: string | null;
  confidence_score: number | null;
  received_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  archived: boolean;
}

export interface PolicyDetailsPageProps {
  policyId: string;
}

/**
 * Get status configuration
 */
const getStatusConfig = (status: string) => {
  const normalizedStatus = status.toUpperCase();

  switch (normalizedStatus) {
    case 'PAID':
      return {
        color: 'success',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: CheckCircleIcon,
        label: 'Paid',
      };
    case 'PENDING':
      return {
        color: 'warning',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        icon: ClockIcon,
        label: 'Pending',
      };
    case 'OVERDUE':
      return {
        color: 'error',
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        icon: ExclamationCircleIcon,
        label: 'Overdue',
      };
    default:
      return {
        color: 'default',
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
        icon: InformationCircleIcon,
        label: 'Unknown',
      };
  }
};

/**
 * Format currency
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
 * Format date
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Calculate days until due
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
 * PolicyDetailsPage component
 */
export const PolicyDetailsPage: React.FC<PolicyDetailsPageProps> = ({ policyId }) => {
  const router = useRouter();
  const [policy, setPolicy] = useState<PolicyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch policy details
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/insurance/policies/${policyId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch policy');
        }

        const data = await response.json();
        setPolicy(data.policy);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, [policyId]);

  // Handle archive toggle
  const handleArchiveToggle = async () => {
    if (!policy) return;

    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !policy.archived }),
      });

      if (!response.ok) {
        throw new Error('Failed to update policy');
      }

      const data = await response.json();
      setPolicy(data.policy);
    } catch (err) {
      console.error('Error archiving policy:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete policy');
      }

      router.push('/policies');
    } catch (err) {
      console.error('Error deleting policy:', err);
      setIsDeleting(false);
    }
  };

  // Handle edit save
  const handleEditSave = async (updatedData: any) => {
    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update policy');
      }

      const data = await response.json();
      setPolicy(data.policy);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating policy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-xl p-6 h-64"></div>
                <div className="glass rounded-xl p-6 h-48"></div>
              </div>
              <div className="space-y-6">
                <div className="glass rounded-xl p-6 h-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PremiumCard variant="glass" className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
              <ExclamationCircleIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Policy Not Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || 'The policy you are looking for does not exist.'}
            </p>
            <PremiumButton onClick={() => router.push('/policies')}>
              Back to Policies
            </PremiumButton>
          </PremiumCard>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(policy.payment_status);
  const StatusIcon = statusConfig.icon;
  const policyType = policy.policy_key.split('-')[0] || 'other';
  const InsuranceIcon = getInsuranceIcon(policyType);
  const typeColors = getInsuranceTypeColor(policyType);
  const dueInfo = policy.due_date ? getDaysUntilDue(policy.due_date) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <PremiumBreadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Policies', href: '/policies' },
            { label: policy.insurer_name, href: `/policies/${policyId}` },
          ]}
          className="mb-6"
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Policy Details
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                View and manage your insurance policy
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <PremiumButton
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<PencilIcon className="w-4 h-4" />}
            >
              Edit
            </PremiumButton>
            <PremiumButton
              variant="secondary"
              size="sm"
              onClick={handleArchiveToggle}
              leftIcon={<ArchiveBoxIcon className="w-4 h-4" />}
            >
              {policy.archived ? 'Restore' : 'Archive'}
            </PremiumButton>
            <PremiumButton
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<TrashIcon className="w-4 h-4" />}
            >
              Delete
            </PremiumButton>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Overview Card */}
            <PremiumCard variant="glass" className="animate-slide-in-up">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'p-4 rounded-xl border',
                    typeColors.bg,
                    typeColors.border
                  )}>
                    <InsuranceIcon className={cn('w-8 h-8', typeColors.icon)} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {policy.insurer_name}
                    </h2>
                    <p className={cn('text-sm font-medium mt-1', typeColors.text)}>
                      {policyType.charAt(0).toUpperCase() + policyType.slice(1)} Insurance
                    </p>
                    {policy.policy_number && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">
                        Policy #{policy.policy_number}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium border inline-flex items-center gap-2',
                    statusConfig.bg,
                    statusConfig.text,
                    statusConfig.border
                  )}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                  {policy.archived && (
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-400 text-white">
                      ARCHIVED
                    </span>
                  )}
                </div>
              </div>

              {/* Premium Amount */}
              <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <CurrencyRupeeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Premium Amount
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {policy.amount ? formatCurrency(policy.amount) : 'N/A'}
                  </span>
                  {policy.premium_frequency && (
                    <span className="text-lg text-gray-500 dark:text-gray-400">
                      / {policy.premium_frequency}
                    </span>
                  )}
                </div>
              </div>

              {/* Due Date */}
              {policy.due_date && dueInfo && (
                <div className={cn(
                  'p-4 rounded-xl border',
                  dueInfo.urgent
                    ? dueInfo.days < 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className={cn(
                        'w-5 h-5',
                        dueInfo.urgent
                          ? dueInfo.days < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                      )} />
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Payment Due Date
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatDate(policy.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-bold',
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
                </div>
              )}
            </PremiumCard>

            {/* Email Details Card */}
            <PremiumCard variant="glass" className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Email Details
                </h3>
              </div>

              <div className="space-y-4">
                {policy.email_subject && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Subject
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {policy.email_subject}
                    </p>
                  </div>
                )}

                {policy.from_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      From
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1 font-mono text-sm">
                      {policy.from_email}
                    </p>
                  </div>
                )}

                {policy.raw_preview_text && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Preview
                    </label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm line-clamp-3">
                      {policy.raw_preview_text}
                    </p>
                  </div>
                )}

                {policy.gmail_message_id && (
                  <div>
                    <PremiumButton
                      variant="secondary"
                      size="sm"
                      leftIcon={<EnvelopeIcon className="w-4 h-4" />}
                      onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${policy.gmail_message_id}`, '_blank')}
                    >
                      View in Gmail
                    </PremiumButton>
                  </div>
                )}
              </div>
            </PremiumCard>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <PremiumCard variant="glass" className="animate-slide-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Policy Information
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Policy Key</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">
                    {policy.policy_key}
                  </span>
                </div>

                {policy.confidence_score !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                    <span className={cn(
                      'text-sm font-semibold',
                      policy.confidence_score >= 0.8
                        ? 'text-green-600 dark:text-green-400'
                        : policy.confidence_score >= 0.6
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    )}>
                      {(policy.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}

                {policy.received_at && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Received</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(policy.received_at)}
                    </span>
                  </div>
                )}

                {policy.created_at && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Added</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(policy.created_at)}
                    </span>
                  </div>
                )}

                {policy.updated_at && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {formatDate(policy.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </PremiumCard>

            {/* Actions Card */}
            <PremiumCard variant="glass" className="animate-slide-in-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <PremiumButton
                  variant="secondary"
                  fullWidth
                  leftIcon={<PencilIcon className="w-4 h-4" />}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Policy
                </PremiumButton>
                <PremiumButton
                  variant="secondary"
                  fullWidth
                  leftIcon={<ArchiveBoxIcon className="w-4 h-4" />}
                  onClick={handleArchiveToggle}
                >
                  {policy.archived ? 'Restore Policy' : 'Archive Policy'}
                </PremiumButton>
                <PremiumButton
                  variant="danger"
                  fullWidth
                  leftIcon={<TrashIcon className="w-4 h-4" />}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete Policy
                </PremiumButton>
              </div>
            </PremiumCard>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <PremiumModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Policy"
      >
        <PolicyForm
          initialData={{
            id: policy.id,
            insurerName: policy.insurer_name,
            policyNumber: policy.policy_number || undefined,
            amount: policy.amount || undefined,
            dueDate: policy.due_date || undefined,
            status: policy.payment_status as any,
            type: policyType,
            premium_frequency: policy.premium_frequency || undefined,
          }}
          onSubmit={handleEditSave}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </PremiumModal>

      {/* Delete Confirmation Modal */}
      <PremiumModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Policy"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this policy? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <PremiumButton
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </PremiumButton>
            <PremiumButton
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
            >
              Delete Policy
            </PremiumButton>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
};

export default PolicyDetailsPage;
