export default function backend(path: string): string {
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `https://localhost${path}`;
  }

  return `https://${window.location.hostname}${path}`;
}
