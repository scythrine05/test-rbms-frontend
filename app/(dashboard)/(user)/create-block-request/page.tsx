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
import { useQuery } from "@tanstack/react-query";
import { userRequestService } from "@/app/service/api/user-request";

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
            <div className="flex flex-wrap gap-4 mb-2 text-[13px]">
              <div className="flex-1 min-w-[180px] ">
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
            {formData.nonCorridorReason && (
              <div className="mb-2">
                <b>Reason for Non-Corridor/Urgent Block:</b>{" "}
                {formData.nonCorridorReason}
              </div>
            )}
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

  freshCautions: {
    adjacentLinesAffected: string;
    freshCautionLocationFrom: string;
    freshCautionLocationTo: string;
    freshCautionSpeed: string; // or number if you prefer
  }[];
  powerBlockDisconnectionAssignTo: string;
  sntDisconnectionAssignTo: string;
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
  nonCorridorReason: string;
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
    sntDisconnectionAssignTo: "",
    powerBlockDisconnectionAssignTo: "",
    nonCorridorReason: "",
    freshCautions: [
      {
        adjacentLinesAffected: "",
        freshCautionLocationFrom: "",
        freshCautionLocationTo: "",
        freshCautionSpeed: "",
      },
    ],
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
  const [showPopup, setShowPopup] = useState(false);
  const [popupLink, setPopupLink] = useState("");
  // const selectedDepo = "AJJE";   //temprory fix we need to change it
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
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
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

  const shouldForceUrgentBlock = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(formData.date);
    targetDate.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayDiff === 0 || dayDiff === 1 || dayDiff === 2) {
      return true;
    }
    const isDateInNextWeek = (dateString: string): boolean => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const targetDate = new Date(dateString + "T00:00:00Z");
      targetDate.setUTCHours(0, 0, 0, 0);
      const currentWeekSunday = new Date(today);
      const daysUntilSunday =
        today.getUTCDay() === 0 ? 0 : 7 - today.getUTCDay();
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
    return isDateInNextWeek(formData.date) && isPastThursdayCutoff();
  })();

  useEffect(() => {
    if (
      shouldForceUrgentBlock &&
      formData.corridorTypeSelection !== "Urgent Block"
    ) {
      setFormData((prev) => ({
        ...prev,
        corridorTypeSelection: "Urgent Block",
      }));
    }
  }, [shouldForceUrgentBlock, formData.date]);

  // Add reviewMode state
  const [reviewMode, setReviewMode] = useState(false);






  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // ─── 1. Review‑mode guard ──────────────────────────────────────────────
    if (!reviewMode) {
      setReviewMode(true);
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    setFormSubmitting(true);
    setFormError(null);

    try {
      // ─── 2. Fetch existing requests and run block check ──────────────────
      const existing = await userRequestService.getUserRequests(1, 100);
      const requests: any[] = Array.isArray(existing?.data.requests) ? existing.data.requests : [];
      const now = Date.now();

      let hasUnavailedSanctionedBlock = false;

      for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        if (
          req?.isSanctioned === true &&         // sanctioned
          req?.availedResponse === null &&      // not availed
          req?.sanctionedTimeFrom               // has date
        ) {
          const sanctionMs = new Date(req.sanctionedTimeFrom).getTime();
          if (!Number.isNaN(sanctionMs) && now >= sanctionMs) {
            // sanction start time is in the past (covers >24 h automatically)
            hasUnavailedSanctionedBlock = true;
            break;
          }
        }
      }

      if (hasUnavailedSanctionedBlock) {
        const link = `https://mobile-bms.plattrtechstudio.com/?cugNumber=${session?.user?.phone}&section=${formData.missionBlock || "MAS-GDR"}`;
        setPopupLink(link);
        setShowPopup(true);
        setFormSubmitting(false);
        return;
      }

      // ─── 3. Client‑side validation ───────────────────────────────────────
      const validation = handleFormValidation();
      if (!validation.isValid) {
        setErrors(validation.errors);
        scrollToFirstError(validation.errors);
        setFormSubmitting(false);
        return;
      }

      // ─── 4. Prepare processedLineSections ────────────────────────────────
      const validSecs = (formData.processedLineSections || []).filter((s) =>
        blockSectionValue.includes(s.block)
      );

      const processedSections = validSecs.map((s) =>
        s.type === "yard"
          ? {
            ...s,
            lineName: s.lineName || "",
            otherLines: s.otherLines || "",
            stream: s.stream || "",
            road: s.road || "",
            otherRoads: s.otherRoads || "",
          }
          : {
            ...s,
            lineName: s.lineName || "",
            otherLines: s.otherLines || "",
            stream: "",
            road: "",
            otherRoads: "",
          }
      );

      // ─── 5. Flatten first fresh‑caution (backend still expects single set)
      const firstCaution = formData.freshCautions?.[0] || {
        freshCautionLocationFrom: "",
        freshCautionLocationTo: "",
        adjacentLinesAffected: "",
        freshCautionSpeed: 0,
      };

      // ─── 6. Build payload ────────────────────────────────────────────────
      const submitData: UserRequestInput = {
        ...formData,
        corridorType: formData.corridorTypeSelection,
        sntDisconnectionRequired: formData.sntDisconnectionRequired ?? false,
        powerBlockRequired: formData.powerBlockRequired ?? false,
        freshCautionRequired: formData.freshCautionRequired ?? false,
        adjacentLinesAffected: formData.freshCautions.map(c => c.adjacentLinesAffected).filter(Boolean).join(","),
        freshCautionLocationFrom: formData.freshCautions.map(c => c.freshCautionLocationFrom).filter(Boolean).join(","),
        freshCautionLocationTo: formData.freshCautions.map(c => c.freshCautionLocationTo).filter(Boolean).join(","),
        freshCautionSpeed: Number(formData.freshCautions[0]?.freshCautionSpeed) || 0,
        date: formatDateToISO(formData.date || ""),
        demandTimeFrom: formatTimeToDatetime(formData.date || "", formData.demandTimeFrom || ""),
        demandTimeTo: formatTimeToDatetime(formData.date || "", formData.demandTimeTo || ""),
        processedLineSections: processedSections,
        adminAcceptance: false,
        selectedDepo: formData.selectedDepo,
      };

      // ─── 7. Submit to backend ────────────────────────────────────────────
      const response = await mutation.mutateAsync(submitData);

      if (response) {
        toast.success("Block request submitted successfully!");
        setSubmittedSummary({
          date: submitData.date,
          id: response.data?.divisionId || response.data?.id,
          blockSection: submitData.missionBlock || "-",
          lineOrRoad:
            submitData.processedLineSections?.map((s) => s.lineName || s.road).join(", ") || "-",
          duration: getDurationFromTimes(formData.demandTimeFrom || "", formData.demandTimeTo || "") || "-",
        });

        // Reset form + UI
        setFormData(initialFormData);
        setBlockSectionValue([]);
        setProcessedLineSections([]);
        setSelectedActivities([]);
        setCustomActivity("");
        setErrors({});
        setShowSuccessPage(true);
        setReviewMode(false);
      }
    } catch (err: any) {
      console.error("Form submission error:", err);
      setFormError(err.message || "Submission failed.");
      toast.error(err.message || "Failed to submit block request");
    } finally {
      setFormSubmitting(false);
    }
  };



  // Refactor handleSubmit to work with reviewMode
  //   const handleFormSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     if (!reviewMode) {
  //       setReviewMode(true); // Enter review mode
  //       return;
  //     }
  //     // Only submit in review mode
  //     setFormSubmitting(true);
  //     setFormError(null);
  //     try {
  //       const validationResult = handleFormValidation();
  //       if (!validationResult.isValid) {
  //         setErrors(validationResult.errors);
  //         scrollToFirstError(validationResult.errors);
  //         setFormSubmitting(false);
  //         return;
  //       }
  //       const validProcessedSections = (
  //         formData.processedLineSections || []
  //       ).filter((section) => blockSectionValue.includes(section.block));
  //       const processedSectionsWithDefaults = validProcessedSections.map(
  //         (section) => {
  //           if (section.type === "yard") {
  //             return {
  //               ...section,
  //               lineName: section.lineName || "",
  //               otherLines: section.otherLines || "",
  //               stream: section.stream || "",
  //               road: section.road || "",
  //               otherRoads: section.otherRoads || "",
  //             };
  //           } else {
  //             return {
  //               ...section,
  //               lineName: section.lineName || "",
  //               otherLines: section.otherLines || "",
  //               stream: "",
  //               road: "",
  //               otherRoads: "",
  //             };
  //           }
  //         }
  //       );
  // //       const firstCaution = formData.freshCautions[0] || {
  // //   freshCautionLocationFrom: "",
  // //   freshCautionLocationTo: "",
  // //   adjacentLinesAffected: "",
  // //   freshCautionSpeed: 0,
  // // };
  //       const submitData: UserRequestInput = {
  //         ...formData,
  //         corridorType: formData.corridorTypeSelection,
  //         sntDisconnectionRequired: formData.sntDisconnectionRequired ?? false,
  //         powerBlockRequired: formData.powerBlockRequired ?? false,
  //         freshCautionRequired: formData.freshCautionRequired ?? false,
  //          adjacentLinesAffected: formData.freshCautions.map(c => c.adjacentLinesAffected).filter(Boolean).join(","),
  //   freshCautionLocationFrom: formData.freshCautions.map(c => c.freshCautionLocationFrom).filter(Boolean).join(","),
  //   freshCautionLocationTo: formData.freshCautions.map(c => c.freshCautionLocationTo).filter(Boolean).join(","),
  //   freshCautionSpeed: Number(formData.freshCautions[0]?.freshCautionSpeed) || 0,
  //         date: formatDateToISO(formData.date || ""),
  //         demandTimeFrom: formatTimeToDatetime(
  //           formData.date || "",
  //           formData.demandTimeFrom || ""
  //         ),
  //         demandTimeTo: formatTimeToDatetime(
  //           formData.date || "",
  //           formData.demandTimeTo || ""
  //         ),
  //         processedLineSections: processedSectionsWithDefaults,
  //         adminAcceptance: false,
  //         selectedDepo: formData.selectedDepo,
  //       };
  //       const response = await mutation.mutateAsync(submitData);
  //       if (response) {
  //         toast.success("Block request submitted successfully!");
  //         setSubmittedSummary({
  //           date: submitData.date,
  //           id: response.data?.divisionId || response.data?.id,
  //           blockSection: submitData.missionBlock || "-",
  //           lineOrRoad:
  //             submitData.processedLineSections &&
  //             submitData.processedLineSections.length > 0
  //               ? submitData.processedLineSections
  //                   .map((s: any) => s.lineName || s.road)
  //                   .join(", ")
  //               : "-",
  //           duration:
  //             getDurationFromTimes(
  //               formData.demandTimeFrom || "",
  //               formData.demandTimeTo || ""
  //             ) || "-",
  //         });
  //         setFormData(initialFormData);
  //         setBlockSectionValue([]);
  //         setProcessedLineSections([]);
  //         setSelectedActivities([]);
  //         setCustomActivity("");
  //         setErrors({});
  //         setShowSuccessPage(true);
  //         setReviewMode(false);
  //       }
  //     } catch (error: any) {
  //       console.error("Form submission error:", error);
  //       if (error.response) {
  //         console.error("Error response data:", error.response.data);
  //         console.error("Error response status:", error.response.status);
  //         console.error("Error response headers:", error.response.headers);
  //       }
  //       setFormError(
  //         error.message ||
  //           "An error occurred while submitting the form. Please try again."
  //       );
  //       toast.error(error.message || "Failed to submit block request");
  //     } finally {
  //       setFormSubmitting(false);
  //     }
  //   };

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
      if (!formData.nonCorridorReason)
        errors.nonCorridorReason = "Reason is required";
    }

    // Urgent Block validations
    if (formData.corridorTypeSelection === "Urgent Block") {
      if (formData.freshCautionRequired) {
        formData.freshCautions.forEach((c, i) => {
          if (!c.freshCautionSpeed)
            errors[`freshCautions-${i}-speed`] = "Speed required";
          if (!c.freshCautionLocationFrom)
            errors[`freshCautions-${i}-from`] = "KM From required";
          if (!c.freshCautionLocationTo)
            errors[`freshCautions-${i}-to`] = "KM To required";
          if (!c.adjacentLinesAffected)
            errors[`freshCautions-${i}-adj`] = "Direction/Road required";
        });
      }
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
  /** ────────────────────────────────
   *  Fresh Caution helpers
   *  ────────────────────────────────*/
  const handleFreshCautionChange = <
    K extends keyof FormData["freshCautions"][number]
  >(
    index: number,
    field: K,
    value: FormData["freshCautions"][number][K]
  ) => {
    setFormData(prev => {
      const updated = [...prev.freshCautions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, freshCautions: updated };
    });
  };

  const addFreshCaution = () => {
    setFormData(prev => ({
      ...prev,
      freshCautions: [
        ...prev.freshCautions,
        {
          adjacentLinesAffected: "",
          freshCautionLocationFrom: "",
          freshCautionLocationTo: "",
          freshCautionSpeed: "",
        },
      ],
    }));
  };

  const removeFreshCaution = (index: number) => {
    setFormData(prev => ({
      ...prev,
      freshCautions: prev.freshCautions.filter((_, i) => i !== index),
    }));
  };

  const getInputClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
      }`;
  };

  const getSelectClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg font-bold bg-white focus:outline-none focus:ring-2 focus:ring-green-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
      }`;
  };

  const getTextareaClassName = (fieldName: string) => {
    return `w-full border-2 rounded-lg px-4 py-2 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-black placeholder-black text-xs px-2 py-1 ${errors[fieldName] ? "border-red-600 ring-2 ring-red-300" : "border-black"
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

  // Handle date change and corridor type selection logic
  useEffect(() => {
    if (!formData.date) {
      setIsDisabled(true);
      setFormData({
        ...formData,
        corridorTypeSelection: null,
      });
    } else {
      // Calculate if the date is today, tomorrow, or day after tomorrow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(formData.date);
      targetDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (dayDiff === 0 || dayDiff === 1 || dayDiff === 2) {
        setIsDisabled(true);
        setFormData({
          ...formData,
          corridorTypeSelection: "Urgent Block",
        });
      } else {
        // Existing restrictions (keep as before)
        const { urgentOnly, urgentAllowed } = getCorridorTypeRestrictions(
          formData.date
        );
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
        // Update existing section
        const section = existingProcessedSections[sectionIndex];
        if (section.type === "yard") {
          // Split the value into road and otherRoads
          const roads = value
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean);
          const updatedSection = {
            ...section,
            road: roads[0] || "", // First item is road
            otherRoads: roads.length > 1 ? roads.slice(1).join(",") : "", // Rest are otherRoads
          };
          existingProcessedSections[sectionIndex] = updatedSection;
        }
      } else {
        // Create new section
        const roads = value
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
        existingProcessedSections.push({
          block,
          type: "yard",
          lineName: "",
          otherLines: "",
          stream: "",
          road: roads[0] || "", // First item is road
          otherRoads: roads.length > 1 ? roads.slice(1).join(",") : "", // Rest are otherRoads
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
  // useEffect(() => {
  //   if (!corridorData.length || !blockSectionValue.length) {
  //     setCorridorTime(null);
  //     return;
  //   }
  //   // For each selected block section, get the first selected line
  //   const firstLines = blockSectionValue.map((block: string) => {
  //     const sectionEntry =
  //       (formData.processedLineSections || []).find(
  //         (s: any) => s.block === block
  //       ) || {};
  //     return (sectionEntry as any).lineName
  //       ? (sectionEntry as any).lineName.split(",")[0]
  //       : null;
  //   });
  //   // Only consider block sections with a selected line
  //   const validPairs = blockSectionValue
  //     .map((block: string, idx: number) => {
  //       const line = firstLines[idx];
  //       if (!line) return null;
  //       // Find matching corridor row
  //       const row = corridorData.find((row: any) => {
  //         return (
  //           (row["Section/ station"] || row["section"])?.trim() === block &&
  //           (row["Line"] || "").trim() === line
  //         );
  //       });
  //       return row || null;
  //     })
  //     .filter(Boolean);
  //   if (!validPairs.length) {
  //     setCorridorTime(null);
  //     return;
  //   }
  //   // Find intersection of corridor times (latest from, earliest to)
  //   let fromTimes = validPairs.map((row: any) => row["From"]);
  //   let toTimes = validPairs.map((row: any) => row["To"]);
  //   let duration = validPairs[0]["Duration"];
  //   // Use max of fromTimes and min of toTimes
  //   const maxFrom = fromTimes.reduce((a, b) => (a > b ? a : b));
  //   const minTo = toTimes.reduce((a, b) => (a < b ? a : b));
  //   setCorridorTime({ from: maxFrom, to: minTo, duration });
  // }, [corridorData, blockSectionValue, formData.processedLineSections]);
  // useEffect(() => {
  //   if (!blockSectionValue.length) {
  //     setCorridorTime(null);
  //     return;
  //   }

  //   /* ---------- 1.  LINE‑BASED LOGIC (UNCHANGED) ---------- */
  //   const linePairs = blockSectionValue
  //     .map((block: string) => {
  //       // look up the entry for this block
  //       const sectionEntry =
  //         (formData.processedLineSections || []).find(
  //           (s: any) => s.block === block
  //         ) || {};

  //       // first line chosen (if any)
  //       const firstLine = sectionEntry?.lineName
  //         ? sectionEntry.lineName.split(",")[0]
  //         : null;

  //       // if no line chosen for this block, skip – road logic will handle it
  //       if (!firstLine) return null;

  //       // find matching row in corridorData
  //       const row = corridorData.find((r: any) => {
  //         return (
  //           (r["Section/ station"] || r["section"])?.trim() === block &&
  //           (r["Line"] || "").trim() === firstLine
  //         );
  //       });

  //       return row || null;
  //     })
  //     .filter(Boolean); // removes nulls

  //   /* ---------- 2.  YARD / ROAD LOGIC (FOR BLOCKS WITH NO LINE) ---------- */

  //   const roadTimeMap: Record<string, { from: string; to: string }> = {
  //     "AJJ-RU-Up": { from: "01:30", to: "04:30" },
  //     "AJJ-RU-Down": { from: "00:30", to: "03:30" },
  //     "AJJ-RU-Both": { from: "01:30", to: "04:30" },

  //     "MAS-AJJ-Up": { from: "00:05", to: "03:05" },
  //     "MAS-AJJ-Down": { from: "00:30", to: "03:30" },
  //     "MAS-AJJ-Both": { from: "00:05", to: "03:05" },

  //     "AJJ-KPD-Up": { from: "21:15", to: "00:15" },
  //     "AJJ-KPD-Down": { from: "11:00", to: "14:00" },
  //     "AJJ-KPD-Both": { from: "21:15", to: "00:15" },

  //     "KPD-JTJ-Up": { from: "22:30", to: "00:45" },
  //     "KPD-JTJ-Down": { from: "12:45", to: "15:15" },
  //     "KPD-JTJ-Both": { from: "22:30", to: "00:45" },

  //     "AJJ-CGL-Up": { from: "01:00", to: "04:00" },
  //     "AJJ-CGL-Down": { from: "01:00", to: "04:00" },
  //     "AJJ-CGL-Both": { from: "01:00", to: "04:00" },

  //     "MAS-GDR-Up": { from: "00:20", to: "03:20" },
  //     "MAS-GDR-Down": { from: "23:30", to: "01:30" },
  //     "MAS-GDR-Both": { from: "00:20", to: "03:20" },

  //     "MSB-VM-Up": { from: "21:15", to: "00:15" },
  //     "MSB-VM-Down": { from: "01:30", to: "04:30" },
  //     "MSB-VM-Both": { from: "21:15", to: "00:15" },

  //     "MSB-VLCY-Up": { from: "00:30", to: "03:30" },
  //     "MSB-VLCY-Down": { from: "00:30", to: "03:30" },
  //     "MSB-VLCY-Both": { from: "00:30", to: "03:30" },
  //   };

  //   const roadPairs = blockSectionValue
  //     .map((block: string) => {
  //       // if a line was already chosen for this block, skip (line logic handled it)
  //       const hadLine =
  //         (formData.processedLineSections || []).some(
  //           (s: any) => s.block === block && s.lineName
  //         );
  //       if (hadLine) return null;

  //       // road logic starts here …
  //       const sectionEntry =
  //         (formData.processedLineSections || []).find(
  //           (s: any) => s.block === block
  //         ) || {};
  //       if (!sectionEntry.road) return null;

  //       const roads = sectionEntry.road
  //         .split(",")
  //         .map((r: string) => r.trim().toLowerCase());

  //       const streamEntry = streamData[block];
  //       const majorSection = formData.selectedSection;
  //       if (!streamEntry || !majorSection) return null;

  //       const checkDirection = (dir: "Up" | "Down" | "Both") =>
  //         roads.some((r: string) =>
  //           (streamEntry[`${dir} Direction Affected`] || [])
  //             .map((x: string) => x.trim().toLowerCase())
  //             .includes(r)
  //         );

  //       const dirs = ["Both", "Up", "Down"] as const;
  //       for (const dir of dirs) {
  //         if (checkDirection(dir)) {
  //           const time = roadTimeMap[`${majorSection}-${dir}`];
  //           if (time) return { from: time.from, to: time.to };
  //         }
  //       }
  //       return null;
  //     })
  //     .filter(Boolean);

  //   /* ---------- 3.  COMBINE BOTH RESULTS ---------- */

  //   // nothing found in either? → clear the state
  //   if (!linePairs.length && !roadPairs.length) {
  //     setCorridorTime(null);
  //     return;
  //   }

  //   // gather all times from lines + roads
  //   const fromTimes = [
  //     ...linePairs.map((p: any) => p["From"]),
  //     ...roadPairs.map((p: any) => p.from),
  //   ];
  //   const toTimes = [
  //     ...linePairs.map((p: any) => p["To"]),
  //     ...roadPairs.map((p: any) => p.to),
  //   ];

  //   const maxFrom = fromTimes.reduce((a, b) => (a > b ? a : b));
  //   const minTo = toTimes.reduce((a, b) => (a < b ? a : b));

  //   // duration only exists on line rows – take the first one if any
  //   const duration =
  //     linePairs.length > 0 ? (linePairs[0] as any)["Duration"] : undefined;

  //   setCorridorTime({ from: maxFrom, to: minTo, duration });
  // }, [
  //   corridorData,
  //   blockSectionValue,
  //   formData.processedLineSections,
  //   formData.selectedSection,
  // ]);
  useEffect(() => {
    if (!blockSectionValue.length) {
      setCorridorTime(null);
      return;
    }

    /* ---------- 1.  LINE‑BASED LOGIC (UNCHANGED) ---------- */
    const linePairs = blockSectionValue
      .map((block: string) => {
        const sectionEntry = (formData.processedLineSections || []).find(
          (s: { block: string; lineName?: string }) => s.block === block
        ) as { block: string; lineName?: string };

        const firstLine = sectionEntry?.lineName
          ? sectionEntry.lineName.split(",")[0]
          : null;

        if (!firstLine) return null;
        const row = corridorData.find((r: { [key: string]: string }) => {
          return (
            (r["Section/ station"] || r["section"])?.trim() === block &&
            (r["Line"] || "").trim() === firstLine
          );
        });

        return row || null;
      })
      .filter(Boolean) as Array<{ [key: string]: string }>; // removes nulls and asserts type

    /* ---------- 2.  YARD / ROAD LOGIC (FOR BLOCKS WITH NO LINE) ---------- */

    const roadTimeMap: Record<string, { from: string; to: string }> = {
      "AJJ-RU-Up": { from: "01:30", to: "04:30" },
      "AJJ-RU-Down": { from: "00:30", to: "03:30" },
      "AJJ-RU-Both": { from: "01:30", to: "04:30" },

      "MAS-AJJ-Up": { from: "00:05", to: "03:05" },
      "MAS-AJJ-Down": { from: "00:30", to: "03:30" },
      "MAS-AJJ-Both": { from: "00:05", to: "03:05" },

      "AJJ-KPD-Up": { from: "21:15", to: "00:15" },
      "AJJ-KPD-Down": { from: "11:00", to: "14:00" },
      "AJJ-KPD-Both": { from: "21:15", to: "00:15" },

      "KPD-JTJ-Up": { from: "22:30", to: "00:45" },
      "KPD-JTJ-Down": { from: "12:45", to: "15:15" },
      "KPD-JTJ-Both": { from: "22:30", to: "00:45" },

      "AJJ-CGL-Up": { from: "01:00", to: "04:00" },
      "AJJ-CGL-Down": { from: "01:00", to: "04:00" },
      "AJJ-CGL-Both": { from: "01:00", to: "04:00" },

      "MAS-GDR-Up": { from: "00:20", to: "03:20" },
      "MAS-GDR-Down": { from: "23:30", to: "01:30" },
      "MAS-GDR-Both": { from: "00:20", to: "03:20" },

      "MSB-VM-Up": { from: "21:15", to: "00:15" },
      "MSB-VM-Down": { from: "01:30", to: "04:30" },
      "MSB-VM-Both": { from: "21:15", to: "00:15" },

      "MSB-VLCY-Up": { from: "00:30", to: "03:30" },
      "MSB-VLCY-Down": { from: "00:30", to: "03:30" },
      "MSB-VLCY-Both": { from: "00:30", to: "03:30" },
    };

    const roadPairs = blockSectionValue
      .map((block: string) => {
        // if a line was already chosen for this block, skip (line logic handled it)
        const hadLine = (formData.processedLineSections || []).some(
          (s: { block: string; lineName?: string }) =>
            s.block === block && s.lineName
        );
        if (hadLine) return null;

        // road logic starts here …
        const sectionEntry = (formData.processedLineSections || []).find(
          (s: { block: string; road?: string }) => s.block === block
        );

        if (!sectionEntry?.road) return null;

        const roads = sectionEntry.road
          .split(",")
          .map((r: string) => r.trim().toLowerCase());

        const streamEntry = streamData[block as keyof typeof streamData];
        const majorSection = formData.selectedSection;
        if (!streamEntry || !majorSection) return null;

        const checkDirection = (dir: "Up" | "Down" | "Both") =>
          roads.some((r: string) =>
            ((streamEntry as any)[`${dir} Direction Affected`] || [])
              .map((x: string) => x.trim().toLowerCase())
              .includes(r)
          );

        const dirs = ["Both", "Up", "Down"] as const;
        for (const dir of dirs) {
          if (checkDirection(dir)) {
            const time = roadTimeMap[`${majorSection}-${dir}`];
            if (time) return { from: time.from, to: time.to };
          }
        }
        return null;
      })
      .filter(Boolean) as Array<{ from: string; to: string }>; // removes nulls and asserts type

    /* ---------- 3.  COMBINE BOTH RESULTS ---------- */

    // nothing found in either? → clear the state
    if (!linePairs.length && !roadPairs.length) {
      setCorridorTime(null);
      return;
    }

    // gather all times from lines + roads
    const fromTimes = [
      ...linePairs.map((p) => p["From"]),
      ...roadPairs.map((p) => p.from),
    ].filter((t): t is string => !!t); // ensure all times are strings

    const toTimes = [
      ...linePairs.map((p) => p["To"]),
      ...roadPairs.map((p) => p.to),
    ].filter((t): t is string => !!t); // ensure all times are strings

    if (!fromTimes.length || !toTimes.length) {
      setCorridorTime(null);
      return;
    }

    const maxFrom = fromTimes.reduce((a, b) => (a > b ? a : b));
    const minTo = toTimes.reduce((a, b) => (a < b ? a : b));

    // duration only exists on line rows – take the first one if any
    const duration = linePairs[0]?.["Duration"];

    setCorridorTime({ from: maxFrom, to: minTo, duration });
  }, [
    corridorData,
    blockSectionValue,
    formData.processedLineSections,
    formData.selectedSection,
    streamData,
    setCorridorTime,
  ]);

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
            <span className="text-[24px] font-extrabold text-[#b07be0]">
              RBMS-MAS-DIVN
            </span>
          </div>
          <div className="bg-[#fffaf0] rounded-b-2xl p-4 sm:p-6 w-full max-w-2xl overflow-auto">
            <div className="bg-[#c6e6f7] rounded-xl p-4 mb-6 w-full overflow-auto">
              <h2 className="text-[24px] font-extrabold mb-4 text-[#222]">
                Your Block Request has been Registered
              </h2>
              <table className="w-full mb-2 border rounded-xl overflow-hidden shadow-md">
                <tbody>
                  {/* Date Row */}
                  <tr className="bg-white border-b hover:bg-[#f7f7fa]">
                    <td className="px-2 py-1 border-t border-b-0 border-l-0 border-r-0">
                      <div className="font-bold text-black text-[20px]">
                        Date
                      </div>
                      <div className="text-black text-[20px]">
                        {submittedSummary?.date
                          ? new Date(submittedSummary.date).toLocaleDateString(
                              "en-GB",
                              {
                                year: "2-digit",
                                month: "2-digit",
                                day: "2-digit",
                              }
                            )
                          : "-"}
                      </div>
                    </td>
                  </tr>

                  {/* ID Row */}
                  <tr className="bg-white border-b hover:bg-[#f7f7fa]">
                    <td className="px-2 py-1 border-t border-b-0 border-l-0 border-r-0">
                      <div className="font-bold text-black text-[20px]">ID</div>
                      <div className="text-black text-[20px]">
                        {submittedSummary?.id || "-"}
                      </div>
                    </td>
                  </tr>

                  {/* Block Section Row */}
                  <tr className="bg-white border-b hover:bg-[#f7f7fa]">
                    <td className="px-2 py-1 border-t border-b-0 border-l-0 border-r-0">
                      <div className="font-bold text-black text-[20px]">
                        Block Section
                      </div>
                      <div className="text-black text-[20px]">
                        {submittedSummary?.blockSection || "-"}
                      </div>
                    </td>
                  </tr>

                  {/* Line Row */}
                  <tr className="bg-white border-b hover:bg-[#f7f7fa]">
                    <td className="px-2 py-1 border-t border-b-0 border-l-0 border-r-0">
                      <div className="font-bold text-black text-[20px]">
                        Line
                      </div>
                      <div className="text-black text-[20px]">
                        {submittedSummary?.lineOrRoad || "-"}
                      </div>
                    </td>
                  </tr>

                  {/* Demanded Row */}
                  <tr className="bg-white hover:bg-[#f7f7fa]">
                    <td className="px-2 py-1 border-t border-b-0 border-l-0 border-r-0">
                      <div className="font-bold text-black text-[20px]">
                        Demanded
                      </div>
                      <div className="text-black text-[20px]">
                        {submittedSummary?.duration || "-"}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-6 items-center mt-8 w-full">
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-[20px] py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => {
                  setFormData(initialFormData);
                  setBlockSectionValue([]);
                  setProcessedLineSections([]);
                  setSelectedActivities([]);
                  setCustomActivity("");
                  setErrors({});
                  setShowSuccessPage(false);
                  setReviewMode(false);
                }}
              >
                ENTER MORE BLOCK REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-[20px] py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push("/edit-request")}
              >
                EDIT OR CANCEL PREVIOUS REQUESTS
              </button>
              <button
                className="w-full rounded-2xl bg-[#e6e6fa] text-black font-bold text-[20px] py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
                onClick={() => router.push("/request-table")}
              >
                SUMMARY OF MY BLOCK REQUESTS
              </button>
              <div className="mt-6">
                <button
                  className="flex items-center gap-2 bg-lime-300 border-2 border-black rounded-lg px-4 py-2 text-[20px] font-bold text-black"
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
              <button
                className="w-full rounded-2xl bg-[#ff5c42] text-white font-bold text-[20px] py-4 tracking-wider border border-[#d43b1a] hover:bg-[#ff7c6a] transition"
                onClick={() => signOut()}
              >
                CLOSE THE APP AND LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#f7fafc] py-0">
      {/* Header */}
      <div className="w-full bg-[#fff9b2] py-6 flex flex-col items-center border-b-2 border-black">
        <span className="text-[48px] font-extrabold tracking-widest" style={{ color: '#b07be0', letterSpacing: '0.08em', fontFamily: 'Arial Black, Arial, sans-serif' }}>RBMS-MAS-DIVN</span>
      </div>
      {/* Sub-header */}
      <div className="w-full bg-[#d6f7c6] py-4 flex flex-col items-center border-b-2 border-black">
        <span className="text-[32px] font-bold text-black" style={{ letterSpacing: '0.04em' }}>Enter New Block Request</span>
      </div>
      {/* Form Card */}
      <div className="w-full max-w-3xl mt-0 p-10 bg-[#c6e6f7] border-4 border-black rounded-3xl shadow-xl mx-3" style={{ minWidth: 350 }}>
        <form onSubmit={handleFormSubmit} className="space-y-10">
          <div className="grid grid-cols-1 gap-y-8 mb-8">
            {/* Date of Block */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 w-full">
              <label className="text-[24px] font-bold text-black min-w-[180px]" htmlFor="date-of-block">
                Date of Block
              </label>
                <div className="flex flex-row items-center gap-4 w-full">
                  <input
                    id="date-of-block"
                    type="date"
                    name="date"
                    value={formData.date || ""}
                    onChange={handleInputChange}
                    className="border-2 border-black rounded-xl px-8 py-4 text-[24px] font-bold bg-[#f7d6f7] text-black shadow-md focus:outline-none focus:ring-2 focus:ring-[#b07be0] min-w-[180px] max-w-[240px]"
                    aria-required="true"
                    aria-label="Select date of block"
                    style={{ boxShadow: '2px 2px 6px #bbb' }}
                    min={getMinDateString()}
                    max={(() => {
                      const today = new Date();
                      today.setDate(today.getDate() + 30);
                      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    })()}
                    placeholder="Select date"
                  />
                {/* Type of Block - compact, right of date */}
                {formData.date && (
                  <div className="flex flex-row items-center gap-2 ml-2">
                  {/* <label className="text-[22px] font-bold text-black mr-2">Type:</label> */}
                  {isDisabled ? (
                    <span className="px-5 py-2 rounded-lg bg-[#f7f7a1] border-2 border-black text-[22px] font-extrabold text-black shadow-sm">U</span>
                  ) : (
                    <div className="flex flex-row gap-2">
                    <button
                      type="button"
                      className={`px-5 py-2 rounded-lg border-2 text-[22px] font-extrabold shadow-sm focus:outline-none transition-all ${formData.corridorTypeSelection === 'Corridor' ? 'bg-[#e6f7c6] border-black text-black' : 'bg-white border-[#b6e6c6] text-[#888]'}`}
                      onClick={() => handleInputChange({ target: { name: 'corridorTypeSelection', value: 'Corridor' } } as any)}
                    >
                      C
                    </button>
                    <button
                      type="button"
                      className={`px-5 py-2 rounded-lg border-2 text-[22px] font-extrabold shadow-sm focus:outline-none transition-all ${formData.corridorTypeSelection === 'Outside Corridor' ? 'bg-[#ffe082] border-black text-black' : 'bg-white border-[#ffe082] text-[#888]'}`}
                      onClick={() => handleInputChange({ target: { name: 'corridorTypeSelection', value: 'Outside Corridor' } } as any)}
                    >
                      NC
                    </button>
                    </div>
                  )}
                  </div>
                )}
                </div>
              {errors.date && (
                <span className="text-[20px] text-[#e07a5f] font-medium mt-2 block">
                  {errors.date}
                </span>
              )}
            </div>
            {/* If not Corridor Block, show reason box (compact) */}
          {formData.corridorTypeSelection &&
            !["Corridor Block", "Corridor"].includes(
              formData.corridorTypeSelection
            ) && (
              <div className="w-full mt-1">
                <textarea
                  name="nonCorridorReason"
                  value={formData.nonCorridorReason || ""}
                  onChange={handleInputChange}
                  placeholder="Reasons for asking Block outside Corridor or Emergency Block"
                  className="w-full bg-white border-2 border-black rounded px-2 py-1 text-[20px] font-bold text-black focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder-black"
                  style={{
                    minHeight: "32px",
                    marginTop: 0,
                    marginBottom: 0,
                  }}
                  required
                />
                {renderError("nonCorridorReason")}
              </div>
            )}
            {/* Major Section Dropdown - compact, no label */}
            <div className="flex flex-row items-center gap-4 w-full mt-2">
              <select
                id="major-section"
                name="selectedSection"
                value={formData.selectedSection || ""}
                onChange={handleInputChange}
                className="border-2 border-black rounded-xl px-8 py-4 text-[24px] font-bold bg-[#e6f7c6] text-black shadow-md focus:outline-none focus:ring-2 focus:ring-[#b6e6c6] min-w-[240px] max-w-[320px]"
                aria-required="true"
                aria-label="Select major section"
                required
                style={{ boxShadow: '2px 2px 6px #bbb' }}
              >
                <option value="" disabled>
                  Select Major Section
                </option>
                {majorSectionOptions.map((section: string) => (
                  <option key={section} value={section} className="text-[22px]">
                    {section}
                  </option>
                ))}
              </select>
              {errors.selectedSection && (
                <span className="text-[20px] text-[#e07a5f] font-medium mt-2 block">
                  {errors.selectedSection}
                </span>
              )}
            </div>
            {/* Block Section/Yard Multi-select - max 2 selections */}
            <div className="flex flex-row items-center gap-4 w-full mt-2">
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
                  const values = selected ? selected.map((opt: any) => opt.value) : [];
                  if (values.length <= 2) {
                    setBlockSectionValue(values);
                    setFormData((prev) => ({
                      ...prev,
                      missionBlock: values.join(","),
                      processedLineSections: (prev.processedLineSections || []).filter((s: any) => values.includes(s.block)),
                    }));
                  }
                }}
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#ffe6b3",
                    borderColor: "black",
                    borderWidth: 2,
                    borderRadius: 12,
                    minHeight: "44px",
                    fontWeight: "bold",
                    fontSize: "22px",
                    boxShadow: "none",
                    padding: "0 2px",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#f6fff6",
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "22px",
                    border: "1.5px solid #b6e6c6",
                    borderRadius: 8,
                    marginRight: 4,
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "22px",
                    padding: "2px 8px",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#e07a5f",
                    ":hover": {
                      backgroundColor: "#f6fff6",
                      color: "#b91c1c",
                    },
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#ffe082"
                      : state.isFocused
                        ? "#ffe08299"
                        : "#ffe6b3",
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "22px",
                    padding: "4px 8px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "22px",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: "black",
                    fontSize: "24px",
                    padding: 0,
                  }),
                }}
                placeholder="Select up to 2 Block Sections/Yards"
                closeMenuOnSelect={false}
                isOptionDisabled={() => blockSectionValue.length >= 2}
              />
              {errors.missionBlock && (
                <span className="text-[20px] text-[#e07a5f] font-medium mt-2 block">
                  {errors.missionBlock}
                </span>
              )}
            </div>
            {/* Lines/Roads Multi-select for each selected block section/yard */}
            {blockSectionValue.map((block: string, idx: number) => {
              const isYard = block.includes("-YD");
              const lineOrRoadOptions = isYard
                ? getAllRoadsForYard(block).map((road: string) => ({
                  value: road,
                  label: road,
                }))
                : (lineData[block as keyof typeof lineData] || []).map(
                  (line: string) => ({
                    value: line,
                    label: line,
                  })
                );
              const sectionEntry: any =
                (formData.processedLineSections || []).find(
                  (s: any) => s.block === block
                ) || {};
              return (
                <div key={block} className="flex flex-col gap-1 w-full mt-2">
                  <span className="text-[20px] font-bold text-black mb-1">Select {isYard ? 'Road(s)' : 'Line(s)'} for <span className="text-[#3a506b]">{block}</span></span>
                  <div className="flex flex-row items-center gap-4 w-full">
                    <Select
                      isMulti
                      name={`lineOrRoad-${block}`}
                      options={lineOrRoadOptions}
                      value={(() => {
                        const selectedValues: { value: string; label: string }[] = [];
                        if (isYard) {
                          if (sectionEntry && typeof sectionEntry.road === 'string' && sectionEntry.road) {
                            selectedValues.push({ value: sectionEntry.road, label: sectionEntry.road });
                          }
                          if (sectionEntry && typeof sectionEntry.otherRoads === 'string' && sectionEntry.otherRoads) {
                            const otherRoadList = sectionEntry.otherRoads
                              .split(",")
                              .map((road: string) => road.trim())
                              .filter(Boolean);
                            selectedValues.push(
                              ...otherRoadList.map((road: string) => ({ value: road, label: road }))
                            );
                          }
                        } else {
                          if (sectionEntry && typeof sectionEntry.lineName === 'string' && sectionEntry.lineName) {
                            selectedValues.push({ value: sectionEntry.lineName, label: sectionEntry.lineName });
                          }
                          if (sectionEntry && typeof sectionEntry.otherLines === 'string' && sectionEntry.otherLines) {
                            const otherLineList = sectionEntry.otherLines
                              .split(",")
                              .map((line: string) => line.trim())
                              .filter(Boolean);
                            selectedValues.push(
                              ...otherLineList.map((line: string) => ({ value: line, label: line }))
                            );
                          }
                        }
                        return selectedValues;
                      })()}
                      onChange={(selected) => {
                        const values = selected ? selected.map((opt: any) => opt.value) : [];
                        if (isYard) {
                          handleRoadSelection(block, values.join(","));
                        } else {
                          handleLineNameSelection(block, values);
                        }
                      }}
                      classNamePrefix="react-select"
                      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: "#e6f7fa",
                          borderColor: "black",
                          borderWidth: 2,
                          borderRadius: 12,
                          minHeight: "44px",
                          fontWeight: "bold",
                          fontSize: "22px",
                          boxShadow: "none",
                          padding: "0 2px",
                        }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                        multiValue: (base) => ({
                          ...base,
                          backgroundColor: isYard ? "#e6f7fa" : "#f6fff6",
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "22px",
                          border: "1.5px solid #b6e6c6",
                          borderRadius: 8,
                          marginRight: 4,
                        }),
                        multiValueLabel: (base) => ({
                          ...base,
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "22px",
                          padding: "2px 8px",
                        }),
                        multiValueRemove: (base) => ({
                          ...base,
                          color: "#e07a5f",
                          ":hover": {
                            backgroundColor: "#f6fff6",
                            color: "#b91c1c",
                          },
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? "#b6e6f7"
                            : state.isFocused
                              ? "#b6e6f799"
                              : "#e6f7fa",
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "22px",
                          padding: "4px 8px",
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: "black",
                          fontWeight: "bold",
                          fontSize: "22px",
                        }),
                        dropdownIndicator: (base) => ({
                          ...base,
                          color: "black",
                          fontSize: "24px",
                          padding: 0,
                        }),
                      }}
                      placeholder={isYard ? "Select Road(s)" : "Select Line(s)"}
                      closeMenuOnSelect={false}
                    />
                    {renderError(`${block}.lineName`)}
                    {renderError(`${block}.road`)}
                    {renderError(`${block}.stream`)}
                  </div>
                </div>
              );
            })}
            {/* Corridor for this section info bar (only once, after all lines/roads selects) */}
            <div className="w-full mt-3 mb-2 px-4 py-2 rounded-lg border-2 border-[#e07a5f] bg-[#ffd6d6] flex flex-col items-center justify-center shadow-sm whitespace-nowrap overflow-x-auto min-w-0" style={{ boxSizing: 'border-box' }}>
              <span className="text-[20px] font-bold text-black text-center mr-4">
                Corridor for this section
              </span>
              <span className="text-[20px] font-bold text-black text-center">
                {corridorTime?.from || '--:--'} 
                  <span className="mx-2">
                    TO
                  </span> 
                {corridorTime?.to || '--:--'}
              </span>
            </div>
            {/* Preferred Slot and Site Location grouped in a box - ALIGNED, PROFESSIONAL, NO OVERFLOW, SINGLE LINE */}
            <div className="w-full mt-1 mb-4 p-6 rounded-2xl border-4 border-[#b6e6c6] bg-[#f7f7a1] flex flex-col gap-4 shadow-lg min-w-0">
              {/* Preferred Slot label */}
              {/* Time selectors and duration row - always single line, scrollable if needed */}
              <div className="flex flex-col flex-nowrap items-center w-full  overflow-x-auto pl-1 border-2 border-black rounded-2xl bg-[#fffbe9]">
              <span className="text-black font-bold text-[20px] mb-1" style={{ lineHeight: '1', marginLeft: '4px' }}>Preferred Slot</span>
                <div className="flex flex-row items-center  gap-x-1 px-2 py-1 min-w-0" style={{ fontSize: '16px' }}>
                  <select
                    name="demandTimeFromHour"
                    value={formData.demandTimeFrom ? formData.demandTimeFrom.split(":")[0] : ""}
                    onChange={(e) => {
                      const hour = e.target.value;
                      const min = formData.demandTimeFrom ? formData.demandTimeFrom.split(":")[1] : "00";
                      handleInputChange({ target: { name: "demandTimeFrom", value: `${hour}:${min}` } } as any);
                    }}
                    className="bg-[#fffbe9] border-2 border-black text-black font-bold text-[16px] px-1 py-0.5 h-8 rounded-lg focus:outline-none appearance-none text-center min-w-[36px]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(24).keys()].map((h) => (
                      <option key={h} value={h.toString().padStart(2, "0")}>{h.toString().padStart(2, "0")}</option>
                    ))}
                  </select>
                  <span className="text-black font-bold text-[16px] px-0.5">:</span>
                  <select
                    name="demandTimeFromMin"
                    value={formData.demandTimeFrom ? formData.demandTimeFrom.split(":")[1] : ""}
                    onChange={(e) => {
                      const min = e.target.value;
                      const hour = formData.demandTimeFrom ? formData.demandTimeFrom.split(":")[0] : "00";
                      handleInputChange({ target: { name: "demandTimeFrom", value: `${hour}:${min}` } } as any);
                    }}
                    className="bg-[#fffbe9] border-2 border-black text-black font-bold text-[16px] px-1 py-0.5 h-8 rounded-lg focus:outline-none appearance-none text-center min-w-[36px]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(12).keys()].map((m) => (
                      <option key={m} value={(m * 5).toString().padStart(2, "0")}>{(m * 5).toString().padStart(2, "0")}</option>
                    ))}
                  </select>
                  <span className="text-black font-bold text-[16px] px-1">TO</span>
                  <select
                    name="demandTimeToHour"
                    value={formData.demandTimeTo ? formData.demandTimeTo.split(":")[0] : ""}
                    onChange={(e) => {
                      const hour = e.target.value;
                      const min = formData.demandTimeTo ? formData.demandTimeTo.split(":")[1] : "00";
                      handleInputChange({ target: { name: "demandTimeTo", value: `${hour}:${min}` } } as any);
                    }}
                    className="bg-[#fffbe9] border-2 border-black text-black font-bold text-[16px] px-1 py-0.5 h-8 rounded-lg focus:outline-none appearance-none text-center min-w-[36px]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(24).keys()].map((h) => (
                      <option key={h} value={h.toString().padStart(2, "0")}>{h.toString().padStart(2, "0")}</option>
                    ))}
                  </select>
                  <span className="text-black font-bold text-[16px] px-0.5">:</span>
                  <select
                    name="demandTimeToMin"
                    value={formData.demandTimeTo ? formData.demandTimeTo.split(":")[1] : ""}
                    onChange={(e) => {
                      const min = e.target.value;
                      const hour = formData.demandTimeTo ? formData.demandTimeTo.split(":")[0] : "00";
                      handleInputChange({ target: { name: "demandTimeTo", value: `${hour}:${min}` } } as any);
                    }}
                    className="bg-[#fffbe9] border-2 border-black text-black font-bold text-[16px] px-1 py-0.5 h-8 rounded-lg focus:outline-none appearance-none text-center min-w-[36px]"
                    required
                  >
                    <option value="">--</option>
                    {[...Array(12).keys()].map((m) => (
                      <option key={m} value={(m * 5).toString().padStart(2, "0")}>{(m * 5).toString().padStart(2, "0")}</option>
                    ))}
                  </select>
                </div>
                <span className="bg-[#fffbe9] border-2 border-black rounded-xl px-4 py-1 text-[16px] font-bold text-black min-w-[70px] text-center flex-shrink-0 ml-2" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getDurationFromTimes(formData.demandTimeFrom || '', formData.demandTimeTo || '') || '--'}
                </span>
              </div>
              {/* Site Location row */}
              <div className="flex flex-row items-center gap-4 w-full pl-1">
                <div className="flex flex-col items-center bg-[#fffbe9] border-2 border-black rounded-xl px-3 py-2 min-w-0 gap-x-2 w-full" >
                  <span className="font-bold text-black text-[20px] leading-none mr-2 whitespace-nowrap">Site Location</span>
                  <div>
                    <input
                      type="text"
                      name="workLocationFrom"
                      value={formData.workLocationFrom || ""}
                      onChange={handleInputChange}
                      placeholder="From"
                      className="border-2 border-black rounded-lg px-2 py-1 text-[20px] font-bold bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-300 min-w-[70px] max-w-[100px] text-center"
                      required
                    />
                    <span className="font-bold text-black text-[20px] mx-1">to</span>
                    <input
                      type="text"
                      name="workLocationTo"
                      value={formData.workLocationTo || ""}
                      onChange={handleInputChange}
                      placeholder="To"
                      className="border-2 border-black rounded-lg px-2 py-1 text-[20px] font-bold bg-white text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-300 min-w-[70px] max-w-[100px] text-center"
                      required
                    />
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Type of Work and Activity - horizontal, pastel green */}
          <div className="w-full flex flex-row gap-8 items-center bg-[#e6f7c6] rounded-2xl p-6 mb-8 border-2 border-[#b6e6c6] shadow">
            {/* Type of Work dropdown */}
            <div className="flex-1">
              <label htmlFor="workType" className="block text-[20px] font-bold text-black mb-2">Type of Work</label>
              <select
                id="workType"
                name="workType"
                value={formData.workType || ""}
                onChange={handleInputChange}
                className="w-full border-2 border-[#b7cbe8] rounded-xl px-4 py-3 text-[20px] font-bold bg-white text-[#3a506b] shadow focus:outline-none focus:ring-2 focus:ring-[#b7cbe8] appearance-none"
                style={{ minHeight: '48px' }}
                aria-required="true"
              >
                <option value="" disabled>
                  Select Type of Work
                </option>
                {workTypeOptions.map((type: string) => (
                  <option key={type} value={type} className="text-[18px]">
                    {type}
                  </option>
                ))}
              </select>
              {errors.workType && (
                <span className="text-[18px] text-[#e07a5f] font-medium mt-2 block">
                  {errors.workType}
                </span>
              )}
            </div>
            {/* Activity dropdown */}
            <div className="flex-1">
              <label htmlFor="activity" className="block text-[20px] font-bold text-black mb-2">Activity</label>
              <select
                id="activity"
                name="activity"
                value={formData.activity || ""}
                onChange={handleInputChange}
                className="w-full border-2 border-[#b7cbe8] rounded-xl px-4 py-3 text-[20px] font-bold bg-white text-[#3a506b] shadow focus:outline-none focus:ring-2 focus:ring-[#b7cbe8] appearance-none"
                style={{ minHeight: '48px' }}
                aria-required="true"
                disabled={!formData.workType}
              >
                <option value="" disabled>
                  {formData.workType ? 'Select Activity' : 'Select Type of Work first'}
                </option>
                {activityOptions.map((activity: string) => (
                  <option key={activity} value={activity} className="text-[18px]">
                    {activity}
                  </option>
                ))}
                <option value="others" className="text-[18px]">Others</option>
              </select>
              {formData.activity === "others" && (
                <input
                  type="text"
                  className="w-full border-2 border-[#b7cbe8] rounded-xl px-4 py-3 text-[18px] font-medium bg-white text-[#3a506b] shadow mt-4 focus:outline-none focus:ring-2 focus:ring-[#b7cbe8]"
                  placeholder="Enter custom activity"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  required
                />
              )}
              {errors.activity && (
                <span className="text-[18px] text-[#e07a5f] font-medium mt-2 block">
                  {errors.activity}
                </span>
              )}
            </div>
          </div>
        
          {/* Fresh Caution Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[20px]">
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
                className="ml-2 border-2  border-black rounded px-2 py-0.5 text-[13px] font-bold bg-white text-black placeholder-black"
                style={{
                  width: 70,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
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
            {/* ───── Fresh Caution ───── */}
            {formData.freshCautionRequired && (
              <div className="flex flex-col gap-2 mt-2">
                {formData.freshCautions.map((caution, idx) => (
                  <div
                    key={idx}
                    className="flex flex-row flex-wrap gap-1 bg-[#fffbe9] border-2 border-[#b71c1c] rounded items-center p-1"
                    style={{ fontSize: "13px", fontWeight: "bold" }}
                  >
                    {/* ◼︎ Direction / Road */}
                    <input
                      list={`adjacentLinesList-${idx}`}
                      value={caution.adjacentLinesAffected}
                      onChange={e =>
                        handleFreshCautionChange(
                          idx,
                          "adjacentLinesAffected",
                          e.target.value
                        )
                      }
                      placeholder="UP/DN/SL/Road No."
                      required
                      className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-28 text-[13px]"
                    />
                    <datalist id={`adjacentLinesList-${idx}`}>
                      {blockSectionValue.flatMap(block => {
                        const isYard = block.includes("-YD");
                        return isYard
                          ? getAllRoadsForYard(block).map(r => (
                            <option key={r} value={r} />
                          ))
                          : (lineData[block as keyof typeof lineData] || []).map(l => (
                            <option key={l} value={l} />
                          ));
                      })}
                    </datalist>

                    {/* ◼︎ KM From / To */}
                    <input
                      value={caution.freshCautionLocationFrom}
                      onChange={e =>
                        handleFreshCautionChange(
                          idx,
                          "freshCautionLocationFrom",
                          e.target.value
                        )
                      }
                      placeholder="KM"
                      required
                      className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                    />
                    <span className="px-1">to</span>
                    <input
                      value={caution.freshCautionLocationTo}
                      onChange={e =>
                        handleFreshCautionChange(
                          idx,
                          "freshCautionLocationTo",
                          e.target.value
                        )
                      }
                      placeholder="KM"
                      required
                      className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                    />

                    {/* ◼︎ Speed */}
                    <input
                      type="number"
                      value={caution.freshCautionSpeed}
                      onChange={e =>
                        handleFreshCautionChange(
                          idx,
                          "freshCautionSpeed",
                          e.target.value
                        )
                      }
                      placeholder="Speed"
                      required
                      className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                    />

                    {/* ◼︎ Remove */}
                    {formData.freshCautions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFreshCaution(idx)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                {/* ➕ Add Button */}
                <button
                  type="button"
                  onClick={addFreshCaution}
                  className="self-start px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold"
                >
                  + Add Fresh Caution
                </button>
              </div>
            )}

          </div>

          {/* Power Block Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[20px]">
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
                  width: 70,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
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
            {/* ───── Power Block ───── */}
            {formData.powerBlockRequired && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-row flex-wrap gap-1">
                  <span className="text-black font-bold text-[13px]">
                    KM From:
                  </span>
                  <input
                    type="number"
                    name="powerBlockKmFrom"
                    value={formData.powerBlockKmFrom || ""}
                    onChange={handleInputChange}
                    placeholder="KM"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                  <span className="text-black font-bold text-[13px]">
                    KM To:
                  </span>
                  <input
                    type="number"
                    name="powerBlockKmTo"
                    value={formData.powerBlockKmTo || ""}
                    onChange={handleInputChange}
                    placeholder="KM"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                  <span className="text-black font-bold text-[13px]">
                    Road No.:
                  </span>
                  <input
                    type="text"
                    name="powerBlockRoad"
                    value={formData.powerBlockRoad || ""}
                    onChange={handleInputChange}
                    placeholder="Road No."
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                </div>
                <div className="flex flex-row flex-wrap gap-1">
                  <span className="text-black font-bold text-[13px]">
                    Requirements:
                  </span>
                  <textarea
                    name="powerBlockRequirements"
                    value={formData.powerBlockRequirements || ""}
                    onChange={handleInputChange}
                    placeholder="Enter power block requirements"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-full text-[13px]"
                    style={{ minHeight: "32px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* S&T Disconnection Section */}
          <div className="w-full mt-2">
            <div className="flex items-center mb-1">
              <span className="text-black font-bold text-[20px]">
                Whether S&T Disconnection is needed:
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
                  width: 70,
                  height: 24,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9L12 15L18 9' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
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
            {/* ───── S&T Disconnection ───── */}
            {formData.sntDisconnectionRequired && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-row flex-wrap gap-1">
                  <span className="text-black font-bold text-[13px]">
                    Line From:
                  </span>
                  <input
                    type="text"
                    name="sntDisconnectionLineFrom"
                    value={formData.sntDisconnectionLineFrom || ""}
                    onChange={handleInputChange}
                    placeholder="KM"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                  <span className="text-black font-bold text-[13px]">
                    Line To:
                  </span>
                  <input
                    type="text"
                    name="sntDisconnectionLineTo"
                    value={formData.sntDisconnectionLineTo || ""}
                    onChange={handleInputChange}
                    placeholder="KM"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                  <span className="text-black font-bold text-[13px]">
                    Point No.:
                  </span>
                  <input
                    type="text"
                    name="sntDisconnectionPointNo"
                    value={formData.sntDisconnectionPointNo || ""}
                    onChange={handleInputChange}
                    placeholder="Point No."
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                  <span className="text-black font-bold text-[13px]">
                    Signal No.:
                  </span>
                  <input
                    type="text"
                    name="sntDisconnectionSignalNo"
                    value={formData.sntDisconnectionSignalNo || ""}
                    onChange={handleInputChange}
                    placeholder="Signal No."
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-12 text-[13px]"
                  />
                </div>
                <div className="flex flex-row flex-wrap gap-1">
                  <span className="text-black font-bold text-[13px]">
                    Requirements:
                  </span>
                  <textarea
                    name="sntDisconnectionRequirements"
                    value={formData.sntDisconnectionRequirements || ""}
                    onChange={handleInputChange}
                    placeholder="Enter S&T disconnection requirements"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-full text-[13px]"
                    style={{ minHeight: "32px" }}
                  />
                </div>
                <div className="flex flex-row flex-wrap gap-1">
                  <span className="text-black font-bold text-[13px]">
                    Assign To:
                  </span>
                  <input
                    type="text"
                    name="sntDisconnectionAssignTo"
                    value={formData.sntDisconnectionAssignTo || ""}
                    onChange={handleInputChange}
                    placeholder="Name"
                    required
                    className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-full text-[13px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="flex flex-row flex-wrap gap-1">
            <span className="text-black font-bold text-[13px]">
              Remarks:
            </span>
            <textarea
              name="remarks"
              value={formData.remarks || ""}
              onChange={handleInputChange}
              placeholder="Enter any additional remarks"
              className="border-2 border-[#b71c1c] bg-[#fffbe9] text-black placeholder-black px-1 w-full text-[13px]"
              style={{ minHeight: "32px" }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8 gap-4">
            <button
              type="button"
              onClick={() => { window.location.href = "/dashboard"; }}
              className="w-full rounded-2xl bg-[#99f61f] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#baffc9] transition"
            >
              Home
            </button>
            <button
              type="button"
              className="w-full rounded-2xl bg-[#e3e3e3] text-black font-bold text-lg py-4 tracking-wider border border-[#b7b7d1] hover:bg-[#f0eaff] transition"
              onClick={() => {
                if (reviewMode) {
                  setReviewMode(false);
                } else {
                  router.back();
                }
              }}
            >
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
        </form>
      </div>
    </div>
  );
}