import {createSignal, onCleanup, onMount} from "solid-js";

export default function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint}px)`;
  const [ isMobile, setIsMobile ] = createSignal(window.matchMedia(query).matches);

  onMount(() => {
    const media = window.matchMedia(query);
    const listener = (e: {matches: boolean}) => setIsMobile(e.matches);
    media.addEventListener("change", listener);

    onCleanup(() => media.removeEventListener("change", listener));
  });

  return isMobile;
}
