import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export function displayDate(value?: string, pattern = "EEE d MMM yyyy") {
  if (!value) return "Not set";
  const date = parseISO(value);
  return isValid(date) ? format(date, pattern) : "Not set";
}

export function lastContactLabel(days: number) {
  return days <= 0
    ? "Talked today"
    : days === 1
      ? "Talked yesterday"
      : `Talked ${days} days ago`;
}

export function dueLabel(value: string, now = new Date(), prefix = false) {
  const date = parseISO(value);
  if (!isValid(date)) return "Not set";
  const days = differenceInCalendarDays(date, now);
  const day =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : format(date, "EEE d MMM");
  const time = value.includes("T")
    ? `, ${format(date, date.getMinutes() ? "h:mm a" : "h a")}`
    : "";
  return `${prefix ? "By " : ""}${day}${time}`;
}

export function daysUntil(value: string, now = new Date()) {
  const days = differenceInCalendarDays(parseISO(value), now);
  return days === 0
    ? "Today"
    : days === 1
      ? "Tomorrow"
      : days < 0
        ? `${Math.abs(days)} ${days === -1 ? "day" : "days"} ago`
        : `in ${days} days`;
}
