"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";

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
    if (request.status === "APPROVED" && !request.isSanctioned && request.adminRequestStatus!=="REJECTED") {
      return {
        label: "Pending with me",
        style: { background: "#d47ed4", color: "#222" },
      };
    }
    if (request.status === "REJECTED" ||request.adminRequestStatus==="REJECTED") {
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

  // Count of pending with me
  const pendingWithMeCount = filteredRequests.filter(
    (r: UserRequest) => r.status === "APPROVED" && !r.isSanctioned
  ).length;

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


const handleDownloadExcel =async () => {
  try {
    if (!filteredRequests || filteredRequests.length === 0) {
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
    const rows = filteredRequests.map((request) => {
      const startTime = request.demandTimeFrom
        ? new Date(request.demandTimeFrom).toISOString().slice(11, 16)
        : "N/A";

      const endTime = request.demandTimeTo
        ? new Date(request.demandTimeTo).toISOString().slice(11, 16)
        : "N/A";

      return [
        formatDate(request.date), // DD-MM-YYYY
        request.divisionId||request.id,
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
    <div className="min-h-screen bg-[#FFFDF5] max-w-[1366px] mx-auto px-2 pb-32">
      {/* Top Yellow Bar */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">
          RBMS
        </span>
      </div>
      {/* Main Title on Light Blue */}
      <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
        <span className="text-2xl md:text-3xl font-bold text-black text-center">
          Traffic Controller(Blocks)
        </span>
        {/* <div className="w-full flex justify-center mt-3">
          <h1
            className="bg-[#cfd4ff] py-1 px-6 rounded-full font-bold text-center"
            style={{ width: "600px" }}
          >
            Block Details
          </h1>
        </div> */}
      </div>

      {/* Summary Box */}
      <div className="flex justify-center mt-3 mb-6">
        <div className="w-full rounded-2xl border-2 border-[#B5B5B5] bg-[#F5E7B2] shadow p-0">
          <div className="text-xl font-bold text-black text-center py-2">
            REQUESTS PENDING WITH ME
          </div>
          <div className="italic text-center text-sm text-black pb-2">
            (Click to view and optimise)
          </div>
          <div className="flex justify-center items-center gap-4 py-2">
            <div className="bg-[#FF6B6B] text-black font-bold px-6 py-2 rounded border border-black">
              Nos. {pendingWithMeCount}
            </div>
            <Link
              href="/admin/optimise-table"
              className="bg-[#B2F3F5] border border-black px-6 py-2 rounded text-lg font-bold hover:bg-[#D6F3FF]"
            >
              Click to View
            </Link>
            <div className="relative">
  <select
    className="bg-[#FF6B6B] border border-black px-2 py-1 rounded text-sm font-semibold cursor-pointer focus:outline-none appearance-none pr-6"
  >
    <option value="">DEPT</option>
    <option value="ENGG">ENGG</option>
    <option value="S&T">S&T</option>
    <option value="TRD">TRD</option>
  </select>
  <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-black text-xs">
    ▼
  </div>
</div>

          </div>
          
        </div>
      </div>
      {/* Filters Row: All filters in a single row */}
      <div className="mx-4 mt-4 flex flex-wrap gap-2 items-center justify-between bg-[#D6F3FF] p-2 rounded-md border border-black">
        {/* Date Range */}
        <div className="flex items-center gap-1">
          <span className="bg-[#E6E6FA] px-2 py-1 border border-black font-bold text-black rounded-l-md text-xs">
            Custom view
          </span>
          <input
            type="date"
            value={customDateRange.start}
            onChange={(e) =>
              setCustomDateRange((r) => ({ ...r, start: e.target.value }))
            }
            className="p-1 border border-black text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
          <span className="px-1 text-black text-xs">to</span>
          <input
            type="date"
            value={customDateRange.end}
            onChange={(e) =>
              setCustomDateRange((r) => ({ ...r, end: e.target.value }))
            }
            className="p-1 border border-black text-black bg-white w-28 focus:outline-none focus:ring-2 focus:ring-[#B57CF6] text-xs"
          />
        </div>
        {/* Block Type Dropdown (Radio) */}

        <div className="relative inline-block">
          <button
            onClick={() => setBlockTypeDropdownOpen((v) => !v)}
            className="bg-[#E6E6FA] px-3 py-1 rounded-full border-2 border-black font-semibold text-black flex items-center gap-2 text-xs"
          >
            Block Type:{" "}
            {blockType.length === 0 ? "All" : `${blockType.length} selected`}
            <span className="ml-1">▼</span>
          </button>
          {blockTypeDropdownOpen && (
            <div className="absolute z-10 mt-2 w-40 bg-white border-2 border-black rounded shadow-lg">
              {blockTypeOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-xs"
                >
                  <input
                    type="checkbox"
                    checked={blockType.includes(opt.value)}
                    onChange={() =>
                      setBlockType((prev) =>
                        prev.includes(opt.value)
                          ? prev.filter((s) => s !== opt.value)
                          : [...prev, opt.value]
                      )
                    }
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
            className="bg-[#B2F3F5] px-3 py-1 rounded-full border-2 border-black font-semibold text-black flex items-center gap-2 text-xs"
          >
            Section:{" "}
            {selectedSections.length === 0
              ? "All"
              : `${selectedSections.length} selected`}
            <span className="ml-1">▼</span>
          </button>
          {sectionDropdownOpen && (
            <div className="absolute z-50 mt-2 w-40 bg-white border-2 border-black rounded shadow-lg max-h-60 overflow-y-auto">
              {sectionOptions.map((section) => (
                <label
                  key={section}
                  className="flex items-center px-3 py-2 cursor-pointer hover:bg-[#D6F3FF] text-black text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section)}
                    onChange={() =>
                      setSelectedSections((prev) =>
                        prev.includes(section)
                          ? prev.filter((s) => s !== section)
                          : [...prev, section]
                      )
                    }
                    className="mr-2 accent-[#B57CF6]"
                  />
                  {section}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-center">
        <h1
          style={{
            background: "#cfd4ff",
            color: "black",
            width: "98%",
            margin: "0 auto",
            padding: "0 10px",
            borderRadius: "1px",
            height: "50px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          View Summary of Upcomming Block Request
        </h1>
        <div
          style={{
            display: "flex",
            width: "98%",
            margin: "0 auto 1px auto",
            backgroundColor: "#c1f0c8",
            padding: "8px 10px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Fixed Date Range - doesn't scroll */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              marginRight: "15px",
              position: "relative",
              zIndex: 2,
            }}
          >
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange((r) => ({ ...r, start: e.target.value }))
              }
              style={{
                padding: "2px",
                border: "1px solid black",
                width: "90px",
                fontSize: "12px",
                height: "22px",
                backgroundColor: "white",
                color: "black",
              }}
              disabled
            />
            <span style={{ padding: "0 3px", color: "black" }}>to</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange((r) => ({ ...r, end: e.target.value }))
              }
              style={{
                padding: "2px",
                border: "1px solid black",
                width: "90px",
                fontSize: "12px",
                height: "22px",
                backgroundColor: "white",
                color: "black",
              }}
              disabled
            />
          </div>

          {/* Scrollable Filter Fields */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              fontSize: "12px",
              overflowX: "auto",
              flexGrow: 1,
              paddingLeft: "10px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <span
                style={{
                  fontWeight: "bold",
                  marginRight: "2px",
                  color: "black",
                }}
              >
                Type:
              </span>
              <span style={{ color: "black" }}>{type.join(", ")}</span>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <span
                style={{
                  fontWeight: "bold",
                  marginRight: "2px",
                  color: "black",
                }}
              >
                Section:
              </span>
              <span style={{ color: "black" }}>{section.join(", ")}</span>
            </div>

            {/* <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      <span style={{ fontWeight: "bold", marginRight: "2px" }}>SSE:</span>
      <span>{sse.join(", ")}</span>
    </div> */}
          </div>

          {/* Hide scrollbar (for Chrome/Safari) */}
          <style>{`
    div::-webkit-scrollbar {
      display: none;
    }
  `}</style>
        </div>
      </div>

      <div className="mx-2  overflow-x-auto">
        <div className="max-h-[60vh] overflow-y-auto border-2 border-black rounded-lg bg-white">
          <table className="w-full text-black text-sm relative">
            <thead>
              <tr className="bg-[#e49edd] text-black">
                <th className="border-2 border-black p-1">Date</th>
                <th className="border-2 border-black p-1">ID</th>
                <th className="border-2 border-black p-1">Block Section</th>
                <th className="border-2 border-black p-1">Demanded Time</th>
                <th className="border-2 border-black p-1">Sanctioned Time</th>
                <th className="border-2 border-black p-1">Block Type</th>
                <th className="border-2 border-black p-1">
                  UP/DN/SL/RO AD NO.
                </th>
                <th className="border-2 border-black p-1">Activity</th>
                <th className="border-2 border-black p-1 sticky right-0 z-10 bg-[#e49edd]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request: UserRequest, idx: number) => {
                const status = getStatusDisplay(request);
                return (
                  <tr
                    key={request.id}
                    className={idx % 2 === 0 ? "bg-[#FFC0CB]" : "bg-white"}
                  >
                    <td className="border border-black p-1 text-center">
                      {formatDate(request.date)}
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
      <div className="text-center mt-1">
        <h3
          className="inline-flex bg-[#cfd4ff]  py-1 px-6 rounded-full"
          style={{ color: "black" }}
        >
          Click ID to see details of a Block.
        </h3>
        <h3
          className="bg-[#cfd4ff]  mt-1 rounded-full py-2"
          style={{ color: "black" }}
        >
          For printing the complete table, click to download in{" "}
          <span className="font-bold" style={{ color: "#5ec4e2" }}>
            .xlsx format
          </span>
        </h3>
      </div>

      {/* Action Buttons below the scrollable window */}
      <div className="mx-4 mt-6 mb-8 flex justify-center gap-4">
        <button
          onClick={handleDownloadExcel}
          className="bg-[#FFA07A] px-8 py-2 rounded-lg border-2 border-black font-bold"
        >
          Download
        </button>
        <Link
          href="/dashboard"
          className="bg-[#90EE90] px-8 py-2 rounded-lg border-2 border-black font-bold"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
