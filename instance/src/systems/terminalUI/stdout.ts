export function cursorTo(x: number, y?: number) {
  return new Promise<void>((resolve) => process.stdout.cursorTo(x, y, () => resolve()));
}

export function write(text: string) {
  return new Promise<void>((resolve) => process.stdout.write(text, () => resolve()));
}

export function clearScreenDown() {
  return new Promise<void>((resolve) => process.stdout.clearScreenDown(() => resolve()));
}
