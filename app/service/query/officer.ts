import { useQuery } from "@tanstack/react-query";
import { officerService } from "../api/officer";

/**
 * Hook for fetching all officers under a branch officer
 */
export const useBranchOfficers = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ["branch-officers", page, limit],
        queryFn: () => officerService.getBranchOfficers(page, limit),
    });
};

/**
 * Hook for fetching all officers under a senior officer
 */
export const useSeniorOfficers = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ["senior-officers", page, limit],
        queryFn: () => officerService.getSeniorOfficers(page, limit),
    });
};

/**
 * Hook for fetching all users under a junior officer
 */
export const useJuniorOfficers = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ["junior-officers", page, limit],
        queryFn: () => officerService.getJuniorOfficers(page, limit),
    });
};

/**
 * Hook for fetching available senior officers for a branch officer
 */
export const useAvailableSeniorOfficers = () => {
    return useQuery({
        queryKey: ["available-seniors"],
        queryFn: () => officerService.getAvailableSeniorOfficers(),
    });
};

/**
 * Hook for fetching available junior officers for a senior officer
 */
export const useAvailableJuniorOfficers = (seniorOfficerId?: string) => {
    return useQuery({
        queryKey: ["available-juniors", seniorOfficerId],
        queryFn: () => officerService.getAvailableJuniorOfficers(seniorOfficerId),
        enabled: seniorOfficerId !== undefined || seniorOfficerId === null,
    });
};