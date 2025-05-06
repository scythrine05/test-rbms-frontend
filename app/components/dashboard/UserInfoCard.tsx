"use client";

interface UserInfoProps {
  user: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    phone: string;
  };
}

export default function UserInfoCard({ user }: UserInfoProps) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-black">Employee Information</h2>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">Active</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-xs text-black font-medium">Employee ID</p>
          <p className="text-sm font-medium text-black">{user.id}</p>
        </div>
        <div>
          <p className="text-xs text-black font-medium">Full Name</p>
          <p className="text-sm font-medium text-black">{user.name}</p>
        </div>
        <div>
          <p className="text-xs text-black font-medium">Email</p>
          <p className="text-sm font-medium text-black">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-black font-medium">Department</p>
          <p className="text-sm font-medium text-black">{user.department}</p>
        </div>
        <div>
          <p className="text-xs text-black font-medium">Role</p>
          <p className="text-sm font-medium text-black">{user.role}</p>
        </div>
        <div>
          <p className="text-xs text-black font-medium">Contact</p>
          <p className="text-sm font-medium text-black">{user.phone}</p>
        </div>
      </div>
    </div>
  );
}
