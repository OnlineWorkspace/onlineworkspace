import type { Component } from "solid-js";
import styles from "./UKStackItem.module.scss"

const UKStackLabel: Component<{ children: string }> = (props) => {
    return <div class={styles.component}>{props.children}</div>
}

export default UKStackLabel
