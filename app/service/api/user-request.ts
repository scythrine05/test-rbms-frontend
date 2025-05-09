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

export interface RequestResponse {
    status: boolean;
    message: string;
    data: {
        requests: RequestItem[];
        total: number;
        page: number;
        totalPages: number;
    };
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
    },

    /**
     * Get other requests by depo
     * @param selectedDepo - The selected depo
     * @param page - Page number for pagination
     * @param limit - Number of items per page
     * @returns Promise with the response
     */
    getOtherRequests: async (selectedDepo: string, page: number = 1, limit: number = 10): Promise<RequestResponse> => {
        const response = await axiosInstance.get<RequestResponse>(`/api/user-request/other/${selectedDepo}?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * Update other request status
     * @param id - The request ID
     * @returns Promise with the response
     */
    updateOtherRequest: async (id: string, accept: boolean): Promise<UserRequestResponse> => {
        const response = await axiosInstance.put<UserRequestResponse>(`/api/user-request/other/${id}?accept=${accept}`);
        return response.data;
    }
};

