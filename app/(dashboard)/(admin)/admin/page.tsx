"use client";
import { FaHome } from "react-icons/fa";
import Link from "next/link";

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center bg-[#fffbe9]">
            {/* Header */}
            <div className="w-full border border-black bg-yellow-200 flex items-center justify-center relative p-2" style={{ minHeight: 60 }}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <FaHome className="w-9 h-9 text-black" />
                </span>
                <span className="text-2xl font-bold text-black">Home</span>
            </div>
            {/* RBMS badge */}
            <div className="w-full flex justify-center mt-4">
                <div className="bg-green-200 rounded-2xl px-8 py-2">
                    <span className="text-4xl font-extrabold text-[#b07be0] tracking-wide">RBMS</span>
                </div>
            </div>
            {/* Designation bar */}
            <div className="w-full flex justify-center mt-4">
                <div className="bg-[#ffeaea] rounded-full px-6 py-2 border border-black flex flex-col items-center" style={{ maxWidth: '90vw' }}>
                    <span className="text-lg font-bold text-black tracking-wide">ADMIN DESIGNATION</span>
                </div>
            </div>
            {/* Navigation buttons */}
            <div className="w-full flex flex-col items-center gap-8 mt-10 px-2 max-w-md">
                <Link href="/admin/request-table" className="w-full">
                    <button className="w-full rounded-2xl bg-[#eeb8f7] border border-black py-6 text-2xl font-extrabold text-black text-center shadow hover:scale-105 transition">
                        VIEW BLOCK DETAILS
                    </button>
                </Link>
                <Link href="/admin/sanction-table-data" className="w-full">
                    <button className="w-full rounded-2xl bg-[#c7c7f7] border border-black py-6 text-2xl font-extrabold text-black text-center shadow hover:scale-105 transition">
                        BLOCK SUMMARY REPORT
                    </button>
                </Link>
            </div>
        </div>
    );
} 