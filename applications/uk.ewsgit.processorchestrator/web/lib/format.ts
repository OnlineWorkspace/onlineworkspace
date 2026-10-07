export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;

  return `${seconds}s`;
}

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** the command line as it would be typed, for showing in the interface */
export function commandLine(executable: string, args: string[]): string {
  const quote = (part: string) => (/^[\w./:=@%+-]+$/.test(part) ? part : `'${part.replaceAll("'", "'\\''")}'`);

  return [executable, ...args].map(quote).join(" ");
}

export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));
