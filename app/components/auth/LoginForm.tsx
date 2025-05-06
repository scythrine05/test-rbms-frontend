"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authService } from "@/app/service/api/auth";
import { LoginInput, loginSchema } from "@/app/validation/auth";

type InputFieldProps = {
  label: string;
  id: string;
  type?: string;
  register: any;
  error?: {
    message?: string;
  } | undefined;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

/**
 * Reusable input field component for forms
 */
function InputField({ 
  label, 
  id, 
  type = "text", 
  register, 
  error, 
  ...props 
}: InputFieldProps) {
  return (
    <div className="mb-3 sm:mb-4">
      <label htmlFor={id} className="block text-gray-700 font-medium mb-1 text-xs sm:text-sm">
        {label}
      </label>
      <input
        id={id}
        type={type}
        {...register(id)}
        className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#3277BC] focus:border-transparent`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-0.5 sm:mt-1">{error.message}</p>}
    </div>
  );
}

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
      email: '',
      password: ''
    }
  });

  /**
   * Handle form submission
   * @param data The login form data
   */
  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log("Login attempt with:", data.email);
      
      const responseData = await authService.login(data);
      
      console.log("Login API response:", responseData);
      
      const { access_token, refresh_token, user } = responseData.data;
      
      const result = await signIn("credentials", {
        redirect: false,
        accessToken: access_token,
        refreshToken: refresh_token,
        user: JSON.stringify(user),
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        console.error("SignIn error:", result.error);
        setAuthError(result.error);
      } else {
        console.log("Login successful, redirecting to dashboard");
        
        // Force a hard navigation to the dashboard
        window.location.href = "/dashboard";
        
        // As a fallback, also use the router
        setTimeout(() => {
          if (window.location.pathname !== "/dashboard") {
            console.log("Fallback redirect using router");
            router.push("/dashboard");
          }
        }, 1000);
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
        setAuthError(error.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 p-5 sm:p-6 md:p-8">
      <div className="flex flex-col items-center mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <img src="/logo.png" alt="Railways Logo" className="h-10 w-10 sm:h-12 sm:w-12" />
          <h2 className="text-lg sm:text-xl font-bold text-[#3277BC]">
            Southern Railway
          </h2>
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">
          Employee Login Portal
        </h3>
        <p className="text-xs sm:text-sm text-center text-gray-500">
          Sign in with your credentials
        </p>
      </div>

      {authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 sm:p-3 rounded-md mb-4 sm:mb-6 text-xs sm:text-sm flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <InputField
          label="Email Address"
          id="email"
          type="email"
          register={register}
          error={errors.email}
          placeholder="your.email@example.com"
          autoComplete="email"
          required
        />

        <div>
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1 text-sm">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#3277BC] focus:border-transparent`}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 gap-3 sm:gap-0">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-3 w-3 sm:h-4 sm:w-4 text-[#3277BC] focus:ring-[#3277BC] border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <a href="#" className="text-xs sm:text-sm text-[#3277BC] hover:text-[#2c6cb0] hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-[#3277BC] text-white py-2 sm:py-2.5 px-4 rounded-md text-sm font-medium hover:bg-[#2c6cb0] focus:outline-none focus:ring-2 focus:ring-[#3277BC] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs sm:text-sm">Signing in...</span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm">Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 text-center text-xs sm:text-sm text-gray-600">
        <p>Need help? Contact <a href="mailto:support@southernrailway.com" className="text-[#3277BC] hover:underline">IT Support</a></p>
      </div>
      
      <div className="mt-4 sm:mt-6 text-center text-xs text-black">
        This is a secure government portal. Unauthorized access is prohibited.
      </div>
    </div>
  );
}
