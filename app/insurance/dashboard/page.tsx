import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {session?.user?.name || "User"}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Policy Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Policies
            </h3>
            <div className="text-3xl">📋</div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No policies found
          </p>
        </div>

        {/* Upcoming Renewals Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Renewals
            </h3>
            <div className="text-3xl">🔔</div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Next 30 days
          </p>
        </div>

        {/* Total Premium Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Premium
            </h3>
            <div className="text-3xl">💰</div>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">₹0</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Annual estimate
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
            <div className="text-2xl">📧</div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                Import from Gmail
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Scan your inbox for insurance emails
              </p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
            <div className="text-2xl">➕</div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                Add Policy Manually
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter policy details yourself
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
