import { useQuery } from "@tanstack/react-query";

import { drmService } from "../api/drm";

// Import the shared interfaces from the API service
import { GenerateReportParams, GenerateReportResponse } from "../api/drm";

// No need to redefine GenerateReportParams here as we're importing it

export const useGenerateReport = (params: GenerateReportParams) => {
    return useQuery({
        queryKey: ["generate-report", params],
        queryFn: () => drmService.generateReport(params),
        enabled: !!params.startDate && !!params.endDate,
    });
};
