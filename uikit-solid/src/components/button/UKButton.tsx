import { createSignal, type Component, type JSX } from "solid-js";
import type { ButtonSize } from "./lib/size.ts";
import clsx from "clsx";
import UKIcon from "../icon/UKIcon.tsx";
import type { ButtonShape } from "./lib/shape.ts";
import type { ButtonColor } from "./lib/color.ts";
import styles from "./UKButton.module.scss";

const UKButton: Component<{
    children: JSX.Element;
    class?: string;
    disabled?: boolean;
    size?: ButtonSize;
    color?: ButtonColor;
    shape?: ButtonShape;
    type?: "normal" | "toggle";
    onClick: (event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void;
    leadingIcon?: string;
    trailingIcon?: string;
}> = (props) => {
    const [isSelected, setIsSelected] = createSignal(false);

    if (props.color === "standard" && props.type === "toggle") {
        alert("You cannot have a standard color button be toggleable");
    }

    return (
        <button
            disabled={props.disabled || false}
            data-selected={isSelected()}
            data-toggleable={props.type === "toggle" || false}
            data-size={props.size || "s"}
            data-shape={isSelected() ? ((props.shape || "round") === "round" ? "square" : "round") : props.shape || "round"}
            data-color={props.color || "filled"}
            onClick={(e) => {
                e.stopPropagation();
                if (props.type === "toggle") {
                    setIsSelected(!isSelected());
                    props.onClick(e);
                } else {
                    props.onClick(e);
                }
            }}
            class={clsx(styles.root, props.class)}
            type="button"
        >
            {props.leadingIcon && <UKIcon class={styles.iconClass}>{props.leadingIcon}</UKIcon>}
            {props.children || "No Label Provided"}
            {props.trailingIcon && <UKIcon class={styles.iconClass}>{props.trailingIcon}</UKIcon>}
        </button>
    );
};

export default UKButton;
