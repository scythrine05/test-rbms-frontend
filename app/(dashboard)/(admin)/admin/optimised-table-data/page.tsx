"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/app/service/api/admin";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRequest } from "@/app/service/api/manager";
import { WeeklySwitcher } from "@/app/components/ui/WeeklySwitcher";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

// Header icons for tables
const HeaderIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "id":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.5 9.5A2.5 2.5 0 018 12V8.5H5.5v1zm0 0V8.5H8V12a2.5 2.5 0 01-2.5-2.5zM12 12v-1.5h-1.5V12H12zm-1.5-3V12H12V9h-1.5zm3.5.5v1h1.5V8h-5v1.5h2V12h1.5V9.5h1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "date":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "section":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "time":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "work":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
        </svg>
      );
    case "action":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      );
    case "line":
      return (
        <svg
          className="w-3.5 h-3.5 inline-block mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return null;
  }
};

// Column header component
const ColumnHeader = ({
  icon,
  title,
  showFilter = false,
}: {
  icon: string;
  title: string;
  showFilter?: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <HeaderIcon type={icon} />
        <span>{title}</span>
      </div>
    </div>
  );
};

// Helper to get line/road display for a request
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
  const { isUrgentMode } = useUrgentMode();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const lastSaturday = subDays(today, (today.getDay() + 1) % 7);
    return startOfWeek(lastSaturday, { weekStartsOn: 6 });
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Calculate date range based on urgent mode
  const weekStart = isUrgentMode
    ? currentWeekStart
    : startOfWeek(currentWeekStart, { weekStartsOn: 6 });
  const weekEnd = isUrgentMode
    ? currentWeekStart
    : endOfWeek(currentWeekStart, { weekStartsOn: 6 });

  const apiStartDate = format(weekStart, "yyyy-MM-dd");
  const apiEndDate = isUrgentMode
    ? apiStartDate
    : format(weekEnd, "yyyy-MM-dd");

  // Fetch approved requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["approved-requests", apiStartDate, apiEndDate, isUrgentMode],
    queryFn: () =>
      adminService.getOptimizeRequests(apiStartDate, apiEndDate, 1),
  });

  // DEBUG: Log API data
  console.log("API data", data?.data?.requests);

  // TEMP: Show all requests for debugging
  const filteredRequests = data?.data?.requests || [];

  const [optimizedData, setOptimizedData] = useState<UserRequest[] | null>(null);

  interface SanctionRequest {
    id: string;
    optimizeTimeFrom: string;
    optimizeTimeTo: string;
  }

  // Add this with your other mutations
  const updateSanctionStatus = useMutation({
    mutationFn: (requests: SanctionRequest[]) =>
      adminService.updateSanctionStatus(requests),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["approved-requests", currentWeekStart],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error("Error updating sanction status:", error);
      alert("Failed to update sanction status. Please try again.");
    },
  });

  const handleSendClick = () => {
    const requestsToSanction = data?.data?.requests
      ?.filter(
        (request: UserRequest) =>
          request.optimizeStatus === true &&
          !request.isSanctioned &&
          request?.optimizeData?.optimizeTimeFrom &&
          request?.optimizeData?.optimizeTimeTo
      )
      ?.map(
        (request: UserRequest): SanctionRequest => ({
          id: request.id,
          optimizeTimeFrom: request.optimizeData.optimizeTimeFrom,
          optimizeTimeTo: request.optimizeData.optimizeTimeTo,
        })
      );

    if (!requestsToSanction || requestsToSanction.length === 0) {
      alert("No valid requests available to send for sanction");
      return;
    }

    if (confirm(`Send ${requestsToSanction.length} request(s) for sanction?`)) {
      updateSanctionStatus.mutate(requestsToSanction);
    }
  };

  // Mutation for updating optimized times
  const updateOptimizedTimes = useMutation({
    mutationFn: (data: {
      requestId: string;
      optimizeTimeFrom: string;
      optimizeTimeTo: string;
    }) => adminService.updateOptimizeTimes(data),
    onSuccess: (response) => {
      queryClient.setQueryData(
        ["approved-requests", apiStartDate, apiEndDate, isUrgentMode],
        (oldData: any) => {
          if (!oldData) return oldData;
          const updatedRequests = oldData.data.requests.map((req: UserRequest) => {
            if (req.id === response.data.id) {
              return {
                ...req,
                optimizeTimeFrom: response.data.optimizeTimeFrom,
                optimizeTimeTo: response.data.optimizeTimeTo,
                optimizeData: {
                  ...req.optimizeData,
                  optimizeTimeFrom: response.data.optimizeTimeFrom,
                  optimizeTimeTo: response.data.optimizeTimeTo
                }
              };
            }
            return req;
          });
          return {
            ...oldData,
            data: {
              ...oldData.data,
              requests: updatedRequests
            }
          };
        }
      );
      queryClient.invalidateQueries({
        queryKey: ["approved-requests", apiStartDate, apiEndDate, isUrgentMode],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setEditingId(null);
    },
    onError: (error) => {
      console.error("Error updating times:", error);
      alert("Failed to update times. Please try again.");
    },
  });

  // Format date and time helpers
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

  // Function to navigate to previous/next period
  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) => {
      if (isUrgentMode) {
        return direction === "prev" ? subDays(prev, 1) : addDays(prev, 1);
      } else {
        return direction === "prev" ? subDays(prev, 7) : addDays(prev, 7);
      }
    });
  };

  // Edit functionality
  const handleEditClick = (request: UserRequest) => {
    setEditingId(request.id);
    setTimeFrom(
      request.optimizeData?.optimizeTimeFrom
        ? formatTime(request.optimizeData.optimizeTimeFrom)
        : ""
    );
    setTimeTo(
      request.optimizeData?.optimizeTimeTo
        ? formatTime(request.optimizeData.optimizeTimeTo)
        : ""
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTimeFrom("");
    setTimeTo("");
  };

  // Delete mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (requestId: string) => adminService.deleteRequest(requestId),
    onMutate: (requestId) => {
      setDeletingIds((prev) => new Set(prev).add(requestId));
    },
    onSuccess: (_, requestId) => {
      queryClient.invalidateQueries({
        queryKey: ["approved-requests", currentWeekStart],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    },
    onError: (error, requestId) => {
      console.error("Error deleting request:", error);
      alert("Failed to delete request. Please try again.");
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    },
  });

  const handleDelete = (requestId: string) => {
    if (confirm("Are you sure you want to delete this request?")) {
      deleteRequestMutation.mutate(requestId);
    }
  };

  const handleUpdateClick = (requestId: string) => {
    if (!timeFrom || !timeTo) {
      alert("Please fill both start and end times");
      return;
    }

    try {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
        throw new Error("Time must be in HH:mm format (e.g., 14:30)");
      }

      // Create Date objects in local time
      const localFrom = new Date(`${format(new Date(), "yyyy-MM-dd")}T${timeFrom}`);
      const localTo = new Date(`${format(new Date(), "yyyy-MM-dd")}T${timeTo}`);

      // Convert to ISO strings without timezone adjustment
      const optimizeTimeFromISO = formatForBackend(localFrom);
      const optimizeTimeToISO = formatForBackend(localTo);

      updateOptimizedTimes.mutate({
        requestId,
        optimizeTimeFrom: optimizeTimeFromISO,
        optimizeTimeTo: optimizeTimeToISO,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Invalid input");
    }
  };

  // Helper function to format time for backend
  const formatForBackend = (date: Date) => {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00.000Z`;
  };

  // Helper function to pad numbers with leading zero
  const pad = (num: number) => num.toString().padStart(2, '0');

  const getOptimisedTime = (request: UserRequest) => {
    if (request.optimizeData?.optimizeTimeFrom && request.optimizeData?.optimizeTimeTo) {
      return `${formatTime(request.optimizeData.optimizeTimeFrom)} - ${formatTime(request.optimizeData.optimizeTimeTo)}`;
    }
    return "N/A";
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

  return (
    <div className="bg-white p-3 border border-black">
      {showSuccess && (
        <div className="fixed top-20 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Operation successful!
        </div>
      )}

      <div className="border-b-2 border-[#13529e] pb-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Optimized Requests</h1>
        {isUrgentMode ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleWeekChange("prev")}
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-800"
            >
              Previous Day
            </button>
            <span className="text-sm font-medium text-black">
              Date: {format(currentWeekStart, "dd-MM-yyyy")}
            </span>
            <button
              onClick={() => handleWeekChange("next")}
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-800"
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

      <div className="flex justify-end py-2 gap-2">
        <button
          onClick={handleSendClick}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black cursor-pointer hover:bg-gray-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V3a1 1 0 102 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Send for Sanction
        </button>
      </div>

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
                <ColumnHeader icon="time" title="Time" />
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
                className={`hover:bg-blue-50 transition-colors ${request.optimizeData?.optimizeTimeFrom && request.optimizeData?.optimizeTimeTo
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
                  {formatTime(request.demandTimeFrom)} -{" "}
                  {formatTime(request.demandTimeTo)}
                </td>
                <td className="border border-black p-2 text-sm">
                  {editingId === request.id ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="time"
                        value={timeFrom}
                        onChange={(e) => setTimeFrom(e.target.value)}
                        className="w-20 border p-1 text-sm rounded"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={timeTo}
                        onChange={(e) => setTimeTo(e.target.value)}
                        className="w-20 border p-1 text-sm rounded"
                      />
                    </div>
                  ) : (
                    getOptimisedTime(request)
                  )}
                </td>
                <td className="border border-black p-2 text-sm">
                  {request.workType}
                </td>
                <td className="border border-black p-2 text-sm">
                  {request.activity}
                </td>
                <td className="border border-black p-2 text-sm">
                  {editingId === request.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateClick(request.id)}
                        className="px-2 py-1 text-xs bg-green-600 text-white border border-black rounded"
                        disabled={updateOptimizedTimes.isPending}
                      >
                        {updateOptimizedTimes.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2 py-1 text-xs bg-gray-400 text-white border border-black rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/view-request/${request.id}`}
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
                      <button
                        onClick={() => handleEditClick(request)}
                        className="px-2 py-1 text-xs bg-yellow-500 text-white border border-black rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(request.id)}
                        disabled={deletingIds.has(request.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white border border-black rounded"
                      >
                        {deletingIds.has(request.id) ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
