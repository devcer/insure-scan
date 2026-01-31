"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardData {
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/insurance/dashboard");
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      setError(null);
      const response = await fetch("/api/insurance/scan", { method: "POST" });
      if (!response.ok) throw new Error("Failed to scan emails");
      const result = await response.json();
      alert(`Scanned ${result.scannedCount} emails. Saved: ${result.savedCount}, Updated: ${result.updatedCount}`);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session?.user?.name || "User"}!
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {scanning ? "Scanning..." : "Scan Now"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Unique Policies
              </h3>
              <div className="text-3xl">📋</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {data?.activePoliciesCount || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data?.totalPolicyRows || 0} total emails
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Premiums
              </h3>
              <div className="text-3xl">🔔</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {data?.upcomingPremiumsCount || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Next 60 days
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Due Next 30 Days
              </h3>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ₹{data?.totalDueAmountNext30Days?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total pending
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Quality
              </h3>
              <div className="text-3xl">✨</div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {data?.dataQualityPercentage || 0}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data?.policiesWithCompleteData || 0} complete records
            </p>
          </div>
        </div>
      )}

      {data?.lastScanAt && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Last scanned: {new Date(data.lastScanAt).toLocaleString()}
        </p>
      )}

      {/* Upcoming Premiums */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Premiums
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : data?.upcomingPremiums && data.upcomingPremiums.length > 0 ? (
          <div className="space-y-3">
            {data.upcomingPremiums.map((premium) => {
              const daysUntil = getDaysUntilDue(premium.due_date);
              const isOverdue = daysUntil < 0;
              return (
                <div key={premium.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{premium.insurer_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{premium.policy_number || 'No policy number'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                    </p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No upcoming premiums</p>
        )}
      </div>

      {/* Paid History */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Payments
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : data?.paidHistory && data.paidHistory.length > 0 ? (
          <div className="space-y-3">
            {data.paidHistory.map((premium) => (
              <div key={premium.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{premium.insurer_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(premium.received_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded">
                    PAID
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No payment history</p>
        )}
      </div>
    </div>
  );
}
