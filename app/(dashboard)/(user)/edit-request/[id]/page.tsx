"use client";
import React, { useState, useEffect } from "react";
import {
  useCreateUserRequest,
  useUpdateUserRequest,
  useDeleteUserRequest,
} from "@/app/service/mutation/user-request";
import { useSession } from "next-auth/react";
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
import { z } from "zod";
import {
  userRequestSchema,
  UserRequestInput,
} from "@/app/validation/user-request";
import {
  formatDateToISO,
  formatTimeToDatetime,
  isDateAfterThursdayCutoff,
  extractTimeFromDatetime,
  filterRequestData,
  normalizeToDateOnly,
} from "@/app/lib/helper";
import { useParams } from "next/navigation";
import { useGetUserRequestById } from "@/app/service/query/user-request";
import { Loader } from "@/app/components/ui/Loader";

type Department = "TRD" | "S&T" | "ENGG";

export default function CreateBlockRequestPage() {
  const params = useParams();
  const {
    data: userDataById,
    isLoading,
    error,
  } = useGetUserRequestById(params.id as string);

  const [formData, setFormData] = useState<
    Partial<UserRequestInput> & {
      selectedStreams?: Record<string, string>;
      selectedRoads?: Record<string, string[]>;
    }
  >({
    id: "",
    date: "",
    selectedDepartment: "",
    selectedSection: "",
    missionBlock: "",
    workType: "",
    activity: "",
    corridorTypeSelection: null,
    cautionRequired: false,
    cautionSpeed: 0,
    freshCautionRequired: null,
    freshCautionSpeed: 0,
    freshCautionLocationFrom: "",
    freshCautionLocationTo: "",
    adjacentLinesAffected: "",
    workLocationFrom: "",
    workLocationTo: "",
    trdWorkLocation: "",
    demandTimeFrom: "",
    demandTimeTo: "",
    sigDisconnection: false,
    elementarySection: "",
    requestremarks: "",
    selectedDepo: "",
    routeFrom: "",
    routeTo: "",
    powerBlockRequirements: [],
    sntDisconnectionRequired: null,
    sntDisconnectionRequirements: [],
    sntDisconnectionLineFrom: "",
    sntDisconnectionLineTo: "",
    processedLineSections: [],
    repercussions: "",
    selectedStream: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [customActivity, setCustomActivity] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [blockSectionValue, setBlockSectionValue] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [sntDisconnectionChecked, setSntDisconnectionChecked] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [powerBlockRequirements, setPowerBlockRequirements] = useState<
    string[]
  >([]);
  const [sntDisconnectionRequirements, setSntDisconnectionRequirements] =
    useState<string[]>([]);
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = "/auth/login";
    },
  });

  const mutation = useUpdateUserRequest(params.id as string);
  const deleteMutation = useDeleteUserRequest();
  const userLocation = session?.user.location;
  const majorSectionOptions =
    userLocation && MajorSection[userLocation as keyof typeof MajorSection]
      ? MajorSection[userLocation as keyof typeof MajorSection]
      : [];
  const selectedMajorSection = formData.selectedSection;
  const blockSectionOptions =
    selectedMajorSection &&
      blockSection[selectedMajorSection as keyof typeof blockSection]
      ? blockSection[selectedMajorSection as keyof typeof blockSection]
      : [];
  const userDepartment = session?.user.department;
  const workTypeOptions =
    userDepartment && workType[userDepartment as keyof typeof workType]
      ? workType[userDepartment as keyof typeof workType]
      : [];
  const selectedWorkType = formData.workType;
  const activityOptions =
    selectedWorkType && Activity[selectedWorkType as keyof typeof Activity]
      ? Activity[selectedWorkType as keyof typeof Activity]
      : [];

  const blockSectionOptionsList = blockSectionOptions.map((block: string) => ({
    value: block,
    label: block,
  }));

  useEffect(() => {
    if (userDataById?.data) {
      setFormData(userDataById?.data as any);

      if (userDataById?.data?.processedLineSections) {
        setBlockSectionValue(
          userDataById?.data?.processedLineSections.map(
            (section: any) => section.block
          )
        );
      }
    }
  }, [userDataById?.data]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else if (type === "radio") {
      setFormData({
        ...formData,
        [name]: value === "true" ? true : value === "false" ? false : value,
      });
    } else if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const getStreamDataSafely = (
    blockKey: string,
    streamKey: string
  ): string[] => {
    if (!(blockKey in streamData)) {
      return [];
    }

    const blockData = streamData[blockKey as keyof typeof streamData];
    if (typeof blockData !== "object" || !(streamKey in blockData)) {
      return [];
    }
    const streamDataTyped = blockData as Record<string, string[]>;
    return streamDataTyped[streamKey] || [];
  };

  const handleFormValidation = () => {
    if (!formData.date) {
      setErrors({
        date: "Please select a date for the block request",
      });
      return false;
    }

    if (!formData.demandTimeFrom || !formData.demandTimeTo) {
      const newErrors: Record<string, string> = {};
      if (!formData.demandTimeFrom) {
        newErrors.demandTimeFrom = "Demand Time From is required";
      }
      if (!formData.demandTimeTo) {
        newErrors.demandTimeTo = "Demand Time To is required";
      }
      setErrors(newErrors);
      return false;
    }

    let newErrors: Record<string, string> = {};
    let hasError = false;

    // Required fields validation
    const requiredFields = [
      "date",
      "corridorType",
      "selectedSection",
      "selectedDepo",
      "demandTimeFrom",
      "demandTimeTo",
      "workType",
      "activity",
    ];

    // Check required fields
    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())} is required`;
        hasError = true;
      }
    });

    // Validate block section
    if (blockSectionValue.length === 0) {
      newErrors.missionBlock = "Block Section is required";
      hasError = true;
    }

    // Validate line/stream entries for each block section
    for (const block of blockSectionValue) {
      const sectionEntry = formData.processedLineSections?.find(
        (section) => section.block === block
      );

      if (block.includes("-YD")) {
        // Validate yard sections
        if (!sectionEntry || !sectionEntry.stream) {
          newErrors[
            `processedLineSections.${block}.stream`
          ] = `Stream for ${block} is required`;
          hasError = true;
        }
        if (sectionEntry?.stream && !sectionEntry.road) {
          newErrors[
            `processedLineSections.${block}.road`
          ] = `Road for ${block} is required`;
          hasError = true;
        }
      } else {
        // Validate regular sections
        if (!sectionEntry || !sectionEntry.lineName) {
          newErrors[
            `processedLineSections.${block}.lineName`
          ] = `Line for ${block} is required`;
          hasError = true;
        }
      }
    }

    if (hasError) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const selector = firstErrorKey.includes(".")
        ? `[name="${firstErrorKey.split(".")[0]}"]`
        : `[name="${firstErrorKey}"]`;
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);
    if (!handleFormValidation()) {
      return;
    }
    const validProcessedSections = (
      formData.processedLineSections || []
    ).filter((section) => blockSectionValue.includes(section.block));

    // Ensure all required fields are present in each processed section
    const processedSectionsWithDefaults = validProcessedSections.map(
      (section) => {
        if (section.type === "yard") {
          return {
            ...section,
            lineName: section.lineName || "",
            otherLines: section.otherLines || "",
            stream: section.stream || "",
            road: section.road || "",
            otherRoads: section.otherRoads || "",
          };
        } else {
          return {
            ...section,
            lineName: section.lineName || "",
            otherLines: section.otherLines || "",
            stream: "",
            road: "",
            otherRoads: "",
          };
        }
      }
    );

    const processedFormData = {
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
      processedLineSections: processedSectionsWithDefaults,
    };
    const filteredFormData = filterRequestData(processedFormData);
    try {
      mutation.mutate(filteredFormData as UserRequestInput, {
        onSuccess: (data) => {
          setSuccess("Block request updated successfully!");
          // Reset form
          setFormData({
            date: "",
            selectedDepartment: session?.user.department || "",
            selectedSection: "",
            missionBlock: "",
            workType: "",
            activity: "",
            corridorTypeSelection: null,
            cautionRequired: false,
            cautionSpeed: 0,
            freshCautionRequired: false,
            freshCautionSpeed: 0,
            processedLineSections: [],
            selectedStream: "",
          });
          setBlockSectionValue([]);
          setCustomActivity("");
          setPowerBlockRequirements([]);
          setSntDisconnectionRequirements([]);
          setFormSubmitting(false);
        },
        onError: (error) => {
          console.error("Error updating form:", error);
          setFormError("Failed to update block request. Please try again.");
          setFormSubmitting(false);
        },
      });
    } catch (error) {
      console.error("Error processing form:", error);
      setFormError("An error occurred while processing the form.");
      setFormSubmitting(false);
    }
  };

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!formData.date) {
      setIsDisabled(true);
      setFormData({ ...formData, corridorTypeSelection: null });
    } else {
      const shouldDisable = isDateAfterThursdayCutoff(formData.date);
      setIsDisabled(shouldDisable);
      if (shouldDisable) {
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      }
    }
  }, [formData.date]);

  useEffect(() => {
    setSntDisconnectionChecked(
      String(formData.sntDisconnectionRequired) === "true"
    );
  }, [formData.sntDisconnectionRequired]);

  const handlePowerBlockRequirementsChange = (
    value: string,
    checked: boolean
  ) => {
    let newRequirements = [...powerBlockRequirements];
    if (checked) {
      newRequirements.push(value);
    } else {
      newRequirements = newRequirements.filter((item) => item !== value);
    }

    setPowerBlockRequirements(newRequirements);
    setFormData((prevData) => ({
      ...prevData,
      powerBlockRequirements: newRequirements,
    }));
    if (checked && errors.powerBlockRequirements) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.powerBlockRequirements;
        return newErrors;
      });
    }
  };

  const handleSntDisconnectionRequirementsChange = (
    value: string,
    checked: boolean
  ) => {
    let newRequirements = [...sntDisconnectionRequirements];
    if (checked) {
      newRequirements.push(value);
    } else {
      newRequirements = newRequirements.filter((item) => item !== value);
    }

    setSntDisconnectionRequirements(newRequirements);
    setFormData((prevData) => ({
      ...prevData,
      sntDisconnectionRequirements: newRequirements,
    }));
    // Also update validation errors
    if (checked && errors.sntDisconnectionRequirements) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.sntDisconnectionRequirements;
        return newErrors;
      });
    }
  };
  // Handle line name selection change
  const handleLineNameSelection = (block: string, value: string) => {
    // Update processedLineSections directly
    setFormData((prev) => {
      // Get existing processed sections
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      // Find the index of the section for this block or -1 if it doesn't exist
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      // Create the updated section
      const updatedSection = {
        block,
        type: "regular",
        lineName: value,
        otherLines: "",
      };

      // Either update existing section or add new one
      if (sectionIndex >= 0) {
        // Keep any existing otherLines if present
        updatedSection.otherLines =
          existingProcessedSections[sectionIndex].otherLines || "";
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        existingProcessedSections.push(updatedSection);
      }

      // If only one block, also update selectedStream for backward compatibility
      const selectedStream =
        blockSectionValue.length === 1 ? value : prev.selectedStream;
      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedStream,
      };
    });
  };
  // Handle other affected lines change
  const handleOtherAffectedLinesChange = (block: string, options: any[]) => {
    const selectedValues = options.map((opt) => opt.value);

    // Update processedLineSections directly
    setFormData((prev) => {
      // Get existing processed sections
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      // Find the index of the section for this block
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex >= 0) {
        const section = existingProcessedSections[sectionIndex];

        // Check if this is a yard section or regular section
        if (section.type === "yard") {
          // For yard sections, update otherRoads
          const updatedSection = {
            ...section,
            otherRoads: selectedValues.join(","),
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        } else {
          // For regular sections, update otherLines
          const updatedSection = {
            ...section,
            otherLines: selectedValues.join(","),
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      }

      // Also update selectedRoads object to make sure data is captured correctly
      const selectedRoads = { ...(prev.selectedRoads || {}) };
      selectedRoads[block] = selectedValues;

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedRoads,
      };
    });
  };
  // Update formData when blockSectionValue changes
  useEffect(() => {
    if (blockSectionValue.length > 0) {
      setFormData((prev) => ({
        ...prev,
        missionBlock: blockSectionValue.join(","),
      }));
    }
  }, [blockSectionValue]);
  // Set department from session when available
  useEffect(() => {
    if (session?.user?.department) {
      setFormData((prev) => ({
        ...prev,
        selectedDepartment: session.user.department,
      }));
    }
  }, [session]);
  // Handle stream selection for yard sections
  const handleStreamSelection = (block: string, value: string) => {
    // Update processedLineSections directly
    setFormData((prev) => {
      // Get existing processed sections
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      // Find the index of the section for this block
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      // Create the updated section - reset road when stream changes
      const updatedSection = {
        block,
        type: "yard",
        stream: value,
        road: "",
        otherRoads: "",
      };

      // Either update existing section or add new one
      if (sectionIndex >= 0) {
        existingProcessedSections[sectionIndex] = updatedSection as any;
      } else {
        existingProcessedSections.push(updatedSection as any);
      }

      // If only one block, also update selectedStream for backward compatibility
      const selectedStream =
        blockSectionValue.length === 1 ? value : prev.selectedStream;

      // Also update selectedStreams object to make sure data is captured correctly
      const selectedStreams = { ...(prev.selectedStreams || {}) };
      selectedStreams[block] = value;
      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedStream,
        selectedStreams,
      };
    });
  };
  // Handle road selection for yard sections
  const handleRoadSelection = (block: string, value: string) => {
    // Update processedLineSections directly
    setFormData((prev) => {
      // Get existing processed sections
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      // Find the index of the section for this block
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex >= 0) {
        // Update existing section with road
        const updatedSection = {
          ...existingProcessedSections[sectionIndex],
          road: value,
        };
        existingProcessedSections[sectionIndex] = updatedSection;
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
      };
    });
  };

  // Add state for edit/cancel mode
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Helper: is editable (e.g., up to 3 days before block date)
  // (No longer needed, form is always editable)

  // Cancel handler
  const handleCancelRequest = async () => {
    setFormError(null);
    setSuccess(null);
    try {
      await deleteMutation.mutateAsync(params.id as string);
      setShowCancelConfirm(false);
      setSuccess('Block request cancelled successfully!');
      setTimeout(() => {
        window.location.href = '/edit-request';
      }, 1200);
    } catch (error) {
      setFormError('Failed to cancel block request. Please try again.');
      setShowCancelConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Loader name="Editing Block Request" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fcfaf3]">
      {/* Header */}
      <div className="w-full max-w-3xl mx-auto mt-4">
        <div className="text-center bg-[#f7f7a1] rounded-t-2xl p-4 border-b-2 border-[#b6f7e6]">
          <span className="text-4xl font-extrabold text-[#b07be0]">RBMS</span>
        </div>
        <div className="bg-[#c6e6f7] rounded-b-2xl p-6">
          <div className="mb-4">
            <div className="bg-[#1bb36a] text-white text-2xl font-extrabold rounded-xl py-3 px-6 text-center mb-4">
              Edit/Cancel the Block ID {formData.id || ''}
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
              <button
                className="flex-1 rounded-2xl bg-[#d32f2f] text-white font-extrabold text-xl py-4 border-2 border-[#222] shadow hover:bg-[#ff5c42] transition"
                onClick={() => setShowCancelConfirm(true)}
              >
                CANCEL
              </button>
            </div>
          </div>
          {/* Edit Form: always visible and editable */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border-2 border-black flex flex-col gap-6 p-6 md:p-8 mb-8">
            {/* ...existing form fields... */}
            <button
              type="submit"
              className="w-full bg-[#1bb36a] text-white font-extrabold text-xl py-3 rounded-xl mt-4 shadow hover:bg-[#2ecc71] transition"
              disabled={formSubmitting}
            >
              Submit Revised Request
            </button>
          </form>
          {/* Cancel Confirmation Modal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
                <h2 className="text-xl font-bold mb-4">Are you sure you want to cancel this block request?</h2>
                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-6 py-2 rounded border border-black bg-gray-100 hover:bg-gray-200 text-black font-semibold"
                  >
                    No, Go Back
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    className="px-6 py-2 rounded border border-black bg-[#d32f2f] text-white font-semibold hover:bg-[#b71c1c]"
                  >
                    Yes, Cancel Request
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Success/Error messages */}
          {success && (
            <div className="text-green-700 text-xs mt-2 text-center">
              {success}
            </div>
          )}
          {formError && (
            <div className="text-red-600 text-xs mt-2 text-center">
              {formError}
            </div>
          )}
          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              className="flex items-center gap-2 bg-[#e6e6fa] border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
              onClick={() => window.history.back()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              className="flex items-center gap-2 bg-lime-300 border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
              onClick={() => window.location.href = '/dashboard'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} className="w-6 h-6">
                <rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" />
                <path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" />
              </svg>
              Home
            </button>
            <button
              className="flex items-center gap-2 bg-[#ffb347] border-2 border-black rounded-lg px-4 py-2 text-lg font-bold text-black"
              onClick={() => window.location.href = '/auth/logout'}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
