'use client';

import { useState, useEffect } from 'react';

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Failed to fetch complaints', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchComplaints(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Complaints</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and update the status of complaints assigned to your department.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {complaints.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">No complaints found.</li>
            ) : (
              complaints.map((complaint) => (
                <li key={complaint._id} className="p-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">{complaint.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {complaint.category} • Priority: {complaint.priority} • By: {complaint.isAnonymous ? 'Anonymous' : 'Student'}
                      </p>
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        {complaint.description}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
