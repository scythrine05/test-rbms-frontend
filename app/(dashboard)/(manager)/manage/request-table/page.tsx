"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RequestTablePage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Fetch requests data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", page, statusFilter],
    queryFn: () => managerService.getUserRequests(page),
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
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return "Invalid time";
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Filter requests based on status
  const filteredRequests =
    data?.data?.requests?.filter((request: UserRequest) => {
      if (statusFilter === "ALL") return true;
      return request.status === statusFilter;
    }) || [];

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

  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Block Requests</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="gov-input text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Date
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Major Section
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Depot
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Block Section
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Line
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Time
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Corridor Type
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Work Type
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Activity
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Status
              </th>
              <th className="border border-black p-1 text-left text-sm font-medium text-black">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: UserRequest) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="border border-black p-1 text-sm">
                  {formatDate(request.date)}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.selectedSection}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.selectedDepo}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.missionBlock}
                </td>
                {/* <td className="border border-black p-1 text-sm">
                  {request.processedLineSections?.[0]?.lineName || "N/A"}
                </td> */}
                <td className="border border-black p-1 text-sm">
                  {(() => {
                    if (
                      request.processedLineSections &&
                      Array.isArray(request.processedLineSections) &&
                      request.processedLineSections.length > 0
                    ) {
                      const regularSection = request.processedLineSections.find(
                        (section) => section.type === "regular"
                      );
                      if (regularSection && regularSection.lineName) {
                        return regularSection.lineName;
                      }

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

                      const firstSection = request.processedLineSections[0];
                      if (firstSection.lineName) return firstSection.lineName;
                      if (firstSection.stream) return firstSection.stream;
                    }

                    if (request.selectedStream) {
                      return request.selectedStream;
                    }

                    return "N/A";
                  })()}
                </td>

                <td className="border border-black p-1 text-sm">
                  {formatTime(request.demandTimeFrom)} -{" "}
                  {formatTime(request.demandTimeTo)}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.corridorTypeSelection ||
                    request.corridorType ||
                    "N/A"}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.workType}
                </td>
                <td className="border border-black p-1 text-sm">
                  {request.activity}
                </td>
                <td className="border border-black p-1 text-sm">
                  <span
                    className={`px-2 py-0.5 text-xs ${getStatusBadgeClass(
                      request.managerAcceptance ? "APPROVED" : "PENDING"
                    )}`}
                  >
                    {request.managerAcceptance ? "APPROVED" : "PENDING"}
                  </span>
                </td>
                <td className="border border-black p-1 text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/manage/view-request/${request.id}`}
                      className="px-2 py-1 text-xs bg-[#13529e] text-white border border-black"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
