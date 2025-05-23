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
import { useGetAdminRequests } from "@/app/service/query/user-request";

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
      if (isUrgentMode) {
        const today = new Date();
        const endDate = addDays(today, 1);
        return managerService.getUserRequestsByAdmin(
          1,
          limit,
          format(today, "yyyy-MM-dd"),
          format(endDate, "yyyy-MM-dd"),
          statusFilter !== "ALL" ? statusFilter : undefined
        );
      }
      return managerService.getUserRequestsByAdmin(
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
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return "Invalid time";
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
        `Are you sure you want to ${
          accept ? "approve" : "reject"
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
    setCurrentWeekStart((prev) =>
      direction === "prev" 
        ? subDays(prev, isUrgentMode ? 1 : 7) 
        : addDays(prev, isUrgentMode ? 1 : 7)
    );
    setPage(1); // Reset to first page when changing weeks
  };


  // Filter requests based on status and urgent mode
  const filteredRequests = showAll 
    ? data?.data?.requests || []
    : data?.data?.requests?.filter((request: UserRequest) => {
        const statusMatch = statusFilter === "ALL" || request.adminRequestStatus === statusFilter;
        const urgentMatch = isUrgentMode 
          ? request.corridorType === "Urgent Block" || request.workType === "EMERGENCY"
          : request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
        return statusMatch && urgentMatch;
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
        <h1 className="text-lg font-bold text-[#13529e]">
          {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
        </h1>
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
            <p>Showing urgent block requests and emergency work types for the next day.</p>
          </div>
          <div className="text-sm text-gray-600">
            Date Range: {format(new Date(), "dd-MM-yyyy")} to {format(addDays(new Date(), 1), "dd-MM-yyyy")}
          </div>
        </div>
      )}

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
                      className={`px-2 py-0.5 text-xs rounded ${
                        request.adminRequestStatus === "ACCEPTED"
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
                        href={`/admin/view-request/${request.id}`}
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
                      className={`px-2 py-0.5 text-xs rounded ${
                        request.adminRequestStatus === "ACCEPTED"
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
                        href={`/admin/view-request/${request.id}`}
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
