export const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-");
    return new Date(+year, +month - 1, +day);
};

export const isDateAfterThursdayCutoff = (dateStr: string) => {
  const selectedDate = parseDate(dateStr);
  if (!selectedDate) return false;
  
  selectedDate.setHours(0, 0, 0, 0);
  const now = new Date();

  // Calculate the most recent Thursday at 16:00 (4 PM)
  const day = now.getDay();
  const diffToThursday = (day + 7 - 4) % 7;
  const thursdayThisWeek = new Date(now);
  thursdayThisWeek.setDate(now.getDate() - diffToThursday);
  thursdayThisWeek.setHours(16, 0, 0, 0);

  // Adjust to previous Thursday if it's not yet 16:00 today
  if (now < thursdayThisWeek) {
    thursdayThisWeek.setDate(thursdayThisWeek.getDate() - 7);
  }

  // Calculate the upcoming Sunday at 23:59:59
  const cycleEnd = new Date(thursdayThisWeek);
  cycleEnd.setDate(thursdayThisWeek.getDate() + (7 - thursdayThisWeek.getDay()) % 7);
  cycleEnd.setHours(23, 59, 59, 999);

  // Check if selected date is within the range
  return selectedDate >= thursdayThisWeek && selectedDate <= cycleEnd;
};

export function formatTimeToDatetime(date: string, time: string): string {
    if (!date || !time) return "";

    // If time is already in ISO format, return it as-is
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3}Z)?$/;
    if (isoRegex.test(time)) {
        return time;
    }

    // Normalize the date to YYYY-MM-DD format if it's not already
    let normalizedDate = date;
    if (date.includes("T")) {
        normalizedDate = new Date(date).toISOString().split("T")[0];
    }

    // Normalize the time to HH:MM format
    let normalizedTime = time;
    if (time.includes(":")) {
        const [hours, minutes] = time.split(":");
        normalizedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }

    // Combine them into ISO format
    return `${normalizedDate}T${normalizedTime}:00.000Z`;
}


export const formatDateToISO = (date: string): string => {
    if (!date) return "";
    if (date.includes("T")) return date;
    return `${date}T00:00:00.000Z`;
};

export const normalizeToDateOnly = (input: string): string => {
    if (!input) return "";

    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3}Z)?$/;
    const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (isoRegex.test(input)) {
        return new Date(input).toISOString().split("T")[0];
    }

    if (dateOnlyRegex.test(input)) {
        return input;
    }
    return "";
};


export const extractTimeFromDatetime = (datetime: string): string => {
    if (!datetime.includes("T")) return datetime;

    try {
        const date = new Date(datetime);
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        return `${hours}:${minutes}`;
    } catch {
        return datetime;
    }
};

type AnyObject = Record<string, any>;

export const filterRequestData = (data: AnyObject): AnyObject => {
    const keysToExclude = ["user", "manager"];

    const filter = (obj: AnyObject): AnyObject => {
        const result: AnyObject = {};
        for (const key in obj) {
            if (keysToExclude.includes(key)) continue;
            const value = obj[key];
            if (value === null) continue;
            if (Array.isArray(value)) {
                result[key] = value.map(item =>
                    typeof item === "object" && item !== null ? filter(item) : item
                );
            } else if (typeof value === "object" && value !== null) {
                result[key] = filter(value);
            } else {
                result[key] = value;
            }
        }
        return result;
    };

    return filter(data);
};
