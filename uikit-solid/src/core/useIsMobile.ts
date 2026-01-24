import { createSignal, onMount, onCleanup } from "solid-js";

export default function useIsMobile(breakpoint = 768) {
    // Define the media query string
    const query = `(max-width: ${breakpoint}px)`;

    // Initialize signal with the current state
    const [isMobile, setIsMobile] = createSignal(window.matchMedia(query).matches);

    onMount(() => {
        const media = window.matchMedia(query);

        // Handler to update the signal when the window is resized
        const listener = (e: { matches: any }) => setIsMobile(e.matches);

        // Modern browsers use addEventListener, older ones use addListener
        media.addEventListener("change", listener);

        // Clean up the listener when the component is unmounted
        onCleanup(() => media.removeEventListener("change", listener));
    });

    return isMobile;
}
