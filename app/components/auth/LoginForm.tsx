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
    <div className="bg-white p-3 border border-black mb-3 w-full max-w-md">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Employee Login</h1>
      </div>

      <div className="flex flex-col items-center mb-4">
        <div className="flex items-center gap-2 mb-2">
          <img
            src="https://sr.indianrailways.gov.in/images/main_logo.jpg"
            alt="Railways Logo"
            className="h-12 w-12"
          />
          <h2 className="text-lg font-bold text-[#3277BC]">Southern Railway</h2>
        </div>
        <p className="text-xs text-center text-gray-600">
          Sign in with your credentials to access the portal
        </p>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 text-xs mb-3">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="form-group">
          <label className="block text-sm font-medium text-black mb-1">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            {...register("email")}
            className="gov-input"
            style={{
              color: "black",
              borderColor: errors.email ? "#dc2626" : "#000000",
              fontSize: "14px",
            }}
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <span className="text-xs text-red-700 font-medium mt-1 block">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-black mb-1">
            Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="gov-input"
              style={{
                color: "black",
                borderColor: errors.password ? "#dc2626" : "#000000",
                fontSize: "14px",
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-red-700 font-medium mt-1 block">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-[#3277BC]"
              style={{ accentColor: "#3277BC" }}
            />
            <span className="ml-2 text-xs text-gray-700">Remember me</span>
          </label>
          <a href="#" className="text-xs text-[#3277BC] hover:underline">
            Forgot password?
          </a>
        </div>

        <div className="flex justify-center mt-5">
          <button
            type="submit"
            className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm w-full"
            disabled={isLoading}
            aria-label="Login to system"
          >
            {isLoading ? "Processing..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="text-[10px] text-gray-600 mt-5 border-t border-black pt-2 text-center">
        <span className="text-red-600">*</span> Required fields • This is a
        secure government portal. Unauthorized access is prohibited.
      </div>

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
      `}</style>
    </div>
  );
}
