"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import {
  addDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

export default function OptimiseTablePage() {
  const queryClient = useQueryClient();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
 const [currentWeekStart, setCurrentWeekStart] = useState(() => {
  const today = new Date();
  const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
  return startOfWeek(lastSaturday, { weekStartsOn: 6 });
});
  const [rejectionData, setRejectionData] = useState({
    showModal: false,
    requestId: null as string | null,
    reason: "",
  });

  const limit = 30;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 6 });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "user-requests",
      page,
      format(weekStart, "yyyy-MM-dd"),
      format(weekEnd, "yyyy-MM-dd"),
    ],
    queryFn: () =>
      adminService.getUserRequests(
        page,
        limit,
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd")
      ),
  });

  // Add debugging logs
  console.log('API Response:', data?.data.requests);
  console.log('Is Urgent Mode:', isUrgentMode);
  console.log('Filtered Requests:', data?.data.requests?.filter((request: any) => 
    request.optimizeStatus === true && 
    (isUrgentMode ? request.corridorType === "Urgent Block" : request.corridorType !== "Urgent Block")
  ));

  const updateRequestStatus = useMutation({
    mutationFn: ({
      requestId,
      status,
      reason,
    }: {
      requestId: string;
      status: "yes" | "no";
      reason?: string;
    }) => adminService.updateRequestStatus(requestId, status, reason as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-requests", page] });
      setRejectionData({ showModal: false, requestId: null, reason: "" });
    },
  });

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

  const handleAccept = (requestId: string) => {
    updateRequestStatus.mutate({ requestId, status: "yes" });
  };

  const handleRejectClick = (requestId: string) => {
    setRejectionData({
      showModal: true,
      requestId,
      reason: "",
    });
  };

  const handleRejectConfirm = () => {
    if (rejectionData.requestId) {
      updateRequestStatus.mutate({
        requestId: rejectionData.requestId,
        status: "no",
        reason: rejectionData.reason,
      });
    }
  };

  const handleRejectCancel = () => {
    setRejectionData({ showModal: false, requestId: null, reason: "" });
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

  const totalPages = data?.data.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black">
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Optimized Requests</h1>
      </div>
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-center items-center mt-4">
        <div className="flex gap-2 items-center">
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
              <th className="border border-black p-1 text-left text-sm font-medium text-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.requests?.filter((request: any) => 
              request.optimizeStatus === true && 
              (isUrgentMode ? request.corridorType === "Urgent Block" : request.corridorType !== "Urgent Block")
            ).length > 0 ? (
              data?.data.requests
                ?.filter((request: any) => 
                  request.optimizeStatus === true && 
                  (isUrgentMode ? request.corridorType === "Urgent Block" : request.corridorType !== "Urgent Block")
                )
                .map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="border border-black p-1 text-sm">{formatDate(request.createdAt)}</td>
                    <td className="border border-black p-1 text-sm">{request.selectedSection || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">{request.selectedDepo || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">{request.missionBlock || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">{request.processedLineSections?.[0]?.lineName || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">
                      {request.optimizeTimeFrom && request.optimizeTimeTo
                        ? `${formatTime(request.optimizeTimeFrom)} - ${formatTime(request.optimizeTimeTo)}`
                        : "N/A"}
                    </td>
                    <td className="border border-black p-1 text-sm">{request.workType || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">{request.activity || "N/A"}</td>
                    <td className="border border-black p-1 text-sm">
                      <div className="flex gap-1">
                        {request.userStatus !== "no" && (
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={
                              request.userStatus === "yes" ||
                              (updateRequestStatus.variables?.requestId === request.id &&
                                updateRequestStatus.variables?.status === "yes")
                            }
                            className={`px-2 py-1 text-white text-xs rounded ${
                              request.userStatus === "yes"
                                ? "bg-gray-400 cursor-default"
                                : "bg-green-500 hover:bg-green-600"
                            } disabled:opacity-50`}
                          >
                            {request.userStatus === "yes"
                              ? "Accepted"
                              : updateRequestStatus.variables?.requestId === request.id &&
                                updateRequestStatus.variables?.status === "yes"
                              ? "Processing..."
                              : "Accept"}
                          </button>
                        )}
                        {request.userStatus !== "yes" && (
                          <button
                            onClick={() => handleRejectClick(request.id)}
                            disabled={
                              request.userStatus === "no" ||
                              (updateRequestStatus.variables?.requestId === request.id &&
                                updateRequestStatus.variables?.status === "no")
                            }
                            className={`px-2 py-1 text-white text-xs rounded ${
                              request.userStatus === "no"
                                ? "bg-gray-400 cursor-default"
                                : "bg-red-500 hover:bg-red-600"
                            } disabled:opacity-50`}
                          >
                            {request.userStatus === "no"
                              ? "Rejected"
                              : updateRequestStatus.variables?.requestId === request.id &&
                                updateRequestStatus.variables?.status === "no"
                              ? "Processing..."
                              : "Reject"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={9} className="border border-black p-1 text-sm text-center">
                  No optimized requests found for this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {rejectionData.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">Reason for Rejection</h3>
            <textarea
              className="w-full border border-gray-300 p-2 mb-4"
              rows={4}
              placeholder="Enter the reason for rejection..."
              value={rejectionData.reason}
              onChange={(e) =>
                setRejectionData({ ...rejectionData, reason: e.target.value })
              }
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleRejectCancel}
                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionData.reason.trim()}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
