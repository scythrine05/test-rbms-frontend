import { useMutation } from "@tanstack/react-query";
import { userRequestService } from "../api/user-request";
import { UserRequestInput } from "@/app/validation/user-request";

/**
 * Hook for creating a new user request
 */
export function useCreateUserRequest() {
    return useMutation({
        mutationFn: (data: UserRequestInput) => userRequestService.create(data),
    });
}

/**
 * Hook for updating an existing user request
 * @param id - The ID of the request to update
 */
export function useUpdateUserRequest(id: string) {
    return useMutation({
        mutationFn: (data: Partial<UserRequestInput>) => userRequestService.update(id, data),
    });
}

/**
 * Hook for deleting a user request
 */
export function useDeleteUserRequest() {
    return useMutation({
        mutationFn: (id: string) => userRequestService.delete(id),
    });
}

/**
 * Hook for updating other request status
 */
export function useUpdateOtherRequest() {
    return useMutation({
        mutationFn: ({ id, accept, disconnectionRequestRejectRemarks }: { 
            id: string; 
            accept: boolean; 
            disconnectionRequestRejectRemarks?: string;
        }) =>
            userRequestService.updateOtherRequest(id, accept, disconnectionRequestRejectRemarks),
    });
}