import axiosInstance from '@/app/utils/axiosInstance';

export const adminService = {
    acceptUserRequest: async (id: string, accept: boolean) => {
        const response = await axiosInstance.put(`/api/user-request/admin/accept/${id}?accept=${accept}`);
        return response.data;
    },

    getApprovedRequests: async (startDate: string, endDate: string, page: number = 1) => {
        const response = await axiosInstance.get(
            `/api/user-request/admin/approved?startDate=${startDate}&endDate=${endDate}&page=${page}`
        );
        return response.data;
    },
};
