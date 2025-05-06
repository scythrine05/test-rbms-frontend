"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface HeaderProps {
  user: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
    id?: string;
  };
  date?: string;
}

export default function DashboardHeader({ user, date }: HeaderProps) {
  const router = useRouter();
  
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };
  
  return (
    <header className="bg-white shadow-sm p-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-black">Dashboard</h1>
          <span className="text-black font-medium">{user?.name || 'User'}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-gray-700 hover:text-[#F37A1F]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F37A1F] flex items-center justify-center text-white">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <span className="hidden md:inline text-sm font-medium text-black">{user?.name || 'User'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
              <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-black hover:bg-gray-100">Profile</a>
              <a href="/dashboard/settings" className="block px-4 py-2 text-sm text-black hover:bg-gray-100">Settings</a>
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
