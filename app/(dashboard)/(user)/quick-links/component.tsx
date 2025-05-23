"use client";

import Link from "next/link";

// Quick action card component with government style
const QuickAction = ({
    title,
    icon,
    link,
}: {
    title: string;
    icon: React.ReactNode;
    link: string;
}) => (
    <Link
        href={link}
        className="border border-black p-3 flex items-center hover:bg-gray-50"
    >
        <div className="mr-3 text-[#13529e]">{icon}</div>
        <div className="text-sm">{title}</div>
    </Link>
);

export default function UserQuickLinks() {

    {/* Quick actions */ }
    return (<div className="mb-4">
        <h2 className="text-sm font-bold text-[#13529e] mb-2 border-b border-gray-300 pb-1">
            Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <QuickAction
                title="Create Block Request"
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                }
                link="/create-block-request"
            />
            <QuickAction
                title="View Requests"
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                    </svg>
                }
                link="/request-table"
            />
            <QuickAction
                title="Settings"
                icon={
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.342-.565.507-1.27.346-1.963"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                }
                link="/settings"
            />
        </div>
    </div>)


}
