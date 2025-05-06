"use client";

import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header showNavLinks={false} />

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm />

          <div className="text-center text-xs text-gray-500 mt-6">
            <p>For technical assistance, please contact</p>
            <p className="font-medium">
              IT Support: support@southernrailway.gov.in
            </p>
          </div>
        </div>
      </main>

      <Footer variant="login" />
    </div>
  );
}
