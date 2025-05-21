import axiosInstance from '@/app/utils/axiosInstance';

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
    page: number = 1,
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


getUserRequests: async (page: number, limit: number,startDate: string,
    endDate: string,) => {
  try {
    const response = await axiosInstance.get("/api/user-request/user-data", {
      params: { page, limit,startDate,endDate },
    });
    return response.data; 
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error; 
  }
},

updateRequestStatus: async (requestId: string, status: 'yes' | 'no',reason:string) => {
  try {
    const response = await axiosInstance.post("/api/user-request/updatedStatus", {
      requestId,  
      status,
      reason
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating user status:", error);
    throw new Error(error.response?.data?.message || "Failed to update status");
  }
},


updateUserResponse: async (requestId: string, userResponse:string,reason:string) => {
  try {
    const response = await axiosInstance.post("/api/user-request/userResponse", {
      requestId,  
      userResponse,
      reason
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating user status:", error);
    throw new Error(error.response?.data?.message || "Failed to update status");
  }
},


// In your adminService
updateOptimizeTimes: async (data: {
  requestId: string;
  optimizeTimeFrom: string;
  optimizeTimeTo: string;
}) => {
  try {
    // Validate the datetime strings
    const fromDate = new Date(data.optimizeTimeFrom);
    const toDate = new Date(data.optimizeTimeTo);
    
    if (isNaN(fromDate.getTime())) throw new Error("Invalid optimizeTimeFrom");
    if (isNaN(toDate.getTime())) throw new Error("Invalid optimizeTimeTo");

    const response = await axiosInstance.post("/api/user-request/updateOptimizeTimes", {
      requestId: data.requestId,
      optimizeTimeFrom: fromDate.toISOString(),
      optimizeTimeTo: toDate.toISOString()
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating optimize times:", error);
    throw new Error(error.response?.data?.message || "Failed to update optimize times");
  }
},


};
