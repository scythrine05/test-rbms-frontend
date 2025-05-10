"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService } from "@/app/service/api/manager";
import {
  useCreateManager,
  useDeleteUser,
} from "@/app/service/mutation/manager";
import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";
import { location } from "@/app/lib/store";
import { useRouter } from "next/navigation";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateUserModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateUserModalProps) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    phone: "",
    location: "",
    depot: "OVERALL",
    role: "BRANCH_OFFICER",
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: "",
      email: "",
      password: "",
      department: "",
      phone: "",
      location: "",
      depot: "OVERALL",
      role: "BRANCH_OFFICER",
    });
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-md border border-black">
        <div className="border-b-2 border-[#13529e] pb-3 mb-4">
          <h2 className="text-lg font-bold text-[#13529e]">
            Create New Branch Officer
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e] pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Department <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e]"
              required
            >
              <option value="">Select Department</option>
              <option value="TRD">TRD</option>
              <option value="S&T">S&T</option>
              <option value="ENGG">ENGG</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Phone <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Location <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 border border-black text-black focus:outline-none focus:ring-1 focus:ring-[#13529e]"
              required
            >
              <option value="">Select Location</option>
              {Object.entries(location).map(([key, value]) => (
                <option key={key} value={key}>
                  {value} - {key}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 text-sm bg-white text-[#13529e] border border-black hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-sm bg-[#13529e] text-white border border-black hover:bg-[#0d3d7a]"
            >
              Create Branch Officer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserCard = ({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => void;
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={() => onDelete(user.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        <p>Department: {user.department}</p>
        <p>Phone: {user.phone}</p>
        <p>Location: {user.location}</p>
      </div>
    </div>
  );
};

// Add type definition for User
type User = {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  location: string;
  depot: string;
  role:
    | "USER"
    | "JUNIOR_OFFICER"
    | "SENIOR_OFFICER"
    | "BRANCH_OFFICER"
    | "ADMIN";
};

export default function ManageUsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user is authorized
  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/unauthorized");
    }
  }, [session, router]);

  // If not authorized, show unauthorized message
  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="bg-white p-3 border border-black mb-3">
        <div className="text-center py-5">
          <h1 className="text-lg font-bold text-red-600 mb-2">
            Unauthorized Access
          </h1>
          <p className="text-black">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Fetch users data
  const { data, isLoading, error } = useQuery({
    queryKey: ["users", page],
    queryFn: () => managerService.getAllManagers(page),
  });

  // Mutations
  const createUser = useCreateManager();
  const deleteUser = useDeleteUser();

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await createUser.mutateAsync(userData);
      if (!response.status) {
        throw new Error(response.message);
      }
      setIsCreateModalOpen(false);
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  if (isLoading) return <Loader name="users" />;
  if (error) return <div>Error loading users</div>;

  const branchOfficers =
    data?.data.users.filter((user: User) => user.role === "BRANCH_OFFICER") ||
    [];

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">
          Manage Branch Officers
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm"
          >
            Add Branch Officer
          </button>
        </div>
      </div>

      {/* Branch Officers Section */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-black mb-4 border-b border-gray-300 pb-1">
          Branch Officers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-black">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Name
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Email
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Department
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Phone
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Location
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {branchOfficers.map((officer: User) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-sm">
                    {officer.name}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {officer.email}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {officer.department}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {officer.phone}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {officer.location}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    <button
                      onClick={() => handleDeleteUser(officer.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
