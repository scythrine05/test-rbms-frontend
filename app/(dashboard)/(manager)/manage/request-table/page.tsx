"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { ShowAllToggle } from "@/app/components/ui/ShowAllToggle";

export default function RequestTablePage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Set initial week start to last Saturday
    const today = new Date();
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 }); // 6 is Saturday
  });
  const [selectedDate, setSelectedDate] = useState(() => addDays(new Date(), 1)); // Default to next day
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { isUrgentMode } = useUrgentMode();
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Calculate week range (Saturday to Friday)
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 6 });

  // Fetch requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", page, statusFilter, weekStart, weekEnd, isUrgentMode, selectedDate],
    queryFn: () => {
      if (isUrgentMode) {
        // For urgent mode, get requests for selected date
        // Use the same date for both start and end to get exactly that day's data
        return managerService.getUserRequestsByManager(
          1,
          limit,
          format(selectedDate, "yyyy-MM-dd"),
          format(selectedDate, "yyyy-MM-dd"),
          statusFilter !== "ALL" ? statusFilter : undefined
        );
      }
      return managerService.getUserRequestsByManager(
        page,
        limit,
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        statusFilter !== "ALL" ? statusFilter : undefined
      );
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      // Format as 24-hour time (HH:mm) using UTC
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time:", error, dateString);
      return "N/A";
    }
  };

  // Status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-black";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-black";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800 border border-black";
    }
  };

  // Handle week navigation
  const handleWeekChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentWeekStart((prev) => subDays(prev, 7));
    } else {
      setCurrentWeekStart((prev) => addDays(prev, 7));
    }
    setPage(1); // Reset to first page when changing weeks
  };

  // Handle day navigation for urgent mode
  const handleDayChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedDate((prev) => subDays(prev, 1));
    } else {
      setSelectedDate((prev) => addDays(prev, 1));
    }
    setPage(1); // Reset to first page when changing days
  };

  // Filter requests based on status and urgent mode
  const filteredRequests = showAll
    ? data?.data?.requests || []
    : data?.data?.requests?.filter((request: UserRequest) => {
      const statusMatch = statusFilter === "ALL" || request.status === statusFilter;
      const urgentMatch = isUrgentMode
        ? (request.corridorType === "Urgent Block" || request.workType === "EMERGENCY") &&
        format(parseISO(request.date), "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd")
        : (request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY");
      return statusMatch && urgentMatch;
    }) || [];

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

  const totalPages = data?.data.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
          {isUrgentMode && <div className="text-sm text-gray-600 mb-2">
            <p>Block requests and emergency work types for the next day.</p>
          </div>}
        </h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gov-input text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <ShowAllToggle
            showAll={showAll}
            onToggle={() => setShowAll(!showAll)}
            isUrgentMode={isUrgentMode}
          />
        </div>
      </div>

      {/* Urgent mode description and date range */}
      {isUrgentMode && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Showing Requests for Date : {format(selectedDate, "dd-MM-yyyy")}
          </div>
          <div className="flex justify-center gap-2 text-black">
            <button
              onClick={() => handleDayChange("prev")}
              className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
            >
              Previous Day
            </button>
            <span className="px-3 py-1 text-sm">
              {format(selectedDate, "dd MMM yyyy")}
            </span>
            <button
              onClick={() => handleDayChange("next")}
              className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
            >
              Next Day
            </button>
          </div>
        </div>
      )}

      {/* Week Navigation - Updated to show Saturday-Friday range */}
      {!isUrgentMode && (
        <div className="mt-4 flex justify-center gap-2 mb-4 text-black">
          <button
            onClick={() => handleWeekChange("prev")}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Previous Week
          </button>
          <span className="px-3 py-1 text-sm">
            {format(weekStart, "dd MMM")} - {format(weekEnd, "dd MMM yyyy")}
          </span>
          <button
            onClick={() => handleWeekChange("next")}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Next Week
          </button>
        </div>
      )}

      {/* Rest of the table and pagination remains the same */}
      <div className="overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-5 text-gray-600">
            {isUrgentMode
              ? `There are no requests for ${format(selectedDate, "dd MMM yyyy")}`
              : `There are no requests for the week of ${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM yyyy")}`
            }
          </div>
        ) : (
          <>
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
                    Time
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Corridor Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Work Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Activity
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Status
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request: UserRequest) => (
                  <tr key={request.id} className="hover:bg-gray-50">
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
                      {(() => {
                        if (
                          request.processedLineSections &&
                          Array.isArray(request.processedLineSections) &&
                          request.processedLineSections.length > 0
                        ) {
                          const regularSection = request.processedLineSections.find(
                            (section) => section.type === "regular"
                          );
                          if (regularSection && regularSection.lineName) {
                            return regularSection.lineName;
                          }

                          const yardSection = request.processedLineSections.find(
                            (section) => section.type === "yard"
                          );
                          if (yardSection) {
                            if (yardSection.stream && yardSection.road) {
                              return `${yardSection.stream}/${yardSection.road}`;
                            }
                            if (yardSection.stream) {
                              return yardSection.stream;
                            }
                          }

                          const firstSection = request.processedLineSections[0];
                          if (firstSection.lineName) return firstSection.lineName;
                          if (firstSection.stream) return firstSection.stream;
                        }

                        if (request.selectedStream) {
                          return request.selectedStream;
                        }

                        return "N/A";
                      })()}
                    </td>
                    <td className="border border-black p-1 text-sm">
                      {formatTime(request.demandTimeFrom)} -{" "}
                      {formatTime(request.demandTimeTo)}
                    </td>
                    <td className="border border-black p-1 text-sm">
                      {request.corridorTypeSelection ||
                        request.corridorType ||
                        "N/A"}
                    </td>
                    <td className="border border-black p-1 text-sm">
                      {request.workType}
                    </td>
                    <td className="border border-black p-1 text-sm">
                      {request.activity}
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs ${getStatusBadgeClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/manage/view-request/${request.id}`}
                          className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination - only show in normal mode */}
      {!isUrgentMode && totalPages > 1 && (
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