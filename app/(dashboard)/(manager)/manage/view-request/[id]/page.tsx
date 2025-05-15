"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { managerService } from "@/app/service/api/manager";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useState } from "react";

export default function ViewRequestPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Fetch request data
  const { data, isLoading, error } = useQuery({
    queryKey: ["request", id],
    queryFn: () => managerService.getUserRequestById(id),
  });

  // Accept request mutation
  // const acceptMutation = useMutation({
  //   mutationFn: () => managerService.acceptUserRequest(id),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ["request", id] });
  //     queryClient.invalidateQueries({ queryKey: ["requests"] });
  //     alert("Request accepted successfully");
  //     router.push("/manage/request-table");
  //   },
  //   onError: (error) => {
  //     console.error("Failed to accept request:", error);
  //     alert("Failed to accept request. Please try again.");
  //   },
  // });
const acceptMutation = useMutation({
  mutationFn: (isAccept: boolean) => 
    managerService.acceptUserRequest(id, isAccept),  // Pass the decision to the API
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["request", id] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
    alert("Request processed successfully");
    router.push("/manage/request-table");
  },
  onError: (error) => {
    console.error("Failed to process request:", error);
    alert("Failed to process request. Please try again.");
  },
});

  // Format date and time
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd-MM-yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return "Invalid time";
    }
  };

  // Handle accept request
  // const handleAccept = async () => {
  //   if (confirm("Are you sure you want to accept this request?")) {
  //     setIsAccepting(true);
  //     try {
  //       await acceptMutation.mutateAsync();
  //     } finally {
  //       setIsAccepting(false);
  //     }
  //   }
  // };

// Handle accept or reject request
const handleAcceptReject = async (isAccept: boolean) => {
  const action = isAccept ? "accept" : "reject";
  if (confirm(`Are you sure you want to ${action} this request?`)) {
    if (isAccept) {
      setIsAccepting(true);
    } else {
      setIsRejecting(true);
    }
    try {
      await acceptMutation.mutateAsync(isAccept);
    } finally {
      if (isAccept) {
        setIsAccepting(false);
      } else {
        setIsRejecting(false);
      }
    }
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">Loading request details...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5 text-red-600">
          Error loading request details. Please try again.
        </div>
      </div>
    );
  }

  const request = data?.data;

  if (!request) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">Request not found</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 border border-black mb-3 text-black">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          Block Request Details
        </h1>
        <div className="flex gap-2">
          <Link
            href="/manage/request-table"
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Back to List
          </Link>{request.status === "PENDING" && !request.managerAcceptance && (
  <>
    <button
      onClick={() => handleAcceptReject(true)}  // Accept
      disabled={isAccepting || isRejecting}
      className="px-3 py-1 text-sm bg-[#13529e] text-white border border-black disabled:opacity-50"
    >
      {isAccepting ? "Accepting..." : "Accept Request"}
    </button>
    <button
      onClick={() => handleAcceptReject(false)}  // Reject
      disabled={isAccepting || isRejecting}
      className="px-3 py-1 text-sm bg-red-600 text-white border border-black disabled:opacity-50"
    >
      {isRejecting  ? "Rejecting..." : "Reject Request"}
    </button>
  </>
)}

        </div>
      </div>

      <div className="mb-4 px-2 py-1 inline-block">
        <span
          className={`px-2 py-0.5 text-sm ${getStatusBadgeClass(
            request.managerAcceptance ? "APPROVED" : "PENDING"
          )}`}
        >
          Status: {request.managerAcceptance ? "APPROVED" : "PENDING"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border border-black p-3">
          <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
            Request Information
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Request ID:</td>
                <td className="py-1">{request.id}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Date:</td>
                <td className="py-1">{formatDate(request.date)}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Created:</td>
                <td className="py-1">{formatDate(request.createdAt)}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Requested By:</td>
                <td className="py-1">{request.user.name}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Department:</td>
                <td className="py-1">{request.selectedDepartment}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Section:</td>
                <td className="py-1">{request.selectedSection}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Depot:</td>
                <td className="py-1">{request.selectedDepo}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-black p-3">
          <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
            Work Details
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Work Type:</td>
                <td className="py-1">{request.workType}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Activity:</td>
                <td className="py-1">{request.activity}</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Time:</td>
                <td className="py-1">
                  {formatTime(request.demandTimeFrom)} to{" "}
                  {formatTime(request.demandTimeTo)}
                </td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Block Section:</td>
                <td className="py-1">{request.missionBlock}</td>
              </tr>
              {request.workLocationFrom ? (
                <tr>
                  <td className="py-1 font-medium">Work Location:</td>
                  <td className="py-1">
                    {request.workLocationFrom}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {request.processedLineSections &&
        request.processedLineSections.length > 0 && (
          <div className="border border-black p-3 mb-4">
            <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
              Block Sections Detail
            </h2>
            <div className="space-y-3">
              {request.processedLineSections.map((section, index) => (
                <div key={index} className="border border-gray-200 p-2">
                  <h3 className="font-medium text-[#13529e]">
                    {section.block}
                  </h3>
                  {section.type === "regular" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium">Line:</span>
                        <div className="py-1">{section.lineName || "N/A"}</div>
                      </div>
                      {section.otherLines && (
                        <div>
                          <span className="text-xs font-medium">
                            Other Lines Affected:
                          </span>
                          <div className="py-1">{section.otherLines}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-xs font-medium">Stream:</span>
                        <div className="py-1">{section.stream || "N/A"}</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium">Road:</span>
                        <div className="py-1">{section.road || "N/A"}</div>
                      </div>
                      {section.otherRoads && (
                        <div className="col-span-2">
                          <span className="text-xs font-medium">
                            Other Roads Affected:
                          </span>
                          <div className="py-1">{section.otherRoads}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border border-black p-3">
          <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
            System Disconnections
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Power Block Required:</td>
                <td className="py-1">
                  {request?.powerBlockRequired && request.powerBlockRequired
                    ? "Yes"
                    : "No"}
                </td>
              </tr>
              {request.powerBlockRequired && request.powerBlockRequirements && (
                <tr>
                  <td className="py-1 font-medium">Power Block Details:</td>
                  <td className="py-1">
                    {request.powerBlockRequirements?.join(", ") || "N/A"}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-1 font-medium">Elementary Section:</td>
                <td className="py-1">{request.elementarySection}</td>
              </tr>

              <tr>
                <td className="py-1 font-medium">
                  S&T Disconnection Required:
                </td>
                <td className="py-1">
                  {request.sntDisconnectionRequired ? "Yes" : "No"}
                </td>
              </tr>
              {request.sntDisconnectionRequired &&
                request.sntDisconnectionRequirements && (
                  <tr>
                    <td className="py-1 font-medium">
                      S&T Disconnection Details:
                    </td>
                    <td className="py-1">
                      {request.sntDisconnectionRequirements?.join(", ") ||
                        "N/A"}
                    </td>
                  </tr>
                )}
              <tr>
                <td className="py-1 font-medium">S&T Lines:</td>
                <td className="py-1">
                  {request.sntDisconnectionLineFrom} to{" "}
                  {request.sntDisconnectionLineTo}
                </td>
              </tr>
              <tr>
                {/* <td className="py-1 font-medium">Signal Disconnection:</td>
                <td className="py-1">
                  {request.sigDisconnection ? "Yes" : "No"}
                </td> */}
              </tr>
              {request.sigDisconnection && request.sntDisconnectionRequired && (
                <tr>
                  <td className="py-1 font-medium">
                    Signal Disconnection Details:
                  </td>
                  <td className="py-1">
                    {request.sntDisconnectionRequired || "N/A"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-black p-3">
          <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
            Safety & Additional Information
          </h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-medium">Fresh Caution Required:</td>
                <td className="py-1">
                  {request.freshCautionRequired ? "Yes" : "No"}
                </td>
              </tr>
              {request.freshCautionRequired && (
                <>
                  <tr>
                    <td className="py-1 font-medium">Caution Speed:</td>
                    <td className="py-1">{request.freshCautionSpeed} km/h</td>
                  </tr>
                  {request.freshCautionLocationFrom && (
                    <tr>
                      <td className="py-1 font-medium">Caution Location:</td>
                      <td className="py-1">
                        {request.freshCautionLocationFrom} to{" "}
                        {request.freshCautionLocationTo}
                      </td>
                    </tr>
                  )}
                </>
              )}
              <tr>
                <td className="py-1 font-medium">Adjacent lines affected:</td>
                <td className="py-1">{request.adjacentLinesAffected}</td>
              </tr>
              {request.repercussions && (
                <tr>
                  <td className="py-1 font-medium">Repercussions:</td>
                  <td className="py-1">{request.repercussions}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {request.requestremarks && (
        <div className="border border-black p-3 mb-4">
          <h2 className="text-md font-bold text-[#13529e] mb-2 border-b border-gray-200 pb-1">
            Remarks
          </h2>
          <p className="text-sm">{request.requestremarks}</p>
        </div>
      )}

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}