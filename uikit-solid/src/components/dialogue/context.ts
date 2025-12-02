import { createContext, type JSXElement } from "solid-js";

export type DialogueType = { show: (_dialogue: JSXElement) => void; close: () => void };

export const DialogueContext = createContext<DialogueType>({} as DialogueType);
