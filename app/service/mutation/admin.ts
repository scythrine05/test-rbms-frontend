import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../api/admin";

export const useAcceptUserRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, accept,remark }: { id: string; accept: boolean,remark?:string }) =>
            adminService.acceptUserRequest(id, accept,remark),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requests"] });
        },
    });
};

export const useApproveAllPendingRequests = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => adminService.approveAllPendingRequests(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};