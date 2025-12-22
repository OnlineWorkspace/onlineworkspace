import type { Component, ParentProps } from "solid-js";
import styles from "./UKDialogue.module.scss";
import type { DialogueController } from "./context";

const UKDialogue: Component<ParentProps<{ dialogueController: DialogueController }>> = (props) => {
    return (
        <div
            class={styles.root}
            onClick={(e) => {
                e.stopPropagation();

                if (e.currentTarget === e.target) props.dialogueController.close();
            }}
        >
            {props.children}
        </div>
    );
};

export default UKDialogue;
