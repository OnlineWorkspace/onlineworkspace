const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const dayYearFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const shortMonthFormat = new Intl.DateTimeFormat(undefined, { month: "short" });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

/** "Today", "Yesterday", "Sat, Oct 3" or, for another year, "Sat, Oct 3, 2025". */
export function dayLabel(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return (date.getFullYear() === now.getFullYear() ? dayFormat : dayYearFormat).format(date);
}

/** Groups that sort and compare as one day, in the viewer's own time zone. */
export const dayKey = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const viewerDay = (timestamp: number, withYear: boolean) => (withYear ? dayYearFormat : dayFormat).format(new Date(timestamp));
export const clockTime = (timestamp: number) => timeFormat.format(new Date(timestamp));
export const shortMonth = (timestamp: number) => shortMonthFormat.format(new Date(timestamp));
export const shortDate = (timestamp: number) => dateFormat.format(new Date(timestamp));

/** A memory id ("2024-03") as "March 2024". */
export const memoryMonth = (id: string) => {
  const [year, month] = id.split("-").map(Number) as [number, number];
  return monthFormat.format(new Date(year, month - 1, 1));
};

/** How long ago a memory's month was: "Last month", "5 months ago", "Last year", "2 years ago". */
export function memoryAge(id: string, now = new Date()): string {
  const [year, month] = id.split("-").map(Number) as [number, number];
  const months = now.getFullYear() * 12 + now.getMonth() - (year * 12 + month - 1);

  if (months <= 1) return "Last month";
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(months / 12);
  return years === 1 ? "Last year" : `${years} years ago`;
}

export const pluralise = (count: number, noun: string) => `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}
