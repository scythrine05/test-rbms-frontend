"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/app/service/api/manager";
import { useAcceptRequest, useRejectRequest, useBulkAcceptRequests, useBulkRejectRequests } from "@/app/service/mutation/manager";
import { toast } from "react-hot-toast";
import { notFound } from "next/navigation";

export default function PendingRequestsPage() {
    const { data: session } = useSession();
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [requestToReject, setRequestToReject] = useState<string | null>(null);

    // Fetch pending requests
    const { data, isLoading, error } = useQuery({
        queryKey: ["pendingRequests"],
        queryFn: async () => {
            try {
                console.log("Fetching pending requests...");
                const result = await managerService.getPendingRequests();
                console.log("Pending requests result:", result);
                return result;
            } catch (err) {
                console.error("Error fetching pending requests:", err);
                throw err;
            }
        }
    });

    // Defensive: log the data object
    console.log("Pending requests page data:", data);

    // Defensive: get requests array safely
    const pendingRequests = Array.isArray(data?.data?.requests) ? data.data.requests : [];

    // Mutations
    const acceptRequest = useAcceptRequest();
    const rejectRequest = useRejectRequest();
    const bulkAcceptRequests = useBulkAcceptRequests();
    const bulkRejectRequests = useBulkRejectRequests();

    // Handle bulk actions
    const handleSelectAll = () => {
        if (selectedRequests.size === pendingRequests.length) {
            setSelectedRequests(new Set());
        } else {
            setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
        }
    };

    const handleSelectRequest = (id: string) => {
        const newSelected = new Set(selectedRequests);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRequests(newSelected);
    };

    const handleAccept = async (id: string) => {
        try {
            await acceptRequest.mutateAsync(id);
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleReject = async (id: string) => {
        setRequestToReject(id);
        setShowRejectModal(true);
    };

    const handleBulkAccept = async () => {
        try {
            await bulkAcceptRequests.mutateAsync(Array.from(selectedRequests));
            setSelectedRequests(new Set());
        } catch (error) {
            console.error('Error accepting requests:', error);
        }
    };

    const handleBulkReject = async () => {
        setRequestToReject('bulk');
        setShowRejectModal(true);
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            if (requestToReject === 'bulk') {
                await bulkRejectRequests.mutateAsync({
                    ids: Array.from(selectedRequests),
                    reason: rejectReason
                });
                setSelectedRequests(new Set());
            } else if (requestToReject) {
                await rejectRequest.mutateAsync({
                    id: requestToReject,
                    reason: rejectReason
                });
            }
            setShowRejectModal(false);
            setRejectReason("");
            setRequestToReject(null);
        } catch (error) {
            console.error('Error rejecting request(s):', error);
        }
    };

    // Status mapping function for pending requests
    function getPendingDisplayStatus(request: any) {
        if (!request.managerAcceptance) {
            return { label: 'Pending with me', className: 'bg-fuchsia-300 text-fuchsia-900 border-fuchsia-400' };
        }
        if (request.managerAcceptance && (request.adminRequestStatus === 'PENDING' || !request.isSanctioned)) {
            return { label: 'Pending with Optg', className: 'bg-yellow-200 text-yellow-900 border-yellow-400' };
        }
        // Fallback
        return { label: request.status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
                <div className="text-2xl font-bold">Loading...</div>
            </div>
        );
    }

    if (error) {
        notFound();
    }

    if (!isLoading && !error && pendingRequests.length === 0) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#FFFDF5]">
            {/* Top Yellow Bar */}
            <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
                <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">RBMS</span>
            </div>

            {/* Main Title on Light Blue */}
            <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
                <span className="text-2xl md:text-3xl font-bold text-black text-center">Requests Pending With Me</span>
            </div>

            {/* Department Name */}
            <div className="w-full bg-[#D6F3FF] py-2 flex flex-col items-center">
                <span className="text-xl font-bold text-black">{session?.user?.department || "..."} Department</span>
            </div>

            {/* Bulk Actions */}
            <div className="mx-4 mt-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                    />
                    <span className="text-sm text-gray-700">Select All</span>
                </div>
                {selectedRequests.size > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkAccept}
                            disabled={bulkAcceptRequests.isPending}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {bulkAcceptRequests.isPending ? "Processing..." : `Approve Selected (${selectedRequests.size})`}
                        </button>
                        <button
                            onClick={handleBulkReject}
                            disabled={bulkRejectRequests.isPending}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {bulkRejectRequests.isPending ? "Processing..." : `Reject Selected (${selectedRequests.size})`}
                        </button>
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className="mx-4 mt-6 overflow-x-auto">
                <table className="w-full border-2 border-black">
                    <thead>
                        <tr className="bg-[#E8F4F8]">
                            <th className="border-2 border-black p-2 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                                />
                            </th>
                            <th className="border-2 border-black p-2">Date</th>
                            <th className="border-2 border-black p-2">ID</th>
                            <th className="border-2 border-black p-2">Block Section</th>
                            <th className="border-2 border-black p-2">UP/DN/SL/RO AD NO.</th>
                            <th className="border-2 border-black p-2">Duration</th>
                            <th className="border-2 border-black p-2">Activity</th>
                            <th className="border-2 border-black p-2">Status</th>
                            <th className="border-2 border-black p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingRequests.map((request: any) => (
                            <tr key={request.id} className="bg-white">
                                <td className="border border-black p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedRequests.has(request.id)}
                                        onChange={() => handleSelectRequest(request.id)}
                                        className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                                    />
                                </td>
                                <td className="border border-black p-2 text-center">{format(new Date(request.date), "dd-MM-yyyy")}</td>
                                <td className="border border-black p-2 text-center">
                                    <Link href={`/manage/view-request/${request.id}`} className="text-blue-600 hover:underline">
                                        {request.id}
                                    </Link>
                                </td>
                                <td className="border border-black p-2">{request.blockSection}</td>
                                <td className="border border-black p-2 text-center">{request.lineDirection}</td>
                                <td className="border border-black p-2 text-center">{request.duration}</td>
                                <td className="border border-black p-2">{request.activity}</td>
                                <td className="border border-black p-2 text-center">
                                    {(() => {
                                        const status = getPendingDisplayStatus(request);
                                        return (
                                            <span className={`px-2 py-1 text-xs rounded-full border ${status.className}`}>{status.label}</span>
                                        );
                                    })()}
                                </td>
                                <td className="border border-black p-2 text-center">
                                    <div className="flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleAccept(request.id)}
                                            disabled={acceptRequest.isPending}
                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(request.id)}
                                            disabled={rejectRequest.isPending}
                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Action Buttons */}
            <div className="mx-4 mt-6 mb-8 flex justify-center gap-4">
                <button className="bg-[#FFA07A] px-8 py-2 rounded-lg border-2 border-black font-bold">
                    Download
                </button>
                <Link href="/manage/request-table" className="bg-[#90EE90] px-8 py-2 rounded-lg border-2 border-black font-bold">
                    Back
                </Link>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Reject Request{requestToReject === 'bulk' ? 's' : ''}</h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter reason for rejection"
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                            rows={4}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason("");
                                    setRequestToReject(null);
                                }}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReject}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 