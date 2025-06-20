"use client";
import React, { useState, useEffect } from "react";
import { useUpdateUserRequest } from "@/app/service/mutation/user-request";
import { useSession } from "next-auth/react";
import { MajorSection } from "@/app/lib/store";
import { useParams } from "next/navigation";
import { useGetUserRequestById } from "@/app/service/query/user-request";
import { Loader } from "@/app/components/ui/Loader";
import { format, parse, parseISO } from "date-fns";

interface FormData {
  isSanctioned: boolean;
  sntDisconnectionRequirements: string[];
  sntDisconnectionLineFrom: string;
  sntDisconnectionLineTo: string;
  powerBlockRequirements: string[];
  elementarySection: string;
  id: string;
  date: string;
  selectedDepartment: string;
  selectedSection: string;
  freshCautionRequired: boolean;
  freshCautionSpeed: number;
  freshCautionLocationFrom: string;
  freshCautionLocationTo: string;
  workLocationFrom: string;
  otherLinesAffected: string;
  workLocationTo: string;
  demandTimeFrom: string;
  demandTimeTo: string;
  powerBlockRequired: boolean;
  sntDisconnectionRequired: boolean;
  elementarySectionTo: string;
  lineType?: string;
  [key: string]: any;
}

export default function CreateBlockRequestPage() {
  const params = useParams();
  const { data: userDataById, isLoading } = useGetUserRequestById(params.id as string);
  const [formData, setFormData] = useState<FormData>({
    id: "",
    date: "",
    sntDisconnectionRequirements: [],
    sntDisconnectionLineFrom: "",
    sntDisconnectionLineTo: "",
    selectedDepartment: "",
    selectedSection: "",
    freshCautionRequired: false,
    freshCautionSpeed: 0,
    freshCautionLocationFrom: "",
    freshCautionLocationTo: "",
    workLocationFrom: "",
    workLocationTo: "",
    demandTimeFrom: "",
    demandTimeTo: "",
    powerBlockRequired: false,
    sntDisconnectionRequired: false,
    elementarySectionTo: "",
    otherLinesAffected: "",
    isSanctioned: false,
    powerBlockRequirements: [],
    elementarySection: "",
  });

  const { data: session } = useSession({ required: true });
  const mutation = useUpdateUserRequest(params.id as string);

  useEffect(() => {
    if (userDataById?.data) {
      const data = userDataById.data;
      
      const getTimeFromISO = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };

      setFormData({
        id: data.id,
        date: data.date ? new Date(data.date).toISOString() : "",
        selectedDepartment: data.selectedDepartment || "",
        selectedSection: data.selectedSection || "",
        freshCautionRequired: data.freshCautionRequired || false,
        freshCautionSpeed: data.freshCautionSpeed || 0,
        freshCautionLocationFrom: data.freshCautionLocationFrom || "",
        freshCautionLocationTo: data.freshCautionLocationTo || "",
        workLocationFrom: data.workLocationFrom || "",
        workLocationTo: data.workLocationTo || "",
        demandTimeFrom: getTimeFromISO(data.demandTimeFrom),
        demandTimeTo: getTimeFromISO(data.demandTimeTo),
        powerBlockRequired: data.powerBlockRequired || false,
        sntDisconnectionRequired: data.sntDisconnectionRequired || false,
        elementarySectionTo: data.elementarySectionTo || "",
        otherLinesAffected: data.processedLineSections?.[0]?.otherLines || "",
        isSanctioned: data.isSanctioned || false,
        powerBlockRequirements: data.powerBlockRequirements || [],
        elementarySection: data.elementarySection || "",
        sntDisconnectionRequirements: data.sntDisconnectionRequirements || [],
        sntDisconnectionLineFrom: data.sntDisconnectionLineFrom || "",
        sntDisconnectionLineTo: data.sntDisconnectionLineTo || "",
      });
    }
  }, [userDataById]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
   if (name === 'date' && value) {
  const date = parse(value, 'yyyy-MM-dd', new Date());
  setFormData(prev => ({
    ...prev,
    [name]: date.toISOString()
  }));
  return;
}
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    setFormData(prev => {
      const currentArray = prev[name as 'powerBlockRequirements' | 'sntDisconnectionRequirements'] || [];
      return {
        ...prev,
        [name]: checked
          ? [...currentArray, value]
          : currentArray.filter(item => item !== value)
      };
    });
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isChecked = value === "true";
    
    setFormData(prev => ({
      ...prev,
      [name]: isChecked,
      ...(name === "powerBlockRequired" && !isChecked && {
        powerBlockRequirements: [],
        elementarySection: ""
      }),
      ...(name === "sntDisconnectionRequired" && !isChecked && {
        sntDisconnectionRequirements: [],
        sntDisconnectionLineFrom: "",
        sntDisconnectionLineTo: ""
      })
    }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? 0 : parseInt(value, 10)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        ...(!formData.powerBlockRequired && {
          powerBlockRequirements: [],
          elementarySection: ""
        }),
        ...(!formData.sntDisconnectionRequired && {
          sntDisconnectionRequirements: [],
          sntDisconnectionLineFrom: "",
          sntDisconnectionLineTo: ""
        }),
        date: formData.date,
        demandTimeFrom: formData.date && formData.demandTimeFrom 
          ? new Date(`${formData.date.split('T')[0]}T${formData.demandTimeFrom}:00`).toISOString()
          : "",
        demandTimeTo: formData.date && formData.demandTimeTo
          ? new Date(`${formData.date.split('T')[0]}T${formData.demandTimeTo}:00`).toISOString()
          : "",
        processedLineSections: [
          {
            ...(userDataById?.data.processedLineSections?.[0] || {}),
            otherLines: formData.otherLinesAffected
          }
        ]
      };

      await mutation.mutateAsync(formattedData as any);
      alert("Request updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update request");
    }
  };

  const handleCancelRequest = async () => {
    try {
      await mutation.mutateAsync({ ...formData as any });
      alert("Request cancelled successfully!");
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("Failed to cancel request");
    }
  };

  if (isLoading) return <Loader name="Loading request..." />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto p-2">
        <div className="bg-yellow-100 rounded-t-xl p-2 border-b-2 border-teal-200 text-center">
          <span className="text-4xl font-extrabold text-purple-600 tracking-wide">RBMS</span>
          <div className="text-sm font-bold mt-1">Screen 15A-2</div>
        </div>
        
        <div className="bg-blue-100 rounded-b-xl p-3">
          <div className="bg-green-500 text-gray-800 font-bold text-xl rounded-xl p-2 text-center mb-4 border-2 border-green-700 tracking-wide">
            Edit/Cancel the Block ID {formData.id}
          </div>
          
          <div className="flex gap-3 justify-center mb-4">
            <button
              className="flex-1 max-w-[160px] rounded-xl bg-blue-800 text-white font-bold text-xl py-2 border-2 border-gray-800 shadow-sm relative"
              type="submit"
              form="edit-block-form"
            >
              EDIT
              <span className="block text-xs italic font-normal mt-0.5">
                (Permitted upto 3 days before)
              </span>
            </button>
            <button
              className="flex-1 max-w-[160px] rounded-xl bg-red-600 text-white font-bold text-xl py-3 border-2 border-gray-800 shadow-sm"
              onClick={() => window.confirm("Cancel this request?") && handleCancelRequest()}
            >
              CANCEL
            </button>
          </div>
          
          <form
            id="edit-block-form"
            onSubmit={handleSubmit}
            className="w-full bg-white rounded-xl shadow-sm border-2 border-gray-800 mb-6 overflow-hidden"
          >
            <table className="w-full border-collapse font-sans text-sm table-fixed">
              <tbody>
                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 w-1/4 text-gray-900">
                    Block Date
                  </td>
                  <td className="bg-green-200 p-1.5 w-1/4">
                    <input
                      type="date"
                      name="date"
                      value={formData.date ? format(parseISO(formData.date), 'yyyy-MM-dd') : ""}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                  <td className="bg-purple-200 font-semibold p-1.5 w-1/4 text-gray-900">
                    Request Date
                  </td>
                  <td className="bg-green-200 p-1.5 w-1/4">
                    <input
                      type="text"
                      value={new Date().toLocaleDateString('en-GB')}
                      className="w-full p-1 border border-gray-800 rounded bg-gray-200"
                      readOnly
                    />
                  </td>
                </tr>

                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Sanction Status
                  </td>
                  <td className="bg-white p-1.5" colSpan={3}>
                    <div className="flex gap-4 justify-center">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="isSanctioned"
                          value="true"
                          checked={formData.isSanctioned === true}
                          onChange={() => {}}
                          disabled
                        />
                        <span className="font-semibold text-gray-900">YES</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="isSanctioned"
                          value="false"
                          checked={formData.isSanctioned === false}
                          onChange={() => {}}
                          disabled
                        />
                        <span className="font-semibold text-gray-900">NO</span>
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Preferred Slot
                  </td>
                  <td className="bg-green-200 p-1.5">
                    <input
                      type="time"
                      name="demandTimeFrom"
                      value={formData.demandTimeFrom}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                  <td className="bg-purple-200 font-semibold p-1.5 text-center text-gray-900">
                    to
                  </td>
                  <td className="bg-green-200 p-1.5">
                    <input
                      type="time"
                      name="demandTimeTo"
                      value={formData.demandTimeTo}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Block Section/Yard
                  </td>
                  <td className="bg-green-200 p-1.5" colSpan={3}>
                    <select
                      name="selectedSection"
                      value={formData.selectedSection}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-800 rounded bg-white appearance-none"
                    >
                      <option value="">Select Section</option>
                      {MajorSection[session?.user?.location as keyof typeof MajorSection]?.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className="font-semibold p-1.5">Road</td>
                  <td className="bg-white p-1.5">
                    <select
                      name="lineType"
                      value={formData.lineType || ""}
                      onChange={handleInputChange}
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    >
                      <option value="">Select</option>
                      <option value="UP">UP</option>
                      <option value="DN">DN</option>
                      <option value="SL">SL</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="bg-white p-1.5" colSpan={2}></td>
                </tr>

                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Site Location
                  </td>
                  <td className="bg-white p-1.5">
                    <input
                      type="text"
                      name="workLocationFrom"
                      value={formData.workLocationFrom}
                      onChange={handleInputChange}
                      placeholder="From"
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                  <td className="bg-white p-1.5">
                    <input
                      type="text"
                      name="workLocationTo"
                      value={formData.workLocationTo}
                      onChange={handleInputChange}
                      placeholder="To"
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Caution Required
                  </td>
                  <td className="bg-white p-1.5" colSpan={3}>
                    <div className="flex flex-wrap gap-2 items-center">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="freshCautionRequired"
                          value="true"
                          checked={formData.freshCautionRequired === true}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-sm text-gray-900">YES</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="freshCautionRequired"
                          value="false"
                          checked={formData.freshCautionRequired === false}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-sm text-gray-900">NO</span>
                      </label>
                      <input
                        type="text"
                        name="freshCautionLocationFrom"
                        value={formData.freshCautionLocationFrom}
                        onChange={handleInputChange}
                        placeholder="From"
                        className="w-14 p-1 border border-gray-800 rounded bg-white"
                      />
                      <input
                        type="text"
                        name="freshCautionLocationTo"
                        value={formData.freshCautionLocationTo}
                        onChange={handleInputChange}
                        placeholder="To"
                        className="w-14 p-1 border border-gray-800 rounded bg-white"
                      />
                      <input
                        type="number"
                        name="freshCautionSpeed"
                        value={formData.freshCautionSpeed}
                        onChange={handleNumberInputChange}
                        placeholder="SB"
                        className="w-10 p-1 border border-gray-800 rounded bg-white"
                      />
                    </div>
                  </td>
                </tr>
                            <tr className="bg-purple-200">
  <td className="font-semibold p-1.5 text-gray-900 whitespace-nowrap">
    Other Lines Affected, if any
  </td>
  <td className="p-1.5" colSpan={3}>
    <input
      type="text"
      name="otherLinesAffected"
      value={formData.otherLinesAffected}
      onChange={handleInputChange}
      placeholder="Enter affected lines"
      className="p-1 border border-gray-800 rounded bg-inherit w-44 ml-23"
    />
  </td>
</tr>
                {/* <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    Other Lines Affected,if any
                  </td>
                  <td className="bg-white  p-1.5" colSpan={3}>
                    <input
                      type="text"
                      name="otherLinesAffected"
                      value={formData.otherLinesAffected}
                      onChange={handleInputChange}
                      placeholder="Enter affected lines"
                      className="w-full p-1 border border-gray-800 rounded bg-white"
                    />
                  </td>
                </tr> */}

                <tr>
                  <td className=" font-semibold p-1.5 text-gray-900">
                    PB Required
                  </td>
                  <td className="bg-white p-1.5" colSpan={3}>
                    <div className="flex gap-4 justify-center">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="powerBlockRequired"
                          value="true"
                          checked={formData.powerBlockRequired === true}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-gray-900">YES</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="powerBlockRequired"
                          value="false"
                          checked={formData.powerBlockRequired === false}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-gray-900">NO</span>
                      </label>
                    </div>
                    {formData.powerBlockRequired && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="powerBlockRequirements"
                            value="Gears Required"
                            checked={formData.powerBlockRequirements?.includes("Gears Required") || false}
                            onChange={handleCheckboxChange}
                            className="border border-gray-800 rounded"
                          />
                          <span className="font-semibold text-gray-900">Gears Required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="powerBlockRequirements"
                            value="Staff Required"
                            checked={formData.powerBlockRequirements?.includes("Staff Required") || false}
                            onChange={handleCheckboxChange}
                            className="border border-gray-800 rounded"
                          />
                          <span className="font-semibold text-gray-900">Staff Required</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Elementary Section:</span>
                          <input
                            type="text"
                            name="elementarySection"
                            value={formData.elementarySection || ""}
                            onChange={handleInputChange}
                            className="p-1 border border-gray-800 rounded bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </td>
                </tr>

                <tr>
                  <td className="bg-purple-200 font-semibold p-1.5 text-gray-900">
                    S&T Disconnection Required
                  </td>
                  <td className="bg-purple-200 p-1.5" colSpan={3}>
                    <div className="flex gap-4 justify-center">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="sntDisconnectionRequired"
                          value="true"
                          checked={formData.sntDisconnectionRequired === true}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-gray-900">YES</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="sntDisconnectionRequired"
                          value="false"
                          checked={formData.sntDisconnectionRequired === false}
                          onChange={handleRadioChange}
                        />
                        <span className="font-semibold text-gray-900">NO</span>
                      </label>
                    </div>
                    {formData.sntDisconnectionRequired && (
                      <div className="mt-2 space-y-3">
                        <div className="flex flex-wrap gap-4 justify-center">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="sntDisconnectionRequirements"
                              value="Gears Required"
                              checked={formData.sntDisconnectionRequirements?.includes("Gears Required") || false}
                              onChange={handleCheckboxChange}
                              className="w-4 h-4 border border-gray-800 rounded accent-blue-600"
                            />
                            <span className="font-semibold text-gray-900">Gears Required</span>
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              name="sntDisconnectionRequirements"
                              value="Staff Required"
                              checked={formData.sntDisconnectionRequirements?.includes("Staff Required") || false}
                              onChange={handleCheckboxChange}
                              className="w-4 h-4 border border-gray-800 rounded accent-blue-600"
                            />
                            <span className="font-semibold text-gray-900">Staff Required</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-900">Line From:</span>
                            <input
                              type="text"
                              name="sntDisconnectionLineFrom"
                              value={formData.sntDisconnectionLineFrom || ""}
                              onChange={handleInputChange}
                              className="w-full p-1.5 border border-gray-800 rounded bg-white"
                              placeholder="Enter starting point"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-900">Line To:</span>
                            <input
                              type="text"
                              name="sntDisconnectionLineTo"
                              value={formData.sntDisconnectionLineTo || ""}
                              onChange={handleInputChange}
                              className="w-full p-1.5 border border-gray-800 rounded bg-white"
                              placeholder="Enter ending point"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="p-4">
              <button
                type="submit"
                className="w-full bg-green-400 text-gray-900 font-bold text-xl py-4 rounded border-none shadow-sm"
              >
                Submit Revised Request
              </button>
            </div>
          </form>
          
          <div className="flex justify-between gap-2 mt-4">
            <button
              className="flex items-center gap-1 bg-lavender border-2 border-gray-800 rounded-lg px-4 py-2 text-lg font-bold text-gray-900"
              onClick={() => window.history.back()}
            >
              Back
            </button>
            <button
              className="flex items-center gap-1 bg-lime-300 border-2 border-gray-800 rounded-lg px-4 py-2 text-lg font-bold text-gray-900"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Home
            </button>
            <button
              className="flex items-center gap-1 bg-orange-300 border-2 border-gray-800 rounded-lg px-4 py-2 text-lg font-bold text-gray-900"
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