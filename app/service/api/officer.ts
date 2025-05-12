import axiosInstance from "@/app/utils/axiosInstance";

export interface OfficerResponse {
    status: boolean;
    message: string;
    data: {
        officers?: any[];
        users?: any[];
        total: number;
        page: number;
        totalPages: number;
    };
}

export interface AvailableOfficersResponse {
    status: boolean;
    message: string;
    data: Array<{
        id: string;
        name: string;
        email: string;
    }>;
}

export interface CreateOfficerData {
    name: string;
    email: string;
    password: string;
    role: "SENIOR_OFFICER" | "JUNIOR_OFFICER" | "USER";
    department: string;
    phone: string;
    location: string;
    depot?: string;
    seniorOfficerId?: string;
    juniorOfficerId?: string;
}

export const officerService = {
    /**
     * Get all officers under a branch officer
     */
    getBranchOfficers: async (page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get<OfficerResponse>(
            `/api/officer/branch?page=${page}&limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get all officers under a senior officer
     */
    getSeniorOfficers: async (page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get<OfficerResponse>(
            `/api/officer/senior?page=${page}&limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get all users under a junior officer
     */
    getJuniorOfficers: async (page: number = 1, limit: number = 10) => {
        const response = await axiosInstance.get<OfficerResponse>(
            `/api/officer/junior?page=${page}&limit=${limit}`
        );
        return response.data;
    },

    /**
     * Get available senior officers for a branch officer
     */
    getAvailableSeniorOfficers: async () => {
        const response = await axiosInstance.get<AvailableOfficersResponse>(
            "/api/officer/branch/available-seniors"
        );
        return response.data;
    },

    /**
     * Get available junior officers for a senior officer
     */
    getAvailableJuniorOfficers: async (seniorOfficerId?: string) => {
        let url = "/api/officer/senior/available-juniors";
        console.log("seniorOfficerId", seniorOfficerId);
        if (seniorOfficerId) {
            url = `/api/officer/senior/available-juniors?seniorOfficerId=${seniorOfficerId}`;
        }
        const response = await axiosInstance.get<AvailableOfficersResponse>(url);
        return response.data;
    },

    /**
     * Create a new officer or user
     */
    createOfficer: async (data: CreateOfficerData) => {
        const response = await axiosInstance.post("/api/officer", data);
        return response.data;
    },

    /**
     * Update an existing officer or user
     */
    updateOfficer: async (id: string, data: Partial<CreateOfficerData>) => {
        const response = await axiosInstance.patch(`/api/officer/${id}`, data);
        return response.data;
    },

    /**
     * Delete an officer or user
     */
    deleteOfficer: async (id: string) => {
        const response = await axiosInstance.delete(`/api/officer/${id}`);
        return response.data;
    },
};