import axiosInstance from "@/app/utils/axiosInstance";
import { UserRequest } from "./manager";
import { FlatRecord } from "@/app/lib/optimse";

export interface OptimizeResponse {
    len: number;
    req: number;
    optimizedData: UserRequest[];
}

export const optimiseService = {
    optimizeRequests: async (requestData: FlatRecord[]): Promise<OptimizeResponse> => {
        const response = await axiosInstance.post<OptimizeResponse>(
            "https://sr-optimization.vercel.app/backend/optimize",
            { requestData }
        );
        return response.data;
    },
};
