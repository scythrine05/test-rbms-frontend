import axiosInstance from "@/app/utils/axiosInstance";

export const adminService = {
  acceptUserRequest: async (id: string, accept: boolean) => {
    const response = await axiosInstance.put(
      `/api/user-request/admin/accept/${id}?accept=${accept}`,
      { adminRequestStatus: accept ? "ACCEPTED" : "REJECTED" }
    );
    return response.data;
  },
  getApprovedRequests: async (
    startDate: string,
    endDate: string,
    page: number = 1
  ) => {
    const response = await axiosInstance.get(
      `/api/user-request/admin/approved?startDate=${startDate}&endDate=${endDate}&page=${page}`
    );
    return response.data;
  },
 getOptimizeRequests: async (
    startDate: string,
    endDate: string,
    page: number = 1
  ) => {
    const response = await axiosInstance.get(
      `/api/user-request/admin/optimized?startDate=${startDate}&endDate=${endDate}&page=${page}`
    );
    return response.data;
  },
  approveAllPendingRequests: async () => {
    const response = await axiosInstance.put(
      `/api/user-request/admin/approve-all-pending`
    );
    return response.data;
  },


  saveOptimizedRequests: async (optimizedData:any) => {
   const response = await axiosInstance.post(
  '/api/user-request/admin/save-optimized-requests', 
  { optimizedData }
);
    return response.data;
  },

saveOptimizedRequestsStatus: async (requestIds: string[]) => {
  const response = await axiosInstance.put(
    '/api/user-request/admin/save-optimized-requests-status', 
    { requestIds }
  );
  return response.data;
},


getUserRequests: async (page: number, dateRange?: { startDate: string; endDate: string }) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    if (dateRange) {
      queryParams.append('startDate', dateRange.startDate);
      queryParams.append('endDate', dateRange.endDate);
    }
    const response = await axiosInstance.get("/api/user-request/user-data", {
      params: Object.fromEntries(queryParams)
    });
    return response.data; // { requests: [], total, page, totalPages }
  } catch (error) {
    // Handle error appropriately (logging, transforming, etc.)
    console.error("Error fetching user requests:", error);
    throw error; // Re-throw to let the caller handle it
  }
}

};
