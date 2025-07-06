// Helper function to safely extract HH:mm from ISO string without timezone conversion
export default function formatTime(dateString: string): string {
  if (!dateString) return "Invalid time";

  try {
    // Handle both full ISO strings and time-only strings
    const timePart = dateString.includes("T")
      ? dateString.split("T")[1]
      : dateString;

    // Extract just the hours and minutes
    const [hours, minutes] = timePart.split(":");
    return `${hours.padStart(2, "0")}:${(minutes || "00")
      .padStart(2, "0")
      .substring(0, 2)}`;
  } catch {
    return "Invalid time";
  }
};