/**
 * PremiumPoliciesPage Component
 * Enhanced policies page with premium design, advanced filtering, and smooth animations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../utils/cn';
import { PremiumSearch, SearchSuggestion } from './PremiumSearch';
import { PremiumFilters, FilterGroup } from './PremiumFilters';
import { PolicyGrid, PolicyData } from './PolicyCard';
import { PolicyForm, PolicyFormData } from './PolicyForm';
import { PremiumButton } from './PremiumButton';
import { usePolicies } from '../hooks/usePolicies';
import { getInsuranceIcon } from './icons/InsuranceIcons';

export interface PremiumPoliciesPageProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Enhanced policies page with premium design and advanced features
 */
export const PremiumPoliciesPage: React.FC<PremiumPoliciesPageProps> = ({
  className,
}) => {
  const router = useRouter();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'dueDate' | 'status'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

  // Fetch policies data
  const {
    policies,
    loading,
    error,
    fetchPolicies,
    archivePolicy,
    unarchivePolicy,
  } = usePolicies({
    search: searchQuery,
    ...Object.fromEntries(
      Object.entries(activeFilters).map(([key, values]) => [
        key === 'status' ? 'status' : key,
        values.length === 1 ? values[0] : values
      ])
    ),
  });

  // Generate search suggestions
  const searchSuggestions = useMemo((): SearchSuggestion[] => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const query = searchQuery.toLowerCase();

    // Company suggestions
    const companies = [...new Set(policies.map(p => p.insurerName))];
    companies
      .filter(company => company.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(company => {
        suggestions.push({
          id: `company-${company}`,
          text: company,
          type: 'company',
          icon: getInsuranceIcon('General Insurance'),
        });
      });

    // Type suggestions
    const types = [...new Set(policies.map(p => p.type))];
    types
      .filter(type => type.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach(type => {
        suggestions.push({
          id: `type-${type}`,
          text: type,
          type: 'type',
          icon: getInsuranceIcon(type),
        });
      });

    // Policy number suggestions
    policies
      .filter(p => p.policyNumber?.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach(policy => {
        suggestions.push({
          id: `policy-${policy.id}`,
          text: policy.policyNumber!,
          type: 'policy',
        });
      });

    return suggestions;
  }, [searchQuery, policies]);

  // Generate filter groups
  const filterGroups = useMemo((): FilterGroup[] => {
    const statusCounts = policies.reduce((acc, policy) => {
      acc[policy.status] = (acc[policy.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeCounts = policies.reduce((acc, policy) => {
      acc[policy.type] = (acc[policy.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const companyCounts = policies.reduce((acc, policy) => {
      acc[policy.insurerName] = (acc[policy.insurerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      {
        id: 'status',
        label: 'Payment Status',
        type: 'multiple',
        options: [
          { value: 'PENDING', label: 'Pending', count: statusCounts.PENDING || 0 },
          { value: 'PAID', label: 'Paid', count: statusCounts.PAID || 0 },
          { value: 'OVERDUE', label: 'Overdue', count: statusCounts.OVERDUE || 0 },
          { value: 'UNKNOWN', label: 'Unknown', count: statusCounts.UNKNOWN || 0 },
        ],
      },
      {
        id: 'type',
        label: 'Insurance Type',
        type: 'multiple',
        options: Object.entries(typeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => ({
            value: type,
            label: type,
            count,
          })),
      },
      {
        id: 'company',
        label: 'Insurance Company',
        type: 'multiple',
        options: Object.entries(companyCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([company, count]) => ({
            value: company,
            label: company,
            count,
          })),
      },
    ];
  }, [policies]);

  // Filter and sort policies
  const filteredPolicies = useMemo(() => {
    let filtered = [...policies];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(policy =>
        policy.insurerName.toLowerCase().includes(query) ||
        policy.type.toLowerCase().includes(query) ||
        policy.policyNumber?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([filterType, values]) => {
      if (values.length === 0) return;

      filtered = filtered.filter(policy => {
        switch (filterType) {
          case 'status':
            return values.includes(policy.status);
          case 'type':
            return values.includes(policy.type);
          case 'company':
            return values.includes(policy.insurerName);
          default:
            return true;
        }
      });
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.insurerName.localeCompare(b.insurerName);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'status':
          const statusOrder = { OVERDUE: 0, PENDING: 1, UNKNOWN: 2, PAID: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [policies, searchQuery, activeFilters, sortBy, sortOrder]);

  // Handle search suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'company':
        setActiveFilters(prev => ({
          ...prev,
          company: [...(prev.company || []), suggestion.text],
        }));
        setSearchQuery('');
        break;
      case 'type':
        setActiveFilters(prev => ({
          ...prev,
          type: [...(prev.type || []), suggestion.text],
        }));
        setSearchQuery('');
        break;
      default:
        setSearchQuery(suggestion.text);
    }
  };

  // Handle policy actions
  const handleEditPolicy = (id: string) => {
    const policy = policies.find(p => p.id === id);
    if (policy) {
      setEditingPolicy(policy);
      setIsFormOpen(true);
    }
  };

  const handleArchivePolicy = async (id: string) => {
    const policy = policies.find(p => p.id === id);
    if (!policy) return;

    if (policy.archived) {
      await unarchivePolicy(id);
    } else {
      await archivePolicy(id);
    }
  };

  const handleFormSubmit = async (formData: PolicyFormData) => {
    // Implementation would depend on your API
    console.log('Form submitted:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Refresh policies
    await fetchPolicies();
  };

  const handleScanEmails = async () => {
    setIsScanning(true);
    try {
      const response = await fetch('/api/insurance/scan', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to scan emails');

      const result = await response.json();
      alert(`Scanned ${result.messageCount} emails. Saved: ${result.savedCount}, Updated: ${result.updatedCount}`);

      await fetchPolicies();
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Failed to scan emails');
    } finally {
      setIsScanning(false);
    }
  };

  const handlePolicyReorder = (reorderedPolicies: PolicyData[]) => {
    // Implementation would depend on your requirements
    console.log('Policies reordered:', reorderedPolicies);
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Insurance Policies
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage and track all your insurance policies in one place
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <PremiumButton
            variant="secondary"
            onClick={handleScanEmails}
            loading={isScanning}
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          >
            {isScanning ? 'Scanning...' : 'Scan Emails'}
          </PremiumButton>

          <PremiumButton
            variant="primary"
            onClick={() => {
              setEditingPolicy(null);
              setIsFormOpen(true);
            }}
            glow
            className="bg-blue-600 hover:bg-blue-700 text-white"
            icon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          >
            Add Policy
          </PremiumButton>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        {/* Search Bar */}
        <PremiumSearch
          value={searchQuery}
          onChange={setSearchQuery}
          suggestions={searchSuggestions}
          onSuggestionSelect={handleSuggestionSelect}
          loading={loading}
          placeholder="Search policies, companies, or types..."
        />

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <PremiumFilters
              filterGroups={filterGroups}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as typeof sortBy);
                  setSortOrder(order as typeof sortOrder);
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="dueDate-asc">Due Date (Earliest)</option>
                <option value="dueDate-desc">Due Date (Latest)</option>
                <option value="name-asc">Company (A-Z)</option>
                <option value="name-desc">Company (Z-A)</option>
                <option value="amount-asc">Amount (Low-High)</option>
                <option value="amount-desc">Amount (High-Low)</option>
                <option value="status-asc">Status</option>
              </select>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDragEnabled(!dragEnabled)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                dragEnabled
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {dragEnabled ? 'Disable Drag' : 'Enable Drag'}
            </button>

            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredPolicies.length} of {policies.length} policies
          </span>
          {Object.keys(activeFilters).length > 0 && (
            <button
              onClick={() => setActiveFilters({})}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Policy Grid */}
      <PolicyGrid
        policies={filteredPolicies}
        variant={viewMode === 'list' ? 'compact' : 'default'}
        loading={loading}
        onClick={(id) => router.push(`/policies/${id}`)}
        onEdit={handleEditPolicy}
        onArchive={handleArchivePolicy}
        onReorder={dragEnabled ? handlePolicyReorder : undefined}
        draggable={dragEnabled}
      />

      {/* Policy Form Modal */}
      <PolicyForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPolicy(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPolicy ? {
          insurerName: editingPolicy.insurerName,
          policyNumber: editingPolicy.policyNumber || '',
          amount: editingPolicy.amount.toString(),
          dueDate: editingPolicy.dueDate || '',
          paymentStatus: editingPolicy.status,
          emailSubject: '',
          insuranceType: editingPolicy.type,
        } : undefined}
        isEditing={!!editingPolicy}
      />
    </div>
  );
};

export default PremiumPoliciesPage;
