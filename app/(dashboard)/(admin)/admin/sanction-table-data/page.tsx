"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { UserRequest } from "@/app/service/api/manager";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

export default function OptimiseTablePage() {
  const queryClient = useQueryClient();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    if (isUrgentMode) {
      return today;
    }
    // Start from Monday of current week
    return startOfWeek(today, { weekStartsOn: 1 });
  });

  // For urgent mode, use the same day for start and end
  // For non-urgent mode, use Monday to Sunday
  const weekStart = isUrgentMode 
    ? currentWeekStart 
    : startOfWeek(currentWeekStart, { weekStartsOn: 1 }); // Explicitly start from Monday
  const weekEnd = isUrgentMode 
    ? currentWeekStart 
    : addDays(weekStart, 6); // Explicitly end on Sunday (6 days after Monday）

  // Add debug logging for date range
  console.log('Date Range:', format(weekStart, "yyyy-MM-dd"), 'to', format(weekEnd, "yyyy-MM-dd"));
  console.log('Is Urgent Mode:', isUrgentMode);

  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", page, currentWeekStart],
    queryFn: () =>
      adminService.getOptimizeRequests(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        page
      ),
  });

  // Filter data to only show sanctioned requests
  const sanctionedRequests = data?.data?.requests?.filter(
    (request: UserRequest) => {
      const isSanctioned = request.isSanctioned;
      if (isUrgentMode) {
        return isSanctioned; // Show all sanctioned requests in urgent mode
      } else {
        return isSanctioned && request.corridorType !== "Urgent Block"; // Exclude urgent requests in normal mode
      }
    }
  ) || [];

  // Format date and time helpers
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return dateString;
    }
  };

  // Function to navigate to previous or next period (day for urgent, week for non-urgent)
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prevDate) => {
      if (isUrgentMode) {
        // In urgent mode, navigate by day
        return direction === "prev" ? subDays(prevDate, 1) : addDays(prevDate, 1);
      } else {
        // In non-urgent mode, navigate by week
        // Ensure we're starting from Monday
        const monday = startOfWeek(prevDate, { weekStartsOn: 1 });
        return direction === "prev" ? subDays(monday, 7) : addDays(monday, 7);
      }
    });
    setPage(1); // Reset to first page when changing periods
  };

  if (isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">Loading approved requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5 text-red-600">
          Error loading approved requests. Please try again.
        </div>
      </div>
    );
  }

  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black">
      {/* Header and week navigation */}
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Sanctioned Requests</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleWeekChange("prev")}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Previous Week
          </button>
          <span className="px-3 py-1 text-sm text-black">
            {format(weekStart, "dd MMM")} - {format(weekEnd, "dd MMM yyyy")}
          </span>
          <button
            onClick={() => handleWeekChange("next")}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Next Week
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Date</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Major Section</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Depot</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Block Section</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Line</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Optimized Time</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Work Type</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Activity</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Corridor Type</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">User Response</th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Reason For Not availed</th>

            </tr>
          </thead>
          <tbody>
            {sanctionedRequests.length > 0 ? (
              sanctionedRequests.map((request: UserRequest) => (
                <tr 
                  key={`request-${request.id}-${request.date}`} 
                  className="hover:bg-gray-50"
                >
                  <td className="border border-black p-1 text-sm">
                    {formatDate(request.date)}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.selectedSection}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.selectedDepo}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.missionBlock}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.processedLineSections?.[0]?.lineName || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.sanctionedTimeFrom ? formatTime(request.sanctionedTimeFrom) : "N/A"} -{" "}
                    {request.sanctionedTimeTo ? formatTime(request.sanctionedTimeTo) : "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.workType}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.activity}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.corridorType || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.userResponse}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.availedResponse}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="border border-black p-1 text-sm text-center py-4">
                  No sanctioned requests found for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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