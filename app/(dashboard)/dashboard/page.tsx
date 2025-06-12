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

  // Custom user dashboard UI
  if (session?.user?.role === "USER") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center bg-[#fffbe9]">
        {/* Header */}
        <div className="w-full border border-black bg-yellow-200 flex items-center justify-center relative p-2" style={{ minHeight: 60 }}>
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} className="w-9 h-9"><rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" /><path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" /></svg>
          </span>
          <span className="text-2xl font-bold text-black">Home</span>
        </div>
        {/* RBMS badge */}
        <div className="w-full flex justify-center mt-4">
          <div className="bg-green-200 rounded-2xl px-8 py-2">
            <span className="text-4xl font-extrabold text-[#b07be0] tracking-wide">RBMS</span>
          </div>
        </div>
        {/* Designation bar */}
        <div className="w-full flex justify-center mt-4">
          <div className="bg-[#ffeaea] rounded-full px-6 py-2 border border-black flex flex-col items-center" style={{ maxWidth: '90vw' }}>
            <span className="text-xs font-semibold text-gray-700 tracking-wide">USER DESIGNATION:</span>
            <span className="text-2xl font-bold text-black mt-1">{session?.user?.name || ''}</span>
          </div>
        </div>
        {/* Navigation buttons */}
        <div className="w-full flex flex-col items-center gap-5 mt-6 px-2 max-w-md">
          <a href="/create-block-request" className="w-full rounded-2xl bg-[#eeb8f7] border border-black py-6 text-xl font-extrabold text-black text-center shadow hover:scale-105 transition">ENTER NEW BLOCK REQUEST</a>
          <a href="/edit-request" className="w-full rounded-2xl bg-[#aee6f7] border border-black py-6 text-xl font-extrabold text-black text-center shadow hover:scale-105 transition">EDIT/CANCEL PREVIOUS BLOCK REQUESTS</a>
          <a href="/request-table" className="w-full rounded-2xl bg-[#c7c7f7] border border-black py-6 text-xl font-extrabold text-black text-center shadow hover:scale-105 transition">SUMMARY OF MY BLOCK REQUESTS</a>
          <a href="https://external-block-site.example.com" target="_blank" rel="noopener noreferrer" className="w-full rounded-2xl bg-[#a6f7a6] border border-black py-6 text-xl font-extrabold text-black text-center shadow hover:scale-105 transition">AVAIL BLOCK AT SITE</a>
          <a href="/generate-reports" className="w-full rounded-2xl bg-[#ffd180] border border-black py-6 text-xl font-extrabold text-black text-center shadow hover:scale-105 transition">GENERATE REPORTS</a>
        </div>
        {/* Logout button */}
        <div className="w-full flex justify-center mt-10 mb-4">
          <form action="/auth/login" method="get" onSubmit={async (e) => { e.preventDefault(); await import('next-auth/react').then(mod => mod.signOut({ redirect: true, callbackUrl: '/auth/login' })); }}>
            <button type="submit" className="flex items-center gap-2 bg-[#dbe6fd] border border-black rounded px-6 py-2 text-lg font-bold text-black shadow hover:bg-[#c7d7f7] transition">
              <span className="inline-block w-7 h-7 bg-white rounded-full border border-black flex items-center justify-center">
                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' strokeWidth={2} className='w-5 h-5'><path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' /></svg>
              </span>
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }

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
