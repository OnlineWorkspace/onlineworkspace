import { createMediaQuery } from "@solid-primitives/media";
import { type Accessor, createSignal, onCleanup } from "solid-js";

export type ColorModePreference = "auto" | "light" | "dark";

const STORAGE_KEY = "onlineworkspace_color_mode";
const CHANGE_EVENT = "onlineworkspace:color-mode-change";

export function getColorModePreference(): ColorModePreference {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "auto";
  } catch {
    return "auto";
  }
}

export function setColorModePreference(preference: ColorModePreference) {
  try {
    if (preference === "auto") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // storage can be unavailable (private windows); the in-page event below still applies it for this visit
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** the stored preference (reactive, also follows changes made in other tabs) and the light/dark mode it resolves to */
export function useColorMode(): { preference: Accessor<ColorModePreference>; isLight: Accessor<boolean>; systemIsLight: Accessor<boolean> } {
  const systemIsLight = createMediaQuery("(prefers-color-scheme: light)");
  const [preference, setPreference] = createSignal(getColorModePreference());
  const sync = () => setPreference(getColorModePreference());

  window.addEventListener(CHANGE_EVENT, sync);
  window.addEventListener("storage", sync);
  onCleanup(() => {
    window.removeEventListener(CHANGE_EVENT, sync);
    window.removeEventListener("storage", sync);
  });

  return {
    preference,
    systemIsLight,
    isLight: () => (preference() === "auto" ? systemIsLight() : preference() === "light"),
  };
}
