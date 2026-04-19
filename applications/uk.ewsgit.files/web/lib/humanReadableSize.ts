export default function humanReadableSize(sizeBytes: number) {
  const i = sizeBytes === 0 ? 0 : Math.floor(Math.log(sizeBytes) / Math.log(1024));
  return `${+(sizeBytes / 1024 ** i).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
}
