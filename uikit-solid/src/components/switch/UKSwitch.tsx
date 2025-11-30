import clsx from "clsx";
import type { Component } from "solid-js";
import styles from "./UKSwitch.module.scss";
import UKIcon from "../icon/UKIcon";

const UKSwitch: Component<{ value: boolean; getValue: (value: boolean) => void; class?: string; icon?: boolean }> = (props) => {
    return (
        <button class={clsx(styles.root, props.class)} data-value={props.value} onClick={() => props.getValue(!props.value)}>
            <div data-icon={!!props.icon} class={styles.handle}>
                {props.icon && <UKIcon>check</UKIcon>}
            </div>
        </button>
    );
};

export default UKSwitch;
