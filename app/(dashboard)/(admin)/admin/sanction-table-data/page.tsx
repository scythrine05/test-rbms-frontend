"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { UserRequest } from "@/app/service/api/manager";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Header icons for tables
const HeaderIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "date":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
      );
    case "section":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      );
    case "line":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
      );
    case "time":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V3a1 1 0 102 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      );
    case "work":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" /></svg>
      );
    case "corridor":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" /></svg>
      );
    case "user":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a5 5 0 100 10A5 5 0 0010 2zm-7 16a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
      );
    case "reason":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M18 13V7a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2zm-2 0H4V7h12v6z" /></svg>
      );
    case "action":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V3a1 1 0 102 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      );
    default:
      return null;
  }
};

const ColumnHeader = ({ icon, title }: { icon: string; title: string }) => (
  <div className="flex items-center">
    <HeaderIcon type={icon} />
    <span>{title}</span>
  </div>
);

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

export default function OptimiseTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isUrgentMode } = useUrgentMode();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [departmentTab, setDepartmentTab] = useState<'all' | 'engg' | 'trd' | 'snt'>('all');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>("ALL");
  const [activityFilter, setActivityFilter] = useState<string>("ALL");
  const [timeSlotFilter, setTimeSlotFilter] = useState<string>("ALL");

  // Initialize currentWeekStart from URL parameter or default to current date
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      return new Date(dateParam);
    }
    const today = new Date();
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });

  // Update URL when currentWeekStart changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(currentWeekStart, 'yyyy-MM-dd'));
    router.push(`?${params.toString()}`, { scroll: false });
  }, [currentWeekStart, router, searchParams]);

  // For urgent mode, use the same day for start and end
  // For non-urgent mode, use Saturday to Friday (matching optimised-table-data)
  const weekStart = isUrgentMode
    ? currentWeekStart
    : startOfWeek(currentWeekStart, { weekStartsOn: 6 }); // Explicitly start from Saturday
  const weekEnd = isUrgentMode
    ? currentWeekStart
    : endOfWeek(weekStart, { weekStartsOn: 6 }); // Explicitly end on Friday

  // In urgent mode, we use the same date for both start and end dates
  // This ensures we only get data for a single day in urgent mode
  const apiStartDate = format(weekStart, "yyyy-MM-dd");
  const apiEndDate = isUrgentMode ? apiStartDate : format(weekEnd, "yyyy-MM-dd");

  // Add debug logging for date range
  console.log('Date Range:', apiStartDate, 'to', apiEndDate);
  console.log('Is Urgent Mode:', isUrgentMode);
  console.log('Current Date/Time:', new Date().toISOString());
  const limit = 5000;
  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", page, apiStartDate, apiEndDate, isUrgentMode],
    queryFn: () =>
      adminService.getOptimizeRequests(
        apiStartDate,
        apiEndDate,
        page,
        limit
      ),
  });

  // Get unique work types and activities for filters
  const uniqueWorkTypes = Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.workType).filter(Boolean) || [])) as string[];
  const uniqueActivities = Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.activity).filter(Boolean) || [])) as string[];

  // Time slot helper function
  const getTimeSlot = (timeStr: string) => {
    if (!timeStr) return "N/A";
    const hour = new Date(timeStr).getUTCHours();
    if (hour >= 20 || hour < 4) return "20:00-04:00";
    if (hour >= 4 && hour < 12) return "04:00-12:00";
    return "12:00-20:00";
  };

  // Filter requests based on department and other filters
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const departmentMatch = departmentTab === 'all' ||
      (departmentTab === 'snt' ? request.selectedDepartment?.toUpperCase() === 'S&T' :
        request.selectedDepartment?.toUpperCase() === departmentTab.toUpperCase());
    const workTypeMatch = workTypeFilter === "ALL" || request.workType === workTypeFilter;
    const activityMatch = activityFilter === "ALL" || request.activity === activityFilter;
    const timeSlotMatch = timeSlotFilter === "ALL" || getTimeSlot(request.demandTimeFrom) === timeSlotFilter;

    return departmentMatch && workTypeMatch && activityMatch && timeSlotMatch;
  }) || [];

  // Separate corridor and non-corridor requests
  const corridorRequests = filteredRequests.filter(
    (request: UserRequest) => request.corridorType === "Corridor"
  );

  const nonCorridorRequests = filteredRequests.filter(
    (request: UserRequest) => request.corridorType === "Outside Corridor"
  );

  const [sanctionedData, setSanctionedData] = useState<UserRequest[] | null>(null);

  // Format date and time helpers
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return dateString;
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

  // Function to navigate to previous or next period (day for urgent, week for non-urgent)
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      if (isUrgentMode) {
        return direction === "prev" ? subDays(prev, 1) : addDays(prev, 1);
      } else {
        return direction === "prev" ? subDays(prev, 7) : addDays(prev, 7);
      }
    });
    setPage(1); // Reset to first page when changing periods
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
      "Optimized Time From",
      "Optimized Time To",
      "Sanctioned Time From",
      "Sanctioned Time To",
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
      formatTime(request.optimizeTimeFrom || ""),
      formatTime(request.optimizeTimeTo || ""),
      formatTime(request.sanctionedTimeFrom || ""),
      formatTime(request.sanctionedTimeTo || ""),
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
    link.setAttribute("download", `sanctioned_requests_${format(currentWeekStart, "yyyy-MM-dd")}.csv`);
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
    <div className="bg-white p-3 border border-black">
      {/* Header and week navigation */}
      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[#13529e]">Sanctioned Requests</h1>
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
          <WeeklySwitcher
            currentWeekStart={currentWeekStart}
            onWeekChange={handleWeekChange}
            isUrgentMode={isUrgentMode}
            weekStartsOn={1}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg border border-[#13529e] mb-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#13529e]">Work Type</label>
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#13529e] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-[#13529e] text-gray-700"
            >
              <option value="ALL">All Work Types</option>
              {uniqueWorkTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#13529e]">Activity</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#13529e] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-[#13529e] text-gray-700"
            >
              <option value="ALL">All Activities</option>
              {uniqueActivities.map((activity) => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#13529e]">Time Slot</label>
            <select
              value={timeSlotFilter}
              onChange={(e) => setTimeSlotFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#13529e] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#13529e] focus:border-[#13529e] text-gray-700"
            >
              <option value="ALL">All Time Slots</option>
              <option value="20:00-04:00">Night (20:00-04:00)</option>
              <option value="04:00-12:00">Morning (04:00-12:00)</option>
              <option value="12:00-20:00">Afternoon (12:00-20:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Department Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setDepartmentTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${departmentTab === 'all'
              ? 'border-[#13529e] text-[#13529e]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            All Requests
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              {isUrgentMode
                ? data?.data?.requests?.filter((r: UserRequest) => r.corridorType === "Urgent Block" || r.workType === "EMERGENCY").length || 0
                : data?.data?.requests?.filter((r: UserRequest) => r.corridorType !== "Urgent Block" && r.workType !== "EMERGENCY").length || 0}
            </span>
          </button>
          <button
            onClick={() => setDepartmentTab('engg')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${departmentTab === 'engg'
              ? 'border-[#13529e] text-[#13529e]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Engineering
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              {isUrgentMode
                ? data?.data?.requests?.filter((r: UserRequest) => (r.corridorType === "Urgent Block" || r.workType === "EMERGENCY") && r.selectedDepartment?.toUpperCase() === 'ENGG').length || 0
                : data?.data?.requests?.filter((r: UserRequest) => r.corridorType !== "Urgent Block" && r.workType !== "EMERGENCY" && r.selectedDepartment?.toUpperCase() === 'ENGG').length || 0}
            </span>
          </button>
          <button
            onClick={() => setDepartmentTab('trd')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${departmentTab === 'trd'
              ? 'border-[#13529e] text-[#13529e]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            TRD
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              {isUrgentMode
                ? data?.data?.requests?.filter((r: UserRequest) => (r.corridorType === "Urgent Block" || r.workType === "EMERGENCY") && r.selectedDepartment?.toUpperCase() === 'TRD').length || 0
                : data?.data?.requests?.filter((r: UserRequest) => r.corridorType !== "Urgent Block" && r.workType !== "EMERGENCY" && r.selectedDepartment?.toUpperCase() === 'TRD').length || 0}
            </span>
          </button>
          <button
            onClick={() => setDepartmentTab('snt')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${departmentTab === 'snt'
              ? 'border-[#13529e] text-[#13529e]'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            S&T
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              {isUrgentMode
                ? data?.data?.requests?.filter((r: UserRequest) => (r.corridorType === "Urgent Block" || r.workType === "EMERGENCY") && r.selectedDepartment?.toUpperCase() === 'S&T').length || 0
                : data?.data?.requests?.filter((r: UserRequest) => r.corridorType !== "Urgent Block" && r.workType !== "EMERGENCY" && r.selectedDepartment?.toUpperCase() === 'S&T').length || 0}
            </span>
          </button>
        </nav>
      </div>

      {!isUrgentMode && (
        <>
          {/* Corridor Requests Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 text-[#13529e]">
              Corridor Requests
            </h2>
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-lg border border-gray-300 shadow-sm">
              <table className="w-full border-collapse text-black bg-white">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow">
                  <tr className="bg-gray-50">
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="date" title="Date" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Major Section" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Depot" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Block Section" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="line" title="Line / Road" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="time" title="Optimized Time" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="work" title="Work Type" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="work" title="Activity" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="action" title="Actions" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {corridorRequests.map((request: UserRequest) => (
                    <tr
                      key={`request-${request.id}-${request.date}`}
                      className={`hover:bg-blue-50 transition-colors ${request.optimizeTimeFrom && request.optimizeTimeTo
                        ? "bg-green-50"
                        : ""
                        }`}
                    >
                      <td className="border border-black p-2 text-sm">
                        {formatDate(request.date)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.selectedSection}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.selectedDepo}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.missionBlock}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {getLineOrRoad(request)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.optimizeTimeFrom
                          ? formatTime(request.optimizeTimeFrom)
                          : "N/A"}{" "}
                        -{" "}
                        {request.optimizeTimeTo
                          ? formatTime(request.optimizeTimeTo)
                          : "N/A"}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.workType}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.activity}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/view-request/${request.id}?from=sanction-table-data`}
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
          </div>

          {/* Non-Corridor Requests Table */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-[#13529e]">
              Non-Corridor Requests
            </h2>
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-lg border border-gray-300 shadow-sm">
              <table className="w-full border-collapse text-black bg-white">
                <thead className="sticky top-0 z-10 bg-gray-100 shadow">
                  <tr className="bg-gray-50">
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="date" title="Date" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Major Section" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Depot" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="section" title="Block Section" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="line" title="Line / Road" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="time" title="Optimized Time" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="work" title="Work Type" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="work" title="Activity" />
                    </th>
                    <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                      <ColumnHeader icon="action" title="Actions" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nonCorridorRequests.map((request: UserRequest) => (
                    <tr
                      key={`request-${request.id}-${request.date}`}
                      className={`hover:bg-blue-50 transition-colors ${request.optimizeTimeFrom && request.optimizeTimeTo
                        ? "bg-green-50"
                        : ""
                        }`}
                    >
                      <td className="border border-black p-2 text-sm">
                        {formatDate(request.date)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.selectedSection}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.selectedDepo}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.missionBlock}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {getLineOrRoad(request)}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.optimizeTimeFrom
                          ? formatTime(request.optimizeTimeFrom)
                          : "N/A"}{" "}
                        -{" "}
                        {request.optimizeTimeTo
                          ? formatTime(request.optimizeTimeTo)
                          : "N/A"}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.workType}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        {request.activity}
                      </td>
                      <td className="border border-black p-2 text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/view-request/${request.id}?from=sanction-table-data`}
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
          </div>
        </>
      )}

      {isUrgentMode && (
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto rounded-lg border border-gray-300 shadow-sm">
          <table className="w-full border-collapse text-black bg-white">
            <thead className="sticky top-0 z-10 bg-gray-100 shadow">
              <tr className="bg-gray-50">
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="date" title="Date" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="section" title="Major Section" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="section" title="Depot" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="section" title="Block Section" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="line" title="Line / Road" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="time" title="Optimized Time" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="work" title="Work Type" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="work" title="Activity" />
                </th>
                <th className="border border-black p-2 text-left text-sm font-semibold text-black sticky top-0 bg-gray-100 z-10">
                  <ColumnHeader icon="action" title="Actions" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request: UserRequest) => (
                <tr
                  key={`request-${request.id}-${request.date}`}
                  className={`hover:bg-blue-50 transition-colors ${request.optimizeTimeFrom && request.optimizeTimeTo
                    ? "bg-green-50"
                    : ""
                    }`}
                >
                  <td className="border border-black p-2 text-sm">
                    {formatDate(request.date)}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.selectedSection}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.selectedDepo}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.missionBlock}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {getLineOrRoad(request)}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.optimizeTimeFrom
                      ? formatTime(request.optimizeTimeFrom)
                      : "N/A"}{" "}
                    -{" "}
                    {request.optimizeTimeTo
                      ? formatTime(request.optimizeTimeTo)
                      : "N/A"}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.workType}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    {request.activity}
                  </td>
                  <td className="border border-black p-2 text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/view-request/${request.id}?from=sanction-table-data`}
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
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}