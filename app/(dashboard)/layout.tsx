"use client";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

  // Define theme colors based on mode
  const themeColors = {
    primary: isUrgentMode ? '#dc2626' : '#3277BC', // Red for urgent, Blue for normal
    hover: isUrgentMode ? '#b91c1c' : '#2c6cb0', // Darker red for urgent, Darker blue for normal
    text: isUrgentMode ? '#991b1b' : '#13529e', // Dark red for urgent, Dark blue for normal
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} font-sans bg-gray-50 min-h-screen`}
      >
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

            {/* Urgent Mode Toggle */}
            <div className="ml-auto flex items-center gap-4">
              <button
                onClick={toggleUrgentMode}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                  isUrgentMode 
                    ? 'bg-white text-red-600 hover:bg-red-50' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label={isUrgentMode ? "Switch to normal mode" : "Switch to urgent mode"}
              >
                {isUrgentMode ? "Urgent Mode" : "Normal Mode"}
              </button>

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
            {/* Sidebar Component */}
            <div className="fixed top-[48px] md:top-[40px] left-0 h-[calc(100vh-48px)] md:h-[calc(100vh-40px)] z-20">
              <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isUrgentMode={isUrgentMode}
              />
            </div>

            {/* Main Content - Responsive */}
            <main className="flex-1 p-4 sm:p-5 md:p-6 overflow-y-auto w-full md:ml-64">
              {children}
            </main>
          </div>

          {/* Footer - Responsive */}
          <footer className="bg-white border-t border-gray-200 py-2 md:py-3 text-center text-xs text-gray-500 mt-auto">
            <p className="px-4">
              © {new Date().getFullYear()} Southern Railway. All rights
              reserved.
            </p>
          </footer>
        </div>
      </body>
    </html>
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
