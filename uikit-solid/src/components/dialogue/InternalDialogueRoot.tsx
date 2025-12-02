import { createSignal, type Component, type JSXElement, type ParentProps } from "solid-js";
import { DialogueContext } from "./context.ts";

const InternalDialogueRoot: Component<ParentProps> = (props) => {
    const [dialogue, setDialogue] = createSignal<JSXElement | null>(null);

    return (
        <DialogueContext.Provider
            value={{
                show: (dia) => {
                    setDialogue(dia);
                },
                close: () => {
                    setDialogue(null);
                },
            }}
        >
            {dialogue()}
            {props.children}
        </DialogueContext.Provider>
    );
};

export default InternalDialogueRoot;
