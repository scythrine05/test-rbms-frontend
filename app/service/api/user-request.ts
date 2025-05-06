import axiosInstance from "@/app/utils/axiosInstance";
import { UserRequestInput } from "@/app/validation/user-request";
import { RequestItem } from "../query/user-request";

export interface UserRequestResponse {
    status: boolean;
    message: string;
    data: any; // You can type this more strictly if you want
}

// Response type for a single request
export interface SingleRequestResponse {
    status: boolean;
    message: string;
    data: RequestItem;
}

/**
 * Service for interacting with user request API endpoints
 */
export const userRequestService = {
    /**
     * Create a new user request
     * @param data - The user request input data
     * @returns Promise with the response
     */
    create: async (data: UserRequestInput): Promise<UserRequestResponse> => {
        const response = await axiosInstance.post<UserRequestResponse>("/api/user-request", data);
        return response.data;
    },

    /**
     * Get a user request by ID
     * @param id - The user request ID
     * @returns Promise with the response containing the request details
     */
    getById: async (id: string): Promise<SingleRequestResponse> => {
        const response = await axiosInstance.get<SingleRequestResponse>(`/api/user-request/${id}`);
        return response.data;
    },

    /**
     * Update an existing user request
     * @param id - The user request ID
     * @param data - The updated user request data
     * @returns Promise with the response
     */
    update: async (id: string, data: Partial<UserRequestInput>): Promise<UserRequestResponse> => {
        const response = await axiosInstance.put<UserRequestResponse>(`/api/user-request/${id}`, data);
        return response.data;
    },

    /**
     * Delete a user request
     * @param id - The user request ID to delete
     * @returns Promise with the response
     */
    delete: async (id: string): Promise<UserRequestResponse> => {
        const response = await axiosInstance.delete<UserRequestResponse>(`/api/user-request/${id}`);
        return response.data;
    }
};

