"use client";
import React from "react";
import { useGetUserRequests } from "@/app/service/query/user-request";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/ui/Loader";
import { extractTimeFromDatetime } from "@/app/lib/helper";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";

export default function EditRequestsPage() {
    const router = useRouter();
    const { data: requests, isLoading } = useGetUserRequests();
    const { data: session } = useSession();

    const getDuration = (from: string, to: string) => {
        if (!from || !to) return "-";
        const [fromHours, fromMinutes] = from.split(":").map(Number);
        const [toHours, toMinutes] = to.split(":").map(Number);
        const fromTotal = fromHours * 60 + fromMinutes;
        const toTotal = toHours * 60 + toMinutes;
        const diff = toTotal - fromTotal;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return `${hours}h ${minutes}m`;
    };

    if (isLoading) {
        return (
            <div>
                <Loader name="Loading Block Requests" />
            </div>
        );
    }

    // Filter requests to only those made by the logged-in user
    const userId = session?.user?.id;
    const allRequests = Array.isArray(requests?.data?.requests) ? requests.data.requests : [];
    const now = new Date();
    let userRequests = allRequests.filter((req: any) => {
        const blockDate = new Date(req.date);
        return req.userId === userId && blockDate > now;
    });
    userRequests = userRequests.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Helper to check if a request is editable (more than 3 days from now)
    const isEditable = (dateStr: string) => {
        const blockDate = new Date(dateStr);
        const diffDays = (blockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays > 3;
    };

    // Placeholder cancel handler
    const handleCancel = (id: string) => {
        alert(`Cancel request ${id}`);
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#fcfaf3]">
            <div className="w-full max-w-6xl mx-auto mt-4">
                {/* Header */}
                <div className="text-center bg-[#f7f7a1] rounded-t-2xl p-4 border-b-2 border-[#b6f7e6]">
                    <span className="text-4xl font-extrabold text-[#b07be0]">RBMS</span>
                </div>
                <div className="bg-[#c6e6f7] rounded-b-2xl p-6">
                    <h1 className="text-2xl font-bold text-center mb-6">Edit/Cancel Previous Block Requests</h1>

                    {/* Responsive List/Table */}
                    <div className="max-h-[60vh] w-full overflow-x-auto">
                        {userRequests.length === 0 ? (
                            <div className="text-center text-gray-600 py-8">No block requests found for your account.</div>
                        ) : (
                            <div className="w-full min-w-[600px]">
                                <table className="min-w-full border-collapse border border-black text-sm text-black rounded-xl overflow-hidden">
                                    <thead className="bg-[#f7d6f7] sticky top-0 z-10">
                                        <tr>
                                            <th className="p-2 text-left" style={{ minWidth: 90 }}>Date</th>
                                            <th className="p-2 text-left" style={{ minWidth: 50 }}>ID</th>
                                            <th className="p-2 text-left" style={{ minWidth: 100 }}>Block Section</th>
                                            <th className="p-2 text-left" style={{ minWidth: 120 }}>UP/DN/SL/Road</th>
                                            <th className="p-2 text-left" style={{ minWidth: 70 }}>Duration</th>
                                            <th className="p-2 text-left" style={{ minWidth: 60 }}>Edit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="overflow-y-auto">
                                        {userRequests.map((request: any) => (
                                            <tr key={request.id} className="border-b border-black hover:bg-gray-50">
                                                <td className="p-2 whitespace-nowrap">{dayjs(request.date).format("DD-MM-YYYY")}</td>
                                                <td className="p-2">
                                                    <button
                                                        onClick={() => router.push(`/edit-request/${request.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 underline text-xs px-1 py-0.5 rounded"
                                                        style={{ minWidth: 0 }}
                                                    >
                                                        {request.id.slice(0, 6)}
                                                    </button>
                                                </td>
                                                <td className="p-2 truncate">{request.missionBlock || "-"}</td>
                                                <td className="p-2 truncate">
                                                    {request.processedLineSections?.map((section: any) =>
                                                        section.lineName || section.road
                                                    ).join(", ") || "-"}
                                                </td>
                                                <td className="p-2 whitespace-nowrap">
                                                    {getDuration(
                                                        extractTimeFromDatetime(request.demandTimeFrom || ""),
                                                        extractTimeFromDatetime(request.demandTimeTo || "")
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {isEditable(request.date) ? (
                                                        <button
                                                            onClick={() => router.push(`/edit-request/${request.id}`)}
                                                            className="bg-[#b7b7f7] text-black px-2 py-1 rounded border border-black text-xs hover:bg-[#e6e6fa] transition"
                                                            style={{ minWidth: 0 }}
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCancel(request.id)}
                                                            className="bg-[#ffb7b7] text-black px-2 py-1 rounded border border-black text-xs hover:bg-[#ffcccc] transition"
                                                            style={{ minWidth: 0 }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button
                            className="flex items-center gap-2 bg-[#e6e6fa] border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
                            onClick={() => router.back()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2} className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <button
                            className="flex items-center gap-2 bg-lime-300 border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
                            onClick={() => router.push('/dashboard')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} className="w-6 h-6">
                                <rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" />
                                <path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" />
                            </svg>
                            Home
                        </button>
                        <button
                            className="flex items-center gap-2 bg-[#ffb347] border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
                            onClick={() => router.push('/auth/logout')}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 