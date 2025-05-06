"use client";

import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  showNavLinks?: boolean;
}

export default function Header({ showNavLinks = true }: HeaderProps) {
  return (
    <header className="bg-[#F37A1F] text-white py-3 md:py-4 px-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full p-1">
          <img 
            src="/emblem.svg" 
            alt="National Emblem" 
            className="h-8 w-8" 
          />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base md:text-xl tracking-wide">
            GOVERNMENT OF INDIA
          </span>
          <span className="text-xs md:text-sm text-white">
            Ministry of Railways
          </span>
        </div>
      </div>
      
      {showNavLinks && (
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="#" className="hover:underline text-white font-medium">Home</Link>
          <Link href="#" className="hover:underline text-white font-medium">About</Link>
          <Link href="#" className="hover:underline text-white font-medium">Contact</Link>
          <Link href="#" className="hover:underline text-white font-medium">Help</Link>
        </nav>
      )}
    </header>
  );
}
