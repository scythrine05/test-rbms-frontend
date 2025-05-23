"use client";

import { Loader } from "@/app/components/ui/Loader";
import ManagerQuickLinks from "@/app/(dashboard)/(manager)/manage/quick-links/component";
import AdminQuickLinks from "@/app/(dashboard)/(admin)/admin/quick-links/component";
import UserQuickLinks from "@/app/(dashboard)/(user)/quick-links/component";
import { useSession } from "next-auth/react";


export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth/login";
    },
  });
  if (status === "loading") {
    return <Loader name="dashboard" />;
  }

  // Current date formatting for government style
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-full overflow-hidden text-black">
      <div className="bg-white p-3 border border-black mb-3">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-[#13529e]">Dashboard</h1>
          <div className="text-sm text-gray-600">{formattedDate}</div>
        </div>

        {/* User information */}
        <div className="mb-4">
          <p className="font-medium">
            Welcome, {session?.user?.name || "User"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-sm">
            <div className="border border-gray-300 bg-gray-50 p-2">
              <span className="text-gray-600 text-xs">Employee ID:</span>
              <p className="font-medium">{session?.user?.id || "N/A"}</p>
            </div>
            {session?.user?.role === "USER" ? (
              <div className="border border-gray-300 bg-gray-50 p-2">
                <span className="text-gray-600 text-xs">Department :</span>
                <p className="font-medium">
                  {session?.user?.department || "N/A"}
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 bg-gray-50 p-2">
                <span className="text-gray-600 text-xs">Role :</span>
                <p className="font-medium">{session?.user?.role || "N/A"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {
          session?.user?.role === "ADMIN" ? <AdminQuickLinks /> : session?.user?.role === "SENIOR_OFFICER" ? <ManagerQuickLinks /> : session?.user?.role === "USER" ? <UserQuickLinks /> : null
        }

        {/* System message */}
        <div className="border border-gray-300 bg-gray-50 p-3 text-sm">
          <p className="font-medium mb-1">System Message</p>
          <p className="text-xs text-gray-600">
            Welcome to the Southern Railways Block Request Portal. This system
            allows you to create, manage and track block requests. For
            assistance, please contact the IT department.
          </p>
        </div>
      </div>
    </div>
  );
}
