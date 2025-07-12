import { useQuery } from "@tanstack/react-query";
import { UserGenerateReportParams, userGenerateService } from "../api/user-generate-report";


// Import the shared interfaces from the API service

// No need to redefine GenerateReportParams here as we're importing it

export const useUserGenerateReport = (params: UserGenerateReportParams) => {
    return useQuery({
        queryKey: ["generate-report", params],
        queryFn: () => userGenerateService.generateReport(params),
        enabled: !!params.startDate && !!params.endDate && params.majorSections.length > 0 && !!params.userId ,
    });
};
