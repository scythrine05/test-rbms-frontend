"use client";
import React, { useState, useEffect } from "react";
import { useCreateUserRequest } from "@/app/service/mutation/user-request";
import { useSession, signOut } from "next-auth/react";
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
    fontSize: "12px",
    color: "black",
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 10,
    backgroundColor: "white",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    color: "black",
  }),
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "white",
    color: "black",
    borderColor: state.isFocused ? "#2461aa" : "#45526c",
    borderWidth: "1px",
    borderRadius: "4px",
    padding: "1px",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(37, 99, 176, 0.1)" : "none",
    fontSize: "12px",
    minHeight: "28px",
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
    fontSize: "11px",
    padding: "1px 3px",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: "#ef4444",
    paddingLeft: "3px",
    paddingRight: "3px",
    ":hover": {
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
    },
  }),
  option: (base: any, state: any) => ({
    ...base,
    color: "black",
    backgroundColor: state.isSelected ? "#e0e7ef" : state.isFocused ? "#f3f4f6" : "white",
    fontSize: "12px",
    padding: "4px 8px",
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
    fontSize: "12px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "black",
    fontSize: "12px",
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

// Add the ReviewModal props type
interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: any;
  blockSectionValue: string[];
  processedLineSections: any[];
  selectedActivities: string[];
  customActivity: string;
  formSubmitting?: boolean;
  readOnly?: boolean;
}

function ReviewBlockRequestModal({ isOpen, onClose, onConfirm, formData, blockSectionValue, processedLineSections, selectedActivities, customActivity, formSubmitting, readOnly }: ReviewModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[#d6f7fa] rounded-2xl shadow-2xl max-w-2xl w-full p-0 border-4 border-[#222] relative overflow-y-auto max-h-[90vh]">
        <div className="bg-[#f7f7a1] rounded-t-xl p-4 border-b-2 border-[#b6f7e6] text-center">
          <span className="text-3xl font-extrabold text-[#b07be0] tracking-wide" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>RBMS</span>
        </div>
        <div className="bg-[#c6e6f7] rounded-b-xl p-6 pt-4">
          <h2 className="text-2xl font-extrabold text-center mb-4 text-[#222]">Review the Block Request Before Submission</h2>
          <div className="space-y-3 text-black text-base">
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]"><b>Date of Block:</b> {formData.date}</div>
              <div className="flex-1 min-w-[180px]"><b>Major Section:</b> {formData.selectedSection}</div>
              <div className="flex-1 min-w-[180px]"><b>Depot/SSE:</b> {formData.selectedDepo}</div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]"><b>Block Section/Yard:</b> {blockSectionValue.join(', ')}</div>
              <div className="flex-1 min-w-[180px]"><b>Line/Road:</b> {processedLineSections.map((s: any) => s.lineName || s.road).join(', ')}</div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]"><b>Type of Block:</b> {formData.corridorTypeSelection}</div>
              <div className="flex-1 min-w-[180px]"><b>Planned/Emergency:</b> {formData.corridorTypeSelection === 'Urgent Block' ? 'Emergency' : 'Planned'}</div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]"><b>Preferred Slot:</b> {formData.demandTimeFrom} to {formData.demandTimeTo}</div>
              <div className="flex-1 min-w-[180px]"><b>Duration:</b> {formData.demandTimeFrom && formData.demandTimeTo ? getDuration(formData.demandTimeFrom, formData.demandTimeTo) : ''}</div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]"><b>Type of Work:</b> {formData.workType}</div>
              <div className="flex-1 min-w-[180px]"><b>Activity:</b> {selectedActivities && selectedActivities.length > 0 ? selectedActivities.join(', ') : formData.activity || customActivity}</div>
            </div>
            {formData.remarks && <div className="mb-2"><b>Remarks:</b> {formData.remarks}</div>}
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#f7d6f7] bg-[#f7d6f7]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">Caution Requirements</div>
              <div><b>Fresh Caution Imposed:</b> {formData.freshCautionRequired === true ? 'Yes' : 'No'}</div>
              {formData.freshCautionRequired === true && (
                <div className="space-y-1 mt-2">
                  <div><b>Location From:</b> {formData.freshCautionLocationFrom || '-'}</div>
                  <div><b>Location To:</b> {formData.freshCautionLocationTo || '-'}</div>
                  <div><b>Speed (km/hr):</b> {formData.freshCautionSpeed || '-'}</div>
                  <div><b>Adjacent Lines Affected:</b> {formData.adjacentLinesAffected || '-'}</div>
                </div>
              )}
            </div>
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#e6f7c6] bg-[#e6f7c6]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">Power Block Requirements</div>
              <div><b>Power Block Needed:</b> {formData.powerBlockRequired === true ? 'Yes' : 'No'}</div>
              {formData.powerBlockRequired === true && (
                <div className="space-y-1 mt-2">
                  <div><b>Elementary Section:</b> {formData.elementarySection || '-'}</div>
                  <div><b>Requirements:</b> {(formData.powerBlockRequirements && formData.powerBlockRequirements.length > 0) ? formData.powerBlockRequirements.join(', ') : '-'}</div>
                </div>
              )}
            </div>
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#d6e6f7] bg-[#d6e6f7]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">S&T Disconnection Requirements</div>
              <div><b>S&T Disconnection Needed:</b> {formData.sntDisconnectionRequired === true ? 'Yes' : 'No'}</div>
              {formData.sntDisconnectionRequired === true && (
                <div className="space-y-1 mt-2">
                  <div><b>Line From:</b> {formData.sntDisconnectionLineFrom || '-'}</div>
                  <div><b>Line To:</b> {formData.sntDisconnectionLineTo || '-'}</div>
                  <div><b>Requirements:</b> {(formData.sntDisconnectionRequirements && formData.sntDisconnectionRequirements.length > 0) ? formData.sntDisconnectionRequirements.join(', ') : '-'}</div>
                  <div><b>Assign To:</b> {formData.sntDisconnectionAssignTo || '-'}</div>
                </div>
              )}
            </div>
            {/* Add more fields as needed for full review */}
          </div>
          <div className="flex justify-between items-center gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border-2 border-[#222] bg-[#e6e6fa] text-black font-bold text-lg hover:bg-[#d1d1e0] transition"
            >
              Back to Editing
            </button>
            {readOnly ? (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-full border-2 border-[#c48ad6] bg-[#eeb8f7] text-white font-extrabold text-lg shadow-lg hover:bg-[#e6aee0] transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={formSubmitting}
              >
                CLOSE
              </button>
            ) : (
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-full border-2 border-[#c48ad6] bg-[#eeb8f7] text-white font-extrabold text-lg shadow-lg hover:bg-[#e6aee0] transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={formSubmitting}
              >
                CLICK TO CONFIRM
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to determine if Type of Block should be locked to Urgent Block
export function isUrgentBlockDate(dateString: string): boolean {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const dayDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return dayDiff === 0 || dayDiff === 1 || dayDiff === 2;
}

// Add a new style object for better contrast in 'Other affected Lines/Roads' dropdowns
const otherAffectedSelectStyles = {
  ...selectStyles,
  option: (base: any, state: any) => ({
    ...base,
    color: 'black',
    backgroundColor: state.isSelected ? '#e0e7ef' : state.isFocused ? '#e5e7eb' : 'white',
    fontSize: '13px',
    padding: '6px 10px',
    fontWeight: state.isSelected ? 'bold' : 'normal',
    '&:hover': {
      backgroundColor: '#e5e7eb',
      color: 'black',
    },
    '&:active': {
      backgroundColor: '#e0e7ef',
      color: 'black',
    },
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: '#f3f4f6',
    color: 'black',
    border: '1px solid #bdbdbd',
    borderRadius: '4px',
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: 'black',
    fontSize: '12px',
    padding: '2px 6px',
    fontWeight: 'bold',
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    color: '#ef4444',
    paddingLeft: '4px',
    paddingRight: '4px',
    ':hover': {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
    },
  }),
};

// Move this utility function above ReviewBlockRequestModal so it is in scope
function getDuration(from: string, to: string) {
  if (!from || !to) return '';
  const [fromH, fromM] = from.split(':').map(Number);
  const [toH, toM] = to.split(':').map(Number);
  let start = fromH * 60 + fromM;
  let end = toH * 60 + toM;
  if (end < start) end += 24 * 60;
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

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
      sntDisconnectionAssignTo?: string;
      remarks?: string;
      freshCautionRoad?: string;
      freshCautionRemarks?: string;
      powerBlockSectionTo?: string;
      powerBlockRoad?: string;
      powerBlockKmFrom?: number | string;
      powerBlockKmTo?: number | string;
      sntDisconnectionPointNo?: string;
      sntDisconnectionSignalNo?: string;
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
    sntDisconnectionAssignTo: "",
    remarks: "",
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReview, setShowReview] = useState(false);

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

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const isDateInCurrentWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);

    const currentWeekMonday = new Date(today);
    const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    currentWeekMonday.setDate(today.getDate() - daysSinceMonday);

    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);

    return targetDate >= currentWeekMonday && targetDate <= currentWeekSunday;
  };

  const isWithinNextTwoDays = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    return targetDate >= today && targetDate <= twoDaysFromNow;
  };

  const isDateInNextWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const currentWeekSunday = new Date(today);
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    currentWeekSunday.setDate(today.getDate() + daysUntilSunday);

    const nextWeekMonday = new Date(currentWeekSunday);
    nextWeekMonday.setDate(currentWeekSunday.getDate() + 1);

    const nextWeekSunday = new Date(nextWeekMonday);
    nextWeekSunday.setDate(nextWeekMonday.getDate() + 6);

    return targetDate >= nextWeekMonday && targetDate <= nextWeekSunday;
  };

  const isPastThursdayCutoff = (): boolean => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    return (dayOfWeek === 4 && hour >= 22) || dayOfWeek > 4;
  };

  const getCorridorTypeRestrictions = (dateString: string): {
    urgentOnly: boolean;
    urgentAllowed: boolean;
    message: string;
  } => {
    if (!dateString) {
      return { urgentOnly: false, urgentAllowed: false, message: "" };
    }

    const isUrgentTimeframe = isWithinNextTwoDays(dateString);

    const isNextWeek = isDateInNextWeek(dateString);

    const pastThursdayCutoff = isPastThursdayCutoff();

    const urgentAllowed = isUrgentTimeframe;

    const urgentOnly = isUrgentTimeframe || (isNextWeek && pastThursdayCutoff);

    let message = "";
    if (isUrgentTimeframe) {
      message = "Dates within today and next 2 days must be Urgent Block requests.";
    } else if (isNextWeek && pastThursdayCutoff) {
      message = "Week 2 requests after Thursday 22:00 cutoff must be Urgent Block requests.";
    }

    return { urgentOnly, urgentAllowed, message };
  };

  const isBlockedCurrentWeekDate = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const maxUrgentDate = new Date(today);
    maxUrgentDate.setDate(today.getDate() + 2);

    const currentWeekSunday = new Date(today);
    const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
    currentWeekSunday.setDate(today.getDate() + daysUntilSunday);

    return targetDate > maxUrgentDate && targetDate <= currentWeekSunday;
  };

  const isDateSelectable = (dateString: string): boolean => {
    if (!dateString) return false;

    return !isBlockedCurrentWeekDate(dateString);
  };

  const getMinDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

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

    // Special handling for Yes/No selects
    if (["freshCautionRequired", "powerBlockRequired", "sntDisconnectionRequired"].includes(name)) {
      let newValue: boolean | null = null;
      if (value === "true") newValue = true;
      else if (value === "false") newValue = false;
      else newValue = null;
      setFormData({
        ...formData,
        [name]: newValue,
      });
      return;
    }

    // Special handling for date field
    if (name === 'date') {
      if (value && !isDateSelectable(value)) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    setErrors({});

    const validationResult = handleFormValidation();

    if (!validationResult.isValid) {
      setShowReview(false);
      if (Object.keys(validationResult.errors).length > 0) {
        toast.error('Please fill all required fields correctly', {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
      return;
    }

    setShowReview(true);
  };

  const handleFormValidation = () => {
    let newErrors: Record<string, string> = {};
    let hasError = false;

    const alwaysRequired = [
      'date',
      'corridorTypeSelection',
      'selectedSection',
      'selectedDepo',
      'demandTimeFrom',
      'demandTimeTo',
      'workType',
      'missionBlock',
    ];

    alwaysRequired.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
        hasError = true;
      }
    });

    if (blockSectionValue.length === 0) {
      newErrors.missionBlock = "Block Section is required";
      hasError = true;
    }

    for (const block of blockSectionValue) {
      const sectionEntry = formData.processedLineSections?.find(
        (section) => section.block === block
      );
      if (block.includes('-YD')) {
        if (!sectionEntry || !sectionEntry.road) {
          newErrors[`${block}.road`] = `Road for ${block} is required`;
          hasError = true;
        }
        if (!sectionEntry?.stream) {
          newErrors[`${block}.stream`] = `Stream for ${block} is required`;
          hasError = true;
        }
      } else {
        if (!sectionEntry || !sectionEntry.lineName) {
          newErrors[`${block}.lineName`] = `Line for ${block} is required`;
          hasError = true;
        }
      }
    }

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

    if (formData.corridorTypeSelection === 'Outside Corridor' && !formData.remarks?.trim()) {
      newErrors.remarks = "Remarks are required for Outside Corridor requests";
      hasError = true;
    }

    if (formData.activity === 'others' && !customActivity.trim()) {
      newErrors.activity = "Please specify the custom activity";
      hasError = true;
    }

    if (formData.sntDisconnectionRequired === true) {
      if (!formData.sntDisconnectionLineFrom) {
        newErrors.sntDisconnectionLineFrom = "Disconnection Line From is required";
        hasError = true;
      }
      if (!formData.sntDisconnectionLineTo) {
        newErrors.sntDisconnectionLineTo = "Disconnection Line To is required";
        hasError = true;
      }
    }

    if (formData.powerBlockRequired === true) {
      if (!formData.elementarySection) {
        newErrors.elementarySection = "Elementary Section is required for power block";
        hasError = true;
      }
    }

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
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return { isValid: false, errors: newErrors };
    }

    return { isValid: true, errors: {} };
  };

  const getInputClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'
      }`;
  };

  const getSelectClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'
      }`;
  };

  const getTextareaClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'
      }`;
  };

  const handleConfirmedSubmit = () => {
    setShowReview(false);
    setShowConfirmation(true);
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

    const combinedRemarks = [formData.repercussions, formData.requestremarks].filter(Boolean).join('\n');
    const processedFormData = {
      ...formData,
      remarks: formData.remarks || combinedRemarks,
      repercussions: undefined,
      requestremarks: undefined,
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
      sntDisconnectionAssignTo: formData.sntDisconnectionAssignTo,
    };

    try {
      mutation.mutate(processedFormData as UserRequestInput, {
        onSuccess: (data) => {
          console.log("Success:", data);
          setSuccess("Block request created successfully!");
          setShowSuccessPage(true);
          setSubmittedSummary({
            date: processedFormData.date,
            id: (data && typeof (data as any).id !== 'undefined') ? (data as any).id : '-',
            blockSection: processedFormData.missionBlock,
            lineOrRoad: processedFormData.processedLineSections?.map((s: any) => s.lineName || s.road).join(', '),
            duration: processedFormData.demandTimeFrom && processedFormData.demandTimeTo ? getDuration(extractTimeFromDatetime(processedFormData.demandTimeFrom), extractTimeFromDatetime(processedFormData.demandTimeTo)) : '',
          });
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
      const { urgentOnly, urgentAllowed, message } = getCorridorTypeRestrictions(formData.date);

      if (urgentOnly) {
        setIsDisabled(true);
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      } else {
        setIsDisabled(false);

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
    if (checked && errors.sntDisconnectionRequirements) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.sntDisconnectionRequirements;
        return newErrors;
      });
    }
  };

  const handleLineNameSelection = (block: string, value: string) => {
    setFormData((prev) => {
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      const updatedSection = {
        block,
        type: "regular",
        lineName: value,
        otherLines: "",
      };

      if (sectionIndex >= 0) {
        updatedSection.otherLines =
          existingProcessedSections[sectionIndex].otherLines || "";
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        existingProcessedSections.push(updatedSection);
      }

      const selectedStream =
        blockSectionValue.length === 1 ? value : prev.selectedStream;
      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedStream,
      };
    });
  };

  const handleOtherAffectedLinesChange = (block: string, options: any[]) => {
    const selectedValues = options.map((opt) => opt.value);

    setFormData((prev) => {
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex >= 0) {
        const section = existingProcessedSections[sectionIndex];

        if (section.type === "yard") {
          const updatedSection = {
            ...section,
            otherRoads: selectedValues.join(","),
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        } else {
          const updatedSection = {
            ...section,
            otherLines: selectedValues.join(","),
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      }

      const selectedRoads = { ...(prev.selectedRoads || {}) };
      selectedRoads[block] = selectedValues;

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedRoads,
      };
    });
  };

  useEffect(() => {
    if (blockSectionValue.length > 0) {
      setFormData((prev) => ({
        ...prev,
        missionBlock: blockSectionValue.join(","),
      }));
    }
  }, [blockSectionValue]);

  useEffect(() => {
    if (session?.user?.department) {
      setFormData((prev) => ({
        ...prev,
        selectedDepartment: session.user.department,
      }));
    }
  }, [session]);

  const handleStreamSelection = (block: string, value: string) => {
    setFormData((prev) => {
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex >= 0) {
        const updatedSection = {
          ...existingProcessedSections[sectionIndex],
          stream: value,
          type: "yard",
        };
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        existingProcessedSections.push({
          block,
          type: "yard",
          stream: value,
          road: "",
          otherRoads: "",
          lineName: "",
          otherLines: "",
        });
      }

      const selectedStream =
        blockSectionValue.length === 1 ? value : prev.selectedStream;

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

  const getAllRoadsForYard = (blockKey: string): string[] => {
    if (!blockKey || !blockKey.includes("-YD") || !(blockKey in streamData)) {
      return [];
    }

    const blockData = streamData[blockKey as keyof typeof streamData];
    if (!blockData || typeof blockData !== "object") {
      return [];
    }

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

  const handleRoadSelection = (block: string, value: string) => {
    setFormData((prev) => {
      const existingProcessedSections = [...(prev.processedLineSections || [])];

      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex >= 0) {
        const updatedSection = {
          ...existingProcessedSections[sectionIndex],
          road: value,
          type: "yard",
        };
        existingProcessedSections[sectionIndex] = updatedSection;
      } else {
        existingProcessedSections.push({
          block,
          type: "yard",
          road: value,
          stream: "",
          otherRoads: "",
          lineName: "",
          otherLines: "",
        });
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
      };
    });
  };

  // Add state to track if the success page should be shown and the submitted request summary
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<any>(null);
  // Add state for showing the details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (showSuccessPage) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-[#fcfaf3]">
        <div className="w-full max-w-2xl mx-auto mt-4">
          <div className="text-center bg-[#f7f7a1] rounded-t-2xl p-4 border-b-2 border-[#b6f7e6]">
            <span className="text-4xl font-extrabold text-[#b07be0]">RBMS</span>
          </div>
          <div className="bg-[#c6e6f7] rounded-b-2xl p-6">
            <h2 className="text-2xl font-extrabold mb-4 text-[#222]">Your Block Request has been Registered</h2>
            <table className="w-full mb-6 border rounded-xl overflow-hidden shadow-md">
              <thead>
                <tr className="bg-[#e6f7c6]">
                  <th className="px-2 py-1 border">Date</th>
                  <th className="px-2 py-1 border">ID</th>
                  <th className="px-2 py-1 border">Block Section</th>
                  <th className="px-2 py-1 border">UP/DN/SL/Road</th>
                  <th className="px-2 py-1 border">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center bg-white border-b shadow-sm hover:bg-[#f7f7fa]">
                  <td className="px-2 py-2 border font-semibold">{submittedSummary?.date || '-'}</td>
                  <td className="px-2 py-2 border">
                    <button
                      className="text-blue-700 underline font-bold hover:text-blue-900 focus:outline-none"
                      onClick={() => setShowDetailsModal(true)}
                      aria-label="View full block request details"
                    >
                      {submittedSummary?.id || '-'}
                    </button>
                  </td>
                  <td className="px-2 py-2 border">{submittedSummary?.blockSection || '-'}</td>
                  <td className="px-2 py-2 border">{submittedSummary?.lineOrRoad || '-'}</td>
                  <td className="px-2 py-2 border">{submittedSummary?.duration || '-'}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex flex-col gap-6 items-center mt-8">
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => { setShowSuccessPage(false); }}
              >
                ENTER MORE BLOCK REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push('/dashboard/requests')}
              >
                EDIT OR CANCEL PREVIOUS REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push('/dashboard/summary')}
              >
                SUMMARY OF MY BLOCK REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#ff5c42] text-white font-bold text-lg py-4 tracking-wider border border-[#d43b1a] hover:bg-[#ff7c6a] transition"
                onClick={() => signOut()}
              >
                CLOSE THE APP AND LOGOUT
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8">
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
        </div>
        {/* Details Modal for full block request view */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="relative max-w-2xl w-full">
              <button
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-gray-200 focus:outline-none"
                onClick={() => setShowDetailsModal(false)}
                aria-label="Close details modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ReviewBlockRequestModal
                isOpen={true}
                onClose={() => setShowDetailsModal(false)}
                onConfirm={() => { }}
                formData={formData}
                blockSectionValue={blockSectionValue}
                processedLineSections={formData.processedLineSections || []}
                selectedActivities={selectedActivities || []}
                customActivity={customActivity}
                formSubmitting={false}
                readOnly={true}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-b from-[#f7f7a1] to-[#b6f7e6] p-4 md:p-8 font-sans relative">
      <div className="w-full max-w-4xl mx-auto rounded-t-2xl border-b-4 border-[#f7f7a1] bg-[#f7f7a1] p-6 flex flex-col items-center shadow-lg mb-6">
        <span className="text-4xl md:text-5xl font-extrabold text-[#b07be0] tracking-wide drop-shadow" style={{ fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: '0.05em' }}>RBMS</span>
      </div>

      <form
        id="block-request-form"
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border-2 border-black flex flex-col gap-6 p-6 md:p-8 mb-24 sm:mb-40"
      >
        <div className="bg-[#e6f7c6] rounded-xl p-6 text-center border-2 border-black">
          <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-wide" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Enter New Block Request</h1>
        </div>

        <div className="bg-[#e6f0fa] rounded-xl p-6 border-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block font-extrabold text-lg md:text-xl text-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Date of Block</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleInputChange}
                className={getInputClassName('date')}
                min={getMinDateString()}
                required
              />
              {errors.date && <span className="text-sm text-red-700 font-medium block mt-1">{errors.date}</span>}
              {/* Show message if date is not selectable */}
              {formData.date && !isDateSelectable(formData.date) && (
                <span className="text-xs text-red-700 font-medium block mt-1">You can only request for today, tomorrow, day after, or one week later.</span>
              )}
            </div>
            <div className="space-y-2">
              <label className="block font-extrabold text-lg md:text-xl text-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Major Section</label>
              <select
                name="selectedSection"
                value={formData.selectedSection || ""}
                onChange={handleInputChange}
                className={getSelectClassName('selectedSection')}
                required
              >
                <option value="" disabled>Select Major Section</option>
                {majorSectionOptions.map((section: string) => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
              {errors.selectedSection && <span className="text-sm text-red-700 font-medium block mt-1">{errors.selectedSection}</span>}
            </div>
            <div className="space-y-2">
              <label className="block font-extrabold text-lg md:text-xl text-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Depot/SSE</label>
              <select
                name="selectedDepo"
                value={formData.selectedDepo || ""}
                onChange={handleInputChange}
                className={getSelectClassName('selectedDepo')}
                required
                disabled={!selectedMajorSection || !userDepartment || !(depot[selectedMajorSection]?.[userDepartment as Department])}
              >
                <option value="" disabled>{selectedMajorSection ? (userDepartment ? 'Select Depot/SSE' : 'Select Department first') : 'Select Major Section first'}</option>
                {selectedMajorSection && userDepartment && depot[selectedMajorSection]?.[userDepartment as Department] &&
                  depot[selectedMajorSection][userDepartment as Department].map((depotOption: string) => (
                    <option key={depotOption} value={depotOption}>{depotOption}</option>
                  ))}
              </select>
              {errors.selectedDepo && <span className="text-sm text-red-700 font-medium block mt-1">{errors.selectedDepo}</span>}
            </div>
          </div>
        </div>

        <div className="bg-[#e6f0fa] rounded-xl p-6 border-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block font-extrabold text-lg md:text-xl text-black text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Block Section/Yard</label>
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
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder={selectedMajorSection ? "Select Block Section" : "Select Major Section first"}
                styles={getSelectStyles(!!errors.missionBlock)}
                name="missionBlock"
              />
              {errors.missionBlock && blockSectionValue.length === 0 && (
                <span className="text-sm text-red-700 font-medium block mt-1">{errors.missionBlock}</span>
              )}
            </div>

            <div className="space-y-3">
              <label className="block font-extrabold text-lg md:text-xl text-black text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Line/Road</label>
              <div className="bg-white rounded-lg p-4 border-2 border-black max-h-[300px] overflow-y-auto">
                {blockSectionValue.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">Select a Block Section</div>
                ) : (
                  <div className="space-y-4">
                    {blockSectionValue.map((block) => {
                      const section = formData.processedLineSections?.find(s => s.block === block);
                      return (
                        <div key={block} className="space-y-2">
                          <label className="block text-xs font-extrabold text-black mb-1 text-center">{block}</label>
                          {block.includes('-YD') ? (
                            <>
                              <select
                                name={`${block}.road`}
                                value={section?.road || ''}
                                onChange={e => handleRoadSelection(block, e.target.value)}
                                className={`w-full border-2 rounded-lg px-2 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black ${errors[`${block}.road`] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'}`}
                              >
                                <option value="" disabled>Select Road</option>
                                {getAllRoadsForYard(block).map((road) => (
                                  <option key={road} value={road}>{road}</option>
                                ))}
                              </select>
                              {errors[`${block}.road`] && <span className="text-xs text-red-700 font-medium block mt-1">{errors[`${block}.road`]}</span>}
                              {section?.road && (
                                <>
                                  <select
                                    name={`${block}.stream`}
                                    value={section?.stream || ''}
                                    onChange={e => handleStreamSelection(block, e.target.value)}
                                    className={`w-full border-2 rounded-lg px-2 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black mt-1 ${errors[`${block}.stream`] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'}`}
                                  >
                                    <option value="" disabled>Select Direction</option>
                                    {streamData[block as keyof typeof streamData] &&
                                      Object.keys(streamData[block as keyof typeof streamData]).map((stream) => (
                                        <option key={stream} value={stream}>{stream}</option>
                                      ))}
                                  </select>
                                  {errors[`${block}.stream`] && <span className="text-xs text-red-700 font-medium block mt-1">{errors[`${block}.stream`]}</span>}
                                </>
                              )}
                              {section?.road && section?.stream && streamData[block] && (
                                <div className="mt-2 mb-2">
                                  <label className="block text-xs font-medium text-black mb-1">Other affected Roads for {block}</label>
                                  <Select
                                    isMulti
                                    options={(() => {
                                      const blockKey = block as keyof typeof streamData;
                                      const streamKey = section.stream as keyof typeof streamData[typeof blockKey];
                                      // @ts-ignore
                                      const roads: string[] = (streamData as any)[block] && (streamData as any)[block][section.stream] ? (streamData as any)[block][section.stream] : [];
                                      return roads.filter((road: string) => road !== section.road).map((road: string) => ({ value: road, label: road }));
                                    })()}
                                    value={section?.otherRoads
                                      ? section.otherRoads.split(",").filter(Boolean).map((road: string) => ({ value: road, label: road }))
                                      : []}
                                    onChange={(opts) => handleOtherAffectedLinesChange(block, Array.from(opts))}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    placeholder="Select other affected roads"
                                    styles={otherAffectedSelectStyles}
                                  />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <select
                                name={`${block}.lineName`}
                                value={section?.lineName || ''}
                                onChange={e => handleLineNameSelection(block, e.target.value)}
                                className={`w-full border-2 rounded-lg px-2 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-black ${errors[`${block}.lineName`] ? 'border-red-600 ring-2 ring-red-300' : 'border-black'}`}
                              >
                                <option value="" disabled>Select Line</option>
                                {(lineData[block as keyof typeof lineData] || []).map((line: string) => (
                                  <option key={line} value={line}>{line}</option>
                                ))}
                              </select>
                              {errors[`${block}.lineName`] && <span className="text-xs text-red-700 font-medium block mt-1">{errors[`${block}.lineName`]}</span>}
                              {section?.lineName && (
                                <div className="mt-2 mb-2">
                                  <label className="block text-xs font-medium text-black mb-1">Other affected Lines for {block}</label>
                                  <Select
                                    isMulti
                                    options={(lineData[block as keyof typeof lineData] || [])
                                      .filter((l: string) => l !== section.lineName)
                                      .map((l: string) => ({ value: l, label: l }))}
                                    value={section?.otherLines
                                      ? section.otherLines.split(",").filter(Boolean).map((line: string) => ({ value: line, label: line }))
                                      : []}
                                    onChange={(opts) => handleOtherAffectedLinesChange(block, Array.from(opts))}
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    placeholder="Select other affected lines"
                                    styles={otherAffectedSelectStyles}
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
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 rounded-xl p-6 border-2 border-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="block text-xl md:text-2xl font-extrabold uppercase tracking-wide text-white" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Corridor for this section</span>
              <span className="block text-sm text-white font-medium">Default corridor time for this section</span>
            </div>
            <div className="bg-black/30 rounded-lg px-6 py-3">
              <span className="text-2xl md:text-3xl font-extrabold text-white tracking-widest" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
                00:00 <span className="text-xl align-middle mx-2">TO</span> 03:00
              </span>
            </div>
          </div>
        </div>

        <div className="bg-orange-100 rounded-xl p-6 border-2 border-black">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <label className="font-extrabold text-lg md:text-xl text-black whitespace-nowrap" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Type of Block</label>
            <select
              name="corridorTypeSelection"
              value={formData.corridorTypeSelection || ''}
              onChange={handleInputChange}
              className={getSelectClassName('corridorTypeSelection')}
              disabled={isUrgentBlockDate(formData.date || '')}
            >
              <option value="">Select Type</option>
              <option value="Corridor">Corridor</option>
              <option value="Outside Corridor">Outside Corridor</option>
              <option value="Urgent Block">Urgent Block</option>
            </select>
            {errors.corridorTypeSelection && <span className="text-sm text-red-700 font-medium block mt-1">{errors.corridorTypeSelection}</span>}
            <span className="inline-block bg-orange-200 text-black font-extrabold px-4 py-2 rounded-lg text-lg">
              {formData.corridorTypeSelection === 'Urgent Block' ? 'Emergency' : 'Planned'}
            </span>
          </div>
        </div>

        <div className="bg-orange-100 rounded-xl p-6 border-2 border-black">
          <div className="space-y-4">
            <label className="block font-extrabold text-lg md:text-xl text-black text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Preferred Slot</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-1">
                <input
                  type="time"
                  name="demandTimeFrom"
                  value={extractTimeFromDatetime(formData.demandTimeFrom ? formData.demandTimeFrom : '')}
                  onChange={handleInputChange}
                  className={getInputClassName('demandTimeFrom')}
                />
                {errors.demandTimeFrom && <span className="text-sm text-red-700 font-medium block mt-1">{errors.demandTimeFrom}</span>}
              </div>
              <div className="text-center font-extrabold text-lg md:text-xl text-black">TO</div>
              <div className="space-y-1">
                <input
                  type="time"
                  name="demandTimeTo"
                  value={extractTimeFromDatetime(formData.demandTimeTo ? formData.demandTimeTo : '')}
                  onChange={handleInputChange}
                  className={getInputClassName('demandTimeTo')}
                />
                {errors.demandTimeTo && <span className="text-sm text-red-700 font-medium block mt-1">{errors.demandTimeTo}</span>}
              </div>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-lg text-black">Duration: <span className="text-green-700">{getDuration(extractTimeFromDatetime(formData.demandTimeFrom ? formData.demandTimeFrom : ''), extractTimeFromDatetime(formData.demandTimeTo ? formData.demandTimeTo : ''))}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-[#f7d6f7] rounded-xl p-6 border-2 border-black">
          <div className="space-y-3">
            <label className="block font-extrabold text-lg md:text-xl text-black" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Remarks (if any)</label>
            <textarea
              name="remarks"
              value={formData.remarks || ''}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className={getTextareaClassName('remarks')}
              rows={3}
            />
            {errors.remarks && <span className="text-sm text-red-700 font-medium block mt-1">{errors.remarks}</span>}
          </div>
        </div>

        <div className="bg-[#e6f7c6] rounded-xl p-6 border-2 border-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block font-extrabold text-lg md:text-xl text-black text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Type of Work</label>
              <select
                name="workType"
                value={formData.workType || ''}
                onChange={handleInputChange}
                className={getSelectClassName('workType')}
              >
                <option value="" disabled>Select Type of Work</option>
                {workTypeOptions.map((type: string) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.workType && <span className="text-sm text-red-700 font-medium block mt-1">{errors.workType}</span>}
            </div>
            <div className="space-y-3">
              <label className="block font-extrabold text-lg md:text-xl text-black text-center" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>Activity</label>
              <select
                name="activity"
                value={formData.activity || ''}
                onChange={handleInputChange}
                className={getSelectClassName('activity')}
              >
                <option value="" disabled>Select Activity</option>
                {activityOptions.map((activity: string) => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
                <option value="others">Others</option>
              </select>
              {formData.activity === 'others' && (
                <input
                  type="text"
                  name="customActivity"
                  className={getInputClassName('activity')}
                  placeholder="Enter custom activity"
                  value={customActivity}
                  onChange={e => setCustomActivity(e.target.value)}
                  required
                />
              )}
              {errors.activity && <span className="text-sm text-red-700 font-medium block mt-1">{errors.activity}</span>}
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
                          placeholder="Enter elementary section"
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
                          placeholder="Line from (e.g. KM 0/0)"
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
                          placeholder="Line to (e.g. KM 1/0)"
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
                          Assign Disconnection To{" "}
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
                            Select Depo
                          </option>
                          {selectedMajorSection &&
                            session?.user.department &&
                            depot[selectedMajorSection] &&
                            depot[selectedMajorSection]["S&T"] ? (
                            depot[selectedMajorSection]["S&T"].map(
                              (depotOption: string, index) => (
                                <option key={index} value={depotOption}>
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
                        {errors.sntDisconnectionAssignTo && (
                          <span className="text-xs text-red-700 font-medium mt-1 block">
                            {errors.sntDisconnectionAssignTo}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
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
      </form>

      {/* Responsive Floating/Sticky Bottom Navigation Bar */}
      <div
        className="z-50 flex items-center justify-center gap-4 bg-[#c6e6f7] border border-[#a3c9e6] shadow-xl rounded-2xl px-6 py-3 fixed left-1/2 transform -translate-x-1/2 bottom-6 md:left-1/2 md:transform md:-translate-x-1/2 md:bottom-6 w-[calc(100vw-16px)] max-w-md md:w-auto md:max-w-none md:rounded-2xl transition-all sm:rounded-t-2xl sm:rounded-b-none sm:px-2 sm:py-2 sm:left-0 sm:transform-none sm:bottom-0 sm:w-full sm:max-w-full sm:justify-center"
        style={{ boxShadow: '0 6px 32px 0 rgba(0,0,0,0.10)' }}
      >
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 bg-[#d6f7a1] border border-[#7ebd4a] rounded-lg px-3 py-2 text-base font-bold text-black shadow-sm hover:scale-105 hover:bg-[#e6f7c6] transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-lime-400"
          aria-label="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} className="w-6 h-6">
            <rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" />
            <path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" />
          </svg>
          Home
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-[#e6e6fa] border border-[#b7b7d1] rounded-lg px-3 py-2 text-base font-bold text-black shadow-sm hover:scale-105 hover:bg-[#f0eaff] transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Back"
        >
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='black' strokeWidth={2} className='w-6 h-6'>
            <circle cx="12" cy="12" r="11" fill="#fff" stroke="#222" strokeWidth="2" />
            <path strokeLinecap='round' strokeLinejoin='round' d='M14.5 8l-4 4 4 4' stroke="#222" strokeWidth="2" />
          </svg>
          Back
        </button>
        <button
          type="submit"
          form="block-request-form"
          className="flex items-center gap-2 bg-[#eeb8f7] border-2 border-[#c48ad6] rounded-full px-6 py-2 text-lg font-extrabold text-white shadow-lg hover:scale-105 hover:bg-[#e6aee0] transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={formSubmitting}
          aria-label="Submit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          SUBMIT
        </button>
      </div>

      <ReviewBlockRequestModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onConfirm={handleConfirmedSubmit}
        formData={formData}
        blockSectionValue={blockSectionValue}
        processedLineSections={formData.processedLineSections || []}
        selectedActivities={selectedActivities || []}
        customActivity={customActivity}
        formSubmitting={formSubmitting}
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
        <div className="text-green-700 text-sm mt-2 text-center">
          {success}
        </div>
      )}
      {formError && (
        <div className="text-red-600 text-sm mt-2 text-center">
          {formError}
        </div>
      )}
      <div className="text-xs text-gray-600 mt-4 text-center">
        <span className="text-red-600">*</span> Required fields • ©{' '}
        {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
