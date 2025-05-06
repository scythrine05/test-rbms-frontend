"use client";

import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  showNavLinks?: boolean;
}

export default function Header({ showNavLinks = true }: HeaderProps) {
  return (
    <header className="bg-[#3277BC] text-white py-1 md:py-2 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full ">
          <img
            src="https://sr.indianrailways.gov.in/images/main_logo.jpg"
            alt="National Emblem"
            className="h-9 w-10 rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base md:text-md tracking-wide">
            GOVERNMENT OF INDIA
          </span>
          <span className="text-xs text-white">Ministry of Railways</span>
        </div>
      </div>

      {showNavLinks && (
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="#" className="hover:underline text-white font-medium">
            Home
          </Link>
          <Link href="#" className="hover:underline text-white font-medium">
            About
          </Link>
          <Link href="#" className="hover:underline text-white font-medium">
            Contact
          </Link>
          <Link href="#" className="hover:underline text-white font-medium">
            Help
          </Link>
        </nav>
      )}
    </header>
  );
}
