'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewComplaint() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    departmentId: '',
    isAnonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-category detection based on keywords
  useEffect(() => {
    const text = (formData.title + ' ' + formData.description).toLowerCase();
    let newCategory = formData.category;

    if (text.includes('wifi') || text.includes('internet') || text.includes('network')) {
      newCategory = 'WiFi';
    } else if (text.includes('hostel') || text.includes('room') || text.includes('mess')) {
      newCategory = 'Hostel';
    } else if (text.includes('bus') || text.includes('transport') || text.includes('driver')) {
      newCategory = 'Transport';
    } else if (text.includes('class') || text.includes('exam') || text.includes('marks')) {
      newCategory = 'Academics';
    }

    if (newCategory !== formData.category && newCategory !== '') {
      setFormData(prev => ({ ...prev, category: newCategory }));
    }
  }, [formData.title, formData.description]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 3) {
        alert('You can only upload up to 3 files.');
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Upload files to Cloudinary via our API route
      const uploadedAttachments = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileData = new FormData();
          fileData.append('file', file);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: fileData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            uploadedAttachments.push({
              url: uploadData.url,
              public_id: uploadData.public_id,
            });
          }
        }
      }

      // 2. Submit Complaint
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          attachments: uploadedAttachments,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/student/complaints');
      } else {
        alert('Failed to submit complaint');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Submit a New Complaint
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
            <p>Please provide detailed information to help us resolve the issue quickly.</p>
          </div>
          
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                placeholder="Brief summary of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                placeholder="Provide detailed information..."
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category (Auto-detected)</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                >
                  <option value="">Select Category</option>
                  <option value="WiFi">WiFi / Network</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Transport">Transport</option>
                  <option value="Academics">Academics</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* In a real app, department would be fetched from API based on college */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Department</label>
              <input
                type="text"
                name="departmentId"
                required
                value={formData.departmentId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 p-2 border"
                placeholder="Department ID for now (demo)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachments (Max 3)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900/30 dark:file:text-blue-200"
              />
            </div>

            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="isAnonymous"
                  name="isAnonymous"
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isAnonymous" className="font-medium text-gray-700 dark:text-gray-300">Submit Anonymously</label>
                <p className="text-gray-500 dark:text-gray-400">Your name will be hidden from department admins.</p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
