"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetUserRequestById } from "@/app/service/query/user-request";
import { useUpdateUserRequestQuery } from "@/app/service/query/user-request";
import {
  MajorSection,
  blockSection,
  workType,
  Activity,
  lineData,
  depot,
  streamData,
} from "@/app/lib/store";
import Select from "react-select";
import { UserRequestInput } from "@/app/validation/user-request";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export default function EditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState<Partial<UserRequestInput>>({
    date: "",
    selectedDepartment: "",
    selectedSection: "",
    missionBlock: "",
    workType: "",
    activity: "",
    corridorTypeSelection: "",
  });

  const [blockSectionValue, setBlockSectionValue] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isStatusPending, setIsStatusPending] = useState(true);

  // Use react-query to fetch the request data by ID
  const { data: requestData, isLoading, error } = useGetUserRequestById(id);

  // Update mutation
  const updateMutation = useUpdateUserRequestQuery(id);

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth/login";
    },
  });

  // Format date for input fields
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  // Format time for input fields
  const formatTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "HH:mm");
    } catch {
      return "";
    }
  };

  // Set form data when request data is loaded
  useEffect(() => {
    if (requestData?.data) {
      const data = requestData.data;

      // Check if status is PENDING
      setIsStatusPending(data.status === "PENDING");

      // Extract block sections from missionBlock if it exists
      const blockSections = data.missionBlock
        ? data.missionBlock.split(",")
        : [];
      setBlockSectionValue(blockSections);

      // Set form data with cleaned values
      setFormData({
        selectedDepartment: data.selectedDepartment || "",
        selectedSection: data.selectedSection || "",
        missionBlock: data.missionBlock || "",
        workType: data.workType || "",
        activity: data.activity || "",
        selectedDepo: data.selectedDepo || "",
        date: formatDateForInput(data.date),
        demandTimeFrom: formatTimeForInput(data.demandTimeFrom),
        demandTimeTo: formatTimeForInput(data.demandTimeTo),
        requestremarks: data.requestremarks || "",
        corridorTypeSelection:
          data.corridorTypeSelection === "Corridor" ||
          data.corridorTypeSelection === "Outside Corridor" ||
          data.corridorTypeSelection === "Urgent Block"
            ? data.corridorTypeSelection
            : "",
      });
    }
  }, [requestData]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setSuccess(null);

    // Format date for submission
    const formatDateToISO = (date: string): string => {
      if (!date) return "";
      if (date.includes("T")) return date;
      return `${date}T00:00:00.000Z`;
    };

    // Format time for submission
    const formatTimeToDatetime = (date: string, time: string): string => {
      if (!date || !time) return "";
      return `${date}T${time}:00.000Z`;
    };

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        date: formatDateToISO(formData.date || ""),
        demandTimeFrom: formatTimeToDatetime(
          formData.date || "",
          formData.demandTimeFrom || ""
        ),
        demandTimeTo: formatTimeToDatetime(
          formData.date || "",
          formData.demandTimeTo || ""
        ),
      };

      // Submit the data
      updateMutation.mutate(submitData, {
        onSuccess: () => {
          setSuccess("Block request updated successfully!");
          setFormSubmitting(false);
          // Navigate to view page after a brief delay
          setTimeout(() => {
            router.push(`/view-request/${id}`);
          }, 1500);
        },
        onError: (error) => {
          console.error("Error updating form:", error);
          setFormError("Failed to update block request. Please try again.");
          setFormSubmitting(false);
        },
      });
    } catch (error) {
      console.error("Error in form submission:", error);
      setFormError(
        "An error occurred during form submission. Please try again."
      );
      setFormSubmitting(false);
    }
  };

  // If the status is not PENDING, show a message
  if (!isStatusPending && !isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-[#13529e]">
            Edit Block Request
          </h1>
          <Link
            href={`/view-request/${id}`}
            className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
          >
            Back to View
          </Link>
        </div>
        <div className="text-center py-6">
          <p className="mb-4">
            This request cannot be edited because it is not in PENDING status.
          </p>
          <Link
            href={`/view-request/${id}`}
            className="px-4 py-2 bg-[#13529e] text-white border border-black"
          >
            Go to View Request
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4">
          <h1 className="text-lg font-bold text-[#13529e]">
            Edit Block Request
          </h1>
        </div>
        <div className="text-center py-5">Loading request details...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4">
          <h1 className="text-lg font-bold text-[#13529e]">
            Edit Block Request
          </h1>
        </div>
        <div className="text-center py-5 text-red-600">
          Error loading request details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Edit Block Request</h1>
        <Link
          href={`/view-request/${id}`}
          className="px-3 py-1 text-sm bg-white text-[#13529e] border border-black"
        >
          Back to View
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 mb-3">
          {/* Date field */}
          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Date of Block <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date || ""}
              onChange={handleInputChange}
              className="input gov-input w-full"
              style={{ color: "black", fontSize: "14px" }}
              required
            />
          </div>

          {/* Corridor Type */}
          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Corridor Type <span className="text-red-600">*</span>
            </label>
            <div className="space-y-1">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="corridorTypeSelection"
                  value="Corridor"
                  checked={formData.corridorTypeSelection === "Corridor"}
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Corridor</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="corridorTypeSelection"
                  value="Outside Corridor"
                  checked={
                    formData.corridorTypeSelection === "Outside Corridor"
                  }
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Outside Corridor</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="corridorTypeSelection"
                  value="Urgent Block"
                  checked={formData.corridorTypeSelection === "Urgent Block"}
                  onChange={handleInputChange}
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Urgent Block</span>
              </label>
            </div>
          </div>

          {/* Department */}
          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Department
            </label>
            <input
              name="selectedDepartment"
              className="input gov-input bg-gray-100 w-full"
              value={session?.user.department || ""}
              style={{ color: "black", fontSize: "14px" }}
              disabled
            />
          </div>

          {/* Time From/To */}
          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Demand Time From <span className="text-red-600">*</span>
            </label>
            <input
              type="time"
              name="demandTimeFrom"
              value={formData.demandTimeFrom || ""}
              onChange={handleInputChange}
              className="input gov-input w-full"
              style={{ color: "black", fontSize: "14px" }}
              required
            />
          </div>

          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Demand Time To <span className="text-red-600">*</span>
            </label>
            <input
              type="time"
              name="demandTimeTo"
              value={formData.demandTimeTo || ""}
              onChange={handleInputChange}
              className="input gov-input w-full"
              style={{ color: "black", fontSize: "14px" }}
              required
            />
          </div>

          {/* Remarks */}
          <div className="form-group col-span-3">
            <label className="block text-sm font-medium text-black mb-1">
              Remarks
            </label>
            <textarea
              name="requestremarks"
              value={formData.requestremarks || ""}
              onChange={handleInputChange}
              className="gov-input w-full"
              style={{
                color: "black",
                minHeight: "80px",
                fontSize: "14px",
              }}
              placeholder="Enter any additional remarks"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <button
            type="submit"
            className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm"
            disabled={formSubmitting}
          >
            {formSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {success && (
          <div className="text-green-700 text-sm mt-2 text-center">
            {success}
          </div>
        )}
        {formError && (
          <div className="text-red-600 text-sm mt-2 text-center">
            {formError}
          </div>
        )}
      </form>

      <style jsx global>{`
        .gov-input {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #000000;
          border-radius: 2px;
          margin-top: 2px;
          margin-bottom: 2px;
          background: white;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gov-input:focus {
          outline: none;
          border-color: #13529e;
          box-shadow: 0 0 0 2px rgba(19, 82, 158, 0.2);
        }
      `}</style>
    </div>
  );
}
