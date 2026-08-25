export {};

declare global {
  const INSTANCE: import("./index.ts").Instance;

  const consoleBackup: {
    log: typeof console.log
    info: typeof console.info
    warn: typeof console.warn
    error: typeof console.error
    debug: typeof console.debug
  }
}
