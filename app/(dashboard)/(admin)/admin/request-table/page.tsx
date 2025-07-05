"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";

export default function AdminRequestTablePage() {
  const { data: session } = useSession();
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [blockTypeDropdownOpen, setBlockTypeDropdownOpen] = useState(false);
  // const [sseDropdownOpen, setSseDropdownOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedSSEs, setSelectedSSEs] = useState<string[]>([]);
  const [blockType, setBlockType] = useState<string[]>([]);
  const [type, setType] = useState<string[]>([]);
  const [section, setSection] = useState<string[]>([]);
  const [sse, setSse] = useState<string[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [pendingDept, setPendingDept] = useState("");

  // --- Summary Filters: Pending (UI) and Active (applied) states ---
  type SummaryFilters = {
    start: string;
    end: string;
    blockType: string[];
    section: string[];
    dept: string;
    line: string;
  };
  const [pendingSummaryFilters, setPendingSummaryFilters] = useState<SummaryFilters>({
    start: "",
    end: "",
    blockType: [],
    section: [],
    dept: "",
    line: "",
  });
  const [activeSummaryFilters, setActiveSummaryFilters] = useState<SummaryFilters>({
    start: "",
    end: "",
    blockType: [],
    section: [],
    dept: "",
    line: "",
  });

  useEffect(() => {
    setType(blockType);
  }, [blockType]);

  useEffect(() => {
    setSection(selectedSections);
  }, [selectedSections]);

  //  useEffect(()=>{
  // setSse(selectedSSEs)
  // },[selectedSSEs])
  // Fetch all requests for admin
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-requests", customDateRange],
    queryFn: () =>
      managerService.getUserRequestsByAdmin(
        1,
        10000,
        customDateRange.start || undefined,
        customDateRange.end || undefined
      ),
  });

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
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "N/A";
    }
  };

  // Section and SSE options
  const sectionOptions = Array.from(
    new Set(
      data?.data?.requests
        ?.map((r: UserRequest) => r.selectedSection)
        .filter(Boolean) || []
    )
  );
  const sseOptions = Array.from(
    new Set(
      data?.data?.requests
        ?.map((r: UserRequest) => r.user?.name)
        .filter(Boolean) || []
    )
  );
  const blockTypeOptions = [
    { label: "Corridor (C)", value: "Corridor" },
    { label: "Non-corridor(NC)", value: "Outside Corridor" },
    { label: "Emergency (E)", value: "Urgent Block" },
    { label: "Mega Block (M)", value: "MEGA_BLOCK" },
  ];

  // Status mapping for admin (lookalike to manager's, but with admin-specific labels)
  function getStatusDisplay(request: UserRequest) {
    if (request.status === "APPROVED" && request.isSanctioned) {
      return {
        label: "Sanctioned",
        style: { background: "#d6ecd2", color: "#11332b" },
      };
    }
    if (request.status === "APPROVED" && !request.isSanctioned && request.adminRequestStatus !== "REJECTED") {
      return {
        label: "Pending with me",
        style: { background: "#d47ed4", color: "#222" },
      };
    }
    if (request.status === "REJECTED" || request.adminRequestStatus === "REJECTED") {
      return {
        label: "Return to Applicant",
        style: { background: "#ff4e36", color: "#fff" },
      };
    }
    if (["NOT_AVAILED", "AVAILED", "CANCELLED"].includes(request.userStatus)) {
      return {
        label: request.userStatus.replace("_", "-").toLowerCase(),
        style: { background: "#fff", color: "#222" },
      };
    }
    if (request.status === "BURST") {
      return {
        label: "Burst",
        style: { background: "#ff944c", color: "#fff" },
      };
    }
    // Fallback
    return {
      label: request.status,
      style: { background: "#fff", color: "#222" },
    };
  }

  // Filtering logic
  let filteredRequests = data?.data?.requests || [];
  if (selectedSections.length > 0) {
    filteredRequests = filteredRequests.filter((r) =>
      selectedSections.includes(r.selectedSection)
    );
  }
  if (selectedSSEs.length > 0) {
    filteredRequests = filteredRequests.filter((r) =>
      selectedSSEs.includes(r.user?.name)
    );
  }

  if (blockType.length > 0) {
    filteredRequests = filteredRequests.filter((r) =>
      blockType.includes(r.corridorType)
    );
  }

  // Only include requests whose date is in the future (above current date)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ignore time
  const allRequests = data?.data?.requests || [];
  const pendingWithMeCount = allRequests.filter((r: UserRequest) => {
    if (r.status !== "APPROVED" || r.isSanctioned) return false;
    if (!r.date) return false;
    if (pendingDept && r.selectedDepartment !== pendingDept) return false;
    const reqDate = new Date(r.date);
    reqDate.setHours(0, 0, 0, 0);
    return reqDate > today;
  }).length;

  // const handleDownloadCSV = () => {
  //   try {
  //     if (!filteredRequests || filteredRequests.length === 0) {
  //       alert("No data available to download!");
  //       return;
  //     }

  //     // Define CSV headers (add more if needed)
  //     const headers = [
  //       "Date",
  //       "Request ID",
  //       "Block Section",
  //       "Line/Road",
  //       "Activity",
  //       "Status",
  //       "Start Time (HH:MM)",
  //       "End Time (HH:MM)",
  //       "Corridor Type",
  //       "SSE Name",
  //       "Work Location",
  //       "Remarks",
  //     ];

  //     // Map data to CSV rows with exact time formatting
  //     const rows = filteredRequests.map((request) => {
  //       const startTime = request.demandTimeFrom
  //         ? new Date(request.demandTimeFrom).toISOString().slice(11, 5)
  //         : "N/A";

  //       const endTime = request.demandTimeTo
  //         ? new Date(request.demandTimeTo).toISOString().slice(11, 5)
  //         : "N/A";

  //       return [
  //         formatDate(request.date), // DD-MM-YYYY
  //         request.id,
  //         request.missionBlock,
  //         request.processedLineSections?.[0]?.road || "N/A",
  //         request.activity,
  //         getStatusDisplay(request).label,
  //         startTime, // Exact time in HH:MM format
  //         endTime, // Exact time in HH:MM format
  //         request.corridorType,
  //         request.user?.name || "N/A",
  //         request.workLocationFrom,
  //         request.requestremarks,
  //       ];
  //     });

  //     // Create CSV content
  //     let csvContent = "data:text/csv;charset=utf-8,";
  //     csvContent += headers.join(",") + "\n";

  //     rows.forEach((row) => {
  //       csvContent +=
  //         row
  //           .map((field) => {
  //             // Handle null/undefined and escape quotes
  //             const str =
  //               field !== null && field !== undefined
  //                 ? field.toString().replace(/"/g, '""')
  //                 : "";
  //             return `"${str}"`;
  //           })
  //           .join(",") + "\n";
  //     });

  //     // Trigger download
  //     const encodedUri = encodeURI(csvContent);
  //     const link = document.createElement("a");
  //     link.setAttribute("href", encodedUri);
  //     link.setAttribute(
  //       "download",
  //       `block_requests_${new Date().toISOString().slice(0, 10)}.csv`
  //     );
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } catch (error) {
  //     console.error("Download failed:", error);
  //     alert("Failed to generate CSV. Please check console for details.");
  //   }
  // };


  const handleDownloadExcel = async (rowsToDownload: UserRequest[]) => {
    try {
      if (!rowsToDownload || rowsToDownload.length === 0) {
        alert("No data available to download!");
        return;
      }
      const XLSX = await import('xlsx');

      // Define headers
      const headers = [
        "Date",
        "Request ID",
        "Block Section",
        "Line/Road",
        "Activity",
        "Status",
        "Start Time (HH:MM)",
        "End Time (HH:MM)",
        "Corridor Type",
        "SSE Name",
        "Work Location",
        "Remarks",
      ];

      // Map data to rows
      const rows = rowsToDownload.map((request) => {
        const startTime = request.demandTimeFrom
          ? new Date(request.demandTimeFrom).toISOString().slice(11, 16)
          : "N/A";

        const endTime = request.demandTimeTo
          ? new Date(request.demandTimeTo).toISOString().slice(11, 16)
          : "N/A";

        return [
          formatDate(request.date), // DD-MM-YYYY
          request.divisionId || request.id,
          request.missionBlock,
          request.processedLineSections?.[0]?.road || request.processedLineSections?.[0]?.lineName,
          request.activity,
          getStatusDisplay(request).label,
          startTime,
          endTime,
          request.corridorType,
          request.user?.name || "N/A",
          request.workLocationFrom,
          request.requestremarks,
        ];
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Block Requests");

      // Generate file and trigger download
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `block_requests_${date}.xlsx`);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate Excel file. Please check console for details.");
    }
  };
  // Ensure these match your table's date/time formatting

  // --- Handlers for pending filter changes ---
  // Date
  const handlePendingDateChange = (field: "start" | "end", value: string) => {
    setPendingSummaryFilters((prev) => ({ ...prev, [field]: value }));
  };
  // Block Type
  const handlePendingBlockTypeChange = (value: string) => {
    setPendingSummaryFilters((prev) => ({
      ...prev,
      blockType: prev.blockType.includes(value)
        ? prev.blockType.filter((v) => v !== value)
        : [...prev.blockType, value],
    }));
  };
  // Section
  const handlePendingSectionChange = (value: string) => {
    setPendingSummaryFilters((prev) => ({
      ...prev,
      section: prev.section.includes(value)
        ? prev.section.filter((v) => v !== value)
        : [...prev.section, value],
    }));
  };
  // Dept
  const handlePendingDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingSummaryFilters((prev) => ({ ...prev, dept: e.target.value }));
  };
  // Line
  const handlePendingLineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingSummaryFilters((prev) => ({ ...prev, line: e.target.value }));
  };

  // --- Apply filters on Click to View ---
  const handleApplySummaryFilters = () => {
    setActiveSummaryFilters({ ...pendingSummaryFilters });
    setShowTable(true);
  };

  // --- Filtering logic for summary table ---
  let summaryFilteredRequests = data?.data?.requests || [];
  // Date filter
  if (activeSummaryFilters.start) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => r.date >= activeSummaryFilters.start);
  }
  if (activeSummaryFilters.end) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => r.date <= activeSummaryFilters.end);
  }
  // Block type
  if (activeSummaryFilters.blockType.length > 0) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => activeSummaryFilters.blockType.includes(r.corridorType));
  }
  // Section
  if (activeSummaryFilters.section.length > 0) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => activeSummaryFilters.section.includes(r.selectedSection));
  }
  // Dept
  if (activeSummaryFilters.dept) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => r.selectedDepartment === activeSummaryFilters.dept);
  }
  // Line
  if (activeSummaryFilters.line) {
    summaryFilteredRequests = summaryFilteredRequests.filter((r) => r.selectedLine === activeSummaryFilters.line);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen text-black bg-white p-3 border border-black flex items-center justify-center">
        <div className="text-center py-5">Loading approved requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-3 border border-black flex items-center justify-center">
        <div className="text-center py-5 text-red-600">
          Error loading approved requests. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] max-w-[1366px] mx-auto px-2 pb-32 relative">
      {/* Top Yellow Bar */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span className="text-[24px] font-bold text-[#B57CF6] tracking-widest">
          RBMS-MAS-DIVIN
        </span>
      </div>
      {/* Main Title on Light Blue */}
      <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
        <span className="text-[24px] md:text-3xl font-bold text-black text-center">
          Traffic Controller
        </span>
      </div>

      {/* Requests Pending With Me CTA */}
      <div className="flex justify-center mt-8 mb-6">
        <div className="w-full max-w-2xl rounded-2xl border-4 border-[#FFB3B3] bg-[#FFF0F0] shadow-lg p-0">
          <div className="text-[24px] font-bold text-[#B22222] text-center py-3 tracking-wide">
            REQUESTS PENDING WITH ME
          </div>
          <div className="italic text-center text-[24px] text-[#B22222] pb-2">
            (Click to view and optimise)
          </div>
          <div className="flex justify-center items-center gap-6 py-4">
            <div className="flex items-center gap-2 bg-[#FFB3B3] text-[#B22222] font-bold px-6 py-2 rounded border-2 border-[#FF6B6B] text-[20px]">
              <span>Nos.</span>
              <span>{pendingWithMeCount}</span>
            </div>
            <Link
              href="/admin/optimise-table"
              className="bg-[#FFF0F0] border-2 border-[#FF6B6B] px-8 py-2 rounded text-[24px] font-bold text-[#B22222] hover:bg-[#FFD6D6] shadow transition"
            >
              Click to View
            </Link>
            <div className="relative">
              <select
                className="bg-[#FFB3B3] border-2 border-[#FF6B6B] px-3 py-2 rounded text-md font-semibold cursor-pointer focus:outline-none appearance-none pr-6 text-[#B22222]"
                value={pendingDept}
                onChange={e => setPendingDept(e.target.value)}
              >
                <option value="">DEPT</option>
                <option value="ENGG">ENGG</option>
                <option value="S&T">S&T</option>
                <option value="TRD">TRD</option>
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-[#B22222] text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Summary of Upcoming Blocks CTA */}
      <div className="flex justify-center mb-8">
        <div className="w-full max-w-4xl rounded-2xl border-4 border-[#00B4D8] bg-[#CAF0F8] shadow-lg p-0">
          <div className="text-[24px] font-bold text-[#0077B6] text-center py-3 tracking-wide">
            View Summary of Upcoming Blocks
          </div>
          <div className="px-6 pb-4">
            {/* Filters Row: All filters in a single row */}
            <div className="flex flex-wrap gap-2 items-center justify-between bg-[#D6F3FF] p-2 rounded-md border border-[#00B4D8] mb-2">
              {/* Date Range */}
              <div className="flex items-center gap-1">
                <span className="bg-[#E6E6FA] px-2 py-1 border border-[#00B4D8] font-bold text-black rounded-l-md text-[24px]">
                  date
                </span>
                <input
                  type="date"
                  value={pendingSummaryFilters.start}
                  onChange={(e) => handlePendingDateChange('start', e.target.value)}
                  className="p-1 border border-[#00B4D8] text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-[24px]"
                />
                <span className="px-1 text-black text-[24px]">to</span>
                <input
                  type="date"
                  value={pendingSummaryFilters.end}
                  onChange={(e) => handlePendingDateChange('end', e.target.value)}
                  className="p-1 border border-[#00B4D8] text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-[24px]"
                />
              </div>
              {/* Block Type Dropdown (Radio) */}
              <div className="relative inline-block">
                <button
                  onClick={() => setBlockTypeDropdownOpen((v) => !v)}
                  className="bg-[#E6E6FA] px-3 py-1 rounded-full border-2 border-[#00B4D8] font-semibold text-black flex items-center gap-2 text-[24px]"
                >
                  Type
                  <span className="ml-1 text-sm">▼</span>
                </button>
                {blockTypeDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-40 bg-white border-2 border-[#00B4D8] rounded shadow-lg">
                    {blockTypeOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-[20px]"
                      >
                        <input
                          type="checkbox"
                          checked={pendingSummaryFilters.blockType.includes(opt.value)}
                          onChange={() => handlePendingBlockTypeChange(opt.value)}
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
                  onClick={() => setSectionDropdownOpen((v) => !v)}
                  className="bg-[#B2F3F5] px-3 py-1 rounded-full border-2 border-[#00B4D8] font-semibold text-black flex items-center gap-2 text-[24px]"
                >
                  Section
                  <span className="ml-1 text-sm">▼</span>
                </button>
                {sectionDropdownOpen && (
                  <div className="absolute z-50 mt-2 w-40 bg-white border-2 border-[#00B4D8] rounded shadow-lg max-h-60 overflow-y-auto">
                    {sectionOptions.map((section) => (
                      <label
                        key={section}
                        className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-[20px]"
                      >
                        <input
                          type="checkbox"
                          checked={pendingSummaryFilters.section.includes(section)}
                          onChange={() => handlePendingSectionChange(section)}
                          className="mr-2 accent-[#B57CF6]"
                        />
                        {section}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* Dept Dropdown */}
              <div className="relative inline-block">
                <select
                  className="bg-[#00B4D8] border-2 border-[#00B4D8] px-2 py-1 rounded text-[24px] font-semibold cursor-pointer focus:outline-none appearance-none pr-6 text-white min-w-[80px]"
                  value={pendingSummaryFilters.dept}
                  onChange={handlePendingDeptChange}
                >
                  <option value="">DEPT</option>
                  <option value="ENGG">ENGG</option>
                  <option value="S&T">S&T</option>
                  <option value="TRD">TRD</option>
                </select>
                <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs">
                  ▼
                </div>
              </div>
              {/* Click to View Button (moved here) */}
              <div className="flex-grow flex justify-center">
                <button
                  className="bg-[#00B4D8] border-2 border-[#0077B6] px-6 py-2 rounded text-[24px] font-bold text-white hover:bg-[#48CAE4] shadow transition "
                  onClick={handleApplySummaryFilters}
                >
                  Click to View
                </button>
              </div>
            </div>
            {/* Table only shows after clicking Click to View */}
            {showTable && (
              <div className="mx-2 overflow-x-auto">
                <div className="max-h-[60vh] overflow-y-auto border-2 border-[#00B4D8] rounded-lg bg-white">
                  <table className="w-full text-black text-[24px] relative">
                    <thead>
                      <tr className="bg-[#e49edd] text-black">
                        <th className="border-2 border-black p-1">Date</th>
                        <th className="border-2 border-black p-1">ID</th>
                        <th className="border-2 border-black p-1">Block Section</th>
                        <th className="border-2 border-black p-1">Demanded</th>
                        <th className="border-2 border-black p-1">Offered</th>
                        <th className="border-2 border-black p-1">Block Type</th>
                        <th className="border-2 border-black p-1">
                          Line/Road
                        </th>
                        <th className="border-2 border-black p-1">Activity</th>
                        <th className="border-2 border-black p-1 sticky right-0 z-10 bg-[#e49edd]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryFilteredRequests.map((request: UserRequest, idx: number) => {
                        const status = getStatusDisplay(request);
                        return (
                          <tr
                            key={request.id}
                            className={idx % 2 === 0 ? "bg-[#FFC0CB]" : "bg-white"}
                          >
                            <td className="border border-black p-1 text-center">
                              {dayjs(request.date).format("DD-MM-YY")}
                            </td>
                            <td className="border border-black p-1 text-center">
                              <Link
                                href={`/admin/optimise-table?id=${request.id}`}
                                className="text-[#13529e] hover:underline font-semibold"
                              >
                                {request.divisionId || request.id}
                              </Link>
                            </td>
                            <td className="border border-black p-1">
                              {request.missionBlock}
                            </td>
                            <td className="border border-black p-1">
                              {formatTime(request.demandTimeFrom)} -{" "}
                              {formatTime(request.demandTimeTo)}
                            </td>
                            <td className="border border-black p-1">
                              {`${formatTime(
                                request.sanctionedTimeFrom || request.optimizeTimeFrom
                              )} - ${formatTime(
                                request.sanctionedTimeTo || request.optimizeTimeTo
                              )}`}
                            </td>
                            <td className="border border-black p-1">
                              {request.corridorType}
                            </td>
                            <td className="border border-black p-1 text-center">
                              {request.processedLineSections?.[0]?.lineName ||
                                request.processedLineSections?.[0]?.road ||
                                "N/A"}
                            </td>
                            <td className="border border-black p-1">
                              {request.activity}
                            </td>
                            <td
                              className="border border-black p-1 sticky right-0 z-10 text-center font-bold"
                              style={status.style}
                            >
                              <span className="w-full block text-base">
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Texts */}
      <div className="text-center mt-1 mb-32">
        <h3
          className="inline-flex bg-[#cfd4ff] py-1 px-6 rounded-full text-black text-base font-medium mb-2 text-[24px]"
        >
          Click ID to see details of a Block.
        </h3>
        <h3
          className="bg-[#cfd4ff] rounded-full py-2 px-4 text-black text-[24px] font-medium"
        >
          For printing the complete table, click to download in{' '}
          <span className="font-bold text-[#00B4D8] text-[24px]">.xlsx format</span>
        </h3>
      </div>

      {/* Sticky Action Bar at Bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t-2 border-[#A084E8] py-4 flex justify-center gap-8 z-50 shadow-xl">
        <button
          onClick={() => handleDownloadExcel(summaryFilteredRequests)}
          className="bg-[#FFA07A] hover:bg-[#FFBFAE] px-12 py-3 rounded-lg border-2 border-[#FF6B6B] font-bold text-[24px] text-[#5D3587] shadow transition"
        >
          Download
        </button>
        <Link
          href="/dashboard"
          className="bg-[#90EE90] hover:bg-[#B6FFB6] px-12 py-3 rounded-lg border-2 border-[#00B894] font-bold text-[24px] text-[#0077B6] shadow transition flex items-center justify-center"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
