'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Users, 
  Building 
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (user?.role) {
      case 'student':
        return [
          { name: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
          { name: 'My Complaints', href: '/dashboard/student/complaints', icon: FileText },
          { name: 'New Complaint', href: '/dashboard/student/complaints/new', icon: PlusCircle },
        ];
      case 'dept_admin':
        return [
          { name: 'Dashboard', href: '/dashboard/department', icon: LayoutDashboard },
          { name: 'Manage Complaints', href: '/dashboard/department/complaints', icon: FileText },
        ];
      case 'college_admin':
        return [
          { name: 'Dashboard', href: '/dashboard/college', icon: LayoutDashboard },
          { name: 'All Complaints', href: '/dashboard/college/complaints', icon: FileText },
          { name: 'Departments', href: '/dashboard/college/departments', icon: Building },
        ];
      case 'super_admin':
        return [
          { name: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard },
          { name: 'Colleges', href: '/dashboard/super-admin/colleges', icon: Building },
          { name: 'Users', href: '/dashboard/super-admin/users', icon: Users },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Campus Care</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 dark:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  );
}
