export default function backend(path: string): string {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `http://${window.location.hostname}:3563${path}`;
    }

    return `http://${window.location.hostname}:3563${path}`;
}
