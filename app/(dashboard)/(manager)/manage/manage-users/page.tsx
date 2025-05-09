"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { managerService, User } from "@/app/service/api/manager";
import { useCreateUser, useDeleteUser } from "@/app/service/mutation/manager";
import { Loader } from "@/app/components/ui/Loader";
import { useSession } from "next-auth/react";
import { depotOnLocation } from "@/app/lib/store";
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
    department: session?.user.department || "",
    phone: "",
    location: session?.user.location || "",
    depot: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Get depot options based on location
  const depotOptions = formData.location
    ? depotOnLocation[formData.location as keyof typeof depotOnLocation] || []
    : [];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: "",
      email: "",
      password: "",
      department: session?.user.department || "",
      phone: "",
      location: session?.user.location || "",
      depot: "",
    });
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 w-full max-w-md border border-black">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">
          Create New User
        </h2>
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
              className="gov-input text-black"
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
              className="gov-input text-black"
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
                className="gov-input text-black pr-10"
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
            <input
              type="text"
              value={formData.department}
              className="gov-input text-black cursor-not-allowed"
              disabled
            />
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
              className="gov-input text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Location <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              className="gov-input text-black cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Depot <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.depot}
              onChange={(e) =>
                setFormData({ ...formData, depot: e.target.value })
              }
              className="gov-input text-black"
              required
            >
              <option value="">Select Depot</option>
              {depotOptions.map((depot) => (
                <option key={depot} value={depot}>
                  {depot}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 text-sm bg-gray-100 text-black border border-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-sm bg-[#13529e] text-white border border-black"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateOfficerModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateUserModalProps) => {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: session?.user.department || "",
    phone: "",
    location: session?.user.location || "",
    depot: session?.user.depot || "",
    role: "JUNIOR_OFFICER",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    try {
      await onSubmit(formData);
      setFormData({
        name: "",
        email: "",
        password: "",
        department: session?.user.department || "",
        phone: "",
        location: session?.user.location || "",
        depot: session?.user.depot || "",
        role: "JUNIOR_OFFICER",
      });
      setShowPassword(false);
    } catch (err: any) {
      setError(err.message || "Failed to create officer");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 w-full max-w-md border border-black">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-300 pb-2">
          Create New Officer
        </h2>
        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}
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
              className="gov-input text-black"
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
              className="gov-input text-black"
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
                className="gov-input text-black pr-10"
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
            <input
              type="text"
              value={formData.department}
              className="gov-input text-black cursor-not-allowed"
              disabled
            />
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
              className="gov-input text-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Location <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              className="gov-input text-black cursor-not-allowed"
              disabled
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-black mb-1">
              Depot <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.depot}
              className="gov-input text-black cursor-not-allowed"
              disabled
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Role <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="gov-input text-black"
              required
            >
              <option value="JUNIOR_OFFICER">Junior Officer</option>
              <option value="SENIOR_OFFICER">Senior Officer</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 text-sm bg-gray-100 text-black border border-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 text-sm bg-[#13529e] text-white border border-black"
            >
              Create Officer
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
        <p>Depot: {user.depot}</p>
      </div>
    </div>
  );
};

export default function ManageUsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateOfficerModalOpen, setIsCreateOfficerModalOpen] =
    useState(false);
  const [page, setPage] = useState(1);
  const { data: session } = useSession();
  const router = useRouter();

  // Check if user is authorized
  useEffect(() => {
    if (session?.user?.role !== "BRANCH_OFFICER") {
      router.push("/unauthorized");
    }
  }, [session, router]);

  // If not authorized, show unauthorized message
  if (session?.user?.role !== "BRANCH_OFFICER") {
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
    queryFn: () => managerService.getAllUsers(page),
  });

  // Mutations
  const createUser = useCreateUser();
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

  const handleCreateOfficer = async (userData: any) => {
    try {
      const response = await createUser.mutateAsync(userData);
      if (!response.status) {
        throw new Error(response.message);
      }
      setIsCreateOfficerModalOpen(false);
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

  const officers =
    data?.data.users.filter(
      (user: User) =>
        user.role === "JUNIOR_OFFICER" || user.role === "SENIOR_OFFICER"
    ) || [];
  const regularUsers =
    data?.data.users.filter((user: User) => user.role === "USER") || [];

  return (
    <div className="bg-white p-3 border border-black mb-3">
      <div className="border-b-2 border-[#13529e] pb-3 mb-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-[#13529e]">Manage Users</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCreateOfficerModalOpen(true)}
            className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm"
          >
            Add J/S Officer
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#13529e] text-white px-4 py-1 border border-black text-sm"
          >
            Add New User
          </button>
        </div>
      </div>

      {/* Officers Section */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-black mb-4 border-b border-gray-300 pb-1">
          Officers
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
                  Role
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {officers.map((officer: User) => (
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
                    {officer.role}
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

      {/* Regular Users Section */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-black mb-4 border-b border-gray-300 pb-1">
          Users
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
                  Depot
                </th>
                <th className="border border-black p-1 text-left text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-black p-1 text-sm">
                    {user.name}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {user.email}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {user.department}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {user.phone}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {user.location}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    {user.depot}
                  </td>
                  <td className="border border-black p-1 text-sm">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
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

      <CreateOfficerModal
        isOpen={isCreateOfficerModalOpen}
        onClose={() => setIsCreateOfficerModalOpen(false)}
        onSubmit={handleCreateOfficer}
      />

      <div className="text-[10px] text-gray-600 mt-2 border-t border-black pt-1 text-right">
        © {new Date().getFullYear()} Indian Railways
      </div>
    </div>
  );
}
