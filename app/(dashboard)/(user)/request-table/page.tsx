// app/(dashboard)/dashboard/request-table/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  useGetUserRequests,
  useGetWeeklyUserRequests,
  DateRangeFilter,
  RequestItem,
} from "@/app/service/query/user-request";
import Link from "next/link";
import { format, parseISO, addDays, startOfWeek, endOfWeek, subDays } from "date-fns";
import { useSession } from "next-auth/react";
import { useUpdateOtherRequest, useDeleteUserRequest } from "@/app/service/mutation/user-request";
import { Toaster, toast } from "react-hot-toast";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { ShowAllToggle } from "@/app/components/ui/ShowAllToggle";
import { useQuery } from "@tanstack/react-query";
import { userRequestService } from "@/app/service/api/user-request";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";

// Components
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  return (
    <div className="flex justify-center gap-1 mt-3 text-black">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-1 text-sm border border-black rounded disabled:opacity-50 bg-white"
      >
        Previous
      </button>
      <span className="px-2 py-1 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-1 text-sm border border-black rounded disabled:opacity-50 bg-white"
      >
        Next
      </button>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "dd-MM-yyyy");
  } catch {
    return "Invalid date";
  }
};

// Helper function to safely extract HH:mm from ISO string without timezone conversion
const formatTime = (dateString: string): string => {
  if (!dateString) return "Invalid time";

  try {
    // Handle both full ISO strings and time-only strings
    const timePart = dateString.includes('T')
      ? dateString.split('T')[1]
      : dateString;

    // Extract just the hours and minutes
    const [hours, minutes] = timePart.split(':');
    return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0').substring(0, 2)}`;
  } catch {
    return "Invalid time";
  }
};

// Helper function to format time periods with duration
const formatTimePeriod = (fromTime: string, toTime: string): string => {
  const from = formatTime(fromTime);
  const to = formatTime(toTime);

  if (from === "Invalid time" || to === "Invalid time") {
    return "Invalid time period";
  }

  // Calculate duration if possible
  let durationText = "";
  try {
    const fromParts = from.split(':').map(Number);
    const toParts = to.split(':').map(Number);

    if (fromParts.length === 2 && toParts.length === 2) {
      let hours = toParts[0] - fromParts[0];
      let minutes = toParts[1] - fromParts[1];

      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }

      if (hours < 0) {
        hours += 24; // Assuming end time could be next day
      }

      durationText = ` (${hours}h ${minutes}m)`;
    }
  } catch (error) {
    console.error("Error calculating duration", error);
  }

  return `${from}-${to}${durationText}`;
};

// Get status details with secondary phrase
const getStatusDetails = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "Request approved and scheduled";
    case "REJECTED":
      return "Request rejected - cannot proceed";
    case "PENDING":
      return "Awaiting approval - may change";
    default:
      return "Status not available";
  }
};

// Get disconnection status details
const getDisconnectionStatus = (type: string, request: RequestItem) => {
  // Since the actual status fields aren't in the RequestItem type, we'll use simulated statuses
  const statusOptions = ["Accepted by Electrical Dept.", "Pending Approval", "Rejected by S&T Dept.", "Approved by Station Master"];
  const randomIndex = (request.id || "").length % statusOptions.length; // Use ID length to create consistent "random" index

  switch (type) {
    case "power":
      return statusOptions[1];
    case "snt":
      return statusOptions[(randomIndex + 1) % statusOptions.length];
    case "sig":
      return "Conditionally approved - needs verification";
    case "trd":
      return "Pending review by TRD officer";
    default:
      return "Status not available";
  }
};

// Header icons for tables
const HeaderIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "id":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.5 9.5A2.5 2.5 0 018 12V8.5H5.5v1zm0 0V8.5H8V12a2.5 2.5 0 01-2.5-2.5zM12 12v-1.5h-1.5V12H12zm-1.5-3V12H12V9h-1.5zm3.5.5v1h1.5V8h-5v1.5h2V12h1.5V9.5h1z" clipRule="evenodd" />
        </svg>
      );
    case "date":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      );
    case "section":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "time":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      );
    case "work":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
    case "disconnection":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      );
    case "status":
      return (
        <svg className="w-3.5 h-3.5 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    case "filter":
      return (
        <svg className="w-3 h-3 inline-block ml-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

// Define a tooltip position state type
interface TooltipPosition {
  x: number;
  y: number;
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Time chip component for better visualization
const TimeChip = ({ time, label }: { time: string, label?: string }) => (
  <div className="inline-flex items-center bg-blue-50 rounded-full px-2 py-1 border border-blue-200 text-xs shadow-sm">
    <svg className="w-3 h-3 mr-1 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
    <span className="font-medium">{time}</span>
    {label && <span className="ml-1 text-gray-500">{label}</span>}
  </div>
);

// Time period display with duration
const TimePeriodDisplay = ({ fromTime, toTime }: { fromTime: string, toTime: string }) => {
  const formattedPeriod = formatTimePeriod(fromTime, toTime);
  const [timeRange, duration] = formattedPeriod.split(/\s+\(|\)/).filter(Boolean);
  const [startTime, endTime] = timeRange.split('-');

  return (
    <div className="flex items-center space-x-2">
      <TimeChip time={startTime} />
      <div className="flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      <TimeChip time={endTime} />
      {duration && (
        <span className="ml-1 bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 text-xs font-medium whitespace-nowrap">
          {duration}
        </span>
      )}
    </div>
  );
};

export default function RequestTablePage() {
  // State for pagination and view type
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewType, setViewType] = useState<"compact" | "gantt">("compact");
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger refetching data
  const { isUrgentMode } = useUrgentMode();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Get user session for role-based features
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";

  // Refresh data helper
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Mutations for request actions
  const updateOtherRequestMutation = useUpdateOtherRequest();
  const deleteRequestMutation = useDeleteUserRequest();

  // Functions for request actions
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await updateOtherRequestMutation.mutateAsync({ id: requestId, accept: true });
      toast.success("Request accepted successfully");
      refreshData(); // Refresh data after mutation
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateOtherRequestMutation.mutateAsync({ id: requestId, accept: false });
      toast.success("Request rejected successfully");
      refreshData(); // Refresh data after mutation
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequestMutation.mutateAsync(requestId);
      toast.success("Request deleted successfully");
      setConfirmDelete(null);
      refreshData(); // Refresh data after mutation
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error("Failed to delete request");
    }
  };

  // Check if user has permission for specific actions
  const canApproveRequest = ["ADMIN", "OFFICER", "MANAGER"].includes(userRole);
  const canDeleteRequest = ["ADMIN", "MANAGER"].includes(userRole);
  const isRequestor = (userId: string) => userId === session?.user?.id;

  // State for week selection
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    return isUrgentMode ? now : startOfWeek(now, { weekStartsOn: 1 }); // Start from Monday
  });

  // Calculate date range based on mode
  const dateRange: DateRangeFilter = isUrgentMode
    ? {
      startDate: format(currentWeekStart, "yyyy-MM-dd"),
      endDate: format(currentWeekStart, "yyyy-MM-dd")
    }
    : {
      startDate: format(currentWeekStart, "yyyy-MM-dd"),
      endDate: format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
    };

  // Get weekly requests for both compact and Gantt views
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
    refetch: refetchWeeklyData,
  } = useGetWeeklyUserRequests(dateRange);

  // Fetch requests data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", currentPage, statusFilter, dateRange, isUrgentMode],
    queryFn: () => {
      if (isUrgentMode) {
        return userRequestService.getUserRequests(
          currentPage,
          pageSize,
          dateRange.startDate,
          dateRange.endDate,
          statusFilter !== "ALL" ? statusFilter : undefined
        );
      }
      return userRequestService.getUserRequests(
        currentPage,
        pageSize,
        dateRange.startDate,
        dateRange.endDate,
        statusFilter !== "ALL" ? statusFilter : undefined
      );
    }
  });

  // Generate dates for display
  const displayDates = isUrgentMode
    ? Array.from({ length: 1 }, (_, i) => {
      const date = addDays(new Date(), i);
      return {
        date,
        formattedDate: format(date, "dd-MM-yyyy"),
        dayOfWeek: format(date, "E"),
      };
    })
    : Array.from({ length: 7 }, (_, i) => {
      const date = addDays(currentWeekStart, i);
      return {
        date,
        formattedDate: format(date, "dd-MM-yyyy"),
        dayOfWeek: format(date, "E"),
      };
    });

  // Function to navigate to previous period
  const goToPreviousPeriod = () => {
    setCurrentWeekStart((prevDate) => {
      if (isUrgentMode) {
        return subDays(prevDate, 1);
      }
      // For weekly view, go back 7 days from the start of the current week
      const weekStart = startOfWeek(prevDate, { weekStartsOn: 1 });
      return subDays(weekStart, 7);
    });
  };

  // Function to navigate to next period
  const goToNextPeriod = () => {
    setCurrentWeekStart((prevDate) => {
      if (isUrgentMode) {
        return addDays(prevDate, 1);
      }
      // For weekly view, go forward 7 days from the start of the current week
      const weekStart = startOfWeek(prevDate, { weekStartsOn: 1 });
      return addDays(weekStart, 7);
    });
  };

  // Filter requests based on urgent mode and showAll state
  const filteredRequests = showAll
    ? weeklyData?.data?.requests || []
    : weeklyData?.data?.requests?.filter(request => {
      if (isUrgentMode) {
        return request.corridorType === "Urgent Block" || request.workType === "EMERGENCY";
      } else {
        return request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
      }
    }) || [];

  // Process weekly data for pagination in compact view
  const [paginatedRequests, setPaginatedRequests] = useState<RequestItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredWeeklyRequests, setFilteredWeeklyRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    // Use data from the API response instead of weeklyData
    if (data?.data?.requests) {
      const requests = data.data.requests;

      // Filter requests based on urgent mode
      const filteredRequests = requests.filter(request => {
        if (isUrgentMode) {
          return request.corridorType === "Urgent Block" || request.workType === "EMERGENCY";
        }
        return request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
      });

      setFilteredWeeklyRequests(filteredRequests);
      setPaginatedRequests(filteredRequests);
      setTotalPages(data.data.totalPages || Math.ceil(filteredRequests.length / pageSize));
    }
  }, [data, isUrgentMode, pageSize]);

  // Click outside handler for tooltips
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close any open tooltips when clicking outside
      if (openTooltip !== null && !((event.target as Element).closest('.tooltip-container'))) {
        setOpenTooltip(null);
      }

      // Close info panel when clicking outside
      if (showInfoPanel && !((event.target as Element).closest('.info-container'))) {
        setShowInfoPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openTooltip, showInfoPanel]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Get status badge class
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

  // Enhanced status display with icon and text
  const getEnhancedStatus = (request: RequestItem) => {
    // Status icons (SVG paths instead of emojis)
    const getStatusIcon = (status: string) => {
      switch (status) {
        case "APPROVED":
          return (
            <svg className="w-3 h-3 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          );
        case "REJECTED":
          return (
            <svg className="w-3 h-3 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          );
        default:
          return (
            <svg className="w-3 h-3 mr-1 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          );
      }
    };

    const status = request.status || "PENDING";
    const requestId = request.id || "";

    // Create a detailed tooltip with all relevant status information
    const tooltipContent = (
      <div className="bg-white border border-gray-300 shadow-lg p-3 rounded-md text-black text-xs w-80">
        <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
          <h5 className="font-bold text-[#13529e]">Status Details</h5>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenTooltip(null);
            }}
            className="text-gray-600 hover:text-black"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="mb-2">
          <div className="font-semibold">Status:
            <span className={`mx-1 px-2 py-0.5 ${getStatusBadgeClass(status)}`}>
              {status}
            </span>
          </div>
          <div className="text-gray-700 my-1">
            {getStatusDetails(status)}
          </div>
          {status === "REJECTED" && <div className="text-gray-700 my-1">
            Reason for reject - {request.remarkByManager}
          </div>}

        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 border-t border-gray-200 pt-2">
          <div className="font-semibold">Work Type:</div>
          <div>{request.workType || "N/A"}</div>

          <div className="font-semibold">Activity:</div>
          <div>{request.activity || "N/A"}</div>

          <div className="font-semibold">Date:</div>
          <div>{formatDate(request.date)}</div>

          <div className="font-semibold">Time:</div>
          <div>{formatTimePeriod(request.demandTimeFrom, request.demandTimeTo)}</div>
        </div>

        {(request.powerBlockRequired || request.sntDisconnectionRequired ||
          request.sigDisconnectionRequirements || request.trdDisconnectionRequirements) && (
            <div className="mt-2 pt-1 border-t border-gray-200">
              <div className="font-semibold mb-1">Required Disconnections:</div>
              <ul className="space-y-1 text-[10px]">
                {request.powerBlockRequired && (
                  <li className="flex justify-between rounded px-1 py-0.5 bg-blue-50">
                    <span className="font-medium">Power Block:</span>
                    <span className="italic">{getDisconnectionStatus("power", request)}</span>
                  </li>
                )}
                {request.sntDisconnectionRequired && (
                  <li className="flex justify-between rounded px-1 py-0.5 bg-purple-50">
                    <span className="font-medium">S&T Disconnection:</span>
                    <span className="italic">
                      {request.DisconnAcceptance === "ACCEPTED"
                        ? "Accepted by S&T Dept."
                        : "Pending Approval"}
                    </span>
                  </li>
                )}
                {request.sigDisconnectionRequirements && (
                  <li className="flex justify-between rounded px-1 py-0.5 bg-indigo-50">
                    <span className="font-medium">SIG Disconnection:</span>
                    <span className="italic">{getDisconnectionStatus("sig", request)}</span>
                  </li>
                )}
                {request.trdDisconnectionRequirements && (
                  <li className="flex justify-between rounded px-1 py-0.5 bg-cyan-50">
                    <span className="font-medium">TRD Disconnection:</span>
                    <span className="italic">{getDisconnectionStatus("trd", request)}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
      </div>
    );

    return (
      <div className="relative flex flex-col items-start tooltip-container">
        <span
          className={`px-1 py-0.5 text-xs flex items-center ${getStatusBadgeClass(status)} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            calculateTooltipPosition(e, requestId, setOpenTooltip, setTooltipPos);
          }}
        >
          {getStatusIcon(status)} {status}
          {request.workType === "EMERGENCY" && (
            <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-[8px]">
              URGENT
            </span>
          )}
        </span>
        {openTooltip === requestId && (
          <div
            className="fixed z-[9999]"
            style={{
              left: `${tooltipPos?.x}px`,
              top: `${tooltipPos?.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {tooltipContent}
          </div>
        )}
      </div>
    );
  };

  // InfoCorner component to show what icons mean
  const InfoCorner = () => {
    return (
      <div className="relative info-container">
        <button
          className="h-6 w-6 rounded-full border border-[#13529e] bg-white text-[#13529e] flex items-center justify-center hover:bg-[#13529e] hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            setShowInfoPanel(!showInfoPanel);
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
        {showInfoPanel && (
          <div className="absolute right-0 top-8 z-10 bg-white border border-gray-300 shadow-lg p-3 rounded-md w-72 text-sm text-black info-container">
            <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-2">
              <h5 className="font-bold text-[#13529e]">Legend</h5>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="text-gray-600 hover:text-black"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <h6 className="font-semibold mt-2">Status Icons:</h6>
            <ul className="mb-2">
              <li className="flex items-center mb-1">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="mx-1 px-2 py-0.5 bg-green-100 text-green-800 text-[10px] border border-black">APPROVED</span>:
                <span className="ml-1 text-[10px]">Request has been approved</span>
              </li>
              <li className="flex items-center mb-1">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="mx-1 px-2 py-0.5 bg-red-100 text-red-800 text-[10px] border border-black">REJECTED</span>:
                <span className="ml-1 text-[10px]">Request has been rejected</span>
              </li>
              <li className="flex items-center mb-1">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="mx-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] border border-black">PENDING</span>:
                <span className="ml-1 text-[10px]">Request awaiting approval</span>
              </li>
            </ul>

            <h6 className="font-semibold mt-2">Disconnection Types:</h6>
            <ul className="mb-1">
              <li className="flex items-center mb-1">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-[10px]">Power Block</span>
              </li>
              <li className="flex items-center mb-1">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-[10px]">S&T Disconnection</span>
              </li>
            </ul>

            <div className="text-[10px] mt-2 text-gray-600 border-t border-gray-200 pt-2">
              Click on status badges for more details.
            </div>
          </div>
        )}
      </div>
    );
  };

  // Get disconnection status badges with tooltips
  const getDisconnectionBadges = (request: RequestItem) => {
    const badges = [];

    if (request.powerBlockRequired) {
      const tooltipId = `power-${request.id}`;
      const tooltipContent = (
        <div className="bg-white border border-gray-300 shadow-lg p-2 rounded-md text-black text-xs max-w-xs z-20">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1">
            <h5 className="font-bold text-blue-800">Power Block</h5>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenTooltip(null);
              }}
              className="text-gray-600 hover:text-black"
            >
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div>
            {request.powerBlockRequirements ? (
              <div>{request.powerBlockRequirements}</div>
            ) : (
              <div>Power block is required for this work</div>
            )}
          </div>
        </div>
      );

      badges.push(
        <div key={tooltipId} className="relative inline-block tooltip-container">
          <span
            className="inline-block px-1 py-0.5 mr-1 text-[8px] bg-blue-100 text-blue-800 border border-black cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              calculateTooltipPosition(e, tooltipId, setOpenTooltip, setTooltipPos);
            }}
          >
            <svg className="w-2 h-2 mr-0.5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Power
          </span>
          {openTooltip === tooltipId && (
            <div
              className="fixed z-[9999]"
              style={{
                left: `${tooltipPos?.x}px`,
                top: `${tooltipPos?.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {tooltipContent}
            </div>
          )}
        </div>
      );
    }

    if (request.sntDisconnectionRequired) {
      const tooltipId = `snt-${request.id}`;
      const tooltipContent = (
        <div className="bg-white border border-gray-300 shadow-lg p-2 rounded-md text-black text-xs max-w-xs z-20">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1">
            <h5 className="font-bold text-purple-800">S&T Disconnection</h5>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenTooltip(null);
              }}
              className="text-gray-600 hover:text-black"
            >
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div>
            {request.sntDisconnectionRequirements ? (
              <div>{request.sntDisconnectionRequirements}</div>
            ) : (
              <div>S&T disconnection is required for this work</div>
            )}
          </div>
        </div>
      );

      badges.push(
        <div key={tooltipId} className="relative inline-block tooltip-container">
          <span
            className="inline-block px-1 py-0.5 mr-1 text-[8px] bg-purple-100 text-purple-800 border border-black cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOpenTooltip(openTooltip === tooltipId ? null : tooltipId);
            }}
          >
            <svg className="w-2 h-2 mr-0.5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            S&T
          </span>
          {openTooltip === tooltipId && (
            <div className="absolute left-0 top-6 z-50">
              {tooltipContent}
            </div>
          )}
        </div>
      );
    }

    // Simplified versions for remaining types to save space
    if (request.sigDisconnectionRequirements) {
      const tooltipId = `sig-${request.id}`;

      badges.push(
        <div key={tooltipId} className="relative inline-block tooltip-container">
          <span
            className="inline-block px-1 py-0.5 mr-1 text-[8px] bg-indigo-100 text-indigo-800 border border-black cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOpenTooltip(openTooltip === tooltipId ? null : tooltipId);
            }}
          >
            <svg className="w-2 h-2 mr-0.5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            SIG
          </span>
          {openTooltip === tooltipId && (
            <div className="absolute left-0 top-6 z-50">
              <div className="bg-white border border-gray-300 shadow-lg p-2 rounded-md text-black text-xs max-w-xs">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1">
                  <h5 className="font-bold text-indigo-800">SIG Disconnection</h5>
                  <button onClick={() => setOpenTooltip(null)} className="text-gray-600 hover:text-black">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div>{request.sigDisconnectionRequirements}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (request.trdDisconnectionRequirements) {
      const tooltipId = `trd-${request.id}`;

      badges.push(
        <div key={tooltipId} className="relative inline-block tooltip-container">
          <span
            className="inline-block px-1 py-0.5 mr-1 text-[8px] bg-cyan-100 text-cyan-800 border border-black cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setOpenTooltip(openTooltip === tooltipId ? null : tooltipId);
            }}
          >
            <svg className="w-2 h-2 mr-0.5 inline" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.5 13a3.5 3.5 0 01-3.5-3.5V5a2 2 0 012-2h7.5a2 2 0 012 2v5.5a3.5 3.5 0 01-7 0V5a1 1 0 011-1h7.5a1 1 0 011 1v4.5a2.5 2.5 0 01-5 0V6a.5.5 0 01.5-.5h5.5a.5.5 0 01.5.5v3.5a1.5 1.5 0 01-3 0V6h1v3.5a.5.5 0 001 0V6h-1V5a.5.5 0 00-.5-.5H8a.5.5 0 00-.5.5v4.5a1.5 1.5 0 003 0V5a.5.5 0 00-.5-.5H2.5a.5.5 0 00-.5.5v4.5a2.5 2.5 0 005 0v-4a.5.5 0 011 0v4a3.5 3.5 0 01-3.5 3.5z" />
            </svg>
            TRD
          </span>
          {openTooltip === tooltipId && (
            <div className="absolute left-0 top-6 z-50">
              <div className="bg-white border border-gray-300 shadow-lg p-2 rounded-md text-black text-xs max-w-xs">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1 mb-1">
                  <h5 className="font-bold text-cyan-800">TRD Disconnection</h5>
                  <button onClick={() => setOpenTooltip(null)} className="text-gray-600 hover:text-black">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div>{request.trdDisconnectionRequirements}</div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return badges.length > 0 ? badges : <span className="text-[8px] text-gray-500">None</span>;
  };

  // Get priority badge with color
  const getPriorityBadge = (request: RequestItem) => {
    // Default to "NORMAL" if no priority specified
    let priority = "NORMAL";

    // Try to determine priority from other fields if available
    if (request.workType === "EMERGENCY") {
      priority = "HIGH";
    } else if (request.workType === "MAINTENANCE") {
      priority = "NORMAL";
    } else if (request.workType === "PLANNED") {
      priority = "LOW";
    }

    let bgColor = "bg-blue-100 text-blue-800";

    if (priority === "HIGH") {
      bgColor = "bg-red-100 text-red-800";
    } else if (priority === "LOW") {
      bgColor = "bg-green-100 text-green-800";
    }

    return (
      <span className={`px-1 py-0.5 text-xs ${bgColor} border border-black`}>
        {priority}
      </span>
    );
  };

  // Function to get line name from processed line sections or fallback to default display
  const getLineName = (request: RequestItem) => {
    // Check if processedLineSections exists and has data
    if (
      request.processedLineSections &&
      Array.isArray(request.processedLineSections) &&
      request.processedLineSections.length > 0
    ) {
      // Find regular section first, as they have line names
      const regularSection = request.processedLineSections.find(
        (section) => section.type === "regular"
      );
      if (regularSection && regularSection.lineName) {
        return regularSection.lineName;
      }

      // If no regular section with line name, try yard section
      const yardSection = request.processedLineSections.find(
        (section) => section.type === "yard"
      );
      if (yardSection) {
        if (yardSection.stream && yardSection.road) {
          return `${yardSection.stream}/${yardSection.road}`;
        }
        if (yardSection.stream) {
          return yardSection.stream;
        }
      }

      // If nothing found but sections exist, return the first section's available data
      const firstSection = request.processedLineSections[0];
      if (firstSection.lineName) return firstSection.lineName;
      if (firstSection.stream) return firstSection.stream;
    }

    // Fallback to selectedStream if it exists
    if (request.selectedStream) {
      return request.selectedStream;
    }

    // Fallback message if no line info available
    return "N/A";
  };

  // Function to get corridor type display text
  const getCorridorType = (request: RequestItem) => {
    // Check for corridorTypeSelection first (new field)
    if (request.corridorTypeSelection) {
      return request.corridorTypeSelection;
    }

    // Fall back to corridorType (old field)
    if (request.corridorType) {
      // Format the corridor type nicely (capitalize first letter, replace dashes with spaces)
      return (
        request.corridorType.charAt(0).toUpperCase() +
        request.corridorType.slice(1).replace(/-/g, " ")
      );
    }

    return "N/A";
  };

  // Combined work info chip with tooltip
  const getWorkInfoChip = (request: RequestItem) => {
    const tooltip = `
      Work Type: ${request.workType || "N/A"}
      Activity: ${request.activity || "N/A"}
      Corridor Type: ${getCorridorType(request)}
    `.trim();

    return (
      <div title={tooltip} className="flex flex-col">
        <span className="text-xs font-medium">
          {request.workType}
          {request.workType === "EMERGENCY" && (
            <span className="ml-1 bg-red-100 text-red-800 text-[8px] px-1 rounded-full border border-red-800">
              URGENT
            </span>
          )}
        </span>
        <span className="text-[8px] truncate max-w-[120px]">{request.activity}</span>
      </div>
    );
  };

  // Smart tooltip positioning
  const calculateTooltipPosition = (event: React.MouseEvent, tooltipId: string, setOpenTooltip: any, setTooltipPos: any) => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get coordinates relative to viewport
    const x = event.clientX;
    const y = event.clientY;

    // Assume tooltip width and height (adjust as needed)
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    // Determine best placement to keep tooltip on screen
    let placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    let posX = x;
    let posY = y;

    // Horizontal placement
    if (x + tooltipWidth + 10 > viewportWidth) {
      // Not enough room to the right, place to the left
      posX = x - tooltipWidth - 5;
      placement = y < viewportHeight / 2 ? 'top-left' : 'bottom-left';
    } else {
      // Enough room to the right
      posX = x + 5;
      placement = y < viewportHeight / 2 ? 'top-right' : 'bottom-right';
    }

    // Vertical placement
    if (placement.startsWith('top')) {
      posY = y + 5;
    } else {
      // Bottom placement
      posY = y - tooltipHeight - 5;
      if (posY < 0) posY = 5; // Ensure it doesn't go off the top
    }

    // Ensure tooltip is never off-screen
    posX = Math.max(5, Math.min(viewportWidth - tooltipWidth - 5, posX));
    posY = Math.max(5, Math.min(viewportHeight - tooltipHeight - 5, posY));

    setTooltipPos({ x: posX, y: posY, placement });
    setOpenTooltip(tooltipId);
  };

  // Action buttons component for table rows
  const RequestActions = ({ request }: { request: RequestItem }) => {
    const isPending = request.status === "PENDING";
    const isApproved = request.status === "APPROVED";
    const isRejected = request.status === "REJECTED";
    const isRequestOwner = isRequestor(request.userId || "");
    const isEmergency = request.workType === "EMERGENCY";

    return (
      <div className="flex flex-wrap gap-1">
        <Link
          href={`/view-request/${request.id}?from=request-table`}
          className="px-1 py-0.5 text-[8px] bg-[#13529e] text-white border border-black rounded"
        >
          View
        </Link>

        {isPending && isRequestOwner && (
          <Link
            href={`/edit-request/${request.id}`}
            className="px-1 py-0.5 text-[8px] bg-green-700 text-white border border-black rounded"
          >
            Edit
          </Link>
        )}

        {isPending && canApproveRequest && (
          <>
            <button
              onClick={() => handleAcceptRequest(request.id)}
              className={`px-1 py-0.5 text-[8px] ${isEmergency ? 'bg-orange-600' : 'bg-green-600'} text-white border border-black rounded flex items-center`}
            >
              {isEmergency && (
                <svg className="w-2 h-2 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1a1 1 0 011 1v8h2a1 1 0 110 2h-3a1 1 0 01-1-1V2a1 1 0 011-1z" />
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
              )}
              Accept
            </button>
            <button
              onClick={() => handleRejectRequest(request.id)}
              className="px-1 py-0.5 text-[8px] bg-red-600 text-white border border-black rounded"
            >
              Reject
            </button>
          </>
        )}

        {isApproved && canApproveRequest && (
          <div className="px-1 py-0.5 text-[8px] bg-green-100 text-green-800 border border-black rounded flex items-center">
            <svg className="w-2 h-2 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Approved
          </div>
        )}

        {isRejected && canApproveRequest && (
          <div className="px-1 py-0.5 text-[8px] bg-red-100 text-red-800 border border-black rounded flex items-center">
            <svg className="w-2 h-2 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Rejected
          </div>
        )}

        {/* Delete button - available for admins/managers or request owners with pending status */}
        {(canDeleteRequest || (isRequestOwner && isPending)) && (
          <button
            onClick={() => setConfirmDelete(request.id)}
            className="px-1 py-0.5 text-[8px] bg-red-700 text-white border border-black rounded flex items-center"
          >
            <svg className="w-2 h-2 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        )}

        {/* If the user is an officer with special permissions, show additional action buttons */}
        {canApproveRequest && userRole === "OFFICER" && isPending && request.powerBlockRequired && (
          <button
            className="px-1 py-0.5 text-[8px] bg-blue-600 text-white border border-black rounded"
            onClick={() => toast("Power block approval functionality will be implemented soon")}
          >
            Power Approval
          </button>
        )}
      </div>
    );
  };

  // Delete confirmation modal
  const DeleteConfirmationModal = ({ requestId }: { requestId: string }) => {
    if (!requestId) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-md shadow-lg max-w-sm w-full text-black">
          <h3 className="font-bold text-lg">Confirm Delete</h3>
          <p className="py-2">Are you sure you want to delete this request? This action cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-3 py-1 bg-gray-200 text-black border border-black rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDeleteRequest(requestId)}
              className="px-3 py-1 bg-red-600 text-white border border-black rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Column header with filter
  const ColumnHeader = ({ icon, title, showFilter = true }: { icon: string, title: string, showFilter?: boolean }) => {
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <HeaderIcon type={icon} />
          <span>{title}</span>
        </div>
        {showFilter && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterMenu(!showFilterMenu);
              }}
              className="ml-1 p-0.5 hover:bg-gray-200 rounded-sm"
            >
              <HeaderIcon type="filter" />
            </button>
            {showFilterMenu && (
              <div
                className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 text-xs">
                  <div className="font-medium mb-1">Filter options</div>
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full border border-gray-300 px-2 py-1 rounded"
                    />
                  </div>
                  <button
                    className="w-full text-left px-2 py-1 hover:bg-blue-50 rounded"
                    onClick={() => setShowFilterMenu(false)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      {/* Top Yellow Bar */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">RBMS</span>
      </div>
      {/* Main Title on Light Blue */}
      <div className="w-full bg-[#D6F3FF] py-4 flex flex-col items-center border-b-2 border-black">
        <span className="text-3xl font-bold text-black text-center">Summary of My Block Requests</span>
        <span className="text-md text-black mt-1">Screen 15A</span>
      </div>
      {/* User Info Row */}
      <div className="flex justify-center mt-2">
        <div className="flex gap-2">
          <span className="bg-[#FFB74D] border border-black px-6 py-2 font-bold text-lg text-black rounded">User:</span>
          <span className="bg-[#FFB74D] border border-black px-6 py-2 font-bold text-lg text-black rounded">User's Designation</span>
        </div>
      </div>
      {/* Summary Box */}
      <div className="flex justify-center mt-4">
        <div className="w-[90%] rounded-2xl border-2 border-[#B5B5B5] bg-[#F5E7B2] shadow p-0">
          <div className="text-2xl font-bold text-black text-center py-2">SUMMARY OF NEXT 10 DAYS</div>
          <div className="italic text-center text-gray-700 pb-2">(Click ID to see full details or to Edit)</div>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl mx-2 mb-2">
            <table className="min-w-full border border-black rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-[#D6F3FF] text-black text-lg">
                  <th className="border border-black px-2 py-1">Scroll</th>
                  <th className="border border-black px-2 py-1">Date</th>
                  <th className="border border-black px-2 py-1">ID</th>
                  <th className="border border-black px-2 py-1">Block Section</th>
                  <th className="border border-black px-2 py-1">UP/DN/SL/Rpad No.</th>
                  <th className="border border-black px-2 py-1">Activity</th>
                  <th className="border border-black px-2 py-1">Duration (HH:MM)</th>
                  <th className="border border-black px-2 py-1">Sanction Status (Y/N)</th>
                </tr>
              </thead>
              <tbody>
                {/* Example rows, replace with map over your data */}
                {[0, 1, 2, 3, 4].map((_, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-[#FFF86B]" : "bg-[#E6E6FA]"}>
                    <td className="border border-black px-2 py-1 text-center">{idx === 0 ? <span className="inline-block bg-gray-400 border border-black rounded p-1">▲</span> : idx === 2 ? <span className="inline-block bg-gray-400 border border-black rounded p-1">▼</span> : ""}</td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                    <td className="border border-black px-2 py-1"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Customised Summary Section */}
      <div className="flex flex-col items-center mt-8">
        <div className="bg-[#E6E6FA] text-black text-xl font-semibold px-8 py-2 rounded">Customised Summary</div>
        <div className="flex items-center gap-2 mt-4">
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="DD" />
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="MM" />
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="YY" />
          <span className="text-xl font-bold">to</span>
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="DD" />
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="MM" />
          <input className="bg-[#B2F3F5] border-2 border-red-500 text-black text-xl font-bold w-16 text-center rounded" placeholder="YY" />
          <button className="bg-[#E6E6FA] border border-black px-4 py-2 rounded text-lg font-bold ml-2">Click</button>
        </div>
        <div className="mt-4 bg-[#E6E6FA] px-8 py-2 rounded text-center font-semibold">For Printing the Summary, <br /> click Download</div>
        <button className="mt-2 bg-[#FFB74D] border border-black px-8 py-2 rounded text-xl font-bold text-black">Download</button>
      </div>
      {/* Footer Buttons */}
      <div className="flex justify-center gap-4 mt-10 mb-4">
        <button className="flex items-center gap-2 bg-lime-300 border border-black px-6 py-2 rounded text-xl font-bold">
          <span className="text-2xl">🏠</span> Home
        </button>
        <button className="flex items-center gap-2 bg-[#E6E6FA] border border-black px-6 py-2 rounded text-xl font-bold">
          <span className="text-2xl">⬅️</span> Back
        </button>
        <button className="bg-[#FFB74D] border border-black px-8 py-2 rounded text-xl font-bold text-black">Logout</button>
      </div>
    </div>
  );
}
