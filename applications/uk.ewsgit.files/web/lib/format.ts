const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log10(bytes) / 3), UNITS.length - 1);
  const value = bytes / 1000 ** exponent;

  return `${exponent === 0 || value >= 100 ? Math.round(value) : Number(value.toFixed(1))} ${UNITS[exponent]}`;
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function formatModified(timestamp: number, withTime = false): string {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  if (sameDay(date, now)) {
    return withTime ? `Today, ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false })}` : "Today";
  }

  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric", ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }) });
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
