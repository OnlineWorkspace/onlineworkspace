import type trpc from "./trpc";

/** a process as the browser receives it, with dates as strings */
export type ProcessDto = Awaited<ReturnType<typeof trpc.list.query>>[number];
