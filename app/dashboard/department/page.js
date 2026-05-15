import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';

export default async function DepartmentDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Department Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of complaints for your department.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Cards */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">0</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Pending</dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600 dark:text-yellow-400">0</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600 dark:text-blue-400">0</dd>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
          <div className="p-5">
            <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600 dark:text-green-400">0</dd>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/dashboard/department/complaints" className="text-blue-600 dark:text-blue-400 hover:underline">
          View all complaints &rarr;
        </Link>
      </div>
    </div>
  );
}
