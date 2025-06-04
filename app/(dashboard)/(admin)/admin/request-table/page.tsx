"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, startOfWeek, subDays, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useAcceptUserRequest,
  useApproveAllPendingRequests,
} from "@/app/service/mutation/admin";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { ShowAllToggle } from "@/app/components/ui/ShowAllToggle";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";

export default function RequestTablePage() {
  // Context hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUrgentMode } = useUrgentMode();

  // State hooks
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [limit] = useState(30);
  const [activeTab, setActiveTab] = useState<'corridor' | 'non-corridor'>('corridor');

  // Initialize currentWeekStart from URL parameter or default to current date
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    const today = new Date();
    return isUrgentMode ? today : startOfWeek(today, { weekStartsOn: 1 });
  });

  // Mutation hooks
  const acceptMutation = useAcceptUserRequest();
  const approveAllMutation = useApproveAllPendingRequests();

  // Calculate week range
  const weekEnd = isUrgentMode
    ? currentWeekStart
    : endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStart = isUrgentMode
    ? currentWeekStart
    : startOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Update URL when currentWeekStart changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('date', format(currentWeekStart, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [currentWeekStart, router]);

  // Fetch requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", statusFilter, weekStart, weekEnd, isUrgentMode],
    queryFn: () => {
      const dateRange = isUrgentMode
        ? {
          startDate: format(currentWeekStart, "yyyy-MM-dd"),
          endDate: format(currentWeekStart, "yyyy-MM-dd")
        }
        : {
          startDate: format(currentWeekStart, "yyyy-MM-dd"),
          endDate: format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
        };

      return managerService.getUserRequestsByAdmin(
        1,
        1000,
        dateRange.startDate,
        dateRange.endDate,
        statusFilter !== "ALL" ? statusFilter : undefined
      );
    }
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const hours = date.getUTCHours().toString().padStart(2, '0');
      const minutes = date.getUTCMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting time:", error, dateString);
      return "N/A";
    }
  };

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

  const getLineOrRoad = (request: UserRequest) => {
    if (
      request.processedLineSections &&
      Array.isArray(request.processedLineSections) &&
      request.processedLineSections.length > 0
    ) {
      return request.processedLineSections
        .map((section) => {
          if (section.type === "yard") {
            if (section.stream && section.road) {
              return `${section.stream}/${section.road}`;
            }
            if (section.stream) {
              return section.stream;
            }
            if (section.road) {
              return section.road;
            }
          } else if (section.lineName) {
            return section.lineName;
          }
          return null;
        })
        .filter(Boolean)
        .join(", ") || "N/A";
    }
    return "N/A";
  };

  const getAdjacentLinesAffected = (request: UserRequest): string => {
    if (request.adjacentLinesAffected) {
      return request.adjacentLinesAffected;
    }

    if (request.processedLineSections) {
      const affectedLines = request.processedLineSections.map(section => {
        if (section.type === 'yard') {
          return section.otherRoads;
        }
        return section.otherLines;
      }).filter(Boolean).join(", ");

      return affectedLines || "N/A";
    }

    return "N/A";
  };

  // Event handlers
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

  const handleRequestAction = async (id: string, accept: boolean) => {
    if (
      confirm(
        `Are you sure you want to ${accept ? "approve" : "reject"} this request?`
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

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      if (isUrgentMode) {
        return direction === "prev"
          ? subDays(prev, 1)
          : addDays(prev, 1);
      } else {
        return direction === "prev"
          ? subDays(prev, 7)
          : addDays(prev, 7);
      }
    });
    setPage(1);
  };

  // Filter requests based on status and urgent mode
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const urgentMatch = isUrgentMode
      ? request.corridorType === "Urgent Block" || request.workType === "EMERGENCY"
      : request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";

    const statusMatch = statusFilter === "ALL" || request.adminRequestStatus === statusFilter;

    return urgentMatch && statusMatch;
  }) || [];

  const corridorRequests = filteredRequests.filter(
    (request) => request.corridorType === "Corridor"
  );

  const nonCorridorRequests = filteredRequests.filter(
    (request) => request.corridorType === "Outside Corridor"
  );

  const urgentRequests = filteredRequests.filter(
    (request) => request.corridorType === "Urgent Block"
  );

  const handleDownloadCSV = () => {
    if (!data?.data?.requests) return;

    // Get the current filtered requests
    const requestsToDownload = filteredRequests;

    // Create CSV headers
    const headers = [
      "Date",
      "Major Section",
      "Depot",
      "Block Section",
      "Line/Road",
      "Adjacent Lines Affected",
      "Work Type",
      "Corridor Type",
      "Activity",
      "Demanded Time From",
      "Demanded Time To",
      "Requested By",
      "Department",
      "Description"
    ];

    // Create CSV rows
    const rows = requestsToDownload.map((request: UserRequest) => [
      formatDate(request.date),
      request.selectedSection || "N/A",
      request.selectedDepo || "N/A",
      request.missionBlock || "N/A",
      getLineOrRoad(request),
      request.adjacentLinesAffected || getAdjacentLinesAffected(request),
      request.workType || "N/A",
      request.corridorType || "N/A",
      request.activity || "N/A",
      formatTime(request.demandTimeFrom || ""),
      formatTime(request.demandTimeTo || ""),
      request.user?.name || "N/A",
      request.selectedDepartment || "N/A",
      request.requestremarks || "N/A"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `requests_${format(currentWeekStart, "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={handleDownloadCSV}
            className="px-3 py-1 text-sm bg-green-600 text-white border border-black hover:bg-green-700"
          >
            Download CSV
          </button>
          <button
            onClick={handleApproveAllPending}
            className="px-3 py-1 text-sm bg-blue-600 text-white border border-black hover:bg-blue-700"
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
      </div>

      <WeeklySwitcher
        currentWeekStart={currentWeekStart}
        onWeekChange={handleWeekChange}
        isUrgentMode={isUrgentMode}
        weekStartsOn={1}
      />

      {/* Mode description and date range */}
      {isUrgentMode ? (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <p className="font-medium">Urgent Mode Active</p>
            <p>Showing urgent block requests and emergency work types for the selected day.</p>
          </div>
          <div className="text-sm text-gray-600">
            Date: {format(currentWeekStart, "dd-MM-yyyy")}
          </div>
        </div>
      ) : (
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

      {!isUrgentMode && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('corridor')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'corridor'
                  ? 'border-[#13529e] text-[#13529e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Corridor Requests
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {corridorRequests.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('non-corridor')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'non-corridor'
                  ? 'border-[#13529e] text-[#13529e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Non-Corridor Requests
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                  {nonCorridorRequests.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
              <table className="w-full border-collapse text-black">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Date</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Major Section</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Depot</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Block Section</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Line / Road</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Time</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Work Type</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Activity</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">S&T Approval</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Status</th>
                    <th className="border border-black p-2 text-left text-sm font-medium text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'corridor' ? corridorRequests : nonCorridorRequests).map((request: UserRequest) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="border border-black p-2 text-sm">{formatDate(request.date)}</td>
                      <td className="border border-black p-2 text-sm">{request.selectedSection}</td>
                      <td className="border border-black p-2 text-sm">{request.selectedDepo}</td>
                      <td className="border border-black p-2 text-sm">{request.missionBlock}</td>
                      <td className="border border-black p-2 text-sm">{getLineOrRoad(request)}</td>
                      <td className="border border-black p-2 text-sm">
                        {formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}
                      </td>
                      <td className="border border-black p-2 text-sm">{request.workType}</td>
                      <td className="border border-black p-2 text-sm">{request.activity}</td>
                      <td className="border border-black p-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.sntDisconnectionRequired ? request.DisconnAcceptance || "PENDING" : "NAN")}`}>
                          {request.sntDisconnectionRequired ? request.DisconnAcceptance || "PENDING" : "NAN"}
                        </span>
                      </td>
                      <td className="border border-black p-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.adminRequestStatus)}`}>
                          {request.adminRequestStatus}
                        </span>
                      </td>
                      <td className="border border-black p-2 text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/view-request/${request.id}?from=request-table`}
                            className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black hover:bg-[#0e4080] flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            View
                          </Link>
                          {request.adminRequestStatus === "PENDING" && (
                            <button
                              onClick={() => handleRequestAction(request.id, false)}
                              className="px-2 py-1 text-xs bg-red-600 text-white border border-black hover:bg-red-700"
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
        </div>
      )}

      {isUrgentMode && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#13529e]">
              Urgent Block Requests
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                {urgentRequests.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
            <table className="w-full border-collapse text-black">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Date</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Major Section</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Depot</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Block Section</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Line / Road</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Time</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Work Type</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Activity</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">S&T Approval</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Status</th>
                  <th className="border border-black p-2 text-left text-sm font-medium text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {urgentRequests.map((request: UserRequest) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="border border-black p-2 text-sm">{formatDate(request.date)}</td>
                    <td className="border border-black p-2 text-sm">{request.selectedSection}</td>
                    <td className="border border-black p-2 text-sm">{request.selectedDepo}</td>
                    <td className="border border-black p-2 text-sm">{request.missionBlock}</td>
                    <td className="border border-black p-2 text-sm">{getLineOrRoad(request)}</td>
                    <td className="border border-black p-2 text-sm">
                      {formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}
                    </td>
                    <td className="border border-black p-2 text-sm">{request.workType}</td>
                    <td className="border border-black p-2 text-sm">{request.activity}</td>
                    <td className="border border-black p-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.sntDisconnectionRequired ? request.DisconnAcceptance || "PENDING" : "NAN")}`}>
                        {request.sntDisconnectionRequired ? request.DisconnAcceptance || "PENDING" : "NAN"}
                      </span>
                    </td>
                    <td className="border border-black p-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.adminRequestStatus)}`}>
                        {request.adminRequestStatus}
                      </span>
                    </td>
                    <td className="border border-black p-2 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/view-request/${request.id}?from=request-table`}
                          className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black hover:bg-[#0e4080] flex items-center"
                        >
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          View
                        </Link>
                        {request.adminRequestStatus === "PENDING" && (
                          <button
                            onClick={() => handleRequestAction(request.id, false)}
                            className="px-2 py-1 text-xs bg-red-600 text-white border border-black hover:bg-red-700"
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
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
