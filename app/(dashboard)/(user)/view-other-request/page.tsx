"use client";

import { useState } from "react";
import { useRequestFilter } from "@/app/hooks/useRequestFilter";
import { useUrgentMode } from "@/app/context/UrgentModeContext";

interface Request {
  id: string;
  date: string;
  corridorType: string;
  status: string;
}

export default function ViewOtherRequestPage() {
  const { isUrgentMode } = useUrgentMode();
  const [requests, setRequests] = useState<Request[]>([]);
  
  // Use the filter hook
  const filteredRequests = useRequestFilter(requests);

  // ... rest of your component code

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          {isUrgentMode ? "Urgent Block Requests" : "Block Requests"}
        </h1>
      </div>

      {/* Your table component using filteredRequests instead of requests */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.corridorType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Add your action buttons here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 