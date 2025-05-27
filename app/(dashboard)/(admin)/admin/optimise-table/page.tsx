"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRequest } from "@/app/service/api/manager";
import { useOptimizeRequests } from "@/app/service/query/optimise";
import { flattenRecords } from "@/app/lib/optimse";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

// Header icons for tables
const HeaderIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "id":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.5 9.5A2.5 2.5 0 018 12V8.5H5.5v1zm0 0V8.5H8V12a2.5 2.5 0 01-2.5-2.5zM12 12v-1.5h-1.5V12H12zm-1.5-3V12H12V9h-1.5zm3.5.5v1h1.5V8h-5v1.5h2V12h1.5V9.5h1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "date":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "section":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "time":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "work":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
    case "action":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      );
    case "line":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return null;
  }
};

// Column header component
const ColumnHeader = ({
  icon,
  title,
  showFilter = false,
}: {
  icon: string;
  title: string;
  showFilter?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <HeaderIcon type={icon} />
        <span>{title}</span>
      </div>
    </div>
  );
};

export default function OptimiseTablePage() {
  const router = useRouter();
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
  const weekEnd = isUrgentMode ? currentWeekStart : addDays(weekStart, 6); // Explicitly end on Sunday (6 days after Monday)

  // Add debug logging for date range
  console.log(
    "Date Range:",
    format(weekStart, "yyyy-MM-dd"),
    "to",
    format(weekEnd, "yyyy-MM-dd")
  );
  console.log("Is Urgent Mode:", isUrgentMode);

  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", page, currentWeekStart, isUrgentMode],
    queryFn: () =>
      adminService.getApprovedRequests(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        page
      ),
  });

  // Filter requests based on urgent mode
  const filteredRequests =
    data?.data?.requests?.filter((request: UserRequest) => {
      return isUrgentMode
        ? request.corridorType === "Urgent Block" ||
            request.workType === "EMERGENCY"
        : request.corridorType !== "Urgent Block" &&
            request.workType !== "EMERGENCY";
    }) || [];

  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false);
  const [optimizedData, setOptimizedData] = useState<UserRequest[] | null>(
    null
  );
  const optimizeMutation = useOptimizeRequests();

  const handleSendOptimizedRequests = async () => {
    try {
      const requestIds =
        data?.data?.requests?.map((request: UserRequest) => request.id) || [];
      if (requestIds.length === 0) {
        alert("No requests to optimize");
        return;
      }
      const response = await adminService.saveOptimizedRequestsStatus(
        requestIds
      );
      if (response.success) {
        alert("Optimization status updated successfully!");
      } else {
        alert("Failed to update optimization status");
      }
    } catch (err) {
      console.error("Failed to update optimization status", err);
      alert("Error updating optimization status. Please try again.");
    }
  };
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
      // Parse the ISO string and get the hours and minutes
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      // Format as 24-hour time (HH:mm)
      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time:", error, dateString);
      return "N/A";
    }
  };

  // Function to navigate to previous or next period (day for urgent, week for non-urgent)
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prevDate) => {
      if (isUrgentMode) {
        // In urgent mode, navigate by day
        return direction === "prev"
          ? subDays(prevDate, 1)
          : addDays(prevDate, 1);
      } else {
        // In non-urgent mode, navigate by week
        // Ensure we're starting from Monday
        const monday = startOfWeek(prevDate, { weekStartsOn: 1 });
        return direction === "prev" ? subDays(monday, 7) : addDays(monday, 7);
      }
    });
    setPage(1); // Reset to first page when changing periods
  };

  // Preprocess function (placeholder for now)
  const preprocessRequests = async (
    requests: UserRequest[]
  ): Promise<UserRequest[]> => {
    // TODO: Add preprocessing logic here
    return requests;
  };

  const handleOptimize = async () => {
    if (!data?.data?.requests) return;

    try {
      // Preprocess the requests
      const preprocessedRequests = await flattenRecords(data.data.requests);

      // Call optimization API
      const result = await optimizeMutation.mutateAsync(preprocessedRequests);

      if (result.optimizedData) {
        await adminService.saveOptimizedRequests(result.optimizedData);
        setOptimizedData(result.optimizedData);
        setIsOptimizeDialogOpen(false);
      } else {
        alert("Failed to optimize requests");
      }
    } catch (error) {
      console.error("Optimization error:", error);
      alert("Failed to optimize requests. Please try again.");
    }
  };

  const handleDownloadCSV = () => {
    if (!optimizedData) return;

    // Create CSV headers
    const headers = [
      "Date",
      "Major Section",
      "Depot",
      "Block Section",
      "Line",
      "Demand Time",
      "Optimized Time",
      "Work Type",
      "Activity",
    ].join(",");

    // Create CSV rows
    const rows = optimizedData.map((request) =>
      [
        formatDate(request.date),
        request.selectedSection,
        request.selectedDepo,
        request.missionBlock,
        request.processedLineSections?.[0]?.lineName || "N/A",
        `${formatTime(request.demandTimeFrom)} - ${formatTime(
          request.demandTimeTo
        )}`,
        `${request.optimisedTimeFrom || "N/A"} - ${
          request.optimisedTimeTo || "N/A"
        }`,
        request.workType,
        request.activity,
      ].join(",")
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `optimized_requests_${format(weekStart, "dd-MMM")}_${format(
        weekEnd,
        "dd-MMM"
      )}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="bg-white p-3 border border-black ">
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Approved Requests</h1>
        <WeeklySwitcher
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          weekStartsOn={6} // Saturday
        />
      </div>

      <div className="flex justify-end py-2 gap-2">
        <button
          onClick={() => setIsOptimizeDialogOpen(true)}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer hover:bg-gray-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          Optimise
        </button>
        <button
          onClick={handleSendOptimizedRequests}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer hover:bg-gray-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Send
        </button>
        {optimizedData && (
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1 text-sm bg-green-600 text-white border border-green-800 cursor-pointer hover:bg-green-700 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download CSV
          </button>
        )}
      </div>
      {/* Optimization Dialog */}
      {isOptimizeDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-black">
          <div className="bg-white p-6 w-full max-w-md border border-black">
            <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-[#13529e]">
                  Optimize Requests
                </h2>
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    isUrgentMode
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  } border border-black`}
                >
                  {isUrgentMode ? "Urgent Mode" : "Normal Mode"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsOptimizeDialogOpen(false)}
                  className="px-4 py-1 text-sm bg-white text-[#13529e] border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending}
                  className="px-4 py-1 text-sm bg-[#13529e] text-white border border-black disabled:opacity-50"
                >
                  {optimizeMutation.isPending ? "Optimizing..." : "Optimize"}
                </button>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <p>Are you sure you want to optimize the requests for:</p>
              <p className="font-medium">
                Week: {format(weekStart, "dd MMM")} -{" "}
                {format(weekEnd, "dd MMM yyyy")}
              </p>
              <p className="font-medium">
                Total Requests: {data?.data?.requests?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="date" title="Date" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="section" title="Major Section" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="section" title="Depot" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="section" title="Block Section" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="line" title="Line" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="time" title="Time" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="time" title="Optimized Time" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="work" title="Work Type" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="work" title="Activity" />
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                <ColumnHeader icon="action" title="Actions" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: UserRequest) => (
              <tr
                key={`request-${request.id}-${request.date}`}
                className={`hover:bg-gray-50 ${
                  request.optimizeTimeFrom && request.optimizeTimeTo
                    ? "bg-green-50"
                    : ""
                }`}
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
                  {optimizedData
                    ? request.selectedLine
                    : request.processedLineSections?.[0]?.lineName || "N/A"}
                </td>
                <td className="border border-black p-1 text-sm">
                  {formatTime(request.demandTimeFrom)} -{" "}
                  {formatTime(request.demandTimeTo)}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.optimizeTimeFrom
                    ? formatTime(request.optimizeTimeFrom)
                    : "N/A"}{" "}
                  -{" "}
                  {request.optimizeTimeTo
                    ? formatTime(request.optimizeTimeTo)
                    : "N/A"}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.workType}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.activity}
                </td>
                <td className="border border-black p-1 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/view-request/${request.id}`}
                      className="px-2 py-1 text-xs bg-[#13529e] hover:bg-[#0e4080] text-white border border-[#0e4080] rounded flex items-center"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
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
