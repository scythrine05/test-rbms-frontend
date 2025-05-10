"use client";

import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";
import Link from "next/link";

// Quick action card component with government style
const QuickAction = ({
  title,
  icon,
  link,
}: {
  title: string;
  icon: React.ReactNode;
  link: string;
}) => (
  <Link
    href={link}
    className="border border-black p-3 flex items-center hover:bg-gray-50"
  >
    <div className="mr-3 text-[#13529e]">{icon}</div>
    <div className="text-sm">{title}</div>
  </Link>
);

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
        <div className="mb-4">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <QuickAction
              title="Create Block Request"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
              link="/create-block-request"
            />
            <QuickAction
              title="View Requests"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              }
              link="/request-table"
            />
            <QuickAction
              title="Settings"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.342-.565.507-1.27.346-1.963"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              link="/settings"
            />
          </div>
        </div>

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
