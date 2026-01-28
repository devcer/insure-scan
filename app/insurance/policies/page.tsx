"use client";

import { useEffect, useState } from "react";

interface Premium {
  id: string;
  insurer_name: string;
  policy_number: string | null;
  amount: number | null;
  due_date: string | null;
  payment_status: string;
  received_at: string;
  email_subject: string | null;
  policy_key: string;
}

// Helper function to detect insurance type from company name
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

// Helper function to get status badge colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
    case "OVERDUE":
      return "bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700";
    case "DUE":
      return "bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  }
};

export default function PoliciesPage() {
  const [premiums, setPremiums] = useState<Premium[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchPremiums = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);

      const response = await fetch(`/api/insurance/premiums?${params}`);
      if (!response.ok) throw new Error("Failed to fetch premiums");
      const result = await response.json();
      setPremiums(result.premiums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      const response = await fetch("/api/insurance/scan", { method: "POST" });
      if (!response.ok) throw new Error("Failed to scan emails");
      const result = await response.json();
      alert(`Scanned ${result.messageCount} emails. Saved: ${result.savedCount}, Updated: ${result.updatedCount}`);
      await fetchPremiums();
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchPremiums();
  }, [status, search]);

  return (
    <div>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Insurance Policies
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your insurance policies
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
        <input
          type="text"
          placeholder="Search insurer or policy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Policy Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          ))}
        </div>
      ) : premiums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premiums.map((premium) => (
            <div
              key={premium.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getInsuranceType(premium.insurer_name)}
                  </h3>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(premium.payment_status)}`}>
                    {premium.payment_status}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {premium.insurer_name}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                {/* Policy Number */}
                {premium.policy_number && (
                  <div className="flex items-start">
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[100px]">
                      Policy Number:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {premium.policy_number}
                    </span>
                  </div>
                )}

                {/* Due Date */}
                {premium.due_date && (
                  <div className="flex items-start">
                    <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[100px]">
                      Due Date:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(premium.due_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Annual Premium */}
                <div className="flex items-start">
                  <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[100px]">
                    Annual Premium:
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Policy Summary */}
                {premium.email_subject && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Summary:
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {premium.email_subject}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Received: {new Date(premium.received_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No policies found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start by scanning your insurance emails
            </p>
            <button
              onClick={handleScan}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Scan Emails
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
