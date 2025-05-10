import { useMutation, useQueryClient } from "@tanstack/react-query";
import { managerService, CreateUserInput } from "../api/manager";

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserInput) => managerService.createUser(data),
        onSuccess: () => {
            // Invalidate users query to refetch the list
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

export function useCreateManager() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserInput) => managerService.createUserManager(data),
        onSuccess: () => {
            // Invalidate users query to refetch the list
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => managerService.deleteUser(id),
        onSuccess: () => {
            // Invalidate users query to refetch the list
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}

