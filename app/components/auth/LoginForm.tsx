"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { PhoneLoginInput, phoneLoginSchema } from "@/app/validation/auth";
import { usePhoneAuth } from "@/app/service/query/auth";

/**
 * Phone Login Form Component
 * Handles user authentication with phone number and OTP
 */
export default function PhoneLoginForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  
  const { 
    requestOtp, 
    verifyOtp, 
    isRequestingOtp, 
    isVerifyingOtp, 
    requestOtpError, 
    verifyOtpError,
    otpRequestData 
  } = usePhoneAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PhoneLoginInput>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
      otp: "",
    },
  });

  const phone = watch("phone");
  const isLoading = isRequestingOtp || isVerifyingOtp;

  // Update error state when API errors change
  useEffect(() => {
    if (requestOtpError) {
      setAuthError((requestOtpError as any)?.message || "Failed to send OTP");
    } else if (verifyOtpError) {
      setAuthError((verifyOtpError as any)?.message || "Failed to verify OTP");
    } else {
      setAuthError(null);
    }
  }, [requestOtpError, verifyOtpError]);

  // Update otpId when received from API
  useEffect(() => {
    if (otpRequestData?.data?.otpId) {
      setOtpId(otpRequestData.data.otpId);
      setStep("otp");
    }
  }, [otpRequestData]);

  /**
   * Handle form submission based on current step
   */
  const onSubmit = async (data: PhoneLoginInput) => {
    setAuthError(null);

    if (step === "phone") {
      // Request OTP
      try {
        requestOtp(data.phone);
      } catch (error: any) {
        console.error("Request OTP error:", error);
        setAuthError(error.message || "Failed to send OTP. Please try again.");
      }
    } else if (step === "otp" && otpId) {
      // Verify OTP
      try {
        verifyOtp({
          phone: data.phone,
          otp: data.otp || "",
          otpId: otpId
        });
      } catch (error: any) {
        console.error("Verify OTP error:", error);
        setAuthError(error.message || "Failed to verify OTP. Please try again.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col items-center bg-white/60 rounded-2xl shadow-lg p-6 mb-4 border border-gray-200 backdrop-blur-md"
      style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
    >
      {/* Phone Number Input */}
      <div className="w-full flex items-center mb-4">
        <input
          type="tel"
          {...register("phone")}
          placeholder="Phone Number"
          disabled={step === "otp"}
          className="flex-1 bg-[#eeb8f7] text-white font-semibold rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-white placeholder:font-bold border-none"
          style={{
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
            WebkitBoxShadow: "0 0 0 1000px #eeb8f7 inset",
            WebkitTextFillColor: "white",
            caretColor: "white",
            opacity: step === "otp" ? 0.7 : 1
          }}
        />
      </div>

      {/* OTP Input */}
      <div className="w-full flex items-center mb-6">
        <input
          type="text"
          {...register("otp")}
          placeholder="Enter OTP"
          disabled={step === "phone"}
          className="flex-1 bg-[#eeb8f7] text-white font-semibold rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-white placeholder:font-bold border-none"
          style={{
            boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
            WebkitBoxShadow: "0 0 0 1000px #eeb8f7 inset",
            WebkitTextFillColor: "white",
            caretColor: "white",
            opacity: step === "phone" ? 0.7 : 1
          }}
        />
      </div>

      {/* Error message */}
      {authError && (
        <div className="w-full text-red-500 text-sm mb-4 text-center">
          {authError}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center font-bold text-black text-base"
        style={{
          width: "180px",
          height: "100px",
          backgroundColor: "#f4a47c",
          borderRadius: "50%",
          letterSpacing: "1px",
          border: "none",
        }}
      >
        {isLoading 
          ? (step === "phone" ? "Sending OTP..." : "Verifying...") 
          : (step === "phone" ? "GET OTP" : "Click to Login")}
      </button>
    </form>
  );
}