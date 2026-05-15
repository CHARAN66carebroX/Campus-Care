import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export default async function CollegeDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">College Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Institution-wide overview of all departments and complaints.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Stat Cards */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Complaints</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">0</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Escalated to College Level</dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600 dark:text-red-400">0</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Active Departments</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">0</dd>
          </div>
        </div>
      </div>
      
      {/* Charts would go here (using Chart.js) */}
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Analytics Overview</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
          [Chart.js Component - Complaints by Category]
        </div>
      </div>
    </div>
  );
}
