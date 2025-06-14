"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import { useSession } from "next-auth/react";
import { useRef } from "react";

export default function ManagerRequestTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isUrgentMode } = useUrgentMode();
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Increased limit to show more requests
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), "dd-MM-yy"),
    endDate: format(new Date(), "dd-MM-yy")
  });
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedSSE, setSelectedSSE] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

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
    corridorType: "ALL",
    blockType: "All",
    sse: "ALL" // Added SSE to filters
  });

  // Dropdown open states
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [sseDropdownOpen, setSseDropdownOpen] = useState(false);
  const [blockTypeDropdownOpen, setBlockTypeDropdownOpen] = useState(false);

  // Multi-select state
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedSSEs, setSelectedSSEs] = useState<string[]>([]);

  // Date range state
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

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

  // Section options
  const sectionOptions = Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.selectedSection) || []));
  // SSE options
  const sseOptions = Array.from(new Set(data?.data?.requests?.map((r: UserRequest) => r.user?.name) || []));
  // Block type options
  const blockTypeOptions = [
    { label: "All", value: "All" },
    { label: "Corridor (C)", value: "CORRIDOR" },
    { label: "Non-corridor(NC)", value: "NON_CORRIDOR" },
    { label: "Emergency (E)", value: "EMERGENCY" },
    { label: "Mega Block (M)", value: "MEGA_BLOCK" },
  ];

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

  // Status mapping function for table display
  function getDisplayStatus(request: UserRequest) {
    // You may need to adjust these conditions based on your backend fields
    if (request.status === 'APPROVED' && request.isSanctioned) {
      return { label: 'Sanctioned', className: 'bg-green-100 text-green-900 border-green-400' };
    }
    if (request.status === 'PENDING' && request.adminRequestStatus === 'PENDING') {
      return { label: 'Pending with Optg', className: 'bg-yellow-200 text-yellow-900 border-yellow-400' };
    }
    if (request.status === 'REJECTED' && request.adminRequestStatus === 'REJECTED') {
      return { label: 'Returned by Optg', className: 'bg-red-500 text-white border-red-700' };
    }
    if (["NOT_AVAILED", "AVAILED", "CANCELLED"].includes(request.userStatus)) {
      return { label: 'Not-availed/availed/cancelled', className: 'bg-white text-black border-gray-300' };
    }
    if (request.status === 'REJECTED' && request.managerAcceptance === false) {
      return { label: 'Returned to applicant', className: 'bg-sky-200 text-sky-900 border-sky-400' };
    }
    if (request.status === 'PENDING' && request.managerAcceptance === false) {
      return { label: 'Pending with me', className: 'bg-fuchsia-300 text-fuchsia-900 border-fuchsia-400' };
    }
    if (request.status === 'BURST') {
      return { label: 'Burst', className: 'bg-orange-400 text-white border-orange-700 font-bold' };
    }
    // Default fallback
    return { label: request.status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
  }

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

  // Handle block type filter
  const handleBlockTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      blockType: type
    }));
  };

  // Handle section filter
  const handleSectionFilter = (section: string) => {
    setFilters(prev => ({
      ...prev,
      section: section
    }));
  };

  // Handle SSE filter
  const handleSSEFilter = (sse: string) => {
    setFilters(prev => ({
      ...prev,
      sse: sse
    }));
  };

  // Filter requests based on all filters
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const statusMatch = filters.status === "ALL" || request.status === filters.status;
    const departmentMatch = filters.department === "ALL" || request.selectedDepartment === filters.department;
    // OR logic for section
    const sectionMatch = selectedSections.length === 0 || selectedSections.includes(request.selectedSection);
    const workTypeMatch = filters.workType === "ALL" || request.workType === filters.workType;
    const corridorTypeMatch = filters.corridorType === "ALL" || request.corridorType === filters.corridorType;
    const blockTypeMatch = filters.blockType === "All" ||
      (filters.blockType === "CORRIDOR" && request.corridorType === "CORRIDOR") ||
      (filters.blockType === "NON_CORRIDOR" && request.corridorType === "NON_CORRIDOR") ||
      (filters.blockType === "EMERGENCY" && request.corridorType === "EMERGENCY") ||
      (filters.blockType === "MEGA_BLOCK" && request.corridorType === "MEGA_BLOCK");
    // OR logic for SSE
    const sseMatch = selectedSSEs.length === 0 || selectedSSEs.includes(request.user?.name);
    const dateMatch = isUrgentMode
      ? format(parseISO(request.date), "yyyy-MM-dd") === format(currentWeekStart, "yyyy-MM-dd")
      : true;
    return statusMatch && departmentMatch && sectionMatch && workTypeMatch && corridorTypeMatch && blockTypeMatch && sseMatch && dateMatch;
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

  // Handlers for multi-select
  const handleSectionToggle = (section: string) => {
    setSelectedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };
  const handleSSEToggle = (sse: string) => {
    setSelectedSSEs(prev =>
      prev.includes(sse) ? prev.filter(s => s !== sse) : [...prev, sse]
    );
  };
  // Handler for block type radio
  const handleBlockTypeRadio = (type: string) => {
    setFilters(prev => ({ ...prev, blockType: type }));
    setBlockTypeDropdownOpen(false);
  };
  // Handler for date pickers
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  };

  // Update filters when multi-select changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      section: selectedSections.length === 0 ? "ALL" : selectedSections.join(','),
      sse: selectedSSEs.length === 0 ? "ALL" : selectedSSEs.join(',')
    }));
  }, [selectedSections, selectedSSEs]);
  // Update filters when date changes
  useEffect(() => {
    if (customDateRange.start && customDateRange.end) {
      setFilters(prev => ({
        ...prev,
        startDate: customDateRange.start,
        endDate: customDateRange.end
      }));
    }
  }, [customDateRange]);

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
    <div className="min-h-screen bg-[#FFFDF5]">
      {/* Top Yellow Bar */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">RBMS</span>
      </div>

      {/* Main Title on Light Blue */}
      <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
        <span className="text-2xl md:text-3xl font-bold text-black text-center">Departmental Control</span>
      </div>

      {/* Department Name */}
      <div className="w-full bg-[#D6F3FF] py-2 flex flex-col items-center">
        <span className="text-xl font-bold text-black">{session?.user?.department || "..."} Department</span>
      </div>

      {/* View Block Details Button */}
      <div className="w-full flex justify-center mt-4">
        <button className="bg-[#FFF86B] px-8 py-2 rounded-full border-4 border-[#13529e] text-lg font-bold text-[#13529e] shadow-md hover:bg-[#B57CF6] hover:text-white transition-colors">
          View Block Details
        </button>
      </div>

      {/* Pending Requests Section */}
      <div className="mx-4 mt-6">
        <div className="bg-[#FF6B6B] grid grid-cols-3 gap-0 border-2 border-black">
          <div className="p-3 text-black font-bold border-r-2 border-black">REQUESTS PENDING WITH ME</div>
          <div className="p-3 text-black font-bold border-r-2 border-black text-center">Nos. {data?.data?.total || 0}</div>
          <Link href="/manage/pending-requests" className="p-3 text-black font-bold text-center hover:bg-[#FF5555]">
            Click to View
          </Link>
        </div>
      </div>

      {/* Filters Row: All filters in a single row */}
      <div className="mx-4 mt-4 flex flex-wrap gap-2 items-center justify-between bg-[#D6F3FF] p-2 rounded-md border border-black">
        {/* Date Range */}
        <div className="flex items-center gap-1">
          <span className="bg-[#E6E6FA] px-2 py-1 border border-black font-bold text-black rounded-l-md text-xs">Custom view</span>
          <input
            type="date"
            value={customDateRange.start}
            onChange={e => handleDateChange('start', e.target.value)}
            className="p-1 border border-black text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
          <span className="px-1 text-black text-xs">to</span>
          <input
            type="date"
            value={customDateRange.end}
            onChange={e => handleDateChange('end', e.target.value)}
            className="p-1 border border-black text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
        </div>
        {/* Block Type Dropdown (Radio) */}
        <div className="relative inline-block">
          <button
            onClick={() => setBlockTypeDropdownOpen(v => !v)}
            className="bg-[#E6E6FA] px-3 py-1 rounded-full border-2 border-black font-semibold text-black flex items-center gap-2 text-xs"
          >
            {blockTypeOptions.find(opt => opt.value === filters.blockType)?.label || 'Block Type'}
            <span className="ml-1">▼</span>
          </button>
          {blockTypeDropdownOpen && (
            <div className="absolute z-10 mt-2 w-40 bg-white border-2 border-black rounded shadow-lg">
              {blockTypeOptions.map(opt => (
                <label key={opt.value} className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-xs">
                  <input
                    type="radio"
                    name="blockType"
                    checked={filters.blockType === opt.value}
                    onChange={() => handleBlockTypeRadio(opt.value)}
                    className="mr-2 accent-[#B57CF6]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Section Dropdown (Multi-select) */}
        <div className="relative inline-block">
          <button
            onClick={() => setSectionDropdownOpen(v => !v)}
            className="bg-[#B2F3F5] px-3 py-1 rounded-full border-2 border-black font-semibold text-black flex items-center gap-2 text-xs"
          >
            Section: {selectedSections.length === 0 ? 'All' : `${selectedSections.length} selected`}
            <span className="ml-1">▼</span>
          </button>
          {sectionDropdownOpen && (
            <div className="absolute z-10 mt-2 w-40 bg-white border-2 border-black rounded shadow-lg max-h-60 overflow-y-auto">
              {sectionOptions.map(section => (
                <label key={section} className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section)}
                    onChange={() => handleSectionToggle(section)}
                    className="mr-2 accent-[#B57CF6]"
                  />
                  {section}
                </label>
              ))}
            </div>
          )}
        </div>
        {/* SSE Dropdown (Multi-select) */}
        <div className="relative inline-block">
          <button
            onClick={() => setSseDropdownOpen(v => !v)}
            className="bg-[#B2F3F5] px-3 py-1 rounded-full border-2 border-black font-semibold text-black flex items-center gap-2 text-xs"
          >
            SSE: {selectedSSEs.length === 0 ? 'All' : `${selectedSSEs.length} selected`}
            <span className="ml-1">▼</span>
          </button>
          {sseDropdownOpen && (
            <div className="absolute z-10 mt-2 w-40 bg-white border-2 border-black rounded shadow-lg max-h-60 overflow-y-auto">
              {sseOptions.map(sse => (
                <label key={sse} className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSSEs.includes(sse)}
                    onChange={() => handleSSEToggle(sse)}
                    className="mr-2 accent-[#B57CF6]"
                  />
                  {sse}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="mx-2 mt-2 overflow-x-auto">
        <table className="w-full border-2 border-black bg-white text-black text-sm">
          <thead>
            <tr className="bg-[#E8F4F8] text-black">
              <th className="border-2 border-black p-1">Date</th>
              <th className="border-2 border-black p-1">ID</th>
              <th className="border-2 border-black p-1">Block Section</th>
              <th className="border-2 border-black p-1">UP/DN/SL/RO AD NO.</th>
              <th className="border-2 border-black p-1">Duration</th>
              <th className="border-2 border-black p-1">Activity</th>
              <th className="border-2 border-black p-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: UserRequest) => (
              <tr key={request.id} className="bg-white hover:bg-[#F3F3F3]">
                <td className="border border-black p-1 text-center">{formatDate(request.date)}</td>
                <td className="border border-black p-1 text-center">
                  <Link
                    href={`/manage/view-request/${request.id}?from=request-table`}
                    className="text-[#13529e] hover:underline font-semibold"
                  >
                    {request.id}
                  </Link>
                </td>
                <td className="border border-black p-1">{request.selectedSection}</td>
                <td className="border border-black p-1 text-center">{request.processedLineSections?.[0]?.lineName || "N/A"}</td>
                <td className="border border-black p-1 text-center">{formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}</td>
                <td className="border border-black p-1">{request.workType}</td>
                <td className="border border-black p-1 text-center">
                  {(() => {
                    const status = getDisplayStatus(request);
                    return (
                      <span className={`px-2 py-1 text-xs rounded-full border ${status.className}`}>{status.label}</span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Help Text */}
      <div className="mx-4 mt-6 text-center">
        <p className="text-lg font-bold">Click ID to see details of a Block.</p>
        <p className="mt-2 text-lg">For printing the complete table, click to download in .csv format.</p>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 mt-6 mb-8 flex justify-center gap-4">
        <button className="bg-[#FFA07A] px-8 py-2 rounded-lg border-2 border-black font-bold">
          Download
        </button>
        <Link href="/dashboard" className="bg-[#90EE90] px-8 py-2 rounded-lg border-2 border-black font-bold">
          Home
        </Link>
      </div>
    </div>
  );
}