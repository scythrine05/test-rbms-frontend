"use client";
import React, { useState, useEffect, useRef } from "react";
import { useCreateUserRequest } from "@/app/service/mutation/user-request";
import { useSession, signOut } from "next-auth/react";
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
import { useRouter } from "next/navigation";
import Papa from "papaparse";

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
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
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
    backgroundColor: state.isSelected
      ? "#e0e7ef"
      : state.isFocused
      ? "#f3f4f6"
      : "white",
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

function ReviewBlockRequestModal({
  isOpen,
  onClose,
  onConfirm,
  formData,
  blockSectionValue,
  processedLineSections,
  selectedActivities,
  customActivity,
  formSubmitting,
  readOnly,
}: ReviewModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-[#d6f7fa] rounded-2xl shadow-2xl max-w-2xl w-full p-0 border-4 border-[#222] relative overflow-y-auto max-h-[90vh]">
        <div className="bg-[#f7f7a1] rounded-t-xl p-4 border-b-2 border-[#b6f7e6] text-center">
          <span
            className="text-3xl font-extrabold text-[#b07be0] tracking-wide"
            style={{ fontFamily: "Arial Black, Arial, sans-serif" }}
          >
            RBMS
          </span>
        </div>
        <div className="bg-[#c6e6f7] rounded-b-xl p-6 pt-4">
          <h2 className="text-2xl font-extrabold text-center mb-4 text-[#222]">
            Review the Block Request Before Submission
          </h2>
          <div className="space-y-3 text-black text-base">
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]">
                <b>Date of Block:</b> {formData.date}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Major Section:</b> {formData.selectedSection}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Depot/SSE:</b> {formData.selectedDepo}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]">
                <b>Block Section/Yard:</b> {blockSectionValue.join(", ")}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Line/Road:</b>{" "}
                {processedLineSections
                  .map((s: any) => s.lineName || s.road)
                  .join(", ")}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]">
                <b>Type of Block:</b> {formData.corridorTypeSelection}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Planned/Emergency:</b>{" "}
                {formData.corridorTypeSelection === "Urgent Block"
                  ? "Emergency"
                  : "Planned"}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]">
                <b>Preferred Slot:</b> {formData.demandTimeFrom} to{" "}
                {formData.demandTimeTo}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Duration:</b>{" "}
                {formData.demandTimeFrom && formData.demandTimeTo
                  ? getDuration(formData.demandTimeFrom, formData.demandTimeTo)
                  : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-2">
              <div className="flex-1 min-w-[180px]">
                <b>Type of Work:</b> {formData.workType}
              </div>
              <div className="flex-1 min-w-[180px]">
                <b>Activity:</b>{" "}
                {selectedActivities && selectedActivities.length > 0
                  ? selectedActivities.join(", ")
                  : formData.activity || customActivity}
              </div>
            </div>
            {formData.remarks && (
              <div className="mb-2">
                <b>Remarks:</b> {formData.remarks}
              </div>
            )}
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#f7d6f7] bg-[#f7d6f7]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">
                Caution Requirements
              </div>
              <div>
                <b>Fresh Caution Imposed:</b>{" "}
                {formData.freshCautionRequired === "Y" ? "Yes" : "No"}
              </div>
              {formData.freshCautionRequired === "Y" && (
                <div className="space-y-1 mt-2">
                  <div>
                    <b>Location From:</b>{" "}
                    {formData.freshCautionLocationFrom || "-"}
                  </div>
                  <div>
                    <b>Location To:</b> {formData.freshCautionLocationTo || "-"}
                  </div>
                  <div>
                    <b>Speed (km/hr):</b> {formData.freshCautionSpeed || "-"}
                  </div>
                  <div>
                    <b>Adjacent Lines Affected:</b>{" "}
                    {formData.adjacentLinesAffected || "-"}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#e6f7c6] bg-[#e6f7c6]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">
                Power Block Requirements
              </div>
              <div>
                <b>Power Block Needed:</b>{" "}
                {formData.powerBlockRequired === "Y" ? "Yes" : "No"}
              </div>
              {formData.powerBlockRequired === "Y" && (
                <div className="space-y-1 mt-2">
                  <div>
                    <b>Elementary Section:</b>{" "}
                    {formData.elementarySection || "-"}
                  </div>
                  <div>
                    <b>Requirements:</b>{" "}
                    {formData.powerBlockRequirements &&
                    formData.powerBlockRequirements.length > 0
                      ? formData.powerBlockRequirements.join(", ")
                      : "-"}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 mb-2 p-3 rounded-xl border-2 border-[#d6e6f7] bg-[#d6e6f7]">
              <div className="text-lg font-extrabold text-[#13529e] mb-2">
                S&T Disconnection Requirements
              </div>
              <div>
                <b>S&T Disconnection Needed:</b>{" "}
                {formData.sntDisconnectionRequired === "Y" ? "Yes" : "No"}
              </div>
              {formData.sntDisconnectionRequired === "Y" && (
                <div className="space-y-1 mt-2">
                  <div>
                    <b>Line From:</b> {formData.sntDisconnectionLineFrom || "-"}
                  </div>
                  <div>
                    <b>Line To:</b> {formData.sntDisconnectionLineTo || "-"}
                  </div>
                  <div>
                    <b>Requirements:</b>{" "}
                    {formData.sntDisconnectionRequirements &&
                    formData.sntDisconnectionRequirements.length > 0
                      ? formData.sntDisconnectionRequirements.join(", ")
                      : "-"}
                  </div>
                  <div>
                    <b>Assign To:</b> {formData.sntDisconnectionAssignTo || "-"}
                  </div>
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
// export function isUrgentBlockDate(dateString: string): boolean {
//   if (!dateString) return false;
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const targetDate = new Date(dateString);
//   targetDate.setHours(0, 0, 0, 0);
//   const dayDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
//   return dayDiff === 0 || dayDiff === 1 || dayDiff === 2;
// }

// Add a new style object for better contrast in 'Other affected Lines/Roads' dropdowns
const otherAffectedSelectStyles = {
  ...selectStyles,
  option: (base: any, state: any) => ({
    ...base,
    color: "black",
    backgroundColor: state.isSelected
      ? "#e0e7ef"
      : state.isFocused
      ? "#e5e7eb"
      : "white",
    fontSize: "13px",
    padding: "6px 10px",
    fontWeight: state.isSelected ? "bold" : "normal",
    "&:hover": {
      backgroundColor: "#e5e7eb",
      color: "black",
    },
    "&:active": {
      backgroundColor: "#e0e7ef",
      color: "black",
    },
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "#f3f4f6",
    color: "black",
    border: "1px solid #bdbdbd",
    borderRadius: "4px",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    color: "black",
    fontSize: "12px",
    padding: "2px 6px",
    fontWeight: "bold",
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
};

// Move this utility function above ReviewBlockRequestModal so it is in scope
function getDuration(from: string, to: string) {
  if (!from || !to) return "";
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  let start = fromH * 60 + fromM;
  let end = toH * 60 + toM;
  if (end < start) end += 24 * 60;
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

// Helper to calculate duration from two HH:MM strings
function getDurationFromTimes(from: string, to: string) {
  if (!from || !to) return "";
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  let start = fromH * 60 + fromM;
  let end = toH * 60 + toM;
  if (end < start) end += 24 * 60;
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins}m`;
}

type FormDataValue = string | number | boolean | null | string[];

interface FormData {
  date: string;
  demandTimeFrom: string;
  demandTimeTo: string;
  processedLineSections: {
    type: string;
    block: string;
    lineName: string;
    otherLines: string;
    stream: string;
    road: string;
    otherRoads: string;
  }[];
  adminAcceptance: boolean;
  selectedDepartment: string;
  selectedSection: string;
  missionBlock: string;
  workType: string;
  activity: string;
  corridorTypeSelection:
    | "Corridor"
    | "Outside Corridor"
    | "Urgent Block"
    | null;
  corridorType: "Corridor" | "Outside Corridor" | "Urgent Block" | null;
  selectedStream: string;
  selectedRoad: string;
  selectedRoads: string[];
  selectedStreams: string[];
  trdWorkLocation?: string;
  cautionRequired: boolean;
  cautionSpeed: number;
  workLocationFrom: string;
  workLocationTo: string;
  sigDisconnection: boolean;
  elementarySection: string;
  cautionLocationFrom: string;
  cautionLocationTo: string;
  freshCautionRequired: boolean | null;
  freshCautionSpeed: number;
  freshCautionLocationFrom: string;
  adjacentLinesAffected: string;
  sigElementarySectionFrom: string;
  sigElementarySectionTo: string;
  sntDisconnectionLineFrom: string;
  sntDisconnectionLineTo: string;
  repercussions: string;
  sntDisconnectionLine: string;
  elementarySectionTo: string;
  freshCautionLocationTo: string;
  requestremarks: string;
  remarks: string;
  selectedDepo: string;
  routeFrom: string;
  routeTo: string;
  powerBlockRequired: boolean | null;
  sntDisconnectionRequired: boolean | null;
  sntDisconnectionRequirements: string[];
  powerBlockRequirements: string[];
  sigResponse: string;
  ohDisconnection: string;
  oheDisconnection: string;
  oheResponse: string;
  sigActionsNeeded: boolean;
  trdActionsNeeded: boolean;
  powerBlockKmFrom: string;
  powerBlockKmTo: string;
  powerBlockRoad: string;
  sntDisconnectionPointNo: string;
  sntDisconnectionSignalNo: string;
}

export default function CreateBlockRequestPage() {
  const router = useRouter();

  const initialFormData: FormData = {
    date: "",
    demandTimeFrom: "",
    demandTimeTo: "",
    processedLineSections: [],
    adminAcceptance: false,
    selectedDepartment: "",
    selectedSection: "",
    missionBlock: "",
    workType: "",
    activity: "",
    corridorTypeSelection: null,
    corridorType: null,
    selectedStream: "",
    selectedRoad: "",
    selectedRoads: [],
    selectedStreams: [],
    cautionRequired: false,
    cautionSpeed: 0,
    workLocationFrom: "",
    workLocationTo: "",
    sigDisconnection: false,
    elementarySection: "",
    cautionLocationFrom: "",
    cautionLocationTo: "",
    freshCautionRequired: null,
    freshCautionSpeed: 0,
    freshCautionLocationFrom: "",
    adjacentLinesAffected: "",
    sigElementarySectionFrom: "",
    sigElementarySectionTo: "",
    sntDisconnectionLineFrom: "",
    sntDisconnectionLineTo: "",
    repercussions: "",
    sntDisconnectionLine: "",
    elementarySectionTo: "",
    freshCautionLocationTo: "",
    requestremarks: "",
    remarks: "",
    selectedDepo: "",
    routeFrom: "",
    routeTo: "",
    powerBlockRequired: null,
    sntDisconnectionRequired: null,
    sntDisconnectionRequirements: [],
    powerBlockRequirements: [],
    sigResponse: "",
    ohDisconnection: "",
    oheDisconnection: "",
    oheResponse: "",
    sigActionsNeeded: false,
    trdActionsNeeded: false,
    powerBlockKmFrom: "",
    powerBlockKmTo: "",
    powerBlockRoad: "",
    sntDisconnectionPointNo: "",
    sntDisconnectionSignalNo: "",
    trdWorkLocation: "",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [processedLineSections, setProcessedLineSections] = useState<any[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

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

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Use UTC methods to ensure consistent timezone handling
    return `${tomorrow.getUTCFullYear()}-${String(
      tomorrow.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;
  };

  const isDateInCurrentWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const targetDate = new Date(dateString + "T00:00:00Z");
    targetDate.setUTCHours(0, 0, 0, 0);

    const currentWeekMonday = new Date(today);
    const daysSinceMonday = today.getUTCDay() === 0 ? 6 : today.getUTCDay() - 1;
    currentWeekMonday.setUTCDate(today.getUTCDate() - daysSinceMonday);

    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setUTCDate(currentWeekMonday.getUTCDate() + 6);

    return targetDate >= currentWeekMonday && targetDate <= currentWeekSunday;
  };

  const isWithinNextTwoDays = (dateString: string): boolean => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const targetDate = new Date(dateString + "T00:00:00Z");
    targetDate.setUTCHours(0, 0, 0, 0);

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setUTCDate(today.getUTCDate() + 2);

    return targetDate >= today && targetDate <= twoDaysFromNow;
  };

  const isDateInNextWeek = (dateString: string): boolean => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const targetDate = new Date(dateString + "T00:00:00Z");
    targetDate.setUTCHours(0, 0, 0, 0);

    const currentWeekSunday = new Date(today);
    const daysUntilSunday = today.getUTCDay() === 0 ? 0 : 7 - today.getUTCDay();
    currentWeekSunday.setUTCDate(today.getUTCDate() + daysUntilSunday);

    const nextWeekMonday = new Date(currentWeekSunday);
    nextWeekMonday.setUTCDate(currentWeekSunday.getUTCDate() + 1);

    const nextWeekSunday = new Date(nextWeekMonday);
    nextWeekSunday.setUTCDate(nextWeekMonday.getUTCDate() + 6);

    return targetDate >= nextWeekMonday && targetDate <= nextWeekSunday;
  };

  const isPastThursdayCutoff = (): boolean => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const hour = now.getUTCHours();

    return (dayOfWeek === 4 && hour >= 22) || dayOfWeek > 4;
  };

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

    const isUrgentTimeframe = isWithinNextTwoDays(dateString);

    const isNextWeek = isDateInNextWeek(dateString);

    const pastThursdayCutoff = isPastThursdayCutoff();

    const urgentAllowed = isUrgentTimeframe;

    const urgentOnly = isUrgentTimeframe || (isNextWeek && pastThursdayCutoff);

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
    return `${today.getUTCFullYear()}-${String(
      today.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  };

  const getMaxUrgentDateString = () => {
    const today = new Date();
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setUTCDate(today.getUTCDate() + 2);
    return `${dayAfterTomorrow.getUTCFullYear()}-${String(
      dayAfterTomorrow.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(dayAfterTomorrow.getUTCDate()).padStart(
      2,
      "0"
    )}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const newData = { ...prev };
      const key = name as keyof FormData;

      if (type === "checkbox") {
        (newData as any)[key] = (e.target as HTMLInputElement).checked;
      } else if (type === "number" || key === "freshCautionSpeed") {
        // Handle both explicit number inputs and freshCautionSpeed
        const numValue = parseFloat(value);
        (newData as any)[key] = isNaN(numValue) ? 0 : numValue;
      } else {
        (newData as any)[key] = value;
      }

      return newData as FormData;
    });
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

  // Helper to scroll to the first error field
  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      let errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      if (!errorElement) {
        errorElement = document.getElementById(firstErrorKey);
      }
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        (errorElement as HTMLElement).focus();
      }
    }
  };

  // Add reviewMode state
  const [reviewMode, setReviewMode] = useState(false);

  // Refactor handleSubmit to work with reviewMode
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewMode) {
      setReviewMode(true); // Enter review mode
      return;
    }
    // Only submit in review mode
    setFormSubmitting(true);
    setFormError(null);
    try {
      const validationResult = handleFormValidation();
      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        scrollToFirstError(validationResult.errors);
        setFormSubmitting(false);
        return;
      }
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
      const submitData: UserRequestInput = {
        ...formData,
        corridorType: formData.corridorTypeSelection,
        sntDisconnectionRequired: formData.sntDisconnectionRequired ?? false,
        powerBlockRequired: formData.powerBlockRequired ?? false,
        freshCautionRequired: formData.freshCautionRequired ?? false,
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
        adminAcceptance: false,
      };
      const response = await mutation.mutateAsync(submitData);
      if (response) {
        toast.success("Block request submitted successfully!");
        setSubmittedSummary({
          date: submitData.date,
          id: response.data?.divisionId || response.data?.id ,
          blockSection: submitData.missionBlock || "-",
          lineOrRoad:
            submitData.processedLineSections &&
            submitData.processedLineSections.length > 0
              ? submitData.processedLineSections
                  .map((s: any) => s.lineName || s.road)
                  .join(", ")
              : "-",
          duration:
            getDurationFromTimes(
              formData.demandTimeFrom || "",
              formData.demandTimeTo || ""
            ) || "-",
        });
        setFormData(initialFormData);
        setBlockSectionValue([]);
        setProcessedLineSections([]);
        setSelectedActivities([]);
        setCustomActivity("");
        setErrors({});
        setShowSuccessPage(true);
        setReviewMode(false);
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
      setFormError(
        error.message ||
          "An error occurred while submitting the form. Please try again."
      );
      toast.error(error.message || "Failed to submit block request");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFormValidation = () => {
    const errors: Record<string, string> = {};

    // Basic validations
    if (!formData.date) errors.date = "Date is required";
    if (!formData.demandTimeFrom)
      errors.demandTimeFrom = "From time is required";
    if (!formData.demandTimeTo) errors.demandTimeTo = "To time is required";
    if (!formData.selectedDepartment)
      errors.selectedDepartment = "Department is required";
    if (!formData.selectedSection)
      errors.selectedSection = "Section is required";
    if (!formData.missionBlock)
      errors.missionBlock = "Mission block is required";
    if (!formData.workType) errors.workType = "Work type is required";
    if (!formData.activity) errors.activity = "Activity is required";
    if (!formData.corridorTypeSelection)
      errors.corridorTypeSelection = "Corridor type is required";

    // Corridor-specific validations
    if (formData.corridorTypeSelection === "Corridor") {
      if (!formData.workLocationFrom)
        errors.workLocationFrom = "Work location from is required";
      if (!formData.workLocationTo)
        errors.workLocationTo = "Work location to is required";
      if (formData.cautionRequired) {
        if (!formData.cautionSpeed)
          errors.cautionSpeed = "Caution speed is required";
        if (!formData.cautionLocationFrom)
          errors.cautionLocationFrom = "Caution location from is required";
        if (!formData.cautionLocationTo)
          errors.cautionLocationTo = "Caution location to is required";
      }
    }

    // Outside Corridor validations
    if (formData.corridorTypeSelection === "Outside Corridor") {
      if (!formData.routeFrom) errors.routeFrom = "Route from is required";
      if (!formData.routeTo) errors.routeTo = "Route to is required";
      if (!formData.remarks) errors.remarks = "Remarks are required";
    }

    // Urgent Block validations
    if (formData.corridorTypeSelection === "Urgent Block") {
      if (formData.freshCautionRequired) {
        if (!formData.freshCautionSpeed)
          errors.freshCautionSpeed = "Fresh caution speed is required";
        if (!formData.freshCautionLocationFrom)
          errors.freshCautionLocationFrom =
            "Fresh caution location from is required";
        if (!formData.freshCautionLocationTo)
          errors.freshCautionLocationTo =
            "Fresh caution location to is required";
      }
      // if (!formData.adjacentLinesAffected) errors.adjacentLinesAffected = "Adjacent lines affected is required";
    }

    // Power Block validations
    if (formData.powerBlockRequired) {
      if (!formData.powerBlockKmFrom)
        errors.powerBlockKmFrom = "KM From is required for Power Block";
      if (!formData.powerBlockKmTo)
        errors.powerBlockKmTo = "KM To is required for Power Block";
      if (!formData.powerBlockRoad)
        errors.powerBlockRoad = "Road No. is required for Power Block";
    }

    // S&T Disconnection validations
    if (formData.sntDisconnectionRequired) {
      if (!formData.sntDisconnectionLineFrom)
        errors.sntDisconnectionLineFrom =
          "KM From is required for S&T Disconnection";
      if (!formData.sntDisconnectionLineTo)
        errors.sntDisconnectionLineTo =
          "KM To is required for S&T Disconnection";
      if (!formData.sntDisconnectionPointNo)
        errors.sntDisconnectionPointNo =
          "Point No. is required for S&T Disconnection";
      if (!formData.sntDisconnectionSignalNo)
        errors.sntDisconnectionSignalNo =
          "Signal No. is required for S&T Disconnection";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      scrollToFirstError(errors);
      return { isValid: false, errors };
    }

    return { isValid: true, errors: {} };
  };

  const getInputClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${
      errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
    }`;
  };

  const getSelectClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-black placeholder-black text-xs px-2 py-1 ${
      errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
    }`;
  };

  const getTextareaClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${
      errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
    }`;
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
      const { urgentOnly, urgentAllowed, message } =
        getCorridorTypeRestrictions(formData.date);

      if (urgentOnly) {
        setIsDisabled(true);
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      } else {
        setIsDisabled(false);

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
      String(formData.sntDisconnectionRequired) === "Y"
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

  const handleLineNameSelection = (block: string, values: string[]) => {
    setFormData((prev) => {
      const existingProcessedSections = [...(prev.processedLineSections || [])];
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (values.length === 0) {
        if (sectionIndex !== -1) {
          existingProcessedSections.splice(sectionIndex, 1);
        }
      } else {
        const lineName = values[0].trim(); // First selected
        const otherLines = values
          .slice(1)
          .map((v) => v.trim())
          .filter(Boolean)
          .join(","); // Rest

        const newSection = {
          block,
          type: "line",
          lineName,
          otherLines,
          stream: "",
          road: "",
          otherRoads: "",
        };

        if (sectionIndex !== -1) {
          existingProcessedSections[sectionIndex] = {
            ...existingProcessedSections[sectionIndex],
            ...newSection,
          };
        } else {
          existingProcessedSections.push(newSection);
        }
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
      };
    });
  };

  const handleOtherAffectedLinesChange = (
    block: string,
    options: { value: string }[]
  ) => {
    setFormData((prev) => {
      const existingProcessedSections = [...prev.processedLineSections];
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex !== -1) {
        const section = existingProcessedSections[sectionIndex];
        if (section.type === "line") {
          const updatedSection = {
            ...section,
            otherLines: options.map((opt) => opt.value).join(","),
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      } else {
        existingProcessedSections.push({
          block,
          type: "line",
          lineName: "",
          otherLines: options.map((opt) => opt.value).join(","),
          stream: "",
          road: "",
          otherRoads: "",
        });
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
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
      const existingProcessedSections = [...prev.processedLineSections];
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex !== -1) {
        const section = existingProcessedSections[sectionIndex];
        if (section.type === "line") {
          const updatedSection = {
            ...section,
            stream: value,
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      } else {
        existingProcessedSections.push({
          block,
          type: "line",
          lineName: "",
          otherLines: "",
          stream: value,
          road: "",
          otherRoads: "",
        });
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedStream: value,
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

  const handleRoadSelection = (block: string, value: string) => {
    setFormData((prev) => {
      const existingProcessedSections = [...prev.processedLineSections];
      const sectionIndex = existingProcessedSections.findIndex(
        (section) => section.block === block
      );

      if (sectionIndex !== -1) {
        const section = existingProcessedSections[sectionIndex];
        if (section.type === "yard") {
          const updatedSection = {
            ...section,
            otherRoads: value,
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      } else {
        existingProcessedSections.push({
          block,
          type: "yard",
          lineName: "",
          otherLines: "",
          stream: "",
          road: value,
          otherRoads: "",
        });
      }

      return {
        ...prev,
        processedLineSections: existingProcessedSections,
        selectedRoad: value,
      };
    });
  };

  // Add state to track if the success page should be shown and the submitted request summary
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [submittedSummary, setSubmittedSummary] = useState<any>(null);
  // Add state for showing the details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Add state for corridor CSV data
  const [corridorData, setCorridorData] = useState<any[]>([]);
  const [corridorTime, setCorridorTime] = useState<{
    from: string;
    to: string;
    duration: string;
  } | null>(null);
  const csvLoadedRef = useRef(false);

  // Load and parse the corridor CSV on mount
  useEffect(() => {
    if (csvLoadedRef.current) return;
    fetch("/Corridor%20-%20Final%20(1).csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, { header: true });
        setCorridorData(parsed.data as any[]);
        csvLoadedRef.current = true;
      });
  }, []);

  // Compute corridor time when block section or line changes
  useEffect(() => {
    if (!corridorData.length || !blockSectionValue.length) {
      setCorridorTime(null);
      return;
    }
    // For each selected block section, get the first selected line
    const firstLines = blockSectionValue.map((block: string) => {
      const sectionEntry =
        (formData.processedLineSections || []).find(
          (s: any) => s.block === block
        ) || {};
      return (sectionEntry as any).lineName
        ? (sectionEntry as any).lineName.split(",")[0]
        : null;
    });
    // Only consider block sections with a selected line
    const validPairs = blockSectionValue
      .map((block: string, idx: number) => {
        const line = firstLines[idx];
        if (!line) return null;
        // Find matching corridor row
        const row = corridorData.find((row: any) => {
          return (
            (row["Section/ station"] || row["section"])?.trim() === block &&
            (row["Line"] || "").trim() === line
          );
        });
        return row || null;
      })
      .filter(Boolean);
    if (!validPairs.length) {
      setCorridorTime(null);
      return;
    }
    // Find intersection of corridor times (latest from, earliest to)
    let fromTimes = validPairs.map((row: any) => row["From"]);
    let toTimes = validPairs.map((row: any) => row["To"]);
    let duration = validPairs[0]["Duration"];
    // Use max of fromTimes and min of toTimes
    const maxFrom = fromTimes.reduce((a, b) => (a > b ? a : b));
    const minTo = toTimes.reduce((a, b) => (a < b ? a : b));
    setCorridorTime({ from: maxFrom, to: minTo, duration });
  }, [corridorData, blockSectionValue, formData.processedLineSections]);

  // Inline error rendering helper
  const renderError = (field: string) =>
    errors[field] ? (
      <div className="text-red-600 text-xs font-bold mt-0.5 mb-1">
        {errors[field]}
      </div>
    ) : null;

  if (showSuccessPage) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-[#fcfaf3]">
        <div className="w-full max-w-2xl mx-auto mt-4">
          <div className="text-center bg-[#f7f7a1] rounded-t-2xl p-4 border-b-2 border-[#b6f7e6]">
            <span className="text-4xl font-extrabold text-[#b07be0]">RBMS</span>
          </div>
          <div className="bg-[#fffaf0] rounded-b-2xl p-4 sm:p-6 w-full max-w-2xl overflow-auto">
            <div className="bg-[#c6e6f7] rounded-xl p-4 mb-6 w-full overflow-auto">
              <h2 className="text-2xl font-extrabold mb-4 text-[#222]">
                Your Block Request has been Registered
              </h2>
              <table className="w-full mb-2 border rounded-xl overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-[#e6f7c6]">
                    <th className="px-2 py-1 border text-black font-bold">
                      Date
                    </th>
                    <th className="px-2 py-1 border text-black font-bold">
                      ID
                    </th>
                    <th className="px-2 py-1 border text-black font-bold">
                      Block Section
                    </th>
                    <th className="px-2 py-1 border text-black font-bold">
                      UP/DN/SL/Road
                    </th>
                    <th className="px-2 py-1 border text-black font-bold">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-center bg-white border-b shadow-sm hover:bg-[#f7f7fa]">
                    <td className="px-2 py-2 border text-black font-semibold">
                      {submittedSummary?.date
                        ? new Date(submittedSummary.date).toLocaleDateString(
                            "en-GB"
                          )
                        : "-"}
                    </td>

                    <td className="px-2 py-2 border text-black font-semibold">
                      {submittedSummary?.id || "-"}
                    </td>
                    <td className="px-2 py-2 border text-black font-semibold">
                      {submittedSummary?.blockSection || "-"}
                    </td>
                    <td className="px-2 py-2 border text-black font-semibold">
                      {submittedSummary?.lineOrRoad || "-"}
                    </td>
                    <td className="px-2 py-2 border text-black font-semibold">
                      {submittedSummary?.duration || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-6 items-center mt-8 w-full">
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push("/create-block-request")}
              >
                ENTER MORE BLOCK REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push("/edit-request")}
              >
                EDIT OR CANCEL PREVIOUS REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push("/request-table")}
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
            onClick={() => router.push("/dashboard")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 32 32"
              stroke="black"
              strokeWidth={2}
              className="w-6 h-6"
            >
              <rect
                x="6"
                y="12"
                width="20"
                height="12"
                rx="2"
                fill="#fffbe9"
                stroke="black"
                strokeWidth="2"
              />
              <path
                d="M4 14L16 4L28 14"
                stroke="black"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#b6e6c6]">
      {/* Top Yellow Bar */}
      <div className="w-full bg-[#FFF86B] py-2 flex flex-col items-center">
        <span
          className="text-5xl font-extrabold text-[#B57CF6] tracking-widest"
          style={{ letterSpacing: "0.1em" }}
        >
          RBMS
        </span>
      </div>
      {/* Main Title on Green */}
      <div className="w-full bg-[#d6f7a1] py-4 flex flex-col items-center border-b-2 border-black">
        <span
          className="text-2xl font-extrabold text-black text-center"
          style={{ letterSpacing: "0.02em" }}
        >
          {reviewMode
            ? "Review the Block Request Before Submission"
            : "Enter New Block Request"}
        </span>
      </div>
      {/* Blue rounded box for Date and Major Section */}
      <form
        onSubmit={handleFormSubmit}
        className="w-full flex justify-center mt-0"
      >
        <div
          className="rounded-t-3xl rounded-b-2xl bg-[#c6e6f7] border-2 border-black p-6 pt-4 w-full max-w-2xl flex flex-col items-start overflow-auto"
          style={{
            boxShadow: "0 4px 12px #0002",
            borderTopLeftRadius: "32px",
            borderTopRightRadius: "32px",
            borderBottomLeftRadius: "24px",
            borderBottomRightRadius: "24px",
            maxHeight: "90vh",
          }}
        >
          <div className="flex flex-row items-center gap-4 mb-4 w-full">
            <label
              className="text-xl font-bold text-black"
              htmlFor="date-of-block"
            >
              Date of Block
            </label>
            <input
              id="date-of-block"
              type="date"
              name="date"
              placeholder="dd:mm:yyyy"
              value={formData.date || ""}
              onChange={handleInputChange}
              className="bg-[#f7d6f7] border-2 border-black rounded px-6 py-2 text-xl font-bold text-black text-center shadow-md focus:outline-none focus:ring-2 focus:ring-purple-300"
              style={{ minWidth: "180px", maxWidth: "220px" }}
              required
            />
            {renderError("date")}
          </div>
          <div className="flex flex-row items-center gap-4 w-full">
            <select
              name="selectedSection"
              value={formData.selectedSection || ""}
              onChange={handleInputChange}
              className="bg-[#e6f7c6] border-2 border-black rounded px-3 py-2 text-lg font-bold text-black appearance-none shadow-inner focus:outline-none focus:ring-2 focus:ring-green-300"
              style={{
                backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "2rem",
                minWidth: "220px",
              }}
              required
            >
              <option value="" disabled>
                {formData.selectedSection
                  ? formData.selectedSection
                  : "Major Section"}
              </option>
              {majorSectionOptions.map((section: string) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            {renderError("selectedSection")}
          </div>
          {/* Block Section/Yard and Line/Road dropdowns (compact layout) */}
          <div className="flex flex-row gap-1 w-full mt-2">
            {/* Block Section/Yard Multi-select (no extra label) */}
            <div className="w-full flex items-center gap-2 ">
              <Select
                isMulti
                name="blockSection"
                options={blockSectionOptions.map((block: string) => ({
                  value: block,
                  label: block,
                }))}
                value={blockSectionValue.map((val: string) => ({
                  value: val,
                  label: val,
                }))}
                onChange={(selected) => {
                  const values = selected
                    ? selected.map((opt: any) => opt.value)
                    : [];
                  setBlockSectionValue(values);
                  setFormData((prev) => ({
                    ...prev,
                    processedLineSections: (
                      prev.processedLineSections || []
                    ).filter((s: any) => values.includes(s.block)),
                  }));
                }}
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#FFB74D",
                    borderColor: "black",
                    borderWidth: 2,
                    borderRadius: 6,
                    minHeight: "32px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    boxShadow: "none",
                    padding: "0 2px",
                  }),
                  menu: (base) => ({ ...base, zIndex: 20 }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#fff3",
                    color: "black",
                    fontSize: "13px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#ffe082"
                      : state.isFocused
                      ? "#ffe08299"
                      : "#FFB74D",
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "14px",
                    padding: "4px 8px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: "black",
                    fontSize: "20px",
                    padding: 0,
                  }),
                }}
                placeholder="Block Section/Yard"
                closeMenuOnSelect={false}
              />
              {renderError("missionBlock")}
            </div>
            {/* For each selected block section, render a row: block name and its Line/Road multi-select dropdown horizontally */}
            {blockSectionValue.map((block: string) => {
              const isYard = block.includes("-YD");
              const lineOrRoadOptions = isYard
                ? getAllRoadsForYard(block).map((road: string) => ({
                    value: road,
                    label: road,
                  }))
                : (lineData[block as keyof typeof lineData] || []).map(
                    (line: string) => ({ value: line, label: line })
                  );
              const sectionEntry =
                (formData.processedLineSections || []).find(
                  (s: any) => s.block === block
                ) || {};
              const selectedValues = isYard
                ? (sectionEntry as any).road
                  ? (sectionEntry as any).road
                      .split(",")
                      .map((r: string) => ({ value: r, label: r }))
                  : []
                : (sectionEntry as any).lineName
                ? (sectionEntry as any).lineName
                    .split(",")
                    .map((l: string) => ({ value: l, label: l }))
                : [];
              return (
                <div
                  key={block}
                  className="flex flex-row items-center gap-2 w-full mt-1"
                >
                  {/* <span className="font-bold text-black text-[13px] min-w-[90px] truncate">
                    {block}
                  </span> */}
                  <Select
                    isMulti
                    name={`lineOrRoad-${block}`}
                    options={lineOrRoadOptions}
                    value={(() => {
                      const section = formData.processedLineSections?.find(
                        (s) => s.block === block
                      );
                      const selectedValues: { value: string; label: string }[] =
                        [];

                      if (section?.lineName) {
                        selectedValues.push({
                          value: section.lineName,
                          label: section.lineName,
                        });
                      }

                      if (section?.otherLines) {
                        const otherLineList = section.otherLines
                          .split(",")
                          .map((line) => line.trim())
                          .filter(Boolean);
                        selectedValues.push(
                          ...otherLineList.map((line) => ({
                            value: line,
                            label: line,
                          }))
                        );
                      }

                      return selectedValues;
                    })()}
                    onChange={(selected) => {
                      const values = selected
                        ? selected.map((opt: any) => opt.value)
                        : [];
                      if (isYard) {
                        handleRoadSelection(block, values.join(","));
                      } else {
                        handleLineNameSelection(block, values);
                      }
                    }}
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "#FFB74D",
                        borderColor: "black",
                        borderWidth: 2,
                        borderRadius: 6,
                        minHeight: "32px",
                        fontWeight: "bold",
                        fontSize: "14px",
                        boxShadow: "none",
                        padding: "0 2px",
                      }),
                      menu: (base) => ({ ...base, zIndex: 20 }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected
                          ? "#ffe082"
                          : state.isFocused
                          ? "#ffe08299"
                          : "#FFB74D",
                        color: "black",
                        fontWeight: "bold",
                        fontSize: "14px",
                        padding: "4px 8px",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "black",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        color: "black",
                        fontSize: "20px",
                        padding: 0,
                      }),
                    }}
                    placeholder={isYard ? "Road(s)" : "Line(s)/Road(s)"}
                    closeMenuOnSelect={false}
                  />
                  {renderError(`${block}.lineName`)}
                  {renderError(`${block}.road`)}
                  {renderError(`${block}.stream`)}
                </div>
              );
            })}
          </div>
          {/* Corridor and Preferred Slot section (horizontal, compact, responsive) */}
          <div className="flex flex-row flex-wrap items-center gap-1 w-full mt-2 overflow-x-hidden">
            <div
              className="flex flex-row items-center"
              style={{
                background: "#f00",
                border: "2px solid black",
                borderRight: 0,
                borderRadius: "6px 0 0 6px",
                minWidth: 140,
                maxWidth: 180,
              }}
            >
              <span className="text-white font-bold px-2 py-1 text-[13px]">
                Corridor for this section
              </span>
            </div>
            <div
              className="flex flex-row items-center"
              style={{
                background: "#f00",
                border: "2px solid black",
                borderLeft: 0,
                borderRight: 0,
                minWidth: 60,
                maxWidth: 80,
              }}
            >
              <span className="text-white font-bold px-2 py-1 text-[13px]">
                {corridorTime?.from || "--:--"}
              </span>
            </div>
            <div
              className="flex flex-row items-center"
              style={{
                background: "#f00",
                border: "2px solid black",
                borderLeft: 0,
                borderRight: 0,
                minWidth: 30,
                maxWidth: 40,
                justifyContent: "center",
              }}
            >
              <span className="text-white font-bold px-2 py-1 text-[13px]">
                TO
              </span>
            </div>
            <div
              className="flex flex-row items-center"
              style={{
                background: "#f00",
                border: "2px solid black",
                borderLeft: 0,
                borderRadius: "0 6px 6px 0",
                minWidth: 60,
                maxWidth: 80,
              }}
            >
              <span className="text-white font-bold px-2 py-1 text-[13px]">
                {corridorTime?.to || "--:--"}
              </span>
            </div>
          </div>
          {/* Preferred Slot row (styled to match corridor row, boxy, bold, high-contrast) */}
          <div className="flex flex-row flex-wrap items-center gap-0 w-full mt-1 overflow-x-hidden">
            <div
              className="flex flex-row items-center justify-center"
              style={{
                background: "#F4A460",
                border: "3px solid black",
                borderRight: 0,
                borderRadius: "8px 0 0 8px",
                minWidth: 140,
                maxWidth: 180,
                height: 38,
              }}
            >
              <span className="text-black font-bold px-3 py-1 text-[15px]">
                Preferred Slot
              </span>
            </div>
            <div
              className="flex flex-row items-center justify-center"
              style={{
                background: "#F4A460",
                borderTop: "3px solid black",
                borderBottom: "3px solid black",
                borderRight: 0,
                borderLeft: "3px solid black",
                minWidth: 70,
                maxWidth: 90,
                height: 38,
              }}
            >
              <select
                name="demandTimeFromHour"
                value={
                  formData.demandTimeFrom
                    ? formData.demandTimeFrom.split(":")[0]
                    : ""
                }
                onChange={(e) => {
                  const hour = e.target.value;
                  const min = formData.demandTimeFrom
                    ? formData.demandTimeFrom.split(":")[1]
                    : "00";
                  handleInputChange({
                    target: { name: "demandTimeFrom", value: `${hour}:${min}` },
                  } as any);
                }}
                className="bg-[#F4A460] border-0 text-black font-extrabold text-[16px] px-1 py-1 w-[40px] text-center focus:outline-none appearance-none"
                style={{ minWidth: 40 }}
                required
              >
                <option value="">--</option>
                {[...Array(24).keys()].map((h) => (
                  <option key={h} value={h.toString().padStart(2, "0")}>
                    {h.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-black font-extrabold text-[16px]">:</span>
              <select
                name="demandTimeFromMin"
                value={
                  formData.demandTimeFrom
                    ? formData.demandTimeFrom.split(":")[1]
                    : ""
                }
                onChange={(e) => {
                  const min = e.target.value;
                  const hour = formData.demandTimeFrom
                    ? formData.demandTimeFrom.split(":")[0]
                    : "00";
                  handleInputChange({
                    target: { name: "demandTimeFrom", value: `${hour}:${min}` },
                  } as any);
                }}
                className="bg-[#F4A460] border-0 text-black font-extrabold text-[16px] px-1 py-1 w-[40px] text-center focus:outline-none appearance-none"
                style={{ minWidth: 40 }}
                required
              >
                <option value="">--</option>
                {[...Array(12).keys()].map((m) => (
                  <option key={m} value={(m * 5).toString().padStart(2, "0")}>
                    {(m * 5).toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="flex flex-row items-center justify-center"
              style={{
                background: "#F4A460",
                borderTop: "3px solid black",
                borderBottom: "3px solid black",
                borderRight: 0,
                borderLeft: "3px solid black",
                minWidth: 40,
                maxWidth: 50,
                height: 38,
              }}
            >
              <span className="text-black font-extrabold px-2 py-1 text-[15px]">
                TO
              </span>
            </div>
            <div
              className="flex flex-row items-center justify-center"
              style={{
                background: "#F4A460",
                border: "3px solid black",
                borderLeft: 0,
                borderRadius: "0 8px 8px 0",
                minWidth: 70,
                maxWidth: 90,
                height: 38,
              }}
            >
              <select
                name="demandTimeToHour"
                value={
                  formData.demandTimeTo
                    ? formData.demandTimeTo.split(":")[0]
                    : ""
                }
                onChange={(e) => {
                  const hour = e.target.value;
                  const min = formData.demandTimeTo
                    ? formData.demandTimeTo.split(":")[1]
                    : "00";
                  handleInputChange({
                    target: { name: "demandTimeTo", value: `${hour}:${min}` },
                  } as any);
                }}
                className="bg-[#F4A460] border-0 text-black font-extrabold text-[16px] px-1 py-1 w-[40px] text-center focus:outline-none appearance-none"
                style={{ minWidth: 40 }}
                required
              >
                <option value="">--</option>
                {[...Array(24).keys()].map((h) => (
                  <option key={h} value={h.toString().padStart(2, "0")}>
                    {h.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-black font-extrabold text-[16px]">:</span>
              <select
                name="demandTimeToMin"
                value={
                  formData.demandTimeTo
                    ? formData.demandTimeTo.split(":")[1]
                    : ""
                }
                onChange={(e) => {
                  const min = e.target.value;
                  const hour = formData.demandTimeTo
                    ? formData.demandTimeTo.split(":")[0]
                    : "00";
                  handleInputChange({
                    target: { name: "demandTimeTo", value: `${hour}:${min}` },
                  } as any);
                }}
                className="bg-[#F4A460] border-0 text-black font-extrabold text-[16px] px-1 py-1 w-[40px] text-center focus:outline-none appearance-none"
                style={{ minWidth: 40 }}
                required
              >
                <option value="">--</option>
                {[...Array(12).keys()].map((m) => (
                  <option key={m} value={(m * 5).toString().padStart(2, "0")}>
                    {(m * 5).toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Duration and Type of Block row, full width, equal size, compact */}
          <div className="flex flex-row flex-wrap items-center gap-1 w-full mt-1 overflow-x-hidden">
            <div
              className="flex flex-row items-center justify-center flex-1"
              style={{
                background: "#90ee90",
                border: "2px solid black",
                borderRadius: "6px",
                minWidth: 100,
                height: 28,
              }}
            >
              <span className="text-black font-bold px-1 py-0.5 text-[12px] text-center w-full">
                Duration:
                <br />
                {getDurationFromTimes(
                  formData.demandTimeFrom || "",
                  formData.demandTimeTo || ""
                ) || "Hours"}
              </span>
            </div>
            <div
              className="flex flex-row items-center justify-center flex-1"
              style={{
                background: "#FFC266",
                border: "2px solid black",
                borderRadius: "6px",
                minWidth: 100,
                height: 28,
              }}
            >
              <span className="text-black font-bold px-1 py-0.5 text-[12px] text-center w-full">
                Type of Block
              </span>
              <select
                name="corridorTypeSelection"
                value={formData.corridorTypeSelection || ""}
                onChange={handleInputChange}
                className="bg-[#FFC266] border-0 text-black font-bold text-[12px] px-1 py-0.5 focus:outline-none w-full"
                style={{
                  minWidth: 50,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.2rem",
                }}
                required
              >
                <option value="">Select</option>
                <option value="Corridor Block">Corridor Block</option>
                <option value="Non-Corridor Block">Non-Corridor Block</option>
                <option value="Urgent Block">Urgent Block</option>
                <option value="Mega Block">Mega Block</option>
              </select>
              {renderError("corridorTypeSelection")}
            </div>
          </div>
          {/* If not Corridor Block, show reason box (compact) */}
          {formData.corridorTypeSelection &&
            !["Corridor Block", "Corridor"].includes(
              formData.corridorTypeSelection
            ) && (
              <div className="w-full mt-1">
                <textarea
                  name="remarks"
                  value={formData.remarks || ""}
                  onChange={handleInputChange}
                  placeholder="Reasons for asking Block outside Corridor or Emergency Block"
                  className="w-full bg-white border-2 border-black rounded px-2 py-1 text-[13px] font-bold text-black focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-black"
                  style={{
                    minHeight: "32px",
                    fontSize: "13px",
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                  required
                />
                {renderError("remarks")}
              </div>
            )}
          {/* Type of Work and Activity dropdowns, compact style with heading as placeholder */}
          <div className="w-full flex flex-col gap-1 mt-1">
            <div className="flex flex-row w-full gap-0">
              <div
                className="flex-1 flex items-center"
                style={{
                  background: "#b6f7c6",
                  border: "2px solid black",
                  borderRight: 0,
                  height: 28,
                }}
              >
                <span className="text-black font-bold px-1 text-[13px]">
                  Type of Work
                </span>
              </div>
              <div
                className="flex-1"
                style={{
                  background: "#b6f7c6",
                  border: "2px solid black",
                  borderLeft: 0,
                  height: 28,
                }}
              >
                <select
                  name="workType"
                  value={formData.workType || ""}
                  onChange={handleInputChange}
                  className="w-full bg-[#b6f7c6] border-0 text-black font-bold text-[13px] px-1 py-0.5 focus:outline-none"
                  style={{
                    height: 24,
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.2rem",
                  }}
                  required
                >
                  <option value="" disabled>
                    Type of Work
                  </option>
                  {workTypeOptions.map((type: string) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {renderError("workType")}
              </div>
            </div>
            <div className="flex flex-row w-full gap-0">
              <div
                className="flex-1 flex items-center"
                style={{
                  background: "#b6f7c6",
                  border: "2px solid black",
                  borderRight: 0,
                  height: 28,
                }}
              >
                <span className="text-black font-bold px-1 text-[13px]">
                  Activity
                </span>
              </div>
              <div
                className="flex-1"
                style={{
                  background: "#b6f7c6",
                  border: "2px solid black",
                  borderLeft: 0,
                  height: 28,
                }}
              >
                <select
                  name="activity"
                  value={formData.activity || ""}
                  onChange={handleInputChange}
                  className="w-full bg-[#b6f7c6] border-0 text-black font-bold text-[13px] px-1 py-0.5 focus:outline-none"
                  style={{
                    height: 24,
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.2rem",
                  }}
                  required
                >
                  <option value="" disabled>
                    Activity
                  </option>
                  {activityOptions.map((activity: string) => (
                    <option key={activity} value={activity}>
                      {activity}
                    </option>
                  ))}
                </select>
                {renderError("activity")}
              </div>
            </div>
          </div>
          {/* Fresh Caution Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[15px]">
                Whether Fresh Caution will be imposed after block
              </span>
              <select
                name="freshCautionRequired"
                value={formData.freshCautionRequired ? "Y" : "N"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    freshCautionRequired: e.target.value === "Y",
                  })
                }
                className="ml-2 border-2 border-black rounded px-2 py-0.5 text-[13px] font-bold bg-white text-black placeholder-black"
                style={{
                  width: 40,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.2rem",
                }}
              >
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
              {renderError("freshCautionRequired")}
            </div>
            {formData.freshCautionRequired && (
              <div
                className="flex flex-row flex-wrap gap-1 bg-[#fffbe9] border-2 border-[#b71c1c] rounded items-center p-1"
                style={{ fontSize: "13px", fontWeight: "bold" }}
              >
                <input
                  name="freshCautionLocationFrom"
                  value={formData.freshCautionLocationFrom || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <span className="px-1">to</span>
                <input
                  name="freshCautionLocationTo"
                  value={formData.freshCautionLocationTo || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <input
                  name="adjacentLinesAffected"
                  value={formData.adjacentLinesAffected || ""}
                  onChange={handleInputChange}
                  placeholder="UP/DN/SL/Road No."
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-28 text-[13px]"
                />
                <input
                  type="number"
                  name="freshCautionSpeed"
                  value={formData.freshCautionSpeed || ""}
                  onChange={handleInputChange}
                  placeholder="Speed"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                {renderError("freshCautionSpeed")}
              </div>
            )}
          </div>
          {/* Power Block Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[15px]">
                Whether Power Block also needed:
              </span>
              <select
                name="powerBlockRequired"
                value={formData.powerBlockRequired ? "Y" : "N"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    powerBlockRequired: e.target.value === "Y",
                  })
                }
                className="ml-2 border-2 border-black rounded px-2 py-0.5 text-[13px] font-bold bg-white text-black placeholder-black"
                style={{
                  width: 40,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.2rem",
                }}
              >
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
              {renderError("powerBlockRequired")}
            </div>
            {formData.powerBlockRequired && (
              <div
                className="flex flex-row flex-wrap gap-1 bg-[#fffbe9] border-2 border-[#b71c1c] rounded items-center p-1"
                style={{ fontSize: "13px", fontWeight: "bold" }}
              >
                <input
                  name="powerBlockKmFrom"
                  value={formData.powerBlockKmFrom || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <span className="px-1">to</span>
                <input
                  name="powerBlockKmTo"
                  value={formData.powerBlockKmTo || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <input
                  name="powerBlockRoad"
                  value={formData.powerBlockRoad || ""}
                  onChange={handleInputChange}
                  placeholder="UP/DN/Road No."
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-28 text-[13px]"
                />
              </div>
            )}
          </div>
          {/* S&T Disconnection Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[15px]">
                Whether S&T Disconnection also required:
              </span>
              <select
                name="sntDisconnectionRequired"
                value={formData.sntDisconnectionRequired ? "Y" : "N"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sntDisconnectionRequired: e.target.value === "Y",
                  })
                }
                className="ml-2 border-2 border-black rounded px-2 py-0.5 text-[13px] font-bold bg-white text-black placeholder-black"
                style={{
                  width: 40,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 12L16 20L24 12' stroke='black' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1.2rem",
                }}
              >
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
              {renderError("sntDisconnectionRequired")}
            </div>
            {formData.sntDisconnectionRequired && (
              <div
                className="flex flex-row flex-wrap gap-1 bg-[#fffbe9] border-2 border-[#b71c1c] rounded items-center p-1"
                style={{ fontSize: "13px", fontWeight: "bold" }}
              >
                <input
                  name="sntDisconnectionLineFrom"
                  value={formData.sntDisconnectionLineFrom || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <span className="px-1">to</span>
                <input
                  name="sntDisconnectionLineTo"
                  value={formData.sntDisconnectionLineTo || ""}
                  onChange={handleInputChange}
                  placeholder="KM"
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                />
                <input
                  name="sntDisconnectionPointNo"
                  value={formData.sntDisconnectionPointNo || ""}
                  onChange={handleInputChange}
                  placeholder="Point No."
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-16 text-[13px]"
                />
                <input
                  name="sntDisconnectionSignalNo"
                  value={formData.sntDisconnectionSignalNo || ""}
                  onChange={handleInputChange}
                  placeholder="Signal No."
                  className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-16 text-[13px]"
                />
              </div>
            )}
          </div>
          {/* Remarks and Action Buttons */}
          <div className="w-full mt-2 flex flex-col gap-2">
            <textarea
              name="remarks"
              value={formData.remarks || ""}
              onChange={handleInputChange}
              placeholder="Remarks, if any"
              className="w-full bg-[#f7d6f7] border-2 border-black rounded px-2 py-2 text-[16px] font-bold text-black focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-black"
              style={{ minHeight: "36px", fontSize: "16px" }}
            />
            <div className="flex flex-row items-center gap-2 mt-2">
              <button
                type="button"
                className="flex items-center gap-1 bg-lime-300 border-2 border-black rounded px-3 py-2 text-lg font-bold text-black hover:bg-lime-200"
                onClick={() => router.push("/dashboard")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 32 32"
                  stroke="black"
                  strokeWidth={2}
                  className="w-6 h-6"
                >
                  <rect
                    x="6"
                    y="12"
                    width="20"
                    height="12"
                    rx="2"
                    fill="#fffbe9"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <path
                    d="M4 14L16 4L28 14"
                    stroke="black"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                Home
              </button>
              <button
                type="button"
                className="flex items-center gap-1 bg-[#dbe6fa] border-2 border-black rounded px-3 py-2 text-lg font-bold text-black hover:bg-[#c7d6f7]"
                onClick={() => {
                  if (reviewMode) {
                    setReviewMode(false); // Exit review mode, keep data
                  } else {
                    router.back();
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="black"
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                >
                  <circle cx="12" cy="12" r="12" fill="#222" />
                  <path
                    d="M14 8l-4 4 4 4"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
              {reviewMode ? (
                <button
                  type="submit"
                  className={`bg-[#eeb8f7] border-2 border-black rounded-full px-6 py-2 text-sm font-extrabold text-white hover:bg-[#e6aee0] ${
                    formSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={formSubmitting}
                  style={{
          width: "150px",
          height: "70px",
          borderRadius: "50%",
          letterSpacing: "1px",
          border: "none",
        }}
                >
                  {formSubmitting ? "SUBMITTING..." : "CLICK TO CONFIRM"}
                </button>
              ) : (
                <button
                  type="submit"
                  className={`bg-[#eeb8f7] border-2 border-black rounded px-6 py-2 text-lg font-extrabold text-white hover:bg-[#e6aee0] ${
                    formSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? "SUBMITTING..." : "SUBMIT"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
