"use client";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "../components/ui/sidebar";
import { UrgentModeProvider, useUrgentMode } from "../context/UrgentModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const metadata: Metadata = {
  title: "Southern Railway - Dashboard",
  description: "Southern Railway Employee Portal Dashboard",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isUrgentMode, toggleUrgentMode } = useUrgentMode();
  const pathname = usePathname();

  // If user is 'USER' and on dashboard home, render only children (no nav/sidebar)
  if ((session?.user?.role === "USER" && pathname === "/dashboard") || pathname === "/dashboard/create-block-request") {
    return <>{children}</>;
  }

  // Handle sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  const themeColors = {
    primary: isUrgentMode ? '#dc2626' : '#3277BC', // Red for urgent, Blue for normal
    hover: isUrgentMode ? '#b91c1c' : '#2c6cb0', // Darker red for urgent, Darker blue for normal
    text: isUrgentMode ? '#991b1b' : '#13529e', // Dark red for urgent, Dark blue for normal
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar - Responsive with dynamic color scheme */}
      <nav
        className={`text-white h-12 md:h-10 flex items-center px-4 shadow-sm z-30 sticky top-0 transition-colors duration-200`}
        style={{ backgroundColor: themeColors.primary }}
      >
        {/* Mobile menu toggle */}
        <button
          data-sidebar-toggle
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden mr-2 p-1 rounded-md hover:bg-opacity-80"
          style={{ backgroundColor: themeColors.hover }}
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <span className="ml-2 md:ml-3 text-xs text-white/80 truncate">
          Employee Portal
        </span>

        {/* Urgent Mode Label - Only shown when urgent mode is active */}
        {isUrgentMode && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-red-600 px-4 py-1 rounded-full shadow-lg animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Urgent Mode Active</span>
          </div>
        )}

        {/* Urgent Mode Toggle */}
        <div className="ml-auto flex items-center gap-4">
          <div className="relative group">
            <button
              onClick={toggleUrgentMode}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 flex items-center gap-1 ${isUrgentMode
                ? 'bg-white text-red-600 hover:bg-red-50'
                : 'bg-white text-blue-600 hover:bg-blue-50'
                }`}
              aria-label={isUrgentMode ? "Switch to normal mode" : "Switch to urgent mode"}
            >
              {isUrgentMode ? "Urgent Mode" : "Normal Mode"}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="absolute right-0 mt-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="mb-1 font-medium">Urgent Mode</p>
              <p className="text-gray-300">
                Click to enable Urgent Mode. In this mode, only urgent block requests and emergency work types will be shown. This enables the user to focus on the urgent requests for the next day and optmize the schedule for the next day.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="hover:underline hidden sm:block"
          >
            Home
          </Link>
          <Link href="/help" className="hover:underline hidden sm:block">
            Help
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs hover:underline text-white"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex flex-1 bg-white relative">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 transition-transform duration-200 ease-in-out z-20`}
        >
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-64 p-4 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UrgentModeProvider>
      <DashboardContent>{children}</DashboardContent>
    </UrgentModeProvider>
  );
}
