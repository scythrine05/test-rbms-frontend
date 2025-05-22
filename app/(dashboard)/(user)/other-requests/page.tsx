// app/(dashboard)/dashboard/other-requests/page.tsx
"use client";
import { useState } from "react";
import { useGetOtherRequests } from "@/app/service/query/user-request";
import { useUpdateOtherRequest } from "@/app/service/mutation/user-request";
import Link from "next/link";
import { format, parseISO, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import { useUrgentMode } from "@/app/context/UrgentModeContext";
import { RequestItem } from "@/app/service/query/user-request";

// Define TooltipPosition interface
interface TooltipPosition {
  x: number;
  y: number;
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "dd-MM-yyyy");
  } catch {
    return "Invalid date";
  }
};

// Helper function to format times
const formatTime = (dateString: string) => {
  try {
    return format(parseISO(dateString), "HH:mm");
  } catch {
    return "Invalid time";
  }
};

// Helper function to format time periods
const formatTimePeriod = (fromTime: string, toTime: string) => {
  try {
    const from = formatTime(fromTime);
    const to = formatTime(toTime);
    return `${from}-${to}`;
  } catch {
    return "Invalid time period";
  }
};

// Pagination component
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

export default function OtherRequestsPage() {
  const { isUrgentMode } = useUrgentMode();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "USER";

  // State for pagination and view type
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewType, setViewType] = useState<"compact" | "gantt">("compact");
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // State for rejection dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");

  // State for week selection
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return isUrgentMode ? today : startOfWeek(today, { weekStartsOn: 1 }); // Start from Monday
  });

  // Get the depot from session data
  const selectedDepo = session?.user?.depot || "";

  // Calculate week range
  const weekEnd = isUrgentMode 
    ? currentWeekStart 
    : endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStart = isUrgentMode 
    ? currentWeekStart 
    : startOfWeek(currentWeekStart, { weekStartsOn: 1 });

  // Get other requests data
  const {
    data: otherRequestsData,
    isLoading,
    error,
    refetch
  } = useGetOtherRequests(
    selectedDepo, 
    currentPage, 
    pageSize,
    format(weekStart, "yyyy-MM-dd"),
    format(weekEnd, "yyyy-MM-dd")
  );

  // Update other request mutation
  const { mutate: updateOtherRequest, isPending: isMutating } = useUpdateOtherRequest();

  // Handle week change
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "prev" 
        ? subDays(prev, isUrgentMode ? 1 : 7) 
        : addDays(prev, isUrgentMode ? 1 : 7)
    );
    setCurrentPage(1); // Reset to first page when changing weeks
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "ACCEPTED":
        return "bg-green-100 text-green-800 border border-black";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-black";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800 border border-black";
    }
  };

  // Handle status update with refetch
  const handleStatusUpdate = (id: string, accept: boolean) => {
    if (accept) {
      updateOtherRequest(
        {
          id,
          accept,
        },
        {
          onSuccess: () => {
            // Refetch the data after the mutation succeeds
            refetch();
          },
        }
      );
    } else {
      // If rejecting, show the dialog to enter remarks
      setSelectedRequestId(id);
      setShowRejectDialog(true);
    }
  };

  // Handle confirmation of rejection with remarks
  const handleConfirmReject = () => {
    if (!rejectRemarks.trim()) {
      alert("Please provide rejection remarks");
      return;
    }

    updateOtherRequest(
      {
        id: selectedRequestId,
        accept: false,
        disconnectionRequestRejectRemarks: rejectRemarks,
      },
      {
        onSuccess: () => {
          // Reset the form and refetch data after successful rejection
          setShowRejectDialog(false);
          setRejectRemarks("");
          setSelectedRequestId("");
          refetch();
        },
      }
    );
  };

  if (isLoading) {
    return <Loader name="other requests" />;
  }

  if (error) {
    return (
      <div className="text-center py-3 text-sm text-red-600">
        Error loading requests. Please try again.
      </div>
    );
  }

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Other Requests</h1>
        <WeeklySwitcher
          currentWeekStart={currentWeekStart}
          onWeekChange={handleWeekChange}
          isUrgentMode={isUrgentMode}
          weekStartsOn={1} // Monday
        />
      </div>

      <div className="flex justify-end mb-3">
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

      <div className="overflow-x-auto">
        {otherRequestsData?.data.requests.length === 0 ? (
          <div className="text-center py-3 text-sm text-gray-600">
            No other requests found.
          </div>
        ) : (
          <>
            <table className="min-w-full border-collapse border border-black text-sm text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black p-1 text-left font-medium">
                    Request ID
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Date
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Major Section
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Depot
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Block Section
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Time
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Work Type
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Activity
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Status
                  </th>
                  <th className="border border-black p-1 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {otherRequestsData?.data.requests.map((request: any) => (
                  <tr key={request.id} className="hover:bg-gray-50">
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
                      {formatTimePeriod(
                        request.demandTimeFrom,
                        request.demandTimeTo
                      )}
                    </td>
                    <td className="border border-black p-1">
                      {request.workType}
                    </td>
                    <td className="border border-black p-1">
                      {request.activity}
                    </td>
                    <td className="border border-black p-1">
                      <span
                        className={`px-1 py-0.5 text-xs ${getStatusBadgeClass(
                          request.DisconnAcceptance
                        )}`}
                      >
                        {request.DisconnAcceptance}
                      </span>
                    </td>
                    <td className="border border-black p-1 whitespace-nowrap">
                      <Link
                        href={`/view-other-request/${request.id}`}
                        className="text-[#13529e] hover:underline mr-2 text-xs"
                      >
                        View
                      </Link>
                      {request.DisconnAcceptance === "PENDING" && (
                        <div className="inline-flex gap-2 items-center">
                          <button
                            onClick={() => handleStatusUpdate(request.id, true)}
                            disabled={isMutating}
                            className="text-green-700 hover:underline text-xs bg-green-50 px-2 py-1 rounded border border-green-700 disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request.id, false)}
                            disabled={isMutating}
                            className="text-red-700 hover:underline text-xs bg-red-50 px-2 py-1 rounded border border-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                          {isMutating && (
                            <span className="text-xs text-gray-500">Updating...</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={currentPage}
              totalPages={otherRequestsData?.data.totalPages || 1}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md max-w-md w-full">
            <h3 className="text-lg font-medium mb-3 text-black">Rejection Remarks</h3>
            <p className="text-sm text-gray-600 mb-3">
              Please provide a reason for rejecting this request.
            </p>
            <textarea
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-3 text-black"
              placeholder="Enter rejection remarks"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectRemarks("");
                  setSelectedRequestId("");
                }}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-700 border border-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-3 py-1 text-sm bg-red-50 text-red-700 border border-red-700 rounded"
                disabled={!rejectRemarks.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1">
        © {new Date().getFullYear()} Indian Railways. All Rights Reserved. 
      </div>
    </div>
  );
}
