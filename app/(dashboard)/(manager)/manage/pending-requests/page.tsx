// "use client";

// import { useState } from "react";
// import { useSession } from "next-auth/react";
// import Link from "next/link";
// import { format } from "date-fns";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { managerService, UserRequest } from "@/app/service/api/manager";
// import { useBulkAcceptRequests, useBulkRejectRequests } from "@/app/service/mutation/manager";
// import { toast } from "react-hot-toast";
// import { notFound } from "next/navigation";

// export default function PendingRequestsPage() {
//     const { data: session } = useSession();
//     const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
//     const [showRejectModal, setShowRejectModal] = useState(false);
//     const [rejectReason, setRejectReason] = useState("");
//     const [requestToReject, setRequestToReject] = useState<string | null>(null);
//     const [showSuccessModal, setShowSuccessModal] = useState<null | string>(null);

//     // Fetch all requests (same as request-table)
//     const { data, isLoading, error } = useQuery({
//         queryKey: ["pendingRequests"],
//         queryFn: async () => {
//             try {
//                 const result = await managerService.getUserRequestsByManager(1, 10000);
//                 return result;
//             } catch (err) {
//                 console.error("Error fetching requests:", err);
//                 throw err;
//             }
//         }
//     });

//     // Defensive: get requests array safely and filter for 'Pending with me'
//     const pendingRequests = (Array.isArray(data?.data?.requests) ? data.data.requests : []).filter(
//         (r: UserRequest) => r.status === 'PENDING' && r.managerAcceptance === false
//     );

//     // Mutations
//     const bulkAcceptRequests = useBulkAcceptRequests();
//     const bulkRejectRequests = useBulkRejectRequests();

//     const queryClient = useQueryClient();

//     // Accept mutation
//     const acceptMutation = useMutation({
//         mutationFn: (id: string) => managerService.acceptUserRequest(id, true),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
//             queryClient.invalidateQueries({ queryKey: ["requests"] });
//             setShowSuccessModal("Request accepted successfully");
//         },
//     });
//     // Reject mutation
//     const rejectMutation = useMutation({
//         mutationFn: ({ id, reason }: { id: string; reason: string }) => managerService.acceptUserRequest(id, false, reason),
//         onSuccess: () => {
//             queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
//             queryClient.invalidateQueries({ queryKey: ["requests"] });
//             setShowSuccessModal("Request rejected successfully");
//         },
//     });

//     // Handle bulk actions
//     const handleSelectAll = () => {
//         if (selectedRequests.size === pendingRequests.length) {
//             setSelectedRequests(new Set());
//         } else {
//             setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
//         }
//     };

//     const handleSelectRequest = (id: string) => {
//         const newSelected = new Set(selectedRequests);
//         if (newSelected.has(id)) {
//             newSelected.delete(id);
//         } else {
//             newSelected.add(id);
//         }
//         setSelectedRequests(newSelected);
//     };

//     const handleAccept = async (id: string) => {
//         if (confirm("Are you sure you want to accept this request?")) {
//             await acceptMutation.mutateAsync(id);
//         }
//     };

//     const handleReject = async (id: string) => {
//         setRequestToReject(id);
//         setShowRejectModal(true);
//     };

//     const handleBulkAccept = async () => {
//         try {
//             await bulkAcceptRequests.mutateAsync(Array.from(selectedRequests));
//             setSelectedRequests(new Set());
//         } catch (error) {
//             console.error('Error accepting requests:', error);
//         }
//     };

//     const handleBulkReject = async () => {
//         setRequestToReject('bulk');
//         setShowRejectModal(true);
//     };

//     const submitReject = async () => {
//         if (!rejectReason.trim()) {
//             toast.error('Please provide a reason for rejection');
//             return;
//         }
//         if (requestToReject) {
//             await rejectMutation.mutateAsync({ id: requestToReject, reason: rejectReason });
//             setShowRejectModal(false);
//             setRejectReason("");
//             setRequestToReject(null);
//         }
//     };

//     // Status mapping function for pending requests (same as main table)
//     function getPendingDisplayStatus(request: UserRequest) {
//         if (request.status === 'PENDING' && request.managerAcceptance === false) {
//             return { label: 'Pending with me', style: { background: '#d47ed4', color: '#222' } };
//         }
//         // Fallback
//         return { label: request.status, style: { background: '#fff', color: '#222' } };
//     }

//     // Add formatDate and formatTime helpers (copy from request-table)
//     const formatDate = (dateString: string) => {
//         try {
//             return format(new Date(dateString), "dd-MM-yyyy");
//         } catch {
//             return "Invalid date";
//         }
//     };
//     const formatTime = (dateString: string) => {
//         try {
//             const date = new Date(dateString);
//             if (isNaN(date.getTime())) return "N/A";
//             const hours = date.getUTCHours().toString().padStart(2, '0');
//             const minutes = date.getUTCMinutes().toString().padStart(2, '0');
//             return `${hours}:${minutes}`;
//         } catch {
//             return "N/A";
//         }
//     };

//     if (isLoading) {
//         return (
//             <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center">
//                 <div className="text-2xl font-bold">Loading...</div>
//             </div>
//         );
//     }

//     if (error) {
//         notFound();
//     }

//     if (!isLoading && !error && pendingRequests.length === 0) {
//         notFound();
//     }

//     return (
//         <div className="min-h-screen bg-[#FFFDF5]">
//             {/* Top Yellow Bar */}
//             <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
//                 <span className="text-4xl font-bold text-[#B57CF6] tracking-widest">RBMS</span>
//             </div>

//             {/* Main Title on Light Blue */}
//             <div className="w-full bg-[#D6F3FF] py-3 flex flex-col items-center border-b-2 border-black">
//                 <span className="text-2xl md:text-3xl font-bold text-black text-center">Requests Pending With Me</span>
//             </div>

//             {/* Department Name */}
//             <div className="w-full bg-[#D6F3FF] py-2 flex flex-col items-center">
//                 <span className="text-xl font-bold text-black">{session?.user?.department || "..."} Department</span>
//             </div>

//             {/* Bulk Actions */}
//             <div className="mx-4 mt-6 flex items-center gap-4">
//                 <div className="flex items-center gap-2">
//                     <input
//                         type="checkbox"
//                         checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
//                         onChange={handleSelectAll}
//                         className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
//                     />
//                     <span className="text-sm text-gray-700">Select All</span>
//                 </div>
//                 {selectedRequests.size > 0 && (
//                     <div className="flex gap-2">
//                         <button
//                             onClick={handleBulkAccept}
//                             disabled={bulkAcceptRequests.isPending}
//                             className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
//                         >
//                             {bulkAcceptRequests.isPending ? "Processing..." : `Approve Selected (${selectedRequests.size})`}
//                         </button>
//                         <button
//                             onClick={handleBulkReject}
//                             disabled={bulkRejectRequests.isPending}
//                             className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
//                         >
//                             {bulkRejectRequests.isPending ? "Processing..." : `Reject Selected (${selectedRequests.size})`}
//                         </button>
//                     </div>
//                 )}
//             </div>

//             {/* Table Section */}
//             <div className="mx-4 mt-6 overflow-x-auto">
//                 <div className={`rounded-xl overflow-hidden border-2 border-black bg-[#F5E7B2] min-w-[700px] ${showRejectModal || showSuccessModal ? 'invisible' : ''}`}>
//                     <table className="w-full text-black text-base border-collapse">
//                         <thead>
//                             <tr className="bg-[#D6F3FF] text-black font-bold">
//                                 <th className="border-2 border-black px-2 py-2 w-10 bg-[#D6F3FF]">{/* Checkbox */}
//                                     <input
//                                         type="checkbox"
//                                         checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
//                                         onChange={handleSelectAll}
//                                         className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
//                                     />
//                                 </th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Date</th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">ID</th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Block Section</th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">UP/DN/SL/RO AD NO.</th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Duration</th>
//                                 <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Activity</th>
//                                 <th className="border-2 border-black px-2 py-2 sticky right-0 z-10 bg-[#D6F3FF] w-32">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {pendingRequests.map((request: UserRequest) => (
//                                 <tr key={request.id} className="bg-white hover:bg-[#FFF86B] text-black">
//                                     <td className="border border-black px-2 py-1 text-center align-middle">
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedRequests.has(request.id)}
//                                             onChange={() => handleSelectRequest(request.id)}
//                                             className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
//                                         />
//                                     </td>
//                                     <td className="border border-black px-2 py-1 text-center align-middle">{formatDate(request.date)}</td>
//                                     <td className="border border-black px-2 py-1 text-center align-middle">
//                                         <Link href={`/manage/view-request/${request.id}`} className="text-[#13529e] hover:underline font-semibold">
//                                             {request.id}
//                                         </Link>
//                                     </td>
//                                     <td className="border border-black px-2 py-1 align-middle">{request.missionBlock}</td>
//                                     <td className="border border-black px-2 py-1 text-center align-middle">{request.processedLineSections?.[0]?.lineName || 'N/A'}</td>
//                                     <td className="border border-black px-2 py-1 text-center align-middle">{formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}</td>
//                                     <td className="border border-black px-2 py-1 align-middle">{request.activity}</td>
//                                     <td className="border border-black px-2 py-1 sticky right-0 z-10 bg-[#E6E6FA] text-center align-middle w-32">
//                                         <div className="flex gap-2 justify-center flex-col md:flex-row">
//                                             <button
//                                                 onClick={() => handleAccept(request.id)}
//                                                 disabled={acceptMutation.isPending}
//                                                 className="px-2 py-1 text-xs md:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-bold"
//                                             >
//                                                 Accept
//                                             </button>
//                                             <button
//                                                 onClick={() => handleReject(request.id)}
//                                                 disabled={rejectMutation.isPending}
//                                                 className="px-2 py-1 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-bold"
//                                             >
//                                                 Reject
//                                             </button>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="mx-4 mt-6 mb-8 flex justify-center gap-4">
//                 <button className="bg-[#FFA07A] px-8 py-2 rounded-lg border-2 border-black font-bold">
//                     Download
//                 </button>
//                 <Link href="/manage/request-table" className="bg-[#90EE90] px-8 py-2 rounded-lg border-2 border-black font-bold">
//                     Back
//                 </Link>
//             </div>

//             {/* Reject Modal */}
//             {showRejectModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
//                     <div className="bg-white rounded-lg p-6 max-w-md w-full">
//                         <h3 className="text-lg font-bold mb-4">Reject Request{requestToReject === 'bulk' ? 's' : ''}</h3>
//                         <textarea
//                             value={rejectReason}
//                             onChange={(e) => setRejectReason(e.target.value)}
//                             placeholder="Enter reason for rejection"
//                             className="w-full p-2 border border-gray-300 rounded mb-4"
//                             rows={4}
//                         />
//                         <div className="flex justify-end gap-2">
//                             <button
//                                 onClick={() => {
//                                     setShowRejectModal(false);
//                                     setRejectReason("");
//                                     setRequestToReject(null);
//                                 }}
//                                 className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 onClick={submitReject}
//                                 className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
//                             >
//                                 Reject
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {showSuccessModal && (
//                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//                     <div className="bg-white rounded-lg p-6 max-w-xs w-full flex flex-col items-center">
//                         <div className="text-lg font-bold mb-4 text-center">{showSuccessModal}</div>
//                         <button
//                             onClick={() => setShowSuccessModal(null)}
//                             className="px-6 py-2 text-base bg-green-600 text-white rounded hover:bg-green-700 mt-2 font-bold"
//                         >
//                             OK
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// } 




"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerService, UserRequest } from "@/app/service/api/manager";
import { useBulkAcceptRequests, useBulkRejectRequests } from "@/app/service/mutation/manager";
import { toast } from "react-hot-toast";
import { notFound } from "next/navigation";

export default function PendingRequestsPage() {
    const { data: session } = useSession();
    const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [requestToReject, setRequestToReject] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState<null | string>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Fetch all requests (same as request-table)
    const { data, isLoading, error } = useQuery({
        queryKey: ["pendingRequests"],
        queryFn: async () => {
            try {
                const result = await managerService.getUserRequestsByManager(1, 10000);
                return result;
            } catch (err) {
                console.error("Error fetching requests:", err);
                throw err;
            }
        }
    });

    // Defensive: get requests array safely and filter for 'Pending with me'
    const pendingRequests = (Array.isArray(data?.data?.requests) ? data.data.requests : []).filter(
        (r: UserRequest) => r.status === 'PENDING' && r.managerAcceptance === false
    );

    // Mutations
    const bulkAcceptRequests = useBulkAcceptRequests();
    const bulkRejectRequests = useBulkRejectRequests();

    const queryClient = useQueryClient();

    // Accept mutation - updated with mobileView parameter
    const acceptMutation = useMutation({
        mutationFn: ({ id, isAccept, remark, mobileView }: { id: string; isAccept: boolean; remark?: string; mobileView: boolean }) =>
            managerService.acceptUserRequest(id, isAccept, remark, mobileView),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
            queryClient.invalidateQueries({ queryKey: ["requests"] });
            setShowSuccessModal("Request processed successfully");
        },
        onError: (error) => {
            console.error("Failed to process request:", error);
            toast.error("Failed to process request. Please try again.");
        },
    });

    // Handle accept request
    const handleAccept = async (id: string) => {
        if (confirm("Are you sure you want to accept this request?")) {
            setIsAccepting(true);
            try {
                await acceptMutation.mutateAsync({ 
                    id, 
                    isAccept: true, 
                    remark: "", 
                    mobileView: true 
                });
            } finally {
                setIsAccepting(false);
            }
        }
    };

    // Handle reject request
    const handleReject = async (id: string) => {
        setRequestToReject(id);
        setShowRejectModal(true);
    };

    // Submit rejection with reason
    const submitRejection = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason");
            return;
        }

        if (!requestToReject) return;

        setIsRejecting(true);
        try {
            await acceptMutation.mutateAsync({
                id: requestToReject,
                isAccept: false,
                remark: rejectionReason,
                mobileView: false
            });
            setShowRejectModal(false);
            setRejectionReason("");
            setRequestToReject(null);
        } finally {
            setIsRejecting(false);
        }
    };

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

    // Status mapping function for pending requests (same as main table)
    function getPendingDisplayStatus(request: UserRequest) {
        if (request.status === 'PENDING' && request.managerAcceptance === false) {
            return { label: 'Pending with me', style: { background: '#d47ed4', color: '#222' } };
        }
        // Fallback
        return { label: request.status, style: { background: '#fff', color: '#222' } };
    }

    // Format helpers
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd-MM-yyyy");
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

  if (isLoading) {
    return (
      <div className="min-h-screen text-black bg-white p-3 border border-black flex items-center justify-center">
        <div className="text-center py-5">Loading approved requests...</div>
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
                <div className={`rounded-xl overflow-hidden border-2 border-black bg-[#F5E7B2] min-w-[700px] ${showRejectModal || showSuccessModal ? 'invisible' : ''}`}>
                    <table className="w-full text-black text-base border-collapse">
                        <thead>
                            <tr className="bg-[#D6F3FF] text-black font-bold">
                                <th className="border-2 border-black px-2 py-2 w-10 bg-[#D6F3FF]">{/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                                    />
                                </th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Date</th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">ID</th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Block Section</th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">UP/DN/SL/RO AD NO.</th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Duration</th>
                                <th className="border-2 border-black px-2 py-2 bg-[#D6F3FF]">Activity</th>
                                <th className="border-2 border-black px-2 py-2 sticky right-0 z-10 bg-[#D6F3FF] w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map((request: UserRequest) => (
                                <tr key={request.id} className="bg-white hover:bg-[#FFF86B] text-black">
                                    <td className="border border-black px-2 py-1 text-center align-middle">
                                        <input
                                            type="checkbox"
                                            checked={selectedRequests.has(request.id)}
                                            onChange={() => handleSelectRequest(request.id)}
                                            className="w-4 h-4 text-[#13529e] border-gray-300 rounded focus:ring-[#13529e]"
                                        />
                                    </td>
                                    <td className="border border-black px-2 py-1 text-center align-middle">{formatDate(request.date)}</td>
                                    <td className="border border-black px-2 py-1 text-center align-middle">
                                        <Link href={`/manage/view-request/${request.id}`} className="text-[#13529e] hover:underline font-semibold">
                                            {request.id}
                                        </Link>
                                    </td>
                                    <td className="border border-black px-2 py-1 align-middle">{request.missionBlock}</td>
                                    <td className="border border-black px-2 py-1 text-center align-middle">{request.processedLineSections?.[0]?.lineName || 'N/A'}</td>
                                    <td className="border border-black px-2 py-1 text-center align-middle">{formatTime(request.demandTimeFrom)} - {formatTime(request.demandTimeTo)}</td>
                                    <td className="border border-black px-2 py-1 align-middle">{request.activity}</td>
                                    <td className="border border-black px-2 py-1 sticky right-0 z-10 bg-[#E6E6FA] text-center align-middle w-32">
                                        <div className="flex gap-2 justify-center flex-col md:flex-row">
                                            <button
                                                onClick={() => handleAccept(request.id)}
                                                disabled={isAccepting || isRejecting}
                                                className="px-2 py-1 text-xs md:text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-bold"
                                            >
                                                {isAccepting ? "Accepting..." : "Accept"}
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.id)}
                                                disabled={isAccepting || isRejecting}
                                                className="px-2 py-1 text-xs md:text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-bold"
                                            >
                                                {isRejecting ? "Rejecting..." : "Reject"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">Reject Request{requestToReject === 'bulk' ? 's' : ''}</h3>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection"
                            className="w-full p-2 border border-gray-300 rounded mb-4"
                            rows={4}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason("");
                                    setRequestToReject(null);
                                }}
                                className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitRejection}
                                disabled={isRejecting}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                                {isRejecting ? "Submitting..." : "Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-xs w-full flex flex-col items-center">
                        <div className="text-lg font-bold mb-4 text-center">{showSuccessModal}</div>
                        <button
                            onClick={() => setShowSuccessModal(null)}
                            className="px-6 py-2 text-base bg-green-600 text-white rounded hover:bg-green-700 mt-2 font-bold"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}