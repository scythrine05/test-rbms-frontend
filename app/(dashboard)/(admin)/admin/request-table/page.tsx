"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminRequestTablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Fetch requests data
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-requests", dateRange, sectionFilter, typeFilter],
    queryFn: () =>
      managerService.getUserRequestsByAdmin(
        1,
        1000,
        dateRange.start,
        dateRange.end
      ),
  });

  // Get unique sections and types for filters
  const sectionOptions = Array.from(
    new Set(data?.data?.requests?.map((r: UserRequest) => r.selectedSection).filter(Boolean) || [])
  );
  const typeOptions = Array.from(
    new Set(data?.data?.requests?.map((r: UserRequest) => r.corridorType).filter(Boolean) || [])
  );

  // Filter requests based on filters
  const filteredRequests = data?.data?.requests?.filter((request: UserRequest) => {
    const sectionMatch = sectionFilter === "ALL" || request.selectedSection === sectionFilter;
    const typeMatch = typeFilter === "ALL" || request.corridorType === typeFilter;
    return sectionMatch && typeMatch;
  }) || [];

  // Helper functions
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
    } catch {
      return "N/A";
    }
  };
  // Status badge mapping
  function getStatusBadge(request: UserRequest) {
    if (request.status === 'APPROVED' && request.isSanctioned) {
      return { label: 'Sanctioned', className: 'bg-green-200 text-green-900 border-green-400' };
    }
    if (request.status === 'REJECTED') {
      return { label: 'Rejected', className: 'bg-red-500 text-white border-red-700' };
    }
    if (request.status === 'PENDING') {
      return { label: 'Pending', className: 'bg-yellow-200 text-yellow-900 border-yellow-400' };
    }
    if (request.userStatus === 'AVAILED') {
      return { label: 'Availed', className: 'bg-sky-200 text-sky-900 border-sky-400' };
    }
    if (request.userStatus === 'NOT_AVAILED') {
      return { label: 'Not-availed', className: 'bg-white text-black border-gray-300' };
    }
    if (request.status === 'BURST') {
      return { label: 'Burst', className: 'bg-orange-400 text-white border-orange-700 font-bold' };
    }
    return { label: request.status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
  }

  // Download CSV
  const handleDownloadCSV = () => {
    if (!filteredRequests.length) return;
    const headers = [
      "Date", "ID", "Section", "Demanded From", "Demanded To", "Slot From", "Slot To", "Type", "Status"
    ];
    const rows = filteredRequests.map((r) => [
      formatDate(r.date),
      r.id,
      r.selectedSection,
      formatTime(r.demandTimeFrom),
      formatTime(r.demandTimeTo),
      formatTime(r.sanctionedTimeFrom),
      formatTime(r.sanctionedTimeTo),
      r.corridorType,
      getStatusBadge(r).label
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `block_details_${dateRange.start}_to_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex flex-col items-center">
      {/* RBMS Header */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">RBMS</span>
      </div>
      {/* Blue Section Title */}
      <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
        <span className="text-3xl font-bold text-black text-center">Block Details</span>
      </div>
      {/* Red Bar */}
      <div className="w-full flex flex-col items-center mt-4">
        <div className="flex gap-2">
          <div className="bg-[#FF4B4B] text-white font-bold px-6 py-2 rounded">Requests Pending with Me</div>
          <div className="bg-[#FF4B4B] text-white font-bold px-6 py-2 rounded">Urgent(..Nos.)</div>
        </div>
      </div>
      {/* Filters Row */}
      <div className="w-full flex flex-wrap gap-4 items-center justify-center mt-6 mb-2">
        <div className="flex items-center gap-2 bg-[#E6E6FA] px-4 py-2 rounded border-2 border-black">
          <span className="font-bold text-black">Custom</span>
          <span className="text-black">From</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="p-1 border border-black text-black bg-white w-32 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
          <span className="text-black">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="p-1 border border-black text-black bg-white w-32 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#E6E6FA] px-4 py-2 rounded border-2 border-black">
          <span className="font-bold text-black">Section</span>
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="p-1 border border-black text-black bg-white w-32 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          >
            <option value="ALL">All</option>
            {sectionOptions.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-[#E6E6FA] px-4 py-2 rounded border-2 border-black">
          <span className="font-bold text-black">Type</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="p-1 border border-black text-black bg-white w-32 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          >
            <option value="ALL">All</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Block Summary Table */}
      <div className="w-full max-w-6xl mt-4 overflow-x-auto">
        <table className="w-full border-2 border-black bg-white text-black text-sm">
          <thead>
            <tr className="bg-[#E8F4F8] text-black">
              <th className="border-2 border-black p-1">Date</th>
              <th className="border-2 border-black p-1">ID</th>
              <th className="border-2 border-black p-1">Section</th>
              <th className="border-2 border-black p-1">Demanded From</th>
              <th className="border-2 border-black p-1">Demanded To</th>
              <th className="border-2 border-black p-1">Slot From</th>
              <th className="border-2 border-black p-1">Slot To</th>
              <th className="border-2 border-black p-1">Type</th>
              <th className="border-2 border-black p-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request: UserRequest) => {
              const status = getStatusBadge(request);
              return (
                <tr key={request.id} className="bg-white hover:bg-[#F3F3F3]">
                  <td className="border border-black p-1 text-center">{formatDate(request.date)}</td>
                  <td className="border border-black p-1 text-center">
                    <Link
                      href={`/dashboard/(admin)/admin/view-request/${request.id}?from=request-table`}
                      className="text-[#13529e] hover:underline font-semibold"
                    >
                      {request.id}
                    </Link>
                  </td>
                  <td className="border border-black p-1 text-center">{request.selectedSection}</td>
                  <td className="border border-black p-1 text-center">{formatTime(request.demandTimeFrom)}</td>
                  <td className="border border-black p-1 text-center">{formatTime(request.demandTimeTo)}</td>
                  <td className="border border-black p-1 text-center">{formatTime(request.sanctionedTimeFrom)}</td>
                  <td className="border border-black p-1 text-center">{formatTime(request.sanctionedTimeTo)}</td>
                  <td className="border border-black p-1 text-center">{request.corridorType}</td>
                  <td className="border border-black p-1 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full border ${status.className}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Help Text */}
      <div className="mx-4 mt-6 text-center">
        <p className="text-lg font-bold">Click ID to see details &amp; to decide the Block.</p>
        <p className="mt-2 text-lg">For printing the complete table, click download here in <span className="text-blue-700 font-bold cursor-pointer underline" onClick={handleDownloadCSV}>.csv format</span>.</p>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 mt-8 mb-8">
        <button onClick={handleDownloadCSV} className="bg-[#FFA07A] px-8 py-2 rounded-lg border-2 border-black font-bold text-2xl">Download</button>
        <Link href="/dashboard" className="bg-[#90EE90] px-8 py-2 rounded-lg border-2 border-black font-bold text-2xl flex items-center gap-2">
          <span className="inline-block w-7 h-7 bg-white rounded-full border border-black flex items-center justify-center">
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' strokeWidth={2} className='w-5 h-5'><path strokeLinecap='round' strokeLinejoin='round' d='M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v11a1 1 0 01-1 1h-3m-4 0h4' /></svg>
          </span>
          Home
        </Link>
      </div>
    </div>
  );
}
