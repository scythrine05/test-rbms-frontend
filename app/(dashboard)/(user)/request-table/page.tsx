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
import { format, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";
import { useSession } from "next-auth/react";
import { useUpdateOtherRequest, useDeleteUserRequest } from "@/app/service/mutation/user-request";
import { Toaster, toast } from "react-hot-toast";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { ShowAllToggle } from "@/app/components/ui/ShowAllToggle";

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
    return startOfWeek(now, { weekStartsOn: 1 }); // Start from Monday
  });

  // Calculate date range based on mode
  const dateRange: DateRangeFilter = isUrgentMode 
    ? {
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 1), "yyyy-MM-dd")
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
    if (isUrgentMode) {
      // In urgent mode, we don't allow going back as it's always current day
      return;
    }
    setCurrentWeekStart((prevDate) => addDays(prevDate, -7));
  };

  // Function to navigate to next period
  const goToNextPeriod = () => {
    if (isUrgentMode) {
      // In urgent mode, we don't allow going forward as it's always current day
      return;
    }
    setCurrentWeekStart((prevDate) => addDays(prevDate, 7));
  };

  // Filter requests based on urgent mode and showAll state
  const filteredRequests = showAll 
    ? weeklyData?.data?.requests || []
    : weeklyData?.data?.requests?.filter(request => {
        if (isUrgentMode) {
          return (request.corridorType === "Urgent Block" || request.workType === "EMERGENCY") &&
                 format(parseISO(request.date), "yyyy-MM-dd") === format(addDays(new Date(), 1), "yyyy-MM-dd");
        } else {
          return request.corridorType !== "Urgent Block" && request.workType !== "EMERGENCY";
        }
      }) || [];

  // Process weekly data for pagination in compact view
  const [paginatedRequests, setPaginatedRequests] = useState<RequestItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredWeeklyRequests, setFilteredWeeklyRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    if (weeklyData?.data?.requests) {
      // Filter requests to only include those within the current week
      const filteredRequests = weeklyData.data.requests.filter(request => {
        try {
          const requestDate = parseISO(request.date);
          const startDate = parseISO(dateRange.startDate);
          const endDate = parseISO(dateRange.endDate);

          // Check if request date falls within current week range
          return requestDate >= startDate && requestDate <= endDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      });

      setFilteredWeeklyRequests(filteredRequests);

      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      setPaginatedRequests(filteredRequests.slice(start, end));
      setTotalPages(Math.ceil(filteredRequests.length / pageSize));
    }
  }, [weeklyData, currentPage, pageSize, dateRange.startDate, dateRange.endDate]);

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
          {status==="REJECTED"&&<div className="text-gray-700 my-1">
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
          href={`/view-request/${request.id}`}
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
    <>
      <Toaster position="top-center" />
      <div className="bg-white p-3 border border-black mb-3">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-[#13529e]">
            {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
          </h1>
          <ShowAllToggle 
            showAll={showAll} 
            onToggle={() => setShowAll(!showAll)} 
            isUrgentMode={isUrgentMode}
          />
        </div>

        {/* View toggle - only show in normal mode */}
        {!isUrgentMode && (
          <div className="flex justify-between items-center mb-3 border-b border-black pb-3">
            <div className="space-x-1">
              <button
                onClick={() => setViewType("compact")}
                className={`px-3 py-1 text-sm border border-black ${viewType === "compact"
                  ? "bg-[#13529e] text-white"
                  : "bg-white text-[#13529e]"
                  }`}
              >
                Compact View
              </button>
              <button
                onClick={() => setViewType("gantt")}
                className={`px-3 py-1 text-sm border border-black ${viewType === "gantt"
                  ? "bg-[#13529e] text-white"
                  : "bg-white text-[#13529e]"
                  }`}
              >
                Gantt View
              </button>
            </div>
            <div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="p-1 text-sm border border-black bg-white text-black"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        )}

        {/* Period selector */}
        <div className="flex justify-between items-center mb-3 text-sm border-b border-black pb-2">
          {!isUrgentMode && (
            <button
              onClick={goToPreviousPeriod}
              className="px-2 py-1 bg-white text-[#13529e] border border-black text-sm"
            >
              &lt; Prev Week
            </button>
          )}
          <div className="font-medium text-black bg-gray-100 px-3 py-1 border border-black">
            {isUrgentMode 
              ? "Next Day: " + format(addDays(new Date(), 1), "dd-MM-yyyy")
              : `Current Week: ${format(parseISO(dateRange.startDate), "dd-MM-yyyy")} to ${format(parseISO(dateRange.endDate), "dd-MM-yyyy")}`
            }
          </div>
          {!isUrgentMode && (
            <button
              onClick={goToNextPeriod}
              className="px-2 py-1 bg-white text-[#13529e] border border-black text-sm"
            >
              Next Week &gt;
            </button>
          )}
        </div>

        {viewType === "compact" ? (
          /* Compact Table View */
          <div className="overflow-x-auto">
            {isWeeklyLoading ? (
              <div className="text-center py-3 text-sm text-black">
                Loading requests...
              </div>
            ) : weeklyError ? (
              <div className="text-center py-3 text-sm text-red-600">
                Error loading requests. Please try again.
              </div>
            ) : paginatedRequests.length === 0 ? (
              <div className="text-center py-3 text-sm text-gray-600">
                No requests found. Create a new block request to get started.
                <div className="mt-2">
                  <Link
                    href="/create-block-request"
                    className="px-3 py-1 text-sm bg-[#13529e] text-white border border-black"
                  >
                    Create New Block Request
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <table className="min-w-full border-collapse border border-black text-sm text-black">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="id" title="Request ID" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="date" title="Date" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="section" title="Major Section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="section" title="Depot" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="section" title="Block Section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="section" title="Line" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="time" title="Time" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="section" title="Corridor Type" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="work" title="Work Details" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="disconnection" title="Disconnections" showFilter={false} />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        <ColumnHeader icon="status" title="Status" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr
                        key={`compact-${request.id}-${request.date}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="border border-black p-1">
                          {request.id.substring(0, 8)}
                        </td>
                        <td className="border border-black p-1">
                          {formatDate(request.date)}
                        </td>
                        <td className="border border-black p-1">
                          {request.selectedSection}
                        </td>
                        <td className="border border-black p-1">
                          {request.selectedDepo}
                        </td>
                        <td className="border border-black p-1">
                          {request.missionBlock}
                        </td>
                        <td className="border border-black p-1">
                          {getLineName(request)}
                        </td>
                        <td className="border border-black p-1">
                          {formatTimePeriod(
                            request.demandTimeFrom,
                            request.demandTimeTo
                          )}
                        </td>
                        <td className="border border-black p-1">
                          {getCorridorType(request)}
                        </td>
                        <td className="border border-black p-1">
                          {getWorkInfoChip(request)}
                        </td>
                        <td className="border border-black p-1 text-[8px]">
                          {getDisconnectionBadges(request)}
                        </td>
                        <td className="border border-black p-1">
                          {getEnhancedStatus(request)}
                        </td>
                        <td className="border border-black p-1 whitespace-nowrap">
                          <RequestActions request={request} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        ) : (
          /* Gantt View */
          <div className="mb-3 text-black">
            <div className="overflow-x-auto">
              <div className="w-full">
                {/* Week days header */}
                <div className="flex border-b border-black text-xs">
                  <div className="w-[20%] min-w-32 flex-shrink-0 p-1 font-medium bg-gray-100 border-r border-black">
                    Block Section
                  </div>
                  {displayDates.map((dateInfo) => (
                    <div
                      key={`date-${dateInfo.formattedDate}`}
                      className="flex-1 min-w-14 p-1 text-center border-r border-black bg-gray-100"
                    >
                      <div>{dateInfo.dayOfWeek}</div>
                      <div>{format(dateInfo.date, "dd-MM")}</div>
                    </div>
                  ))}
                </div>

                {isWeeklyLoading ? (
                  <div className="text-center py-3 text-sm">
                    Loading weekly data...
                  </div>
                ) : weeklyError ? (
                  <div className="text-center py-3 text-sm text-red-600">
                    Error loading weekly data. Please try again.
                  </div>
                ) : !filteredWeeklyRequests || filteredWeeklyRequests.length === 0 ? (
                  <div className="text-center py-3 text-sm text-gray-600">
                    No requests found for this week.
                    <div className="mt-2">
                      <Link
                        href="/create-block-request"
                        className="px-3 py-1 text-sm bg-[#13529e] text-white border border-black"
                      >
                        Create New Block Request
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Group by block section for Gantt view */
                  Object.entries(
                    filteredWeeklyRequests.reduce((acc, request) => {
                      const blockSections = request.missionBlock.split(",");
                      blockSections.forEach((section) => {
                        if (!acc[section]) acc[section] = [];
                        acc[section].push(request);
                      });
                      return acc;
                    }, {} as Record<string, RequestItem[]>) || {}
                  ).map(([blockSection, requests]) => (
                    <div
                      key={`gantt-section-${blockSection}`}
                      className="flex border-b border-black"
                    >
                      <div className="w-[20%] min-w-32 flex-shrink-0 p-1 font-medium text-xs border-r border-black">
                        {blockSection}
                      </div>

                      {displayDates.map((dateInfo) => {
                        const dateStr = format(dateInfo.date, "yyyy-MM-dd");
                        const requestsForDay = requests.filter((request) => {
                          // Compare dates using yyyy-MM-dd format for consistency
                          const requestDateStr = format(parseISO(request.date), "yyyy-MM-dd");
                          const cellDateStr = format(dateInfo.date, "yyyy-MM-dd");
                          return requestDateStr === cellDateStr;
                        });

                        return (
                          <div
                            key={`gantt-cell-${blockSection}-${dateInfo.formattedDate}`}
                            className="flex-1 min-w-14 p-0.5 border-r border-black relative min-h-8"
                          >
                            {requestsForDay.map((request) => (
                              <Link
                                key={`gantt-request-${request.id}-${dateInfo.formattedDate}`}
                                href={`/view-request/${request.id}`}
                                className={`block text-[8px] p-0.5 mb-0.5 border border-black overflow-hidden text-white
                                  ${request.status === "APPROVED"
                                    ? "bg-green-700"
                                    : request.status === "REJECTED"
                                      ? "bg-red-700"
                                      : request.workType === "EMERGENCY"
                                        ? "bg-orange-700"
                                        : "bg-[#13529e]"
                                  }`}
                                title={`${request.workType}: ${request.activity
                                  } - ${formatTime(
                                    request.demandTimeFrom
                                  )} to ${formatTime(request.demandTimeTo)} 
${getCorridorType(request)} - ${request.selectedDepo}
${request.missionBlock} - ${getLineName(request)}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span>{formatTimePeriod(
                                    request.demandTimeFrom,
                                    request.demandTimeTo
                                  )}</span>
                                  {request.status === "APPROVED" && (
                                    <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {request.status === "REJECTED" && (
                                    <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed view table for gantt view */}
        {viewType === "gantt" &&
          filteredWeeklyRequests &&
          filteredWeeklyRequests.length > 0 && (
            <div className="mt-3 border-t border-black pt-3">
              <h2 className="text-md font-bold text-[#13529e] mb-2">
                Detailed Weekly Requests
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-black text-xs text-black">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-black p-1 text-left font-medium">
                        ID <HeaderIcon type="id" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Date <HeaderIcon type="date" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Section <HeaderIcon type="section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Depot <HeaderIcon type="section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Block Section <HeaderIcon type="section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Line <HeaderIcon type="section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Time <HeaderIcon type="time" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Corridor <HeaderIcon type="section" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Work Details <HeaderIcon type="work" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Disconnections <HeaderIcon type="disconnection" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Status <HeaderIcon type="status" />
                      </th>
                      <th className="border border-black p-1 text-left font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWeeklyRequests.map((request) => (
                      <tr
                        key={`detailed-${request.id}-${request.date}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="border border-black p-1">
                          {request.id.substring(0, 8)}
                        </td>
                        <td className="border border-black p-1">
                          {formatDate(request.date)}
                        </td>
                        <td className="border border-black p-1">
                          {request.selectedSection}
                        </td>
                        <td className="border border-black p-1">
                          {request.selectedDepo}
                        </td>
                        <td className="border border-black p-1">
                          {request.missionBlock}
                        </td>
                        <td className="border border-black p-1">
                          {getLineName(request)}
                        </td>
                        <td className="border border-black p-1">
                          {formatTimePeriod(
                            request.demandTimeFrom,
                            request.demandTimeTo
                          )}
                        </td>
                        <td className="border border-black p-1">
                          {getCorridorType(request)}
                        </td>
                        <td className="border border-black p-1">
                          {getWorkInfoChip(request)}
                        </td>
                        <td className="border border-black p-1 text-[8px]">
                          {getDisconnectionBadges(request)}
                        </td>
                        <td className="border border-black p-1">
                          {getEnhancedStatus(request)}
                        </td>
                        <td className="border border-black p-1 whitespace-nowrap">
                          <RequestActions request={request} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Delete confirmation modal */}
        {confirmDelete && <DeleteConfirmationModal requestId={confirmDelete} />}

        <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1">
          © {new Date().getFullYear()} Indian Railways. All Rights Reserved.
        </div>
      </div>
    </>
  );
}
