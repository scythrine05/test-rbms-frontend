import { format, addDays, subDays, startOfWeek, endOfWeek, Day } from "date-fns";

interface PeriodSwitcherProps {
  currentWeekStart: Date;
  onWeekChange: (direction: "prev" | "next") => void;
  isUrgentMode?: boolean;
  weekStartsOn?: Day;
}

export function WeeklySwitcher({
  currentWeekStart,
  onWeekChange,
  isUrgentMode = false,
  weekStartsOn = 1 as Day,
}: PeriodSwitcherProps) {
  const formatDateRange = () => {
    if (isUrgentMode) {
      return format(currentWeekStart, "dd-MM-yyyy");
    }
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn });
    return `${format(currentWeekStart, "dd-MM-yyyy")} to ${format(weekEnd, "dd-MM-yyyy")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onWeekChange("prev")}
        className="px-2 py-1 text-sm border border-black rounded bg-white hover:bg-gray-50"
      >
        Previous {isUrgentMode ? "Day" : "Week"}
      </button>
      <span className="text-sm font-medium">
        {isUrgentMode ? "Date: " : "Week: "}
        {formatDateRange()}
      </span>
      <button
        onClick={() => onWeekChange("next")}
        className="px-2 py-1 text-sm border border-black rounded bg-white hover:bg-gray-50"
      >
        Next {isUrgentMode ? "Day" : "Week"}
      </button>
    </div>
  );
} 