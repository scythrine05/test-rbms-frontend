"use client";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sidebar } from "../components/ui/sidebar";
import { UrgentModeProvider, useUrgentMode } from "../context/UrgentModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const metadata: Metadata = {
  title: "Southern Railway - Dashboard",
  description: "Southern Railway Employee Portal Dashboard",
};

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Always render only children, never the nav or sidebar, for all dashboard pages
  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UrgentModeProvider>
      <DashboardContent>{children}</DashboardContent>
    </UrgentModeProvider>
  );
}
