"use client";

import Header from "@/app/components/shared/Header";
import Footer from "@/app/components/shared/Footer";
import LoginForm from "@/app/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header showNavLinks={true} />
      
      <main className="flex-1 flex flex-col items-center justify-center py-10">
        <LoginForm />
      </main>
      
      <Footer variant="login" />
    </div>
  );
}
