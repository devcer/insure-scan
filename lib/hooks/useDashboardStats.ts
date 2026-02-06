/**
 * Dashboard Statistics Hook
 * Manages dashboard data fetching, animations, and state
 */

import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  activePoliciesCount: number;
  totalPolicyRows: number;
  upcomingPremiumsCount: number;
  totalDueAmountNext30Days: number;
  dataQualityPercentage: number;
  policiesWithCompleteData: number;
  lastScanAt: string | null;
  upcomingPremiums: any[];
  paidHistory: any[];
}

export interface StatCardConfig {
  title: string;
  key: keyof DashboardStats;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  currency?: boolean;
  percentage?: boolean;
  subtitle?: string;
  hoverDetails?: string;
  formatter?: (value: number) => string;
}

/**
 * Hook for managing dashboard statistics
 */
export const useDashboardStats = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  /**
   * Fetch dashboard data
   */
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/insurance/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Trigger email scan
   */
  const handleScan = useCallback(async () => {
    try {
      setScanning(true);
      setError(null);
      const response = await fetch("/api/insurance/scan", { method: "POST" });
      if (!response.ok) throw new Error("Failed to scan emails");
      const result = await response.json();
      
      // Show success message (you might want to use a toast notification instead)
      alert(`Scanned ${result.scannedCount} emails. Saved: ${result.savedCount}, Updated: ${result.updatedCount}`);
      
      // Refresh dashboard data
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [fetchDashboard]);

  /**
   * Get status for a stat based on its value and type
   */
  const getStatStatus = useCallback((key: keyof DashboardStats, value: number): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (key) {
      case 'dataQualityPercentage':
        if (value >= 90) return 'success';
        if (value >= 70) return 'warning';
        if (value < 70) return 'error';
        return 'default';
      
      case 'upcomingPremiumsCount':
        if (value === 0) return 'success';
        if (value <= 3) return 'info';
        if (value <= 7) return 'warning';
        return 'error';
      
      case 'totalDueAmountNext30Days':
        if (value === 0) return 'success';
        if (value <= 50000) return 'info';
        if (value <= 100000) return 'warning';
        return 'error';
      
      case 'activePoliciesCount':
        if (value >= 5) return 'success';
        if (value >= 3) return 'info';
        if (value >= 1) return 'warning';
        return 'error';
      
      default:
        return 'default';
    }
  }, []);

  /**
   * Get hover details for a stat
   */
  const getHoverDetails = useCallback((key: keyof DashboardStats, data: DashboardStats): string => {
    switch (key) {
      case 'activePoliciesCount':
        return `${data.totalPolicyRows} total email records processed`;
      
      case 'upcomingPremiumsCount':
        return 'Premiums due in the next 60 days';
      
      case 'totalDueAmountNext30Days':
        return 'Total amount pending payment';
      
      case 'dataQualityPercentage':
        return `${data.policiesWithCompleteData} policies have complete information`;
      
      default:
        return '';
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    scanning,
    fetchDashboard,
    handleScan,
    getStatStatus,
    getHoverDetails,
  };
};

export default useDashboardStats;
