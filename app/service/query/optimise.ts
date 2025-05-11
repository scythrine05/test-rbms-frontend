import { useMutation } from "@tanstack/react-query";
import { optimiseService } from "../api/optimise";
import { UserRequest } from "../api/manager";
import { FlatRecord } from "@/app/lib/optimse";

export const useOptimizeRequests = () => {
    return useMutation({
        mutationFn: (requestData: FlatRecord[]) => optimiseService.optimizeRequests(requestData),
    });
};
