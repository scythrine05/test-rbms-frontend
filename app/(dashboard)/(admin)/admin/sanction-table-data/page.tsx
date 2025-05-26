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
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";

export default function OptimiseTablePage() {
  const queryClient = useQueryClient();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    // Calculate last Saturday as the start of the week, like in optimised-table-data
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });

  // For urgent mode, use the same day for start and end
  // For non-urgent mode, use Saturday to Friday (matching optimised-table-data)
  const weekStart = isUrgentMode 
    ? currentWeekStart 
    : startOfWeek(currentWeekStart, { weekStartsOn: 6 }); // Explicitly start from Saturday
  const weekEnd = isUrgentMode 
    ? currentWeekStart 
    : endOfWeek(weekStart, { weekStartsOn: 6 }); // Explicitly end on Friday

  // In urgent mode, we use the same date for both start and end dates
  // This ensures we only get data for a single day in urgent mode
  const apiStartDate = format(weekStart, "yyyy-MM-dd");
  const apiEndDate = isUrgentMode ? apiStartDate : format(weekEnd, "yyyy-MM-dd");

  // Add debug logging for date range
  console.log('Date Range:', apiStartDate, 'to', apiEndDate);
  console.log('Is Urgent Mode:', isUrgentMode);
  console.log('Current Date/Time:', new Date().toISOString());

  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", page, apiStartDate, apiEndDate, isUrgentMode],
    queryFn: () =>
      adminService.getOptimizeRequests(
        apiStartDate,
        apiEndDate,
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
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[#13529e]">Sanctioned Requests</h1>
          <span className={`px-3 py-1 text-sm rounded-full ${isUrgentMode ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} border border-black`}>
            {isUrgentMode ? 'Urgent Mode' : 'Normal Mode'}
          </span>
        </div>
        <WeeklySwitcher
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          isUrgentMode={isUrgentMode}
          weekStartsOn={6}
        />
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