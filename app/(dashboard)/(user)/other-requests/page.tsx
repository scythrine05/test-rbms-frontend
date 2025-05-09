// app/(dashboard)/dashboard/other-requests/page.tsx
"use client";
import { useState } from "react";
import { useGetOtherRequests } from "@/app/service/query/user-request";
import { useUpdateOtherRequest } from "@/app/service/mutation/user-request";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get the depot from session data
  const selectedDepo = session?.user?.depot || "";

  // Get other requests data
  const {
    data: otherRequestsData,
    isLoading,
    error,
  } = useGetOtherRequests(selectedDepo, currentPage, pageSize);

  // Update other request mutation
  const { mutate: updateOtherRequest } = useUpdateOtherRequest();

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
      <div className="border-b-2 border-[#13529e] pb-3 mb-4">
        <h1 className="text-lg font-bold text-[#13529e]">Other Requests</h1>
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
                {otherRequestsData?.data.requests.map((request) => (
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
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() =>
                              updateOtherRequest({
                                id: request.id,
                                accept: true,
                              })
                            }
                            className="text-green-700 hover:underline text-xs bg-green-50 px-2 py-1 rounded border border-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              updateOtherRequest({
                                id: request.id,
                                accept: false,
                              })
                            }
                            className="text-red-700 hover:underline text-xs bg-red-50 px-2 py-1 rounded border border-red-700"
                          >
                            Reject
                          </button>
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

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1">
        © {new Date().getFullYear()} Indian Railways. All Rights Reserved.
      </div>
    </div>
  );
}
