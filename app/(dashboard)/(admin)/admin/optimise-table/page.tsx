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

export default function OptimiseTablePage() {
  const router = useRouter();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Set initial week start to last Saturday
    const today = new Date();
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 }); // 6 is Saturday
  });

  // Calculate week range
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 6 });

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
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    return isUrgentMode 
      ? request.corridorType === "Urgent Block" || request.workType === "EMERGENCY"
      : request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
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
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return dateString;
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
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer"
        >
          Optimise
        </button>
        <button
          onClick={handleSendOptimizedRequests}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer"
        >
          Send
        </button>
        {optimizedData && (
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1 text-sm bg-green-600 text-white border border-black cursor-pointer"
          >
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
                <span className={`px-3 py-1 text-sm rounded-full ${isUrgentMode ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} border border-black`}>
                  {isUrgentMode ? 'Urgent Mode' : 'Normal Mode'}
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
                Optimized Time
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Work Type
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Activity
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: UserRequest) => (
              <tr
                key={`request-${request.id}-${request.date}`}
                className={`hover:bg-gray-50 ${
                  request.optimizeTimeFrom&&request.optimizeTimeTo ? "bg-green-50" : ""
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
