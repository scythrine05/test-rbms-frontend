"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import { addDays, endOfWeek, format, parseISO, startOfWeek, subDays } from "date-fns";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
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
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });
  const [notAvailedData, setNotAvailedData] = useState({
    showModal: false,
    requestId: null as string | null,
    reason: "",
  });

  const limit = 30;
  const weekEnd = isUrgentMode 
    ? currentWeekStart 
    : endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = isUrgentMode 
    ? currentWeekStart 
    : startOfWeek(currentWeekStart, { weekStartsOn: 6 });

  // Fetch user requests
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

  // Mutation for updating user response
  const updateUserResponse = useMutation({
    mutationFn: ({
      requestId,
      userResponse,
      reason,
    }: {
      requestId: string;
      userResponse: "availed" | "not availed";
      reason?: string;
    }) => adminService.updateUserResponse(requestId, userResponse, reason as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-requests", page] });
      setNotAvailedData({ showModal: false, requestId: null, reason: "" });
    },
  });

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "prev" 
        ? subDays(prev, isUrgentMode ? 1 : 7) 
        : addDays(prev, isUrgentMode ? 1 : 7)
    );
    setPage(1);
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

  // Handle availed action
  const handleAvailed = (requestId: string) => {
    updateUserResponse.mutate({ requestId, userResponse: "availed" });
  };

  // Handle not availed click (opens modal)
  const handleNotAvailedClick = (requestId: string) => {
    setNotAvailedData({
      showModal: true,
      requestId,
      reason: "",
    });
  };

  // Handle not availed confirmation
  const handleNotAvailedConfirm = () => {
    if (notAvailedData.requestId) {
      updateUserResponse.mutate({
        requestId: notAvailedData.requestId,
        userResponse: "not availed",
        reason: notAvailedData.reason,
      });
    }
  };

  // Handle not availed cancel
  const handleNotAvailedCancel = () => {
    setNotAvailedData({ showModal: false, requestId: null, reason: "" });
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

  // Filter optimized requests that are sanctioned
  const sanctionedOptimizedRequests = data?.data.requests?.filter(
    (request: any) => request.optimizeStatus === true && request.isSanctioned === true
  );

  const totalPages = data?.data.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black">
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Sanctioned & Optimized Requests</h1>
        <WeeklySwitcher
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          isUrgentMode={isUrgentMode}
          weekStartsOn={6} // Saturday
        />
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
            </tr>
          </thead>
          <tbody>
            {sanctionedOptimizedRequests?.length > 0 ? (
              sanctionedOptimizedRequests.map((request: any) => (
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
                    {request.sanctionedTimeFrom && request.sanctionedTimeTo
                      ? `${formatTime(request.sanctionedTimeFrom)} - ${formatTime(
                          request.sanctionedTimeTo
                        )}`
                      : "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.workType || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.activity || "N/A"}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {request.userResponse ? (
                      <span className={`px-2 py-1 text-xs rounded ${
                        request.userResponse === "availed" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {request.userResponse === "availed" ? "Availed" : "Not Availed"}
                        {request.notAvailedReason && request.userResponse === "not availed" && (
                          <div className="text-xs mt-1 text-gray-600">
                            Reason: {request.notAvailedReason}
                          </div>
                        )}
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAvailed(request.id)}
                          disabled={updateUserResponse.isPending}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {updateUserResponse.variables?.requestId === request.id && 
                           updateUserResponse.variables?.userResponse === "availed"
                            ? "Processing..."
                            : "Availed"}
                        </button>
                        <button
                          onClick={() => handleNotAvailedClick(request.id)}
                          disabled={updateUserResponse.isPending}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {updateUserResponse.variables?.requestId === request.id && 
                           updateUserResponse.variables?.userResponse === "not availed"
                            ? "Processing..."
                            : "Not Availed"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="border border-black p-1 text-sm text-center"
                >
                  No sanctioned and optimized requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Not Availed Reason Modal */}
      {notAvailedData.showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">Reason for Not Availing</h3>
            <textarea
              className="w-full border border-gray-300 p-2 mb-4"
              rows={4}
              placeholder="Enter the reason for not availing..."
              value={notAvailedData.reason}
              onChange={(e) =>
                setNotAvailedData({ ...notAvailedData, reason: e.target.value })
              }
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleNotAvailedCancel}
                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleNotAvailedConfirm}
                disabled={!notAvailedData.reason.trim()}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

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