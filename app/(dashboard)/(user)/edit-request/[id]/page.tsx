// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   useCreateUserRequest,
//   useUpdateUserRequest,
//   useDeleteUserRequest,
// } from "@/app/service/mutation/user-request";
// import { useSession } from "next-auth/react";
// import {
//   MajorSection,
//   blockSection,
//   workType,
//   Activity,
//   lineData,
//   depot,
//   streamData,
// } from "@/app/lib/store";
// import Select from "react-select";
// import { z } from "zod";
// import {
//   userRequestSchema,
//   UserRequestInput,
// } from "@/app/validation/user-request";
// import {
//   formatDateToISO,
//   formatTimeToDatetime,
//   isDateAfterThursdayCutoff,
//   extractTimeFromDatetime,
//   filterRequestData,
//   normalizeToDateOnly,
// } from "@/app/lib/helper";
// import { useParams } from "next/navigation";
// import { useGetUserRequestById } from "@/app/service/query/user-request";
// import { Loader } from "@/app/components/ui/Loader";

// type Department = "TRD" | "S&T" | "ENGG";

// function isWithin3Days(blockDate: string) {
//   if (!blockDate) return false;
//   const today = new Date();
//   const block = new Date(blockDate);
//   const diff = (block.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
//   return diff < 3;
// }

// export default function CreateBlockRequestPage() {
//   const params = useParams();
//   const {
//     data: userDataById,
//     isLoading,
//     error,
//   } = useGetUserRequestById(params.id as string);

//   const [formData, setFormData] = useState<
//     Partial<UserRequestInput> & {
//       selectedStreams?: Record<string, string>;
//       selectedRoads?: Record<string, string[]>;
//     }
//   >({
//     id: "",
//     date: "",
//     selectedDepartment: "",
//     selectedSection: "",
//     missionBlock: "",
//     workType: "",
//     activity: "",
//     corridorTypeSelection: null,
//     cautionRequired: false,
//     cautionSpeed: 0,
//     freshCautionRequired: null,
//     freshCautionSpeed: 0,
//     freshCautionLocationFrom: "",
//     freshCautionLocationTo: "",
//     adjacentLinesAffected: "",
//     workLocationFrom: "",
//     workLocationTo: "",
//     trdWorkLocation: "",
//     demandTimeFrom: "",
//     demandTimeTo: "",
//     sigDisconnection: false,
//     elementarySection: "",
//     requestremarks: "",
//     selectedDepo: "",
//     routeFrom: "",
//     routeTo: "",
//     powerBlockRequirements: [],
//     sntDisconnectionRequired: null,
//     sntDisconnectionRequirements: [],
//     sntDisconnectionLineFrom: "",
//     sntDisconnectionLineTo: "",
//     processedLineSections: [],
//     repercussions: "",
//     selectedStream: "",
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const [customActivity, setCustomActivity] = useState("");
//   const [isMobile, setIsMobile] = useState(false);
//   const [blockSectionValue, setBlockSectionValue] = useState<string[]>([]);
//   const [isDisabled, setIsDisabled] = useState(false);
//   const [sntDisconnectionChecked, setSntDisconnectionChecked] = useState(false);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [formSubmitting, setFormSubmitting] = useState(false);
//   const [formError, setFormError] = useState<string | null>(null);

//   const [powerBlockRequirements, setPowerBlockRequirements] = useState<
//     string[]
//   >([]);
//   const [sntDisconnectionRequirements, setSntDisconnectionRequirements] =
//     useState<string[]>([]);
//   const { data: session, status } = useSession({
//     required: true,
//     onUnauthenticated() {
//       window.location.href = "/auth/login";
//     },
//   });

//   const mutation = useUpdateUserRequest(params.id as string);
//   const deleteMutation = useDeleteUserRequest();
//   const userLocation = session?.user.location;
//   const majorSectionOptions =
//     userLocation && MajorSection[userLocation as keyof typeof MajorSection]
//       ? MajorSection[userLocation as keyof typeof MajorSection]
//       : [];
//   const selectedMajorSection = formData.selectedSection;
//   const blockSectionOptions =
//     selectedMajorSection &&
//       blockSection[selectedMajorSection as keyof typeof blockSection]
//       ? blockSection[selectedMajorSection as keyof typeof blockSection]
//       : [];
//   const userDepartment = session?.user.department;
//   const workTypeOptions =
//     userDepartment && workType[userDepartment as keyof typeof workType]
//       ? workType[userDepartment as keyof typeof workType]
//       : [];
//   const selectedWorkType = formData.workType;
//   const activityOptions =
//     selectedWorkType && Activity[selectedWorkType as keyof typeof Activity]
//       ? Activity[selectedWorkType as keyof typeof Activity]
//       : [];

//   const blockSectionOptionsList = blockSectionOptions.map((block: string) => ({
//     value: block,
//     label: block,
//   }));

//   useEffect(() => {
//     if (userDataById?.data) {
//       setFormData(userDataById?.data as any);

//       if (userDataById?.data?.processedLineSections) {
//         setBlockSectionValue(
//           userDataById?.data?.processedLineSections.map(
//             (section: any) => section.block
//           )
//         );
//       }
//     }
//   }, [userDataById?.data]);

//   const handleInputChange = (
//     e: React.ChangeEvent<
//       HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
//     >
//   ) => {
//     const { name, value, type } = e.target;
//     if (type === "checkbox") {
//       const checkbox = e.target as HTMLInputElement;
//       setFormData({
//         ...formData,
//         [name]: checkbox.checked,
//       });
//     } else if (type === "radio") {
//       setFormData({
//         ...formData,
//         [name]: value === "true" ? true : value === "false" ? false : value,
//       });
//     } else if (type === "number") {
//       setFormData({
//         ...formData,
//         [name]: parseFloat(value) || 0,
//       });
//     } else {
//       setFormData({
//         ...formData,
//         [name]: value,
//       });
//     }

//     if (errors[name]) {
//       setErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors[name];
//         return newErrors;
//       });
//     }
//   };

//   const getStreamDataSafely = (
//     blockKey: string,
//     streamKey: string
//   ): string[] => {
//     if (!(blockKey in streamData)) {
//       return [];
//     }

//     const blockData = streamData[blockKey as keyof typeof streamData];
//     if (typeof blockData !== "object" || !(streamKey in blockData)) {
//       return [];
//     }
//     const streamDataTyped = blockData as Record<string, string[]>;
//     return streamDataTyped[streamKey] || [];
//   };

//   const handleFormValidation = () => {
//     if (!formData.date) {
//       setErrors({
//         date: "Please select a date for the block request",
//       });
//       return false;
//     }

//     if (!formData.demandTimeFrom || !formData.demandTimeTo) {
//       const newErrors: Record<string, string> = {};
//       if (!formData.demandTimeFrom) {
//         newErrors.demandTimeFrom = "Demand Time From is required";
//       }
//       if (!formData.demandTimeTo) {
//         newErrors.demandTimeTo = "Demand Time To is required";
//       }
//       setErrors(newErrors);
//       return false;
//     }

//     let newErrors: Record<string, string> = {};
//     let hasError = false;

//     // Required fields validation
//     const requiredFields = [
//       "date",
//       "corridorType",
//       "selectedSection",
//       "selectedDepo",
//       "demandTimeFrom",
//       "demandTimeTo",
//       "workType",
//       "activity",
//     ];

//     // Check required fields
//     requiredFields.forEach((field) => {
//       if (!formData[field as keyof typeof formData]) {
//         newErrors[field] = `${field
//           .replace(/([A-Z])/g, " $1")
//           .replace(/^./, (str) => str.toUpperCase())} is required`;
//         hasError = true;
//       }
//     });

//     // Validate block section
//     if (blockSectionValue.length === 0) {
//       newErrors.missionBlock = "Block Section is required";
//       hasError = true;
//     }

//     // Validate line/stream entries for each block section
//     for (const block of blockSectionValue) {
//       const sectionEntry = formData.processedLineSections?.find(
//         (section) => section.block === block
//       );

//       if (block.includes("-YD")) {
//         // Validate yard sections
//         if (!sectionEntry || !sectionEntry.stream) {
//           newErrors[
//             `processedLineSections.${block}.stream`
//           ] = `Stream for ${block} is required`;
//           hasError = true;
//         }
//         if (sectionEntry?.stream && !sectionEntry.road) {
//           newErrors[
//             `processedLineSections.${block}.road`
//           ] = `Road for ${block} is required`;
//           hasError = true;
//         }
//       } else {
//         // Validate regular sections
//         if (!sectionEntry || !sectionEntry.lineName) {
//           newErrors[
//             `processedLineSections.${block}.lineName`
//           ] = `Line for ${block} is required`;
//           hasError = true;
//         }
//       }
//     }

//     if (hasError) {
//       setErrors(newErrors);
//       // Scroll to first error
//       const firstErrorKey = Object.keys(newErrors)[0];
//       const selector = firstErrorKey.includes(".")
//         ? `[name="${firstErrorKey.split(".")[0]}"]`
//         : `[name="${firstErrorKey}"]`;
//       const element = document.querySelector(selector);
//       if (element) {
//         element.scrollIntoView({ behavior: "smooth", block: "center" });
//       }
//       return false;
//     }

//     return true;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setFormError(null);
//     setSuccess(null);
//     if (!handleFormValidation()) {
//       return;
//     }
//     const validProcessedSections = (
//       formData.processedLineSections || []
//     ).filter((section) => blockSectionValue.includes(section.block));

//     // Ensure all required fields are present in each processed section
//     const processedSectionsWithDefaults = validProcessedSections.map(
//       (section) => {
//         if (section.type === "yard") {
//           return {
//             ...section,
//             lineName: section.lineName || "",
//             otherLines: section.otherLines || "",
//             stream: section.stream || "",
//             road: section.road || "",
//             otherRoads: section.otherRoads || "",
//           };
//         } else {
//           return {
//             ...section,
//             lineName: section.lineName || "",
//             otherLines: section.otherLines || "",
//             stream: "",
//             road: "",
//             otherRoads: "",
//           };
//         }
//       }
//     );

//     const processedFormData = {
//       ...formData,
//       date: formatDateToISO(formData.date || ""),
//       demandTimeFrom: formatTimeToDatetime(
//         formData.date || "",
//         formData.demandTimeFrom || ""
//       ),
//       demandTimeTo: formatTimeToDatetime(
//         formData.date || "",
//         formData.demandTimeTo || ""
//       ),
//       processedLineSections: processedSectionsWithDefaults,
//     };
//     const filteredFormData = filterRequestData(processedFormData);
//     try {
//       mutation.mutate(filteredFormData as UserRequestInput, {
//         onSuccess: (data) => {
//           setSuccess("Block request updated successfully!");
//           // Reset form
//           setFormData({
//             date: "",
//             selectedDepartment: session?.user.department || "",
//             selectedSection: "",
//             missionBlock: "",
//             workType: "",
//             activity: "",
//             corridorTypeSelection: null,
//             cautionRequired: false,
//             cautionSpeed: 0,
//             freshCautionRequired: false,
//             freshCautionSpeed: 0,
//             processedLineSections: [],
//             selectedStream: "",
//           });
//           setBlockSectionValue([]);
//           setCustomActivity("");
//           setPowerBlockRequirements([]);
//           setSntDisconnectionRequirements([]);
//           setFormSubmitting(false);
//         },
//         onError: (error) => {
//           console.error("Error updating form:", error);
//           setFormError("Failed to update block request. Please try again.");
//           setFormSubmitting(false);
//         },
//       });
//     } catch (error) {
//       console.error("Error processing form:", error);
//       setFormError("An error occurred while processing the form.");
//       setFormSubmitting(false);
//     }
//   };

//   // Responsive layout
//   useEffect(() => {
//     const handleResize = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   useEffect(() => {
//     if (!formData.date) {
//       setIsDisabled(true);
//       setFormData({ ...formData, corridorTypeSelection: null });
//     } else {
//       const shouldDisable = isDateAfterThursdayCutoff(formData.date);
//       setIsDisabled(shouldDisable);
//       if (shouldDisable) {
//         setFormData({
//           ...formData,
//           corridorTypeSelection: "Urgent Block",
//         });
//       }
//     }
//   }, [formData.date]);

//   useEffect(() => {
//     setSntDisconnectionChecked(
//       String(formData.sntDisconnectionRequired) === "true"
//     );
//   }, [formData.sntDisconnectionRequired]);

//   const handlePowerBlockRequirementsChange = (
//     value: string,
//     checked: boolean
//   ) => {
//     let newRequirements = [...powerBlockRequirements];
//     if (checked) {
//       newRequirements.push(value);
//     } else {
//       newRequirements = newRequirements.filter((item) => item !== value);
//     }

//     setPowerBlockRequirements(newRequirements);
//     setFormData((prevData) => ({
//       ...prevData,
//       powerBlockRequirements: newRequirements,
//     }));
//     if (checked && errors.powerBlockRequirements) {
//       setErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors.powerBlockRequirements;
//         return newErrors;
//       });
//     }
//   };

//   const handleSntDisconnectionRequirementsChange = (
//     value: string,
//     checked: boolean
//   ) => {
//     let newRequirements = [...sntDisconnectionRequirements];
//     if (checked) {
//       newRequirements.push(value);
//     } else {
//       newRequirements = newRequirements.filter((item) => item !== value);
//     }

//     setSntDisconnectionRequirements(newRequirements);
//     setFormData((prevData) => ({
//       ...prevData,
//       sntDisconnectionRequirements: newRequirements,
//     }));
//     // Also update validation errors
//     if (checked && errors.sntDisconnectionRequirements) {
//       setErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors.sntDisconnectionRequirements;
//         return newErrors;
//       });
//     }
//   };
//   // Handle line name selection change
//   const handleLineNameSelection = (block: string, value: string) => {
//     // Update processedLineSections directly
//     setFormData((prev) => {
//       // Get existing processed sections
//       const existingProcessedSections = [...(prev.processedLineSections || [])];

//       // Find the index of the section for this block or -1 if it doesn't exist
//       const sectionIndex = existingProcessedSections.findIndex(
//         (section) => section.block === block
//       );

//       // Create the updated section
//       const updatedSection = {
//         block,
//         type: "regular",
//         lineName: value,
//         otherLines: "",
//       };

//       // Either update existing section or add new one
//       if (sectionIndex >= 0) {
//         // Keep any existing otherLines if present
//         updatedSection.otherLines =
//           existingProcessedSections[sectionIndex].otherLines || "";
//         existingProcessedSections[sectionIndex] = updatedSection;
//       } else {
//         existingProcessedSections.push(updatedSection);
//       }

//       // If only one block, also update selectedStream for backward compatibility
//       const selectedStream =
//         blockSectionValue.length === 1 ? value : prev.selectedStream;
//       return {
//         ...prev,
//         processedLineSections: existingProcessedSections,
//         selectedStream,
//       };
//     });
//   };
//   // Handle other affected lines change
//   const handleOtherAffectedLinesChange = (block: string, options: any[]) => {
//     const selectedValues = options.map((opt) => opt.value);

//     // Update processedLineSections directly
//     setFormData((prev) => {
//       // Get existing processed sections
//       const existingProcessedSections = [...(prev.processedLineSections || [])];

//       // Find the index of the section for this block
//       const sectionIndex = existingProcessedSections.findIndex(
//         (section) => section.block === block
//       );

//       if (sectionIndex >= 0) {
//         const section = existingProcessedSections[sectionIndex];

//         // Check if this is a yard section or regular section
//         if (section.type === "yard") {
//           // For yard sections, update otherRoads
//           const updatedSection = {
//             ...section,
//             otherRoads: selectedValues.join(","),
//           };
//           existingProcessedSections[sectionIndex] = updatedSection;
//         } else {
//           // For regular sections, update otherLines
//           const updatedSection = {
//             ...section,
//             otherLines: selectedValues.join(","),
//           };
//           existingProcessedSections[sectionIndex] = updatedSection;
//         }
//       }

//       // Also update selectedRoads object to make sure data is captured correctly
//       const selectedRoads = { ...(prev.selectedRoads || {}) };
//       selectedRoads[block] = selectedValues;

//       return {
//         ...prev,
//         processedLineSections: existingProcessedSections,
//         selectedRoads,
//       };
//     });
//   };
//   // Update formData when blockSectionValue changes
//   useEffect(() => {
//     if (blockSectionValue.length > 0) {
//       setFormData((prev) => ({
//         ...prev,
//         missionBlock: blockSectionValue.join(","),
//       }));
//     }
//   }, [blockSectionValue]);
//   // Set department from session when available
//   useEffect(() => {
//     if (session?.user?.department) {
//       setFormData((prev) => ({
//         ...prev,
//         selectedDepartment: session.user.department,
//       }));
//     }
//   }, [session]);
//   // Handle stream selection for yard sections
//   const handleStreamSelection = (block: string, value: string) => {
//     // Update processedLineSections directly
//     setFormData((prev) => {
//       // Get existing processed sections
//       const existingProcessedSections = [...(prev.processedLineSections || [])];

//       // Find the index of the section for this block
//       const sectionIndex = existingProcessedSections.findIndex(
//         (section) => section.block === block
//       );

//       // Create the updated section - reset road when stream changes
//       const updatedSection = {
//         block,
//         type: "yard",
//         stream: value,
//         road: "",
//         otherRoads: "",
//       };

//       // Either update existing section or add new one
//       if (sectionIndex >= 0) {
//         existingProcessedSections[sectionIndex] = updatedSection as any;
//       } else {
//         existingProcessedSections.push(updatedSection as any);
//       }

//       // If only one block, also update selectedStream for backward compatibility
//       const selectedStream =
//         blockSectionValue.length === 1 ? value : prev.selectedStream;

//       // Also update selectedStreams object to make sure data is captured correctly
//       const selectedStreams = { ...(prev.selectedStreams || {}) };
//       selectedStreams[block] = value;
//       return {
//         ...prev,
//         processedLineSections: existingProcessedSections,
//         selectedStream,
//         selectedStreams,
//       };
//     });
//   };
//   // Handle road selection for yard sections
//   const handleRoadSelection = (block: string, value: string) => {
//     // Update processedLineSections directly
//     setFormData((prev) => {
//       // Get existing processed sections
//       const existingProcessedSections = [...(prev.processedLineSections || [])];

//       // Find the index of the section for this block
//       const sectionIndex = existingProcessedSections.findIndex(
//         (section) => section.block === block
//       );

//       if (sectionIndex >= 0) {
//         // Update existing section with road
//         const updatedSection = {
//           ...existingProcessedSections[sectionIndex],
//           road: value,
//         };
//         existingProcessedSections[sectionIndex] = updatedSection;
//       }

//       return {
//         ...prev,
//         processedLineSections: existingProcessedSections,
//       };
//     });
//   };

//   // Add state for edit/cancel mode
//   const [showCancelConfirm, setShowCancelConfirm] = useState(false);

//   // Cancel handler
//   const handleCancelRequest = async () => {
//     setFormError(null);
//     setSuccess(null);
//     try {
//       await deleteMutation.mutateAsync(params.id as string);
//       setShowCancelConfirm(false);
//       setSuccess('Block request cancelled successfully!');
//       setTimeout(() => {
//         window.location.href = '/edit-request';
//       }, 1200);
//     } catch (error) {
//       setFormError('Failed to cancel block request. Please try again.');
//       setShowCancelConfirm(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div>
//         <Loader name="Editing Block Request" />
//       </div>
//     );
//   }

//   const blockDateISO = formData.date ? formatDateToISO(formData.date) : '';
//   const within3Days = isWithin3Days(blockDateISO);
//   const editable = !within3Days;

//   return (
//     <div style={{ minHeight: '100vh', background: '#fcfaf3', fontFamily: 'Arial, Helvetica, sans-serif', boxSizing: 'border-box', width: '100vw', overflowX: 'auto' }}>
//       <div style={{ maxWidth: 420, width: '100%', margin: '0 auto', boxSizing: 'border-box', padding: 8 }}>
//         {/* Header */}
//         <div style={{ background: '#f7f7a1', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 8, borderBottom: '2px solid #b6f7e6', textAlign: 'center' }}>
//           <span style={{ fontSize: 40, fontWeight: 800, color: '#b07be0', letterSpacing: 2, fontFamily: 'Arial, Helvetica, sans-serif' }}>RBMS</span>
//         </div>
//         <div style={{ background: '#c6e6f7', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, padding: 12 }}>
//           <div style={{ background: '#1bb36a', color: '#222', fontWeight: 800, fontSize: 28, borderRadius: 18, padding: 10, textAlign: 'center', marginBottom: 16, letterSpacing: 1, fontFamily: 'Arial, Helvetica, sans-serif', border: '2px solid #188a4a' }}>
//             <span style={{ color: '#222', fontWeight: 800, fontSize: 28, letterSpacing: 1 }}>Edit/Cancel the Block ID ..........</span>
//           </div>
//           <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
//             {editable && (
//               <button
//                 style={{
//                   flex: 1,
//                   maxWidth: 160,
//                   borderRadius: 16,
//                   background: '#2d3cae',
//                   color: 'white',
//                   fontWeight: 700,
//                   fontSize: 22,
//                   padding: '12px 0 4px 0',
//                   border: '2px solid #222',
//                   boxShadow: '0 2px 4px #0001',
//                   minWidth: 0,
//                   fontFamily: 'Arial, Helvetica, sans-serif',
//                   position: 'relative'
//                 }}
//                 type="submit"
//                 form="edit-block-form"
//               >
//                 EDIT
//                 <span style={{ display: 'block', fontSize: 12, fontStyle: 'italic', fontWeight: 400, marginTop: 2, color: '#fff' }}>(Permitted upto 3 days before )</span>
//               </button>
//             )}
//             <button
//               style={{
//                 flex: 1,
//                 maxWidth: 160,
//                 borderRadius: 16,
//                 background: '#d32f2f',
//                 color: 'white',
//                 fontWeight: 700,
//                 fontSize: 22,
//                 padding: '12px 0',
//                 border: '2px solid #222',
//                 boxShadow: '0 2px 4px #0001',
//                 minWidth: 0,
//                 fontFamily: 'Arial, Helvetica, sans-serif'
//               }}
//               onClick={() => setShowCancelConfirm(true)}
//             >
//               CANCEL
//             </button>
//           </div>
//           {/* Main Form Table */}
//           <form
//             id="edit-block-form"
//             onSubmit={handleSubmit}
//             style={{ width: '100%', background: '#fff', borderRadius: 18, boxShadow: '0 2px 8px #0001', border: '2px solid #222', margin: '0 auto 18px auto', padding: 0, overflow: 'hidden' }}
//           >
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 15, tableLayout: 'fixed' }}>
//               <tbody>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, width: '25%', color: '#000' }}>Block Date</td>
//                   <td style={{ background: '#b8e4b7', padding: 6, width: '25%' }}>
//                     <input
//                       type="date"
//                       name="date"
//                       value={formData.date || ''}
//                       onChange={handleInputChange}
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, width: '25%', color: '#000' }}>Request Date</td>
//                   <td style={{ background: '#b8e4b7', padding: 6, width: '25%' }}>
//                     <input
//                       type="date"
//                       disabled
//                       value={new Date().toISOString().split('T')[0]}
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#f0f0f0' }}
//                     />
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#5eb8d6', fontWeight: 600, padding: 6, color: '#000' }}>Sanction Status</td>
//                   <td style={{ background: '#f7f77a', padding: 6 }} colSpan={3}>
//                     <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="sanctionStatus"
//                           value="YES"
//                           checked={formData.sanctionStatus === 'YES'}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>YES</span>
//                       </label>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="sanctionStatus"
//                           value="NO"
//                           checked={formData.sanctionStatus === 'NO'}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>NO</span>
//                       </label>
//                     </div>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>Preferred Slot</td>
//                   <td style={{ background: '#b8e4b7', padding: 6 }}>
//                     <input
//                       type="time"
//                       name="demandTimeFrom"
//                       value={formData.demandTimeFrom || ''}
//                       onChange={handleInputChange}
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, textAlign: 'center', color: '#000' }}>to</td>
//                   <td style={{ background: '#b8e4b7', padding: 6 }}>
//                     <input
//                       type="time"
//                       name="demandTimeTo"
//                       value={formData.demandTimeTo || ''}
//                       onChange={handleInputChange}
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>Block Section/Yard</td>
//                   <td style={{ background: '#fff', padding: 6 }}>
//                     <Select
//                       isMulti
//                       value={blockSectionValue.map(val => ({ value: val, label: val }))}
//                       onChange={(selected) => setBlockSectionValue(selected ? selected.map(opt => opt.value) : [])}
//                       options={blockSectionOptionsList}
//                       isDisabled={!editable}
//                       styles={{
//                         control: (base) => ({
//                           ...base,
//                           minHeight: '32px',
//                           border: '1px solid #222',
//                           background: '#fff'
//                         }),
//                         menu: (base) => ({
//                           ...base,
//                           background: '#fff'
//                         })
//                       }}
//                     />
//                   </td>
//                   <td style={{ background: '#fff', padding: 6 }}>
//                     <input
//                       type="text"
//                       name="road"
//                       value={formData.road || ''}
//                       onChange={handleInputChange}
//                       placeholder="Road"
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                   <td style={{ background: '#fff', padding: 6 }}>
//                     <select
//                       name="lineType"
//                       value={formData.lineType || ''}
//                       onChange={handleInputChange}
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     >
//                       <option value="">Select</option>
//                       <option value="UP">UP</option>
//                       <option value="DN">DN</option>
//                       <option value="SL">SL</option>
//                     </select>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>Site Location</td>
//                   <td style={{ background: '#fff', padding: 6 }}>
//                     <input
//                       type="text"
//                       name="workLocationFrom"
//                       value={formData.workLocationFrom || ''}
//                       onChange={handleInputChange}
//                       placeholder="From"
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                   <td style={{ background: '#fff', padding: 6 }}>
//                     <input
//                       type="text"
//                       name="workLocationTo"
//                       value={formData.workLocationTo || ''}
//                       onChange={handleInputChange}
//                       placeholder="To"
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                   <td style={{ background: '#fff', padding: 6 }}></td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>Caution Required</td>
//                   <td style={{ background: '#fff', padding: 6 }} colSpan={3}>
//                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="cautionRequired"
//                           value="true"
//                           checked={formData.cautionRequired === true}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, fontSize: 14, color: '#000' }}>YES</span>
//                       </label>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="cautionRequired"
//                           value="false"
//                           checked={formData.cautionRequired === false}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, fontSize: 14, color: '#000' }}>NO</span>
//                       </label>
//                       <input
//                         type="text"
//                         name="cautionLocationFrom"
//                         value={formData.cautionLocationFrom || ''}
//                         onChange={handleInputChange}
//                         placeholder="From"
//                         style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                         disabled={!editable || !formData.cautionRequired}
//                       />
//                       <input
//                         type="text"
//                         name="cautionLocationTo"
//                         value={formData.cautionLocationTo || ''}
//                         onChange={handleInputChange}
//                         placeholder="To"
//                         style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                         disabled={!editable || !formData.cautionRequired}
//                       />
//                       <input
//                         type="number"
//                         name="cautionSpeed"
//                         value={formData.cautionSpeed || ''}
//                         onChange={handleInputChange}
//                         placeholder="Kmph"
//                         style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                         disabled={!editable || !formData.cautionRequired}
//                       />
//                       <input
//                         type="number"
//                         name="cautionDays"
//                         value={formData.cautionDays || ''}
//                         onChange={handleInputChange}
//                         placeholder="Days"
//                         style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                         disabled={!editable || !formData.cautionRequired}
//                       />
//                     </div>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>Other Lines Affected</td>
//                   <td style={{ background: '#fff', padding: 6 }} colSpan={3}>
//                     <input
//                       type="text"
//                       name="adjacentLinesAffected"
//                       value={formData.adjacentLinesAffected || ''}
//                       onChange={handleInputChange}
//                       placeholder="Enter affected lines"
//                       style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
//                       disabled={!editable}
//                     />
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>PB Required</td>
//                   <td style={{ background: '#fff', padding: 6 }} colSpan={3}>
//                     <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="powerBlockRequired"
//                           value="true"
//                           checked={formData.powerBlockRequired === true}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>YES</span>
//                       </label>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="powerBlockRequired"
//                           value="false"
//                           checked={formData.powerBlockRequired === false}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>NO</span>
//                       </label>
//                     </div>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style={{ background: '#e4b5e4', fontWeight: 600, padding: 6, color: '#000' }}>S&T Disconnection Required</td>
//                   <td style={{ background: '#fff', padding: 6 }} colSpan={3}>
//                     <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="sntDisconnectionRequired"
//                           value="true"
//                           checked={formData.sntDisconnectionRequired === true}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>YES</span>
//                       </label>
//                       <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
//                         <input
//                           type="radio"
//                           name="sntDisconnectionRequired"
//                           value="false"
//                           checked={formData.sntDisconnectionRequired === false}
//                           onChange={handleInputChange}
//                           disabled={!editable}
//                         />
//                         <span style={{ fontWeight: 600, color: '#000' }}>NO</span>
//                       </label>
//                     </div>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//             <button
//               type="submit"
//               style={{ width: '100%', background: '#8be36b', color: '#222', fontWeight: 800, fontSize: 28, padding: '16px 0', borderRadius: 6, marginTop: 18, marginBottom: 8, fontFamily: 'Arial, Helvetica, sans-serif', border: 'none', boxShadow: '0 2px 4px #0001' }}
//               disabled={formSubmitting || !editable}
//             >
//               Submit Revised Request
//             </button>
//           </form>
//           {/* Navigation Buttons */}
//           <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
//             <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#e6e6fa', border: '2px solid #222', borderRadius: 8, padding: '8px 18px', fontSize: 20, fontWeight: 700, color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }} onClick={() => window.history.back()}>
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2} style={{ width: 24, height: 24 }}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//               </svg>
//               Back
//             </button>
//             <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#c6fa4a', border: '2px solid #222', borderRadius: 8, padding: '8px 18px', fontSize: 20, fontWeight: 700, color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }} onClick={() => window.location.href = '/dashboard'}>
//               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" stroke="black" strokeWidth={2} style={{ width: 24, height: 24 }}>
//                 <rect x="6" y="12" width="20" height="12" rx="2" fill="#fffbe9" stroke="black" strokeWidth="2" />
//                 <path d="M4 14L16 4L28 14" stroke="black" strokeWidth="2" fill="none" />
//               </svg>
//               Home
//             </button>
//             <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ffb347', border: '2px solid #222', borderRadius: 8, padding: '8px 18px', fontSize: 20, fontWeight: 700, color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }} onClick={() => window.location.href = '/auth/logout'}>
//               Logout
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


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

function isWithin3Days(blockDate: string) {
  if (!blockDate) return false;
  const today = new Date();
  const block = new Date(blockDate);
  const diff = (block.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff < 3;
}

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
    // if (!handleFormValidation()) {
    //   return;
    // }
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

  // Cancel handler
  const handleCancelRequest = async () => {
    setFormError(null);
    setSuccess(null);
    try {
      await deleteMutation.mutateAsync(params.id as string);
      setShowCancelConfirm(false);
      setSuccess("Block request cancelled successfully!");
      setTimeout(() => {
        window.location.href = "/edit-request";
      }, 1200);
    } catch (error) {
      setFormError("Failed to cancel block request. Please try again.");
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

  const blockDateISO = formData.date ? formatDateToISO(formData.date) : "";
  const within3Days = isWithin3Days(blockDateISO);
  const editable = !within3Days;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fcfaf3",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        width: "100vw",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          padding: 8,
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#f7f7a1",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 8,
            borderBottom: "2px solid #b6f7e6",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: "#b07be0",
              letterSpacing: 2,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            RBMS
          </span>
        </div>
        <div
          style={{
            background: "#c6e6f7",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            padding: 12,
          }}
        >
          <div
            style={{
              background: "#1bb36a",
              color: "#222",
              fontWeight: 800,
              fontSize: 28,
              borderRadius: 18,
              padding: 10,
              textAlign: "center",
              marginBottom: 16,
              letterSpacing: 1,
              fontFamily: "Arial, Helvetica, sans-serif",
              border: "2px solid #188a4a",
            }}
          >
            <span
              style={{
                color: "#222",
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: 1,
              }}
            >
              Edit/Cancel the Block ID ..........
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            {editable && (
              <button
                style={{
                  flex: 1,
                  maxWidth: 160,
                  borderRadius: 16,
                  background: "#2d3cae",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 22,
                  padding: "12px 0 4px 0",
                  border: "2px solid #222",
                  boxShadow: "0 2px 4px #0001",
                  minWidth: 0,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  position: "relative",
                }}
                type="submit"
                form="edit-block-form"
              >
                EDIT
                <span
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontStyle: "italic",
                    fontWeight: 400,
                    marginTop: 2,
                    color: "#fff",
                  }}
                >
                  (Permitted upto 3 days before )
                </span>
              </button>
            )}
            <button
              style={{
                flex: 1,
                maxWidth: 160,
                borderRadius: 16,
                background: "#d32f2f",
                color: "white",
                fontWeight: 700,
                fontSize: 22,
                padding: "12px 0",
                border: "2px solid #222",
                boxShadow: "0 2px 4px #0001",
                minWidth: 0,
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
              onClick={() => setShowCancelConfirm(true)}
            >
              CANCEL
            </button>
          </div>
          {/* Main Form Table */}
          <form
            id="edit-block-form"
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 2px 8px #0001",
              border: "2px solid #222",
              margin: "0 auto 18px auto",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 15,
                tableLayout: "fixed",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      width: "25%",
                      color: "#000",
                    }}
                  >
                    Block Date
                  </td>
                  <td
                    style={{ background: "#b8e4b7", padding: 6, width: "25%" }}
                  >
                    <input
                      type="date"
                      name="date"
                      value={
                        formData.date
                          ? new Date(formData.date).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#fff",
                      }}
                      disabled={!editable}
                    />
                  </td>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      width: "25%",
                      color: "#000",
                    }}
                  >
                    Request Date
                  </td>
                  <td
                    style={{ background: "#b8e4b7", padding: 6, width: "25%" }}
                  >
                    <input
                      type="date"
                      disabled
                      value={new Date().toISOString().split("T")[0]}
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#f0f0f0",
                      }}
                    />
                  </td>
                </tr>

                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    Preferred Slot
                  </td>
                  <td style={{ background: "#b8e4b7", padding: 6 }}>
                    <input
                      type="time"
                      name="demandTimeFrom"
                      value={extractTimeFromDatetime(
                        formData.demandTimeFrom || ""
                      )}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#fff",
                      }}
                      disabled={!editable}
                    />
                  </td>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      textAlign: "center",
                      color: "#000",
                    }}
                  >
                    to
                  </td>
                  <td style={{ background: "#b8e4b7", padding: 6 }}>
                    <input
                      type="time"
                      name="demandTimeTo"
                      value={extractTimeFromDatetime(
                        formData.demandTimeTo || ""
                      )}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#fff",
                      }}
                      disabled={!editable}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    Block Section/Yard
                  </td>
                  <tr>
                    <td
                      style={{ background: "#b8e4b7", padding: 6 }}
                      colSpan={3}
                    >
                      <select
                        name="selectedSection"
                        value={formData.selectedSection || ""}
                        onChange={handleInputChange}
                        style={{
                          width: "100%",
                          padding: 4,
                          border: "1px solid #222",
                          borderRadius: 4,
                          background: "#fff",
                          appearance: "none", // Removes default dropdown arrow
                          WebkitAppearance: "none", // For Safari
                          MozAppearance: "none", // For Firefox
                        }}
                        disabled={!editable}
                      >
                        <option value="">Select Section</option>
                        {majorSectionOptions.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {/* <td style={{ background: "#fff", padding: 6 }}>
                    <input
                      type="text"
                      name="road"
                      value={formData.road || ""}
                      onChange={handleInputChange}
                      placeholder="Line/Road"
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#fff",
                      }}
                      disabled={!editable}
                    />
                    
                  </td> */}
                  <td
                    style={{
                      fontWeight: 600,
                      padding: 6,
                    }}
                  >
                    Line/Road :
                  </td>
                  <td style={{ background: "#fff", padding: 6 }}>
                    <select
                      name="lineType"
                      value={formData.lineType || ""}
                      onChange={handleInputChange}
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #222",
                        borderRadius: 4,
                        background: "#fff",
                      }}
                      disabled={!editable}
                    >
                      <option value="">Select</option>
                      <option value="UP">UP</option>
                      <option value="DN">DN</option>
                      <option value="SL">SL</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    Site Location
                  </td>
                  <td style={{ background: "#fff", padding: 6 }}>
                    <input
                      type="text"
                      name="workLocationFrom"
                      value={formData.workLocationFrom || ""}
                      onChange={handleInputChange}
                      placeholder="From"
                      disabled
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        background: "#eee",
                        color: "#555",
                        cursor: "not-allowed",
                      }}
                    // style={{ width: '100%', padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
                    // disabled={!editable}
                    />
                  </td>
                  {/* <input
  type="text"
  name="workLocationFrom"
  value={formData.workLocationFrom || ''}
  placeholder="From"
  disabled
  style={{
    width: '100%',
    padding: 4,
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#eee',
    color: '#555',
    cursor: 'not-allowed'
  }}
/> */}

                  <td style={{ background: "#fff", padding: 6 }}>
                    <input
                      type="text"
                      name="workLocationTo"
                      value={formData.workLocationTo || ""}
                      onChange={handleInputChange}
                      placeholder="To"
                      disabled
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        background: "#eee",
                        color: "#555",
                        cursor: "not-allowed",
                      }}
                    />
                  </td>
                  <td style={{ background: "#fff", padding: 6 }}></td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    Caution Required
                  </td>
                  <td style={{ background: "#fff", padding: 6 }} colSpan={3}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="cautionRequired"
                          value="true"
                          checked={formData.cautionRequired === true}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#000",
                          }}
                        >
                          YES
                        </span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="cautionRequired"
                          value="false"
                          checked={formData.cautionRequired === false}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#000",
                          }}
                        >
                          NO
                        </span>
                      </label>
                      <input
                        type="text"
                        name="cautionLocationFrom"
                        value={formData.cautionLocationFrom || ""}
                        onChange={handleInputChange}
                        placeholder="From"
                        style={{
                          width: 60,
                          padding: 4,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          background: "#eee",

                          cursor: "not-allowed",
                        }}
                        disabled
                      // style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
                      // disabled={!editable || !formData.cautionRequired}
                      />
                      <input
                        type="text"
                        name="cautionLocationTo"
                        value={formData.cautionLocationTo || ""}
                        onChange={handleInputChange}
                        placeholder="To"
                        style={{
                          width: 60,
                          padding: 4,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          background: "#eee",

                          cursor: "not-allowed",
                        }}
                        disabled
                      // style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
                      // disabled={!editable || !formData.cautionRequired}
                      />
                      <input
                        type="number"
                        name="cautionSpeed"
                        value={formData.cautionSpeed || ""}
                        onChange={handleInputChange}
                        placeholder="Kmph"
                        style={{
                          width: 60,
                          padding: 4,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          background: "#eee",

                          cursor: "not-allowed",
                        }}
                        disabled
                      // style={{ width: 60, padding: 4, border: '1px solid #222', borderRadius: 4, background: '#fff' }}
                      // disabled={!editable || !formData.cautionRequired}
                      />
                      <input
                        type="number"
                        name="cautionDays"
                        value={formData.cautionDays || ""}
                        onChange={handleInputChange}
                        placeholder="Days"
                        style={{
                          width: 60,
                          padding: 4,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          background: "#eee",

                          cursor: "not-allowed",
                        }}
                        disabled
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    Other Lines Affected
                  </td>
                  <td style={{ background: "#fff", padding: 6 }} colSpan={3}>
                    <input
                      type="text"
                      name="adjacentLinesAffected"
                      value={formData.adjacentLinesAffected || ""}
                      onChange={handleInputChange}
                      placeholder="Enter affected lines"
                      disabled
                      style={{
                        width: "100%",
                        padding: 4,
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        background: "#eee",
                        color: "#555",
                        cursor: "not-allowed",
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    PB Required
                  </td>
                  <td style={{ background: "#fff", padding: 6 }} colSpan={3}>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        justifyContent: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="powerBlockRequired"
                          value="true"
                          checked={formData.powerBlockRequired === true}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span style={{ fontWeight: 600, color: "#000" }}>
                          YES
                        </span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="powerBlockRequired"
                          value="false"
                          checked={formData.powerBlockRequired === false}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span style={{ fontWeight: 600, color: "#000" }}>
                          NO
                        </span>
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      background: "#e4b5e4",
                      fontWeight: 600,
                      padding: 6,
                      color: "#000",
                    }}
                  >
                    S&T Disconnection Required
                  </td>
                  <td style={{ background: "#fff", padding: 6 }} colSpan={3}>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        justifyContent: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="sntDisconnectionRequired"
                          value="true"
                          checked={formData.sntDisconnectionRequired === true}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span style={{ fontWeight: 600, color: "#000" }}>
                          YES
                        </span>
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <input
                          type="radio"
                          name="sntDisconnectionRequired"
                          value="false"
                          checked={formData.sntDisconnectionRequired === false}
                          onChange={handleInputChange}
                          disabled={!editable}
                        />
                        <span style={{ fontWeight: 600, color: "#000" }}>
                          NO
                        </span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              type="submit"
              style={{
                width: "100%",
                background: "#8be36b",
                color: "#222",
                fontWeight: 800,
                fontSize: 28,
                padding: "16px 0",
                borderRadius: 6,
                marginTop: 18,
                marginBottom: 8,
                fontFamily: "Arial, Helvetica, sans-serif",
                border: "none",
                boxShadow: "0 2px 4px #0001",
              }}
              disabled={formSubmitting || !editable}
            >
              Submit Revised Request
            </button>
          </form>
          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#e6e6fa",
                border: "2px solid #222",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 20,
                fontWeight: 700,
                color: "#222",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
              onClick={() => window.history.back()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth={2}
                style={{ width: 24, height: 24 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#c6fa4a",
                border: "2px solid #222",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 20,
                fontWeight: 700,
                color: "#222",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
              onClick={() => (window.location.href = "/dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 32 32"
                stroke="black"
                strokeWidth={2}
                style={{ width: 24, height: 24 }}
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#ffb347",
                border: "2px solid #222",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 20,
                fontWeight: 700,
                color: "#222",
                fontFamily: "Arial, Helvetica, sans-serif",
              }}
              onClick={() => (window.location.href = "/auth/logout")}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
