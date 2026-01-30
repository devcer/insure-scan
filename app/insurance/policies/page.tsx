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
  archived?: boolean;
}

interface PolicyFormData {
  insurer_name: string;
  policy_number: string;
  amount: string;
  due_date: string;
  payment_status: string;
  email_subject: string;
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
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Premium | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    insurer_name: "",
    policy_number: "",
    amount: "",
    due_date: "",
    payment_status: "PENDING",
    email_subject: "",
  });

  const fetchPremiums = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== "ALL") params.set("status", status);
      if (search) params.set("search", search);
      if (showArchived) params.set("archived", "only");

      const response = await fetch(`/api/insurance/premiums?${params}`, {
        cache: 'no-store', // Force fresh data from server
      });
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

  const openAddModal = () => {
    setEditingPolicy(null);
    setFormData({
      insurer_name: "",
      policy_number: "",
      amount: "",
      due_date: "",
      payment_status: "PENDING",
      email_subject: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (policy: Premium) => {
    setEditingPolicy(policy);
    setFormData({
      insurer_name: policy.insurer_name,
      policy_number: policy.policy_number || "",
      amount: policy.amount?.toString() || "",
      due_date: policy.due_date || "",
      payment_status: policy.payment_status,
      email_subject: policy.email_subject || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPolicy(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : null,
      };

      if (editingPolicy) {
        // Update existing policy
        const response = await fetch(`/api/insurance/policies/${editingPolicy.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to update policy");
        alert("Policy updated successfully!");
      } else {
        // Create new policy
        const response = await fetch("/api/insurance/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create policy");
        alert("Policy created successfully!");
      }

      closeModal();
      await fetchPremiums();
    } catch (err) {
      console.error(err);
      alert("Failed to save policy");
    }
  };

  const handleArchive = async (policyId: string) => {
    if (!confirm("Are you sure you want to archive this policy?")) return;

    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!response.ok) throw new Error("Failed to archive policy");
      alert("Policy archived successfully!");
      await fetchPremiums();
    } catch (err) {
      console.error(err);
      alert("Failed to archive policy");
    }
  };

  const handleUnarchive = async (policyId: string) => {
    try {
      const response = await fetch(`/api/insurance/policies/${policyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (!response.ok) throw new Error("Failed to unarchive policy");
      alert("Policy restored successfully!");
      await fetchPremiums();
    } catch (err) {
      console.error(err);
      alert("Failed to unarchive policy");
    }
  };

  useEffect(() => {
    fetchPremiums();
  }, [status, search, showArchived]);

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
        <div className="flex gap-3">
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Policy
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
        </div>
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
        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Show Archived</span>
        </label>
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
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(premium.payment_status)}`}>
                      {premium.payment_status}
                    </span>
                    {premium.archived && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-400 text-white">
                        ARCHIVED
                      </span>
                    )}
                  </div>
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
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Received: {new Date(premium.received_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <div className="flex gap-2">
                  {!premium.archived ? (
                    <>
                      <button
                        onClick={() => openEditModal(premium)}
                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleArchive(premium.id)}
                        className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Archive
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUnarchive(premium.id)}
                      className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      Restore
                    </button>
                  )}
                </div>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingPolicy ? "Edit Policy" : "Add New Policy"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Insurance Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.insurer_name}
                    onChange={(e) => setFormData({ ...formData, insurer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., HDFC Life Insurance"
                  />
                </div>

                {/* Policy Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={formData.policy_number}
                    onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., POL123456789"
                  />
                </div>

                {/* Annual Premium */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Premium (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 50000"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>

                {/* Policy Summary/Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes/Summary
                  </label>
                  <textarea
                    rows={3}
                    value={formData.email_subject}
                    onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Add any notes or summary about this policy..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPolicy ? "Update Policy" : "Create Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
