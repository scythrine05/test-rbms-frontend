import { useMutation, useQueryClient } from "@tanstack/react-query";
import { officerService, CreateOfficerData } from "../api/officer";

/**
 * Hook for creating a new officer or user
 */
export const useCreateOfficer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateOfficerData) => officerService.createOfficer(data),
        onSuccess: (_, variables) => {
            // Invalidate relevant queries based on the role
            queryClient.invalidateQueries({ queryKey: ["branch-officers"] });
            queryClient.invalidateQueries({ queryKey: ["senior-officers"] });
            queryClient.invalidateQueries({ queryKey: ["junior-officers"] });
            queryClient.invalidateQueries({ queryKey: ["available-seniors"] });
            queryClient.invalidateQueries({ queryKey: ["available-juniors"] });

            // If specific senior or junior officer ID was used, invalidate those queries too
            if (variables.seniorOfficerId) {
                queryClient.invalidateQueries({
                    queryKey: ["available-juniors", variables.seniorOfficerId]
                });
            }
        },
    });
};

/**
 * Hook for updating an existing officer or user
 */
export const useUpdateOfficer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateOfficerData> }) =>
            officerService.updateOfficer(id, data),
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["branch-officers"] });
            queryClient.invalidateQueries({ queryKey: ["senior-officers"] });
            queryClient.invalidateQueries({ queryKey: ["junior-officers"] });
        },
    });
};

/**
 * Hook for deleting an officer or user
 */
export const useDeleteOfficer = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => officerService.deleteOfficer(id),
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["branch-officers"] });
            queryClient.invalidateQueries({ queryKey: ["senior-officers"] });
            queryClient.invalidateQueries({ queryKey: ["junior-officers"] });
            queryClient.invalidateQueries({ queryKey: ["available-seniors"] });
            queryClient.invalidateQueries({ queryKey: ["available-juniors"] });
        },
    });
};