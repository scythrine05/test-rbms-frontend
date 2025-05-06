"use client";

interface FooterProps {
  variant?: "login" | "dashboard";
}

export default function Footer({ variant = "login" }: FooterProps) {
  if (variant === "login") {
    return (
      <footer className="bg-[#F37A1F] text-white text-center py-3 text-xs">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              © 2025 Government of India, Ministry of Railways
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:underline">Terms of Use</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  
  return (
    <footer className="bg-white border-t border-gray-200 text-center py-4 text-xs text-black">
      © 2025 Southern Railways Employee Portal. All rights reserved.
    </footer>
  );
}
