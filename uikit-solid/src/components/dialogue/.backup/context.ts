import { createContext, type JSXElement } from "solid-js";

export type DialogueController = { show: (_dialogue: JSXElement) => void; close: () => void };

export const DialogueContext = createContext<DialogueController>({} as DialogueController);
