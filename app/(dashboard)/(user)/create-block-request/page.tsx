"use client";
import ConfirmationDialog from "@/app/components/ui/ConfirmationDiagonal";
import React, { useState, useEffect } from "react";
import { useCreateUserRequest } from "@/app/service/mutation/user-request";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
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
} from "@/app/lib/helper";

type Department = "TRD" | "S&T" | "ENGG";

// Add this after the helper functions and before the component function body
// Shared styles for all react-select components with improved contrast
const selectStyles = {
  dropdownIndicator: (base: any) => ({
    ...base,
    color: "#13529e",
  }),
  placeholder: (base: any) => ({
    ...base,
    fontSize: "14px",
    color: "#6b7280", // Medium gray for placeholder
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 10,
    backgroundColor: "white",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  }),
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "white",
    color: "black",
    borderColor: state.isFocused ? "#2461aa" : "#45526c",
    borderWidth: "1px",
    borderRadius: "4px",
    padding: "2px",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(37, 99, 176, 0.1)" : "none",
    fontSize: "14px",
    minHeight: "36px",
    "&:hover": {
      borderColor: "#2461aa",
    },
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "#f3f4f6",
    color: "black",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "black",
    fontSize: "12px",
    padding: "2px 4px",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "#ef4444",
    paddingLeft: "4px",
    paddingRight: "4px",
    ":hover": {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    color: "black",
    backgroundColor: state.isSelected
      ? "#e0e7ef"
      : state.isFocused
      ? "#f3f4f6"
      : "white",
    fontSize: "14px",
    padding: "6px 12px",
    "&:hover": {
      backgroundColor: "#f3f4f6",
    },
    "&:active": {
      backgroundColor: "#e0e7ef",
    },
  }),
  input: (base: any) => ({
    ...base,
    color: "black",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "black",
  }),
};

// Generate select styles with error state
const getSelectStyles = (hasError: boolean) => {
  return {
    ...selectStyles,
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "white",
      color: "black",
      borderColor: hasError
        ? "#dc2626"
        : state.isFocused
        ? "#2461aa"
        : "#45526c",
      borderWidth: hasError ? "2px" : "1px",
      borderRadius: "4px",
      padding: "2px",
      boxShadow: hasError
        ? "0 0 0 1px rgba(220, 38, 38, 0.2)"
        : state.isFocused
        ? "0 0 0 1px rgba(37, 99, 176, 0.1)"
        : "none",
      fontSize: "14px",
      minHeight: "36px",
      "&:hover": {
        borderColor: hasError ? "#dc2626" : "#2461aa",
      },
    }),
  };
};

// Add a constant for S&T Disconnection assignment emails near the top of the file with other constants
const sntDisconnectionAssignToOptions = [
  { name: "S&T User", email: "snt.user@test.com" },
  { name: "Officer 2", email: "snt.officer2@railways.com" },
  { name: "Supervisor", email: "snt.supervisor@railways.com" },
  { name: "Manager", email: "snt.manager@railways.com" },
  { name: "Engineer", email: "snt.engineer@railways.com" },
];

// Add RNT disconnection options
const trdDisconnectionAssignToOptions = [
  { name: "Elec Engineer", email: "snt.user@test.com" },
  { name: "Elec Supervisor", email: "trd.supervisor@railways.com" },
  { name: "Elec Officer", email: "trd.officer@railways.com" },
  { name: "Elec Manager", email: "trd.manager@railways.com" },
];

export default function CreateBlockRequestPage() {
  const [formData, setFormData] = useState<
    Partial<UserRequestInput> & {
      selectedStreams?: Record<string, string>;
      selectedRoads?: Record<string, string[]>;
      sntDisconnectionRequired?: boolean | null;
      powerBlockRequired?: boolean | null;
      freshCautionRequired?: boolean | null;
      powerBlockRequirements: string[];
      sntDisconnectionRequirements: string[];
      sntDisconnectionAssignTo?: string; // Add this new field
      trdDisconnectionAssignTo?: string;
    }
  >({
    date: "",
    selectedDepartment: "",
    selectedSection: "",
    missionBlock: "",
    workType: "",
    activity: "",
    corridorTypeSelection: null,
    cautionRequired: false,
    cautionSpeed: 0,
    freshCautionSpeed: 0,
    adjacentLinesAffected: "",
    workLocationFrom: "",
    workLocationTo: "",
    trdWorkLocation: "",
    demandTimeFrom: "",
    demandTimeTo: "",
    elementarySection: "",
    requestremarks: "",
    selectedDepo: "",
    routeFrom: "",
    routeTo: "",
    powerBlockRequirements: [],
    sntDisconnectionRequirements: [],
    sntDisconnectionRequired: null,
    powerBlockRequired: null,
    freshCautionRequired: null,
    freshCautionLocationFrom: "",
    freshCautionLocationTo: "",
    sntDisconnectionLineFrom: "",
    sntDisconnectionLineTo: "",
    processedLineSections: [],
    repercussions: "",
    selectedStream: "",
    sntDisconnectionAssignTo: "", // Initialize with empty string
    trdDisconnectionAssignTo: "",
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customActivity, setCustomActivity] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [blockSectionValue, setBlockSectionValue] = useState<string[]>([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [sntDisconnectionChecked, setSntDisconnectionChecked] = useState(false);
  // const[powerBlockChecked,setPowerBlockChecked]=useState(false);
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

  // Helper function to get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Add 1 day
    return tomorrow.toISOString().split("T")[0]; // Format: "2025-05-10"
  };

  // Helper function to check if a date is in the current week
  const isDateInCurrentWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const targetDate = new Date(dateString);

    // Get the current week's Monday and Sunday
    const currentWeekMonday = new Date(today);
    const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1; // Adjust for Sunday (0)
    currentWeekMonday.setDate(today.getDate() - daysSinceMonday);

    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);

    // Check if the target date is between Monday and Sunday of current week
    return targetDate >= currentWeekMonday && targetDate <= currentWeekSunday;
  };

  // Helper function to check if a date is today or within the next two days
  const isWithinNextTwoDays = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    // Get date two days from today
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    // Check if the target date is today or within next two days
    return targetDate >= today && targetDate <= twoDaysFromNow;
  };

  // Helper function to check if a date is in next week (Week 2)
  const isDateInNextWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    // Get the current week's Sunday
    const currentWeekSunday = new Date(today);
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    currentWeekSunday.setDate(today.getDate() + daysUntilSunday);

    // Get next week's Monday and Sunday
    const nextWeekMonday = new Date(currentWeekSunday);
    nextWeekMonday.setDate(currentWeekSunday.getDate() + 1);

    const nextWeekSunday = new Date(nextWeekMonday);
    nextWeekSunday.setDate(nextWeekMonday.getDate() + 6);

    // Check if the target date is in next week
    return targetDate >= nextWeekMonday && targetDate <= nextWeekSunday;
  };

  // Helper function to check if we're past Thursday 22:00 cutoff for Week 2 planning
  const isPastThursdayCutoff = (): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
    const hour = now.getHours();

    // Return true if it's Thursday after 22:00 or if it's Friday/Saturday/Sunday
    return (dayOfWeek === 4 && hour >= 22) || dayOfWeek > 4;
  };

  // Helper function to determine corridor type restrictions based on date
  const getCorridorTypeRestrictions = (
    dateString: string
  ): {
    urgentOnly: boolean;
    urgentAllowed: boolean;
    message: string;
  } => {
    if (!dateString) {
      return { urgentOnly: false, urgentAllowed: false, message: "" };
    }

    // Check if date is within 2 days (today, tomorrow, day after)
    const isUrgentTimeframe = isWithinNextTwoDays(dateString);

    // Check if date is in next week (Week 2)
    const isNextWeek = isDateInNextWeek(dateString);

    // Check if we're past Thursday cutoff
    const pastThursdayCutoff = isPastThursdayCutoff();

    // Urgent blocks are only allowed within next 2 days
    const urgentAllowed = isUrgentTimeframe;

    // Urgent blocks are required for next 2 days, or for Week 2 if past Thursday cutoff
    const urgentOnly = isUrgentTimeframe || (isNextWeek && pastThursdayCutoff);

    // Set appropriate message
    let message = "";
    if (isUrgentTimeframe) {
      message =
        "Dates within today and next 2 days must be Urgent Block requests.";
    } else if (isNextWeek && pastThursdayCutoff) {
      message =
        "Week 2 requests after Thursday 22:00 cutoff must be Urgent Block requests.";
    }

    return { urgentOnly, urgentAllowed, message };
  };

  // Helper function to check if a date is in the current week but beyond the 2-day urgent window
  const isBlockedCurrentWeekDate = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    // Get max allowed urgent date (day after tomorrow)
    const maxUrgentDate = new Date(today);
    maxUrgentDate.setDate(today.getDate() + 2);

    // Get the current week's Sunday
    const currentWeekSunday = new Date(today);
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    currentWeekSunday.setDate(today.getDate() + daysUntilSunday);

    // Check if date is in current week but beyond the urgent window
    return targetDate > maxUrgentDate && targetDate <= currentWeekSunday;
  };

  // Helper function to determine if a date is selectable
  const isDateSelectable = (dateString: string): boolean => {
    if (!dateString) return false;

    // Don't allow selection of current week dates beyond the urgent window
    return !isBlockedCurrentWeekDate(dateString);
  };

  // Helper function to get the min allowed date (today)
  const getMinDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Format: "2025-05-10"
  };

  // Helper function to get the max date for current week excluding urgent window
  const getMaxUrgentDateString = () => {
    const today = new Date();
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    return dayAfterTomorrow.toISOString().split("T")[0];
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Special handling for date field
    if (name === "date") {
      // Check if the selected date is allowed
      if (value && !isDateSelectable(value)) {
        // If date is in current week but beyond urgent window, show error and don't update state
        setErrors({
          ...errors,
          date: "Dates in current week beyond today, tomorrow, and day after tomorrow are not available for block requests.",
        });
        return;
      }
    }

    if (type === "checkbox") {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked,
      });
    } else if (type === "radio") {
      const newValue =
        value === "true" ? true : value === "false" ? false : value;
      setFormData({
        ...formData,
        [name]: newValue,
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
    // Clear previous errors
    setErrors({});

    let newErrors: Record<string, string> = {};
    let hasError = false;

    // Basic required fields that are always needed
    const alwaysRequired = [
      "date",
      "corridorTypeSelection",
      "selectedSection",
      "selectedDepo",
      "demandTimeFrom",
      "demandTimeTo",
      "workType",
      "activity",
      "missionBlock", // This is your block section
    ];

    // Check always required fields
    alwaysRequired.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())} is required`;
        hasError = true;
      }
    });

    // Special case for block section validation
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
        // Yard section validation
        if (!sectionEntry || !sectionEntry.road) {
          newErrors[`${block}.road`] = `Road for ${block} is required`;
          hasError = true;
        }
        if (!sectionEntry?.stream) {
          newErrors[`${block}.stream`] = `Stream for ${block} is required`;
          hasError = true;
        }
      } else {
        // Regular section validation
        if (!sectionEntry || !sectionEntry.lineName) {
          newErrors[`${block}.lineName`] = `Line for ${block} is required`;
          hasError = true;
        }
      }
    }

    // Department-specific validations
    if (session?.user.department === "TRD") {
      if (!formData.repercussions) {
        newErrors.repercussions = "Coaching repercussions are required";
        hasError = true;
      }
    }

    if (session?.user.department === "S&T") {
      if (!formData.routeFrom || !formData.routeTo) {
        if (!formData.routeFrom) newErrors.routeFrom = "Route From is required";
        if (!formData.routeTo) newErrors.routeTo = "Route To is required";
        hasError = true;
      }
    }

    // Outside corridor requires remarks
    if (
      formData.corridorTypeSelection === "Outside Corridor" &&
      !formData.requestremarks?.trim()
    ) {
      newErrors.requestremarks =
        "Remarks are required for Outside Corridor requests";
      hasError = true;
    }

    // Custom activity validation
    if (formData.activity === "others" && !customActivity.trim()) {
      newErrors.activity = "Please specify the custom activity";
      hasError = true;
    }

    // S&T disconnection validation
    if (formData.sntDisconnectionRequired === true) {
      if (!formData.sntDisconnectionLineFrom) {
        newErrors.sntDisconnectionLineFrom =
          "Disconnection Line From is required";
        hasError = true;
      }
      if (!formData.sntDisconnectionLineTo) {
        newErrors.sntDisconnectionLineTo = "Disconnection Line To is required";
        hasError = true;
      }
      if (!formData.sntDisconnectionAssignTo) {
        newErrors.sntDisconnectionAssignTo =
          "Please select who to assign the S&T disconnection to";
        hasError = true;
      }
    }

    // Power block validation
    if (formData.powerBlockRequired === true) {
      if (!formData.elementarySection) {
        newErrors.elementarySection =
          "Elementary Section is required for power block";
        hasError = true;
      }
      if (!formData.trdDisconnectionAssignTo) {
        newErrors.trdDisconnectionAssignTo =
          "Please select who to assign the power block disconnection to";
        hasError = true;
      }
    }

    // Fresh caution validation
    if (formData.freshCautionRequired === true) {
      if (!formData.freshCautionLocationFrom) {
        newErrors.freshCautionLocationFrom =
          "Caution Location From is required";
        hasError = true;
      }
      if (!formData.freshCautionLocationTo) {
        newErrors.freshCautionLocationTo = "Caution Location To is required";
        hasError = true;
      }
      if (!formData.freshCautionSpeed || formData.freshCautionSpeed <= 0) {
        newErrors.freshCautionSpeed = "Valid Caution Speed is required";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(newErrors)[0];
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!handleFormValidation()) {
      toast.error("Please fill all required fields", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = () => {
    setShowConfirmation(false);
    setFormSubmitting(true);
    const finalActivity =
      formData.activity === "others" ? customActivity : formData.activity;
    const validProcessedSections = (
      formData.processedLineSections || []
    ).filter((section) => blockSectionValue.includes(section.block));

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
      adminAcceptance: false,
      corridorType: formData.corridorTypeSelection,
      activity: finalActivity,
      date: formData.date ? formatDateToISO(formData.date) : "",
      demandTimeFrom: formData.demandTimeFrom
        ? formatTimeToDatetime(formData.date || "", formData.demandTimeFrom)
        : "",
      demandTimeTo: formData.demandTimeTo
        ? formatTimeToDatetime(formData.date || "", formData.demandTimeTo)
        : "",
      processedLineSections: processedSectionsWithDefaults,
      sntDisconnectionRequired: formData.sntDisconnectionRequired,
      powerBlockRequired: formData.powerBlockRequired,
      freshCautionRequired: formData.freshCautionRequired,
      freshCautionLocationFrom: formData.freshCautionLocationFrom,
      freshCautionLocationTo: formData.freshCautionLocationTo,
      freshCautionSpeed: formData.freshCautionSpeed,
      adjacentLinesAffected: formData.adjacentLinesAffected,
      sntDisconnectionLineFrom: formData.sntDisconnectionLineFrom,
      sntDisconnectionLineTo: formData.sntDisconnectionLineTo,
      powerBlockRequirements: formData.powerBlockRequirements,
      elementarySection: formData.elementarySection,
      sntDisconnectionRequirements: formData.sntDisconnectionRequirements,
      sntDisconnectionAssignTo: formData.sntDisconnectionAssignTo,
      trdDisconnectionAssignTo: formData.trdDisconnectionAssignTo,
    };

    try {
      mutation.mutate(processedFormData as UserRequestInput, {
        onSuccess: (data) => {
          console.log("Success:", data);
          setSuccess("Block request created successfully!");
          // Reset form
          setFormData({
            ...formData,
            sntDisconnectionRequired: null,
            powerBlockRequired: null,
            freshCautionRequired: null,
            freshCautionLocationFrom: "",
            freshCautionLocationTo: "",
            sntDisconnectionRequirements: [],
            sntDisconnectionLineFrom: "",
            elementarySection: "",
            sntDisconnectionLineTo: "",
            powerBlockRequirements: [],
            sntDisconnectionAssignTo: "",
            trdDisconnectionAssignTo: "",
            date: "",
            selectedDepartment: session?.user.department || "",
            selectedSection: "",
            missionBlock: "",
            workType: "",
            activity: "",
            corridorTypeSelection: null,
            cautionRequired: false,
            cautionSpeed: 0,
            freshCautionSpeed: 0,
            adjacentLinesAffected: "",
            processedLineSections: [],
            selectedStream: "",
            demandTimeFrom: "",
            demandTimeTo: "",
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
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    console.log(
      "Current powerBlockRequired state:",
      formData.powerBlockRequired
    );
  }, [formData.powerBlockRequired]);

  useEffect(() => {
    if (!formData.date) {
      setIsDisabled(true);
      setFormData({ ...formData, corridorTypeSelection: null });
    } else {
      // Get corridor type restrictions based on selected date
      const { urgentOnly, urgentAllowed, message } =
        getCorridorTypeRestrictions(formData.date);

      if (urgentOnly) {
        // If urgent block is required, disable other options and set to Urgent
        setIsDisabled(true);
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      } else {
        // Otherwise, normal options are available
        setIsDisabled(false);

        // If user had Urgent Block selected but it's not allowed, reset selection
        if (
          formData.corridorTypeSelection === "Urgent Block" &&
          !urgentAllowed
        ) {
          setFormData({
            ...formData,
            corridorTypeSelection: null,
          });
        }
      }
    }
  }, [formData.date]);

  useEffect(() => {
    setSntDisconnectionChecked(
      String(formData.sntDisconnectionRequired) === "true"
    );
  }, [formData.sntDisconnectionRequired]);

  // useEffect(() => {
  //   setTrdDisconnectionChecked(
  //     String(formData.trdDisconnectionRequired) === "true"
  //   );
  // }, [formData.trdDisconnectionRequired]);

  // useEffect(()=>{
  //   setPowerBlockChecked(
  //     String(formData.powerBlockRequired)==="true"
  //   )
  // },[formData.powerBlockRequired])

  const handlePowerBlockRequirementsChange = (
    value: string,
    checked: boolean
  ) => {
    let newRequirements = [...(powerBlockRequirements || [])].filter(
      Boolean
    ) as string[];
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
  // Fix the handleStreamSelection function to preserve road value
  const handleStreamSelection = (block: string, value: string) => {
    // Update processedLineSections directly
    setFormData((prev) => {
      // Get existing processed sections
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      // Find the index of the section for this block
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      // Create the updated section - preserve road when stream changes
      if (sectionIndex >= 0) {
        // Keep existing values and just update the stream
        const updatedSection = {
          ...existingProcessedSections[sectionIndex],
          stream: value,
          type: "yard", // Ensure type is set
        };
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        // If somehow there's no section yet (unlikely), create one
        existingProcessedSections.push({
          block,
          type: "yard",
          stream: value,
          road: "",
          otherRoads: "",
          lineName: "", // Add required property
          otherLines: "", // Add required property
        });
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
  // Helper function to get all roads for a yard block regardless of stream
  const getAllRoadsForYard = (blockKey: string): string[] => {
    if (!blockKey || !blockKey.includes("-YD") || !(blockKey in streamData)) {
      return [];
    }

    const blockData = streamData[blockKey as keyof typeof streamData];
    if (!blockData || typeof blockData !== "object") {
      return [];
    }

    // Flatten all roads from all streams into a single array
    const allRoads: string[] = [];

    Object.keys(blockData).forEach((streamKey) => {
      const roads = (blockData as Record<string, string[]>)[streamKey] || [];
      roads.forEach((road) => {
        if (!allRoads.includes(road)) {
          allRoads.push(road);
        }
      });
    });

    return allRoads;
  };
  // Update the handleRoadSelection function to not depend on stream
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
          type: "yard", // Ensure type is set to yard
        };
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        // Create new section if it doesn't exist
        existingProcessedSections.push({
          block,
          type: "yard",
          road: value,
          stream: "",
          otherRoads: "",
          lineName: "", // Add required property
          otherLines: "", // Add required property
        });
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
              min={getMinDateString()}
            />
            {errors.date && (
              <span className="text-xs text-red-700 font-medium mt-1 block">
                {errors.date}
              </span>
            )}
            <span className="text-xs text-gray-600 mt-1 block">
              Note: Only today, tomorrow, and day after tomorrow are available
              for urgent blocks. Dates in current week beyond these are not
              available. Week 2 block requests must be submitted before Thursday
              22:00 of current week.
            </span>
          </div>
          <div className="form-group col-span-1 text-black">
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
                    formData.corridorTypeSelection === "Outside Corridor"
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
                  checked={formData.corridorTypeSelection === "Urgent Block"}
                  onChange={handleInputChange}
                  disabled={
                    !formData.date ||
                    !getCorridorTypeRestrictions(formData.date).urgentAllowed
                  }
                  className="form-radio h-4 w-4"
                />
                <span className="ml-2 text-sm">Urgent Block</span>
              </label>
            </div>
            {isDisabled && formData.date && (
              <span className="text-xs text-amber-700 mt-1 block">
                {getCorridorTypeRestrictions(formData.date).message}
              </span>
            )}
            {formData.date &&
              !getCorridorTypeRestrictions(formData.date).urgentAllowed && (
                <span className="text-xs text-gray-600 mt-1 block">
                  Urgent Block is only available for today and the next 2 days.
                </span>
              )}
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

          {/* {session?.user.department === "S&T" && (
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
          )} */}
          {session?.user.department === "S&T" && (
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
                    style={{
                      color: "black",
                      fontSize: "14px",
                      borderColor: errors.routeFrom ? "#dc2626" : "#45526c",
                    }}
                    aria-label="Route from location"
                  />
                  {errors.routeFrom && (
                    <span className="text-xs text-red-700 font-medium mt-1 block">
                      {errors.routeFrom}
                    </span>
                  )}
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
                    style={{
                      color: "black",
                      fontSize: "14px",
                      borderColor: errors.routeTo ? "#dc2626" : "#45526c",
                    }}
                    aria-label="Route to location"
                  />
                  {errors.routeTo && (
                    <span className="text-xs text-red-700 font-medium mt-1 block">
                      {errors.routeTo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {session?.user.department === "TRD" && (
            <div className="form-group col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label
                    className="block text-sm font-medium text-black mb-1"
                    htmlFor="elementarySection"
                  >
                    Elementary Section
                  </label>
                  <input
                    id="elementarySection"
                    name="elementarySection"
                    value={formData.elementarySection || ""}
                    onChange={handleInputChange}
                    className="input gov-input"
                    style={{ color: "black", fontSize: "14px" }}
                    aria-label="Route from location"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-black mb-1"
                    htmlFor="trdWorkLocation"
                  >
                    Work Location
                  </label>
                  <input
                    id="trdWorkLocation"
                    name="trdWorkLocation"
                    value={formData.trdWorkLocation || ""}
                    onChange={handleInputChange}
                    className="input gov-input"
                    style={{ color: "black", fontSize: "14px" }}
                    aria-label="Route to location"
                  />
                </div>
              </div>
            </div>
          )}

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
              Depot / SSE <span className="text-red-600">*</span>
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
                Select Depot / SSE
              </option>
              {selectedMajorSection &&
              session?.user.department &&
              depot[selectedMajorSection] &&
              depot[selectedMajorSection][
                session.user.department as Department
              ] ? (
                depot[selectedMajorSection][
                  session.user.department as Department
                ].map((depotOption: string, index) => (
                  <option key={index} value={depotOption}>
                    {depotOption}
                  </option>
                ))
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

          {session?.user.department === "ENGG" && (
            <div className="form-group col-span-1">
              <div>
                <label
                  className="block text-sm font-medium text-black "
                  htmlFor="workLocationFrom"
                >
                  Work Location
                </label>
                <input
                  id="workLocationFrom"
                  name="workLocationFrom"
                  value={formData.workLocationFrom || ""}
                  onChange={handleInputChange}
                  className="input gov-input"
                  style={{ color: "black", fontSize: "14px" }}
                  aria-label="Route from location"
                />
              </div>
            </div>
          )}
        </div>

        {/* Block Section and Work Details */}
        <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Block Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
            <div className="form-group col-span-2">
              <label className="block text-sm font-medium text-black mb-1">
                Block Section / Yard <span className="text-red-600">*</span>
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
                isDisabled={!selectedMajorSection}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={
                  selectedMajorSection
                    ? "Select Block Section"
                    : "Select Major Section first"
                }
                styles={getSelectStyles(!!errors.missionBlock)}
              />
              {errors.missionBlock && blockSectionValue.length === 0 && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.missionBlock}
                </span>
              )}

              <div>
                {" "}
                {blockSectionValue.length === 1 && (
                  <div className="mt-4">
                    {blockSectionValue[0].includes("-YD") ? (
                      // For yard sections (containing -YD)
                      <div>
                        {/* Road selection - shown first */}
                        <label className="block text-sm font-medium text-black mb-1">
                          Road for {blockSectionValue[0]}{" "}
                          <span className="text-red-600">*</span>
                        </label>
                        <div>
                          {(() => {
                            // Find the section in processedLineSections for this block
                            const sectionEntry =
                              formData.processedLineSections?.find(
                                (section) =>
                                  section.block === blockSectionValue[0]
                              );
                            const roadValue = sectionEntry?.road || "";

                            // Get all roads for this yard
                            const allRoads = getAllRoadsForYard(
                              blockSectionValue[0]
                            );

                            // Check if we have error
                            const hasRoadError =
                              errors[
                                `processedLineSections.${blockSectionValue[0]}.road`
                              ];

                            return (
                              <>
                                <select
                                  className="input gov-input"
                                  style={{
                                    color: "black",
                                    borderColor: hasRoadError
                                      ? "#dc2626"
                                      : roadValue
                                      ? "#45526c"
                                      : "#dc2626",
                                    fontSize: "14px",
                                  }}
                                  value={roadValue}
                                  onChange={(e) =>
                                    handleRoadSelection(
                                      blockSectionValue[0],
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="" disabled>
                                    Select Road
                                  </option>
                                  {allRoads.map((road: string) => (
                                    <option key={road} value={road}>
                                      {road}
                                    </option>
                                  ))}
                                </select>
                                {hasRoadError && (
                                  <span className="text-xs text-red-700 font-medium mb-2 block">
                                    Road selection is required
                                  </span>
                                )}

                                {/* Stream selection - independent now */}
                                {roadValue && (
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-black mb-1">
                                      Direction of traffic affected for{" "}
                                      {blockSectionValue[0]}{" "}
                                      <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                      className="input gov-input"
                                      style={{
                                        color: "black",
                                        borderColor: errors[
                                          `processedLineSections.${blockSectionValue[0]}.stream`
                                        ]
                                          ? "#dc2626"
                                          : sectionEntry?.stream
                                          ? "#45526c"
                                          : "#dc2626",
                                        fontSize: "14px",
                                      }}
                                      value={sectionEntry?.stream || ""}
                                      onChange={(e) => {
                                        // Use a function that explicitly preserves the road value
                                        const streamValue = e.target.value;
                                        setFormData((prev) => {
                                          const existingSections = [
                                            ...(prev.processedLineSections ||
                                              []),
                                          ];
                                          const sectionIndex =
                                            existingSections.findIndex(
                                              (section) =>
                                                section.block ===
                                                blockSectionValue[0]
                                            );

                                          if (sectionIndex >= 0) {
                                            const currentSection =
                                              existingSections[sectionIndex];
                                            existingSections[sectionIndex] = {
                                              ...currentSection,
                                              stream: streamValue,
                                            };
                                          } else {
                                            existingSections.push({
                                              block: blockSectionValue[0],
                                              type: "yard",
                                              stream: streamValue,
                                              road: roadValue,
                                              otherRoads: "",
                                              lineName: "",
                                              otherLines: "",
                                            });
                                          }

                                          return {
                                            ...prev,
                                            processedLineSections:
                                              existingSections,
                                          };
                                        });
                                      }}
                                    >
                                      <option value="" disabled>
                                        Select Stream
                                      </option>
                                      {streamData &&
                                        blockSectionValue[0] in streamData &&
                                        Object.keys(
                                          streamData[
                                            blockSectionValue[0] as keyof typeof streamData
                                          ]
                                        ).map((stream) => (
                                          <option key={stream} value={stream}>
                                            {stream}
                                          </option>
                                        ))}
                                    </select>
                                    {errors[
                                      `processedLineSections.${blockSectionValue[0]}.stream`
                                    ] && (
                                      <span className="text-xs text-red-700 font-medium mb-2 block">
                                        Stream selection is required
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Other affected roads */}
                                {roadValue && (
                                  <div className="mt-4">
                                    <label className="block text-sm font-medium text-black mb-1">
                                      Other affected Roads for{" "}
                                      {blockSectionValue[0]}
                                    </label>
                                    <Select
                                      isMulti
                                      options={allRoads
                                        .filter((road) => road !== roadValue)
                                        .map((road) => ({
                                          value: road,
                                          label: road,
                                        }))}
                                      value={
                                        sectionEntry?.otherRoads
                                          ? sectionEntry.otherRoads
                                              .split(",")
                                              .filter(Boolean)
                                              .map((road) => ({
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
                                      styles={getSelectStyles(false)}
                                    />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
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
                          const sectionEntry =
                            formData.processedLineSections?.find(
                              (section) =>
                                section.block === blockSectionValue[0]
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
                                    Other affected Line for{" "}
                                    {blockSectionValue[0]}
                                  </label>
                                  <Select
                                    isMulti
                                    options={(
                                      lineData[
                                        blockSectionValue[0] as keyof typeof lineData
                                      ] || []
                                    )
                                      .filter((l: string) => l !== lineValue)
                                      .map((l: string) => ({
                                        value: l,
                                        label: l,
                                      }))}
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
                                    styles={getSelectStyles(false)}
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
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-black mb-4">
                      Line Selections
                    </h3>
                    {blockSectionValue.map((block) => {
                      // Find the section in processedLineSections for this block
                      const sectionEntry = formData.processedLineSections?.find(
                        (section) => section.block === block
                      );

                      return (
                        <div
                          key={block}
                          className="mb-4 pb-4 border-b border-gray-200"
                        >
                          {block.includes("-YD") ? (
                            // For yard sections in multiple selection
                            <>
                              <label className="block text-base font-medium text-black mb-2">
                                Road for {block}{" "}
                                <span className="text-red-600">*</span>
                              </label>
                              <select
                                className="input gov-input mb-3"
                                style={{
                                  color: "black",
                                  borderColor: errors[
                                    `processedLineSections.${block}.road`
                                  ]
                                    ? "#dc2626"
                                    : sectionEntry?.road
                                    ? "#45526c"
                                    : "#dc2626",
                                }}
                                value={sectionEntry?.road || ""}
                                onChange={(e) =>
                                  handleRoadSelection(block, e.target.value)
                                }
                              >
                                <option value="" disabled>
                                  Select Road
                                </option>
                                {getAllRoadsForYard(block).map(
                                  (road: string) => (
                                    <option key={road} value={road}>
                                      {road}
                                    </option>
                                  )
                                )}
                              </select>
                              {errors[
                                `processedLineSections.${block}.road`
                              ] && (
                                <span className="text-base text-red-700 font-medium mb-3 block">
                                  Road selection is required
                                </span>
                              )}

                              {sectionEntry?.road && (
                                <div className="mt-2 mb-2">
                                  <label className="block text-base font-medium text-black mb-2">
                                    Other affected Road for {block}
                                  </label>
                                  <Select
                                    isMulti
                                    options={getAllRoadsForYard(block)
                                      .filter(
                                        (road) => road !== sectionEntry.road
                                      )
                                      .map((road) => ({
                                        value: road,
                                        label: road,
                                      }))}
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
                                    styles={getSelectStyles(false)}
                                  />
                                </div>
                              )}
                              {sectionEntry?.road && (
                                <div className="mt-2 mb-3">
                                  <label className="block text-base font-medium text-black mb-2">
                                    Direction of movement affected for {block}{" "}
                                    <span className="text-red-600">*</span>
                                  </label>
                                  <select
                                    className="input gov-input"
                                    value={sectionEntry?.stream || ""}
                                    onChange={(e) => {
                                      // Use a function that explicitly preserves the road value
                                      const streamValue = e.target.value;
                                      setFormData((prev) => {
                                        const existingSections = [
                                          ...(prev.processedLineSections || []),
                                        ];
                                        const sectionIndex =
                                          existingSections.findIndex(
                                            (section) => section.block === block
                                          );

                                        if (sectionIndex >= 0) {
                                          const currentSection =
                                            existingSections[sectionIndex];
                                          existingSections[sectionIndex] = {
                                            ...currentSection,
                                            stream: streamValue,
                                          };
                                        } else {
                                          existingSections.push({
                                            block: block,
                                            type: "yard",
                                            stream: streamValue,
                                            road: sectionEntry?.road || "",
                                            otherRoads: "",
                                            lineName: "",
                                            otherLines: "",
                                          });
                                        }

                                        return {
                                          ...prev,
                                          processedLineSections:
                                            existingSections,
                                        };
                                      });
                                    }}
                                    style={{
                                      color: "black",
                                      borderColor: errors[
                                        `processedLineSections.${block}.stream`
                                      ]
                                        ? "#dc2626"
                                        : "#45526c",
                                    }}
                                  >
                                    <option value="" disabled>
                                      Select Direction
                                    </option>
                                    {streamData[
                                      block as keyof typeof streamData
                                    ] &&
                                      Object.keys(
                                        streamData[
                                          block as keyof typeof streamData
                                        ]
                                      ).map((stream) => (
                                        <option key={stream} value={stream}>
                                          {stream == "bothNot"
                                            ? "Both directions not affected"
                                            : stream.charAt(0).toUpperCase() +
                                              stream.slice(1)}{" "}
                                          {stream == "bothNot"
                                            ? ""
                                            : `direction${
                                                stream == "both" ? "s" : ""
                                              } affected`}
                                        </option>
                                      ))}
                                  </select>
                                  {errors[
                                    `processedLineSections.${block}.stream`
                                  ] && (
                                    <span className="text-base text-red-700 font-medium mb-3 block">
                                      Stream selection is required
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            // For regular sections in multiple selection
                            <>
                              <label className="block text-base font-medium text-black mb-2">
                                Line {block}{" "}
                                <span className="text-red-600">*</span>
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
                              {errors[
                                `processedLineSections.${block}.lineName`
                              ] && (
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
                                      lineData[
                                        block as keyof typeof lineData
                                      ] || []
                                    )
                                      .filter(
                                        (l: string) =>
                                          l !== sectionEntry.lineName
                                      )
                                      .map((l: string) => ({
                                        value: l,
                                        label: l,
                                      }))}
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
                                        block,
                                        opts as any
                                      )
                                    }
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    placeholder="Select other affected lines"
                                    styles={getSelectStyles(false)}
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
              </div>
            </div>

            <div className="form-group col-span-1">
              <label className="block text-sm font-medium text-black mb-1">
                Type of Work <span className="text-red-600">*</span>
              </label>
              <select
                name="workType"
                value={formData.workType || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{ color: "black", fontSize: "14px" }}
                disabled={!userDepartment}
              >
                <option value="" disabled>
                  {userDepartment
                    ? "Select Type of Work"
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
                disabled={!selectedWorkType}
              >
                <option value="" disabled>
                  {selectedWorkType
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
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded-md border border-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Preferred Time (Click On the Clock To Select)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
            <div className="form-group col-span-1">
              <label className="block text-sm font-medium text-black mb-1">
                From (Hrs) <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="demandTimeFrom"
                value={extractTimeFromDatetime(formData.demandTimeFrom || "")}
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
                To (Hrs) <span className="text-red-600">*</span>
              </label>
              <input
                type="time"
                name="demandTimeTo"
                value={extractTimeFromDatetime(formData.demandTimeTo || "")}
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
        </div>

        <div className="bg-gray-50 p-2 rounded-md border border-black text-black mb-3">
          <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Caution Requirements
          </h2>
          {(session?.user.department === "S&T" ||
            session?.user.department === "ENGG") && (
            <>
              <div className="grid grid-cols-1  gap-2">
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

                {formData.freshCautionRequired === true && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        Caution Location From{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="freshCautionLocationFrom"
                        value={formData.freshCautionLocationFrom || ""}
                        onChange={handleInputChange}
                        className="input gov-input"
                        placeholder="Approximately from"
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
                        Caution Location To{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <input
                        name="freshCautionLocationTo"
                        value={formData.freshCautionLocationTo || ""}
                        onChange={handleInputChange}
                        className="input gov-input"
                        placeholder="Approximately to"
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
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">
                        Caution Speed (km/hr){" "}
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
                        Adjacent lines affected
                        {/* <span className="text-red-600">*</span> */}
                      </label>
                      <input
                        type="text"
                        name="adjacentLinesAffected"
                        value={formData.adjacentLinesAffected || ""}
                        onChange={handleInputChange}
                        className="input gov-input"
                        placeholder="Lines Affected"
                        style={{
                          color: "black",
                          borderColor: errors.adjacentLinesAffected
                            ? "#dc2626"
                            : "#45526c",
                          fontSize: "14px",
                        }}
                      />
                      {errors.adjacentLinesAffected && (
                        <span className="text-xs text-red-700 font-medium mt-1 block">
                          {errors.adjacentLinesAffected}
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

              {formData.powerBlockRequired === true && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div className="col-span-1">
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
                  <div className="col-span-2">
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
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-black mb-1">
                      Assign TRD Disconnection To{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="trdDisconnectionAssignTo"
                      value={formData.trdDisconnectionAssignTo || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.trdDisconnectionAssignTo
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    >
                      <option value="" disabled>
                        Select TRD Personnel
                      </option>
                      {trdDisconnectionAssignToOptions.map((option) => (
                        <option key={option.email} value={option.email}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {errors.trdDisconnectionAssignTo && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.trdDisconnectionAssignTo}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 mt-1 block">
                      Person responsible for power block disconnection
                    </span>
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
                      onChange={() =>
                        setFormData({
                          ...formData,
                          sntDisconnectionRequired: true,
                        })
                      }
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
                      onChange={() =>
                        setFormData({
                          ...formData,
                          sntDisconnectionRequired: false,
                        })
                      }
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
                  {/* Add the assignment dropdown */}
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-black mb-1">
                      Assign S&T Disconnection To{" "}
                      <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="sntDisconnectionAssignTo"
                      value={formData.sntDisconnectionAssignTo || ""}
                      onChange={handleInputChange}
                      className="input gov-input"
                      style={{
                        color: "black",
                        borderColor: errors.sntDisconnectionAssignTo
                          ? "#dc2626"
                          : "#45526c",
                        fontSize: "14px",
                      }}
                    >
                      <option value="" disabled>
                        Select S&T Personnel
                      </option>
                      {sntDisconnectionAssignToOptions.map((option) => (
                        <option key={option.email} value={option.email}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {errors.sntDisconnectionAssignTo && (
                      <span className="text-xs text-red-700 font-medium mt-1 block">
                        {errors.sntDisconnectionAssignTo}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group col-span-2 mt-5">
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
            </>
          )}
          {session?.user.department === "TRD" && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Coaching Repurcussions{" "}
                {session?.user.department === "TRD" && (
                  <span className="text-red-600">*</span>
                )}
              </label>
              <input
                name="repercussions"
                value={formData.repercussions || ""}
                onChange={handleInputChange}
                className="input gov-input"
                style={{
                  color: "black",
                  borderColor: errors.repercussions ? "#dc2626" : "#45526c",
                  fontSize: "14px",
                }}
              />
              {errors.repercussions && (
                <span className="text-xs text-red-700 font-medium mt-1 block">
                  {errors.repercussions}
                </span>
              )}
            </div>
          )}
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
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmedSubmit}
          formData={formData}
        />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

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
