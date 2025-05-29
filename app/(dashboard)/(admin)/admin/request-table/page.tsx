"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, startOfWeek, subDays, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useAcceptUserRequest,
  useApproveAllPendingRequests,
} from "@/app/service/mutation/admin";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { ShowAllToggle } from "@/app/components/ui/ShowAllToggle";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";

export default function RequestTablePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const acceptMutation = useAcceptUserRequest();
  const approveAllMutation = useApproveAllPendingRequests();
  const { isUrgentMode } = useUrgentMode();
  const [showAll, setShowAll] = useState(false);
  const [limit] = useState(30);

  // State for week selection
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return isUrgentMode ? today : startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  });

  // Calculate week range
  const weekEnd = isUrgentMode
    ? currentWeekStart
    : endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStart = isUrgentMode
    ? currentWeekStart
    : startOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Fetch requests data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", page, statusFilter, weekStart, weekEnd, isUrgentMode],
    queryFn: () => {
      const dateRange = isUrgentMode
        ? {
          startDate: format(currentWeekStart, "yyyy-MM-dd"),
          endDate: format(currentWeekStart, "yyyy-MM-dd")  // Use same day for both start and end in urgent mode
        }
        : {
          startDate: format(currentWeekStart, "yyyy-MM-dd"),
          endDate: format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
        };

      if (isUrgentMode) {
        return managerService.getUserRequestsByAdmin(
          1,
          limit,
          dateRange.startDate,
          dateRange.endDate,
          statusFilter !== "ALL" ? statusFilter : undefined
        );
      }
      return managerService.getUserRequestsByAdmin(
        page,
        limit,
        dateRange.startDate,
        dateRange.endDate,
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
      case "ACCEPTED":
        return "bg-green-100 text-green-800 border border-black";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-black";
      case "PENDING":
      default:
        return "";
    }
  };
  const handleApproveAllPending = async () => {
    if (confirm("Are you sure you want to approve all pending requests?")) {
      try {
        await approveAllMutation.mutateAsync();
        alert("All pending requests approved successfully");
      } catch (error) {
        console.error("Failed to approve all requests:", error);
        alert("Failed to approve all requests. Please try again.");
      }
    }
  };
  // Handle accept/reject request
  const handleRequestAction = async (id: string, accept: boolean) => {
    if (
      confirm(
        `Are you sure you want to ${accept ? "approve" : "reject"
        } this request?`
      )
    ) {
      try {
        await acceptMutation.mutateAsync({ id, accept });
        alert(`Request ${accept ? "approved" : "rejected"} successfully`);
      } catch (error) {
        console.error("Failed to process request:", error);
        alert("Failed to process request. Please try again.");
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      if (isUrgentMode) {
        return direction === "prev"
          ? subDays(prev, 1)
          : addDays(prev, 1);
      } else {
        // In normal mode, move by weeks
        return direction === "prev"
          ? subDays(prev, 7)
          : addDays(prev, 7);
      }
    });
    setPage(1); // Reset to first page when changing weeks
  };


  // Filter requests based on status and urgent mode
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    // Always filter by urgent/normal mode
    const urgentMatch = isUrgentMode
      ? request.corridorType === "Urgent Block" || request.workType === "EMERGENCY"
      : request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";

    // Only apply status filter if showAll is false
    const statusMatch = showAll || statusFilter === "ALL" || request.adminRequestStatus === statusFilter;

    return urgentMatch && statusMatch;
  }) || [];

  if (isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">Loading requests...</div>
      </div>
    );
  }

  const corridorRequests = filteredRequests.filter(
    (request) => request.corridorType === "Corridor"
  );

  const nonCorridorRequests = filteredRequests.filter(
    (request) => request.corridorType === "Outside Corridor"
  );

  const urgentRequests = filteredRequests.filter(
    (request) => request.corridorType === "Urgent Block"
  );

  if (error) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5 text-red-600">
          Error loading requests. Please try again.
        </div>
      </div>
    );
  }

  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[#13529e]">
            {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
          </h1>
          <span className={`px-3 py-1 text-sm rounded-full ${isUrgentMode ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} border border-black`}>
            {isUrgentMode ? 'Urgent Mode' : 'Normal Mode'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApproveAllPending}
            className="px-3 py-1 text-sm bg-blue-600 text-white border border-black"
          >
            Save
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gov-input text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <ShowAllToggle
          showAll={showAll}
          onToggle={() => setShowAll(!showAll)}
          isUrgentMode={isUrgentMode}
        />
      </div>
      <WeeklySwitcher
        currentWeekStart={currentWeekStart}
        onWeekChange={handleWeekChange}
        isUrgentMode={isUrgentMode}
        weekStartsOn={1} // Monday
      />
      {/* Urgent mode description and date range */}
      {isUrgentMode && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <p className="font-medium">Urgent Mode Active</p>
            <p>Showing urgent block requests and emergency work types for the selected day.</p>
          </div>
          <div className="text-sm text-gray-600">
            Date: {format(currentWeekStart, "dd-MM-yyyy")}
          </div>
        </div>
      )}

      {!isUrgentMode && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <p className="font-medium">Normal Mode Active</p>
            <p>Showing regular block requests for the selected week.</p>
          </div>
          <div className="text-sm text-gray-600">
            Week: {format(weekStart, "dd-MM-yyyy")} to {format(weekEnd, "dd-MM-yyyy")}
          </div>
        </div>
      )}

      {isUrgentMode && <>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2 text-[#13529e]">
            Urgent Block Requests
          </h2>
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
                  Corridor Type
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium text-black">
                  Work Type
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium text-black">
                  Activity
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium text-black">
                  S&T Approval
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
              {urgentRequests.map((request: UserRequest) => (
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
                    {request.processedLineSections?.[0]?.lineName || "N/A"}
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
                        request.sntDisconnectionRequired === undefined
                          ? "NAN"
                          : request.sntDisconnectionRequired
                            ? request.DisconnAcceptance || "PENDING"
                            : "NAN"
                      )}`}
                    >
                      {request.sntDisconnectionRequired === undefined
                        ? "NAN"
                        : request.sntDisconnectionRequired
                          ? request.DisconnAcceptance || "PENDING"
                          : "NAN"}
                    </span>
                  </td>
                  <td className="border border-black p-1 text-sm">
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${request.adminRequestStatus === "ACCEPTED"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : request.adminRequestStatus === "REJECTED"
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        }`}
                    >
                      {request.adminRequestStatus}
                    </span>
                  </td>
                  <td className="border border-black p-1 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/view-request/${request.id}?from=request-table`}
                        className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                      >
                        View
                      </Link>
                      {request.adminRequestStatus === "PENDING" && (
                        <button
                          onClick={() => handleRequestAction(request.id, false)}
                          className="px-2 py-1 text-xs bg-red-600 text-white border border-black"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {!isUrgentMode && <>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2 text-[#13529e]">
            Corridor Requests
          </h2>
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
                    Corridor Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Work Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Activity
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    S&T Approval
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
                {corridorRequests.map((request: UserRequest) => (
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
                      {request.processedLineSections?.[0]?.lineName || "N/A"}
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
                          request.sntDisconnectionRequired === undefined
                            ? "NAN"
                            : request.sntDisconnectionRequired
                              ? request.DisconnAcceptance || "PENDING"
                              : "NAN"
                        )}`}
                      >
                        {request.sntDisconnectionRequired === undefined
                          ? "NAN"
                          : request.sntDisconnectionRequired
                            ? request.DisconnAcceptance || "PENDING"
                            : "NAN"}
                      </span>
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${request.adminRequestStatus === "ACCEPTED"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : request.adminRequestStatus === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          }`}
                      >
                        {request.adminRequestStatus}
                      </span>
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/view-request/${request.id}?from=request-table`}
                          className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                        >
                          View
                        </Link>
                        {request.adminRequestStatus === "PENDING" && (
                          <button
                            onClick={() => handleRequestAction(request.id, false)}
                            className="px-2 py-1 text-xs bg-red-600 text-white border border-black"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2 text-[#13529e]">
            Non-Corridor Requests
          </h2>
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
                    Corridor Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Work Type
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    Activity
                  </th>
                  <th className="border border-black p-1 text-left text-sm font-medium text-black">
                    S&T Approval
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
                {nonCorridorRequests.map((request: UserRequest) => (
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
                      {request.processedLineSections?.[0]?.lineName || "N/A"}
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
                          request.sntDisconnectionRequired === undefined
                            ? "NAN"
                            : request.sntDisconnectionRequired
                              ? request.DisconnAcceptance || "PENDING"
                              : "NAN"
                        )}`}
                      >
                        {request.sntDisconnectionRequired === undefined
                          ? "NAN"
                          : request.sntDisconnectionRequired
                            ? request.DisconnAcceptance || "PENDING"
                            : "NAN"}
                      </span>
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${request.adminRequestStatus === "ACCEPTED"
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : request.adminRequestStatus === "REJECTED"
                            ? "bg-red-100 text-red-800 border border-red-300"
                            : "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          }`}
                      >
                        {request.adminRequestStatus}
                      </span>
                    </td>
                    <td className="border border-black p-1 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/view-request/${request.id}?from=request-table`}
                          className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                        >
                          View
                        </Link>
                        {request.adminRequestStatus === "PENDING" && (
                          <button
                            onClick={() => handleRequestAction(request.id, false)}
                            className="px-2 py-1 text-xs bg-red-600 text-white border border-black"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}

      {/* Pagination - only show in normal mode */}
      {!isUrgentMode && totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
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
