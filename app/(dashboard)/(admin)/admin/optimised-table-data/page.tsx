"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

export default function OptimiseTablePage() {
  const router = useRouter();
  const { isUrgentMode } = useUrgentMode();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  // Calculate week range
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 6 });

  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", page, currentWeekStart, isUrgentMode],
    queryFn: () =>
      adminService.getOptimizeRequests(
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        page
      ),
  });

  // Filter requests based on urgent mode and optimization status
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const urgentMatch = isUrgentMode 
      ? request.corridorType === "Urgent Block" || request.workType === "EMERGENCY"
      : request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
    
    return urgentMatch && request.optimizeStatus === true;
  }) || [];

  const [optimizedData, setOptimizedData] = useState<UserRequest[] | null>(
    null
  );
  interface SanctionRequest {
    id: string;
    optimizeTimeFrom: string;
    optimizeTimeTo: string;
  }
  // Add this with your other mutations
  const updateSanctionStatus = useMutation({
    mutationFn: (requests: SanctionRequest[]) =>
      adminService.updateSanctionStatus(requests),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["approved-requests", page, currentWeekStart],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error("Error updating sanction status:", error);
      alert("Failed to update sanction status. Please try again.");
    },
  });

  const handleSendClick = () => {
    const requestsToSanction = data?.data?.requests
      ?.filter(
        (request: UserRequest) =>
          request.optimizeStatus === true &&
          !request.isSanctioned &&
          request?.optimizeData?.optimizeTimeFrom &&
          request?.optimizeData?.optimizeTimeTo
      )
      ?.map(
        (request: UserRequest): SanctionRequest => ({
          id: request.id,
          optimizeTimeFrom: request.optimizeData.optimizeTimeFrom,
          optimizeTimeTo: request.optimizeData.optimizeTimeTo,
        })
      );

    if (!requestsToSanction || requestsToSanction.length === 0) {
      alert("No valid requests available to send for sanction");
      return;
    }

    if (confirm(`Send ${requestsToSanction.length} request(s) for sanction?`)) {
      updateSanctionStatus.mutate(requestsToSanction);
    }
  };

  // Mutation for updating optimized times
  const updateOptimizedTimes = useMutation({
    mutationFn: (data: {
      requestId: string;
      optimizeTimeFrom: string;
      optimizeTimeTo: string;
    }) => adminService.updateOptimizeTimes(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["approved-requests", page, currentWeekStart],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setEditingId(null);
    },
    onError: (error) => {
      console.error("Error updating times:", error);
      alert("Failed to update times. Please try again.");
    },
  });

  // Format date and time helpers
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return dateString;
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "prev" ? subDays(prev, 7) : addDays(prev, 7)
    );
    setPage(1);
  };

  // Edit functionality
  const handleEditClick = (request: UserRequest) => {
    setEditingId(request.id);
    setTimeFrom(
      request.optimizeData?.optimizeTimeFrom
        ? format(parseISO(request.optimizeData.optimizeTimeFrom), "HH:mm")
        : ""
    );
    setTimeTo(
      request.optimizeData?.optimizeTimeTo
        ? format(parseISO(request.optimizeData.optimizeTimeTo), "HH:mm")
        : ""
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTimeFrom("");
    setTimeTo("");
  };

  // Add this with your other mutations
 const deleteRequestMutation = useMutation({
  mutationFn: (requestId: string) => adminService.deleteRequest(requestId),
  onMutate: (requestId) => {
    setDeletingIds(prev => new Set(prev).add(requestId));
  },
  onSuccess: (_, requestId) => {
    queryClient.invalidateQueries({
      queryKey: ["approved-requests", page, currentWeekStart],
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setDeletingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  },
  onError: (error, requestId) => {
    console.error("Error deleting request:", error);
    alert("Failed to delete request. Please try again.");
    setDeletingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  },
});

const handleDelete = (requestId: string) => {
  if (confirm("Are you sure you want to delete this request?")) {
    deleteRequestMutation.mutate(requestId);
  }
};

  const handleUpdateClick = (requestId: string) => {
    if (!timeFrom || !timeTo) {
      alert("Please enter both start and end times");
      return;
    }

    const request = data?.data?.requests?.find(
      (r: UserRequest) => r.id === requestId
    );
    if (!request) return;

    try {
      const datePart = request.date.split("T")[0];
      const optimizeTimeFrom = new Date(
        `${datePart}T${timeFrom}:00`
      ).toISOString();
      const optimizeTimeTo = new Date(`${datePart}T${timeTo}:00`).toISOString();

      if (isNaN(new Date(optimizeTimeFrom).getTime())) {
        throw new Error("Invalid start time");
      }
      if (isNaN(new Date(optimizeTimeTo).getTime())) {
        throw new Error("Invalid end time");
      }

      updateOptimizedTimes.mutate({
        requestId,
        optimizeTimeFrom,
        optimizeTimeTo,
      });
    } catch (error) {
      console.error("Error formatting dates:", error);
      alert("Invalid time format. Please use HH:MM format (e.g., 14:30)");
    }
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
      {showSuccess && (
        <div className="fixed top-20 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Times updated successfully!
        </div>
      )}

      {/* Header and week navigation */}
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[#13529e]">
            Optimized Requests
          </h1>
          <span className={`px-3 py-1 text-sm rounded-full ${isUrgentMode ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} border border-black`}>
            {isUrgentMode ? 'Urgent Mode' : 'Normal Mode'}
          </span>
        </div>
        <WeeklySwitcher
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          weekStartsOn={6} // Saturday
        />
      </div>
      <div className="flex justify-end py-2">
        <button
          onClick={handleSendClick}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer"
          disabled={updateSanctionStatus.isPending}
        >
          {updateSanctionStatus.isPending ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="overflow-x-auto mt-1">
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
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                User Response
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Reason For Rejection
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
                  {editingId === request.id ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="time"
                        value={timeFrom}
                        onChange={(e) => setTimeFrom(e.target.value)}
                        className="w-20 border p-1 text-sm"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={timeTo}
                        onChange={(e) => setTimeTo(e.target.value)}
                        className="w-20 border p-1 text-sm"
                      />
                    </div>
                  ) : request.isSanctioned ? (
                    <>
                      {request?.optimizeTimeFrom
                        ? formatTime(request?.optimizeTimeFrom)
                        : "N/A"}{" "}
                      -{" "}
                      {request?.optimizeTimeTo
                        ? formatTime(request?.optimizeTimeTo)
                        : "N/A"}
                    </>
                  ) : (
                    <>
                      {request.optimizeData?.optimizeTimeFrom
                        ? formatTime(request.optimizeData.optimizeTimeFrom)
                        : "N/A"}{" "}
                      -{" "}
                      {request.optimizeData?.optimizeTimeTo
                        ? formatTime(request.optimizeData.optimizeTimeTo)
                        : "N/A"}
                    </>
                  )}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.workType}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.activity}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.userStatus === "yes" ? (
                    <span className="text-green-600">Accepted</span>
                  ) : request.userStatus === "no" ? (
                    <span className="text-red-600">Rejected</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.reasonFroReject}
                </td>
                <td className="border border-black p-1 text-sm">
                  <div className="flex gap-2">
                    {editingId === request.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateClick(request.id)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white border border-black"
                          disabled={updateOptimizedTimes.isPending}
                        >
                          {updateOptimizedTimes.isPending
                            ? "Processing..."
                            : "Update"}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs bg-gray-500 text-white border border-black"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {!request.isSanctioned && (
                          <button
                            onClick={() => handleEditClick(request)}
                            className="px-2 py-1 text-xs bg-yellow-500 text-white border border-black"
                          >
                            Edit
                          </button>
                        )}
                        <Link
                          href={`/admin/view-request/${request.id}`}
                          className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(request.id)}
                          className="px-2 py-1 text-xs bg-red-500 text-white border border-black"
                          disabled={deletingIds.has(request.id)}
                        >
                          {deletingIds.has(request.id)
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </>
                    )}
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
