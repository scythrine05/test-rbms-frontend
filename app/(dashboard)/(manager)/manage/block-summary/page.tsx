"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/app/service/api/manager";
import dayjs from "dayjs";

export default function BlockSummaryPage() {
    const { data: session } = useSession();
    const [dateRange, setDateRange] = useState({
        start: '',
        end: ''
    });
    const [showTable, setShowTable] = useState(false);

    // Fetch all requests beneath this manager (optionally filter by date)
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["block-summary", dateRange],
        queryFn: async () => {
            return await managerService.getUserRequestsByManager(
                1,
                10000,
                dateRange.start || undefined,
                dateRange.end || undefined
            );
        },
        enabled: false // Only fetch on submit
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowTable(true);
        refetch();
    };

    return (
        <div className="min-h-screen bg-[#FFFDF5] max-w-[1366px] mx-auto px-2 pb-32">
            {/* Top Bar */}
            <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
                <span className="text-[24px] font-bold text-[#B57CF6] tracking-widest">RBMS-MAS-DIVIN</span>
            </div>
            <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
                <span className="text-[24px] md:text-3xl font-bold text-black text-center">Block Summary Report</span>
            </div>
            <div className="w-full bg-[#D6F3FF] py-2 flex flex-col items-center">
                <span className="text-[24px] font-bold text-black">{session?.user?.department || "..."} Department</span>
            </div>
            {/* Date Range Filter */}
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center justify-center mt-6 mb-4">
                <label className="text-[20px] font-semibold text-black">From</label>
                <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                    className="p-1 border border-black text-black bg-white rounded"
                />
                <label className="text-[20px] font-semibold text-black">To</label>
                <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                    className="p-1 border border-black text-black bg-white rounded"
                />
                <button type="submit" className="bg-[#FFB74D] border border-black px-6 py-1.5 rounded text-[20px] font-bold text-black hover:bg-[#FFA726]">Generate</button>
            </form>
            {/* Table */}
            {showTable && (
                <div className="overflow-x-auto rounded-xl mx-2 mb-2 mt-4">
                    {isLoading ? (
                        <div className="text-center py-8 text-lg font-bold">Loading...</div>
                    ) : error ? (
                        <div className="text-center py-8 text-lg font-bold text-red-600">Error loading data</div>
                    ) : (
                        <table className="w-full border border-black rounded-xl overflow-hidden text-[20px]">
                            <thead>
                                <tr className="bg-[#D6F3FF] text-black">
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">Date</th>
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">ID</th>
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">Block Section</th>
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">Line/Road</th>
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">Activity</th>
                                    <th className="border border-black px-2 py-1 whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.data?.requests?.map((request: any, idx: number) => (
                                    <tr key={request.id} className={idx % 2 === 0 ? "bg-[#FFF86B]" : "bg-[#E6E6FA]"}>
                                        <td className="border border-black px-2 py-1 text-center text-black">{dayjs(request.date).format("DD-MM-YY")}</td>
                                        <td className="border border-black px-2 py-1 text-center text-black">{request.id.slice(-4)}</td>
                                        <td className="border border-black px-2 py-1 text-black">{request.missionBlock}</td>
                                        <td className="border border-black px-2 py-1 text-center text-black">{request.processedLineSections?.[0]?.lineName || 'N/A'}</td>
                                        <td className="border border-black px-2 py-1 text-black">{request.activity}</td>
                                        <td className="border border-black px-2 py-1 text-center text-black">{request.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            {/* Footer Buttons */}
            <div className="flex justify-center gap-3 mb-2 mt-8">
                <Link href="/dashboard" className="flex items-center gap-1 bg-lime-300 border border-black px-4 py-1.5 rounded text-lg font-bold" style={{color:"black"}}>
                    <span className="text-xl">🏠</span> Home
                </Link>
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-1 bg-[#E6E6FA] border border-black px-4 py-1.5 rounded text-lg font-bold" style={{color:"black"}}
                >
                    <span className="text-xl">⬅️</span> Back
                </button>
            </div>
            <div className="text-[10px] text-gray-600 border-t border-black pt-1 text-right">
                © {new Date().getFullYear()} Indian Railways
            </div>
        </div>
    );
} 