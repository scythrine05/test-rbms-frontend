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

export default function OptimiseTablePage() {
  const router = useRouter();
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
    queryKey: ["approved-requests", page, currentWeekStart],
    queryFn: () =>
      adminService.getOptimizeRequests(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        page
      ),
  });

  const [optimizedData, setOptimizedData] = useState<UserRequest[] | null>(
    null
  );
  //   const optimizeMutation = useOptimizeRequests();


const handleSendOptimizedRequests = async () => {
  try {
    // Get all request IDs from the current data
    const requestIds = data?.data?.requests?.map((request: UserRequest) => request.id) || [];
    
    if (requestIds.length === 0) {
      alert("No requests to optimize");
      return;
    }

    const response = await adminService.saveOptimizedRequestsStatus(requestIds);
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
      <div className="border-b-2 border-[#13529e] pb-3  flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Approved Requests</h1>
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

      <div className="flex justify-end py-2 gap-2">
        <button
          onClick={handleSendOptimizedRequests}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer"
        >
          Send
        </button>
      </div>

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
            {(optimizedData || data?.data?.requests)?.map(
              (request: UserRequest) => (
                <tr
                  key={`request-${request.id}-${request.date}`}
                  className={`hover:bg-gray-50 ${
                    optimizedData ? "bg-green-50" : ""
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
                    {optimizedData ? (
                      <>
                        {request.optimisedTimeFrom || "N/A"} -{" "}
                        {request.optimisedTimeTo || "N/A"}
                      </>
                    ) : (
                      "N/A"
                    )}
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
              )
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
