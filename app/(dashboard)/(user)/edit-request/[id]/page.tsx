"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCreateUserRequest } from "@/app/service/mutation/user-request";
import { useGetUserRequestById } from "@/app/service/query/user-request";
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

export default function EditRequestPage() {
  const { id } = useParams();
  const {
    data: userDataById,
    isLoading,
    error,
  } = useGetUserRequestById(id as string);
  const [formData, setFormData] = useState<
    Partial<UserRequestInput> & {
      selectedStreams?: Record<string, string>;
      selectedRoads?: Record<string, string[]>;
    }
  >({
    date: "",
    selectedDepartment: "",
    selectedSection: "",
    missionBlock: "",
    workType: "",
    activity: "",
    corridorType: null,
    cautionRequired: false,
    cautionSpeed: 0,
    freshCautionRequired: null,
    freshCautionSpeed: 0,
    freshCautionLocationFrom: "",
    freshCautionLocationTo: "",
    workLocationFrom: "",
    workLocationTo: "",
    demandTimeFrom: "",
    demandTimeTo: "",
    sigDisconnection: false,
    elementarySection: "",
    requestremarks: "",
    selectedDepo: "",
    powerBlockRequirements: [],
    sntDisconnectionRequired: null,
    sntDisconnectionRequirements: [],
    sntDisconnectionLineFrom: "",
    sntDisconnectionLineTo: "",
    processedLineSections: [],
    routeFrom: "",
    routeTo: "",
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

  const mutation = useCreateUserRequest();
  const userLocation = session?.user.location;
  const majorSectionOptions =
    userLocation && MajorSection[userLocation as keyof typeof MajorSection]
      ? MajorSection[userLocation as keyof typeof MajorSection]
      : [];
  const blockSectionOptions =
    formData.selectedSection &&
    blockSection[formData.selectedSection as keyof typeof blockSection]
      ? blockSection[formData.selectedSection as keyof typeof blockSection]
      : [];
  const workTypeOptions =
    session?.user.department &&
    workType[session?.user.department as keyof typeof workType]
      ? workType[session?.user.department as keyof typeof workType]
      : [];
  const activityOptions =
    formData.workType && Activity[formData.workType as keyof typeof Activity]
      ? Activity[formData.workType as keyof typeof Activity]
      : [];
  const [selectedActivity, setSelectedActivity] = useState(
    formData.activity || ""
  );
  const blockSectionOptionsList = blockSectionOptions.map((block: string) => ({
    value: block,
    label: block,
  }));

  useEffect(() => {
    if (userDataById?.data) {
      setFormData(userDataById?.data as any);
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

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-");
    return new Date(+year, +month - 1, +day);
  };
  const isDateAfterThursdayCutoff = (dateStr: string) => {
    const selectedDate = parseDate(dateStr);
    if (!selectedDate) return false;
    selectedDate.setHours(0, 0, 0, 0);
    const now = new Date();
    const day = now.getDay();
    const diffToThursday = (day + 7 - 4) % 7;
    const thursdayThisWeek = new Date(now);
    thursdayThisWeek.setDate(now.getDate() - diffToThursday);
    thursdayThisWeek.setHours(16, 0, 0, 0);
    let cycleStart = new Date(thursdayThisWeek);
    if (now > thursdayThisWeek) {
      cycleStart = thursdayThisWeek;
    } else {
      cycleStart.setDate(cycleStart.getDate() - 7);
    }
    const cycleEnd = new Date(cycleStart);
    const daysToSunday = (7 - cycleStart.getDay()) % 7;
    cycleEnd.setDate(cycleStart.getDate() + daysToSunday + 7);
    cycleEnd.setHours(23, 59, 59, 999);
    return selectedDate >= cycleStart && selectedDate <= cycleEnd;
  };

  const formatTimeToDatetime = (date: string, time: string): string => {
    if (!date || !time) return "";
    return `${date}T${time}:00.000Z`;
  };
  const formatDateToISO = (date: string): string => {
    if (!date) return "";
    if (date.includes("T")) return date;
    return `${date}T00:00:00.000Z`;
  };

  // Fix TypeScript errors for streamData indexing
  // Add type assertion helper function
  const getStreamDataSafely = (
    blockKey: string,
    streamKey: string
  ): string[] => {
    // Check if block exists in streamData
    if (!(blockKey in streamData)) {
      return [];
    }

    // Type assertion to access streamData safely
    const blockData = streamData[blockKey as keyof typeof streamData];

    // Check if stream exists in the blockData
    if (typeof blockData !== "object" || !(streamKey in blockData)) {
      return [];
    }

    // Access stream data safely with type assertion
    const streamDataTyped = blockData as Record<string, string[]>;
    return streamDataTyped[streamKey] || [];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.date) {
      setErrors({
        date: "Please select a date for the block request",
      });
      return;
    }

    // Validate time fields
    if (!formData.demandTimeFrom || !formData.demandTimeTo) {
      const newErrors: Record<string, string> = {};
      if (!formData.demandTimeFrom) {
        newErrors.demandTimeFrom = "Demand Time From is required";
      }
      if (!formData.demandTimeTo) {
        newErrors.demandTimeTo = "Demand Time To is required";
      }
      setErrors(newErrors);
      return;
    }

    let newErrors: Record<string, string> = {};
    let hasError = false;

    // Required fields validation
    const requiredFields = [
      "date",
      "corridorTypeSelection",
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

    // Set validation errors if any
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
      return;
    }

    // Continue with validation and submission
    try {
      // Prepare form data for submission
      const completeFormData = {
        ...formData,
        date: formatDateToISO(formData.date || ""),
        selectedDepartment: session?.user.department || "",
        activity:
          formData.activity === "others" ? customActivity : formData.activity,
        demandTimeFrom: formatTimeToDatetime(
          formData.date || "",
          formData.demandTimeFrom || ""
        ),
        demandTimeTo: formatTimeToDatetime(
          formData.date || "",
          formData.demandTimeTo || ""
        ),
        powerBlockRequirements: [...powerBlockRequirements],
        sntDisconnectionRequirements: [...sntDisconnectionRequirements],
        missionBlock:
          blockSectionValue.length > 0 ? blockSectionValue.join(",") : "",
      };

      // Filter processed sections to only include selected block sections
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

      completeFormData.processedLineSections = processedSectionsWithDefaults;

      // Submit the data
      setFormSubmitting(true);
      console.log("Submitting data:", completeFormData);

      mutation.mutate(completeFormData as UserRequestInput, {
        onSuccess: (data) => {
          console.log("Success:", data);
          setSuccess("Block request created successfully!");
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
            cautionSpeed: 10,
            freshCautionRequired: false,
            freshCautionSpeed: 10,
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
          console.error("Error submitting form:", error);
          setFormError("Failed to create block request. Please try again.");
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

  // Responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    // Initial check
    handleResize();
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  // Handle date change and corridor type selection logic
  useEffect(() => {
    if (!formData.date) {
      // If no date is selected, disable all options
      setIsDisabled(true);
      // Clear any previously selected value
      setFormData({
        ...formData,
        corridorTypeSelection: null,
      });
    } else {
      // Date is selected, check if it's within the restricted period
      const shouldDisable = isDateAfterThursdayCutoff(formData.date);
      setIsDisabled(shouldDisable);
      // If options should be disabled, auto-select "Urgent Block"
      if (shouldDisable) {
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      }
    }
  }, [formData.date]);
  // Watch for S&T Disconnection Required changes
  useEffect(() => {
    setSntDisconnectionChecked(
      String(formData.sntDisconnectionRequired) === "true"
    );
  }, [formData.sntDisconnectionRequired]);

  // Handle checkbox for power block requirements
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

    // Update both state variables to ensure they are in sync
    setPowerBlockRequirements(newRequirements);
    setFormData((prevData) => ({
      ...prevData,
      powerBlockRequirements: newRequirements,
    }));
    // Also update validation errors
    if (checked && errors.powerBlockRequirements) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.powerBlockRequirements;
        return newErrors;
      });
    }
  };
  // Handle checkbox for S&T disconnection requirements
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

    // Update both state variables to ensure they are in sync
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
  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          Create Block Request
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-3 gap-y-2 mb-3">
          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Date of Block <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date || ""}
              onChange={handleInputChange}
              className="input gov-input"
              style={{ color: "black", fontSize: "14px" }}
              aria-required="true"
              aria-label="Select date of block"
            />
            {errors.date && (
              <span className="text-xs text-red-700 font-medium mt-1 block">
                {errors.date}
              </span>
            )}
          </div>
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
                  checked={
                    formData.corridorType?.toLocaleLowerCase() === "corridor"
                  }
                  onChange={handleInputChange}
                  disabled={isDisabled}
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
                    formData.corridorType?.toLocaleLowerCase() ===
                    "Outside Corridor"
                  }
                  onChange={handleInputChange}
                  disabled={isDisabled}
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Outside Corridor</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="corridorTypeSelection"
                  value="Urgent Block"
                  checked={
                    formData.corridorType?.toLocaleLowerCase() ===
                    "Urgent Block"
                  }
                  onChange={handleInputChange}
                  disabled={!formData.date}
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Urgent Block</span>
              </label>
            </div>
            {errors.corridorTypeSelection && (
              <span className="text-xs text-red-700 font-medium mt-1 block">
                {errors.corridorTypeSelection}
              </span>
            )}
          </div>

          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Department
            </label>
            <input
              name="selectedDepartment"
              className="input gov-input bg-gray-100"
              value={session?.user.department || ""}
              style={{ color: "black", fontSize: "14px" }}
              disabled
              aria-label="Department"
            />
          </div>

          <div className="form-group col-span-3">
            <label className="block text-sm font-medium text-black mb-1">
              Route <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label
                  className="block text-xs font-medium text-black mb-1"
                  htmlFor="routeFrom"
                >
                  From Location
                </label>
                <input
                  id="routeFrom"
                  name="routeFrom"
                  value={formData.routeFrom || ""}
                  onChange={handleInputChange}
                  className="input gov-input"
                  style={{ color: "black", fontSize: "14px" }}
                  aria-label="Route from location"
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium text-black mb-1"
                  htmlFor="routeTo"
                >
                  To Location
                </label>
                <input
                  id="routeTo"
                  name="routeTo"
                  value={formData.routeTo || ""}
                  onChange={handleInputChange}
                  className="input gov-input"
                  style={{ color: "black", fontSize: "14px" }}
                  aria-label="Route to location"
                />
              </div>
            </div>
          </div>

          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Major Section <span className="text-red-600">*</span>
            </label>
            <select
              name="selectedSection"
              value={formData.selectedSection || ""}
              onChange={handleInputChange}
              className="input gov-input"
              style={{ color: "black", fontSize: "14px" }}
              aria-required="true"
            >
              <option value="" disabled>
                Select Major Section
              </option>
              {majorSectionOptions.map((section: string) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            {errors.selectedSection && (
              <span className="text-xs text-red-700 font-medium mt-1 block">
                {errors.selectedSection}
              </span>
            )}
          </div>

          <div className="form-group col-span-1">
            <label className="block text-sm font-medium text-black mb-1">
              Depot <span className="text-red-600">*</span>
            </label>
            <select
              name="selectedDepo"
              value={formData.selectedDepo || ""}
              onChange={handleInputChange}
              className="input gov-input"
              style={{ color: "black", fontSize: "14px" }}
              aria-required="true"
            >
              <option value="" disabled>
                Select Depot
              </option>
              {formData.selectedSection &&
              depot[formData.selectedSection as keyof typeof depot] ? (
                depot[formData.selectedSection as keyof typeof depot].map(
                  (depotOption: string) => (
                    <option key={depotOption} value={depotOption}>
                      {depotOption}
                    </option>
                  )
                )
              ) : (
                <option value="" disabled>
                  Select Major Section first
                </option>
              )}
            </select>
            {errors.selectedDepo && (
              <span className="text-xs text-red-700 font-medium mt-1 block">
                {errors.selectedDepo}
              </span>
            )}
          </div>
        </div>

        {/* Block Section and Work Details */}
        <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Block Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
            <div className="form-group col-span-2">
              <label className="block text-sm font-medium text-black mb-1">
                Block Section <span className="text-red-600">*</span>
              </label>
              <Select
                isMulti
                options={blockSectionOptionsList}
                value={blockSectionOptionsList.filter((opt) =>
                  blockSectionValue.includes(opt.value)
                )}
                onChange={(opts) => {
                  setBlockSectionValue(opts.map((opt) => opt.value));
                  // Clear missionBlock error when user selects block section
                  if (opts.length > 0 && errors.missionBlock) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.missionBlock;
                      return newErrors;
                    });
                  }
                }}
                isDisabled={!formData.selectedSection}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={
                  formData.selectedSection
                    ? "Select Block Section"
                    : "Select Major Section first"
                }
                styles={{
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: "#13529e",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    fontSize: "14px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 10,
                  }),
                  control: (base) => ({
                    ...base,
                    backgroundColor: "white",
                    color: "black",
                    borderColor: errors.missionBlock ? "#dc2626" : "#45526c",
                    borderWidth: errors.missionBlock ? "2px" : "1px",
                    borderRadius: "4px",
                    padding: "2px",
                    boxShadow: errors.missionBlock
                      ? "0 0 0 1px rgba(220, 38, 38, 0.2)"
                      : "none",
                    fontSize: "14px",
                    minHeight: "36px",
                    "&:hover": {
                      borderColor: errors.missionBlock ? "#dc2626" : "#2461aa",
                    },
                    "&:focus": {
                      borderColor: errors.missionBlock ? "#dc2626" : "#2461aa",
                      boxShadow: errors.missionBlock
                        ? "0 0 0 3px rgba(220, 38, 38, 0.3)"
                        : "0 0 0 3px rgba(37, 99, 176, 0.3)",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#f3f4f6",
                    color: "black",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "black",
                    fontSize: "12px",
                    padding: "2px 4px",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#ef4444",
                    paddingLeft: "4px",
                    paddingRight: "4px",
                    ":hover": {
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                    },
                  }),
                  option: (base, state) => ({
                    ...base,
                    color: "black",
                    fontSize: "14px",
                    padding: "6px 12px",
                    backgroundColor: state.isSelected ? "#e0e7ef" : "white",
                  }),
                }}
              />
              {errors.missionBlock && blockSectionValue.length === 0 && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.missionBlock}
                </span>
              )}
            </div>
            <div className="form-group col-span-1">
              <label className="block text-sm font-medium text-black mb-1">
                Work Type <span className="text-red-600">*</span>
              </label>
              <select
                name="workType"
                value={formData.workType || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{ color: "black", fontSize: "14px" }}
                disabled={!session?.user.department}
              >
                <option value="" disabled>
                  {session?.user.department
                    ? "Select Work Type"
                    : "Select Department first"}
                </option>
                {workTypeOptions.map((type: string) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.workType && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.workType}
                </span>
              )}
            </div>
            <div className="form-group col-span-1">
              <label className="block text-sm font-medium text-black mb-1">
                Activity <span className="text-red-600">*</span>
              </label>
              <select
                name="activity"
                value={formData.activity || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{ color: "black", fontSize: "14px" }}
                disabled={!formData.workType}
              >
                <option value="" disabled>
                  {formData.workType
                    ? "Select Activity"
                    : "Select Work Type first"}
                </option>
                {activityOptions.map((activity: string) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
                <option value="others">Others</option>
              </select>
              {formData.activity === "others" && (
                <input
                  type="text"
                  className="input mt-1 w-full"
                  style={{ color: "black", fontSize: "14px" }}
                  placeholder="Enter custom activity"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  required
                />
              )}
              {errors.activity && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.activity}
                </span>
              )}
            </div>
            <div className="form-group col-span-2">
              <label className="block text-sm font-medium text-black mb-1">
                Remarks
              </label>
              <textarea
                name="requestremarks"
                value={formData.requestremarks || ""}
                onChange={handleInputChange}
                className="gov-input"
                style={{
                  color: "black",
                  minHeight: "80px",
                  width: "100%",
                  fontSize: "14px",
                }}
                placeholder="Enter any additional remarks"
                aria-label="Request remarks"
              ></textarea>
            </div>
          </div>
        </div>
        {formData.processedLineSections?.length === 1 && (
          <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
            {blockSectionValue[0].includes("-YD") ? (
              // For yard sections (containing -YD)
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Stream for {blockSectionValue[0]}{" "}
                  <span className="text-red-600">*</span>
                </label>
                {(() => {
                  // Find the section in processedLineSections for this block
                  const sectionEntry = formData.processedLineSections?.find(
                    (section) => section.block === blockSectionValue[0]
                  );
                  const streamValue = sectionEntry?.stream || "";

                  // Check if we have error
                  const hasStreamError =
                    errors[
                      `processedLineSections.${blockSectionValue[0]}.stream`
                    ];

                  return (
                    <>
                      <select
                        className="input gov-input"
                        style={{
                          color: "black",
                          borderColor: hasStreamError
                            ? "#dc2626"
                            : streamValue
                            ? "#45526c"
                            : "#dc2626",
                          fontSize: "14px",
                        }}
                        value={streamValue}
                        onChange={(e) =>
                          handleStreamSelection(
                            blockSectionValue[0],
                            e.target.value
                          )
                        }
                      >
                        <option value="" disabled>
                          Select Stream
                        </option>
                        {streamData && blockSectionValue[0] in streamData ? (
                          Object.keys(
                            streamData[
                              blockSectionValue[0] as keyof typeof streamData
                            ]
                          ).map((stream) => (
                            <option key={stream} value={stream}>
                              {stream}
                            </option>
                          ))
                        ) : (
                          <option value="up stream">up stream</option>
                        )}
                      </select>
                      {hasStreamError && (
                        <span className="text-xs text-red-700 font-medium mb-2 block">
                          Stream selection is required
                        </span>
                      )}
                      {streamValue &&
                        streamData &&
                        blockSectionValue[0] in streamData && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-black mb-1">
                              Road {blockSectionValue[0]}
                            </label>
                            <select
                              className="input gov-input"
                              value={sectionEntry?.road || ""}
                              onChange={(e) =>
                                handleRoadSelection(
                                  blockSectionValue[0],
                                  e.target.value
                                )
                              }
                              style={{
                                color: "black",
                                borderColor: errors[
                                  `processedLineSections.${blockSectionValue[0]}.road`
                                ]
                                  ? "#dc2626"
                                  : "#45526c",
                                fontSize: "14px",
                              }}
                            >
                              <option value="" disabled>
                                Select Road
                              </option>
                              {getStreamDataSafely(
                                blockSectionValue[0],
                                streamValue
                              ).map((road: string) => (
                                <option key={road} value={road}>
                                  {road}
                                </option>
                              ))}
                            </select>
                            {errors[
                              `processedLineSections.${blockSectionValue[0]}.road`
                            ] && (
                              <span className="text-xs text-red-700 font-medium mb-2 block">
                                Road selection is required
                              </span>
                            )}
                          </div>
                        )}
                      {sectionEntry?.road &&
                        streamValue &&
                        streamData &&
                        blockSectionValue[0] in streamData && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-black mb-1">
                              Other affected Road {blockSectionValue[0]}
                            </label>
                            <Select
                              isMulti
                              options={getStreamDataSafely(
                                blockSectionValue[0],
                                streamValue
                              )
                                .filter(
                                  (road: string) => road !== sectionEntry.road
                                )
                                .map((road: string) => ({
                                  value: road,
                                  label: road,
                                }))}
                              value={
                                sectionEntry.otherRoads
                                  ? sectionEntry.otherRoads
                                      .split(",")
                                      .filter(Boolean)
                                      .map((road: string) => ({
                                        value: road,
                                        label: road,
                                      }))
                                  : []
                              }
                              onChange={(opts) =>
                                handleOtherAffectedLinesChange(
                                  blockSectionValue[0],
                                  opts as any
                                )
                              }
                              className="basic-multi-select"
                              classNamePrefix="select"
                              placeholder="Select other affected roads"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  fontSize: "14px",
                                  minHeight: "36px",
                                  padding: "2px",
                                }),
                                option: (base) => ({
                                  ...base,
                                  fontSize: "14px",
                                  padding: "6px 12px",
                                }),
                                multiValueLabel: (base) => ({
                                  ...base,
                                  fontSize: "12px",
                                }),
                              }}
                            />
                          </div>
                        )}
                    </>
                  );
                })()}
              </div>
            ) : (
              // For regular sections (without -YD)
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Line {blockSectionValue[0]}{" "}
                  <span className="text-red-600">*</span>
                </label>
                {(() => {
                  // Find the section in processedLineSections for this block
                  const sectionEntry = formData.processedLineSections?.find(
                    (section) => section.block === blockSectionValue[0]
                  );
                  const lineValue = sectionEntry?.lineName || "";

                  // Check if we have error
                  const hasLineError =
                    errors[
                      `processedLineSections.${blockSectionValue[0]}.lineName`
                    ];

                  return (
                    <>
                      <select
                        className="input gov-input"
                        style={{
                          color: "black",
                          borderColor: hasLineError
                            ? "#dc2626"
                            : lineValue
                            ? "#45526c"
                            : "#dc2626",
                          fontSize: "14px",
                        }}
                        value={lineValue}
                        onChange={(e) =>
                          handleLineNameSelection(
                            blockSectionValue[0],
                            e.target.value
                          )
                        }
                      >
                        <option value="" disabled>
                          Select Line
                        </option>
                        {lineData[
                          blockSectionValue[0] as keyof typeof lineData
                        ]?.map((line: string) => (
                          <option key={line} value={line}>
                            {line}
                          </option>
                        ))}
                      </select>
                      {hasLineError && (
                        <span className="text-xs text-red-700 font-medium mb-2 block">
                          Line selection is required
                        </span>
                      )}
                      {lineValue && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-black mb-1">
                            Other affected Line for {blockSectionValue[0]}
                          </label>
                          <Select
                            isMulti
                            options={(
                              lineData[
                                blockSectionValue[0] as keyof typeof lineData
                              ] || []
                            )
                              .filter((l: string) => l !== lineValue)
                              .map((l: string) => ({ value: l, label: l }))}
                            value={
                              sectionEntry?.otherLines
                                ? sectionEntry.otherLines
                                    .split(",")
                                    .filter(Boolean)
                                    .map((line: string) => ({
                                      value: line,
                                      label: line,
                                    }))
                                : []
                            }
                            onChange={(opts) =>
                              handleOtherAffectedLinesChange(
                                blockSectionValue[0],
                                opts as any
                              )
                            }
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select other affected lines"
                            styles={{
                              control: (base) => ({
                                ...base,
                                fontSize: "14px",
                                minHeight: "36px",
                                padding: "2px",
                              }),
                              option: (base) => ({
                                ...base,
                                fontSize: "14px",
                                padding: "6px 12px",
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                fontSize: "12px",
                              }),
                            }}
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
        {blockSectionValue.length > 1 && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300 mb-4">
            <h3 className="text-lg font-medium text-black mb-4">
              Line Selections
            </h3>
            {blockSectionValue.map((block) => {
              // Find the section in processedLineSections for this block
              const sectionEntry = formData.processedLineSections?.find(
                (section) => section.block === block
              );

              return (
                <div key={block} className="mb-4 pb-4 border-b border-gray-200">
                  {block.includes("-YD") ? (
                    // For yard sections in multiple selection
                    <>
                      <label className="block text-base font-medium text-black mb-2">
                        Stream for {block}{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <select
                        className="input gov-input mb-3"
                        style={{
                          color: "black",
                          borderColor: errors[
                            `processedLineSections.${block}.stream`
                          ]
                            ? "#dc2626"
                            : sectionEntry?.stream
                            ? "#45526c"
                            : "#dc2626",
                        }}
                        value={sectionEntry?.stream || ""}
                        onChange={(e) =>
                          handleStreamSelection(block, e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select Stream
                        </option>
                        {streamData[block as keyof typeof streamData] ? (
                          Object.keys(
                            streamData[block as keyof typeof streamData]
                          ).map((stream) => (
                            <option key={stream} value={stream}>
                              {stream}
                            </option>
                          ))
                        ) : (
                          <option value="up stream">up stream</option>
                        )}
                      </select>
                      {errors[`processedLineSections.${block}.stream`] && (
                        <span className="text-base text-red-700 font-medium mb-3 block">
                          Stream selection is required
                        </span>
                      )}
                      {sectionEntry?.stream &&
                        streamData[block as keyof typeof streamData] && (
                          <div className="mt-2 mb-3">
                            <label className="block text-base font-medium text-black mb-2">
                              Road {block}
                            </label>
                            <select
                              className="input gov-input"
                              value={sectionEntry?.road || ""}
                              onChange={(e) =>
                                handleRoadSelection(block, e.target.value)
                              }
                              style={{
                                color: "black",
                                borderColor: errors[
                                  `processedLineSections.${block}.road`
                                ]
                                  ? "#dc2626"
                                  : "#45526c",
                              }}
                            >
                              <option value="" disabled>
                                Select Road
                              </option>
                              {getStreamDataSafely(
                                block,
                                sectionEntry?.stream || ""
                              ).map((road: string) => (
                                <option key={road} value={road}>
                                  {road}
                                </option>
                              ))}
                            </select>
                            {errors[`processedLineSections.${block}.road`] && (
                              <span className="text-base text-red-700 font-medium mb-3 block">
                                Road selection is required
                              </span>
                            )}
                          </div>
                        )}
                      {sectionEntry?.road &&
                        sectionEntry?.stream &&
                        block in streamData && (
                          <div className="mt-2 mb-2">
                            <label className="block text-base font-medium text-black mb-2">
                              Other affected Road for {block}
                            </label>
                            <Select
                              isMulti
                              options={(() => {
                                // Type assertion for streamData index access
                                const blockKey =
                                  block as keyof typeof streamData;
                                const blockData = streamData[blockKey];

                                // Check if blockData exists and is an object
                                if (
                                  !blockData ||
                                  typeof blockData !== "object"
                                ) {
                                  return [];
                                }

                                // Get the stream key and check if it exists in blockData
                                const streamKey = sectionEntry.stream;
                                if (!streamKey) {
                                  return [];
                                }

                                // Use safer approach with type assertion
                                // Converting to Record<string, any> to handle dynamic access safely
                                const typedBlockData = blockData as Record<
                                  string,
                                  any
                                >;

                                if (!(streamKey in typedBlockData)) {
                                  return [];
                                }

                                const roadArray = typedBlockData[streamKey];
                                if (!Array.isArray(roadArray)) {
                                  return [];
                                }

                                return roadArray
                                  .filter(
                                    (road: string) => road !== sectionEntry.road
                                  )
                                  .map((road: string) => ({
                                    value: road,
                                    label: road,
                                  }));
                              })()}
                              value={
                                sectionEntry?.otherRoads
                                  ? sectionEntry.otherRoads
                                      .split(",")
                                      .filter(Boolean)
                                      .map((road: string) => ({
                                        value: road,
                                        label: road,
                                      }))
                                  : []
                              }
                              onChange={(opts) =>
                                handleOtherAffectedLinesChange(
                                  block,
                                  opts as any
                                )
                              }
                              className="basic-multi-select"
                              classNamePrefix="select"
                              placeholder="Select other affected roads"
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  fontSize: "14px",
                                  minHeight: "36px",
                                  padding: "2px",
                                }),
                                option: (base) => ({
                                  ...base,
                                  fontSize: "14px",
                                  padding: "6px 12px",
                                }),
                                multiValueLabel: (base) => ({
                                  ...base,
                                  fontSize: "12px",
                                }),
                              }}
                            />
                          </div>
                        )}
                    </>
                  ) : (
                    // For regular sections in multiple selection
                    <>
                      <label className="block text-base font-medium text-black mb-2">
                        Line {block} <span className="text-red-600">*</span>
                      </label>
                      <select
                        className="input gov-input mb-3"
                        style={{
                          color: "black",
                          borderColor: errors[
                            `processedLineSections.${block}.lineName`
                          ]
                            ? "#dc2626"
                            : sectionEntry?.lineName
                            ? "#45526c"
                            : "#dc2626",
                        }}
                        value={sectionEntry?.lineName || ""}
                        onChange={(e) =>
                          handleLineNameSelection(block, e.target.value)
                        }
                      >
                        <option value="" disabled>
                          Select Line
                        </option>
                        {lineData[block as keyof typeof lineData]?.map(
                          (line: string) => (
                            <option key={line} value={line}>
                              {line}
                            </option>
                          )
                        )}
                      </select>
                      {errors[`processedLineSections.${block}.lineName`] && (
                        <span className="text-base text-red-700 font-medium mb-3 block">
                          Line selection is required
                        </span>
                      )}
                      {sectionEntry?.lineName && (
                        <div className="mt-2 mb-2">
                          <label className="block text-base font-medium text-black mb-2">
                            Other affected Line for {block}
                          </label>
                          <Select
                            isMulti
                            options={(
                              lineData[block as keyof typeof lineData] || []
                            )
                              .filter(
                                (l: string) => l !== sectionEntry.lineName
                              )
                              .map((l: string) => ({ value: l, label: l }))}
                            value={
                              sectionEntry?.otherLines
                                ? sectionEntry.otherLines
                                    .split(",")
                                    .filter(Boolean)
                                    .map((line: string) => ({
                                      value: line,
                                      label: line,
                                    }))
                                : []
                            }
                            onChange={(opts) =>
                              handleOtherAffectedLinesChange(block, opts as any)
                            }
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select other affected lines"
                            styles={{
                              control: (base) => ({
                                ...base,
                                fontSize: "14px",
                                minHeight: "36px",
                                padding: "2px",
                              }),
                              option: (base) => ({
                                ...base,
                                fontSize: "14px",
                                padding: "6px 12px",
                              }),
                              multiValueLabel: (base) => ({
                                ...base,
                                fontSize: "12px",
                              }),
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Caution Requirements
          </h2>
          {(session?.user.department === "S&T" ||
            session?.user.department === "ENGG") && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Whether Fresh Caution will be imposed after block{" "}
                    {(session?.user.department === "S&T" ||
                      session?.user.department === "ENGG") && (
                      <span className="text-red-600">*</span>
                    )}
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="freshCautionRequired"
                        value="true"
                        checked={formData.freshCautionRequired === true}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4"
                      />
                      <span className="ml-2 text-sm">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="freshCautionRequired"
                        value="false"
                        checked={formData.freshCautionRequired === false}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4"
                      />
                      <span className="ml-2 text-sm">No</span>
                    </label>
                  </div>
                  {errors.freshCautionRequired && (
                    <span className="text-xs text-red-700 font-medium mt-1 block">
                      {errors.freshCautionRequired}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Whether Power Block Needed{" "}
                    {session?.user.department === "S&T" ||
                      (session?.user.department === "ENGG" && (
                        <span className="text-red-600">*</span>
                      ))}
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="powerBlockRequired"
                        value="true"
                        checked={formData.powerBlockRequired === true}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4"
                      />
                      <span className="ml-2 text-sm">Yes</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="powerBlockRequired"
                        value="false"
                        checked={formData.powerBlockRequired === false}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4"
                      />
                      <span className="ml-2 text-sm">No</span>
                    </label>
                  </div>
                  {errors.powerBlockRequired && (
                    <span className="text-xs text-red-700 font-medium mt-1 block">
                      {errors.powerBlockRequired}
                    </span>
                  )}
                </div>
              </div>

              {formData.freshCautionRequired === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Fresh Caution Speed{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      name="freshCautionSpeed"
                      value={formData.freshCautionSpeed || 0}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.freshCautionSpeed
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.freshCautionSpeed && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.freshCautionSpeed}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Fresh Caution Location From{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="freshCautionLocationFrom"
                      value={formData.freshCautionLocationFrom || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.freshCautionLocationFrom
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.freshCautionLocationFrom && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.freshCautionLocationFrom}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Fresh Caution Location To{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="freshCautionLocationTo"
                      value={formData.freshCautionLocationTo || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.freshCautionLocationTo
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.freshCautionLocationTo && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.freshCautionLocationTo}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {formData.powerBlockRequired === true && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Power Block Requirements *
                    </label>
                    <div className="space-y-1 flex gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value="Gears Required"
                          checked={powerBlockRequirements.includes(
                            "Gears Required"
                          )}
                          onChange={(e) => {
                            handlePowerBlockRequirementsChange(
                              "Gears Required",
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-4 w-4"
                        />
                        <span className="ml-2 text-sm">Gears Required</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          value="Staff Required"
                          checked={powerBlockRequirements.includes(
                            "Staff Required"
                          )}
                          onChange={(e) => {
                            handlePowerBlockRequirementsChange(
                              "Staff Required",
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-4 w-4"
                        />
                        <span className="ml-2 text-sm">Staff Required</span>
                      </label>
                    </div>
                    {errors.powerBlockRequirements && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.powerBlockRequirements}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Elementary Section <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="elementarySection"
                      value={formData.elementarySection || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.elementarySection
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.elementarySection && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.elementarySection}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2">
                <label className="block text-sm font-medium text-black mb-1">
                  Whether S&T Disconnection Required{" "}
                  {session?.user.department === "S&T" ||
                    (session?.user.department === "ENGG" && (
                      <span className="text-red-600">*</span>
                    ))}
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sntDisconnectionRequired"
                      value="true"
                      checked={formData.sntDisconnectionRequired === true}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4"
                    />
                    <span className="ml-2 text-sm">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="sntDisconnectionRequired"
                      value="false"
                      checked={formData.sntDisconnectionRequired === false}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4"
                    />
                    <span className="ml-2 text-sm">No</span>
                  </label>
                </div>
                {errors.sntDisconnectionRequired && (
                  <span className="text-xs text-red-700 font-medium mt-1 block">
                    {errors.sntDisconnectionRequired}
                  </span>
                )}
              </div>

              {sntDisconnectionChecked && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Line From <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="sntDisconnectionLineFrom"
                      value={formData.sntDisconnectionLineFrom || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.sntDisconnectionLineFrom
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.sntDisconnectionLineFrom && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.sntDisconnectionLineFrom}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Line To <span className="text-red-600">*</span>
                    </label>
                    <input
                      name="sntDisconnectionLineTo"
                      value={formData.sntDisconnectionLineTo || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.sntDisconnectionLineTo
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    />
                    {errors.sntDisconnectionLineTo && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.sntDisconnectionLineTo}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">
                      Disconnection Requirements *
                    </label>
                    <div className="space-x-2 flex ">
                      <label className="inline-flex whitespace-nowrap items-center">
                        <input
                          type="checkbox"
                          value="Gears Required"
                          checked={sntDisconnectionRequirements.includes(
                            "Gears Required"
                          )}
                          onChange={(e) => {
                            handleSntDisconnectionRequirementsChange(
                              "Gears Required",
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-3 w-3"
                        />
                        <span className="ml-1 text-xs text-black">
                          Gears Required
                        </span>
                      </label>
                      <label className="inline-flex whitespace-nowrap items-center">
                        <input
                          type="checkbox"
                          value="Staff Required"
                          checked={sntDisconnectionRequirements.includes(
                            "Staff Required"
                          )}
                          onChange={(e) => {
                            handleSntDisconnectionRequirementsChange(
                              "Staff Required",
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-3 w-3"
                        />
                        <span className="ml-1 text-xs text-black">
                          Staff Required
                        </span>
                      </label>
                    </div>
                    {errors.sntDisconnectionRequirements && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.sntDisconnectionRequirements}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {session?.user.department === "TRD" && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Work Location To{" "}
                {session?.user.department === "TRD" && (
                  <span className="text-red-600">*</span>
                )}
              </label>
              <input
                name="workLocationTo"
                value={formData.workLocationTo || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{
                  color: "black",
                  borderColor: errors.workLocationTo ? "#dc2626" : "#45526c",
                  fontSize: "14px",
                }}
              />
              {errors.workLocationTo && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.workLocationTo}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Time Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
            <div className="form-group col-span-1">
              <label className="block text-sm font-medium text-black mb-1">
                Demand Time From <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="demandTimeFrom"
                value={formData.demandTimeFrom || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{ color: "black", fontSize: "14px" }}
                aria-required="true"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                24-hour railway timing (e.g., 23:30)
              </span>
              {errors.demandTimeFrom && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.demandTimeFrom}
                </span>
              )}
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
                className="input gov-input"
                style={{ color: "black", fontSize: "14px" }}
                aria-required="true"
              />
              <span className="text-xs text-gray-500 mt-1 block">
                24-hour railway timing (e.g., 23:30)
              </span>
              {errors.demandTimeTo && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.demandTimeTo}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <button
              type="submit"
              className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm"
              disabled={formSubmitting}
              aria-label="Submit block request form"
            >
              {formSubmitting ? "Submitting..." : "Submit Block Request"}
            </button>
          </div>
        </div>

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

        <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
          <span className="text-red-600">*</span> Required fields • ©{" "}
          {new Date().getFullYear()} Indian Railways
        </div>
      </form>

      <style jsx global>{`
        :root {
          --primary-color: #13529e;
          --error-color: #d32f2f;
          --border-color: #000000;
          --focus-color: #1976d2;
          --font-family: "Arial", "Noto Sans", sans-serif;
        }
        body {
          font-family: var(--font-family);
          font-size: 14px;
          margin: 0;
          padding: 0;
        }
        .form-group {
          margin-bottom: 6px;
        }
        .gov-input {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid var(--border-color);
          border-radius: 2px;
          margin-top: 2px;
          margin-bottom: 2px;
          background: white;
          font-size: 14px;
          font-family: var(--font-family);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gov-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 2px rgba(19, 82, 158, 0.2);
        }
        input[type="checkbox"],
        input[type="radio"] {
          accent-color: #13529e;
          width: 16px;
          height: 16px;
        }
        select.gov-input {
          appearance: none;
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="%2313529e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>');
          background-repeat: no-repeat;
          background-position: right 8px center;
          padding-right: 24px;
        }
        @media (max-width: 768px) {
          .grid-cols-2 {
            grid-template-columns: 1fr !important;
          }
          .grid-cols-3 {
            grid-template-columns: 1fr !important;
          }
          .w-full.max-w-6xl {
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
