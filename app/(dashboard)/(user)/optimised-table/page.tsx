"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminService } from "@/app/service/api/admin";
import { format, parseISO } from "date-fns";

export default function OptimiseTablePage() {
  const [page, setPage] = useState(1);
  const limit = 30; // Default limit as in your backend

  // Fetch user requests using the same pattern as your other API calls
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-requests", page],
    queryFn: () => adminService.getUserRequests(page, limit),
  });

  // Format date to match your previous implementation
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Format time to match your previous implementation
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">Loading requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5 text-red-600">
          Error loading requests. Please try again.
        </div>
      </div>
    );
  }

  // Filter requests to only show those with optimizedStatus true
  const optimizedRequests = data?.data.requests?.filter(
    (request: any) => request.optimizeStatus === true
  );

  const totalPages = data?.data.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black">
      {/* Header - kept consistent with your previous UI */}
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Optimized Requests</h1>
      </div>

      {/* Table - maintaining your existing styling */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Date
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Major Section
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Depot
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Block Section
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Line
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
               Optimized Time
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Work Type
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {optimizedRequests?.length > 0 ? (
              optimizedRequests.map((request: any) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-sm">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.selectedSection || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.selectedDepo || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.missionBlock || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.processedLineSections?.[0]?.lineName || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.optimizeTimeFrom && request.optimizeTimeTo
                      ? `${formatTime(request.optimizeTimeFrom)} - ${formatTime(request.optimizeTimeTo)}`
                      : "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.workType || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.activity || "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-black p-1 text-sm text-center">
                  No optimized requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - matching your existing style */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}