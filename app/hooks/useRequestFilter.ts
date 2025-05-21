import { useUrgentMode } from "../context/UrgentModeContext";

export function useRequestFilter<T extends { corridorType: string }>(requests: T[]) {
  const { isUrgentMode } = useUrgentMode();

  const filteredRequests = requests.filter((request) => {
    if (isUrgentMode) {
      // In urgent mode, only show urgent requests
      return request.corridorType === "Urgent Block";
    } else {
      // In normal mode, show all requests except urgent ones
      return request.corridorType !== "Urgent Block";
    }
  });

  return filteredRequests;
} 