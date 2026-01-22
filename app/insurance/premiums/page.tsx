export default function PremiumsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Premiums
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all your insurance premiums
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option>All Types</option>
          <option>Health Insurance</option>
          <option>Auto Insurance</option>
          <option>Home Insurance</option>
          <option>Life Insurance</option>
        </select>
        <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option>All Status</option>
          <option>Active</option>
          <option>Expiring Soon</option>
          <option>Expired</option>
        </select>
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No premiums found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by importing your insurance emails or adding policies manually
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Import from Gmail
          </button>
        </div>
      </div>
    </div>
  );
}
