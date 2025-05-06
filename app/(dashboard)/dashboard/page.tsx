"use client";

import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";

const WelcomeCard = ({ user }: { user: any;  }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
        Welcome back, {user?.name || "User"}!
      </h1>
      <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
        <p>Your Employee ID: {user?.id || "N/A"}</p>
        <p>Department: {user?.department || "N/A"}</p>
      </div>
    </div>
  );
};


export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth/login";
    },
  });
  
  if (status === "loading") {
    return (
      <Loader name="dashboard"/>
    );
  }

  return (
    <div className="max-w-full overflow-hidden">
      <WelcomeCard user={session?.user}  />
    </div>
  );
}
