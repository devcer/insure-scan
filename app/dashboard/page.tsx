"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardStatsCard, PremiumButton, RefreshIcon, SpinnerIcon, PolicyIcon, BellIcon, CurrencyIcon, SparklesIcon, PolicyGrid } from "../../lib/components";
import { useDashboardStats, usePolicies } from "../../lib/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    data,
    loading,
    error,
    scanning,
    handleScan,
    getStatStatus,
    getHoverDetails,
  } = useDashboardStats();

  // Get recent policies for dashboard display
  const {
    policies: allPolicies,
    loading: policiesLoading,
    getRecentPolicies,
  } = usePolicies({ limit: 6 });

  const recentPolicies = getRecentPolicies(6);

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session?.user?.name || "User"}!
          </p>
        </div>
        <PremiumButton
          variant="glass"
          onClick={handleScan}
          disabled={scanning}
          loading={scanning}
          icon={scanning ? SpinnerIcon : RefreshIcon}
          glow={true}
        >
          {scanning ? "Scanning..." : "Scan Now"}
        </PremiumButton>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 glass border-error-200 dark:border-error-800 rounded-xl text-error-700 dark:text-error-400 animate-slide-in-down">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-error-500 rounded-full"></div>
            {error}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardStatsCard
          title="Unique Policies"
          value={data?.activePoliciesCount || 0}
          subtitle={`${data?.totalPolicyRows || 0} total emails`}
          icon={PolicyIcon}
          status={data ? getStatStatus('activePoliciesCount', data.activePoliciesCount) : 'default'}
          hoverDetails={data ? getHoverDetails('activePoliciesCount', data) : undefined}
          loading={loading}
          className="animate-slide-in-up"
          style={{ animationDelay: '0ms' } as React.CSSProperties}
        />

        <DashboardStatsCard
          title="Upcoming Premiums"
          value={data?.upcomingPremiumsCount || 0}
          subtitle="Next 60 days"
          icon={BellIcon}
          status={data ? getStatStatus('upcomingPremiumsCount', data.upcomingPremiumsCount) : 'default'}
          hoverDetails={data ? getHoverDetails('upcomingPremiumsCount', data) : undefined}
          loading={loading}
          className="animate-slide-in-up"
          style={{ animationDelay: '100ms' } as React.CSSProperties}
        />

        <DashboardStatsCard
          title="Due Next 30 Days"
          value={data?.totalDueAmountNext30Days || 0}
          subtitle="Total pending"
          icon={CurrencyIcon}
          status={data ? getStatStatus('totalDueAmountNext30Days', data.totalDueAmountNext30Days) : 'default'}
          hoverDetails={data ? getHoverDetails('totalDueAmountNext30Days', data) : undefined}
          currency={true}
          loading={loading}
          className="animate-slide-in-up"
          style={{ animationDelay: '200ms' } as React.CSSProperties}
        />

        <DashboardStatsCard
          title="Data Quality"
          value={data?.dataQualityPercentage || 0}
          subtitle={`${data?.policiesWithCompleteData || 0} complete records`}
          icon={SparklesIcon}
          status={data ? getStatStatus('dataQualityPercentage', data.dataQualityPercentage) : 'default'}
          hoverDetails={data ? getHoverDetails('dataQualityPercentage', data) : undefined}
          percentage={true}
          loading={loading}
          className="animate-slide-in-up"
          style={{ animationDelay: '300ms' } as React.CSSProperties}
        />
      </div>

      {/* Last Scan Info */}
      {data?.lastScanAt && (
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          Last scanned: {new Date(data.lastScanAt).toLocaleString()}
        </p>
      )}

      {/* Upcoming Premiums */}
      <div className="mb-8 glass rounded-2xl p-6 animate-slide-in-up" style={{ animationDelay: '400ms' } as React.CSSProperties}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-warning-100 dark:bg-warning-900/20 rounded-xl">
            <BellIcon className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          </div>
          Upcoming Premiums
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 glass rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : data?.upcomingPremiums && data.upcomingPremiums.length > 0 ? (
          <div className="space-y-3">
            {data.upcomingPremiums.map((premium, index) => {
              const daysUntil = getDaysUntilDue(premium.due_date);
              const isOverdue = daysUntil < 0;
              const isUrgent = daysUntil <= 7 && daysUntil >= 0;

              return (
                <div
                  key={premium.id}
                  className={`
                    flex justify-between items-center p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]
                    ${isOverdue
                      ? 'bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                      : isUrgent
                        ? 'bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'glass hover:shadow-premium'
                    }
                  `}
                  style={{ animationDelay: `${500 + index * 100}ms` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-3 h-3 rounded-full
                      ${isOverdue
                        ? 'bg-error-500 animate-pulse'
                        : isUrgent
                          ? 'bg-warning-500 animate-pulse'
                          : 'bg-info-500'
                      }
                    `} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{premium.insurer_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{premium.policy_number || 'No policy number'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                    </p>
                    <p className={`text-sm font-medium ${isOverdue
                      ? 'text-error-600 dark:text-error-400'
                      : isUrgent
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-info-600 dark:text-info-400'
                      }`}>
                      {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : `Due in ${daysUntil} days`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No upcoming premiums</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="glass rounded-2xl p-6 animate-slide-in-up" style={{ animationDelay: '500ms' } as React.CSSProperties}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="p-2 bg-success-100 dark:bg-success-900/20 rounded-xl">
            <SparklesIcon className="w-5 h-5 text-success-600 dark:text-success-400" />
          </div>
          Recent Payments
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 glass rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : data?.paidHistory && data.paidHistory.length > 0 ? (
          <div className="space-y-3">
            {data.paidHistory.map((premium, index) => (
              <div
                key={premium.id}
                className="flex justify-between items-center p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                style={{ animationDelay: `${600 + index * 100}ms` } as React.CSSProperties}
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-success-500 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{premium.insurer_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(premium.received_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                    </p>
                    <span className="text-xs px-2 py-1 bg-success-200 dark:bg-success-700 text-success-800 dark:text-success-200 rounded-full font-medium">
                      PAID
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <CurrencyIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No payment history</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Payments will appear here once processed</p>
          </div>
        )}
      </div>

      {/* Recent Policies */}
      <div className="mt-8 glass rounded-2xl p-6 animate-slide-in-up" style={{ animationDelay: '600ms' } as React.CSSProperties}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-xl">
              <PolicyIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            Recent Policies
          </h2>
          <a
            href="/policies"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            View All →
          </a>
        </div>

        <PolicyGrid
          policies={recentPolicies}
          variant="compact"
          loading={policiesLoading}
          onClick={(id) => router.push(`/policies/${id}`)}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        />
      </div>
    </div>
  );
}
