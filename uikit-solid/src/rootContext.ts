import { createContext } from "solid-js";

export const RootContext = createContext<{
    root: HTMLDivElement;
}>();
