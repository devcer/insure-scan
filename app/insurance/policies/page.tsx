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
}

export default function PremiumsPage() {
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
      alert(`Scanned ${result.scannedCount} emails. Saved: ${result.savedCount}, Updated: ${result.updatedCount}`);
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
            Premiums
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all your insurance premiums
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
          <option value="DUE">Due</option>
          <option value="PAID">Paid</option>
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

      {/* Premiums Table */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : premiums.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Insurer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Policy #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {premiums.map((premium) => (
                  <tr key={premium.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      {premium.insurer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {premium.policy_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                      ₹{Number(premium.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {premium.due_date ? new Date(premium.due_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${premium.payment_status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          premium.payment_status === 'DUE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                        {premium.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(premium.received_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No premiums found
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
