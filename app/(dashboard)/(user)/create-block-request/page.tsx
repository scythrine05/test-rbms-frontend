"use client";
import ConfirmationDialog from "@/app/components/ui/ConfirmationDiagonal";
import React, { useState, useEffect } from "react";
import { useCreateUserRequest } from "@/app/service/mutation/user-request";
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from 'react-toastify';
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
import { useRouter } from "next/navigation";

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
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
    backgroundColor: state.isSelected ? "#e0e7ef" : state.isFocused ? "#f3f4f6" : "white",
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
      borderColor: hasError ? "#dc2626" : state.isFocused ? "#2461aa" : "#45526c",
      borderWidth: hasError ? "2px" : "1px",
      borderRadius: "4px",
      padding: "2px",
      boxShadow: hasError
        ? "0 0 0 1px rgba(220, 38, 38, 0.2)"
        : state.isFocused ? "0 0 0 1px rgba(37, 99, 176, 0.1)" : "none",
      fontSize: "14px",
      minHeight: "36px",
      "&:hover": {
        borderColor: hasError ? "#dc2626" : "#2461aa",
      },
    })
  };
};

// Add a constant for S&T Disconnection assignment emails near the top of the file with other constants
const sntDisconnectionAssignToOptions = [
  { name: "S&T User", email: "snt.user@test.com" },
  { name: "Officer 2", email: "snt.officer2@railways.com" },
  { name: "Supervisor", email: "snt.supervisor@railways.com" },
  { name: "Manager", email: "snt.manager@railways.com" },
  { name: "Engineer", email: "snt.engineer@railways.com" }
];

export default function CreateBlockRequestPage() {
  const router = useRouter();

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
  const getCorridorTypeRestrictions = (dateString: string): {
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
      message = "Dates within today and next 2 days must be Urgent Block requests.";
    } else if (isNextWeek && pastThursdayCutoff) {
      message = "Week 2 requests after Thursday 22:00 cutoff must be Urgent Block requests.";
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
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Special handling for date field
    if (name === 'date') {
      // Check if the selected date is allowed
      if (value && !isDateSelectable(value)) {
        // If date is in current week but beyond urgent window, show error and don't update state
        setErrors({
          ...errors,
          date: "Dates in current week beyond today, tomorrow, and day after tomorrow are not available for block requests."
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
      'date',
      'corridorTypeSelection',
      'selectedSection',
      'selectedDepo',
      'demandTimeFrom',
      'demandTimeTo',
      'workType',
      'activity',
      'missionBlock' // This is your block section
    ];

    // Check always required fields
    alwaysRequired.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
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
        section => section.block === block
      );

      if (block.includes('-YD')) {
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
    if (session?.user.department === 'TRD') {
      if (!formData.repercussions) {
        newErrors.repercussions = "Coaching repercussions are required";
        hasError = true;
      }
    }

    if (session?.user.department === 'S&T') {
      if (!formData.routeFrom || !formData.routeTo) {
        if (!formData.routeFrom) newErrors.routeFrom = "Route From is required";
        if (!formData.routeTo) newErrors.routeTo = "Route To is required";
        hasError = true;
      }
    }

    // Outside corridor requires remarks
    if (formData.corridorTypeSelection === 'Outside Corridor' && !formData.requestremarks?.trim()) {
      newErrors.requestremarks = "Remarks are required for Outside Corridor requests";
      hasError = true;
    }

    // Custom activity validation
    if (formData.activity === 'others' && !customActivity.trim()) {
      newErrors.activity = "Please specify the custom activity";
      hasError = true;
    }

    // S&T disconnection validation
    if (formData.sntDisconnectionRequired === true) {
      if (!formData.sntDisconnectionLineFrom) {
        newErrors.sntDisconnectionLineFrom = "Disconnection Line From is required";
        hasError = true;
      }
      if (!formData.sntDisconnectionLineTo) {
        newErrors.sntDisconnectionLineTo = "Disconnection Line To is required";
        hasError = true;
      }
      // if (!formData.sntDisconnectionAssignTo) {
      //   newErrors.sntDisconnectionAssignTo = "Please select who to assign the S&T disconnection to";
      //   hasError = true;
      // }
    }

    // Power block validation
    if (formData.powerBlockRequired === true) {
      if (!formData.elementarySection) {
        newErrors.elementarySection = "Elementary Section is required for power block";
        hasError = true;
      }
    }

    // Fresh caution validation
    if (formData.freshCautionRequired === true) {
      if (!formData.freshCautionLocationFrom) {
        newErrors.freshCautionLocationFrom = "Caution Location From is required";
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
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      toast.error('Please fill all required fields', {
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
      sntDisconnectionRequired: formData.sntDisconnectionRequired ?? false,
      powerBlockRequired: formData.powerBlockRequired ?? false,
      freshCautionRequired: formData.freshCautionRequired ?? false,
      freshCautionLocationFrom: formData.freshCautionLocationFrom,
      freshCautionLocationTo: formData.freshCautionLocationTo,
      freshCautionSpeed: formData.freshCautionSpeed,
      adjacentLinesAffected: formData.adjacentLinesAffected,
      sntDisconnectionLineFrom: formData.sntDisconnectionLineFrom,
      sntDisconnectionLineTo: formData.sntDisconnectionLineTo,
      powerBlockRequirements: formData.powerBlockRequirements,
      elementarySection: formData.elementarySection,
      sntDisconnectionRequirements: formData.sntDisconnectionRequirements,
      sntDisconnectionAssignTo: formData.sntDisconnectionAssignTo, // Include in form submission
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
            sntDisconnectionAssignTo: "", // Reset this field too
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
            workLocationFrom: "",
            workLocationTo: "",
          });
          setBlockSectionValue([]);
          setCustomActivity("");
          setPowerBlockRequirements([]);
          setSntDisconnectionRequirements([]);
          alert("Block request created successfully!");
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
      const { urgentOnly, urgentAllowed, message } = getCorridorTypeRestrictions(formData.date);

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
        if (formData.corridorTypeSelection === "Urgent Block" && !urgentAllowed) {
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
          type: "yard" // Ensure type is set
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

    Object.keys(blockData).forEach(streamKey => {
      const roads = (blockData as Record<string, string[]>)[streamKey] || [];
      roads.forEach(road => {
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

  // Duration calculation helper
  function getDuration(from: string, to: string) {
    if (!from || !to) return '';
    const [fromH, fromM] = from.split(':').map(Number);
    const [toH, toM] = to.split(':').map(Number);
    let start = fromH * 60 + fromM;
    let end = toH * 60 + toM;
    if (end < start) end += 24 * 60; // handle overnight
    const diff = end - start;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-[#c6f5d6] to-[#e6f7ff] p-4 font-sans">
      {/* RBMS Header */}
      <div className="w-full max-w-2xl mx-auto rounded-lg border-4 border-black bg-yellow-200 mt-2 mb-6 p-4 flex flex-col items-center shadow-lg">
        <span className="text-5xl font-extrabold text-[#b07be0] tracking-wide drop-shadow">RBMS</span>
      </div>
      {/* Form Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white/95 rounded-2xl shadow-2xl border-2 border-black p-8 flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold text-black text-center mb-4 tracking-wide">Enter New Block Request</h1>
        {/* Major Section, Block Section, Line/Road - single row, bold colors, side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-6">
          {/* Major Section */}
          <div className="border-2 border-black bg-[#e6f7c6] rounded-l-xl">
            <label className="block font-extrabold px-2 py-2 text-lg text-black text-center border-b-2 border-black">Major Section</label>
            <select
              name="selectedSection"
              value={formData.selectedSection || ""}
              onChange={handleInputChange}
              className="w-full border-2 border-black rounded-none px-3 py-3 text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-green-300 bg-white hover:bg-green-50 transition"
              aria-required="true"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              <option value="" disabled>Select Major Section</option>
              {majorSectionOptions.map((section: string) => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
            {errors.selectedSection && (
              <span className="text-xs text-red-700 font-medium mt-1 block">{errors.selectedSection}</span>
            )}
          </div>
          {/* Block Section/Yard and Line/Road side-by-side */}
          <div className="col-span-2 flex flex-row gap-4">
            {/* Block Section/Yard */}
            <div className="flex-1 border-2 border-black bg-[#ffd700] rounded-none rounded-tr-xl">
              <label className="block font-extrabold px-2 py-2 text-lg text-black text-center border-b-2 border-black">Block Section/Yard</label>
              <Select
                isMulti
                options={blockSectionOptionsList}
                value={blockSectionOptionsList.filter((opt) => blockSectionValue.includes(opt.value))}
                onChange={(opts) => {
                  setBlockSectionValue(opts.map((opt) => opt.value));
                  if (opts.length > 0 && errors.missionBlock) {
                    setErrors((prev) => { const newErrors = { ...prev }; delete newErrors.missionBlock; return newErrors; });
                  }
                }}
                isDisabled={!selectedMajorSection}
                className="basic-multi-select border-0"
                classNamePrefix="select"
                placeholder={selectedMajorSection ? "Select Block Section" : "Select Major Section first"}
                styles={getSelectStyles(!!errors.missionBlock)}
              />
              {errors.missionBlock && blockSectionValue.length === 0 && (
                <span className="text-xs text-red-700 font-medium mt-1 block">{errors.missionBlock}</span>
              )}
            </div>
            {/* Line/Road for each selected block section */}
            <div className="flex-1 border-2 border-black bg-[#ffd700] rounded-none rounded-br-xl">
              <label className="block font-extrabold px-2 py-2 text-lg text-black text-center border-b-2 border-black">Line/Road</label>
              {blockSectionValue.length === 0 && (
                <div className="text-center text-gray-400 py-4">Select a Block Section</div>
              )}
              {blockSectionValue.map((block, idx) => (
                <div key={block} className="mb-6">
                  <label className="block text-xs font-extrabold text-black mb-1 text-center">{block}</label>
                  {block.includes('-YD') ? (
                    <>
                      <select
                        name={`road-${block}`}
                        value={(() => {
                          const section = formData.processedLineSections?.find(s => s.block === block);
                          return section?.road || '';
                        })()}
                        onChange={e => handleRoadSelection(block, e.target.value)}
                        className="w-full border-2 border-black rounded-none px-2 py-2 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white hover:bg-yellow-50 transition mb-2"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      >
                        <option value="" disabled>Select Road</option>
                        {getAllRoadsForYard(block).map((road) => (
                          <option key={road} value={road}>{road}</option>
                        ))}
                      </select>
                      {/* Other Roads Affected */}
                      <input
                        type="text"
                        name={`otherRoads-${block}`}
                        value={(() => {
                          const section = formData.processedLineSections?.find(s => s.block === block);
                          return section?.otherRoads || '';
                        })()}
                        onChange={e => handleOtherAffectedLinesChange(block, [{ value: e.target.value }])}
                        className="w-full border-2 border-black rounded-none px-2 py-2 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white hover:bg-yellow-50 transition mt-1"
                        placeholder="Other Roads Affected (comma separated)"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      />
                    </>
                  ) : (
                    <>
                      <select
                        name={`lineName-${block}`}
                        value={(() => {
                          const section = formData.processedLineSections?.find(s => s.block === block);
                          return section?.lineName || '';
                        })()}
                        onChange={e => handleLineNameSelection(block, e.target.value)}
                        className="w-full border-2 border-black rounded-none px-2 py-2 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white hover:bg-yellow-50 transition mb-2"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      >
                        <option value="" disabled>Select Line</option>
                        {(blockSection[block as keyof typeof blockSection] || []).map((line: string) => (
                          <option key={line} value={line}>{line}</option>
                        ))}
                      </select>
                      {/* Other Lines Affected */}
                      <input
                        type="text"
                        name={`otherLines-${block}`}
                        value={(() => {
                          const section = formData.processedLineSections?.find(s => s.block === block);
                          return section?.otherLines || '';
                        })()}
                        onChange={e => handleOtherAffectedLinesChange(block, [{ value: e.target.value }])}
                        className="w-full border-2 border-black rounded-none px-2 py-2 text-base font-extrabold focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white hover:bg-yellow-50 transition mt-1"
                        placeholder="Other Lines Affected (comma separated)"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Corridor for this section - red row, read-only */}
        <div className="grid grid-cols-5 gap-0 bg-red-600 rounded-lg p-2 border-2 border-black text-black items-center mb-2">
          <div className="col-span-2 flex items-center h-full">
            <span className="w-full text-left font-extrabold text-2xl uppercase tracking-wide pl-2">CORRIDOR FOR THIS SECTION</span>
          </div>
          <div className="col-span-1 text-center font-extrabold text-2xl">00:00 TO 03:00</div>
          <div className="col-span-2"></div>
        </div>
        {/* Type of Block - new line, orange row */}
        <div className="flex flex-row items-center gap-4 bg-orange-200 rounded-lg p-2 border-2 border-black mb-2">
          <label className="font-extrabold text-black text-xl mr-2">Type of Block</label>
          <select name="corridorTypeSelection" value={formData.corridorTypeSelection || ''} onChange={handleInputChange} className="border-2 border-black rounded px-2 py-2 text-lg font-extrabold text-black bg-white hover:bg-orange-100 transition">
            <option value="">Select Type</option>
            <option value="Corridor">Corridor</option>
            <option value="Outside Corridor">Outside Corridor</option>
            <option value="Urgent Block">Urgent Block</option>
          </select>
          <span className="inline-block bg-orange-300 text-black font-extrabold px-2 py-2 rounded ml-4">
            {formData.corridorTypeSelection === 'Urgent Block' ? 'Emergency' : 'Planned'}
          </span>
        </div>
        {/* Preferred Slot - orange row */}
        <div className="grid grid-cols-5 gap-0 bg-orange-200 rounded-lg p-2 border-2 border-black items-center mb-0">
          <div className="col-span-1 font-extrabold text-center text-xl">Preferred Slot</div>
          <div className="col-span-1 text-center">
            <input type="time" name="demandTimeFrom" value={extractTimeFromDatetime(formData.demandTimeFrom || '')} onChange={handleInputChange} className="w-full border-2 border-black rounded px-2 py-2 text-lg font-extrabold text-black hover:bg-orange-100 transition" />
          </div>
          <div className="col-span-1 text-center font-extrabold text-xl">TO</div>
          <div className="col-span-1 text-center">
            <input type="time" name="demandTimeTo" value={extractTimeFromDatetime(formData.demandTimeTo || '')} onChange={handleInputChange} className="w-full border-2 border-black rounded px-2 py-2 text-lg font-extrabold text-black hover:bg-orange-100 transition" />
          </div>
          <div className="col-span-1"></div>
        </div>
        {/* Duration below preferred slot */}
        <div className="w-full flex justify-end border-x-2 border-b-2 border-black bg-orange-200 rounded-b-lg pb-2 px-2 mb-2">
          <span className="font-extrabold text-xl text-black">Duration: <span className="text-green-700">{getDuration(extractTimeFromDatetime(formData.demandTimeFrom || ''), extractTimeFromDatetime(formData.demandTimeTo || ''))}</span></span>
        </div>
        {/* Reasons for asking Block outside Corridor or Emergency Block */}
        <div className="bg-white border border-black rounded-lg p-2">
          <label className="font-bold">Reasons for asking Block outside Corridor or Emergency Block</label>
          <textarea name="repercussions" value={formData.repercussions} onChange={handleInputChange} className="w-full bg-white border border-black rounded p-2 mt-1" />
        </div>
        {/* Type of Work & Activity - green row */}
        <div className="grid grid-cols-2 gap-2 bg-[#d6f7c6] rounded-lg p-2 border border-black items-center">
          <div>
            <label className="block font-bold text-center">Type of Work</label>
            <select name="workType" value={formData.workType || ''} onChange={handleInputChange} className="w-full border border-black rounded px-2 py-1 text-base font-semibold">
              <option value="" disabled>Select Type of Work</option>
              {workTypeOptions.map((type: string) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-center">Activity</label>
            <select name="activity" value={formData.activity || ''} onChange={handleInputChange} className="w-full border border-black rounded px-2 py-1 text-base font-semibold">
              <option value="" disabled>Select Activity</option>
              {activityOptions.map((activity: string) => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
              <option value="others">Others</option>
            </select>
            {formData.activity === 'others' && (
              <input type="text" className="input mt-1 w-full" style={{ color: 'black', fontSize: '14px' }} placeholder="Enter custom activity" value={customActivity} onChange={e => setCustomActivity(e.target.value)} required />
            )}
          </div>
        </div>
        {/* Caution, Power Block, S&T Disconnection - use old logic, restyle as boxed, red-bordered rows */}
        {/* ...existing logic for these sections, but with new UI... */}
        {/* Remarks - purple box */}
        <div className="bg-[#f7d6f7] border border-black rounded-lg p-2">
          <label className="font-bold">Remarks, if any</label>
          <textarea name="requestremarks" value={formData.requestremarks || ''} onChange={handleInputChange} className="w-full bg-white border border-black rounded p-2 mt-1" />
        </div>
        {/* Bottom Buttons */}
        <div className="flex flex-row justify-between items-center mt-4 gap-2">
          <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-2 bg-lime-300 border border-black rounded px-4 py-2 text-lg font-bold text-black shadow hover:bg-lime-200 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} className="w-7 h-7"><rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" /><path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" /></svg>
            Home
          </button>
          <button type="button" onClick={() => router.back()} className="flex items-center gap-2 bg-[#e6e6fa] border border-black rounded px-4 py-2 text-lg font-bold text-black shadow hover:bg-[#d1d1e0] transition">
            <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' strokeWidth={2} className='w-6 h-6'><path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' /></svg>
            Back
          </button>
          <button type="submit" className="bg-[#eeb8f7] border border-black rounded px-6 py-2 text-lg font-bold text-black shadow hover:bg-[#d1aee0] transition">SUBMIT</button>
        </div>
      </form>
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
    </div>
  );
}
