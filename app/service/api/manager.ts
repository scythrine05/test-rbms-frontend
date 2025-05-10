import axiosInstance from "@/app/utils/axiosInstance";

export interface User {
    id: string;
    name: string;
    email: string;
    department: string;
    phone: string;
    location: string;
    depot: string;
    role: "USER" | "JUNIOR_OFFICER" | "SENIOR_OFFICER";
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    department: string;
    phone: string;
    location: string;
    depot: string;
}

export interface UsersResponse {
    status: boolean;
    message: string;
    data: {
        users: User[];
        total: number;
        page: number;
        totalPages: number;
    };
}

export type UserRequest = {
    id: string;
    date: string;
    selectedDepartment: string;
    selectedSection: string;
    missionBlock: string;
    workType: string;
    activity: string;
    corridorTypeSelection?: string;
    corridorType?: string;
    cautionRequired: boolean;
    cautionSpeed: number;
    freshCautionRequired: boolean;
    freshCautionSpeed: number;
    freshCautionLocationFrom: string;
    freshCautionLocationTo: string;
    adjacentLinesAffected: string;
    workLocationFrom: string;
    workLocationTo: string;
    trdWorkLocation: string;
    demandTimeFrom: string;
    demandTimeTo: string;
    sigDisconnection: boolean;
    elementarySection: string;
    requestremarks: string;
    selectedDepo: string;
    routeFrom: string;
    routeTo: string;
    powerBlockRequirements: string[];
    sntDisconnectionRequired: boolean;
    sntDisconnectionRequirements: string[];
    sntDisconnectionLineFrom: string;
    sntDisconnectionLineTo: string;
    processedLineSections?: Array<{
        block: string;
        type: string;
        lineName?: string;
        otherLines?: string;
        stream?: string;
        road?: string;
        otherRoads?: string;
    }>;
    repercussions: string;
    selectedStream: string;
    managerAcceptance: boolean;
    adminAcceptance: "PENDING" | "ACCEPTED" | "REJECTED";
    powerBlockRequired: boolean;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        depot: string;
        department: string;
    };
};

export interface UserRequestsResponse {
    status: boolean;
    message: string;
    data: {
        requests: UserRequest[];
        total: number;
        page: number;
        totalPages: number;
    };
}

export const managerService = {
    /**
     * Get all users with their roles
     */
    getAllUsers: async (page: number = 1): Promise<UsersResponse> => {
        const response = await axiosInstance.get<UsersResponse>(`/api/auth/users/manager?page=${page}`);
        return response.data;
    },

    getAllManagers: async (page: number = 1): Promise<UsersResponse> => {
        const response = await axiosInstance.get<UsersResponse>(`/api/auth/manager/admin?page=${page}`);
        return response.data;
    },

    /**
     * Create a new user
     */
    createUser: async (data: CreateUserInput): Promise<{ status: boolean; message: string }> => {
        const response = await axiosInstance.post("/api/auth/register-user", data);
        return response.data;
    },

    createUserManager: async (data: CreateUserInput): Promise<{ status: boolean; message: string }> => {
        const response = await axiosInstance.post("/api/auth/register-manager", data);
        return response.data;
    },

    /**
     * Delete a user
     */
    deleteUser: async (id: string): Promise<{ status: boolean; message: string }> => {
        const response = await axiosInstance.delete(`/api/auth/users/${id}`);
        return response.data;
    },

    /**
     * Get all user requests with pagination
     */
    getUserRequests: async (page: number = 1, limit: number = 10): Promise<UserRequestsResponse> => {
        const response = await axiosInstance.get<UserRequestsResponse>(`/api/user-request/manager/users-requests?page=${page}&limit=${limit}`);
        return response.data;
    },

    getUserRequestsByAdmin: async (page: number = 1, limit: number = 10): Promise<UserRequestsResponse> => {
        const response = await axiosInstance.get<UserRequestsResponse>(`/api/user-request/admin/users-requests?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * Accept a user request
     */
    acceptUserRequest: async (id: string): Promise<{ status: boolean; message: string }> => {
        const response = await axiosInstance.put(`/api/user-request/manager/accept/${id}`);
        return response.data;
    },

    /**
     * Get a single user request by ID
     */
    getUserRequestById: async (id: string): Promise<{ status: boolean; data: UserRequest }> => {
        const response = await axiosInstance.get(`/api/user-request/${id}`);
        return response.data;
    }
};
