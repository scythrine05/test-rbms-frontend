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

export interface UserRequest {
    optimizeData: any;
    availedResponse: string;
    reasonFroReject: string;
    userStatus: string;
    optimizeStatus: boolean;
    userResponse: string;
    isSanctioned: boolean;
    adminRequestStatus: string;
    selectedStream: any;
    id: string;
    date: string;
    selectedDepartment: string;
    selectedSection: string;
    stationID: string | null;
    missionBlock: string;
    workType: string;
    activity: string;
    freshCautionRequired: boolean;
    freshCautionSpeed: number | null;
    freshCautionLocationFrom: string | null;
    freshCautionLocationTo: string | null;
    adjacentLinesAffected: string;
    workLocationFrom: string;
    workLocationTo: string;
    demandTimeFrom: string;
    demandTimeTo: string;
    selectedLine: string | null;
    optimisedTimeFrom?: string;
    optimisedTimeTo?: string;
    optimizeTimeFrom?:string;
    optimizeTimeTo?:string,
    sigDisconnection: boolean;
    elementarySection: string;
    elementarySectionTo: string | null;
    sigElementarySectionFrom: string | null;
    sigElementarySectionTo: string | null;
    repercussions: string;
    trdWorkLocation: string;
    requestremarks: string;
    createdAt: string;
    status: string;
    selectedDepo: string;
    sigResponse: string;
    ohDisconnection: boolean | null;
    oheDisconnection: boolean | null;
    oheResponse: string;
    corridorType: string;
    corridorTypeSelection: string | null;
    sigActionsNeeded: boolean;
    trdActionsNeeded: boolean;
    ManagerResponse: string | null;
    sigDisconnectionRequirements: string | null;
    sntDisconnectionRequirements: string[] | null;
    sntDisconnectionLine: string | null;
    sntDisconnectionLineFrom: string | null;
    sntDisconnectionLineTo: string | null;
    trdDisconnectionRequirements: string | null;
    powerBlockRequirements: string[] | null;
    powerBlockRequired: boolean;
    sntDisconnectionRequired: boolean | undefined;
    processedLineSections: Array<{
        road: string;
        type: string;
        block: string;
        stream: string;
        lineName: string;
        otherLines: string;
        otherRoads: string;
    }>;
    routeFrom: string | null;
    routeTo: string | null;
    DisconnAcceptance: string;
    userId: string;
    managerAcceptanceId: string;
    managerAcceptance: boolean;
    adminAcceptanceId: string;
    adminAcceptance: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        depot: string;
        department: string;
    };
}

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
    // getUserRequests: async (page: number = 1, limit: number = 10): Promise<UserRequestsResponse> => {
    //     const response = await axiosInstance.get<UserRequestsResponse>(`/api/user-request/manager/users-requests?page=${page}&limit=${limit}`);
    //     return response.data;
    // },
getUserRequestsByWeek: async (
  page: number = 1, 
  limit: number = 10,
  startDate: string,
  endDate: string,
  status?: string
): Promise<UserRequestsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    startDate,
    endDate
  });
  
  if (status) {
    params.append('status', status);
  }

  const response = await axiosInstance.get<UserRequestsResponse>(
    `/api/user-request/manager/users-requests?${params.toString()}`
  );
  return response.data;
},
    getUserRequestsByAdmin: async (page: number = 1, limit: number = 10): Promise<UserRequestsResponse> => {
        const response = await axiosInstance.get<UserRequestsResponse>(`/api/user-request/admin/users-requests?page=${page}&limit=${limit}`);
        return response.data;
    },

    /**
     * Accept a user request
     */
    
// Fixed version
acceptUserRequest: async (id: string, isAccept: boolean, remark?: string): Promise<{ status: boolean; message: string }> => {
    const response = await axiosInstance.put(`/api/user-request/manager/accept/${id}`, { isAccept, remark });
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