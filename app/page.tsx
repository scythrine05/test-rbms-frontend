"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Home Page - Root route
 * This component handles authentication redirects:
 * - Authenticated users are redirected to the dashboard
 * - Unauthenticated users are redirected to the login page
 * - Shows a loading state while checking authentication status
 */
export default function Home() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    // Log session information for debugging
    console.log("Home page - Session status:", status);
    console.log("Home page - Session data:", session);

    // Handle redirection based on authentication status
    if (status === "authenticated") {
      console.log("User is authenticated, redirecting to dashboard");
      // Use replace instead of push to prevent back navigation issues
      window.location.href = "/dashboard";
    } else if (status === "unauthenticated") {
      console.log("User is not authenticated, redirecting to login");
      window.location.href = "/auth/login";
    }
    // We don't redirect when status is "loading" - wait for it to resolve
  }, [status, router, session]);

  // Loading state with clean UI while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <div className="w-12 h-12 border-4 border-t-[#F37A1F] border-r-[#F37A1F] border-b-[#F37A1F]/20 border-l-[#F37A1F]/20 rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Please wait</h1>
        <p className="text-sm text-gray-600">Checking your authentication status...</p>
      </div>
    </div>
  );
}
