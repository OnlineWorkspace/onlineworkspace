import { useContext } from "solid-js";
import { DialogueContext } from "./context";

export const useDialogue = () => {
    return useContext(DialogueContext);
};
