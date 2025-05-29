"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";

export default function RequestTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Increased limit to show more requests
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

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
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });

  // Filters
  const [filters, setFilters] = useState({
    status: "ALL",
    department: "ALL",
    section: "ALL",
    workType: "ALL",
    corridorType: "ALL"
  });

  // Update URL when currentWeekStart changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('date', format(currentWeekStart, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [currentWeekStart, router]);

  // Calculate week range
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 6 });

  // Fetch requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", page, filters, weekStart, weekEnd, isUrgentMode, currentWeekStart],
    queryFn: () => {
      if (isUrgentMode) {
        // For urgent mode, get requests for the selected date
        const selectedDate = format(currentWeekStart, "yyyy-MM-dd");
        return managerService.getUserRequestsByManager(
          1,
          limit,
          selectedDate,
          selectedDate,
          filters.status !== "ALL" ? filters.status : undefined
        );
      }
      return managerService.getUserRequestsByManager(
        page,
        limit,
        format(weekStart, "yyyy-MM-dd"),
        format(weekEnd, "yyyy-MM-dd"),
        filters.status !== "ALL" ? filters.status : undefined
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

  // Handle week/day navigation
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      if (isUrgentMode) {
        // For urgent mode, move by one day
        const newDate = direction === "prev" ? subDays(prev, 1) : addDays(prev, 1);
        return newDate;
      } else {
        // For normal mode, move by one week
        return direction === "prev" ? subDays(prev, 7) : addDays(prev, 7);
      }
    });
    setPage(1);
  };

  // Filter requests based on all filters
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const statusMatch = filters.status === "ALL" || request.status === filters.status;
    const departmentMatch = filters.department === "ALL" || request.selectedDepartment === filters.department;
    const sectionMatch = filters.section === "ALL" || request.selectedSection === filters.section;
    const workTypeMatch = filters.workType === "ALL" || request.workType === filters.workType;
    const corridorTypeMatch = filters.corridorType === "ALL" || request.corridorType === filters.corridorType;

    // For urgent mode, also filter by date
    const dateMatch = isUrgentMode
      ? format(parseISO(request.date), "yyyy-MM-dd") === format(currentWeekStart, "yyyy-MM-dd")
      : true;

    return statusMatch && departmentMatch && sectionMatch && workTypeMatch && corridorTypeMatch && dateMatch;
  }) || [];

  // Bulk approve mutation
  const approveMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const promises = requestIds.map(id =>
        managerService.acceptUserRequest(id, true)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setSelectedRequests(new Set());
    }
  });

  // Handle select all
  const handleSelectAll = () => {
    const selectableRequests = filteredRequests.filter(request =>
      request.status === "PENDING" && !request.managerAcceptance
    );
    if (selectedRequests.size === selectableRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(selectableRequests.map(r => r.id)));
    }
  };

  // Handle individual selection
  const handleSelectRequest = (requestId: string) => {
    const request = filteredRequests.find(r => r.id === requestId);
    if (request && request.status === "PENDING" && !request.managerAcceptance) {
      const newSelected = new Set(selectedRequests);
      if (newSelected.has(requestId)) {
        newSelected.delete(requestId);
      } else {
        newSelected.add(requestId);
      }
      setSelectedRequests(newSelected);
    }
  };

  // Handle bulk approve
  const handleBulkApprove = () => {
    if (selectedRequests.size > 0) {
      if (confirm(`Are you sure you want to approve ${selectedRequests.size} requests?`)) {
        approveMutation.mutate(Array.from(selectedRequests));
      }
    }
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
        <h1 className="text-lg font-bold text-[#13529e]">
          {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
        </h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-transparent"
          >
            <option value="ALL">All Departments</option>
            {Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.selectedDepartment) || [])).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-transparent"
          >
            <option value="ALL">All Sections</option>
            {Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.selectedSection) || [])).map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <select
            value={filters.workType}
            onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-transparent"
          >
            <option value="ALL">All Work Types</option>
            {Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.workType) || [])).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filters.corridorType}
            onChange={(e) => setFilters(prev => ({ ...prev, corridorType: e.target.value }))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-transparent"
          >
            <option value="ALL">All Corridor Types</option>
            <option value="Corridor">Corridor</option>
            <option value="Outside Corridor">Outside Corridor</option>
            <option value="Urgent Block">Urgent Block</option>
          </select>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="mb-4">
        {isUrgentMode ? (
          <div className="flex justify-center gap-2 text-black">
            <button
              onClick={() => handleWeekChange("prev")}
              className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black hover:bg-gray-50"
            >
              Previous Day
            </button>
            <span className="px-3 py-1 text-sm font-medium">
              {format(currentWeekStart, "dd MMM yyyy")}
            </span>
            <button
              onClick={() => handleWeekChange("next")}
              className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black hover:bg-gray-50"
            >
              Next Day
            </button>
          </div>
        ) : (
          <WeeklySwitcher
            currentWeekStart={currentWeekStart}
            onWeekChange={handleWeekChange}
            weekStartsOn={6}
          />
        )}
      </div>

      {/* Bulk Actions */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedRequests.size > 0 && selectedRequests.size === filteredRequests.filter(r => r.status !== "REJECTED").length}
            onChange={handleSelectAll}
            className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
          />
          <span className="text-sm text-gray-700">Select All</span>
        </div>
        {selectedRequests.size > 0 && (
          <button
            onClick={handleBulkApprove}
            disabled={approveMutation.isPending}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {approveMutation.isPending ? "Approving..." : `Approve Selected (${selectedRequests.size})`}
          </button>
        )}
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-5 text-gray-600">
            No requests found for the selected filters
          </div>
        ) : (
          <table className="w-full border-collapse text-black">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black p-2 text-left text-sm font-medium text-black w-10">
                  <input
                    type="checkbox"
                    checked={selectedRequests.size > 0 && selectedRequests.size === filteredRequests.filter(r => r.status !== "REJECTED").length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                  />
                </th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Date</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Major Section</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Depot</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Block Section</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Line</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Time</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Work Type</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Status</th>
                <th className="border border-black p-2 text-left text-sm font-medium text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request: UserRequest) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="border border-black p-2 text-sm">
                    {request.status !== "REJECTED" && (
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                        className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                      />
                    )}
                  </td>
                  <td className="border border-black p-2 text-sm">{formatDate(request.date)}</td>
                  <td className="border border-black p-2 text-sm">{request.selectedSection}</td>
                  <td className="border border-black p-2 text-sm">{request.selectedDepo}</td>
                  <td className="border border-black p-2 text-sm">{request.missionBlock}</td>
                  <td className="border border-black p-2 text-sm">
                    {request.processedLineSections?.[0]?.lineName || "N/A"}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}
                  </td>
                  <td className="border border-black p-2 text-sm">{request.workType}</td>
                  <td className="border border-black p-2 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="border border-black p-2 text-sm">
                    <Link
                      href={`/manage/view-request/${request.id}?from=request-table`}
                      className="px-2 py-1 text-xs bg-[#13529e] text-white border border-[#0e4080] rounded hover:bg-[#0e4080]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.data?.totalPages && data.data.totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {data?.data?.totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data?.data?.totalPages || 1, p + 1))}
            disabled={page === (data?.data?.totalPages || 1)}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}