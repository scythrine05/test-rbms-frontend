import { useMutation } from "@tanstack/react-query";
import { authService } from "../api/auth";
import { LoginInput } from "@/app/validation/auth";
import { useRouter } from "next/navigation";
import { useUserRedirect } from "@/app/utils/routeHandler";
import { signIn } from "next-auth/react";

const handleAuthSuccess = async (data: any, router: any) => {
  try {
    const result = await signIn("credentials", {
      redirect: false,
      accessToken: data.data.access_token || data.data.data?.access_token,
      refreshToken: data.data.refresh_token || data.data.data?.refresh_token,
      user: JSON.stringify(data.data.user),
    });

    if (result?.error) {
      throw new Error(result.error);
    }
    const handleRedirect = useUserRedirect(data.data.user);
     handleRedirect();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const useAuth = () => {
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: async (data) => handleAuthSuccess(data, router),
  });

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
};

export const usePhoneAuth = () => {
  const router = useRouter();

  const requestOtpMutation = useMutation({
    mutationFn: (phone: string) => authService.requestOtp(phone),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({
      phone,
      otp,
      otpId,
    }: {
      phone: string;
      otp: string;
      otpId: string;
    }) => authService.verifyOtp(phone, otp, otpId),
    onSuccess: async (data) => handleAuthSuccess(data, router),
  });

  return {
    requestOtp: requestOtpMutation.mutate,
    verifyOtp: verifyOtpMutation.mutate,
    isRequestingOtp: requestOtpMutation.isPending,
    isVerifyingOtp: verifyOtpMutation.isPending,
    requestOtpError: requestOtpMutation.error,
    verifyOtpError: verifyOtpMutation.error,
    otpRequestData: requestOtpMutation.data,
  };
};
