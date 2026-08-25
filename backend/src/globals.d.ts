declare global {
  const INSTANCE: import("./index.ts").Instance;

  const consoleBackup: {
    log: console.log
    info: console.info
    warn: console.warn
    error: console.error
    debug: console.debug
  }
}
