/**
 * PremiumEmailsPage Component
 * Premium email management interface with glassmorphism effects and smooth animations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../utils/cn';
import { PremiumCard } from './PremiumCard';
import { PremiumButton } from './PremiumButton';
import { PremiumEmailList, EmailMessage } from './PremiumEmailCard';
import { PremiumEmailFilters, EmailFilter } from './PremiumEmailFilters';
import { BulkActionsToolbar, defaultLeftActions, defaultRightActions } from './PremiumEmailInteractions';

export interface PremiumEmailsPageProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Refresh icon component
 */
const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

/**
 * Gmail icon component
 */
const GmailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Multi-select actions component
 */
const MultiSelectActions: React.FC<{
  selectedCount: number;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
}> = ({
  selectedCount,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onClearSelection,
  onSelectAll,
}) => {
    return (
      <BulkActionsToolbar
        selectedCount={selectedCount}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        onMarkAsRead={onMarkAsRead}
        onMarkAsUnread={onMarkAsUnread}
        onArchive={onArchive}
        onDelete={onDelete}
        onMarkImportant={() => console.log('Mark as important')}
      />
    );
  };

/**
 * PremiumEmailsPage component with premium styling and smooth animations
 */
export const PremiumEmailsPage: React.FC<PremiumEmailsPageProps> = ({
  className,
}) => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<EmailFilter[]>([
    { id: 'unread', label: 'Unread', active: false },
    { id: 'important', label: 'Important', active: false },
    { id: 'attachments', label: 'Has Attachments', active: false },
    { id: 'today', label: 'Today', active: false },
    { id: 'this-week', label: 'This Week', active: false },
  ]);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("insuranceScannerEmails");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.messages)) {
          const emailMessages: EmailMessage[] = parsed.messages.map((msg: any, index: number) => ({
            id: msg.id || `email-${index}`,
            subject: msg.subject || '(No Subject)',
            from: msg.from || 'Unknown Sender',
            date: msg.date || new Date().toISOString(),
            snippet: msg.snippet || '',
            isRead: Math.random() > 0.3, // Random read status for demo
            hasAttachment: Math.random() > 0.7, // Random attachment status
            priority: Math.random() > 0.9 ? 'high' : 'normal',
          }));
          setMessages(emailMessages);
          setHasFetched(true);
        }
      } catch { }
    }
  }, []);

  // Filter and search emails
  const filteredEmails = useMemo(() => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.snippet?.toLowerCase().includes(query)
      );
    }

    // Apply active filters
    const activeFilters = filters.filter(f => f.active);
    if (activeFilters.length > 0) {
      filtered = filtered.filter(email => {
        return activeFilters.every(filter => {
          switch (filter.id) {
            case 'unread':
              return !email.isRead;
            case 'important':
              return email.priority === 'high';
            case 'attachments':
              return email.hasAttachment;
            case 'today':
              const today = new Date();
              const emailDate = new Date(email.date);
              return emailDate.toDateString() === today.toDateString();
            case 'this-week':
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(email.date) >= weekAgo;
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [messages, searchQuery, filters]);

  // Update filter counts
  useEffect(() => {
    setFilters(prevFilters =>
      prevFilters.map(filter => ({
        ...filter,
        count: messages.filter(email => {
          switch (filter.id) {
            case 'unread':
              return !email.isRead;
            case 'important':
              return email.priority === 'high';
            case 'attachments':
              return email.hasAttachment;
            case 'today':
              const today = new Date();
              const emailDate = new Date(email.date);
              return emailDate.toDateString() === today.toDateString();
            case 'this-week':
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return new Date(email.date) >= weekAgo;
            default:
              return false;
          }
        }).length,
      }))
    );
  }, [messages]);

  const handleFetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gmail/messages");
      const data = await response.json();
      if (response.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      const emailMessages: EmailMessage[] = data.messages.map((msg: any, index: number) => ({
        id: msg.id || `email-${index}`,
        subject: msg.subject || '(No Subject)',
        from: msg.from || 'Unknown Sender',
        date: msg.date || new Date().toISOString(),
        snippet: msg.snippet || '',
        isRead: Math.random() > 0.3,
        hasAttachment: Math.random() > 0.7,
        priority: Math.random() > 0.9 ? 'high' : 'normal',
      }));

      setMessages(emailMessages);
      setHasFetched(true);
      localStorage.setItem("insuranceScannerEmails", JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching emails");
    } finally {
      setLoading(false);
    }
  };

  const handleReAuthenticate = () => {
    window.location.href = "/api/auth/signin";
  };

  const handleEmailClick = (email: EmailMessage) => {
    // Handle email click - could open email detail view
    console.log('Email clicked:', email);
  };

  const handleEmailSelect = (email: EmailMessage, selected: boolean) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(email.id);
      } else {
        newSet.delete(email.id);
      }
      return newSet;
    });
  };

  const handleFilterChange = (filterId: string, active: boolean) => {
    setFilters(prev =>
      prev.map(filter =>
        filter.id === filterId ? { ...filter, active } : filter
      )
    );
  };

  const handleClearFilters = () => {
    setFilters(prev => prev.map(filter => ({ ...filter, active: false })));
    setSearchQuery('');
  };

  const handleMultiSelectAction = (action: string) => {
    const selectedEmailObjects = messages.filter(email => selectedEmails.has(email.id));

    switch (action) {
      case 'markRead':
        setMessages(prev =>
          prev.map(email =>
            selectedEmails.has(email.id) ? { ...email, isRead: true } : email
          )
        );
        break;
      case 'markUnread':
        setMessages(prev =>
          prev.map(email =>
            selectedEmails.has(email.id) ? { ...email, isRead: false } : email
          )
        );
        break;
      case 'archive':
        // In a real app, this would archive the emails
        console.log('Archiving emails:', selectedEmailObjects);
        break;
      case 'delete':
        // In a real app, this would delete the emails
        console.log('Deleting emails:', selectedEmailObjects);
        break;
    }

    setSelectedEmails(new Set());
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      // If all are selected, deselect all
      setSelectedEmails(new Set());
    } else {
      // Select all filtered emails
      setSelectedEmails(new Set(filteredEmails.map(email => email.id)));
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Insurance Emails
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage insurance-related emails from your Gmail account
            </p>
          </div>

          {hasFetched && (
            <PremiumButton
              variant="glass"
              size="md"
              onClick={handleFetchEmails}
              loading={loading}
              icon={RefreshIcon}
              glow={true}
            >
              Refresh
            </PremiumButton>
          )}
        </div>

        {/* Filters */}
        {hasFetched && !error && (
          <PremiumEmailFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Initial fetch button */}
      {!hasFetched && !loading && !error && (
        <div className="flex justify-center py-12">
          <PremiumCard variant="glass" className="p-8 text-center max-w-md">
            <div className="mb-6">
              <GmailIcon className="w-16 h-16 mx-auto text-primary-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Connect to Gmail
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fetch your insurance-related emails to get started
              </p>
            </div>
            <PremiumButton
              variant="primary"
              size="lg"
              onClick={handleFetchEmails}
              icon={GmailIcon}
              glow={true}
            >
              Fetch Emails from Gmail
            </PremiumButton>
          </PremiumCard>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <PremiumCard variant="elevated" className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
              Error Occurred
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6 max-w-md">
              {error}
            </p>
            <PremiumButton
              variant="primary"
              onClick={handleReAuthenticate}
            >
              Re-authenticate
            </PremiumButton>
          </div>
        </PremiumCard>
      )}

      {/* Email list */}
      {hasFetched && !error && (
        <PremiumCard variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {filteredEmails.length === messages.length
                ? `All Emails (${messages.length})`
                : `Filtered Emails (${filteredEmails.length} of ${messages.length})`
              }
            </h2>

            {selectedEmails.size > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedEmails.size} selected
              </span>
            )}
          </div>

          <div className="max-h-[600px] overflow-y-auto scroll-smooth">
            <PremiumEmailList
              emails={filteredEmails}
              selectedEmails={selectedEmails}
              onEmailClick={handleEmailClick}
              onEmailSelect={handleEmailSelect}
              variant="glass"
              enableSwipe={true}
              leftSwipeActions={[
                {
                  id: 'markRead',
                  label: 'Mark as Read',
                  icon: ({ className }) => (
                    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ),
                  color: 'success',
                  action: (email) => {
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === email.id ? { ...msg, isRead: true } : msg
                      )
                    );
                  },
                },
              ]}
              rightSwipeActions={[
                {
                  id: 'archive',
                  label: 'Archive',
                  icon: ({ className }) => (
                    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
                    </svg>
                  ),
                  color: 'primary',
                  action: (email) => {
                    console.log('Archive email:', email.id);
                    // In a real app, this would archive the email
                  },
                },
                {
                  id: 'delete',
                  label: 'Delete',
                  icon: ({ className }) => (
                    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ),
                  color: 'error',
                  action: (email) => {
                    console.log('Delete email:', email.id);
                    // In a real app, this would delete the email
                  },
                },
              ]}
              loading={loading}
              emptyMessage={
                searchQuery || filters.some(f => f.active)
                  ? "No emails match your current filters"
                  : "No insurance-related messages found in your Gmail account"
              }
            />
          </div>
        </PremiumCard>
      )}

      {/* Multi-select actions */}
      <MultiSelectActions
        selectedCount={selectedEmails.size}
        onMarkAsRead={() => handleMultiSelectAction('markRead')}
        onMarkAsUnread={() => handleMultiSelectAction('markUnread')}
        onArchive={() => handleMultiSelectAction('archive')}
        onDelete={() => handleMultiSelectAction('delete')}
        onClearSelection={() => setSelectedEmails(new Set())}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
};

export default PremiumEmailsPage;
