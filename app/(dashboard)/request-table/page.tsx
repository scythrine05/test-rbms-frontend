// app/(dashboard)/dashboard/request-table/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  useGetUserRequests,
  useGetWeeklyUserRequests,
  DateRangeFilter,
  RequestItem,
} from "@/app/service/query/user-request";
import Link from "next/link";
import { format, parseISO, addDays, startOfWeek, endOfWeek } from "date-fns";

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

export default function RequestTablePage() {
  // State for pagination and view type
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewType, setViewType] = useState<"compact" | "gantt">("compact");

  // State for week selection
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    return startOfWeek(now, { weekStartsOn: 0 }); // Start from Sunday
  });

  // Calculate week range
  const weekRange: DateRangeFilter = {
    startDate: format(currentWeekStart, "yyyy-MM-dd"),
    endDate: format(
      endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      "yyyy-MM-dd"
    ),
  };

  // Get requests with pagination
  const {
    data: paginatedData,
    isLoading: isPaginatedLoading,
    error: paginatedError,
  } = useGetUserRequests(currentPage, pageSize);

  // Get weekly requests for the Gantt view
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
  } = useGetWeeklyUserRequests(weekRange);

  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prevDate) => addDays(prevDate, -7));
  };

  // Function to navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart((prevDate) => addDays(prevDate, 7));
  };

  // Generate dates for the week
  const weekDates = Array.from({ length: 31 }, (_, i) => {
    const date = addDays(new Date(2025, 4, 1), i); // May 1, 2025 + i days
    return {
      date,
      formattedDate: format(date, "dd-MM-yyyy"),
      dayOfWeek: format(date, "E"),
    };
  });

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

  // Get disconnection requirements as a string
  const getDisconnectionRequirements = (request: RequestItem) => {
    const requirements: string[] = [];

    if (request.powerBlockRequired) {
      const powerReqs = Array.isArray(request.powerBlockRequirements)
        ? request.powerBlockRequirements.join(", ")
        : request.powerBlockRequirements || "";
      requirements.push(`Power Block: ${powerReqs || "Required"}`);
    }

    if (request.sntDisconnectionRequired) {
      const sntReqs = Array.isArray(request.sntDisconnectionRequirements)
        ? request.sntDisconnectionRequirements.join(", ")
        : request.sntDisconnectionRequirements || "";
      requirements.push(`S&T: ${sntReqs || "Required"}`);
    }

    if (request.sigDisconnectionRequirements) {
      requirements.push(`SIG: ${request.sigDisconnectionRequirements}`);
    }

    if (request.trdDisconnectionRequirements) {
      requirements.push(`TRD: ${request.trdDisconnectionRequirements}`);
    }

    return requirements.length > 0 ? requirements.join(", ") : "None";
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

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          Summary of Block Requisitions
        </h1>
        <Link
          href="/create-block-request"
          className="px-3 py-1 text-sm bg-[#13529e] text-white border border-black"
        >
          Create New Block
        </Link>
      </div>

      {/* View toggle */}
      <div className="flex justify-between items-center mb-3 border-b border-black pb-3">
        <div className="space-x-1">
          <button
            onClick={() => setViewType("compact")}
            className={`px-3 py-1 text-sm border border-black ${
              viewType === "compact"
                ? "bg-[#13529e] text-white"
                : "bg-white text-[#13529e]"
            }`}
          >
            Compact View
          </button>
          <button
            onClick={() => setViewType("gantt")}
            className={`px-3 py-1 text-sm border border-black ${
              viewType === "gantt"
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

      {viewType === "compact" ? (
        /* Compact Table View */
        <div className="overflow-x-auto">
          {isPaginatedLoading ? (
            <div className="text-center py-3 text-sm">Loading requests...</div>
          ) : paginatedError ? (
            <div className="text-center py-3 text-sm text-red-600">
              Error loading requests. Please try again.
            </div>
          ) : paginatedData?.data.requests.length === 0 ? (
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
                      Line
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Time
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Corridor Type
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
                  {paginatedData?.data.requests.map((request) => (
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
                        {request.workType}
                      </td>
                      <td className="border border-black p-1">
                        {request.activity}
                      </td>
                      <td className="border border-black p-1">
                        <span
                          className={`px-1 py-0.5 text-xs ${getStatusBadgeClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="border border-black p-1 whitespace-nowrap">
                        <Link
                          href={`/view-request/${request.id}`}
                          className="text-[#13529e] hover:underline mr-2 text-xs"
                        >
                          View
                        </Link>
                        {request.status === "PENDING" && (
                          <Link
                            href={`/edit-request/${request.id}`}
                            className="text-green-700 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Pagination
                currentPage={currentPage}
                totalPages={paginatedData?.data.totalPages || 1}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      ) : (
        /* Gantt View */
        <div className="mb-3 text-black">
          <div className="flex justify-between items-center mb-3 text-sm border-b border-black pb-2">
            <button
              onClick={goToPreviousWeek}
              className="px-2 py-1 bg-white text-[#13529e] border border-black text-sm"
            >
              &lt; Prev Week
            </button>
            <div className="font-medium">
              Current Week: {weekRange.startDate} to {weekRange.endDate}
            </div>
            <button
              onClick={goToNextWeek}
              className="px-2 py-1 bg-white text-[#13529e] border border-black text-sm"
            >
              Next Week &gt;
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Week days header */}
              <div className="flex border-b border-black text-xs">
                <div className="w-40 flex-shrink-0 p-1 font-medium bg-gray-100 border-r border-black">
                  Block Section
                </div>
                {weekDates.map((dateInfo) => (
                  <div
                    key={dateInfo.formattedDate}
                    className="w-14 flex-shrink-0 p-1 text-center border-r border-black bg-gray-100"
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
              ) : !weeklyData?.data.requests ||
                weeklyData.data.requests.length === 0 ? (
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
                  weeklyData.data.requests.reduce((acc, request) => {
                    const blockSections = request.missionBlock.split(",");
                    blockSections.forEach((section) => {
                      if (!acc[section]) acc[section] = [];
                      acc[section].push(request);
                    });
                    return acc;
                  }, {} as Record<string, RequestItem[]>) || {}
                ).map(([blockSection, requests]) => (
                  <div
                    key={blockSection}
                    className="flex border-b border-black"
                  >
                    <div className="w-40 flex-shrink-0 p-1 font-medium text-xs border-r border-black">
                      {blockSection}
                    </div>

                    {weekDates.map((dateInfo) => {
                      const dateStr = format(dateInfo.date, "yyyy-MM-dd");
                      const requestsForDay = requests.filter((request) => {
                        const requestDate = formatDate(request.date);
                        return (
                          requestDate === format(dateInfo.date, "dd-MM-yyyy")
                        );
                      });

                      return (
                        <div
                          key={dateInfo.formattedDate}
                          className="w-14 flex-shrink-0 p-0.5 border-r border-black relative min-h-8"
                        >
                          {requestsForDay.map((request) => (
                            <Link
                              key={request.id}
                              href={`/view-request/${request.id}`}
                              className={`block text-[8px] p-0.5 mb-0.5 border border-black overflow-hidden text-white
                                ${
                                  request.status === "APPROVED"
                                    ? "bg-green-700"
                                    : request.status === "REJECTED"
                                    ? "bg-red-700"
                                    : "bg-[#13529e]"
                                }`}
                              title={`${request.workType}: ${
                                request.activity
                              } - ${formatTime(
                                request.demandTimeFrom
                              )} to ${formatTime(request.demandTimeTo)} 
${getCorridorType(request)} - ${request.selectedDepo}
${request.missionBlock} - ${getLineName(request)}`}
                            >
                              {formatTimePeriod(
                                request.demandTimeFrom,
                                request.demandTimeTo
                              )}
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

      {/* Detailed view table */}
      {viewType === "gantt" &&
        weeklyData?.data.requests &&
        weeklyData.data.requests.length > 0 && (
          <div className="mt-3 border-t border-black pt-3">
            <h2 className="text-md font-bold text-[#13529e] mb-2">
              Detailed Weekly Requests
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-black text-xs text-black">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-black p-1 text-left font-medium">
                      ID
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Date
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Section
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Depot
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Block Section
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Line
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Time
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Corridor
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Work Type
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Activity
                    </th>
                    <th className="border border-black p-1 text-left font-medium">
                      Disconnections
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
                  {weeklyData.data.requests.map((request) => (
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
                        {request.workType}
                      </td>
                      <td className="border border-black p-1">
                        {request.activity}
                      </td>
                      <td className="border border-black p-1 text-[8px]">
                        {getDisconnectionRequirements(request)}
                      </td>
                      <td className="border border-black p-1">
                        <span
                          className={`px-1 text-[8px] ${getStatusBadgeClass(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="border border-black p-1 whitespace-nowrap">
                        <Link
                          href={`/view-request/${request.id}`}
                          className="text-[#13529e] hover:underline mr-1 text-[8px]"
                        >
                          View
                        </Link>
                        {request.status === "PENDING" && (
                          <Link
                            href={`/edit-request/${request.id}`}
                            className="text-green-700 hover:underline text-[8px]"
                          >
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1">
        © {new Date().getFullYear()} Indian Railways. All Rights Reserved.
      </div>
    </div>
  );
}
