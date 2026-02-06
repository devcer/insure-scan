/**
 * Policies Hook
 * Manages policy data fetching, filtering, and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { PolicyData } from '../components/PolicyCard';

export interface PremiumData {
  id: string;
  insurer_name: string;
  policy_number: string | null;
  amount: number | null;
  due_date: string | null;
  payment_status: string;
  received_at: string;
  email_subject: string | null;
  policy_key: string;
  archived?: boolean;
}

export interface PoliciesFilters {
  status?: string;
  search?: string;
  archived?: boolean;
  limit?: number;
}

/**
 * Convert premium data to policy data format
 */
const convertPremiumToPolicy = (premium: PremiumData): PolicyData => ({
  id: premium.id,
  insurerName: premium.insurer_name,
  policyNumber: premium.policy_number || undefined,
  amount: premium.amount || 0,
  dueDate: premium.due_date || undefined,
  status: premium.payment_status as PolicyData['status'],
  type: getInsuranceType(premium.insurer_name),
  receivedAt: premium.received_at,
});

/**
 * Detect insurance type from company name
 */
const getInsuranceType = (insurerName: string): string => {
  const name = insurerName.toLowerCase();
  if (name.includes("health") || name.includes("medical") || name.includes("care")) {
    return "Health Insurance";
  }
  if (name.includes("vehicle") || name.includes("car") || name.includes("motor") || name.includes("auto")) {
    return "Vehicle Insurance";
  }
  if (name.includes("life") || name.includes("lic")) {
    return "Life Insurance";
  }
  if (name.includes("home") || name.includes("property")) {
    return "Home Insurance";
  }
  if (name.includes("travel")) {
    return "Travel Insurance";
  }
  return "General Insurance";
};

/**
 * Hook for managing policies
 */
export const usePolicies = (filters: PoliciesFilters = {}) => {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch policies from API
   */
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.archived) params.set("archived", "only");
      if (filters.limit) params.set("limit", filters.limit.toString());

      const response = await fetch(`/api/insurance/premiums?${params}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) throw new Error("Failed to fetch policies");
      
      const result = await response.json();
      const convertedPolicies = result.premiums.map(convertPremiumToPolicy);
      setPolicies(convertedPolicies);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, filters.archived, filters.limit]);

  /**
   * Archive a policy
   */
  const archivePolicy = useCallback(async (policyId: string) => {
    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      
      if (!response.ok) throw new Error("Failed to archive policy");
      
      // Update local state
      setPolicies(prev => prev.filter(p => p.id !== policyId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive policy");
      return false;
    }
  }, []);

  /**
   * Unarchive a policy
   */
  const unarchivePolicy = useCallback(async (policyId: string) => {
    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      
      if (!response.ok) throw new Error("Failed to unarchive policy");
      
      // Refresh data to get updated policy
      await fetchPolicies();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unarchive policy");
      return false;
    }
  }, [fetchPolicies]);

  /**
   * Get recent policies (for dashboard)
   */
  const getRecentPolicies = useCallback((limit: number = 6): PolicyData[] => {
    return policies
      .filter(p => !p.status || p.status !== 'PAID') // Exclude paid policies
      .sort((a, b) => {
        // Sort by due date (closest first), then by received date (newest first)
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && b.dueDate) return 1;
        
        // If no due dates, sort by received date
        if (a.receivedAt && b.receivedAt) {
          return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
        }
        return 0;
      })
      .slice(0, limit);
  }, [policies]);

  /**
   * Get policies by status
   */
  const getPoliciesByStatus = useCallback((status: PolicyData['status']): PolicyData[] => {
    return policies.filter(p => p.status === status);
  }, [policies]);

  /**
   * Get policies statistics
   */
  const getStatistics = useCallback(() => {
    const total = policies.length;
    const paid = policies.filter(p => p.status === 'PAID').length;
    const pending = policies.filter(p => p.status === 'PENDING').length;
    const overdue = policies.filter(p => p.status === 'OVERDUE').length;
    const unknown = policies.filter(p => p.status === 'UNKNOWN').length;
    
    const totalAmount = policies.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingAmount = policies
      .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      total,
      paid,
      pending,
      overdue,
      unknown,
      totalAmount,
      pendingAmount,
    };
  }, [policies]);

  // Initial fetch
  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return {
    policies,
    loading,
    error,
    fetchPolicies,
    archivePolicy,
    unarchivePolicy,
    getRecentPolicies,
    getPoliciesByStatus,
    getStatistics,
  };
};

export default usePolicies;
