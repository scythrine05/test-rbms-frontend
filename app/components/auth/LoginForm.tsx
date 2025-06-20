"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/service/api/auth";
import { LoginInput, loginSchema } from "@/app/validation/auth";

/**
 * Login Form Component
 * Handles user authentication with email and password
 */
export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /**
   * Handle form submission
   * @param data The login form data
   */
  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const responseData = await authService.login(data);

      const { access_token, refresh_token, user } = responseData.data;

      const result = await signIn("credentials", {
        redirect: false,
        accessToken: access_token,
        refreshToken: refresh_token,
        user: JSON.stringify(user),
      });

      if (result?.error) {
        console.error("SignIn error:", result.error);
        setAuthError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error.status === false && error.message) {
        // API returned an error response with a message
        setAuthError(error.message);
      } else if (error.errors && Object.keys(error.errors).length > 0) {
        // API returned validation errors
        const firstErrorField = Object.keys(error.errors)[0];
        const firstErrorMessage = error.errors[firstErrorField][0];
        setAuthError(`${firstErrorField}: ${firstErrorMessage}`);
      } else {
        // Generic error handling
        setAuthError(
          error.message || "Authentication failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col items-center bg-white/60 rounded-2xl shadow-lg p-6 mb-4 border border-gray-200 backdrop-blur-md"
      style={{ boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)" }}
    >
      {/* User ID */}
      {/* <div className="w-full flex items-center mb-4">
        <input
          type="text"
          {...register("email")}
          placeholder="User ID"
          className="flex-1 bg-[#eeb8f7] text-black font-semibold rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-white placeholder:font-bold border-none shadow-none"
          style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" }}
        />
      </div> */}
      <div className="w-full flex items-center mb-4">
  <input
    type="text"
    {...register("email")}
    placeholder="User ID"
    className="flex-1 bg-[#eeb8f7] text-black font-semibold rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-white placeholder:font-bold border-none"
    style={{
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
      color: "black", // Ensure text color remains black
      caretColor: "black" // Optional: caret (typing cursor) color
    }}
  />
</div>

      {/* Password : OTP */}
      <div className="w-full flex items-center mb-6">
        <input
          type="password"
          {...register("password")}
          placeholder="Password : OTP"
          className="flex-1 bg-[#eeb8f7] text-black font-semibold rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-white placeholder:font-bold border-none shadow-none"
          style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)" }}
        />
      </div>
      {/* Login Button */}
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
        {isLoading ? "Logging in..." : "CLICK TO LOGIN"}
      </button>
    </form>
  );
}
