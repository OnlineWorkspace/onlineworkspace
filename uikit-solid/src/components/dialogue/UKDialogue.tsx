import { useContext, type Accessor, type Component } from "solid-js";
import { Portal } from "solid-js/web";
import { RootContext } from "../../rootContext.ts";

const UKDialogue: Component<{ close?: () => void; show: Accessor<boolean> }> = (props) => {
    const rootContext = useContext(RootContext);

    return (
        <>
            <Portal mount={rootContext!.root.closest("[data-uikit-root]") || document.body}>
                <div>Dialogue</div>
            </Portal>
        </>
    );
};

export default UKDialogue;
